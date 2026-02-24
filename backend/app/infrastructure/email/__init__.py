"""Email infrastructure package."""

from .base import EmailBackend, EmailMessage
from .console_backend import ConsoleEmailBackend
from .service import EmailService

__all__ = ["EmailBackend", "EmailMessage", "ConsoleEmailBackend", "EmailService"]
