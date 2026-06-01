from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.api.deps import AuthServiceDep, CurrentUserDep
from app.schemas.token import Token, UserLogin
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/auth")

_bearer = HTTPBearer()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, auth_service: AuthServiceDep) -> Token:
    return await auth_service.register(user_data)


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, auth_service: AuthServiceDep) -> Token:
    return await auth_service.login(login_data.email, login_data.password)


@router.post("/refresh", response_model=Token)
async def refresh_token(
    auth_service: AuthServiceDep,
    auth: HTTPAuthorizationCredentials = Depends(_bearer),
) -> Token:
    return await auth_service.refresh(auth.credentials)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUserDep):
    return current_user
