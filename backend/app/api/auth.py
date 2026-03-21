from typing import Annotated

import jwt
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    verify_password,
    get_password_hash,
)
from app.db.database import get_db
from app.models.models import User, TestResult
from app.schemas.schemas import UserCreate, UserRead
from sqlalchemy import update

router = APIRouter(prefix="/auth", tags=["auth"])

# Схема для FastAPI (куда отправлять данные формы для логина)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Проверяем, существует ли пользователь с таким email
        query = select(User).where(User.email == user_data.email)
        result = await db.execute(query)
        existing_user = result.scalars().first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже существует"
            )

        hashed_pwd = get_password_hash(user_data.password)

        new_user = User(
            email=user_data.email,
            password_hash=hashed_pwd,
            full_name=user_data.full_name,
            phone=user_data.phone,
            role=user_data.role,
            bio_markdown=user_data.bio_markdown,
            avatar_url=user_data.avatar_url,
            is_active=user_data.is_active
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        await merge_guest_results(new_user, db)

        return new_user
    except HTTPException:
        raise
    except Exception as e:
        print(f"!!! REGISTRATION ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post("/login")
async def login(
    response: Response,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db)
):
    # Ищем пользователя по email (fastapi security ожидает поле username)
    query = select(User).where(User.email == form_data.username)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Токен выдан, в субъект сохраняем ID пользователя
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_access_token(data={"sub": str(user.id)}, expires_delta=timedelta(days=7))
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        max_age=7*24*60*60
    )
    
    await merge_guest_results(user, db)

    return {"access_token": access_token, "token_type": "bearer"}


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (InvalidTokenError, ValueError):
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if user is None:
        raise credentials_exception

    return user

async def get_current_psychologist(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if current_user.role != "psychologist" and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен. Требуется роль психолога."
        )
    return current_user

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

async def get_current_user_optional(
    token: Annotated[str | None, Depends(oauth2_scheme_optional)] = None,
    db: AsyncSession = Depends(get_db)
) -> User | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str | None = payload.get("sub")
        if not user_id_str:
            return None
        user_id = int(user_id_str)
    except (InvalidTokenError, ValueError):
        return None

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    return user

async def merge_guest_results(user: User, db: AsyncSession):
    if user.email:
        query = update(TestResult).where(
            TestResult.user_id == None,
            TestResult.guest_email == user.email
        ).values(user_id=user.id)
        await db.execute(query)
        await db.commit()
