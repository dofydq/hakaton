from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.api.auth import get_current_user_optional
from app.api.deps import check_access_active
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
        
    if test.max_submissions is not None:
        count_query = select(func.count(TestResult.id)).where(TestResult.test_id == test.id)
        count_res = await db.execute(count_query)
        current_count = count_res.scalar_one()
        if current_count >= test.max_submissions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Превышен лимит прохождений для этого теста")

    logic_tree = test.schemas[0].logic_tree_json if test.schemas else []
    
    # ===== Шкальный подсчёт (psychometric scoring) =====
    total_score = 0.0
    max_score = 0.0
    scale_scores: dict[str, float] = {}
    questions_map: dict[str, dict] = {}
    
    if isinstance(logic_tree, list):
        for sec in logic_tree:
            if isinstance(sec, dict) and 'questions' in sec:
                for q in sec['questions']:
                    q_id = str(q.get('id'))
                    questions_map[q_id] = q
                    options = q.get('options', [])
                    # Максимальный балл вопроса
                    q_max = max([float(opt.get('points', 0)) * float(opt.get('weight', 1.0)) for opt in options], default=0.0)
                    max_score += q_max

    # Расчёт текущих баллов
    for q_id, q_ans in data.answers_json.items():
        q_model = questions_map.get(str(q_id))
        if not q_model: continue
        
        options = q_model.get('options', [])
        q_scale_default = q_model.get('scale_tag') or 'общая'
        
        chosen_opts = []
        if isinstance(q_ans, list):
            chosen_opts = [o for o in options if str(o.get('id')) in [str(x) for x in q_ans]]
        else:
            chosen_opts = [o for o in options if str(o.get('id')) == str(q_ans)]
            
        for opt in chosen_opts:
            contrib = float(opt.get('points', 0)) * float(opt.get('weight', 1.0))
            scale = opt.get('scale_tag') or q_scale_default
            scale_scores[scale] = scale_scores.get(scale, 0.0) + contrib
            total_score += contrib

    # Интерпретация
    from app.models.models import TestInterpretation
    res_inter = await db.execute(select(TestInterpretation).where(TestInterpretation.test_id == test.id))
    rules = res_inter.scalars().all()
    
    interpretation_text = "Интерпретация отсутствует."
    total_percent = (total_score / max_score * 100) if max_score > 0 else 0.0
    
    matches = []
    for rule in rules:
        val = scale_scores.get(rule.scale_tag, 0.0) if rule.scale_tag != "общая" else total_score
        if rule.is_percent:
            val = (val / max_score * 100) if max_score > 0 else 0.0
        if rule.min_val <= val < rule.max_val:
            matches.append(rule.text)
    if matches:
        interpretation_text = "\n\n".join(matches)

    detailed_results = {k: float(round(v, 3)) for k, v in scale_scores.items()}
    percentage = float(round(total_percent, 2))

    new_result = TestResult(
        test_id=test.id,
        user_id=current_user.id if current_user else None,
        guest_email=data.client_email if not current_user else None,
        client_fio=data.client_fio,
        answers=data.answers_json,
        total_points=percentage,
        detailed_results=detailed_results,
        interpretation_result=interpretation_text,
        max_possible_score=max_score,
        test_snapshot={"logic_tree": logic_tree}
    )
    db.add(new_result)
    await db.commit()
    await db.refresh(new_result)
    
    return {
        "status": "completed",
        "detailed_results": detailed_results,
        "total_score": float(round(sum(float(v) for v in detailed_results.values()), 3)),
        "result_id": str(new_result.id)
    }


@router.get("/test/{test_id}")
async def get_results_for_test(
    test_id: int,
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(check_access_active),
    db: AsyncSession = Depends(get_db)
):
    """
    Возвращает результаты теста по его ID с пагинацией.
    Доступно только владельцу теста.
    """
    # Проверка прав доступа к тесту
    test_check = await db.execute(select(Test.id).where(Test.id == test_id, Test.psychologist_id == current_user.id))
    if not test_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    count_query = select(func.count(TestResult.id)).where(TestResult.test_id == test_id)
    count_res = await db.execute(count_query)
    total_count = count_res.scalar_one()

    query = select(TestResult).where(TestResult.test_id == test_id).order_by(TestResult.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    results = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(r.id),
                "client_fio": r.client_fio,
                "total_points": r.total_points,
                "detailed_results": r.detailed_results or {},
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in results
        ],
        "total": total_count,
        "skip": skip,
        "limit": limit
    }


@router.get("/counts")
async def get_result_counts(
    current_user: User = Depends(check_access_active),
    db: AsyncSession = Depends(get_db)
):
    """
    Возвращает словарь {test_id: count} для тестов текущего психолога.
    """
    rows = await db.execute(
        select(TestResult.test_id, func.count(TestResult.id))
        .join(Test, Test.id == TestResult.test_id)
        .where(Test.psychologist_id == current_user.id)
        .group_by(TestResult.test_id)
    )
    return {str(test_id): count for test_id, count in rows.all()}
