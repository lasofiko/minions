class TestAuth:

    async def test_register_success(self, client):
        response = await client.post(
            "/api/auth/register",
            json={
                "username": "newuser",
                "email": "new@example.com",
                "password": "12345678",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_register_duplicate_email(self, client, test_user):
        response = await client.post(
            "/api/auth/register",
            json={
                "username": "another",
                "email": "test@example.com",
                "password": "12345678",
            },
        )
        assert response.status_code == 400
        assert "Email уже зарегистрирован" in response.json()["detail"]

    async def test_register_duplicate_username(self, client, test_user):
        response = await client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "other@example.com",
                "password": "12345678",
            },
        )
        assert response.status_code == 400
        assert "Имя пользователя уже занято" in response.json()["detail"]

    async def test_login_success(self, client, test_user):
        response = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "password123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_login_wrong_password(self, client, test_user):
        response = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "wrong"},
        )
        assert response.status_code == 401

    async def test_refresh_success(self, client, refresh_headers):
        response = await client.post("/api/auth/refresh", headers=refresh_headers)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_refresh_with_access_token_fails(self, client, auth_headers):
        response = await client.post("/api/auth/refresh", headers=auth_headers)
        assert response.status_code == 401

    async def test_get_me_success(self, client, auth_headers, test_user):
        response = await client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["email"] == test_user.email

    async def test_get_me_unauthorized(self, client):
        response = await client.get("/api/auth/me")
        assert response.status_code in (401, 403)

    async def test_get_me_invalid_token(self, client):
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert response.status_code == 401

    async def test_login_unknown_email(self, client):
        response = await client.post(
            "/api/auth/login",
            json={"email": "nobody@example.com", "password": "password123"},
        )
        assert response.status_code == 401
        assert "Неверный email или пароль" in response.json()["detail"]

    async def test_login_inactive_user(self, client, inactive_user):
        response = await client.post(
            "/api/auth/login",
            json={"email": inactive_user.email, "password": "password123"},
        )
        assert response.status_code == 400
        assert "деактивирован" in response.json()["detail"]

    async def test_register_invalid_email(self, client):
        response = await client.post(
            "/api/auth/register",
            json={
                "username": "badmail",
                "email": "not-an-email",
                "password": "12345678",
            },
        )
        assert response.status_code == 422

    async def test_refresh_invalid_token(self, client):
        response = await client.post(
            "/api/auth/refresh",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert response.status_code == 401

    async def test_refresh_without_token(self, client):
        response = await client.post("/api/auth/refresh")
        assert response.status_code in (401, 403)
