from fastapi import APIRouter

from app.api.endpoints.ai import router as ai_router
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.plan import router as plan_router
from app.api.endpoints.recipes import router as recipes_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(recipes_router)
router.include_router(plan_router)
router.include_router(ai_router)
