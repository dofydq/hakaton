from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.api.auth import get_current_user
from app.db.database import get_db
from app.models.models import Session, User
from app.services.report_generator import generate_docx_report

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{session_id}/download-docx")
async def download_report_docx(
    session_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Скачивание сгенерированного DOCX-отчета о прохождении теста клиентом.
    Доступно только психологу, который создал данный тест.
    """
    # Загружаем сессию вместе с ответами (Answer) и тестом (Test),
    # чтобы проверить права доступа по Test.psychologist_id
    query = select(Session).where(Session.id == session_id).options(
        selectinload(Session.answers),
        selectinload(Session.test)
    )
    result = await db.execute(query)
    session = result.scalars().first()
    
    # Сессия не найдена
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Сессия не найдена"
        )
        
    # Проверка прав: тест должен принадлежать текущему пользователю
    if session.test.psychologist_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="У вас нет доступа к этой сессии"
        )
        
    # Генерируем буфер сDOCX-документом
    buffer = generate_docx_report(session, session.answers)
    
    # Отправляем файл пользователю без сохранения на диск сервера
    return StreamingResponse(
        buffer, 
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
        headers={"Content-Disposition": f"attachment; filename=report_{session_id}.docx"}
    )
