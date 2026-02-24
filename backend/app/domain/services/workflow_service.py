"""Service layer for Workflow business logic -- the core workflow engine."""

import json
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.events.client_events import GroupSetupStarted, OfflineSetupChosen
from app.domain.events.event_bus import event_bus
from app.domain.events.workflow_events import (
    WorkflowStepCompleted,
    WorkflowStepSaved,
    WorkflowStepSkipped,
)
from app.domain.models.workflow import WorkflowInstance
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

        step = await self.repo.get_step_instance(instance.id, step_id)
        if not step:
            raise ValueError(f"Step {step_id} not found")

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
    ) -> dict:
        """Mark a step as completed and advance to the next pending step.

        If all steps are completed the workflow itself is marked as COMPLETED.
        Publishes a ``WorkflowStepCompleted`` domain event.

        Raises ``ValueError`` if the workflow or step does not exist.
        """
        instance = await self.repo.get_instance_by_client(client_id)
        if not instance:
            raise ValueError("No workflow found for this client")

        step = await self.repo.get_step_instance(instance.id, step_id)
        if not step:
            raise ValueError(f"Step {step_id} not found")

        now = datetime.now(timezone.utc)
        await self.repo.update_step_instance(
            step.id, status="COMPLETED", completed_at=now
        )

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
