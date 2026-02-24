"""Administrator access endpoints: manage client access entries."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.domain.models.access import ClientAccess, ClientAccessCreate, ClientAccessUpdate
from app.domain.services.access_service import AccessService
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.email import ConsoleEmailBackend, EmailService

router = APIRouter(
    prefix="/clients/{client_id}/access",
    tags=["access"],
)


def _get_email_service() -> EmailService:
    """Create an EmailService with the console backend (dev default)."""
    return EmailService(ConsoleEmailBackend())


@router.get("", response_model=list[ClientAccess])
async def list_access(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Return all access entries for a given client."""
    service = AccessService(db, _get_email_service())
    return await service.list_access(client_id)


@router.post("", response_model=ClientAccess, status_code=201)
async def create_access(
    client_id: UUID,
    data: ClientAccessCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Create a new access entry for a client and send an invitation email."""
    service = AccessService(db, _get_email_service())
    try:
        return await service.create_access(
            client_id=client_id,
            data=data,
            user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.put("/{access_id}", response_model=ClientAccess)
async def update_access(
    client_id: UUID,
    access_id: UUID,
    data: ClientAccessUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Update an existing access entry."""
    service = AccessService(db, _get_email_service())
    updated = await service.update_access(
        access_id=access_id,
        data=data,
        user_id=current_user.id,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Access entry not found")
    return updated


@router.delete("/{access_id}", status_code=204)
async def delete_access(
    client_id: UUID,
    access_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Delete an access entry."""
    service = AccessService(db, _get_email_service())
    deleted = await service.delete_access(
        access_id=access_id,
        user_id=current_user.id,
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Access entry not found")
    return None


@router.post("/{access_id}/resend-invitation", response_model=ClientAccess)
async def resend_invitation(
    client_id: UUID,
    access_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Re-send the invitation email with a fresh token."""
    service = AccessService(db, _get_email_service())
    result = await service.resend_invitation(
        access_id=access_id,
        user_id=current_user.id,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Access entry not found")
    return result


@router.post("/{access_id}/unlock", response_model=ClientAccess)
async def unlock_access(
    client_id: UUID,
    access_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Unlock access and send an unlock notification email."""
    service = AccessService(db, _get_email_service())
    result = await service.unlock_access(
        access_id=access_id,
        user_id=current_user.id,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Access entry not found")
    return result
