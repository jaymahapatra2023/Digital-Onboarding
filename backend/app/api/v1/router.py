"""Main v1 API router that aggregates all sub-routers."""

from fastapi import APIRouter

from app.api.v1.access import router as access_router
from app.api.v1.auth import router as auth_router
from app.api.v1.clients import router as clients_router
from app.api.v1.documents import router as documents_router
from app.api.v1.offline_packet import router as offline_packet_router
from app.api.v1.users import router as users_router
from app.api.v1.workflow import router as workflow_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(clients_router)
api_router.include_router(access_router)
api_router.include_router(workflow_router)
api_router.include_router(documents_router)
api_router.include_router(offline_packet_router)
api_router.include_router(users_router)

# Backward-compatible alias: main.py imports ``router`` from this module.
router = api_router
