"""Service layer for Offline Packet business logic."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.events.client_events import OfflinePacketSubmitted
from app.domain.events.event_bus import event_bus
from app.domain.models.offline_packet import (
    ALL_OFFLINE_FILE_TYPES,
    REQUIRED_FILE_TYPES,
    OfflinePacketStatus,
    OfflinePacketStatusResponse,
    RequiredFileStatus,
)
from app.infrastructure.repositories.document_repo import DocumentRepository
from app.infrastructure.repositories.workflow_repo import WorkflowRepository

FILE_TYPE_LABELS = {
    "MASTER_APP": "Master Application",
    "DATA_GATHERING_TOOL": "Data Gathering Tool",
    "CENSUS_TEMPLATE": "Census Template",
    "COMMISSION_ACK": "Commission Acknowledgement",
    "ENROLLMENT_FORM": "Enrollment Form",
}


class OfflinePacketService:
    """Manages offline packet status checks and submission."""

    def __init__(self, session: AsyncSession) -> None:
        self.doc_repo = DocumentRepository(session)
        self.workflow_repo = WorkflowRepository(session)
        self.session = session

    async def get_packet_status(
        self, client_id: UUID, workflow_instance_id: UUID
    ) -> OfflinePacketStatusResponse:
        """Build the file matrix and completeness check for an offline packet."""
        documents = await self.doc_repo.list_by_workflow_instance(workflow_instance_id)

        # Build a lookup: file_type -> most recent document
        uploaded_map: dict[str, object] = {}
        for doc in documents:
            if doc.file_type not in uploaded_map:
                uploaded_map[doc.file_type] = doc

        files: list[RequiredFileStatus] = []
        missing_required: list[str] = []

        for ft in ALL_OFFLINE_FILE_TYPES:
            is_required = ft in REQUIRED_FILE_TYPES
            doc = uploaded_map.get(ft)
            uploaded = doc is not None

            if is_required and not uploaded:
                missing_required.append(ft)

            files.append(
                RequiredFileStatus(
                    file_type=ft,
                    label=FILE_TYPE_LABELS.get(ft, ft),
                    required=is_required,
                    uploaded=uploaded,
                    file_name=doc.file_name if doc else None,
                    document_id=str(doc.id) if doc else None,
                )
            )

        # Determine overall packet status from workflow status
        instance = await self.workflow_repo.get_instance_by_client(client_id)
        if instance and instance.status == "OFFLINE_SUBMITTED":
            status = OfflinePacketStatus.SUBMITTED
        elif instance and instance.status == "OFFLINE_IN_REVIEW":
            status = OfflinePacketStatus.IN_REVIEW
        else:
            status = OfflinePacketStatus.COLLECTING

        return OfflinePacketStatusResponse(
            status=status,
            is_complete=len(missing_required) == 0,
            files=files,
            missing_required=missing_required,
        )

    async def submit_packet(
        self,
        client_id: UUID,
        workflow_instance_id: UUID,
        user_id: UUID | None = None,
    ) -> OfflinePacketStatusResponse:
        """Submit the offline packet for review.

        Validates completeness, updates workflow status, and publishes
        an ``OfflinePacketSubmitted`` domain event.

        Raises ``ValueError`` if required files are missing.
        """
        packet_status = await self.get_packet_status(client_id, workflow_instance_id)

        if not packet_status.is_complete:
            missing = ", ".join(packet_status.missing_required)
            raise ValueError(
                f"Cannot submit: missing required documents: {missing}"
            )

        # Update workflow status
        await self.workflow_repo.update_instance(
            workflow_instance_id, status="OFFLINE_SUBMITTED"
        )
        await self.session.flush()

        # Publish domain event
        await event_bus.publish(
            OfflinePacketSubmitted(
                client_id=client_id,
                user_id=user_id,
                workflow_instance_id=workflow_instance_id,
            )
        )

        # Re-fetch status to reflect the new state
        return await self.get_packet_status(client_id, workflow_instance_id)
