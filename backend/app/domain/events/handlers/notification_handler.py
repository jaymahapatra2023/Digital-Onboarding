import logging

from app.domain.events.client_events import AccessAssigned, GroupSetupStarted
from app.domain.events.event_bus import event_bus

logger = logging.getLogger(__name__)


class NotificationHandler:
    """Stub notification handler for domain events."""

    async def handle_access_assigned(self, event: AccessAssigned) -> None:
        logger.info(f"Would send email to {event.email}")

    async def handle_setup_started(self, event: GroupSetupStarted) -> None:
        logger.info("Would send setup started notification")


def setup_notification_handlers() -> None:
    """Subscribe notification handlers to relevant domain events."""
    handler = NotificationHandler()

    event_bus.subscribe(AccessAssigned, handler.handle_access_assigned)
    event_bus.subscribe(GroupSetupStarted, handler.handle_setup_started)

    logger.info("Notification handlers registered")
