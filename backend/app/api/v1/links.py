from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.links import Link as LinkSchema, LinkCreate, LinkUpdate
from app.services.links_service import create_link, get_user_stats, delete_link
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.links import Link

router = APIRouter(prefix="/links", tags=["Links"])

@router.put("/{short_code}", response_model=LinkSchema)
def update_link_endpoint(
    short_code: str,
    link_in: LinkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    link = db.query(Link).filter_by(short_code=short_code, owner_id=current_user.id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Ссылка не найдена")
    link.description = link_in.description
    db.commit()
    db.refresh(link)
    return link

@router.post("/create", response_model=LinkSchema, status_code=status.HTTP_201_CREATED)
def create_link_endpoint(
    link_in: LinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return create_link(db, link_in, owner_id=current_user.id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Не удалось создать ссылку: {str(e)}")

@router.get("/my", response_model=list[LinkSchema])
def get_my_links_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_stats(db, owner_id=current_user.id)

@router.delete("/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_link_endpoint(short_code: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    success = delete_link(db, short_code=short_code, owner_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Ссылка не найдена или у вас нет прав на её удаление")
    return None