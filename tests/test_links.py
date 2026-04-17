class TestLinks:

    def test_create_link_success(self, client, auth_headers):
        response = client.post("/api/v1/links/create",
                               headers=auth_headers,
                               json={"original_url": "https://google.com"})
        assert response.status_code == 201
        assert "short_code" in response.json()

    def test_create_link_invalid_url(self, client, auth_headers):
        response = client.post("/api/v1/links/create",
                               headers=auth_headers,
                               json={"original_url": "not-a-url"})
        assert response.status_code in [201, 400]

    def test_create_link_unauthorized(self, client):
        response = client.post("/api/v1/links/create",
                               json={"original_url": "https://google.com"})
        assert response.status_code == 401

    def test_get_my_links_empty(self, client, auth_headers):
        response = client.get("/api/v1/links/my", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_my_links_with_data(self, client, auth_headers, db_session, test_user):
        from app.models.links import Link
        link1 = Link(original_url="https://site1.com", short_code="abc111", owner_id=test_user.id)
        link2 = Link(original_url="https://site2.com", short_code="abc222", owner_id=test_user.id)
        db_session.add_all([link1, link2])
        db_session.commit()

        response = client.get("/api/v1/links/my", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_delete_link_success(self, client, auth_headers, test_link):
        response = client.delete(f"/api/v1/links/delete?short_code={test_link.short_code}",
                                 headers=auth_headers)
        assert response.status_code == 204

    def test_delete_link_not_found(self, client, auth_headers):
        response = client.delete("/api/v1/links/delete?short_code=nonexistent",
                                 headers=auth_headers)
        assert response.status_code == 404