class TestAuth:

    def test_register_success(self, client):
        response = client.post("/api/v1/auth/register", json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "12345678"
        })
        assert response.status_code == 201
        assert "access_token" in response.json()

    def test_register_duplicate_email(self, client, test_user):
        response = client.post("/api/v1/auth/register", json={
            "username": "another",
            "email": "test@example.com",
            "password": "12345678"
        })
        assert response.status_code == 400
        assert "Email уже зарегистрирован" in response.json()["detail"]

    def test_login_success(self, client, test_user):
        response = client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_login_wrong_password(self, client, test_user):
        response = client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "wrong"
        })
        assert response.status_code == 401

    def test_get_me_success(self, client, auth_headers, test_user):
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["email"] == test_user.email

    def test_get_me_unauthorized(self, client):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401