from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.links_service import get_url_and_update_stats

router = APIRouter()

@router.get("/{short_code}", tags=["redirect"])
def redirect_to_original(short_code: str, db: Session = Depends(get_db)):
    original_url = get_url_and_update_stats(db, short_code)

    if not original_url:
        raise HTTPException(status_code=404, detail="Короткая ссылка не существует")

    return RedirectResponse(url=original_url)