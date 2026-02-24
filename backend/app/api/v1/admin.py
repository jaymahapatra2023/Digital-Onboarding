"""Admin endpoints: SLA alerts and dashboard metrics."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, require_role
from app.config import settings
from app.infrastructure.database.models.client_orm import ClientORM
from app.infrastructure.database.models.event_log_orm import EventLogORM
from app.infrastructure.database.models.workflow_orm import (
    WorkflowInstanceORM,
    WorkflowStepInstanceORM,
)

router = APIRouter(prefix="/admin", tags=["admin"])


# --- Response models ---

class SlaAlert(BaseModel):
    client_id: str
    client_name: str
    status: str
    days_stale: int
    severity: str  # "warning" | "critical"


class SlaAlertsResponse(BaseModel):
    alerts: list[SlaAlert]
    total: int


class StuckStep(BaseModel):
    client_id: str
    client_name: str
    step_id: str
    days_stuck: int


class DashboardMetrics(BaseModel):
    total_cases: int
    by_status: dict[str, int]
    stuck_steps: list[StuckStep]
    stale_cases: list[SlaAlert]
    avg_cycle_time_days: float | None = None
    submissions_last_7_days: int
    submissions_last_30_days: int


# --- Endpoints ---

@router.get("/sla/alerts", response_model=SlaAlertsResponse)
async def get_sla_alerts(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("BROKER_TPA_GA_ADMIN")),
):
    """Return cases that exceed SLA warning/critical thresholds."""
    now = datetime.now(timezone.utc)
    warning_cutoff = now - timedelta(days=settings.SLA_WARNING_DAYS)

    query = (
        select(ClientORM)
        .where(ClientORM.updated_at < warning_cutoff)
        .order_by(ClientORM.updated_at.asc())
    )
    result = await db.execute(query)
    clients = result.scalars().all()

    alerts: list[SlaAlert] = []
    for c in clients:
        days = (now - c.updated_at.replace(tzinfo=timezone.utc)).days if c.updated_at else 0
        severity = "critical" if days >= settings.SLA_CRITICAL_DAYS else "warning"
        alerts.append(SlaAlert(
            client_id=str(c.id),
            client_name=c.client_name,
            status=c.status,
            days_stale=days,
            severity=severity,
        ))

    return SlaAlertsResponse(alerts=alerts, total=len(alerts))


@router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("BROKER_TPA_GA_ADMIN")),
):
    """Aggregate dashboard metrics for admin overview."""
    now = datetime.now(timezone.utc)

    # Total cases
    total_result = await db.execute(select(func.count()).select_from(ClientORM))
    total_cases = total_result.scalar() or 0

    # By status
    status_query = (
        select(ClientORM.status, func.count())
        .group_by(ClientORM.status)
    )
    status_result = await db.execute(status_query)
    by_status = {row[0]: row[1] for row in status_result.all()}

    # Stuck steps: IN_PROGRESS for more than threshold days
    stuck_cutoff = now - timedelta(days=settings.STUCK_STEP_THRESHOLD_DAYS)
    stuck_query = (
        select(WorkflowStepInstanceORM, ClientORM.client_name, ClientORM.id)
        .join(WorkflowInstanceORM, WorkflowStepInstanceORM.workflow_instance_id == WorkflowInstanceORM.id)
        .join(ClientORM, WorkflowInstanceORM.client_id == ClientORM.id)
        .where(
            WorkflowStepInstanceORM.status == "IN_PROGRESS",
            WorkflowStepInstanceORM.started_at < stuck_cutoff,
        )
        .order_by(WorkflowStepInstanceORM.started_at.asc())
    )
    stuck_result = await db.execute(stuck_query)
    stuck_steps: list[StuckStep] = []
    for step, client_name, client_id in stuck_result.all():
        days = (now - step.started_at.replace(tzinfo=timezone.utc)).days if step.started_at else 0
        stuck_steps.append(StuckStep(
            client_id=str(client_id),
            client_name=client_name,
            step_id=step.step_id,
            days_stuck=days,
        ))

    # Stale cases (same as SLA alerts)
    warning_cutoff = now - timedelta(days=settings.SLA_WARNING_DAYS)
    stale_query = (
        select(ClientORM)
        .where(ClientORM.updated_at < warning_cutoff)
        .order_by(ClientORM.updated_at.asc())
    )
    stale_result = await db.execute(stale_query)
    stale_cases: list[SlaAlert] = []
    for c in stale_result.scalars().all():
        days = (now - c.updated_at.replace(tzinfo=timezone.utc)).days if c.updated_at else 0
        severity = "critical" if days >= settings.SLA_CRITICAL_DAYS else "warning"
        stale_cases.append(SlaAlert(
            client_id=str(c.id),
            client_name=c.client_name,
            status=c.status,
            days_stale=days,
            severity=severity,
        ))

    # Avg cycle time: completed workflows (started_at → completed_at)
    cycle_query = (
        select(func.avg(
            func.extract("epoch", WorkflowInstanceORM.completed_at)
            - func.extract("epoch", WorkflowInstanceORM.started_at)
        ))
        .where(
            WorkflowInstanceORM.completed_at.isnot(None),
            WorkflowInstanceORM.started_at.isnot(None),
        )
    )
    cycle_result = await db.execute(cycle_query)
    avg_seconds = cycle_result.scalar()
    avg_cycle_time_days = round(avg_seconds / 86400, 1) if avg_seconds else None

    # Submissions last 7 / 30 days
    for days_ago, attr_name in [(7, "submissions_7"), (30, "submissions_30")]:
        cutoff = now - timedelta(days=days_ago)
        sub_query = (
            select(func.count())
            .select_from(EventLogORM)
            .where(
                EventLogORM.event_type == "WorkflowSubmitted",
                EventLogORM.created_at >= cutoff,
            )
        )
        sub_result = await db.execute(sub_query)
        if attr_name == "submissions_7":
            submissions_7 = sub_result.scalar() or 0
        else:
            submissions_30 = sub_result.scalar() or 0

    return DashboardMetrics(
        total_cases=total_cases,
        by_status=by_status,
        stuck_steps=stuck_steps,
        stale_cases=stale_cases,
        avg_cycle_time_days=avg_cycle_time_days,
        submissions_last_7_days=submissions_7,
        submissions_last_30_days=submissions_30,
    )
