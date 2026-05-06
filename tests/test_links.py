class TestLinks:

    def test_create_link_success(self, client, auth_headers):
        response = client.post(
            "/api/links/create",
            headers=auth_headers,
            json={"original_url": "https://google.com"},
        )
        assert response.status_code == 201
        data = response.json()
        assert "short_code" in data
        assert data["original_url"] == "https://google.com"

    def test_create_link_any_string_stored(self, client, auth_headers):
        """Схема не валидирует URL — строка сохраняется как есть."""
        response = client.post(
            "/api/links/create",
            headers=auth_headers,
            json={"original_url": "not-a-url"},
        )
        assert response.status_code == 201
        assert response.json()["original_url"] == "not-a-url"

    def test_create_link_unauthorized(self, client):
        response = client.post(
            "/api/links/create",
            json={"original_url": "https://google.com"},
        )
        assert response.status_code in (401, 403)

    def test_get_my_links_empty(self, client, auth_headers):
        response = client.get("/api/links/my", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_my_links_with_data(self, client, auth_headers, db_session, test_user):
        from app.models.links import Link

        link1 = Link(
            original_url="https://site1.com",
            short_code="abc111",
            owner_id=test_user.id,
        )
        link2 = Link(
            original_url="https://site2.com",
            short_code="abc222",
            owner_id=test_user.id,
        )
        db_session.add_all([link1, link2])
        db_session.commit()

        response = client.get("/api/links/my", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_delete_link_success(self, client, auth_headers, test_link):
        response = client.delete(
            f"/api/links/delete?short_code={test_link.short_code}",
            headers=auth_headers,
        )
        assert response.status_code == 204

    def test_delete_link_not_found(self, client, auth_headers):
        response = client.delete(
            "/api/links/delete?short_code=nonexistent",
            headers=auth_headers,
        )
        assert response.status_code == 404
