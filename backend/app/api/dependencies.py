import uuid
from collections.abc import AsyncGenerator, Callable
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.database.session import get_db_session

security_scheme = HTTPBearer()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Alias for get_db_session to keep a short, conventional name."""
    async for session in get_db_session():
        yield session


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> UserORM:
    """Decode the JWT from the Authorization header and return the user.

    Raises:
        HTTPException 401: If the token is invalid, expired, or the user
            does not exist / is inactive.
    """
    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        sub: str | None = payload.get("sub")
        if sub is None:
            raise credentials_exception
        user_id = uuid.UUID(sub)
    except (JWTError, ValueError):
        raise credentials_exception

    result = await db.execute(select(UserORM).where(UserORM.id == user_id))
    user: UserORM | None = result.scalars().first()

    if user is None or not user.is_active:
        raise credentials_exception

    return user


def require_role(*allowed_roles: str) -> Callable[..., Any]:
    """Dependency factory that restricts access to users with specific roles.

    Usage::

        @router.get("/admin-only", dependencies=[Depends(require_role("admin"))])
        async def admin_endpoint(): ...

    Or inject the user directly::

        @router.get("/admin-only")
        async def admin_endpoint(
            user: UserORM = Depends(require_role("admin")),
        ): ...
    """

    async def _check_role(
        current_user: UserORM = Depends(get_current_user),
    ) -> UserORM:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return _check_role
