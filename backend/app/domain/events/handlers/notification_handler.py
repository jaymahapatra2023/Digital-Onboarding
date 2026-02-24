import logging

from app.domain.events.client_events import (
    AccessUnlocked,
    GroupSetupStarted,
    InvitationSent,
    OfflinePacketSubmitted,
)
from app.domain.events.workflow_events import WorkflowHandoffRequested, WorkflowSubmitted
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

    async def handle_handoff_requested(self, event: WorkflowHandoffRequested) -> None:
        from app.config import settings
        from app.infrastructure.email.console_backend import ConsoleEmailBackend
        from app.infrastructure.email.service import EmailService

        workflow_url = (
            f"{settings.FRONTEND_URL}/workflow/{event.client_id}"
            f"?step={event.next_step_name}"
        )

        email_service = EmailService(ConsoleEmailBackend())
        await email_service.send_handoff_notification(
            to_email=event.target_email,
            to_name=event.target_name,
            client_name=event.client_name,
            next_step_name=event.next_step_name,
            broker_name=event.broker_name,
            workflow_url=workflow_url,
        )
        logger.info(
            f"Handoff notification sent to {event.target_email} "
            f"for client {event.client_id}"
        )

    async def handle_workflow_submitted(self, event: WorkflowSubmitted) -> None:
        renewal = event.servicing_payload.get("renewal_notification_period")
        billing = event.servicing_payload.get("billing")
        billing_model = billing.get("billing_model") if billing else None
        billing_freq = billing.get("billing_frequency") if billing else None
        auth = event.servicing_payload.get("authorization")
        auth_signer = auth.get("accepted_by") if auth else None
        auth_timestamp = auth.get("server_timestamp") if auth else None
        logger.info(
            f"Workflow submitted for client {event.client_id} "
            f"(workflow_instance_id={event.workflow_instance_id}, "
            f"renewal_notification_period={renewal}, "
            f"billing_model={billing_model}, billing_frequency={billing_freq}, "
            f"auth_signer={auth_signer}, auth_timestamp={auth_timestamp})"
        )


def setup_notification_handlers() -> None:
    """Subscribe notification handlers to relevant domain events."""
    handler = NotificationHandler()

    event_bus.subscribe(InvitationSent, handler.handle_invitation_sent)
    event_bus.subscribe(AccessUnlocked, handler.handle_access_unlocked)
    event_bus.subscribe(GroupSetupStarted, handler.handle_setup_started)
    event_bus.subscribe(OfflinePacketSubmitted, handler.handle_offline_packet_submitted)
    event_bus.subscribe(WorkflowSubmitted, handler.handle_workflow_submitted)
    event_bus.subscribe(WorkflowHandoffRequested, handler.handle_handoff_requested)

    logger.info("Notification handlers registered")
