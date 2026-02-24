"""Service layer for Client business logic."""

import math
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.events.client_events import CaseMarkedSold
from app.domain.events.event_bus import event_bus
from app.domain.models.client import Client, ClientListParams, ClientListResponse
from app.infrastructure.repositories.client_repo import ClientRepository


class ClientService:
    """Encapsulates all business operations on the Client aggregate."""

    def __init__(self, session: AsyncSession) -> None:
        self.repo = ClientRepository(session)
        self.session = session

    async def list_clients(self, params: ClientListParams) -> ClientListResponse:
        """Return a paginated, filterable, sortable list of clients."""
        clients, total = await self.repo.list_clients(
            search=params.search,
            status=params.status,
            page=params.page,
            per_page=params.per_page,
            sort_by=params.sort_by,
            sort_order=params.sort_order,
        )
        return ClientListResponse(
            items=[Client.model_validate(c) for c in clients],
            total=total,
            page=params.page,
            per_page=params.per_page,
            pages=math.ceil(total / params.per_page) if params.per_page else 1,
        )

    async def get_client(self, client_id: UUID) -> Client | None:
        """Fetch a single client by ID."""
        client = await self.repo.get_by_id(client_id)
        if client:
            return Client.model_validate(client)
        return None

    async def mark_sold(
        self, client_id: UUID, user_id: UUID | None = None
    ) -> Client | None:
        """Mark a case as sold, setting status to APPLICATION_NOT_STARTED.

        Publishes a ``CaseMarkedSold`` domain event on success.
        """
        client = await self.repo.update_status(client_id, "APPLICATION_NOT_STARTED")
        if client:
            await event_bus.publish(
                CaseMarkedSold(client_id=client_id, user_id=user_id)
            )
            return Client.model_validate(client)
        return None
