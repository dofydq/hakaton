from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import func

from app.db.database import get_db
from app.models.models import Test, Session, Answer, User, TestSchema
from app.schemas.schemas import SessionStart, AnswerSubmit, ClientTestResponse, SessionStartResponse, TestResultSubmit

router = APIRouter(prefix="/client", tags=["client_testing"])


@router.get("/tests/{test_id}", response_model=ClientTestResponse)
async def get_test_for_client(
    test_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Публичный эндпоинт для клиента.
    Возвращает структуру теста БЕЗ формул (calculation_rules_json),
    чтобы не утёк алгоритм расчета результатов.
    """
    query = select(Test).where(Test.id == test_id).options(
        selectinload(Test.schemas)
    )
    result = await db.execute(query)
    test = result.scalars().first()

    if not test or not test.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Тест не найден или недоступен"
        )
        
    logic_tree = test.schemas[0].logic_tree_json if test.schemas else {}
    
    return ClientTestResponse(
        title=test.title,
        description=test.description,
        access_settings_json=test.access_settings_json,
        logic_tree_json=logic_tree
    )


@router.get("/psychologist/{user_id}")
async def get_psychologist_public(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Публичный эндпоинт для получения визитки психолога и его активных тестов.
    """
    query = select(User).where(User.id == user_id, User.role == "psychologist", User.is_active == True)
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Психолог не найден"
        )
        
    tests_query = select(Test).where(Test.psychologist_id == user.id, Test.is_active == True)
    tests_result = await db.execute(tests_query)
    tests = tests_result.scalars().all()
    
    return {
        "id": user.id,
        "full_name": user.full_name,
        "bio_markdown": user.bio_markdown,
        "avatar_url": user.avatar_url,
        "tests": [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description
            } for t in tests
        ]
    }


@router.post("/tests/{test_id}/start", response_model=SessionStartResponse)
async def start_client_session(
    test_id: int,
    data: SessionStart,
    db: AsyncSession = Depends(get_db)
):
    """
    Инициализация прохождения клиентом (начало сессии).
    """
    query = select(Test).where(Test.id == test_id)
    result = await db.execute(query)
    test = result.scalars().first()
    
    if not test or not test.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Тест не найден или недоступен"
        )
        
    session = Session(
        test_id=test.id,
        client_fio=data.client_fio,
        client_extra_data_json=data.client_extra_data_json,
        current_progress_percent=0
    )
    
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    return SessionStartResponse(session_id=session.id)


@router.post("/sessions/{session_id}/answer")
async def submit_answer(
    session_id: int,
    data: AnswerSubmit,
    db: AsyncSession = Depends(get_db)
):
    """
    Сохранение одного ответа клиента в БД.
    """
    query = select(Session).where(Session.id == session_id)
    result = await db.execute(query)
    session = result.scalars().first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Сессия не найдена"
        )
        
    answer = Answer(
        session_id=session.id,
        question_id=data.question_id,
        value_json=data.value_json
    )
    db.add(answer)
    
    # Фейковое прибавление процента прохождения. В реальном проекте 
    # фронтенд может передавать процент текущего прохождения, либо
    # вычисляться относительно logic_tree
    if session.current_progress_percent < 99:
        session.current_progress_percent += 5
        
    await db.commit()
    return {"status": "ok"}


@router.post("/sessions/{session_id}/finish")
async def finish_session(
    session_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Завершение сессии прохождения.
    """
    query = select(Session).where(Session.id == session_id)
    result = await db.execute(query)
    session = result.scalars().first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Сессия не найдена"
        )
        
    session.completed_at = func.now()
    session.current_progress_percent = 100
    
    await db.commit()
    return {"status": "finished"}
