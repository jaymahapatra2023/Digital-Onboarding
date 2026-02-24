from datetime import datetime
from enum import Enum
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ClientStatus(str, Enum):
    APPLICATION_NOT_STARTED = "APPLICATION_NOT_STARTED"
    APPLICATION_IN_PROGRESS = "APPLICATION_IN_PROGRESS"
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
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ClientListResponse(BaseModel):
    items: list[Client]
    total: int
    page: int
    per_page: int
    pages: int


class ClientListParams(BaseModel):
    search: str | None = None
    status: ClientStatus | None = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
    sort_by: str = "created_at"
    sort_order: Literal["asc", "desc"] = "desc"
