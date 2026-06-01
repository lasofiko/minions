import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")

TEST_DATABASE_URL = os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/test_db"
)

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.api.deps import get_db_manager
from app.core.database import Base
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
)
from app.db_manager import DBManager
from app.main import app
from app.models.links import Link
from app.models.user import User

engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=NullPool,
)
TestingSessionLocal = async_sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)


@pytest_asyncio.fixture
async def db_session():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client(db_session):
    async def _override_db_manager():
        yield DBManager(db_session)

    app.dependency_overrides[get_db_manager] = _override_db_manager
    try:
        async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
        ) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_db_manager, None)


@pytest_asyncio.fixture
async def db_manager(db_session):
    return DBManager(db_session)


@pytest_asyncio.fixture
async def test_user(db_session):
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("password123"),
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_user_token(test_user):
    return create_access_token(data={"sub": str(test_user.id)})


@pytest_asyncio.fixture
async def auth_headers(test_user_token):
    return {"Authorization": f"Bearer {test_user_token}"}


@pytest_asyncio.fixture
async def refresh_headers(test_user):
    token = create_refresh_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def other_user(db_session):
    user = User(
        username="otheruser",
        email="other@example.com",
        hashed_password=get_password_hash("password123"),
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def other_auth_headers(other_user):
    token = create_access_token(data={"sub": str(other_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def inactive_user(db_session):
    user = User(
        username="inactive",
        email="inactive@example.com",
        hashed_password=get_password_hash("password123"),
        is_active=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_link(db_session, test_user):
    link = Link(
        original_url="https://example.com",
        short_code="abc123",
        owner_id=test_user.id,
        clicks_count=0,
    )
    db_session.add(link)
    await db_session.commit()
    await db_session.refresh(link)
    return link


@pytest_asyncio.fixture
async def other_user_link(db_session, other_user):
    link = Link(
        original_url="https://other.com",
        short_code="other1",
        owner_id=other_user.id,
        clicks_count=0,
    )
    db_session.add(link)
    await db_session.commit()
    await db_session.refresh(link)
    return link