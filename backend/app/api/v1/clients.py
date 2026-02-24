"""Client endpoints: list, retrieve, readiness, timeline, and assignment."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.dependencies import get_current_user, get_db
from app.domain.models.client import (
    CaseReadiness,
    Client,
    ClientListParams,
    ClientListResponse,
    TimelineResponse,
)
from app.domain.services.client_service import ClientService
from app.infrastructure.database.models.user_orm import UserORM

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=ClientListResponse)
async def list_clients(
    search: str | None = Query(None),
    status: str | None = Query(None),
    assigned_to_user_id: UUID | None = Query(None),
    stale: bool | None = Query(None),
    stale_threshold_days: int = Query(7, ge=1),
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
        assigned_to_user_id=assigned_to_user_id,
        stale=stale,
        stale_threshold_days=stale_threshold_days,
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


@router.get("/{client_id}/readiness", response_model=CaseReadiness)
async def check_readiness(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Pre-flight validation: check if a case is ready to start group setup."""
    service = ClientService(db)
    return await service.check_readiness(client_id)


@router.get("/{client_id}/timeline", response_model=TimelineResponse)
async def get_timeline(
    client_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get chronological event history for a case."""
    service = ClientService(db)
    return await service.get_timeline(client_id, limit, offset)


@router.patch("/{client_id}/assign", response_model=Client)
async def assign_owner(
    client_id: UUID,
    user_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Assign a case owner."""
    service = ClientService(db)
    client = await service.assign_owner(client_id, user_id, acting_user_id=current_user.id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("/{client_id}/assign-me", response_model=Client)
async def assign_to_me(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Assign the current user as case owner."""
    service = ClientService(db)
    client = await service.assign_owner(client_id, current_user.id, acting_user_id=current_user.id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client
