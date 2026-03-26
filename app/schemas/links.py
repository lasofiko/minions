from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LinkCreate(BaseModel):
    original_url: str


class Link(BaseModel):
    id: int
    original_url: str
    short_code: str
    qrcode_path: Optional[str] = None
    clicks_count: int
    created_at: datetime
    last_clicked_at: Optional[datetime] = None
    owner_id: int

    class Config:
        from_attributes = True