class DomainError(Exception):
    """Базовый класс для всех доменных ошибок."""


# --- auth ---


class EmailAlreadyExists(DomainError):
    pass


class UsernameAlreadyTaken(DomainError):
    pass


class InvalidCredentials(DomainError):
    pass


class UserInactive(DomainError):
    pass


class InvalidToken(DomainError):
    pass


class UserNotFound(DomainError):
    pass


# --- links ---


class LinkNotFound(DomainError):
    pass


class LinkCreationFailed(DomainError):
    """Не удалось создать ссылку (например, исчерпание попыток)."""
