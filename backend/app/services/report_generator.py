import io
from docx import Document

def generate_docx_report(session_data, answers_data) -> io.BytesIO:
    """Генерация отчета в формате DOCX в оперативной памяти."""
    doc = Document()
    
    # Добавляем заголовок с ФИО клиента
    doc.add_heading(f"Отчет по тестированию: {session_data.client_fio}", 0)
    
    # Дополнительная информация о прохождении
    status_date = session_data.completed_at or session_data.started_at
    doc.add_paragraph(f"Дата прохождения (на начало или завершение): {status_date}")
    doc.add_paragraph(f"Прогресс: {session_data.current_progress_percent}%")
    
    # Добавляем ответы
    doc.add_heading("Ответы клиента", level=1)
    for ans in answers_data:
        doc.add_paragraph(f"Вопрос ID: {ans.question_id} | Ответ: {ans.value_json}")
        
    # Сохраняем документ в буфер
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    return buffer
