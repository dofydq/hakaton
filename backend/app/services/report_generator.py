"""
report_generator.py
====================
ReportGenerator — класс генерации DOCX-отчётов.
Управляется через ReportConfig (Pydantic).
Работает полностью в памяти через io.BytesIO.
"""

from __future__ import annotations

import io
import datetime
import logging
from typing import Any

from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH

from app.schemas.schemas import ReportConfig

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Low-level docx helpers (module-level, reusable)
# ---------------------------------------------------------------------------

def _table_borders(table, color: str = "003366", sz: str = "8") -> None:
    tbl = table._tbl
    borders = OxmlElement("w:tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        node = OxmlElement(f"w:{side}")
        node.set(qn("w:val"), "single")
        node.set(qn("w:sz"), sz)
        node.set(qn("w:space"), "0")
        node.set(qn("w:color"), color)
        borders.append(node)
    tbl.tblPr.append(borders)


def _shade_cell(cell, fill: str = "E8EDF3") -> None:
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tcPr.append(shd)


def _section_heading(doc: Document, text: str, color_hex: str = "003366") -> None:
    """Синий заголовок с нижней чертой."""
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(
        int(color_hex[0:2], 16),
        int(color_hex[2:4], 16),
        int(color_hex[4:6], 16),
    )
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "6")
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), color_hex)
    pBdr.append(bottom)
    pPr.append(pBdr)


def _bold_kv(doc: Document, key: str, value: str) -> None:
    p = doc.add_paragraph()
    p.add_run(f"{key}: ").bold = True
    p.add_run(value)


# ---------------------------------------------------------------------------
# ReportGenerator
# ---------------------------------------------------------------------------

class ReportGenerator:
    """
    Генерирует DOCX-документ из данных сессии + конфигурации.

    Usage:
        gen = ReportGenerator(config)
        buffer = gen.build(
            user_name="Иван",
            test_title="Тест",
            score=75.0,
            answers_list=[{"question": ..., "answer": ...}],
            detailed_results={"anxiety": 3.0, "logic": 12.0},
        )
    """

    def __init__(self, config: ReportConfig) -> None:
        self.config = config

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    def build(
        self,
        user_name: str,
        test_title: str,
        score: float,
        answers_list: list[dict[str, str]],
        detailed_results: dict[str, float] | None = None,
        interpretation_result: str | None = None,
        max_score: float = 0.0,
    ) -> io.BytesIO:
        doc = Document()
        self._setup_document(doc)
        self._add_logo(doc)
        self._add_title(doc)

        # 1. Личные данные
        if not self.config.anonymize_user:
            self._add_personal_info(doc, user_name, test_title, score)

        # 2. Таблица результатов по шкалам
        if self.config.include_scales and detailed_results:
            self._add_results_table(doc, detailed_results, max_score)

        # 3. Ответы пользователя
        if self.config.include_answers and answers_list:
            self._add_answers_table(doc, answers_list)

        # 4. Текстовое заключение
        if self.config.include_interpretation:
            self._add_final_interpretation(doc, interpretation_result)

        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        return buf

    # ------------------------------------------------------------------
    # Private document-building methods
    # ------------------------------------------------------------------

    def _add_results_table(
        self, doc: Document, detailed_results: dict[str, float], max_score: float
    ) -> None:
        _section_heading(doc, "Результаты по шкалам")
        t = doc.add_table(rows=1, cols=3) # Шкала | Балл | %
        _table_borders(t)
        hdr = t.rows[0].cells
        cols = ["Шкала", "Сырой балл", "Процент %"]
        for i, label in enumerate(cols):
            hdr[i].text = label
            hdr[i].paragraphs[0].runs[0].bold = True
            _shade_cell(hdr[i], "E8EDF3")

        for scale_name, raw in detailed_results.items():
            percent = (raw / max_score * 100) if max_score > 0 else 0.0
            row = t.add_row().cells
            row[0].text = str(scale_name)
            row[1].text = f"{raw:.2f}"
            row[2].text = f"{percent:.1f}%"
        doc.add_paragraph()

    def _add_final_interpretation(self, doc: Document, result_text: str | None) -> None:
        _section_heading(doc, "Заключение")
        p = doc.add_paragraph(result_text or "Интерпретация не была рассчитана.")
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT

    # ------------------------------------------------------------------
    # Static helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _level_label(score: float) -> str:
        if score < 0:
            return "ниже нормы"
        if score == 0:
            return "нейтрально"
        if score <= 5:
            return "низкий"
        if score <= 15:
            return "средний"
        return "высокий"

    def _interp_text(self, norm_score: float, scale: str) -> tuple[str, RGBColor]:
        rt = self.config.report_type
        if norm_score > 70:
            color = RGBColor(0, 128, 0)
            text = (
                f"Шкала «{scale}»: Высокий уровень — выраженные склонности."
                if rt == "psychologist"
                else f"Шкала «{scale}»: Отличный результат! Ярко выраженные склонности."
            )
        elif norm_score >= 40:
            color = RGBColor(180, 120, 0)
            text = (
                f"Шкала «{scale}»: Средний уровень — базовые задатки присутствуют."
                if rt == "psychologist"
                else f"Шкала «{scale}»: Хороший потенциал. Рекомендуется развитие."
            )
        else:
            color = RGBColor(200, 0, 0)
            text = (
                f"Шкала «{scale}»: Низкий уровень — рекомендуется консультация."
                if rt == "psychologist"
                else f"Шкала «{scale}»: Это направление пока не ваше. Исследуйте другие профили."
            )
        return text, color


# ---------------------------------------------------------------------------
# Backward-compat functional wrapper (используется старым GET-эндпоинтом)
# ---------------------------------------------------------------------------

def generate_docx_report(
    user_name: str,
    test_title: str,
    score: float,
    answers_list: list,
    category_scores: dict | None = None,
    report_config: dict | None = None,
    report_type: str = "client",
    settings: "ReportConfig | None" = None,
    detailed_results: dict | None = None,
    interpretation_result: str | None = None,
    max_score: float = 0.0,
) -> io.BytesIO:
    from app.schemas.schemas import ReportConfig as RC

    if settings is not None:
        cfg = settings
    else:
        c = report_config or {}
        cfg = RC(
            include_scales=c.get("show_table", True),
            include_answers=report_type == "psychologist",
            include_interpretation=c.get("show_interpretation", True),
            anonymize_user=False,
            report_type=report_type,
        )

    return ReportGenerator(cfg).build(
        user_name=user_name,
        test_title=test_title,
        score=score,
        answers_list=answers_list,
        detailed_results=detailed_results or category_scores or {},
        interpretation_result=interpretation_result,
        max_score=max_score,
    )
