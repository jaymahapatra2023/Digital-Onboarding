import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.client_orm import ClientORM
    from app.infrastructure.database.models.user_orm import UserORM


class ClientAccessORM(Base):
    """ORM model for the client_access table."""

    __tablename__ = "client_access"
    __table_args__ = (
        UniqueConstraint("client_id", "email", name="uq_client_access_client_email"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id"),
        nullable=False,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    role_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    first_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    last_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    has_ongoing_maintenance_access: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false")
    )
    is_account_executive: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # ---- invitation tracking ----
    invitation_status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=text("'PENDING'")
    )
    invitation_token: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, unique=True, index=True
    )
    invitation_sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    invitation_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    accepted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ---- relationships ----
    client: Mapped["ClientORM"] = relationship(
        "ClientORM", back_populates="access_entries", lazy="selectin"
    )
    user: Mapped[Optional["UserORM"]] = relationship(
        "UserORM", lazy="selectin"
    )

    def __repr__(self) -> str:
        return (
            f"<ClientAccessORM(id={self.id}, client_id={self.client_id}, "
            f"email='{self.email}', role_type='{self.role_type}')>"
        )
