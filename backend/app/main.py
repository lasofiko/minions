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
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router)

app.include_router(redirect_router)