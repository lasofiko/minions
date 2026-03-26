from sqlalchemy import Integer, String, Column, DateTime, ForeignKey
from zoneinfo import ZoneInfo
from datetime import datetime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Link(Base):
    __tablename__ = "links"

    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(String, nullable=False)
    short_code = Column(String, unique=True, index=True, nullable=False)
    qrcode_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now(ZoneInfo("Europe/Moscow")))
    clicks_count = Column(Integer, default=0)
    last_clicked_at = Column(DateTime, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="links")