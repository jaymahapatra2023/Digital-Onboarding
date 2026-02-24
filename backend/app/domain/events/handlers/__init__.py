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
    """Register all domain event handlers with the event bus.

    Call ``setup_audit_handlers`` with a session factory and
    ``setup_notification_handlers`` during application startup.
    """
    # Audit handlers require a DB session factory; call
    # setup_audit_handlers(session_factory) from app startup.
    # Notification handlers can be wired immediately:
    setup_notification_handlers()
