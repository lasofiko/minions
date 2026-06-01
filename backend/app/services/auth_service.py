from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.db_manager import DBManager
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate
from app.services.exceptions import (
    EmailAlreadyExists,
    InvalidCredentials,
    InvalidToken,
    UserInactive,
    UserNotFound,
    UsernameAlreadyTaken,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AuthService:
    def __init__(self, db: DBManager):
        self.db = db

    @staticmethod
    def _issue_tokens(user: User) -> Token:
        sub = str(user.id)
        return Token(
            access_token=create_access_token(data={"sub": sub}),
            refresh_token=create_refresh_token(data={"sub": sub}),
            token_type="bearer",
        )

    async def register(self, data: UserCreate) -> Token:
        existing = await self.db.users.get_by_email_or_username(data.email, data.username)
        if existing is not None:
            if existing.email == data.email:
                logger.info("Register rejected: email already exists (email=%s)", data.email)
                raise EmailAlreadyExists("Email уже зарегистрирован")
            logger.info("Register rejected: username taken (username=%s)", data.username)
            raise UsernameAlreadyTaken("Имя пользователя уже занято")

        user = User(
            username=data.username,
            email=data.email,
            hashed_password=get_password_hash(data.password),
            is_active=True,
        )
        await self.db.users.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        logger.info("User registered: id=%s username=%s", user.id, user.username)
        return self._issue_tokens(user)

    async def login(self, email: str, password: str) -> Token:
        user = await self.db.users.get_by_email(email)
        if user is None or not verify_password(password, user.hashed_password):
            # Не логируем сам email на WARNING — это PII; INFO достаточно.
            logger.info("Login failed for email=%s", email)
            raise InvalidCredentials("Неверный email или пароль")
        if not user.is_active:
            logger.warning("Login on inactive user: id=%s", user.id)
            raise UserInactive("Пользователь деактивирован")
        logger.info("User logged in: id=%s", user.id)
        return self._issue_tokens(user)

    async def refresh(self, token: str) -> Token:
        if not token:
            raise InvalidToken("Токен отсутствует")
        payload = decode_token(token)
        if payload is None or payload.get("type") != "refresh":
            logger.info("Refresh rejected: invalid token type")
            raise InvalidToken("Невалидный refresh token")
        sub = payload.get("sub")
        if sub is None:
            raise InvalidToken("Невалидный refresh token")
        try:
            user_id = int(sub)
        except (TypeError, ValueError):
            raise InvalidToken("Невалидный refresh token")

        user = await self.db.users.get_by_id(user_id)
        if user is None or not user.is_active:
            logger.info("Refresh rejected: user missing/inactive id=%s", user_id)
            raise UserNotFound("Пользователь не найден")
        logger.info("Tokens refreshed for user id=%s", user.id)
        return self._issue_tokens(user)

    async def get_user_from_access_token(self, token: str) -> User:
        """Используется при разборе Bearer access-токена."""
        if not token:
            raise InvalidToken("Токен отсутствует")
        payload = decode_token(token)
        if payload is None or payload.get("type") != "access":
            raise InvalidToken("Невалидный access token")
        try:
            user_id = int(payload.get("sub"))
        except (TypeError, ValueError):
            raise InvalidToken("Невалидный access token")
        user = await self.db.users.get_by_id(user_id)
        if user is None or not user.is_active:
            raise InvalidToken("Невалидный access token")
        return user
