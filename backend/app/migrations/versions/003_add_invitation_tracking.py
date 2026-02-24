"""Add invitation tracking columns to client_access

Revision ID: 003
Revises: 002
Create Date: 2026-02-23
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'client_access',
        sa.Column('invitation_status', sa.String(20), server_default='PENDING', nullable=False),
    )
    op.add_column(
        'client_access',
        sa.Column('invitation_token', sa.String(255), nullable=True),
    )
    op.add_column(
        'client_access',
        sa.Column('invitation_sent_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        'client_access',
        sa.Column('invitation_expires_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        'client_access',
        sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        'idx_client_access_invitation_token',
        'client_access',
        ['invitation_token'],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index('idx_client_access_invitation_token', table_name='client_access')
    op.drop_column('client_access', 'accepted_at')
    op.drop_column('client_access', 'invitation_expires_at')
    op.drop_column('client_access', 'invitation_sent_at')
    op.drop_column('client_access', 'invitation_token')
    op.drop_column('client_access', 'invitation_status')
