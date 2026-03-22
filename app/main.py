from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.core.database import engine, Base
from app.api.v1.router import router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="URL shortener")

app.include_router(router, prefix="/api/v1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Адрес фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)