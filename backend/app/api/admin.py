from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, ConfigDict
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import User, Test, Session
from app.models.enums import UserRole
from app.core.security import get_password_hash
from app.api.auth import get_current_user, RoleChecker
from app.schemas.schemas import AdminStats

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(RoleChecker(["admin"]))])

class AdminUserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    access_until: Optional[datetime] = None
    role: Optional[str] = None

class AdminUserResponse(BaseModel):
    id: int
    full_name: Optional[str]
    email: str
    phone: Optional[str]
    is_active: bool
    access_until: Optional[datetime]
    role: str

    model_config = ConfigDict(from_attributes=True)

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    db: AsyncSession = Depends(get_db)
):
    """
    Статистика системы: пользователи, тесты, сессии, ТОП тестов.
    """
    total_users = await db.scalar(select(func.count(User.id)))
    pending_users = await db.scalar(select(func.count(User.id)).where(User.role == UserRole.pending))
    total_tests = await db.scalar(select(func.count(Test.id)))
    total_sessions = await db.scalar(select(func.count(Session.id)))

    # ТОП-3 теста
    top_query = (
        select(Test.title, func.count(Session.id).label("sessions_count"))
        .join(Session, Test.id == Session.test_id)
        .group_by(Test.id)
        .order_by(func.count(Session.id).desc())
        .limit(3)
    )
    res = await db.execute(top_query)
    top_tests = [{"title": r[0], "sessions_count": r[1]} for r in res.all()]

    return AdminStats(
        total_users=total_users,
        pending_users=pending_users,
        total_tests=total_tests,
        total_sessions=total_sessions,
        top_tests=top_tests
    )

@router.get("/users", response_model=List[AdminUserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db)
):
    query = select(User)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/users", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
async def create_psychologist(
    user_data: AdminUserCreate,
    db: AsyncSession = Depends(get_db)
):
    query = select(User).where(User.email == user_data.email)
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed_pwd,
        full_name=user_data.full_name,
        phone=user_data.phone,
        role=UserRole.psychologist,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.patch("/users/{user_id}", response_model=AdminUserResponse)
async def update_user_status(
    user_id: int,
    update_data: AdminUserUpdate,
    db: AsyncSession = Depends(get_db)
):
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if update_data.is_active is not None:
        user.is_active = update_data.is_active
    if update_data.access_until is not None:
        user.access_until = update_data.access_until
    if update_data.role is not None:
        user.role = update_data.role
        
    await db.commit()
    await db.refresh(user)
    return user

@router.patch("/users/{user_id}/access", response_model=AdminUserResponse)
async def extend_user_access(
    user_id: int,
    access_until: datetime,
    db: AsyncSession = Depends(get_db)
):
    """
    Ручное продление доступа для психолога.
    """
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.access_until = access_until
    await db.commit()
    await db.refresh(user)
    return user
