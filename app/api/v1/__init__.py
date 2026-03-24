from fastapi import APIRouter
from app.api.v1 import auth
from app.api.v1.router import router as links_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(links_router)