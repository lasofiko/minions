from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings


def _to_async_url(url: str) -> str:
    if url.startswith("sqlite:///") and "+aiosqlite" not in url:
        return "sqlite+aiosqlite:///" + url[len("sqlite:///"):]
    return url


engine = create_async_engine(_to_async_url(settings.DATABASE_URL))

SessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autoflush=False,
)

Base = declarative_base()


async def get_db():
    async with SessionLocal() as session:
        yield session
