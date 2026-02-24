import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.client_orm import ClientORM
    from app.infrastructure.database.models.user_orm import UserORM


class DocumentORM(Base):
    """ORM model for the documents table."""

    __tablename__ = "documents"

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
    workflow_instance_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_instances.id"),
        nullable=True,
    )
    file_name: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    file_description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )
    file_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    file_path: Mapped[str] = mapped_column(
        String(500), nullable=False
    )
    file_size_bytes: Mapped[Optional[int]] = mapped_column(
        BigInteger, nullable=True
    )
    mime_type: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    uploaded_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false")
    )

    # ---- relationships ----
    client: Mapped["ClientORM"] = relationship(
        "ClientORM", back_populates="documents", lazy="selectin"
    )
    uploaded_by: Mapped[Optional["UserORM"]] = relationship(
        "UserORM", lazy="selectin"
    )

    def __repr__(self) -> str:
        return (
            f"<DocumentORM(id={self.id}, file_name='{self.file_name}', "
            f"file_type='{self.file_type}', client_id={self.client_id})>"
        )
