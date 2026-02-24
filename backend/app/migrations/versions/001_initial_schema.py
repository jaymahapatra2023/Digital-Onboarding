"""Initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Clients
    op.create_table(
        'clients',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('client_name', sa.String(255), nullable=False),
        sa.Column('primary_address_street', sa.String(255)),
        sa.Column('primary_address_city', sa.String(100)),
        sa.Column('primary_address_state', sa.String(50)),
        sa.Column('primary_address_zip', sa.String(20)),
        sa.Column('primary_address_country', sa.String(50), server_default='USA'),
        sa.Column('unique_id', sa.String(50), unique=True, nullable=False),
        sa.Column('eligible_employees', sa.Integer()),
        sa.Column('status', sa.String(50), server_default='APPLICATION_NOT_STARTED'),
        sa.Column('group_id', sa.String(50)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_clients_status', 'clients', ['status'])
    op.create_index('idx_clients_unique_id', 'clients', ['unique_id'])

    # Client Access
    op.create_table(
        'client_access',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('client_id', UUID(as_uuid=True), sa.ForeignKey('clients.id'), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('role_type', sa.String(50), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('has_ongoing_maintenance_access', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('is_account_executive', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('client_id', 'email', name='uq_client_access_client_email'),
    )
    op.create_index('idx_client_access_client', 'client_access', ['client_id'])

    # Workflow Definitions
    op.create_table(
        'workflow_definitions',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('version', sa.Integer(), server_default=sa.text('1')),
        sa.Column('steps', JSONB, nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Workflow Instances
    op.create_table(
        'workflow_instances',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('client_id', UUID(as_uuid=True), sa.ForeignKey('clients.id'), nullable=False),
        sa.Column('workflow_definition_id', UUID(as_uuid=True), sa.ForeignKey('workflow_definitions.id'), nullable=False),
        sa.Column('status', sa.String(30), server_default='NOT_STARTED'),
        sa.Column('current_step_id', sa.String(50)),
        sa.Column('is_offline', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('started_at', sa.DateTime(timezone=True)),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('client_id', 'workflow_definition_id', name='uq_workflow_instance_client_def'),
    )
    op.create_index('idx_workflow_instances_client', 'workflow_instances', ['client_id'])

    # Workflow Step Instances
    op.create_table(
        'workflow_step_instances',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('workflow_instance_id', UUID(as_uuid=True), sa.ForeignKey('workflow_instances.id'), nullable=False),
        sa.Column('step_id', sa.String(50), nullable=False),
        sa.Column('step_order', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(30), server_default='PENDING'),
        sa.Column('assigned_to_user_id', UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('assigned_role', sa.String(50)),
        sa.Column('data', JSONB, server_default=sa.text("'{}'::jsonb")),
        sa.Column('started_at', sa.DateTime(timezone=True)),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        sa.Column('last_saved_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('workflow_instance_id', 'step_id', name='uq_workflow_step_instance_wf_step'),
    )
    op.create_index('idx_workflow_steps_instance', 'workflow_step_instances', ['workflow_instance_id'])

    # Documents
    op.create_table(
        'documents',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('client_id', UUID(as_uuid=True), sa.ForeignKey('clients.id'), nullable=False),
        sa.Column('workflow_instance_id', UUID(as_uuid=True), sa.ForeignKey('workflow_instances.id')),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_description', sa.Text()),
        sa.Column('file_type', sa.String(50), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_size_bytes', sa.BigInteger()),
        sa.Column('mime_type', sa.String(100)),
        sa.Column('uploaded_by_user_id', UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false')),
    )
    op.create_index('idx_documents_client', 'documents', ['client_id'])

    # Event Log
    op.create_table(
        'event_log',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('payload', JSONB, nullable=False),
        sa.Column('client_id', UUID(as_uuid=True), sa.ForeignKey('clients.id')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_event_log_client', 'event_log', ['client_id'])
    op.create_index('idx_event_log_type', 'event_log', ['event_type'])


def downgrade() -> None:
    op.drop_table('event_log')
    op.drop_table('documents')
    op.drop_table('workflow_step_instances')
    op.drop_table('workflow_instances')
    op.drop_table('workflow_definitions')
    op.drop_table('client_access')
    op.drop_table('clients')
    op.drop_table('users')
