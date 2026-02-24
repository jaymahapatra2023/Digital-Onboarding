"""Service layer for Workflow business logic -- the core workflow engine."""

import json
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.events.client_events import GroupSetupStarted, OfflineSetupChosen
from app.domain.events.event_bus import event_bus
from sqlalchemy import select

from app.domain.events.workflow_events import (
    WorkflowHandoffRequested,
    WorkflowStepCompleted,
    WorkflowStepSaved,
    WorkflowStepSkipped,
    WorkflowSubmitted,
)
from app.domain.models.workflow import WorkflowInstance
from app.infrastructure.database.models.access_orm import ClientAccessORM
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.repositories.client_repo import ClientRepository
from app.infrastructure.repositories.workflow_repo import WorkflowRepository


class WorkflowService:
    """Encapsulates all business operations on the Workflow aggregate.

    Manages workflow lifecycle: creation, step progression, data persistence,
    and completion tracking.
    """

    def __init__(self, session: AsyncSession) -> None:
        self.repo = WorkflowRepository(session)
        self.client_repo = ClientRepository(session)
        self.session = session

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    async def get_workflow(self, client_id: UUID) -> WorkflowInstance | None:
        """Get the workflow instance for a client, including all step instances.

        Enriches each step instance with ``allowed_roles`` from the workflow
        definition so the frontend can enforce role-based step access.
        """
        instance = await self.repo.get_instance_by_client(client_id)
        if not instance:
            return None

        workflow = WorkflowInstance.model_validate(instance)

        # Enrich with allowed_roles from the definition
        definition = await self.repo.get_definition("group_setup")
        if definition:
            steps_def = (
                definition.steps
                if isinstance(definition.steps, list)
                else json.loads(definition.steps)
            )
            roles_map = {
                s["step_id"]: s.get("allowed_roles", []) for s in steps_def
            }
            for step in workflow.step_instances:
                step.allowed_roles = roles_map.get(step.step_id, [])

        return workflow

    async def get_step_data(self, client_id: UUID, step_id: str) -> dict:
        """Get saved data for a specific step.

        Raises ``ValueError`` if the workflow or step does not exist.
        """
        instance = await self.repo.get_instance_by_client(client_id)
        if not instance:
            raise ValueError("No workflow found for this client")

        step = await self.repo.get_step_instance(instance.id, step_id)
        if not step:
            raise ValueError(f"Step {step_id} not found")

        return {
            "step_id": step.step_id,
            "status": step.status,
            "data": step.data or {},
        }

    # ------------------------------------------------------------------
    # Workflow creation
    # ------------------------------------------------------------------

    async def start_online_setup(
        self, client_id: UUID, user_id: UUID | None = None
    ) -> WorkflowInstance:
        """Start online group setup for a client.

        Creates a workflow instance and all corresponding step instances based
        on the active workflow definition.  Publishes a ``GroupSetupStarted``
        domain event.

        Raises ``ValueError`` if a workflow already exists for this client or
        no active workflow definition is found.
        """
        existing = await self.repo.get_instance_by_client(client_id)
        if existing:
            raise ValueError("Workflow already exists for this client")

        definition = await self.repo.get_definition("group_setup")
        if not definition:
            raise ValueError("No active workflow definition found")

        # Create workflow instance
        instance = await self.repo.create_instance(client_id, definition.id)
        instance.status = "IN_PROGRESS"
        instance.started_at = datetime.now(timezone.utc)

        # Parse step definitions and create step instances
        steps = (
            definition.steps
            if isinstance(definition.steps, list)
            else json.loads(definition.steps)
        )
        first_step_id = None
        for step_def in steps:
            step_id = step_def["step_id"]
            if first_step_id is None:
                first_step_id = step_id
            await self.repo.create_step_instance(
                workflow_instance_id=instance.id,
                step_id=step_id,
                step_order=step_def["order"],
                assigned_role=(
                    step_def.get("allowed_roles", [None])[0]
                    if step_def.get("allowed_roles")
                    else None
                ),
            )

        instance.current_step_id = first_step_id

        # Update client status to reflect that the application is underway
        await self.client_repo.update_status(client_id, "APPLICATION_IN_PROGRESS")

        await self.session.flush()

        # Publish event
        await event_bus.publish(
            GroupSetupStarted(
                client_id=client_id,
                user_id=user_id,
                workflow_instance_id=instance.id,
            )
        )

        # Re-fetch with step instances loaded
        result = await self.repo.get_instance_by_client(client_id)
        return WorkflowInstance.model_validate(result)

    async def start_offline_setup(
        self, client_id: UUID, user_id: UUID | None = None
    ) -> WorkflowInstance:
        """Start offline group setup for a client.

        Creates a workflow instance marked as offline.  Publishes an
        ``OfflineSetupChosen`` domain event.

        Raises ``ValueError`` if a workflow already exists for this client or
        no active workflow definition is found.
        """
        existing = await self.repo.get_instance_by_client(client_id)
        if existing:
            raise ValueError("Workflow already exists for this client")

        definition = await self.repo.get_definition("group_setup")
        if not definition:
            raise ValueError("No active workflow definition found")

        instance = await self.repo.create_instance(client_id, definition.id)
        instance.status = "OFFLINE"
        instance.is_offline = True
        instance.started_at = datetime.now(timezone.utc)

        # Update client status to reflect that the application is underway
        await self.client_repo.update_status(client_id, "APPLICATION_IN_PROGRESS")

        await self.session.flush()

        await event_bus.publish(
            OfflineSetupChosen(
                client_id=client_id,
                user_id=user_id,
                workflow_instance_id=instance.id,
            )
        )

        result = await self.repo.get_instance_by_client(client_id)
        return WorkflowInstance.model_validate(result)

    # ------------------------------------------------------------------
    # Step operations
    # ------------------------------------------------------------------

    async def save_step_data(
        self,
        client_id: UUID,
        step_id: str,
        data: dict,
        user_id: UUID | None = None,
    ) -> dict:
        """Save form data for a workflow step.

        Automatically transitions a PENDING step to IN_PROGRESS on the first
        save.  Publishes a ``WorkflowStepSaved`` domain event.

        Raises ``ValueError`` if the workflow or step does not exist.
        """
        instance = await self.repo.get_instance_by_client(client_id)
        if not instance:
            raise ValueError("No workflow found for this client")

        # Workflow-level immutability guard
        if instance.status == "COMPLETED":
            raise ValueError(
                "This workflow has been submitted and is now locked. "
                "No further changes are permitted."
            )

        step = await self.repo.get_step_instance(instance.id, step_id)
        if not step:
            raise ValueError(f"Step {step_id} not found")

        # Immutability guard: prevent modification of completed authorization step
        if step_id == "authorization" and step.status == "COMPLETED":
            raise ValueError(
                "Authorization step has been completed and is now locked. "
                "Data cannot be modified after final signature."
            )

        now = datetime.now(timezone.utc)
        await self.repo.update_step_instance(step.id, data=data, last_saved_at=now)

        # Auto-advance from PENDING to IN_PROGRESS on first interaction
        if step.status == "PENDING":
            await self.repo.update_step_instance(
                step.id, status="IN_PROGRESS", started_at=now
            )
            instance.current_step_id = step_id
            await self.session.flush()

        await event_bus.publish(
            WorkflowStepSaved(
                client_id=client_id,
                user_id=user_id,
                workflow_instance_id=instance.id,
                step_id=step_id,
            )
        )

        return {"step_id": step_id, "status": "IN_PROGRESS", "data": data}

    async def complete_step(
        self,
        client_id: UUID,
        step_id: str,
        user_id: UUID | None = None,
        request_ip: str | None = None,
        request_user_agent: str | None = None,
    ) -> dict:
        """Mark a step as completed and advance to the next pending step.

        If all steps are completed the workflow itself is marked as COMPLETED.
        Publishes a ``WorkflowStepCompleted`` domain event.

        Raises ``ValueError`` if the workflow or step does not exist.
        """
        instance = await self.repo.get_instance_by_client(client_id)
        if not instance:
            raise ValueError("No workflow found for this client")

        # Workflow-level immutability guard
        if instance.status == "COMPLETED":
            raise ValueError("This workflow has been submitted. Steps cannot be modified.")

        step = await self.repo.get_step_instance(instance.id, step_id)
        if not step:
            raise ValueError(f"Step {step_id} not found")

        now = datetime.now(timezone.utc)
        await self.repo.update_step_instance(
            step.id, status="COMPLETED", completed_at=now
        )

        # Stamp server-side signer metadata on authorization step completion
        if step_id == "authorization" and step.data:
            data = step.data if isinstance(step.data, dict) else {}
            final_sig = data.get("final_signature", {})
            final_sig["server_timestamp"] = now.isoformat()
            final_sig["signer_ip"] = request_ip
            final_sig["server_user_agent"] = request_user_agent
            data["final_signature"] = final_sig
            await self.repo.update_step_instance(step.id, data=data)

        # Determine the next step and whether all steps are done
        refreshed = await self.repo.get_instance_by_client(client_id)
        steps_sorted = sorted(refreshed.step_instances, key=lambda s: s.step_order)

        next_step = None
        all_completed = True
        for s in steps_sorted:
            if s.step_id == step_id:
                continue
            if s.status not in ("COMPLETED", "SKIPPED", "NOT_APPLICABLE"):
                all_completed = False
                if next_step is None and s.step_order > step.step_order:
                    next_step = s

        if next_step:
            instance.current_step_id = next_step.step_id

        if all_completed:
            instance.status = "COMPLETED"
            instance.completed_at = now

        await self.session.flush()

        await event_bus.publish(
            WorkflowStepCompleted(
                client_id=client_id,
                user_id=user_id,
                workflow_instance_id=instance.id,
                step_id=step_id,
            )
        )

        return {
            "step_id": step_id,
            "status": "COMPLETED",
            "next_step_id": next_step.step_id if next_step else None,
        }

    async def skip_step(
        self,
        client_id: UUID,
        step_id: str,
        user_id: UUID | None = None,
    ) -> dict:
        """Skip a workflow step.

        Publishes a ``WorkflowStepSkipped`` domain event.

        Raises ``ValueError`` if the workflow or step does not exist.
        """
        instance = await self.repo.get_instance_by_client(client_id)
        if not instance:
            raise ValueError("No workflow found for this client")

        # Workflow-level immutability guard
        if instance.status == "COMPLETED":
            raise ValueError("This workflow has been submitted. Steps cannot be skipped.")

        step = await self.repo.get_step_instance(instance.id, step_id)
        if not step:
            raise ValueError(f"Step {step_id} not found")

        await self.repo.update_step_instance(step.id, status="SKIPPED")

        await event_bus.publish(
            WorkflowStepSkipped(
                client_id=client_id,
                user_id=user_id,
                workflow_instance_id=instance.id,
                step_id=step_id,
            )
        )

        return {"step_id": step_id, "status": "SKIPPED"}

    # ------------------------------------------------------------------
    # Employer handoff
    # ------------------------------------------------------------------

    async def request_employer_handoff(
        self,
        client_id: UUID,
        user_id: UUID | None = None,
        broker_name: str = "",
    ) -> dict:
        """Hand off the workflow to the employer for their role-restricted steps.

        Sets the workflow status to PENDING_EMPLOYER, looks up the employer
        associated with the client, and publishes a ``WorkflowHandoffRequested``
        domain event so that notification handlers can send an email.

        Raises ``ValueError`` if the workflow is not in a valid state for handoff
        or no employer is found.
        """
        instance = await self.repo.get_instance_by_client(client_id)
        if not instance:
            raise ValueError("No workflow found for this client")

        if instance.status not in ("IN_PROGRESS", "PENDING_EMPLOYER"):
            raise ValueError("Workflow is not in a valid state for handoff")

        # Find the next pending employer-only step
        definition = await self.repo.get_definition("group_setup")
        if not definition:
            raise ValueError("No active workflow definition found")

        steps_def = (
            definition.steps
            if isinstance(definition.steps, list)
            else json.loads(definition.steps)
        )
        roles_map = {
            s["step_id"]: s.get("allowed_roles", []) for s in steps_def
        }
        names_map = {s["step_id"]: s.get("name", s["step_id"]) for s in steps_def}

        steps_sorted = sorted(instance.step_instances, key=lambda s: s.step_order)
        next_employer_step = None
        for s in steps_sorted:
            if s.status in ("COMPLETED", "SKIPPED", "NOT_APPLICABLE"):
                continue
            allowed = roles_map.get(s.step_id, [])
            if "EMPLOYER" in allowed:
                next_employer_step = s
                break

        if not next_employer_step:
            raise ValueError("No pending employer step found")

        next_step_name = names_map.get(next_employer_step.step_id, next_employer_step.step_id)

        # Look up employer: first try ClientAccessORM, then fall back to UserORM
        result = await self.session.execute(
            select(ClientAccessORM).where(
                ClientAccessORM.client_id == client_id,
                ClientAccessORM.role_type == "EMPLOYER",
            )
        )
        access = result.scalars().first()

        if access:
            employer_email = access.email
            employer_name = f"{access.first_name} {access.last_name}"
        else:
            # Fallback: find any user with EMPLOYER role
            user_result = await self.session.execute(
                select(UserORM).where(UserORM.role == "EMPLOYER")
            )
            employer_user = user_result.scalars().first()
            if not employer_user:
                raise ValueError("No employer user found for this client")
            employer_email = employer_user.email
            employer_name = f"{employer_user.first_name} {employer_user.last_name}"

        # Get client name
        client = await self.client_repo.get_by_id(client_id)
        client_name = client.client_name if client else "Unknown"

        # Update workflow status
        instance.status = "PENDING_EMPLOYER"
        await self.session.flush()

        # Publish domain event
        await event_bus.publish(
            WorkflowHandoffRequested(
                client_id=client_id,
                user_id=user_id,
                workflow_instance_id=instance.id,
                target_role="EMPLOYER",
                target_email=employer_email,
                target_name=employer_name,
                client_name=client_name,
                next_step_name=next_step_name,
                broker_name=broker_name,
            )
        )

        return {
            "status": "PENDING_EMPLOYER",
            "employer_email": employer_email,
            "employer_name": employer_name,
            "next_step_name": next_step_name,
        }

    # ------------------------------------------------------------------
    # Submission (downstream output)
    # ------------------------------------------------------------------

    def _build_servicing_payload(
        self, instance, steps_sorted: list
    ) -> dict:
        """Assemble the downstream servicing payload from all completed step data."""
        step_data: dict[str, dict] = {}
        for s in steps_sorted:
            if s.data:
                step_data[s.step_id] = (
                    s.data if isinstance(s.data, dict) else {}
                )

        renewal_data = step_data.get("renewal_period", {})
        billing_data = step_data.get("billing_setup", {})

        # Normalize billing into a structured top-level key
        billing_output = None
        if billing_data:
            billing_output = {
                "billing_model": billing_data.get("billing_model"),
                "billing_frequency": billing_data.get("billing_frequency"),
                "responsible_entity": billing_data.get("responsible_entity"),
                "self_admin_config": billing_data.get("self_admin_config"),
                "receive_billing_by_mail": billing_data.get("billing", {}).get(
                    "receive_billing_by_mail"
                ),
                "initial_premium": {
                    "requested": billing_data.get("billing", {}).get(
                        "wants_initial_premium"
                    )
                    == "yes",
                    "amount": billing_data.get("billing", {}).get(
                        "initial_premium_amount"
                    ),
                    "channel": billing_data.get("billing", {}).get(
                        "payment_channel"
                    ),
                    "payment_confirmed": billing_data.get(
                        "payment_confirmed", False
                    ),
                    "confirmation": billing_data.get("confirmation"),
                },
            }

        # Normalize authorization into a structured top-level key
        authorization_data = step_data.get("authorization", {})
        authorization_output = None
        if authorization_data:
            final_sig = authorization_data.get("final_signature", {})
            authorization_output = {
                "accepted_by": final_sig.get("accepted_by"),
                "signature_date": final_sig.get("signature_date"),
                "server_timestamp": final_sig.get("server_timestamp"),
                "client_timestamp": final_sig.get("client_timestamp"),
                "signer_ip": final_sig.get("signer_ip"),
                "signer_user_agent": final_sig.get("signer_user_agent"),
                "sections_completed": {
                    "online_access": bool(authorization_data.get("online_access")),
                    "privacy_notice": authorization_data.get("privacy_notice", {}).get("privacy_notice_acknowledged", False),
                    "intermediary": authorization_data.get("intermediary", {}).get("intermediary_notice_received", False),
                    "third_party_billing": authorization_data.get("third_party_billing", {}).get("agreement_reviewed", False),
                    "gross_up": authorization_data.get("gross_up", {}).get("gross_up_acknowledged", False),
                    "hipaa": authorization_data.get("hipaa", {}).get("hipaa_terms_accepted", False),
                    "disability_tax": bool(authorization_data.get("disability_tax")),
                    "cert_beneficial": authorization_data.get("cert_beneficial", {}).get("portability_agreement_acknowledged", False),
                    "no_claims": authorization_data.get("no_claims", {}).get("customer_esign", False),
                },
                "hipaa_document_ids": authorization_data.get("hipaa", {}).get("hipaa_document_ids", []),
            }

        return {
            "client_id": str(instance.client_id),
            "workflow_instance_id": str(instance.id),
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "renewal_notification_period": renewal_data.get(
                "renewal_notification_period"
            ),
            "billing": billing_output,
            "authorization": authorization_output,
            "steps": step_data,
        }

    async def submit_workflow(
        self,
        client_id: UUID,
        user_id: UUID | None = None,
    ) -> dict:
        """Submit the completed workflow and produce the downstream payload.

        Validates that all required steps are completed, marks the
        workflow as COMPLETED if not already, and publishes a
        ``WorkflowSubmitted`` event carrying the servicing payload.

        Raises ``ValueError`` if the workflow does not exist or has
        incomplete required steps.
        """
        instance = await self.repo.get_instance_by_client(client_id)
        if not instance:
            raise ValueError("No workflow found for this client")

        steps_sorted = sorted(
            instance.step_instances, key=lambda s: s.step_order
        )

        # Validate all required steps are completed
        definition = await self.repo.get_definition("group_setup")
        required_step_ids: set[str] = set()
        if definition:
            steps_def = (
                definition.steps
                if isinstance(definition.steps, list)
                else json.loads(definition.steps)
            )
            required_step_ids = {
                s["step_id"]
                for s in steps_def
                if s.get("required", True)
            }

        incomplete = [
            s.step_id
            for s in steps_sorted
            if s.step_id in required_step_ids
            and s.status not in ("COMPLETED", "SKIPPED", "NOT_APPLICABLE")
        ]
        if incomplete:
            raise ValueError(
                f"Cannot submit: incomplete required steps: {', '.join(incomplete)}"
            )

        # Mark workflow COMPLETED if not already
        now = datetime.now(timezone.utc)
        if instance.status != "COMPLETED":
            instance.status = "COMPLETED"
            instance.completed_at = now
            await self.session.flush()

        # Update client status
        await self.client_repo.update_status(client_id, "SUBMITTED")

        payload = self._build_servicing_payload(instance, steps_sorted)

        await event_bus.publish(
            WorkflowSubmitted(
                client_id=client_id,
                user_id=user_id,
                workflow_instance_id=instance.id,
                servicing_payload=payload,
            )
        )

        return payload

    async def get_submission_payload(self, client_id: UUID) -> dict:
        """Return the assembled downstream payload for an already-completed workflow.

        Raises ``ValueError`` if the workflow does not exist or is not
        yet completed.
        """
        instance = await self.repo.get_instance_by_client(client_id)
        if not instance:
            raise ValueError("No workflow found for this client")

        if instance.status != "COMPLETED":
            raise ValueError("Workflow has not been completed yet")

        steps_sorted = sorted(
            instance.step_instances, key=lambda s: s.step_order
        )

        return self._build_servicing_payload(instance, steps_sorted)
