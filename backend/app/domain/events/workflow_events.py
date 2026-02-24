from uuid import UUID

from .base import DomainEvent


class WorkflowStepStarted(DomainEvent):
    workflow_instance_id: UUID
    step_id: str


class WorkflowStepCompleted(DomainEvent):
    workflow_instance_id: UUID
    step_id: str


class WorkflowStepSaved(DomainEvent):
    workflow_instance_id: UUID
    step_id: str


class WorkflowStepSkipped(DomainEvent):
    workflow_instance_id: UUID
    step_id: str


class DocumentUploaded(DomainEvent):
    client_id: UUID
    document_id: UUID
    file_type: str


class WorkflowSubmitted(DomainEvent):
    workflow_instance_id: UUID
    servicing_payload: dict = {}


class DocumentDeleted(DomainEvent):
    client_id: UUID
    document_id: UUID


class MasterAppSigned(DomainEvent):
    workflow_instance_id: UUID
    step_id: str = "master_app"
    accepted_by: str = ""
    signer_ip: str | None = None


class EnrollmentTransitionInitiated(DomainEvent):
    workflow_instance_id: UUID
    group_number: str = ""
    servicing_payload_keys: list[str] = []


class WorkflowHandoffRequested(DomainEvent):
    workflow_instance_id: UUID
    target_role: str
    target_email: str
    target_name: str
    client_name: str
    next_step_name: str
    broker_name: str
