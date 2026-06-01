from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DATABASE_URL: str = "sqlite:///./sql_app.db"

    # Логирование
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str | None = None  # путь до файла; None = только stdout

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
