from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import SessionLocal
from app.db_manager import DBManager
from app.models.user import User
from app.services.auth_service import AuthService
from app.services.links_service import LinksService


async def get_db_manager():
    async with SessionLocal() as session:
        yield DBManager(session)


DBManagerDep = Annotated[DBManager, Depends(get_db_manager)]


def get_auth_service(db: DBManagerDep) -> AuthService:
    return AuthService(db)


def get_links_service(db: DBManagerDep) -> LinksService:
    return LinksService(db)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
LinksServiceDep = Annotated[LinksService, Depends(get_links_service)]


_bearer = HTTPBearer()


async def get_current_user(
    auth: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    auth_service: AuthServiceDep,
) -> User:
    return await auth_service.get_user_from_access_token(auth.credentials)


CurrentUserDep = Annotated[User, Depends(get_current_user)]
