"""Централизованная настройка логирования.

Использование:
    from app.utils.logger import get_logger
    logger = get_logger(__name__)
    logger.info("...")

В main.py setup_logging() вызывается до создания FastAPI app, чтобы все
последующие logging.getLogger(__name__) сразу подхватили root-конфиг.
"""
import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

from app.core.config import settings

_LOG_FORMAT = "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s"
_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

_initialized = False


def setup_logging() -> None:
    """Конфигурирует root-логгер. Идемпотентно — повторные вызовы no-op."""
    global _initialized
    if _initialized:
        return

    level_name = (settings.LOG_LEVEL or "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    root = logging.getLogger()
    root.setLevel(level)

    # Сносим дефолтные handlers (например, проставленные uvicorn-ом),
    # чтобы не было дублирования вывода.
    for h in list(root.handlers):
        root.removeHandler(h)

    formatter = logging.Formatter(_LOG_FORMAT, datefmt=_DATE_FORMAT)

    # stdout — в Docker подхватывается `docker logs`
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)
    root.addHandler(console)

    # Опциональный файл с ротацией, если задана переменная LOG_FILE.
    # На проде в контейнере удобнее не писать в файл (логи уходят в stdout),
    # но для локальной отладки можно включить.
    if settings.LOG_FILE:
        log_path = Path(settings.LOG_FILE)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        file_handler = RotatingFileHandler(
            log_path,
            maxBytes=10 * 1024 * 1024,
            backupCount=3,
            encoding="utf-8",
        )
        file_handler.setFormatter(formatter)
        root.addHandler(file_handler)

    # Шумные библиотеки приглушим, чтобы наши INFO не тонули.
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("aiosqlite").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)

    _initialized = True


def get_logger(name: str) -> logging.Logger:
    """Возвращает logger по имени. Гарантирует, что root уже настроен."""
    setup_logging()
    return logging.getLogger(name)
