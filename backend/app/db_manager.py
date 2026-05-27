from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.link import LinkRepository
from app.repositories.user import UserRepository


class DBManager:
    """Unit of Work.

    Держит одну AsyncSession и все репозитории. Сервисы работают через
    DBManager, не зная про SQLAlchemy напрямую. Commit/rollback вызывает
    сервис в конце use case.
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        self.users = UserRepository(session)
        self.links = LinkRepository(session)

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()

    async def refresh(self, obj) -> None:
        await self.session.refresh(obj)
