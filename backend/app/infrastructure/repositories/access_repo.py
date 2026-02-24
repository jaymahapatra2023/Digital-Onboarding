"""Repository for ClientAccess entity data access."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.access_orm import ClientAccessORM


class AccessRepository:
    """Handles all database operations for the client_access table."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, access_id: UUID) -> ClientAccessORM | None:
        """Fetch a single access entry by primary key."""
        result = await self.session.execute(
            select(ClientAccessORM).where(ClientAccessORM.id == access_id)
        )
        return result.scalar_one_or_none()

    async def list_by_client(self, client_id: UUID) -> list[ClientAccessORM]:
        """Return all access entries for a given client."""
        result = await self.session.execute(
            select(ClientAccessORM)
            .where(ClientAccessORM.client_id == client_id)
            .order_by(ClientAccessORM.created_at.asc())
        )
        return list(result.scalars().all())

    async def create(
        self,
        client_id: UUID,
        first_name: str,
        last_name: str,
        email: str,
        role_type: str,
        has_ongoing_maintenance_access: bool = False,
        is_account_executive: bool = False,
        user_id: UUID | None = None,
        invitation_token: str | None = None,
        invitation_expires_at: datetime | None = None,
    ) -> ClientAccessORM:
        """Create a new client access entry and flush to obtain generated defaults."""
        access = ClientAccessORM(
            client_id=client_id,
            user_id=user_id,
            first_name=first_name,
            last_name=last_name,
            email=email,
            role_type=role_type,
            has_ongoing_maintenance_access=has_ongoing_maintenance_access,
            is_account_executive=is_account_executive,
            invitation_token=invitation_token,
            invitation_expires_at=invitation_expires_at,
        )
        self.session.add(access)
        await self.session.flush()
        return access

    async def update(self, access_id: UUID, **kwargs) -> ClientAccessORM | None:
        """Update an existing access entry with the provided keyword arguments.

        Only columns present on the ORM model will be set.
        Returns the updated ORM instance or ``None`` if not found.
        """
        access = await self.get_by_id(access_id)
        if access is None:
            return None
        for key, value in kwargs.items():
            if hasattr(access, key):
                setattr(access, key, value)
        await self.session.flush()
        return access

    async def delete(self, access_id: UUID) -> bool:
        """Hard-delete an access entry.  Returns ``True`` if a row was removed."""
        access = await self.get_by_id(access_id)
        if access is None:
            return False
        await self.session.delete(access)
        await self.session.flush()
        return True

    async def get_by_token(self, token: str) -> ClientAccessORM | None:
        """Look up an access entry by its invitation token."""
        result = await self.session.execute(
            select(ClientAccessORM).where(
                ClientAccessORM.invitation_token == token
            )
        )
        return result.scalar_one_or_none()

    async def get_by_client_and_email(
        self, client_id: UUID, email: str
    ) -> ClientAccessORM | None:
        """Look up an access entry by the composite (client_id, email) pair."""
        result = await self.session.execute(
            select(ClientAccessORM).where(
                ClientAccessORM.client_id == client_id,
                ClientAccessORM.email == email,
            )
        )
        return result.scalar_one_or_none()
