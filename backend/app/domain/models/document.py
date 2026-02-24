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


class Document(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    workflow_step_instance_id: UUID | None = None
    file_name: str
    file_description: str | None = None
    file_type: DocumentType
    storage_path: str
    uploaded_by: UUID | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class DocumentUpload(BaseModel):
    file_name: str
    file_description: str | None = None
    file_type: DocumentType


class DocumentListResponse(BaseModel):
    items: list[Document]
