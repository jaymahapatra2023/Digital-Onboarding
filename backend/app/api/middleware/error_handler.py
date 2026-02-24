"""Global exception handlers that return structured ErrorResponse JSON."""

import logging
import traceback

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

RECOVERY_HINTS: dict[str, str] = {
    "locked": "This item is locked and cannot be modified.",
    "already exists": "This resource already exists. Refresh the page to continue.",
    "not found": "The requested resource was not found. It may have been removed.",
    "incomplete required steps": "Complete all required steps before submitting.",
    "No workflow found": "Start the group setup first from the case list.",
    "Insufficient permissions": "You do not have permission. Contact your administrator.",
}


class ErrorResponse(BaseModel):
    error_code: str
    message: str
    recovery_hint: str | None = None


def _match_recovery_hint(detail: str) -> str | None:
    """Return the first matching recovery hint for a given error detail string."""
    detail_lower = detail.lower()
    for pattern, hint in RECOVERY_HINTS.items():
        if pattern.lower() in detail_lower:
            return hint
    return None


def register_exception_handlers(app: FastAPI) -> None:
    """Attach global exception handlers to the FastAPI application."""

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        recovery_hint = _match_recovery_hint(detail)
        body = ErrorResponse(
            error_code="HTTP_ERROR",
            message=detail,
            recovery_hint=recovery_hint,
        )
        return JSONResponse(status_code=exc.status_code, content=body.model_dump())

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        messages = []
        for err in exc.errors():
            loc = " → ".join(str(l) for l in err["loc"])
            messages.append(f"{loc}: {err['msg']}")
        body = ErrorResponse(
            error_code="VALIDATION_ERROR",
            message="; ".join(messages),
            recovery_hint="Check the submitted data and correct any invalid fields.",
        )
        return JSONResponse(status_code=422, content=body.model_dump())

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled exception: %s\n%s", exc, traceback.format_exc())
        body = ErrorResponse(
            error_code="INTERNAL_ERROR",
            message="An unexpected error occurred. Please try again later.",
            recovery_hint="If the problem persists, contact support.",
        )
        return JSONResponse(status_code=500, content=body.model_dump())
