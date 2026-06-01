
class TestUserJourney:
    async def test_register_login_create_redirect_list_update_delete(self, client):
        reg = await client.post(
            "/api/auth/register",
            json={
                "username": "journey_user",
                "email": "journey@example.com",
                "password": "securepass1",
            },
        )
        assert reg.status_code == 201
        access = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {access}"}

        login = await client.post(
            "/api/auth/login",
            json={"email": "journey@example.com", "password": "securepass1"},
        )
        assert login.status_code == 200

        me = await client.get("/api/auth/me", headers=headers)
        assert me.status_code == 200
        assert me.json()["email"] == "journey@example.com"

        create = await client.post(
            "/api/links/create",
            headers=headers,
            json={
                "original_url": "https://journey-target.example/page",
                "description": "Тестовый маршрут",
            },
        )
        assert create.status_code == 201
        short_code = create.json()["short_code"]
        assert create.json()["description"] == "Тестовый маршрут"

        redirect = await client.get(f"/{short_code}", follow_redirects=False)
        assert redirect.status_code == 307
        assert redirect.headers["location"] == "https://journey-target.example/page"

        listing = await client.get("/api/links/my", headers=headers)
        assert listing.status_code == 200
        assert any(link["short_code"] == short_code for link in listing.json())

        update = await client.put(
            f"/api/links/{short_code}",
            headers=headers,
            json={"description": "Обновлено в интеграции"},
        )
        assert update.status_code == 200
        assert update.json()["description"] == "Обновлено в интеграции"

        second_redirect = await client.get(f"/{short_code}", follow_redirects=False)
        assert second_redirect.status_code == 307

        delete = await client.delete(
            f"/api/links/delete?short_code={short_code}",
            headers=headers,
        )
        assert delete.status_code == 204

        after_delete = await client.get(f"/{short_code}", follow_redirects=False)
        assert after_delete.status_code == 404

        empty_list = await client.get("/api/links/my", headers=headers)
        assert empty_list.status_code == 200
        assert not any(link["short_code"] == short_code for link in empty_list.json())

    async def test_refresh_after_login(self, client, test_user):
        login = await client.post(
            "/api/auth/login",
            json={"email": test_user.email, "password": "password123"},
        )
        assert login.status_code == 200
        refresh_token = login.json()["refresh_token"]

        refresh = await client.post(
            "/api/auth/refresh",
            headers={"Authorization": f"Bearer {refresh_token}"},
        )
        assert refresh.status_code == 200
        assert refresh.json()["access_token"]
        assert refresh.json()["refresh_token"]

        me = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {refresh.json()['access_token']}"},
        )
        assert me.status_code == 200
        assert me.json()["email"] == test_user.email
