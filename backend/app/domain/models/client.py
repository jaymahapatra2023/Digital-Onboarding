from datetime import datetime
from enum import Enum
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ClientStatus(str, Enum):
    APPLICATION_NOT_STARTED = "APPLICATION_NOT_STARTED"
    APPLICATION_IN_PROGRESS = "APPLICATION_IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class Client(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_name: str
    primary_address_street: str | None = None
    primary_address_city: str | None = None
    primary_address_state: str | None = None
    primary_address_zip: str | None = None
    primary_address_country: str | None = "USA"
    unique_id: str
    eligible_employees: int | None = None
    status: ClientStatus = ClientStatus.APPLICATION_NOT_STARTED
    group_id: str | None = None
    assigned_to_user_id: UUID | None = None
    assigned_user_name: str | None = None
    days_since_update: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ClientWithMetrics(Client):
    is_stale: bool = False
    is_offline: bool | None = None


class ClientListResponse(BaseModel):
    items: list[ClientWithMetrics]
    total: int
    page: int
    per_page: int
    pages: int


class ClientListParams(BaseModel):
    search: str | None = None
    status: ClientStatus | None = None
    assigned_to_user_id: UUID | None = None
    stale: bool | None = None
    stale_threshold_days: int = 7
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
    sort_by: str = "created_at"
    sort_order: Literal["asc", "desc"] = "desc"


# --- Story 4: Case Readiness ---

class ReadinessBlocker(BaseModel):
    code: str
    message: str


class CaseReadiness(BaseModel):
    is_ready: bool
    blockers: list[ReadinessBlocker]


# --- Story 5: Timeline ---

class TimelineEvent(BaseModel):
    id: UUID
    event_type: str
    description: str
    icon: str
    user_id: UUID | None = None
    user_name: str | None = None
    created_at: datetime
    payload: dict | None = None

    @staticmethod
    def event_descriptions() -> dict[str, tuple[str, str]]:
        """Map event_type -> (description_template, material_icon)."""
        return {
            "CaseMarkedSold": ("Case marked as sold", "sell"),
            "AccessAssigned": ("Access granted to {email} as {role_type}", "person_add"),
            "AccessRevoked": ("Access revoked for {email}", "person_remove"),
            "GroupSetupStarted": ("Online group setup started", "play_arrow"),
            "OfflineSetupChosen": ("Offline setup initiated", "description"),
            "WorkflowStepStarted": ("Workflow step started: {step_id}", "start"),
            "WorkflowStepCompleted": ("Workflow step completed: {step_id}", "check_circle"),
            "WorkflowStepSaved": ("Workflow step saved: {step_id}", "save"),
            "WorkflowStepSkipped": ("Workflow step skipped: {step_id}", "skip_next"),
            "DocumentUploaded": ("Document uploaded: {file_name}", "upload_file"),
            "DocumentDeleted": ("Document deleted: {file_name}", "delete"),
            "OfflinePacketSubmitted": ("Offline packet submitted for review", "send"),
            "CaseOwnerAssigned": ("Case assigned to owner", "assignment_ind"),
            "InvitationSent": ("Invitation sent to {email} ({role_type})", "send"),
            "AccessUnlocked": ("Access unlocked for {email}", "lock_open"),
            "WorkflowSubmitted": ("Workflow submitted for downstream processing", "send"),
            "MasterAppSigned": ("Master Application signed by {accepted_by}", "draw"),
            "EnrollmentTransitionInitiated": ("Enrollment transition initiated (group: {group_number})", "swap_horiz"),
            "WorkflowHandoffRequested": ("Workflow handed off to {target_role} ({target_email})", "forward_to_inbox"),
        }


class TimelineResponse(BaseModel):
    client_id: UUID
    events: list[TimelineEvent]
    total: int


# --- Diagnostics ---

class StepDiagnostic(BaseModel):
    step_id: str
    step_name: str
    status: str
    started_at: datetime | None = None
    completed_at: datetime | None = None
    last_saved_at: datetime | None = None
    days_in_current_status: int = 0


class CaseDiagnostics(BaseModel):
    client_id: UUID
    client_name: str
    status: str
    workflow_status: str | None = None
    current_step_id: str | None = None
    steps: list[StepDiagnostic] = []
    last_activity: datetime | None = None
    days_since_update: int = 0
    is_stale: bool = False
    blockers: list[str] = []
