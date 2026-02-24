"""Domain models for the offline packet lifecycle."""

from enum import Enum

from pydantic import BaseModel


class OfflinePacketStatus(str, Enum):
    COLLECTING = "COLLECTING"
    SUBMITTED = "SUBMITTED"
    IN_REVIEW = "IN_REVIEW"


# The file types that must be uploaded before submission is allowed
REQUIRED_FILE_TYPES = ["MASTER_APP", "DATA_GATHERING_TOOL"]

# All document types that appear in the offline packet file matrix
ALL_OFFLINE_FILE_TYPES = [
    "MASTER_APP",
    "DATA_GATHERING_TOOL",
    "CENSUS_TEMPLATE",
    "COMMISSION_ACK",
    "ENROLLMENT_FORM",
]


class RequiredFileStatus(BaseModel):
    file_type: str
    label: str
    required: bool
    uploaded: bool
    file_name: str | None = None
    document_id: str | None = None


class OfflinePacketStatusResponse(BaseModel):
    status: OfflinePacketStatus
    is_complete: bool
    files: list[RequiredFileStatus]
    missing_required: list[str]
