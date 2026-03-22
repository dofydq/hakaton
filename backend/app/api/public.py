from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import Any, Dict

from app.db.database import get_db
from app.models.models import Test, TestLink, TestResult, TestInterpretation
from app.schemas.schemas import PublicTestSubmit

router = APIRouter(prefix="/public", tags=["Public Test Taking"])

@router.get("/links/{link_id}")
async def get_public_test(
    link_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Получение метаданных теста по уникальной ссылке.
    """
    query = (
        select(TestLink)
        .where(TestLink.id == link_id)
        .options(selectinload(TestLink.test).selectinload(Test.schemas))
    )
    result = await db.execute(query)
    test_link = result.scalars().first()
    
    if not test_link or not test_link.test.is_active:
        raise HTTPException(status_code=404, detail="Ссылка недействительна или тест деактивирован")
        
    test = test_link.test
    logic_tree = test.schemas[0].logic_tree_json if test.schemas else []
    
    # Возвращаем только то, что нужно для прохождения (без баллов и правильных ответов)
    public_questions = []
    if isinstance(logic_tree, list):
        for section in logic_tree:
            sec_questions = []
            for q in section.get('questions', []):
                sec_questions.append({
                    "id": q.get("id"),
                    "type": q.get("type"),
                    "title": q.get("title"),
                    "description": q.get("description"),
                    "isRequired": q.get("isRequired", False),
                    "options": [
                        {"id": opt.get("id"), "text": opt.get("text")}
                        for opt in q.get("options", [])
                    ]
                })
            public_questions.append({
                "title": section.get("title"),
                "questions": sec_questions
            })
            
    return {
        "title": test.title,
        "description": test.description,
        "sections": public_questions
    }

@router.post("/submit")
async def submit_public_test(
    data: PublicTestSubmit,
    db: AsyncSession = Depends(get_db)
):
    """
    Анонимная отправка результатов по уникальной ссылке.
    """
    # 1. Валидация ссылки
    query = (
        select(TestLink)
        .where(TestLink.id == data.link_id)
        .options(selectinload(TestLink.test).selectinload(Test.schemas))
    )
    result = await db.execute(query)
    test_link = result.scalars().first()
    
    if not test_link or not test_link.test.is_active:
        raise HTTPException(status_code=404, detail="Ссылка недействительна")
        
    test = test_link.test
    logic_tree = test.schemas[0].logic_tree_json if test.schemas else []
    
    # 2. Подготовка мапы вопросов для расчёта
    questions_map = {}
    total_max_score = 0.0
    if isinstance(logic_tree, list):
        for sec in logic_tree:
            for q in sec.get('questions', []):
                q_id = str(q.get('id'))
                questions_map[q_id] = q
                options = q.get('options', [])
                q_max = max([float(opt.get('points', 0)) * float(opt.get('weight', 1.0)) for opt in options], default=0.0)
                total_max_score += q_max

    # 3. Расчёт баллов
    total_score = 0.0
    scale_scores: Dict[str, float] = {}
    
    for q_id, q_ans in data.answers_json.items():
        q_model = questions_map.get(str(q_id))
        if not q_model:
            continue
            
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

    # 4. Интерпретация
    res_inter = await db.execute(select(TestInterpretation).where(TestInterpretation.test_id == test.id))
    rules = res_inter.scalars().all()
    
    interpretation_text = "Интерпретация будет предоставлена психологом."
    matches = []
    for rule in rules:
        val = scale_scores.get(rule.scale_tag, 0.0) if rule.scale_tag != "общая" else total_score
        if rule.is_percent:
            val = (val / total_max_score * 100) if total_max_score > 0 else 0.0
        if rule.min_val <= val < rule.max_val:
            matches.append(rule.text)
    if matches:
        interpretation_text = "\n\n".join(matches)

    # 5. Сохранение результата
    new_result = TestResult(
        test_id=test.id,
        link_id=test_link.id,
        client_fio=data.client_fio,
        client_email=data.client_email,
        answers=data.answers_json,
        total_points=round(total_score, 2),
        detailed_results={k: round(v, 3) for k, v in scale_scores.items()},
        interpretation_result=interpretation_text,
        max_possible_score=total_max_score,
        test_snapshot={"logic_tree": logic_tree},
        additional_info={"source": "public_link", "label": test_link.label}
    )
    db.add(new_result)
    await db.commit()
    
    return {
        "status": "success",
        "message": "Результаты сохранены. Ваш психолог свяжется с вами."
    }
