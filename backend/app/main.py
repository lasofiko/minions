from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.core.database import engine, Base
from app.api.v1.router import router as api_v1_router
from app.api.redirect import router as redirect_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="URL shortener")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:5173",
        "http://localhost:80",
        "http://linkshortener.ru",
        "https://linkshortener.ru",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix="/api")

app.include_router(redirect_router)