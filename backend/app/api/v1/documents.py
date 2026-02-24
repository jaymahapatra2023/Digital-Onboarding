"""Document endpoints: upload, list, download, and delete documents."""

from uuid import UUID

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.config import settings
from app.domain.models.document import Document
from app.domain.services.document_service import DocumentService
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.storage.file_storage import LocalFileStorage

router = APIRouter(
    prefix="/clients/{client_id}/documents",
    tags=["documents"],
)


def _get_storage() -> LocalFileStorage:
    """Return a LocalFileStorage instance configured from application settings."""
    return LocalFileStorage(upload_dir=settings.UPLOAD_DIR)


@router.get("", response_model=list[Document])
async def list_documents(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Return all non-deleted documents for a given client."""
    storage = _get_storage()
    service = DocumentService(db, storage)
    return await service.list_documents(client_id)


@router.post("", response_model=Document, status_code=201)
async def upload_document(
    client_id: UUID,
    file: UploadFile,
    file_type: str = Form(...),
    file_description: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Upload a new document for a client.

    Accepts a multipart file upload along with form fields for file_type
    and an optional file_description.
    """
    storage = _get_storage()
    service = DocumentService(db, storage)

    # Read file content into memory for the storage backend
    file_content = await file.read()

    return await service.upload_document(
        client_id=client_id,
        file_content=file_content,
        file_name=file.filename or "unknown",
        file_type=file_type,
        mime_type=file.content_type,
        file_description=file_description,
        uploaded_by_user_id=current_user.id,
    )


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    client_id: UUID,
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Soft-delete a document."""
    storage = _get_storage()
    service = DocumentService(db, storage)
    deleted = await service.delete_document(
        document_id=document_id,
        user_id=current_user.id,
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return None


@router.get("/{document_id}/download")
async def download_document(
    client_id: UUID,
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Download the raw file content for a document.

    Returns the file as a streaming binary response with appropriate
    Content-Disposition and Content-Type headers.
    """
    storage = _get_storage()
    service = DocumentService(db, storage)

    try:
        content, file_name, mime_type = await service.get_document_file(document_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return Response(
        content=content,
        media_type=mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{file_name}"',
        },
    )
