from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserRole(str, Enum):
    EMPLOYER = "EMPLOYER"
    BROKER = "BROKER"
    GA = "GA"
    TPA = "TPA"
    BROKER_TPA_GA_ADMIN = "BROKER_TPA_GA_ADMIN"


class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    first_name: str
    last_name: str
    role: UserRole
    is_active: bool = True
    created_at: datetime | None = None


class UserCreate(BaseModel):
    email: str
    first_name: str
    last_name: str
    password: str
    role: UserRole


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    role: str
    exp: int
