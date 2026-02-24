import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.client_orm import ClientORM
    from app.infrastructure.database.models.user_orm import UserORM


class WorkflowDefinitionORM(Base):
    """ORM model for the workflow_definitions table."""

    __tablename__ = "workflow_definitions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    version: Mapped[int] = mapped_column(
        Integer, default=1, server_default=text("1")
    )
    steps: Mapped[dict] = mapped_column(
        JSONB, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=text("true")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return (
            f"<WorkflowDefinitionORM(id={self.id}, name='{self.name}', "
            f"version={self.version}, is_active={self.is_active})>"
        )


class WorkflowInstanceORM(Base):
    """ORM model for the workflow_instances table."""

    __tablename__ = "workflow_instances"
    __table_args__ = (
        UniqueConstraint(
            "client_id",
            "workflow_definition_id",
            name="uq_workflow_instance_client_definition",
        ),
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
    workflow_definition_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_definitions.id"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(30), default="NOT_STARTED", server_default=text("'NOT_STARTED'")
    )
    current_step_id: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )
    is_offline: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false")
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # ---- relationships ----
    client: Mapped["ClientORM"] = relationship(
        "ClientORM", back_populates="workflow_instances", lazy="selectin"
    )
    definition: Mapped["WorkflowDefinitionORM"] = relationship(
        "WorkflowDefinitionORM", lazy="selectin"
    )
    step_instances: Mapped[List["WorkflowStepInstanceORM"]] = relationship(
        "WorkflowStepInstanceORM",
        back_populates="workflow_instance",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<WorkflowInstanceORM(id={self.id}, client_id={self.client_id}, "
            f"status='{self.status}', current_step_id='{self.current_step_id}')>"
        )


class WorkflowStepInstanceORM(Base):
    """ORM model for the workflow_step_instances table."""

    __tablename__ = "workflow_step_instances"
    __table_args__ = (
        UniqueConstraint(
            "workflow_instance_id",
            "step_id",
            name="uq_step_instance_workflow_step",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    workflow_instance_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_instances.id"),
        nullable=False,
    )
    step_id: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    step_order: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(30), default="PENDING", server_default=text("'PENDING'")
    )
    assigned_to_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    assigned_role: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )
    data: Mapped[dict] = mapped_column(
        JSONB, default=dict, server_default=text("'{}'::jsonb")
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_saved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # ---- relationships ----
    workflow_instance: Mapped["WorkflowInstanceORM"] = relationship(
        "WorkflowInstanceORM", back_populates="step_instances", lazy="selectin"
    )
    assigned_user: Mapped[Optional["UserORM"]] = relationship(
        "UserORM", lazy="selectin"
    )

    def __repr__(self) -> str:
        return (
            f"<WorkflowStepInstanceORM(id={self.id}, step_id='{self.step_id}', "
            f"step_order={self.step_order}, status='{self.status}')>"
        )
