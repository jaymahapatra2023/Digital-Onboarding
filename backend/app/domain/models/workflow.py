from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class WorkflowStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    OFFLINE = "OFFLINE"
    OFFLINE_SUBMITTED = "OFFLINE_SUBMITTED"
    OFFLINE_IN_REVIEW = "OFFLINE_IN_REVIEW"


class StepStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class WorkflowStepDefinition(BaseModel):
    step_id: str
    order: int
    name: str
    allowed_roles: list[str]
    required: bool = True


class WorkflowDefinition(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    version: int
    steps: list[WorkflowStepDefinition] | list[dict]
    is_active: bool = True


class WorkflowStepInstance(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workflow_instance_id: UUID
    step_id: str
    step_order: int
    status: StepStatus = StepStatus.PENDING
    assigned_to_user_id: UUID | None = None
    assigned_role: str | None = None
    allowed_roles: list[str] = []
    data: dict | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    last_saved_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class WorkflowInstance(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    workflow_definition_id: UUID
    status: WorkflowStatus = WorkflowStatus.NOT_STARTED
    current_step_id: str | None = None
    is_offline: bool = False
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    step_instances: list[WorkflowStepInstance] = []


class WorkflowInstanceResponse(BaseModel):
    id: UUID
    client_id: UUID
    workflow_definition_id: UUID
    status: WorkflowStatus
    current_step_id: str | None = None
    is_offline: bool = False
    started_at: datetime | None = None
    completed_at: datetime | None = None
    step_instances: list[WorkflowStepInstance] = []


class StepDataUpdate(BaseModel):
    data: dict
