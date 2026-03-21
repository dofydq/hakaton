from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.database import get_db
from app.models.models import User, TestLink
from app.api.auth import get_current_user, RoleChecker
from app.api.deps import check_access_active
from app.schemas.schemas import TestLinkCreate, TestLinkRead

router = APIRouter(prefix="/links", tags=["Test Links"])

@router.post("/", response_model=TestLinkRead, status_code=status.HTTP_201_CREATED)
async def create_test_link(
    data: TestLinkCreate,
    current_user: User = Depends(check_access_active),
    db: AsyncSession = Depends(get_db)
):
    """
    Создание уникальной ссылки для теста. Доступно только активным психологам.
    """
    new_link = TestLink(
        test_id=data.test_id,
        psychologist_id=current_user.id,
        label=data.label
    )
    db.add(new_link)
    await db.commit()
    await db.refresh(new_link)
    return new_link

@router.get("/", response_model=List[TestLinkRead])
async def list_my_links(
    current_user: User = Depends(check_access_active),
    db: AsyncSession = Depends(get_db)
):
    """
    Список всех созданных ссылок текущего психолога.
    """
    from sqlalchemy import select
    query = select(TestLink).where(TestLink.psychologist_id == current_user.id)
    result = await db.execute(query)
    return result.scalars().all()
