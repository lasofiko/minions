from sqlalchemy.orm import Session
from app.models.links import Link
from app.schemas.links import LinkCreate
from app.utils.short_link import generate_random_code

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