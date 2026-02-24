import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.access_orm import ClientAccessORM
    from app.infrastructure.database.models.document_orm import DocumentORM
    from app.infrastructure.database.models.user_orm import UserORM
    from app.infrastructure.database.models.workflow_orm import WorkflowInstanceORM


class ClientORM(Base):
    """ORM model for the clients table."""

    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    client_name: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    primary_address_street: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    primary_address_city: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    primary_address_state: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )
    primary_address_zip: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )
    primary_address_country: Mapped[Optional[str]] = mapped_column(
        String(50), default="USA", server_default=text("'USA'")
    )
    unique_id: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False
    )
    eligible_employees: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="APPLICATION_NOT_STARTED",
        server_default=text("'APPLICATION_NOT_STARTED'"),
    )
    group_id: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    assigned_to_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # ---- relationships ----
    assigned_user: Mapped[Optional["UserORM"]] = relationship(
        "UserORM", foreign_keys=[assigned_to_user_id], lazy="selectin"
    )
    access_entries: Mapped[List["ClientAccessORM"]] = relationship(
        "ClientAccessORM", back_populates="client", lazy="selectin"
    )
    workflow_instances: Mapped[List["WorkflowInstanceORM"]] = relationship(
        "WorkflowInstanceORM", back_populates="client", lazy="selectin"
    )
    documents: Mapped[List["DocumentORM"]] = relationship(
        "DocumentORM", back_populates="client", lazy="selectin"
    )

    def __repr__(self) -> str:
        return (
            f"<ClientORM(id={self.id}, client_name='{self.client_name}', "
            f"unique_id='{self.unique_id}', status='{self.status}')>"
        )
