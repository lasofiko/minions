from sqlalchemy.orm import Session
from app.models.links import Link
from app.schemas.links import LinkCreate
from app.utils.short_link import generate_random_code
from datetime import datetime
from zoneinfo import ZoneInfo

def create_link(db: Session, link_schema: LinkCreate, owner_id: int):
    while True:
        code = generate_random_code()
        existing = db.query(Link).filter_by(short_code=code).first()

        if not existing:
            break

    db_link = Link(
        original_url=link_schema.original_url,
        short_code=code,
        owner_id=owner_id
    )

    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link

def get_url_and_update_stats(db: Session, short_code: str):
    link = db.query(Link).filter_by(short_code=short_code).first()

    if link:
        link.clicks_count += 1
        link.last_clicked_at = datetime.now(ZoneInfo("Europe/Moscow"))

        db.commit()
        db.refresh(link)

        return link.original_url

    return None

def get_user_stats(db: Session, owner_id: int):
    return db.query(Link).filter_by(owner_id=owner_id).order_by(Link.created_at.desc()).all()

def delete_link(db: Session, short_code: str, owner_id: int):
    link = db.query(Link).filter_by(short_code=short_code, owner_id=owner_id).first()
    if not link:
        return False

    db.delete(link)
    db.commit()
    return True
