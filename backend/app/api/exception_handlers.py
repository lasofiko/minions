from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from app.services.exceptions import (
    DomainError,
    EmailAlreadyExists,
    InvalidCredentials,
    InvalidToken,
    LinkCreationFailed,
    LinkNotFound,
    UserInactive,
    UserNotFound,
    UsernameAlreadyTaken,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


_STATUS_MAP: dict[type[DomainError], int] = {
    EmailAlreadyExists: status.HTTP_400_BAD_REQUEST,
    UsernameAlreadyTaken: status.HTTP_400_BAD_REQUEST,
    InvalidCredentials: status.HTTP_401_UNAUTHORIZED,
    InvalidToken: status.HTTP_401_UNAUTHORIZED,
    UserNotFound: status.HTTP_401_UNAUTHORIZED,
    UserInactive: status.HTTP_400_BAD_REQUEST,
    LinkNotFound: status.HTTP_404_NOT_FOUND,
    LinkCreationFailed: status.HTTP_409_CONFLICT,
}


def _domain_error_status(exc: DomainError) -> int:
    for cls, code in _STATUS_MAP.items():
        if isinstance(exc, cls):
            return code
    return status.HTTP_400_BAD_REQUEST


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def handle_domain_error(request: Request, exc: DomainError):
        code = _domain_error_status(exc)
        headers = {"WWW-Authenticate": "Bearer"} if code == 401 else None
        return JSONResponse(status_code=code, content={"detail": str(exc)}, headers=headers)

    @app.exception_handler(IntegrityError)
    async def handle_integrity(request: Request, exc: IntegrityError):
        logger.warning("IntegrityError on %s %s: %s", request.method, request.url.path, exc.orig)
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "Конфликт при сохранении данных"},
        )
