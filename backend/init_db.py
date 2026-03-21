import asyncio
import sys
import os

# Добавляем путь к корню, чтобы импорты из app работали
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import async_session_maker, engine, Base
from app.models.models import User, Test, TestSchema, Formula, TestInterpretation, UserRole
from app.core.security import get_password_hash
from sqlalchemy import select, text

async def init_db():
    print("--- [START] ASYNC DB INITIALIZATION ---")
    
    # 1. Создание всех таблиц
    async with engine.connect() as conn:
        print(f"DEBUG: Found {len(Base.metadata.tables)} tables in metadata: {list(Base.metadata.tables.keys())}")
        await conn.run_sync(Base.metadata.create_all)
        await conn.commit()
        print("1. Database tables created and committed.")
        
        # Прямая проверка наличия таблицы через SQL
        try:
            await conn.execute(text("SELECT 1 FROM users LIMIT 1"))
            print("DEBUG: Direct SQL 'SELECT 1 FROM users' - SUCCESS.")
        except Exception as e:
            print(f"DEBUG: Direct SQL 'SELECT 1 FROM users' - FAILED: {e}")
            print("DEBUG: Attempting raw SQL table creation as fallback...")
            try:
                # Очень грубое создание таблицы чисто для проверки прав
                await conn.execute(text("CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email VARCHAR)"))
                await conn.commit()
                print("DEBUG: Raw SQL 'CREATE TABLE' - SUCCESS.")
            except Exception as e2:
                print(f"DEBUG: Raw SQL 'CREATE TABLE' - FAILED: {e2}")

    # 2. Наполнение данными (в отдельной сессии после коммита таблиц)
    async with async_session_maker() as session:
        async with session.begin():
            # Проверяем админа
            admin_email = "admin@profdnk.ru"
            res = await session.execute(select(User).where(User.email == admin_email))
            admin = res.scalars().first()
            
            if not admin:
                admin = User(
                    email=admin_email,
                    password_hash=get_password_hash("admin123"),
                    full_name="Администратор Системы",
                    phone="88005553535",
                    role=UserRole.admin,
                    specialization="System Architect",
                    is_active=True
                )
                session.add(admin)
                await session.flush()
                print(f"2. Admin created: {admin_email} (pass: admin123)")
            else:
                print(f"2. Admin {admin_email} already exists.")

            # 3. Демо-тест "Оценка гибких навыков (Soft Skills)"
            test_title = "Оценка гибких навыков (Soft Skills)"
            res = await session.execute(select(Test).where(Test.title == test_title))
            if not res.scalars().first():
                demo_test = Test(
                    psychologist_id=admin.id,
                    title=test_title,
                    description="Тест для оценки лидерских качеств, командной работы и уровня самоорганизации.",
                    is_active=True,
                    access_settings_json={"mode": "public"},
                    report_config={"show_table": True, "show_interpretation": True}
                )
                session.add(demo_test)
                await session.flush()

                # Схема теста: Вопросы с разными шкалами и весами
                logic_tree = [
                    {
                        "id": "sec_leadership",
                        "title": "Лидерство",
                        "questions": [
                            {
                                "id": "q_lead_1",
                                "type": "single_choice",
                                "title": "Готовы ли вы нести ответственность за ошибки всей команды?",
                                "scale_tag": "leadership",
                                "options": [
                                    {"id": "o_l1_y", "text": "Да, безусловно", "weight": 5.0},
                                    {"id": "o_l1_m", "text": "Только если ошибка моя", "weight": 2.0},
                                    {"id": "o_l1_n", "text": "Нет, каждый отвечает за себя", "weight": 0.0}
                                ]
                            }
                        ]
                    },
                    {
                        "id": "sec_soft",
                        "title": "Работа в команде и организация",
                        "questions": [
                            {
                                "id": "q_team_1",
                                "type": "single_choice",
                                "title": "Как вы реагируете на критику ваших идей коллегами?",
                                "scale_tag": "teamwork",
                                "options": [
                                    {"id": "o_t1_1", "text": "Анализирую и меняю подход", "weight": 5.0},
                                    {"id": "o_t1_2", "text": "Слушаю, но остаюсь при своем", "weight": 1.0},
                                    {"id": "o_t1_3", "text": "Обижаюсь или спорю", "weight": 0.0}
                                ]
                            },
                            {
                                "id": "q_org_1",
                                "type": "single_choice",
                                "title": "Используете ли вы планировщики задач (Trello, Notion и др.)?",
                                "scale_tag": "organization",
                                "options": [
                                    {"id": "o_o1_y", "text": "Постоянно, мой день расписан", "weight": 5.0},
                                    {"id": "o_o1_s", "text": "Иногда, для важных дел", "weight": 3.0},
                                    {"id": "o_o1_n", "text": "Все держу в голове", "weight": 1.0}
                                ]
                            }
                        ]
                    }
                ]
                
                ts = TestSchema(test_id=demo_test.id, logic_tree_json=logic_tree)
                session.add(ts)

                # Пустая формула для базового суммирования
                f = Formula(test_id=demo_test.id, calculation_rules_json={})
                session.add(f)

                # Правила интерпретации
                interpretations = [
                    TestInterpretation(
                        test_id=demo_test.id, scale_tag="leadership",
                        min_val=0, max_val=2.99, is_percent=False,
                        text="Вам комфортнее быть исполнителем, чем вести людей за собой."
                    ),
                    TestInterpretation(
                        test_id=demo_test.id, scale_tag="leadership",
                        min_val=3, max_val=5, is_percent=False,
                        text="Ярко выраженные лидерские качества. Вы опора для команды."
                    ),
                    TestInterpretation(
                        test_id=demo_test.id, scale_tag="teamwork",
                        min_val=0, max_val=2.99, is_percent=False,
                        text="Командная работа может вызывать у вас стресс. Попробуйте развивать эмпатию."
                    ),
                    TestInterpretation(
                        test_id=demo_test.id, scale_tag="teamwork",
                        min_val=3, max_val=5, is_percent=False,
                        text="Вы отличный командный игрок, умеющий слушать и слышать коллег."
                    ),
                    TestInterpretation(
                        test_id=demo_test.id, scale_tag="organization",
                        min_val=0, max_val=2.99, is_percent=False,
                        text="Хаотичный стиль работы. Рекомендуется освоить техники тайм-менеджмента."
                    ),
                    TestInterpretation(
                        test_id=demo_test.id, scale_tag="organization",
                        min_val=3, max_val=5, is_percent=False,
                        text="Высокий уровень самодисциплины и отличные навыки планирования."
                    )
                ]
                for inter in interpretations:
                    session.add(inter)

                print(f"3. Demo test '{test_title}' with 3 scales created.")
            else:
                print(f"3. Demo test '{test_title}' already exists.")

    print("--- [SUCCESS] DB INITIALIZATION COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(init_db())
