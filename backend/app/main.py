from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.tests import router as tests_router
from app.api.client import router as client_router
from app.api.reports import router as reports_router
from app.api.results import router as results_router
from app.db.database import engine, Base
import app.models.models


app = FastAPI(title="ПрофДНК API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
os.makedirs("static/avatars", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Подключаем роутеры
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(tests_router)
app.include_router(client_router)
app.include_router(reports_router)
app.include_router(results_router)

@app.get("/")
async def root():
    return {"status": "ПрофДНК API работает"}
