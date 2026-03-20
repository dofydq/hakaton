import io
import base64
import qrcode

def generate_qr_code(data: str) -> str:
    """
    Генерирует QR-код из строки и возвращает его в формате Base64,
    готовом для использования в src тега <img> на фронтенде.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    # Сохраняем в буфер
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    
    # Кодируем в base64
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    # Формируем Data URI
    return f"data:image/png;base64,{img_str}"
