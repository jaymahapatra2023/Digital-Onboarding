"""Service layer for Document business logic."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.events.event_bus import event_bus
from app.domain.events.workflow_events import DocumentDeleted, DocumentUploaded
from app.domain.models.document import Document
from app.infrastructure.repositories.document_repo import DocumentRepository
from app.infrastructure.storage.file_storage import FileStorage


class DocumentService:
    """Encapsulates all business operations on the Document aggregate."""

    def __init__(self, session: AsyncSession, storage: FileStorage) -> None:
        self.repo = DocumentRepository(session)
        self.storage = storage
        self.session = session

    async def list_documents(self, client_id: UUID) -> list[Document]:
        """Return all non-deleted documents for a given client."""
        docs = await self.repo.list_by_client(client_id)
        return [Document.model_validate(d) for d in docs]

    async def upload_document(
        self,
        client_id: UUID,
        file_content: bytes,
        file_name: str,
        file_type: str,
        mime_type: str | None = None,
        file_description: str | None = None,
        uploaded_by_user_id: UUID | None = None,
        workflow_instance_id: UUID | None = None,
    ) -> Document:
        """Upload a document: persist the file to storage and create a DB record.

        Publishes a ``DocumentUploaded`` domain event on success.
        """
        # Persist the file bytes to the configured storage backend
        storage_path = await self.storage.save(
            file_content=file_content,
            filename=file_name,
            subfolder=str(client_id),
        )

        # Create the database record
        document = await self.repo.create(
            client_id=client_id,
            file_name=file_name,
            file_type=file_type,
            file_path=storage_path,
            file_size_bytes=len(file_content),
            mime_type=mime_type,
            uploaded_by_user_id=uploaded_by_user_id,
            workflow_instance_id=workflow_instance_id,
            file_description=file_description,
        )

        await event_bus.publish(
            DocumentUploaded(
                client_id=client_id,
                user_id=uploaded_by_user_id,
                document_id=document.id,
                file_type=file_type,
            )
        )

        return Document.model_validate(document)

    async def delete_document(
        self,
        document_id: UUID,
        user_id: UUID | None = None,
    ) -> bool:
        """Soft-delete a document.

        Publishes a ``DocumentDeleted`` domain event on success.
        Returns ``True`` if the document was found and marked deleted.
        """
        # Fetch the record first so we have context for the event
        document = await self.repo.get_by_id(document_id)
        if document is None:
            return False

        client_id = document.client_id

        deleted = await self.repo.soft_delete(document_id)
        if deleted:
            await event_bus.publish(
                DocumentDeleted(
                    client_id=client_id,
                    user_id=user_id,
                    document_id=document_id,
                )
            )

        return deleted

    async def get_document_file(
        self, document_id: UUID
    ) -> tuple[bytes, str, str]:
        """Retrieve the raw file content for a document.

        Returns a tuple of ``(content, file_name, mime_type)``.

        Raises ``ValueError`` if the document does not exist or has been
        deleted.
        """
        document = await self.repo.get_by_id(document_id)
        if document is None or document.is_deleted:
            raise ValueError("Document not found")

        content = await self.storage.get(document.file_path)

        return (
            content,
            document.file_name,
            document.mime_type or "application/octet-stream",
        )
