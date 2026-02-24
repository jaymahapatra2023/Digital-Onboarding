import logging

from app.domain.events.client_events import (
    AccessUnlocked,
    GroupSetupStarted,
    InvitationSent,
    OfflinePacketSubmitted,
)
from app.domain.events.workflow_events import WorkflowSubmitted
from app.domain.events.event_bus import event_bus

logger = logging.getLogger(__name__)


class NotificationHandler:
    """Handles notification-related domain events."""

    async def handle_invitation_sent(self, event: InvitationSent) -> None:
        action = "resent" if event.is_resend else "sent"
        logger.info(
            f"Invitation {action} to {event.email} "
            f"(role={event.role_type}, access_id={event.access_id})"
        )

    async def handle_access_unlocked(self, event: AccessUnlocked) -> None:
        logger.info(
            f"Access unlocked for {event.email} "
            f"(access_id={event.access_id})"
        )

    async def handle_setup_started(self, event: GroupSetupStarted) -> None:
        logger.info("Would send setup started notification")

    async def handle_offline_packet_submitted(self, event: OfflinePacketSubmitted) -> None:
        logger.info(
            f"Offline packet submitted for client {event.client_id} "
            f"(workflow_instance_id={event.workflow_instance_id})"
        )

    async def handle_workflow_submitted(self, event: WorkflowSubmitted) -> None:
        renewal = event.servicing_payload.get("renewal_notification_period")
        logger.info(
            f"Workflow submitted for client {event.client_id} "
            f"(workflow_instance_id={event.workflow_instance_id}, "
            f"renewal_notification_period={renewal})"
        )


def setup_notification_handlers() -> None:
    """Subscribe notification handlers to relevant domain events."""
    handler = NotificationHandler()

    event_bus.subscribe(InvitationSent, handler.handle_invitation_sent)
    event_bus.subscribe(AccessUnlocked, handler.handle_access_unlocked)
    event_bus.subscribe(GroupSetupStarted, handler.handle_setup_started)
    event_bus.subscribe(OfflinePacketSubmitted, handler.handle_offline_packet_submitted)
    event_bus.subscribe(WorkflowSubmitted, handler.handle_workflow_submitted)

    logger.info("Notification handlers registered")
