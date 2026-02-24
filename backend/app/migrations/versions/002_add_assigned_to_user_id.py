"""Add assigned_to_user_id to clients

Revision ID: 002
Revises: 001
Create Date: 2026-02-23
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'clients',
        sa.Column('assigned_to_user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
    )
    op.create_index('idx_clients_assigned_to_user', 'clients', ['assigned_to_user_id'])


def downgrade() -> None:
    op.drop_index('idx_clients_assigned_to_user', table_name='clients')
    op.drop_column('clients', 'assigned_to_user_id')
