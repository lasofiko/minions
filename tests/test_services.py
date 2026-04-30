from app.services.links_service import create_link, get_user_stats, delete_link, get_url_and_update_stats
from app.schemas.links import LinkCreate


class TestLinksService:

    def test_create_link_service(self, db_session, test_user):
        link_data = LinkCreate(original_url="https://test.com")
        result = create_link(db_session, link_data, test_user.id)

        assert result is not None
        assert result.original_url == "https://test.com"
        assert len(result.short_code) == 6

    def test_get_user_stats_empty(self, db_session, test_user):
        stats = get_user_stats(db_session, test_user.id)
        assert stats == []

    def test_get_user_stats_with_links(self, db_session, test_user):
        from app.models.links import Link
        link = Link(original_url="https://test.com", short_code="code123", owner_id=test_user.id)
        db_session.add(link)
        db_session.commit()

        stats = get_user_stats(db_session, test_user.id)
        assert len(stats) == 1

    def test_get_url_and_update_stats_success(self, db_session, test_link):
        url = get_url_and_update_stats(db_session, test_link.short_code)
        assert url == test_link.original_url

        db_session.refresh(test_link)
        assert test_link.clicks_count == 1

    def test_get_url_and_update_stats_not_found(self, db_session):
        url = get_url_and_update_stats(db_session, "nonexistent")
        assert url is None

    def test_delete_link_success(self, db_session, test_link):
        result = delete_link(db_session, test_link.short_code, test_link.owner_id)
        assert result is True

    def test_delete_link_not_found(self, db_session, test_user):
        result = delete_link(db_session, "nonexistent", test_user.id)
        assert result is False