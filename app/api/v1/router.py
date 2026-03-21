from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.links import Link as LinkSchema,  LinkCreate
from app.services.links_service import create_link
from app.core.database import get_db

router = APIRouter()

@router.post("/links", response_model=LinkSchema)
def create_link_endpoint(link_in: LinkCreate, db: Session=Depends(get_db)):
    try:
        new_link = create_link(db, link_in, owner_id=1)
        return new_link
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Не удалось создать ссылку: {str(e)}")
