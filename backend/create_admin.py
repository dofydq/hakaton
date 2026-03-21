import asyncio
import sys
import os

# Добавляем путь к корню, чтобы импорты из app работали
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.models import User
from app.core.security import get_password_hash
from sqlalchemy import select

async def create_admin():
    async with SessionLocal() as db:
        # Проверяем, существует ли уже админ
        query = select(User).where(User.email == "admin@profdnk.ru")
        result = await db.execute(query)
        existing_admin = result.scalars().first()
        
        if existing_admin:
            print("Администратор admin@profdnk.ru уже существует.")
            return

        # Хэшируем пароль
        hashed_password = get_password_hash("admin123")

        # Создаем админа
        new_admin = User(
            email="admin@profdnk.ru",
            password_hash=hashed_password,
            full_name="Admin",
            phone="88005553535",
            role="admin",
            is_active=True
        )

        db.add(new_admin)
        await db.commit()
        print("Администратор успешно создан!")
        print("Email: admin@profdnk.ru")
        print("Pass: admin123")

if __name__ == "__main__":
    asyncio.run(create_admin())
