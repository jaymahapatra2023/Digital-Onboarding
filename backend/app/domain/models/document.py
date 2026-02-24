from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DocumentType(str, Enum):
    MASTER_APP = "MASTER_APP"
    DATA_GATHERING_TOOL = "DATA_GATHERING_TOOL"
    CENSUS_TEMPLATE = "CENSUS_TEMPLATE"
    COMMISSION_ACK = "COMMISSION_ACK"
    SUPPLEMENTAL = "SUPPLEMENTAL"
    ENROLLMENT_FORM = "ENROLLMENT_FORM"
    HIPAA_AUTHORIZATION = "HIPAA_AUTHORIZATION"


class Document(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    workflow_instance_id: UUID | None = None
    file_name: str
    file_description: str | None = None
    file_type: DocumentType
    file_path: str
    file_size_bytes: int | None = None
    mime_type: str | None = None
    uploaded_by_user_id: UUID | None = None
    uploaded_at: datetime | None = None


class DocumentUpload(BaseModel):
    file_name: str
    file_description: str | None = None
    file_type: DocumentType


class DocumentListResponse(BaseModel):
    items: list[Document]
