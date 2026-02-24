"""Service layer for Client Access business logic."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.events.client_events import AccessAssigned, AccessRevoked
from app.domain.events.event_bus import event_bus
from app.domain.models.access import ClientAccess, ClientAccessCreate, ClientAccessUpdate
from app.infrastructure.repositories.access_repo import AccessRepository


class AccessService:
    """Encapsulates all business operations on the ClientAccess aggregate."""

    def __init__(self, session: AsyncSession) -> None:
        self.repo = AccessRepository(session)
        self.session = session

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

        Raises ``ValueError`` if an access entry already exists for the same
        email and client combination.  Publishes an ``AccessAssigned`` domain
        event on success.
        """
        existing = await self.repo.get_by_client_and_email(client_id, data.email)
        if existing:
            raise ValueError(
                f"Access already exists for email '{data.email}' on this client"
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

        return ClientAccess.model_validate(access)

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
