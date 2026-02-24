"""Offline packet endpoints: status, submit, and template downloads."""

from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.config import settings
from app.domain.models.offline_packet import OfflinePacketStatusResponse
from app.domain.services.offline_packet_service import OfflinePacketService
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.repositories.workflow_repo import WorkflowRepository

router = APIRouter(
    prefix="/clients/{client_id}/offline-packet",
    tags=["offline-packet"],
)

TEMPLATE_FILES = {
    "MASTER_APP": "MASTER_APP.pdf",
    "DATA_GATHERING_TOOL": "DATA_GATHERING_TOOL.pdf",
    "CENSUS_TEMPLATE": "CENSUS_TEMPLATE.pdf",
    "COMMISSION_ACK": "COMMISSION_ACK.pdf",
    "ENROLLMENT_FORM": "ENROLLMENT_FORM.pdf",
}


async def _get_workflow_instance_id(
    client_id: UUID, db: AsyncSession
) -> UUID:
    """Resolve the workflow instance ID for a client, raising 404 if not found."""
    repo = WorkflowRepository(db)
    instance = await repo.get_instance_by_client(client_id)
    if not instance:
        raise HTTPException(status_code=404, detail="No workflow found for this client")
    if not instance.is_offline:
        raise HTTPException(
            status_code=400, detail="This client is not using offline setup"
        )
    return instance.id


@router.get("/status", response_model=OfflinePacketStatusResponse)
async def get_packet_status(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get the current offline packet status including file completeness matrix."""
    workflow_instance_id = await _get_workflow_instance_id(client_id, db)
    service = OfflinePacketService(db)
    return await service.get_packet_status(client_id, workflow_instance_id)


@router.post("/submit", response_model=OfflinePacketStatusResponse)
async def submit_packet(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Submit the offline packet for review.

    Validates that all required documents have been uploaded.
    """
    workflow_instance_id = await _get_workflow_instance_id(client_id, db)
    service = OfflinePacketService(db)
    try:
        return await service.submit_packet(
            client_id, workflow_instance_id, user_id=current_user.id
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/templates/{document_type}")
async def download_template(
    client_id: UUID,
    document_type: str,
    current_user: UserORM = Depends(get_current_user),
):
    """Download a blank template PDF for the specified document type."""
    filename = TEMPLATE_FILES.get(document_type)
    if not filename:
        raise HTTPException(
            status_code=404,
            detail=f"No template available for document type: {document_type}",
        )

    template_path = Path(settings.TEMPLATE_DIR) / filename
    if not template_path.exists():
        raise HTTPException(status_code=404, detail="Template file not found on server")

    return FileResponse(
        path=str(template_path),
        filename=filename,
        media_type="application/pdf",
    )
