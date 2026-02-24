"""Base email abstractions."""

from abc import ABC, abstractmethod

from pydantic import BaseModel


class EmailMessage(BaseModel):
    """Represents an outgoing email message."""

    to_email: str
    to_name: str
    subject: str
    html_body: str


class EmailBackend(ABC):
    """Abstract base class for email delivery backends."""

    @abstractmethod
    async def send_email(self, message: EmailMessage) -> None:
        """Send an email message via the configured backend."""
