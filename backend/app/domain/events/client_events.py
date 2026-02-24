from uuid import UUID

from .base import DomainEvent


class CaseMarkedSold(DomainEvent):
    client_id: UUID


class AccessAssigned(DomainEvent):
    client_id: UUID
    access_id: UUID
    email: str
    role_type: str


class AccessRevoked(DomainEvent):
    client_id: UUID
    access_id: UUID
    email: str


class GroupSetupStarted(DomainEvent):
    client_id: UUID
    workflow_instance_id: UUID


class OfflineSetupChosen(DomainEvent):
    client_id: UUID
    workflow_instance_id: UUID


class CaseOwnerAssigned(DomainEvent):
    client_id: UUID
    assigned_to_user_id: UUID | None = None
