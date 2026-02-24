"""Email service with invitation-specific email methods."""

import logging

from app.config import settings

from .base import EmailBackend, EmailMessage

logger = logging.getLogger(__name__)


class EmailService:
    """High-level email operations for the onboarding platform."""

    def __init__(self, backend: EmailBackend) -> None:
        self._backend = backend

    async def send_access_invitation(
        self,
        to_email: str,
        to_name: str,
        client_name: str,
        role_type: str,
        invitation_token: str,
        expires_in_days: int,
    ) -> None:
        """Send an invitation email when access is assigned to a client."""
        accept_url = (
            f"{settings.FRONTEND_URL}/accept-invitation?token={invitation_token}"
        )
        role_display = role_type.replace("_", " ").title()

        html_body = f"""
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #4338ca;">You've Been Invited</h2>
  <p>Hello {to_name},</p>
  <p>
    You have been granted <strong>{role_display}</strong> access
    to <strong>{client_name}</strong> on the Digital Onboarding portal.
  </p>
  <p>
    <a href="{accept_url}"
       style="display: inline-block; padding: 12px 24px; background-color: #4338ca;
              color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
      Accept Invitation
    </a>
  </p>
  <p style="color: #64748b; font-size: 14px;">
    This invitation expires in {expires_in_days} days.
  </p>
</div>
"""
        message = EmailMessage(
            to_email=to_email,
            to_name=to_name,
            subject=f"Invitation: {role_display} access to {client_name}",
            html_body=html_body,
        )
        await self._backend.send_email(message)
        logger.info(f"Access invitation sent to {to_email} for client '{client_name}'")

    async def send_handoff_notification(
        self,
        to_email: str,
        to_name: str,
        client_name: str,
        next_step_name: str,
        broker_name: str,
        workflow_url: str,
    ) -> None:
        """Send a notification when a broker hands off to the employer."""
        html_body = f"""
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #4338ca;">Action Required: Complete Your Onboarding Steps</h2>
  <p>Hello {to_name},</p>
  <p>
    <strong>{broker_name}</strong> has completed their portion of the group setup
    for <strong>{client_name}</strong>. Your input is now needed to continue.
  </p>
  <p>
    The next step awaiting your action is: <strong>{next_step_name}</strong>.
  </p>
  <p>
    <a href="{workflow_url}"
       style="display: inline-block; padding: 12px 24px; background-color: #4338ca;
              color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
      Continue Setup
    </a>
  </p>
  <p style="color: #64748b; font-size: 14px;">
    Please log in with your employer credentials to complete the remaining steps.
  </p>
</div>
"""
        message = EmailMessage(
            to_email=to_email,
            to_name=to_name,
            subject=f"Action Required: Complete {next_step_name} for {client_name}",
            html_body=html_body,
        )
        await self._backend.send_email(message)
        logger.info(
            f"Handoff notification sent to {to_email} for client '{client_name}'"
        )

    async def send_access_unlocked(
        self,
        to_email: str,
        to_name: str,
        client_name: str,
    ) -> None:
        """Send a notification when a user's access has been unlocked."""
        portal_url = settings.FRONTEND_URL

        html_body = f"""
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #4338ca;">Access Unlocked</h2>
  <p>Hello {to_name},</p>
  <p>
    Your access to <strong>{client_name}</strong> on the Digital Onboarding portal
    has been unlocked by support.
  </p>
  <p>
    <a href="{portal_url}"
       style="display: inline-block; padding: 12px 24px; background-color: #16a34a;
              color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
      Go to Portal
    </a>
  </p>
</div>
"""
        message = EmailMessage(
            to_email=to_email,
            to_name=to_name,
            subject=f"Access Unlocked: {client_name}",
            html_body=html_body,
        )
        await self._backend.send_email(message)
        logger.info(f"Access unlocked email sent to {to_email} for client '{client_name}'")
