"""Service layer for Client business logic."""

import json
import math
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.events.client_events import CaseMarkedSold, CaseOwnerAssigned
from app.domain.events.event_bus import event_bus
from app.domain.models.client import (
    CaseReadiness,
    Client,
    ClientListParams,
    ClientListResponse,
    ClientWithMetrics,
    ReadinessBlocker,
    TimelineEvent,
    TimelineResponse,
)
from app.infrastructure.repositories.access_repo import AccessRepository
from app.infrastructure.repositories.client_repo import ClientRepository
from app.infrastructure.repositories.workflow_repo import WorkflowRepository


class ClientService:
    """Encapsulates all business operations on the Client aggregate."""

    def __init__(self, session: AsyncSession) -> None:
        self.repo = ClientRepository(session)
        self.access_repo = AccessRepository(session)
        self.workflow_repo = WorkflowRepository(session)
        self.session = session

    async def list_clients(self, params: ClientListParams) -> ClientListResponse:
        """Return a paginated, filterable, sortable list of clients with metrics."""
        clients, total = await self.repo.list_clients(
            search=params.search,
            status=params.status,
            assigned_to_user_id=params.assigned_to_user_id,
            stale=params.stale,
            stale_threshold_days=params.stale_threshold_days,
            page=params.page,
            per_page=params.per_page,
            sort_by=params.sort_by,
            sort_order=params.sort_order,
        )

        now = datetime.now(timezone.utc)
        items: list[ClientWithMetrics] = []
        for c in clients:
            days = (now - c.updated_at.replace(tzinfo=timezone.utc)).days if c.updated_at else 0
            assigned_name = None
            if c.assigned_user:
                assigned_name = f"{c.assigned_user.first_name} {c.assigned_user.last_name}"
            item = ClientWithMetrics(
                **{
                    k: v
                    for k, v in Client.model_validate(c).model_dump().items()
                    if k not in ("assigned_user_name", "days_since_update")
                },
                assigned_user_name=assigned_name,
                days_since_update=days,
                is_stale=days >= params.stale_threshold_days,
            )
            items.append(item)

        return ClientListResponse(
            items=items,
            total=total,
            page=params.page,
            per_page=params.per_page,
            pages=math.ceil(total / params.per_page) if params.per_page else 1,
        )

    async def get_client(self, client_id: UUID) -> Client | None:
        """Fetch a single client by ID."""
        client = await self.repo.get_by_id(client_id)
        if client:
            return Client.model_validate(client)
        return None

    async def mark_sold(
        self, client_id: UUID, user_id: UUID | None = None
    ) -> Client | None:
        """Mark a case as sold, setting status to APPLICATION_NOT_STARTED."""
        client = await self.repo.update_status(client_id, "APPLICATION_NOT_STARTED")
        if client:
            await event_bus.publish(
                CaseMarkedSold(client_id=client_id, user_id=user_id)
            )
            return Client.model_validate(client)
        return None

    async def assign_owner(
        self, client_id: UUID, user_id: UUID | None, acting_user_id: UUID | None = None
    ) -> Client | None:
        """Assign an owner to a client case."""
        client = await self.repo.assign_owner(client_id, user_id)
        if client:
            await event_bus.publish(
                CaseOwnerAssigned(
                    client_id=client_id,
                    assigned_to_user_id=user_id,
                    user_id=acting_user_id,
                )
            )
            return Client.model_validate(client)
        return None

    async def check_readiness(self, client_id: UUID) -> CaseReadiness:
        """Pre-flight validation before allowing group setup to start."""
        blockers: list[ReadinessBlocker] = []

        client = await self.repo.get_by_id(client_id)
        if not client:
            blockers.append(ReadinessBlocker(code="CLIENT_NOT_FOUND", message="Client not found"))
            return CaseReadiness(is_ready=False, blockers=blockers)

        if not client.client_name or not client.client_name.strip():
            blockers.append(ReadinessBlocker(
                code="MISSING_CLIENT_NAME",
                message="Client name is required before starting setup.",
            ))

        if not client.eligible_employees or client.eligible_employees <= 0:
            blockers.append(ReadinessBlocker(
                code="NO_ELIGIBLE_EMPLOYEES",
                message="At least one eligible employee must be recorded.",
            ))

        access_entries = await self.access_repo.list_by_client(client_id)
        has_employer = any(a.role_type == "EMPLOYER" for a in access_entries)
        if not has_employer:
            blockers.append(ReadinessBlocker(
                code="NO_EMPLOYER_ACCESS",
                message="At least one employer must be assigned before starting setup.",
            ))

        existing_workflow = await self.workflow_repo.get_instance_by_client(client_id)
        if existing_workflow:
            blockers.append(ReadinessBlocker(
                code="WORKFLOW_EXISTS",
                message="A workflow instance already exists for this client.",
            ))

        return CaseReadiness(is_ready=len(blockers) == 0, blockers=blockers)

    async def get_timeline(
        self, client_id: UUID, limit: int = 50, offset: int = 0
    ) -> TimelineResponse:
        """Get chronological event history for a case."""
        rows, total = await self.repo.get_timeline_events(client_id, limit, offset)
        descriptions = TimelineEvent.event_descriptions()

        events: list[TimelineEvent] = []
        for event_log, user_orm in rows:
            desc_template, icon = descriptions.get(
                event_log.event_type, ("{event_type} occurred", "event")
            )

            payload = event_log.payload
            if isinstance(payload, str):
                try:
                    payload = json.loads(payload)
                except (json.JSONDecodeError, TypeError):
                    payload = {}

            try:
                description = desc_template.format(
                    event_type=event_log.event_type, **payload
                )
            except (KeyError, IndexError):
                description = desc_template.split("{")[0].strip() or event_log.event_type

            user_name = None
            if user_orm:
                user_name = f"{user_orm.first_name} {user_orm.last_name}"

            events.append(TimelineEvent(
                id=event_log.id,
                event_type=event_log.event_type,
                description=description,
                icon=icon,
                user_id=event_log.user_id,
                user_name=user_name,
                created_at=event_log.created_at,
            ))

        return TimelineResponse(client_id=client_id, events=events, total=total)
