"""Event handler registration.

Import and wire up domain event handlers here.  This module is called
once during application startup from ``app.main``.
"""

from app.domain.events.handlers.audit_handler import (
    AuditHandler,
    setup_audit_handlers,
)
from app.domain.events.handlers.notification_handler import (
    NotificationHandler,
    setup_notification_handlers,
)

__all__ = [
    "AuditHandler",
    "setup_audit_handlers",
    "NotificationHandler",
    "setup_notification_handlers",
]


def setup_event_handlers() -> None:
    """Register all domain event handlers with the event bus."""
    from app.infrastructure.database.session import async_session_factory

    setup_audit_handlers(async_session_factory)
    setup_notification_handlers()
