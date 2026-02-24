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


class DocumentDeleted(DomainEvent):
    client_id: UUID
    document_id: UUID
