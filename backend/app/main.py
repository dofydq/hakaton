import logging
import traceback
import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.tests import router as tests_router
from app.api.client import router as client_router
from app.api.reports import router as reports_router
from app.api.results import router as results_router
from app.api.admin import router as admin_router
from app.api.public import router as public_router
from app.api.links import router as links_router
from app.db.database import engine, Base
import app.models.models  # noqa: F401

# 1. Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d) - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ПрофДНК API",
    description="Backend для системы профориентации ProfDNK",
    version="1.0.0",
    root_path="/api"
)

app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# 2. Умный CORS
# При использовании allow_credentials=True, список origins должен быть явным (не "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# 3. Глобальные обработчики ошибок

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Кастомный обработчик ошибок валидации (422) с переводом на русский"""
    errors = []
    for error in exc.errors():
        loc = " -> ".join([str(x) for x in error.get("loc", [])])
        msg = error.get("msg", "")
        
        # Перевод стандартных сообщений Pydantic
        msg_lower = msg.lower()
        if "field required" in msg_lower:
            msg = "Обязательное поле"
        elif "value is not a valid email address" in msg_lower:
            msg = "Введите корректный email"
        elif "at least" in msg_lower and "character" in msg_lower:
            msg = msg.replace("String should have at least", "Минимум").replace("characters", "символов")
        
        errors.append({"field": loc, "message": msg})
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "message": "Ошибка валидации данных",
            "details": errors
        }
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"DATABASE ERROR: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Ошибка базы данных",
            "details": str(exc)[:256]
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Ловим все остальные ошибки"""
    # Если это уже HTTPException (например, 404, 403), прокидываем как есть
    from fastapi import HTTPException
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"status": "error", "message": exc.detail}
        )

    # Критическая ошибка: пишем трейсбек в консоль
    logger.error(f"CRITICAL UNHANDLED ERROR: {exc}\n{traceback.format_exc()}")
    
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Внутренняя ошибка сервера",
            "details": str(exc)
        }
    )

# 4. Подключение роутеров с группами (tags)
app.include_router(auth_router, tags=["Auth"])
app.include_router(admin_router, tags=["Admin"])
app.include_router(tests_router, tags=["Tests"])
app.include_router(users_router, tags=["Psychologist Profile"])
app.include_router(client_router, tags=["Client Test Taking"])
app.include_router(results_router, tags=["Results & Reports"])
app.include_router(reports_router, tags=["Results & Reports"])
app.include_router(public_router, tags=["Public Test Taking"])
app.include_router(links_router, tags=["Test Links"])

# Статика
os.makedirs("static/avatars", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
async def startup() -> None:
    from sqlalchemy import text
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Ручные миграции (если колонки не добавились автоматически через create_all на существующей БД)
        try:
            # Users
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS access_until TIMESTAMP WITH TIME ZONE;"))
            
            # Tests
            await conn.execute(text("ALTER TABLE tests ADD COLUMN IF NOT EXISTS report_config JSONB DEFAULT '{\"show_table\": true, \"show_chart\": false, \"show_interpretation\": true}';"))
            await conn.execute(text("ALTER TABLE tests ADD COLUMN IF NOT EXISTS max_submissions INTEGER;"))
            
            # TestResults
            await conn.execute(text("ALTER TABLE test_results ADD COLUMN IF NOT EXISTS test_snapshot JSONB;"))
            await conn.execute(text("ALTER TABLE test_results ADD COLUMN IF NOT EXISTS client_email VARCHAR;"))
            await conn.execute(text("ALTER TABLE test_results ADD COLUMN IF NOT EXISTS additional_info JSONB;"))
            await conn.execute(text("ALTER TABLE test_results ADD COLUMN IF NOT EXISTS max_possible_score FLOAT DEFAULT 0.0;"))
            await conn.execute(text("ALTER TABLE test_results ADD COLUMN IF NOT EXISTS secure_id UUID DEFAULT gen_random_uuid();"))
            
            await conn.commit()
        except Exception as e:
            logger.info(f"Migration check info: {e}")
            
    logger.info("БД инициализирована и таблицы созданы.")

@app.get("/", tags=["General"])
async def root():
    return {"status": "success", "message": "ПрофДНК API v1.0.0"}
