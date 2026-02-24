"""Client endpoints: list and retrieve clients."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.dependencies import get_current_user, get_db
from app.domain.models.client import Client, ClientListParams, ClientListResponse
from app.domain.services.client_service import ClientService
from app.infrastructure.database.models.user_orm import UserORM

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=ClientListResponse)
async def list_clients(
    search: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    sort_by: str = Query("client_name"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Return a paginated, filterable, sortable list of clients."""
    service = ClientService(db)
    params = ClientListParams(
        search=search,
        status=status,
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return await service.list_clients(params)


@router.get("/{client_id}", response_model=Client)
async def get_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Retrieve a single client by ID."""
    service = ClientService(db)
    client = await service.get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client
