"""User lookup endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.domain.models.user import User
from app.infrastructure.database.models.user_orm import UserORM

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/search", response_model=list[User])
async def search_users(
    q: str = Query(..., min_length=1, description="Search term for name or email"),
    db: AsyncSession = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Search active users by first name, last name, or email (case-insensitive)."""
    pattern = f"%{q}%"
    result = await db.execute(
        select(UserORM)
        .where(
            UserORM.is_active.is_(True),
            (
                UserORM.first_name.ilike(pattern)
                | UserORM.last_name.ilike(pattern)
                | UserORM.email.ilike(pattern)
            ),
        )
        .limit(20)
    )
    return [User.model_validate(row) for row in result.scalars().all()]
