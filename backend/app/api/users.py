from typing import Annotated
import os
import shutil

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.api.deps import check_access_active
from app.services.storage import storage_service
from app.core.utils import generate_qr_code
from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import UserRead, UserUpdateProfile

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def read_users_me(
    current_user: User = Depends(get_current_user)
):
    """
    Получить данные текущего авторизованного пользователя.
    """
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_users_me(
    profile_data: UserUpdateProfile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Обновить данные профиля (ФИО, телефон, специализация, био).
    """
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone
    if profile_data.specialization is not None:
        current_user.specialization = profile_data.specialization
    if profile_data.bio is not None:
        current_user.bio = profile_data.bio
    if profile_data.bio_markdown is not None:
        current_user.bio_markdown = profile_data.bio_markdown
    if profile_data.avatar_url is not None:
        current_user.avatar_url = profile_data.avatar_url
        
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/upload-avatar")
async def upload_avatar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...)
):
    """
    Загрузка и сохранение аватара профиля в директорию static/avatars.
    Возвращает URL загруженного изображения.
    """
    avatar_url = await storage_service.save_file(file, current_user.id)
    
    current_user.avatar_url = avatar_url
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return {"avatar_url": avatar_url}

@router.get("/me/business-card")
async def get_business_card(
    current_user: User = Depends(get_current_user)
):
    """
    Генерирует ссылку и QR-код для визитки пользователя.
    """
    # Ссылка на публичную карточку психолога (на фронтенде)
    card_url = f"http://localhost:3000/psychologist/{current_user.id}"
    
    # Генерируем QR-код с этой ссылкой
    qr_base64 = generate_qr_code(card_url)
    
    # Возвращаем данные для отображения визитки
    return {
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "bio_markdown": current_user.bio_markdown,
        "qr_code_base64": qr_base64,
        "card_url": card_url
    }
