from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.models import Session, AnswerOption, Question

async def save_answers(db: AsyncSession, session_id: int, option_ids: List[str]):
    """
    Принимает список ID выбранных вариантов ответов.
    Находит их в БД, суммирует веса по шкалам и обновляет TestSession.
    """
    # 1. Загружаем варианты ответов вместе с вопросами (чтобы получить scale_tag)
    query = (
        select(AnswerOption)
        .where(AnswerOption.id.in_(option_ids))
        .options(selectinload(AnswerOption.question))
    )
    result = await db.execute(query)
    options = result.scalars().all()

    # 2. Агрегируем результаты
    detailed_results = {}
    total_score = 0.0

    for opt in options:
        # Шкала: сначала из варианта, если нет - из вопроса
        scale = opt.scale_tag or (opt.question.scale_tag if opt.question else "общая")
        weight = opt.weight if opt.weight is not None else 0.0
        
        detailed_results[scale] = detailed_results.get(scale, 0.0) + weight
        total_score += weight

    # 3. Обновляем сессию
    session_query = select(Session).where(Session.id == session_id)
    session_result = await db.execute(session_query)
    session = session_result.scalars().first()

    if session:
        session.detailed_results = detailed_results
        session.total_score = total_score
        # session.status = "completed"  # Можно оставить in_progress если это промежуточное сохранение
        await db.commit()
        await db.refresh(session)
    
    return detailed_results
