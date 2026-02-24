"""Repository for Client entity data access."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.infrastructure.database.models.client_orm import ClientORM
from app.infrastructure.database.models.event_log_orm import EventLogORM
from app.infrastructure.database.models.user_orm import UserORM


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
        assigned_to_user_id: UUID | None = None,
        stale: bool | None = None,
        stale_threshold_days: int = 7,
        page: int = 1,
        per_page: int = 10,
        sort_by: str = "client_name",
        sort_order: str = "asc",
    ) -> tuple[list[ClientORM], int]:
        """Return a paginated, filterable, sortable list of clients."""
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

        # -- Owner filter --
        if assigned_to_user_id:
            query = query.where(ClientORM.assigned_to_user_id == assigned_to_user_id)
            count_query = count_query.where(ClientORM.assigned_to_user_id == assigned_to_user_id)

        # -- Stale filter --
        if stale is not None:
            cutoff = datetime.now(timezone.utc) - timedelta(days=stale_threshold_days)
            if stale:
                query = query.where(ClientORM.updated_at < cutoff)
                count_query = count_query.where(ClientORM.updated_at < cutoff)
            else:
                query = query.where(ClientORM.updated_at >= cutoff)
                count_query = count_query.where(ClientORM.updated_at >= cutoff)

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
        """Update the status field of an existing client."""
        client = await self.get_by_id(client_id)
        if client:
            client.status = status
            await self.session.flush()
        return client

    async def assign_owner(self, client_id: UUID, user_id: UUID | None) -> ClientORM | None:
        """Assign (or unassign) an owner to a client."""
        client = await self.get_by_id(client_id)
        if client:
            client.assigned_to_user_id = user_id
            await self.session.flush()
            await self.session.refresh(client)
        return client

    async def get_timeline_events(
        self, client_id: UUID, limit: int = 50, offset: int = 0
    ) -> tuple[list[tuple[EventLogORM, UserORM | None]], int]:
        """Query event_log rows for a client with optional user info."""
        count_query = (
            select(func.count())
            .select_from(EventLogORM)
            .where(EventLogORM.client_id == client_id)
        )
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()

        query = (
            select(EventLogORM, UserORM)
            .outerjoin(UserORM, EventLogORM.user_id == UserORM.id)
            .where(EventLogORM.client_id == client_id)
            .order_by(EventLogORM.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(query)
        rows = result.all()

        return [(row[0], row[1]) for row in rows], total
