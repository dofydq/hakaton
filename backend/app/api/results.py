from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.db.database import get_db
from app.models.models import Test, TestResult
from app.schemas.schemas import TestResultSubmit

router = APIRouter(prefix="/results", tags=["results"])

@router.post("/")
async def save_test_result(
    data: TestResultSubmit,
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
    questions_map = {}
    if isinstance(logic_tree, list):
        for sec in logic_tree:
            if isinstance(sec, dict) and 'questions' in sec:
                for q in sec['questions']:
                    questions_map[q.get('id')] = q
                    
    for q_id, q_ans in data.answers_json.items():
        q_model = questions_map.get(q_id)
        if not q_model:
            continue
            
        options = q_model.get('options', [])
        
        if q_model.get('type') in ['single_choice', 'multiple_choice', 'yes_no']:
            if isinstance(q_ans, list):
                for opt in options:
                    if opt.get('id') in q_ans or opt.get('text') in q_ans:
                        total_score += int(opt.get('points', 0))
            else:
                for opt in options:
                    if opt.get('id') == q_ans or opt.get('text') == q_ans:
                        total_score += int(opt.get('points', 0))

    new_result = TestResult(
        test_id=test.id,
        client_fio=data.client_fio,
        answers=data.answers_json,
        total_points=total_score
    )
    db.add(new_result)
    await db.commit()
    await db.refresh(new_result)
    
    return {"status": "ok", "total_points": total_score, "result_id": new_result.id}


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
            "id": r.id,
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
