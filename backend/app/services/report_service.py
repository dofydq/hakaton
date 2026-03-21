import logging
from uuid import UUID

logger = logging.getLogger(__name__)

async def generate_client_report(result_id: UUID) -> str:
    """
    Генерация интерпретационного отчёта для клиента (HTML/DOCX).
    Фокус на описательном разъяснении результатов.
    """
    logger.info(f"Stub: Generating client report for result {result_id}")
    return f"Client Report for {result_id}: Ваша профессиональная интерпретация скоро будет готова."

async def generate_psychologist_report(result_id: UUID) -> str:
    """
    Генерация технического отчёта для психолога (DOCX).
    Фокус на сырых баллах, метриках и графиках.
    """
    logger.info(f"Stub: Generating psychologist report for result {result_id}")
    return f"Psychologist Technical Report for {result_id}: Raw scores and metrics analysis."

async def send_report_email(email: str, report_data: str, report_type: str = "client"):
    """
    Stub: Отправка отчёта по электронной почте.
    """
    logger.info(f"Stub: Sending {report_type} report to {email}")
    return True
