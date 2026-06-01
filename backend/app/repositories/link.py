from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.links import Link


class LinkRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_short_code(self, short_code: str) -> Link | None:
        result = await self.session.execute(
            select(Link).where(Link.short_code == short_code)
        )
        return result.scalar_one_or_none()

    async def get_owned_by(self, short_code: str, owner_id: int) -> Link | None:
        result = await self.session.execute(
            select(Link).where(
                Link.short_code == short_code,
                Link.owner_id == owner_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_owner(self, owner_id: int) -> list[Link]:
        result = await self.session.execute(
            select(Link)
            .where(Link.owner_id == owner_id)
            .order_by(Link.created_at.desc())
        )
        return list(result.scalars().all())

    async def short_code_exists(self, short_code: str) -> bool:
        result = await self.session.execute(
            select(Link.id).where(Link.short_code == short_code)
        )
        return result.first() is not None

    async def add(self, link: Link) -> Link:
        self.session.add(link)
        await self.session.flush()
        return link

    async def delete(self, link: Link) -> None:
        await self.session.delete(link)
