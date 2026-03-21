"""
reports.py
==========
Эндпоинты для генерации отчётов:
- POST /reports/api/sessions/{id}/complete   — расчёт баллов по шкалам
- POST /reports/api/sessions/{id}/report     — генерация DOCX-отчёта
- GET  /reports/api/results/{id}/report      — legacy GET endpoint (old flow)
- GET  /reports/{id}/download-docx          — legacy session endpoint
"""

from __future__ import annotations

import io
import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from starlette.concurrency import run_in_threadpool

from app.api.auth import get_current_user, get_current_user_optional
from app.db.database import get_db
from app.models.models import Session, User, TestResult, Test
from app.models.enums import UserRole
from app.schemas.schemas import ReportConfig
from app.services.scoring_service import ScoringService
from app.services.report_generator import ReportGenerator, generate_docx_report

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["reports"])


# ---------------------------------------------------------------------------
# Helper: build answers_list from TestResult
# ---------------------------------------------------------------------------

def _build_answers_list(test_result: TestResult, test: Test) -> list[dict]:
    schema = test.schemas[0] if test.schemas else None
    logic_tree = []
    snap = test_result.test_snapshot
    if isinstance(snap, dict) and "logic_tree" in snap:
        logic_tree = snap["logic_tree"]
    elif schema:
        logic_tree = schema.logic_tree_json or []

    questions_map: dict = {}
    if isinstance(logic_tree, list):
        for sec in logic_tree:
            if isinstance(sec, dict):
                for q in sec.get("questions", []):
                    questions_map[str(q.get("id", ""))] = q

    answers_list: list[dict] = []
    for q_id, q_ans in (test_result.answers or {}).items():
        if q_id == "_metadata":
            continue
        q_model = questions_map.get(str(q_id), {})
        q_text = q_model.get("title") or q_model.get("text") or q_id
        options = q_model.get("options", [])

        if isinstance(q_ans, list):
            texts = []
            for item in q_ans:
                for opt in options:
                    if opt.get("id") == item:
                        texts.append(opt.get("text", str(item)))
                        break
                else:
                    texts.append(str(item))
            ans_text = ", ".join(texts)
        else:
            ans_text = str(q_ans)
            for opt in options:
                if opt.get("id") == q_ans:
                    ans_text = opt.get("text", ans_text)
                    break

        answers_list.append({"question": q_text, "answer": ans_text})
    return answers_list


# ---------------------------------------------------------------------------
# ЗАДАЧА 4: POST /api/sessions/{id}/complete
# ---------------------------------------------------------------------------

@router.post("/api/sessions/{session_id}/complete")
async def complete_session(
    session_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """
    Вызывает ScoringService.process_test_completion, возвращает detailed_results.
    Только для залогиненного психолога.
    """
    try:
        service = ScoringService(db)
        detailed = await service.process_test_completion(session_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "status": "completed",
        "detailed_results": detailed,
        "total_score": round(sum(detailed.values()), 3),
    }


# ---------------------------------------------------------------------------
# ЗАДАЧА 4: POST /api/sessions/{id}/report
# ---------------------------------------------------------------------------

@router.post("/api/sessions/{session_id}/report")
async def session_report(
    session_id: int,
    config: ReportConfig = Body(default_factory=ReportConfig),
    current_user: Annotated[User | None, Depends(get_current_user_optional)] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Генерация DOCX-отчёта на основе данных сессии (Session).
    """
    query = (
        select(Session, Test)
        .join(Test, Session.test_id == Test.id)
        .where(Session.id == session_id)
        .options(selectinload(Session.answers), selectinload(Test.schemas))
    )
    res = await db.execute(query)
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Сессия не найдена")

    session, test = row

    # Проверка прав (психолог-владелец или админ)
    if current_user:
        if (
            current_user.id != test.psychologist_id
            and current_user.role != "admin"
        ):
            raise HTTPException(status_code=403, detail="Нет доступа к этой сессии")

    # Формируем answers_list вручную из session.answers (для генератора)
    # В реальности тут может быть более сложный маппинг
    answers_list = []
    # (Упрощенный маппинг для примера, можно расширить)
    
    user_name = session.client_fio or "Клиент"

    try:
        gen = ReportGenerator(config)
        # Вызываем build с новыми полями из Session
        buffer: io.BytesIO = await run_in_threadpool(
            gen.build,
            user_name=user_name,
            test_title=test.title,
            score=session.total_raw_score or 0.0,
            answers_list=answers_list,
            detailed_results=session.detailed_results or {},
            interpretation_result=session.interpretation_result,
            max_score=session.max_possible_score or 100.0,
        )
    except Exception as exc:
        logger.exception(f"Ошибка генерации отчёта для сессии {session_id}")
        raise HTTPException(status_code=500, detail=f"Ошибка генерации: {exc}")

    filename = f"report_{session_id}.docx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ---------------------------------------------------------------------------
# Legacy: GET /api/results/{result_id}/report  (старый кабинет психолога)
# ---------------------------------------------------------------------------

@router.get("/api/results/{result_id}/report")
async def download_test_result_report(
    result_id: str,
    type: str = Query("client"),
    current_user: Annotated[User | None, Depends(get_current_user_optional)] = None,
    db: AsyncSession = Depends(get_db),
):
    print(f"DEBUG: Попытка скачать отчет для ID: {result_id}", flush=True)

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
    row = (await db.execute(query)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Результат не найден")

    test_result, test, owner = row

    if test_result.user_id is not None:
        if not current_user:
            raise HTTPException(status_code=401, detail="Требуется авторизация")
        if (
            current_user.id != test_result.user_id
            and current_user.id != test.psychologist_id
            and current_user.role != UserRole.admin
        ):
            raise HTTPException(status_code=403, detail="Нет доступа к отчёту")

    _meta = (test_result.answers or {}).get("_metadata", {})
    category_scores = _meta.get("section_scores_percent", {})

    logic_tree = []
    snap = test_result.test_snapshot
    report_config = {"show_table": True, "show_chart": False, "show_interpretation": True}
    if isinstance(snap, dict) and "logic_tree" in snap:
        logic_tree = snap["logic_tree"]
        report_config = snap.get("report_config", report_config)
    elif test.schemas:
        logic_tree = test.schemas[0].logic_tree_json or []
        report_config = test.report_config or report_config

    questions_map: dict = {}
    if isinstance(logic_tree, list):
        for sec in logic_tree:
            if isinstance(sec, dict) and "questions" in sec:
                sec_title = sec.get("title") or sec.get("id") or "Без категории"
                cat_score = 0
                for q in sec["questions"]:
                    questions_map[str(q.get("id"))] = q
                    q_id = str(q.get("id"))
                    if not category_scores:
                        q_ans = (test_result.answers or {}).get(q_id)
                        if q_ans is not None:
                            for opt in q.get("options", []):
                                if isinstance(q_ans, list):
                                    if str(opt.get("id")) in [str(v) for v in q_ans]:
                                        cat_score += int(opt.get("points", 0))
                                elif str(opt.get("id")) == str(q_ans):
                                    cat_score += int(opt.get("points", 0))
                if not category_scores:
                    category_scores[sec_title] = cat_score

    answers_list = _build_answers_list(test_result, test)
    user_name = test_result.client_fio or owner.full_name or "Неизвестный"

    buffer = await run_in_threadpool(
        generate_docx_report,
        user_name=user_name,
        test_title=test.title,
        score=test_result.total_points,
        answers_list=answers_list,
        category_scores=category_scores,
        report_config=report_config,
        report_type=type,
        detailed_results=test_result.detailed_results or {},
    )

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=report_{type}.docx"},
    )


# ---------------------------------------------------------------------------
# Legacy: GET /{session_id}/download-docx
# ---------------------------------------------------------------------------

@router.get("/{session_id}/download-docx")
async def download_report_docx(
    session_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    query = select(Session).where(Session.id == session_id).options(
        selectinload(Session.answers),
        selectinload(Session.test),
    )
    result = await db.execute(query)
    session = result.scalars().first()

    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    if session.test.psychologist_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")

    buffer = io.BytesIO()
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=report_{session_id}.docx"},
    )
