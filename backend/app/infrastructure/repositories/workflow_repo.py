"""Repository for Workflow entity data access."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.database.models.workflow_orm import (
    WorkflowDefinitionORM,
    WorkflowInstanceORM,
    WorkflowStepInstanceORM,
)


class WorkflowRepository:
    """Handles all database operations for workflow-related tables."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ------------------------------------------------------------------
    # WorkflowDefinition helpers
    # ------------------------------------------------------------------

    async def get_definition(
        self, name: str = "group_setup"
    ) -> WorkflowDefinitionORM | None:
        """Return the currently active workflow definition for the given name."""
        result = await self.session.execute(
            select(WorkflowDefinitionORM)
            .where(
                WorkflowDefinitionORM.name == name,
                WorkflowDefinitionORM.is_active.is_(True),
            )
            .order_by(WorkflowDefinitionORM.version.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    # ------------------------------------------------------------------
    # WorkflowInstance helpers
    # ------------------------------------------------------------------

    async def get_instance_by_client(
        self, client_id: UUID
    ) -> WorkflowInstanceORM | None:
        """Return the workflow instance for a client, eagerly loading step_instances."""
        result = await self.session.execute(
            select(WorkflowInstanceORM)
            .where(WorkflowInstanceORM.client_id == client_id)
            .options(selectinload(WorkflowInstanceORM.step_instances))
        )
        return result.scalar_one_or_none()

    async def create_instance(
        self, client_id: UUID, definition_id: UUID
    ) -> WorkflowInstanceORM:
        """Create a new workflow instance and flush to obtain generated defaults."""
        instance = WorkflowInstanceORM(
            client_id=client_id,
            workflow_definition_id=definition_id,
        )
        self.session.add(instance)
        await self.session.flush()
        return instance

    async def update_instance(
        self, instance_id: UUID, **kwargs
    ) -> WorkflowInstanceORM | None:
        """Update fields on an existing workflow instance.

        Returns the updated ORM instance or ``None`` if not found.
        """
        result = await self.session.execute(
            select(WorkflowInstanceORM).where(
                WorkflowInstanceORM.id == instance_id
            )
        )
        instance = result.scalar_one_or_none()
        if instance is None:
            return None
        for key, value in kwargs.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        await self.session.flush()
        return instance

    # ------------------------------------------------------------------
    # WorkflowStepInstance helpers
    # ------------------------------------------------------------------

    async def create_step_instance(
        self,
        workflow_instance_id: UUID,
        step_id: str,
        step_order: int,
        assigned_role: str | None = None,
    ) -> WorkflowStepInstanceORM:
        """Create a new workflow step instance and flush."""
        step_instance = WorkflowStepInstanceORM(
            workflow_instance_id=workflow_instance_id,
            step_id=step_id,
            step_order=step_order,
            assigned_role=assigned_role,
        )
        self.session.add(step_instance)
        await self.session.flush()
        return step_instance

    async def get_step_instance(
        self, workflow_instance_id: UUID, step_id: str
    ) -> WorkflowStepInstanceORM | None:
        """Look up a step instance by its composite (workflow_instance_id, step_id)."""
        result = await self.session.execute(
            select(WorkflowStepInstanceORM).where(
                WorkflowStepInstanceORM.workflow_instance_id == workflow_instance_id,
                WorkflowStepInstanceORM.step_id == step_id,
            )
        )
        return result.scalar_one_or_none()

    async def update_step_instance(
        self, step_instance_id: UUID, **kwargs
    ) -> WorkflowStepInstanceORM | None:
        """Update fields on an existing step instance.

        Returns the updated ORM instance or ``None`` if not found.
        """
        result = await self.session.execute(
            select(WorkflowStepInstanceORM).where(
                WorkflowStepInstanceORM.id == step_instance_id
            )
        )
        step_instance = result.scalar_one_or_none()
        if step_instance is None:
            return None
        for key, value in kwargs.items():
            if hasattr(step_instance, key):
                setattr(step_instance, key, value)
        await self.session.flush()
        return step_instance
