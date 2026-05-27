import pytest

from app.schemas.links import LinkCreate
from app.services.exceptions import LinkNotFound
from app.services.links_service import LinksService


class TestLinksService:

    async def test_create_link_service(self, db_manager, test_user):
        service = LinksService(db_manager)
        result = await service.create(LinkCreate(original_url="https://test.com"), test_user.id)

        assert result is not None
        assert result.original_url == "https://test.com"
        assert len(result.short_code) == 6

    async def test_list_my_empty(self, db_manager, test_user):
        service = LinksService(db_manager)
        stats = await service.list_my(test_user.id)
        assert stats == []

    async def test_list_my_with_links(self, db_manager, db_session, test_user):
        from app.models.links import Link
        link = Link(original_url="https://test.com", short_code="code123", owner_id=test_user.id)
        db_session.add(link)
        await db_session.commit()

        service = LinksService(db_manager)
        stats = await service.list_my(test_user.id)
        assert len(stats) == 1

    async def test_resolve_and_track_increments(self, db_manager, test_link):
        service = LinksService(db_manager)
        url = await service.resolve_and_track(test_link.short_code)
        assert url == test_link.original_url

        await db_manager.refresh(test_link)
        assert test_link.clicks_count == 1

    async def test_resolve_not_found(self, db_manager):
        service = LinksService(db_manager)
        with pytest.raises(LinkNotFound):
            await service.resolve_and_track("nonexistent")

    async def test_delete_success(self, db_manager, test_link):
        service = LinksService(db_manager)
        await service.delete(test_link.short_code, test_link.owner_id)

    async def test_delete_not_found(self, db_manager, test_user):
        service = LinksService(db_manager)
        with pytest.raises(LinkNotFound):
            await service.delete("nonexistent", test_user.id)
