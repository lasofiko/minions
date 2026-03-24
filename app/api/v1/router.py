from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.links import Link as LinkSchema,  LinkCreate
from app.services.links_service import create_link
from app.core.database import get_db
from app.models.user import User
from app.api.v1.auth import get_current_user, router as auth_router

router = APIRouter()

router.include_router(auth_router)

@router.post("/links", response_model=LinkSchema, tags=['links'])
def create_link_endpoint(link_in: LinkCreate, db: Session=Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        new_link = create_link(db, link_in, owner_id=current_user.id)
        return new_link
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Не удалось создать ссылку: {str(e)}")
