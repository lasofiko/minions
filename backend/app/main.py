from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ВАЖНО: сначала поднимаем логирование, чтобы handlers были на root-логгере
# до того, как любой модуль вызовет logging.getLogger(__name__).
from app.utils.logger import get_logger, setup_logging

setup_logging()

from app.api.exception_handlers import register_exception_handlers  # noqa: E402
from app.api.redirect import router as redirect_router  # noqa: E402
from app.api.v1.router import router as api_v1_router  # noqa: E402

logger = get_logger(__name__)

app = FastAPI(title="URL shortener")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:5173",
        "https://linkshortener.ru",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(api_v1_router, prefix="/api")
app.include_router(redirect_router)

logger.info("URL shortener app initialized")
