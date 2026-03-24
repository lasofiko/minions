from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.core.database import engine, Base
from app.api.v1 import router as api_v1_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="URL shortener")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router)