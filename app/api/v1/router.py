from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.links import router as links_router

router = APIRouter()

router.include_router(auth_router, tags=['authentication'])
router.include_router(links_router)