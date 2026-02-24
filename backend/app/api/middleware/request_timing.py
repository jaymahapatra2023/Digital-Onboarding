import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("request_timing")

SLOW_REQUEST_THRESHOLD_MS = 2000


class RequestTimingMiddleware(BaseHTTPMiddleware):
    """Middleware that logs request duration and adds X-Response-Time-Ms header."""

    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        response.headers["X-Response-Time-Ms"] = f"{duration_ms:.1f}"

        path = request.url.path
        method = request.method
        status = response.status_code

        if duration_ms > SLOW_REQUEST_THRESHOLD_MS:
            logger.warning(
                "Slow request: %s %s -> %d (%.1fms)",
                method, path, status, duration_ms,
            )
        else:
            logger.debug(
                "%s %s -> %d (%.1fms)",
                method, path, status, duration_ms,
            )

        return response
