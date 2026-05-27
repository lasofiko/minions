from datetime import datetime
from zoneinfo import ZoneInfo

from app.db_manager import DBManager
from app.models.links import Link
from app.schemas.links import LinkCreate, LinkUpdate
from app.services.exceptions import LinkCreationFailed, LinkNotFound
from app.utils.logger import get_logger
from app.utils.short_link import generate_random_code

logger = get_logger(__name__)

MAX_CODE_GENERATION_ATTEMPTS = 8


class LinksService:
    def __init__(self, db: DBManager):
        self.db = db

    async def create(self, data: LinkCreate, owner_id: int) -> Link:
        code: str | None = None
        for _ in range(MAX_CODE_GENERATION_ATTEMPTS):
            candidate = generate_random_code()
            if not await self.db.links.short_code_exists(candidate):
                code = candidate
                break
        if code is None:
            logger.warning(
                "Failed to generate unique short_code after %s attempts (owner_id=%s)",
                MAX_CODE_GENERATION_ATTEMPTS,
                owner_id,
            )
            raise LinkCreationFailed("Не удалось подобрать уникальный код, попробуйте ещё раз")

        link = Link(
            original_url=data.original_url,
            short_code=code,
            description=data.description,
            owner_id=owner_id,
        )
        await self.db.links.add(link)
        await self.db.commit()
        await self.db.refresh(link)
        logger.info("Link created: short_code=%s owner_id=%s", link.short_code, owner_id)
        return link

    async def update_description(self, short_code: str, owner_id: int, data: LinkUpdate) -> Link:
        link = await self.db.links.get_owned_by(short_code, owner_id)
        if link is None:
            raise LinkNotFound("Ссылка не найдена")
        link.description = data.description
        await self.db.commit()
        await self.db.refresh(link)
        logger.info("Link description updated: short_code=%s", short_code)
        return link

    async def list_my(self, owner_id: int) -> list[Link]:
        return await self.db.links.list_by_owner(owner_id)

    async def delete(self, short_code: str, owner_id: int) -> None:
        link = await self.db.links.get_owned_by(short_code, owner_id)
        if link is None:
            raise LinkNotFound("Ссылка не найдена или у вас нет прав на её удаление")
        await self.db.links.delete(link)
        await self.db.commit()
        logger.info("Link deleted: short_code=%s owner_id=%s", short_code, owner_id)

    async def resolve_and_track(self, short_code: str) -> str:
        link = await self.db.links.get_by_short_code(short_code)
        if link is None:
            logger.debug("Redirect 404 for short_code=%s", short_code)
            raise LinkNotFound("Короткая ссылка не существует")
        link.clicks_count += 1
        link.last_clicked_at = datetime.now(ZoneInfo("Europe/Moscow"))
        await self.db.commit()
        logger.debug(
            "Redirect: short_code=%s clicks=%s",
            short_code,
            link.clicks_count,
        )
        return link.original_url
