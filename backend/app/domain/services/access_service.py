"""Service layer for Client Access business logic."""

import secrets
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.domain.events.client_events import (
    AccessAssigned,
    AccessRevoked,
    AccessUnlocked,
    InvitationSent,
)
from app.domain.events.event_bus import event_bus
from app.domain.models.access import ClientAccess, ClientAccessCreate, ClientAccessUpdate
from app.infrastructure.database.models.client_orm import ClientORM
from app.infrastructure.email.service import EmailService
from app.infrastructure.repositories.access_repo import AccessRepository


class AccessService:
    """Encapsulates all business operations on the ClientAccess aggregate."""

    def __init__(self, session: AsyncSession, email_service: EmailService) -> None:
        self.repo = AccessRepository(session)
        self.session = session
        self.email_service = email_service

    async def _get_client_name(self, client_id: UUID) -> str:
        """Fetch the client name for email context."""
        result = await self.session.execute(
            select(ClientORM.client_name).where(ClientORM.id == client_id)
        )
        name = result.scalar_one_or_none()
        return name or "Unknown Client"

    async def list_access(self, client_id: UUID) -> list[ClientAccess]:
        """Return all access entries for a given client."""
        entries = await self.repo.list_by_client(client_id)
        return [ClientAccess.model_validate(e) for e in entries]

    async def create_access(
        self,
        client_id: UUID,
        data: ClientAccessCreate,
        user_id: UUID | None = None,
    ) -> ClientAccess:
        """Grant access to a client for the given email/role.

        Generates an invitation token, sends an invitation email, and
        publishes ``AccessAssigned`` + ``InvitationSent`` domain events.
        Raises ``ValueError`` if an access entry already exists for the same
        email and client combination.
        """
        existing = await self.repo.get_by_client_and_email(client_id, data.email)
        if existing:
            raise ValueError(
                f"Access already exists for email '{data.email}' on this client"
            )

        token = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)
        expires_at = datetime.fromtimestamp(
            now.timestamp() + settings.INVITATION_EXPIRY_DAYS * 86400,
            tz=timezone.utc,
        )

        access = await self.repo.create(
            client_id=client_id,
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            role_type=data.role_type,
            has_ongoing_maintenance_access=data.has_ongoing_maintenance_access,
            is_account_executive=data.is_account_executive,
            user_id=data.user_id,
            invitation_token=token,
            invitation_expires_at=expires_at,
        )

        # Send invitation email
        client_name = await self._get_client_name(client_id)
        to_name = f"{data.first_name} {data.last_name}"
        await self.email_service.send_access_invitation(
            to_email=data.email,
            to_name=to_name,
            client_name=client_name,
            role_type=data.role_type,
            invitation_token=token,
            expires_in_days=settings.INVITATION_EXPIRY_DAYS,
        )

        # Update status to SENT after email is dispatched
        await self.repo.update(
            access.id,
            invitation_status="SENT",
            invitation_sent_at=now,
        )

        await event_bus.publish(
            AccessAssigned(
                client_id=client_id,
                user_id=user_id,
                access_id=access.id,
                email=data.email,
                role_type=data.role_type,
            )
        )
        await event_bus.publish(
            InvitationSent(
                client_id=client_id,
                user_id=user_id,
                access_id=access.id,
                email=data.email,
                role_type=data.role_type,
            )
        )

        # Re-fetch to include updated invitation_status
        updated = await self.repo.get_by_id(access.id)
        return ClientAccess.model_validate(updated)

    async def update_access(
        self,
        access_id: UUID,
        data: ClientAccessUpdate,
        user_id: UUID | None = None,
    ) -> ClientAccess | None:
        """Update an existing access entry.

        Returns the updated ``ClientAccess`` or ``None`` if not found.
        """
        access = await self.repo.update(
            access_id,
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            role_type=data.role_type,
            has_ongoing_maintenance_access=data.has_ongoing_maintenance_access,
            is_account_executive=data.is_account_executive,
        )
        if access:
            return ClientAccess.model_validate(access)
        return None

    async def delete_access(
        self,
        access_id: UUID,
        user_id: UUID | None = None,
    ) -> bool:
        """Revoke access by deleting the access entry.

        Publishes an ``AccessRevoked`` domain event on success.
        Returns ``True`` if the entry was deleted, ``False`` otherwise.
        """
        # Fetch the record first so we can include context in the event
        access = await self.repo.get_by_id(access_id)
        if access is None:
            return False

        client_id = access.client_id
        email = access.email

        deleted = await self.repo.delete(access_id)
        if deleted:
            await event_bus.publish(
                AccessRevoked(
                    client_id=client_id,
                    user_id=user_id,
                    access_id=access_id,
                    email=email,
                )
            )

        return deleted

    async def resend_invitation(
        self,
        access_id: UUID,
        user_id: UUID | None = None,
    ) -> ClientAccess | None:
        """Re-send an invitation email with a fresh token and expiry.

        Returns the updated ``ClientAccess`` or ``None`` if not found.
        """
        access = await self.repo.get_by_id(access_id)
        if access is None:
            return None

        token = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)
        expires_at = datetime.fromtimestamp(
            now.timestamp() + settings.INVITATION_EXPIRY_DAYS * 86400,
            tz=timezone.utc,
        )

        client_name = await self._get_client_name(access.client_id)
        to_name = f"{access.first_name} {access.last_name}"

        await self.email_service.send_access_invitation(
            to_email=access.email,
            to_name=to_name,
            client_name=client_name,
            role_type=access.role_type,
            invitation_token=token,
            expires_in_days=settings.INVITATION_EXPIRY_DAYS,
        )

        await self.repo.update(
            access_id,
            invitation_token=token,
            invitation_status="SENT",
            invitation_sent_at=now,
            invitation_expires_at=expires_at,
        )

        await event_bus.publish(
            InvitationSent(
                client_id=access.client_id,
                user_id=user_id,
                access_id=access_id,
                email=access.email,
                role_type=access.role_type,
                is_resend=True,
            )
        )

        refreshed = await self.repo.get_by_id(access_id)
        return ClientAccess.model_validate(refreshed)

    async def unlock_access(
        self,
        access_id: UUID,
        user_id: UUID | None = None,
    ) -> ClientAccess | None:
        """Unlock a user's access by generating a new token and sending an unlock email.

        Returns the updated ``ClientAccess`` or ``None`` if not found.
        """
        access = await self.repo.get_by_id(access_id)
        if access is None:
            return None

        token = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)
        expires_at = datetime.fromtimestamp(
            now.timestamp() + settings.INVITATION_EXPIRY_DAYS * 86400,
            tz=timezone.utc,
        )

        client_name = await self._get_client_name(access.client_id)
        to_name = f"{access.first_name} {access.last_name}"

        await self.email_service.send_access_unlocked(
            to_email=access.email,
            to_name=to_name,
            client_name=client_name,
        )

        await self.repo.update(
            access_id,
            invitation_token=token,
            invitation_status="SENT",
            invitation_sent_at=now,
            invitation_expires_at=expires_at,
        )

        await event_bus.publish(
            AccessUnlocked(
                client_id=access.client_id,
                user_id=user_id,
                access_id=access_id,
                email=access.email,
            )
        )

        refreshed = await self.repo.get_by_id(access_id)
        return ClientAccess.model_validate(refreshed)
