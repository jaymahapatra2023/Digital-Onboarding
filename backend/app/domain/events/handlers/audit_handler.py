import json
import logging
from typing import Callable

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.events.base import DomainEvent
from app.domain.events.client_events import (
    AccessAssigned,
    AccessRevoked,
    CaseMarkedSold,
    CaseOwnerAssigned,
    GroupSetupStarted,
    OfflineSetupChosen,
)
from app.domain.events.event_bus import event_bus
from app.domain.events.workflow_events import (
    DocumentDeleted,
    DocumentUploaded,
    WorkflowStepCompleted,
    WorkflowStepSaved,
    WorkflowStepSkipped,
    WorkflowStepStarted,
)

logger = logging.getLogger(__name__)


class AuditHandler:
    """Persists domain events to the event_log table for auditing."""

    def __init__(self, session_factory: Callable[..., AsyncSession]) -> None:
        self._session_factory = session_factory

    async def handle(self, event: DomainEvent) -> None:
        from app.infrastructure.database.models.event_log_orm import EventLogORM

        try:
            async with self._session_factory() as session:
                event_data = event.model_dump(mode="json")
                log_entry = EventLogORM(
                    event_type=type(event).__name__,
                    client_id=event.client_id,
                    user_id=event.user_id,
                    payload=json.dumps(event_data),
                )
                session.add(log_entry)
                await session.commit()
                logger.info(
                    f"Audit log persisted for event {type(event).__name__} "
                    f"(event_id={event.event_id})"
                )
        except Exception as e:
            logger.error(
                f"Failed to persist audit log for event "
                f"{type(event).__name__}: {e}"
            )


def setup_audit_handlers(session_factory: Callable[..., AsyncSession]) -> None:
    """Subscribe the audit handler to all domain event types."""
    handler = AuditHandler(session_factory)

    all_event_types = [
        CaseMarkedSold,
        AccessAssigned,
        AccessRevoked,
        CaseOwnerAssigned,
        GroupSetupStarted,
        OfflineSetupChosen,
        WorkflowStepStarted,
        WorkflowStepCompleted,
        WorkflowStepSaved,
        WorkflowStepSkipped,
        DocumentUploaded,
        DocumentDeleted,
    ]

    for event_type in all_event_types:
        event_bus.subscribe(event_type, handler.handle)

    logger.info(
        f"Audit handlers registered for {len(all_event_types)} event types"
    )
