"""
scoring_service.py
==================
ScoringService — класс бизнес-логики расчёта результатов тест-сессии по шкалам.

Алгоритм:
1. Через JOIN собрать Session + все Answer + logic_tree.
2. Для каждого Answer получить выбранные варианты (values) из options в logic_tree.
3. Сгруппировать: score per scale_tag = Σ(points * weight) для выбранных вариантов.
4. Атомарно записать detailed_results + status + completed_at в Session.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Session, TestSchema, Answer, Test, TestInterpretation

logger = logging.getLogger(__name__)


class ScoringService:
    """
    Инкапсулирует логику расчёта баллов по шкалам для одной сессии.
    Использует переданную async db-сессию.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def process_test_completion(self, session_id: int) -> dict[str, float]:
        """
        Рассчитывает баллы по шкалам, атомарно сохраняет в Session.
        """
        session = await self._load_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # 1. Считаем баллы
        detailed = self._calculate_scores(session)
        
        # 2. Считаем макс. возможный балл
        max_score = self._calculate_max_possible_score(session)
        
        # 3. Находим интерпретацию
        interpretation = await self._get_interpretation(session, detailed, max_score)
        
        # 4. Сохраняем
        await self._persist(session, detailed, max_score, interpretation)
        return detailed

    async def _load_session(self, session_id: int) -> Optional[Session]:
        """Загружает сессию со всеми ответами и схемой теста."""
        q = (
            select(Session)
            .where(Session.id == session_id)
            .options(
                selectinload(Session.answers),
                selectinload(Session.test).selectinload(Test.schemas)
            )
        )
        res = await self._db.execute(q)
        return res.scalars().first()

    def _calculate_scores(self, session: Session) -> dict[str, float]:
        """
        Основная логика: Σ(points * weight) для каждого scale_tag.
        """
        logic_tree = []
        if session.test and session.test.schemas:
            logic_tree = session.test.schemas[0].logic_tree_json or []
        
        # Мапа вопросов для быстрого доступа
        questions_map = {}
        for section in logic_tree:
            for q in section.get("questions", []):
                questions_map[str(q.get("id"))] = q
        
        scale_scores = {}
        for ans in session.answers:
            q_id = str(ans.question_id)
            q_model = questions_map.get(q_id)
            if not q_model:
                continue
            
            q_scale_default = q_model.get("scale_tag") or "общая"
            options = q_model.get("options", [])
            val = ans.value_json # Это может быть ID или список ID
            
            chosen_opts = []
            if isinstance(val, list):
                chosen_opts = [o for o in options if o.get("id") in val]
            else:
                chosen_opts = [o for o in options if o.get("id") == val]
            
            for opt in chosen_opts:
                points = float(opt.get("points", 0))
                weight = float(opt.get("weight", 1))
                contrib = points * weight
                
                scale = opt.get("scale_tag") or q_scale_default
                scale_scores[scale] = scale_scores.get(scale, 0.0) + contrib

        return scale_scores

    def _calculate_max_possible_score(self, session: Session) -> float:
        """Считает сумму максимальных весов всех вопросов."""
        logic_tree = []
        if session.test and session.test.schemas:
            logic_tree = session.test.schemas[0].logic_tree_json or []
        
        total_max = 0.0
        for section in logic_tree:
            for q in section.get("questions", []):
                options = q.get("options", [])
                if options:
                    # Максимальный возможный вклад от этого вопроса
                    max_q = max([float(o.get("points", 0)) * float(o.get("weight", 1)) for o in options], default=0.0)
                    total_max += max_q
        return total_max

    async def _get_interpretation(self, session: Session, detailed: dict, max_score: float) -> str:
        """Находит подходящий текст в TestInterpretation."""
        from app.models.models import TestInterpretation
        
        q = select(TestInterpretation).where(TestInterpretation.test_id == session.test_id)
        res = await self._db.execute(q)
        rules = res.scalars().all()
        
        total_raw = sum(detailed.values())
        total_percent = (total_raw / max_score * 100) if max_score > 0 else 0.0
        
        matches = []
        for rule in rules:
            # Проверяем общую шкалу или конкретную
            score_to_check = detailed.get(rule.scale_tag, 0.0) if rule.scale_tag != "общая" else total_raw
            if rule.is_percent:
                score_to_check = (score_to_check / max_score * 100) if max_score > 0 else 0.0
            
            if rule.min_val <= score_to_check < rule.max_val:
                matches.append(rule.text)
        
        return "\n\n".join(matches) if matches else "Интерпретация отсутствует."

    async def _persist(self, session: Session, detailed: dict[str, float], max_score: float, interpretation: str) -> None:
        """Атомарно записывает результаты в сессию."""
        try:
            session.detailed_results = detailed
            session.total_raw_score = round(sum(detailed.values()), 3)
            session.total_score = session.total_raw_score # Совместимость
            session.max_possible_score = max_score
            session.interpretation_result = interpretation
            session.status = "completed"
            session.completed_at = datetime.now(tz=timezone.utc)
            session.current_progress_percent = 100
            await self._db.commit()
            await self._db.refresh(session)
        except Exception as exc:
            await self._db.rollback()
            logger.exception("Ошибка при сохранении результатов сессии %s", session.id)
            raise RuntimeError(f"Не удалось сохранить результаты: {exc}") from exc


# ---------------------------------------------------------------------------
# Functional shortcut (обратная совместимость)
# ---------------------------------------------------------------------------

async def calculate_session_results(
    db: AsyncSession,
    session_id: int,
) -> Optional[dict[str, float]]:
    """
    Shortcut для вызова ScoringService.process_test_completion.
    Возвращает None если сессия не найдена.
    """
    try:
        return await ScoringService(db).process_test_completion(session_id)
    except ValueError:
        return None
