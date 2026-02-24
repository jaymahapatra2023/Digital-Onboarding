"""Repository for Client entity data access."""

from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.client_orm import ClientORM


class ClientRepository:
    """Handles all database operations for the clients table."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, client_id: UUID) -> ClientORM | None:
        """Fetch a single client by primary key."""
        result = await self.session.execute(
            select(ClientORM).where(ClientORM.id == client_id)
        )
        return result.scalar_one_or_none()

    async def list_clients(
        self,
        search: str | None = None,
        status: str | None = None,
        page: int = 1,
        per_page: int = 10,
        sort_by: str = "client_name",
        sort_order: str = "asc",
    ) -> tuple[list[ClientORM], int]:
        """Return a paginated, filterable, sortable list of clients.

        Returns a tuple of (clients, total_count).
        """
        query = select(ClientORM)
        count_query = select(func.count()).select_from(ClientORM)

        # -- Full-text-ish search across name and unique_id --
        if search:
            search_filter = or_(
                ClientORM.client_name.ilike(f"%{search}%"),
                ClientORM.unique_id.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        # -- Status filter --
        if status:
            query = query.where(ClientORM.status == status)
            count_query = count_query.where(ClientORM.status == status)

        # -- Sorting --
        sort_column = getattr(ClientORM, sort_by, ClientORM.client_name)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # -- Pagination --
        query = query.offset((page - 1) * per_page).limit(per_page)

        total_result = await self.session.execute(count_query)
        total = total_result.scalar()

        result = await self.session.execute(query)
        clients = list(result.scalars().all())

        return clients, total

    async def update_status(self, client_id: UUID, status: str) -> ClientORM | None:
        """Update the status field of an existing client.

        Returns the updated ORM instance or ``None`` if not found.
        """
        client = await self.get_by_id(client_id)
        if client:
            client.status = status
            await self.session.flush()
        return client
