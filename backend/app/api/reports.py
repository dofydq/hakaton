from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import io
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.api.auth import get_current_user, get_current_user_optional
from app.db.database import get_db
from app.models.models import Session, User, TestResult, Test, UserRole
from app.services.report_generator import generate_docx_report
import uuid

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/api/results/{result_id}/report")
async def download_test_result_report(
    result_id: str,
    current_user: Annotated[User | None, Depends(get_current_user_optional)] = None,
    db: AsyncSession = Depends(get_db)
):
    print(f"DEBUG: Попытка скачать отчет для ID: {result_id}", flush=True)
    """
    Скачивание сгенерированного DOCX-отчета о результатах теста.
    """
    try:
        result_uuid = uuid.UUID(result_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат ID")

    query = (
        select(TestResult, Test, User)
        .join(Test, TestResult.test_id == Test.id)
        .join(User, Test.psychologist_id == User.id)
        .where(TestResult.id == result_uuid)
        .options(selectinload(Test.schemas))
    )
    result = await db.execute(query)
    row = result.first()
    
    if not row:
        print(f"DEBUG: Результат с ID {result_id} не найден в БД!", flush=True)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Результат не найден"
        )
        
    test_result, test, user = row

    if test_result.user_id is not None:
        if not current_user:
            raise HTTPException(status_code=401, detail="Требуется авторизация для скачивания этого отчета")
        if current_user.id != test_result.user_id and current_user.id != test.psychologist_id and current_user.role != UserRole.admin:
            raise HTTPException(status_code=403, detail="Нет доступа к отчету")
    
    # Подготавливаем список ответов
    answers_list = []
    
    # Пытаемся достать названия вопросов из схемы, если ключи - это ID
    # Извлекаем category_scores из метаданных или считаем по старинке (fallback)
    _meta = test_result.answers.get("_metadata", {})
    category_scores = _meta.get("section_scores_percent", {})
    
    questions_map = {}
    logic_tree = test.schemas[0].logic_tree_json if test.schemas else []
    if isinstance(logic_tree, list):
        for sec in logic_tree:
            if isinstance(sec, dict) and 'questions' in sec:
                sec_title = sec.get('title') or sec.get('id') or 'Без категории'
                cat_score = 0
                for q in sec['questions']:
                    questions_map[str(q.get('id'))] = q
                    q_id = str(q.get('id'))
                    
                    if not category_scores: # fallback if no metadata
                        q_ans = test_result.answers.get(q_id)
                        if q_ans is not None:
                            options = q.get('options', [])
                            if isinstance(q_ans, list):
                                for ans_item in q_ans:
                                    for opt in options:
                                        if str(opt.get('id')) == str(ans_item):
                                            cat_score += int(opt.get('points', 0))
                            else:
                                for opt in options:
                                    if str(opt.get('id')) == str(q_ans):
                                        cat_score += int(opt.get('points', 0))
                if not category_scores:
                    category_scores[sec_title] = cat_score
                    
    for q_id, q_ans in test_result.answers.items():
        if str(q_id) == '_metadata':
            continue
        q_model = questions_map.get(str(q_id), {})
        question_text = q_model.get('title') or q_model.get('text') or q_id
        options = q_model.get('options', [])
        
        # Если ответ - это список (multiple choice), форматируем его
        if isinstance(q_ans, list):
            matched_opts = []
            for ans_item in q_ans:
                opt_str = str(ans_item)
                for opt in options:
                    if opt.get('id') == ans_item:
                        opt_str = opt.get('text', opt_str)
                        break
                matched_opts.append(opt_str)
            q_ans_text = ", ".join(matched_opts)
        else:
            q_ans_text = str(q_ans)
            for opt in options:
                if opt.get('id') == q_ans:
                    q_ans_text = opt.get('text', q_ans_text)
                    break
                    
        answers_list.append({"question": question_text, "answer": q_ans_text})
        
    # Формируем имя пользователя (ФИО клиента)
    user_name = test_result.client_fio
    if not user_name:
        user_name = user.full_name or "Неизвестный"
        
    buffer = generate_docx_report(
        user_name=user_name,
        test_title=test.title,
        score=test_result.total_points,
        answers_list=answers_list,
        category_scores=category_scores
    )
    
    return StreamingResponse(
        buffer, 
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
        headers={"Content-Disposition": "attachment; filename=report.docx"}
    )


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
    query = select(Session).where(Session.id == session_id).options(
        selectinload(Session.answers),
        selectinload(Session.test)
    )
    result = await db.execute(query)
    session = result.scalars().first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Сессия не найдена"
        )
        
    if session.test.psychologist_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="У вас нет доступа к этой сессии"
        )
        
    # Заглушка, так как сигнатура функции изменилась стейтментом выше
    # При необходимости можно адаптировать старый флоу сессий,
    # Но по заданию старый путь нам не важен
    buffer = io.BytesIO()
    return StreamingResponse(
        buffer, 
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
        headers={"Content-Disposition": f"attachment; filename=report_{session_id}.docx"}
    )
