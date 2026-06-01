from sqlalchemy import select


class TestRedirect:

    async def test_redirect_success(self, client, test_link):
        response = await client.get(f"/{test_link.short_code}", follow_redirects=False)
        assert response.status_code == 307
        assert response.headers["location"] == test_link.original_url

    async def test_redirect_increments_clicks(self, client, test_link, db_session):
        from app.models.links import Link
        initial_clicks = test_link.clicks_count

        await client.get(f"/{test_link.short_code}", follow_redirects=False)

        updated = (
            await db_session.execute(select(Link).where(Link.id == test_link.id))
        ).scalar_one()
        assert updated.clicks_count == initial_clicks + 1

    async def test_redirect_nonexistent_code(self, client):
        response = await client.get("/nonexistent123")
        assert response.status_code == 404
        assert "Короткая ссылка не существует" in response.json()["detail"]
