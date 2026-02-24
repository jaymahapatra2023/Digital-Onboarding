from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AccessRoleType(str, Enum):
    EMPLOYER = "EMPLOYER"
    BROKER = "BROKER"
    GENERAL_AGENT = "GENERAL_AGENT"
    THIRD_PARTY_ADMIN = "THIRD_PARTY_ADMIN"
    BROKER_TPA_GA_ADMIN = "BROKER_TPA_GA_ADMIN"


class ClientAccess(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    user_id: UUID | None = None
    role_type: AccessRoleType
    first_name: str
    last_name: str
    email: str
    has_ongoing_maintenance_access: bool = False
    is_account_executive: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ClientAccessCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    role_type: AccessRoleType
    has_ongoing_maintenance_access: bool = False
    is_account_executive: bool = False
    user_id: UUID | None = None


class ClientAccessUpdate(BaseModel):
    first_name: str
    last_name: str
    email: str
    role_type: AccessRoleType
    has_ongoing_maintenance_access: bool = False
    is_account_executive: bool = False
