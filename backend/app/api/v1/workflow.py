"""Workflow endpoints: manage the onboarding workflow lifecycle and steps."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.domain.models.workflow import StepDataUpdate, WorkflowInstance
from app.domain.services.workflow_service import WorkflowService
from app.infrastructure.database.models.user_orm import UserORM

router = APIRouter(
    prefix="/clients/{client_id}/workflow",
    tags=["workflow"],
)


@router.get("", response_model=WorkflowInstance)
async def get_workflow(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get the workflow instance with all steps for a client."""
    service = WorkflowService(db)
    workflow = await service.get_workflow(client_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found for this client")
    return workflow


@router.post("/start", response_model=WorkflowInstance)
async def start_online_setup(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Start the online setup workflow for a client."""
    service = WorkflowService(db)
    try:
        return await service.start_online_setup(
            client_id=client_id,
            user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/offline", response_model=WorkflowInstance)
async def start_offline_setup(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Start the offline setup workflow for a client."""
    service = WorkflowService(db)
    try:
        return await service.start_offline_setup(
            client_id=client_id,
            user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/steps/{step_id}")
async def get_step_data(
    client_id: UUID,
    step_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get the saved data for a specific workflow step."""
    service = WorkflowService(db)
    try:
        return await service.get_step_data(client_id, step_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/steps/{step_id}")
async def save_step_data(
    client_id: UUID,
    step_id: str,
    body: StepDataUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Save/update the data payload for a workflow step."""
    service = WorkflowService(db)
    try:
        return await service.save_step_data(
            client_id=client_id,
            step_id=step_id,
            data=body.data,
            user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/steps/{step_id}/complete")
async def complete_step(
    client_id: UUID,
    step_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Mark a workflow step as completed."""
    service = WorkflowService(db)
    try:
        return await service.complete_step(
            client_id=client_id,
            step_id=step_id,
            user_id=current_user.id,
            request_ip=request.client.host if request.client else None,
            request_user_agent=request.headers.get("user-agent"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/submit")
async def submit_workflow(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Submit the completed workflow and produce the downstream servicing payload.

    Validates all required steps are completed, marks the workflow as submitted,
    and returns the assembled payload including renewal notification settings.
    """
    service = WorkflowService(db)
    try:
        return await service.submit_workflow(
            client_id=client_id,
            user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/submission")
async def get_submission_payload(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get the downstream servicing payload for a completed workflow.

    Returns the assembled payload that downstream servicing systems use
    for notification scheduling and operations.
    """
    service = WorkflowService(db)
    try:
        return await service.get_submission_payload(client_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/handoff")
async def request_handoff(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Request handoff to the employer for their role-restricted steps."""
    service = WorkflowService(db)
    try:
        result = await service.request_employer_handoff(
            client_id=client_id,
            user_id=current_user.id,
            broker_name=f"{current_user.first_name} {current_user.last_name}",
        )
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/steps/{step_id}/skip")
async def skip_step(
    client_id: UUID,
    step_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Skip a workflow step."""
    service = WorkflowService(db)
    try:
        return await service.skip_step(
            client_id=client_id,
            step_id=step_id,
            user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
