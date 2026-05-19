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

    def test_create_link_with_description(self, client, auth_headers):
        response = client.post(
            "/api/links/create",
            headers=auth_headers,
            json={
                "original_url": "https://example.org",
                "description": "Моя заметка",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["description"] == "Моя заметка"
        assert len(data["short_code"]) == 6

    def test_create_link_without_description(self, client, auth_headers):
        response = client.post(
            "/api/links/create",
            headers=auth_headers,
            json={"original_url": "https://nodesc.com"},
        )
        assert response.status_code == 201
        assert response.json()["description"] is None

    def test_get_my_links_unauthorized(self, client):
        response = client.get("/api/links/my")
        assert response.status_code in (401, 403)

    def test_get_my_links_only_own(self, client, auth_headers, test_link, other_user_link):
        response = client.get("/api/links/my", headers=auth_headers)
        assert response.status_code == 200
        codes = {item["short_code"] for item in response.json()}
        assert test_link.short_code in codes
        assert other_user_link.short_code not in codes

    def test_update_description_success(self, client, auth_headers, test_link):
        response = client.put(
            f"/api/links/{test_link.short_code}",
            headers=auth_headers,
            json={"description": "Обновлённое описание"},
        )
        assert response.status_code == 200
        assert response.json()["description"] == "Обновлённое описание"

    def test_update_description_clear(self, client, auth_headers, test_link, db_session):
        from app.models.links import Link

        link = db_session.query(Link).filter(Link.id == test_link.id).first()
        link.description = "Будет удалено"
        db_session.commit()

        response = client.put(
            f"/api/links/{test_link.short_code}",
            headers=auth_headers,
            json={"description": None},
        )
        assert response.status_code == 200
        assert response.json()["description"] is None

    def test_update_link_not_found(self, client, auth_headers):
        response = client.put(
            "/api/links/missing99",
            headers=auth_headers,
            json={"description": "x"},
        )
        assert response.status_code == 404
        assert "не найдена" in response.json()["detail"]

    def test_update_link_other_user(self, client, auth_headers, other_user_link):
        response = client.put(
            f"/api/links/{other_user_link.short_code}",
            headers=auth_headers,
            json={"description": "Чужая ссылка"},
        )
        assert response.status_code == 404

    def test_delete_link_other_user(self, client, auth_headers, other_user_link):
        response = client.delete(
            f"/api/links/delete?short_code={other_user_link.short_code}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_delete_then_redirect_404(self, client, auth_headers, test_link):
        short_code = test_link.short_code
        delete_resp = client.delete(
            f"/api/links/delete?short_code={short_code}",
            headers=auth_headers,
        )
        assert delete_resp.status_code == 204

        redirect_resp = client.get(f"/{short_code}", follow_redirects=False)
        assert redirect_resp.status_code == 404
