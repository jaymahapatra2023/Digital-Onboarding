"""Repository for Document entity data access."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.document_orm import DocumentORM


class DocumentRepository:
    """Handles all database operations for the documents table."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, document_id: UUID) -> DocumentORM | None:
        """Fetch a single document by primary key."""
        result = await self.session.execute(
            select(DocumentORM).where(DocumentORM.id == document_id)
        )
        return result.scalar_one_or_none()

    async def list_by_client(self, client_id: UUID) -> list[DocumentORM]:
        """Return all non-deleted documents for a given client."""
        result = await self.session.execute(
            select(DocumentORM)
            .where(
                DocumentORM.client_id == client_id,
                DocumentORM.is_deleted.is_(False),
            )
            .order_by(DocumentORM.uploaded_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_workflow_instance(
        self, workflow_instance_id: UUID
    ) -> list[DocumentORM]:
        """Return all non-deleted documents for a given workflow instance."""
        result = await self.session.execute(
            select(DocumentORM)
            .where(
                DocumentORM.workflow_instance_id == workflow_instance_id,
                DocumentORM.is_deleted.is_(False),
            )
            .order_by(DocumentORM.uploaded_at.desc())
        )
        return list(result.scalars().all())

    async def create(
        self,
        client_id: UUID,
        file_name: str,
        file_type: str,
        file_path: str,
        file_size_bytes: int | None = None,
        mime_type: str | None = None,
        uploaded_by_user_id: UUID | None = None,
        workflow_instance_id: UUID | None = None,
        file_description: str | None = None,
    ) -> DocumentORM:
        """Create a new document record and flush to obtain generated defaults."""
        document = DocumentORM(
            client_id=client_id,
            file_name=file_name,
            file_type=file_type,
            file_path=file_path,
            file_size_bytes=file_size_bytes,
            mime_type=mime_type,
            uploaded_by_user_id=uploaded_by_user_id,
            workflow_instance_id=workflow_instance_id,
            file_description=file_description,
        )
        self.session.add(document)
        await self.session.flush()
        return document

    async def soft_delete(self, document_id: UUID) -> bool:
        """Mark a document as deleted (soft delete).

        Returns ``True`` if the document was found and marked, ``False`` otherwise.
        """
        document = await self.get_by_id(document_id)
        if document is None:
            return False
        document.is_deleted = True
        await self.session.flush()
        return True
