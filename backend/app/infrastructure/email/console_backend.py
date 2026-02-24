"""Console email backend for development — logs emails instead of sending."""

import logging

from .base import EmailBackend, EmailMessage

logger = logging.getLogger(__name__)


class ConsoleEmailBackend(EmailBackend):
    """Logs emails to the console. Stores sent messages for dev inspection."""

    def __init__(self) -> None:
        self._sent_emails: list[EmailMessage] = []

    async def send_email(self, message: EmailMessage) -> None:
        self._sent_emails.append(message)
        logger.info(
            "\n"
            "╔══════════════════════════════════════════════════════════╗\n"
            "║                    📧  EMAIL SENT                       ║\n"
            "╠══════════════════════════════════════════════════════════╣\n"
            "║  To:      %-44s ║\n"
            "║  Name:    %-44s ║\n"
            "║  Subject: %-44s ║\n"
            "╠══════════════════════════════════════════════════════════╣\n"
            "%s\n"
            "╚══════════════════════════════════════════════════════════╝",
            message.to_email,
            message.to_name,
            message.subject,
            message.html_body,
        )

    @property
    def sent_emails(self) -> list[EmailMessage]:
        """Access sent emails for testing/dev inspection."""
        return list(self._sent_emails)
