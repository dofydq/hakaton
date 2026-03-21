from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.api.auth import get_current_user_optional
from app.db.database import get_db
from app.models.models import Test, TestResult, User
from app.schemas.schemas import TestResultSubmit
from typing import Annotated

router = APIRouter(prefix="/results", tags=["results"])

@router.post("/")
async def save_test_result(
    data: TestResultSubmit,
    current_user: Annotated[User | None, Depends(get_current_user_optional)] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Заменяет старый Session flow на один прямой запрос сохранения в TestResult.
    """
    query = select(Test).where(Test.id == data.test_id).options(selectinload(Test.schemas))
    result = await db.execute(query)
    test = result.scalars().first()
    
    if not test or not test.is_active:
        raise HTTPException(status_code=404, detail="Тест не найден")
        
    logic_tree = test.schemas[0].logic_tree_json if test.schemas else []
    
    total_score = 0
    max_score = 0
    section_scores = {}
    section_max_scores = {}
    questions_map = {}
    
    if isinstance(logic_tree, list):
        for sec in logic_tree:
            if isinstance(sec, dict) and 'questions' in sec:
                sec_title = sec.get('title') or sec.get('id') or 'Без категории'
                if sec_title not in section_scores:
                    section_scores[sec_title] = 0
                    section_max_scores[sec_title] = 0
                for q in sec['questions']:
                    q['__section__'] = sec_title
                    questions_map[str(q.get('id'))] = q
                    # Расчет максимального балла для вопроса с учетом веса
                    options = q.get('options', [])
                    if q.get('type') == 'multiple_choice':
                        q_max = sum(int(opt.get('points', 0)) * float(opt.get('weight', 1.0)) for opt in options if int(opt.get('points', 0)) > 0)
                    else:
                        q_max = max([int(opt.get('points', 0)) * float(opt.get('weight', 1.0)) for opt in options] + [0])
                    max_score += q_max
                    section_max_scores[sec_title] += q_max
                    
    for q_id, q_ans in data.answers_json.items():
        q_model = questions_map.get(str(q_id))
        if not q_model:
            continue
            
        options = q_model.get('options', [])
        sec_title = q_model.get('__section__', 'Без категории')
        
        q_score = 0
        if q_model.get('type') in ['single_choice', 'multiple_choice', 'yes_no']:
            if isinstance(q_ans, list):
                for opt in options:
                    if str(opt.get('id')) in [str(x) for x in q_ans] or opt.get('text') in q_ans:
                        q_score += int(opt.get('points', 0)) * float(opt.get('weight', 1.0))
            else:
                for opt in options:
                    if str(opt.get('id')) == str(q_ans) or opt.get('text') == str(q_ans):
                        q_score += int(opt.get('points', 0)) * float(opt.get('weight', 1.0))
                        
        total_score += q_score
        if sec_title in section_scores:
            section_scores[sec_title] += q_score

    # Нормализация в проценты
    percentage = round((total_score / max_score) * 100) if max_score > 0 else 0
    
    normalized_section_scores = {}
    for sec, score in section_scores.items():
        s_max = section_max_scores.get(sec, 0)
        normalized_section_scores[sec] = round((score / s_max) * 100) if s_max > 0 else 0

    # Инжектируем метаданные
    answers_with_meta = dict(data.answers_json)
    answers_with_meta["_metadata"] = {
        "section_scores_percent": normalized_section_scores,
        "raw_score": total_score,
        "max_score": max_score,
        "percentage": percentage,
        "finished_at": datetime.utcnow().isoformat()
    }

    new_result = TestResult(
        test_id=test.id,
        user_id=current_user.id if current_user else None,
        guest_email=data.client_email if not current_user else None,
        client_fio=data.client_fio,
        answers=answers_with_meta,
        total_points=percentage
    )
    db.add(new_result)
    await db.commit()
    await db.refresh(new_result)
    
    return {"status": "ok", "total_points": percentage, "result_id": new_result.id}


@router.get("/test/{test_id}")
async def get_results_for_test(
    test_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Возвращает все результаты теста по его ID.
    """
    query = select(TestResult).where(TestResult.test_id == test_id).order_by(TestResult.created_at.desc())
    result = await db.execute(query)
    results = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "client_fio": r.client_fio,
            "total_points": r.total_points,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in results
    ]


@router.get("/counts")
async def get_result_counts(
    db: AsyncSession = Depends(get_db)
):
    """
    Возвращает словарь {test_id: count} — количество результатов по каждому тесту.
    """
    rows = await db.execute(
        select(TestResult.test_id, func.count(TestResult.id)).group_by(TestResult.test_id)
    )
    return {str(test_id): count for test_id, count in rows.all()}
