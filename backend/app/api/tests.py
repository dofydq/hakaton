from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.auth import get_current_user
from app.db.database import get_db
from app.models.models import Formula, Test, TestSchema, User
from app.schemas.schemas import TestCreateFull, TestResponseFull

router = APIRouter(prefix="/tests", tags=["tests"])

@router.post("/", response_model=TestResponseFull, status_code=status.HTTP_201_CREATED)
async def create_test(
    data: TestCreateFull,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Создание нового теста со связанными деревом логики и формулами расчета
    """
    # 1. Создаем сам тест (привязывая к психологу)
    test = Test(
        psychologist_id=current_user.id,
        title=data.title,
        description=data.description,
        access_settings_json=data.access_settings_json,
        is_active=True
    )
    db.add(test)
    await db.flush()  # Получаем test.id без полного коммита в БД (для транзакции)

    # 2. Создаем связанные схемы и формулы
    test_schema = TestSchema(test_id=test.id, logic_tree_json=data.logic_tree_json)
    formula = Formula(test_id=test.id, calculation_rules_json=data.calculation_rules_json)
    
    db.add(test_schema)
    db.add(formula)
    
    # 3. Транзакция: сохраняем всё вместе
    await db.commit()
    await db.refresh(test)
    
    # Возвращаем готовую схему (формируем вручную, т.к. структура ответа "плоская")
    return TestResponseFull(
        id=test.id,
        title=test.title,
        description=test.description,
        is_active=test.is_active,
        access_settings_json=test.access_settings_json,
        logic_tree_json=test_schema.logic_tree_json,
        calculation_rules_json=formula.calculation_rules_json
    )

@router.get("/", response_model=List[TestResponseFull])
async def get_my_tests(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Возвращает список всех тестов созданных авторизованным психологом.
    """
    # selectinload нужен для жадной загрузки связанных схем (TestSchema, Formula),
    # чтобы не было DetachedInstanceError при обращении к test.schemas
    query = select(Test).where(Test.psychologist_id == current_user.id).options(
        selectinload(Test.schemas),
        selectinload(Test.formulas)
    ).order_by(Test.id.desc())
    
    result = await db.execute(query)
    tests = result.scalars().all()
    
    response = []
    for test in tests:
        logic_tree = test.schemas[0].logic_tree_json if test.schemas else {}
        calc_rules = test.formulas[0].calculation_rules_json if test.formulas else {}
        
        if isinstance(logic_tree, list):
            for sec in logic_tree:
                if isinstance(sec, dict) and "questions" not in sec:
                    sec["questions"] = []
                    
        print("DEBUG DATA:", logic_tree)
        
        response.append(TestResponseFull(
            id=test.id,
            title=test.title,
            description=test.description,
            is_active=test.is_active,
            access_settings_json=test.access_settings_json,
            logic_tree_json=logic_tree,
            calculation_rules_json=calc_rules
        ))
        
    return response

@router.get("/{test_id}", response_model=TestResponseFull)
async def get_test(
    test_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Возвращает конкретный тест по ID
    """
    query = select(Test).where(
        Test.id == test_id, 
        Test.psychologist_id == current_user.id
    ).options(
        selectinload(Test.schemas),
        selectinload(Test.formulas)
    )
    result = await db.execute(query)
    test = result.scalars().first()
    
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Тест не найден или у вас нет к нему доступа")
        
    logic_tree = test.schemas[0].logic_tree_json if test.schemas else {}
    calc_rules = test.formulas[0].calculation_rules_json if test.formulas else {}
    
    if isinstance(logic_tree, list):
        for sec in logic_tree:
            if isinstance(sec, dict) and "questions" not in sec:
                sec["questions"] = []
                
    print("DEBUG DATA:", logic_tree)
    
    return TestResponseFull(
        id=test.id,
        title=test.title,
        description=test.description,
        is_active=test.is_active,
        access_settings_json=test.access_settings_json,
        logic_tree_json=logic_tree,
        calculation_rules_json=calc_rules
    )

@router.put("/{test_id}", response_model=TestResponseFull)
async def update_test(
    test_id: int,
    data: TestCreateFull,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Обновление существующего теста и его логики.
    """
    query = select(Test).where(
        Test.id == test_id, 
        Test.psychologist_id == current_user.id
    ).options(
        selectinload(Test.schemas),
        selectinload(Test.formulas)
    )
    result = await db.execute(query)
    test = result.scalars().first()
    
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Тест не найден или у вас нет к нему доступа")
        
    # Обновляем базовые поля теста
    test.title = data.title
    test.description = data.description
    test.access_settings_json = data.access_settings_json
    
    # Обновляем logic_tree_json
    if test.schemas:
        test.schemas[0].logic_tree_json = data.logic_tree_json
    else:
        test.schemas.append(TestSchema(test_id=test.id, logic_tree_json=data.logic_tree_json))
        
    # Обновляем calculation_rules_json
    if test.formulas:
        test.formulas[0].calculation_rules_json = data.calculation_rules_json
    else:
        test.formulas.append(Formula(test_id=test.id, calculation_rules_json=data.calculation_rules_json))
        
    await db.commit()
    await db.refresh(test)
    
    return TestResponseFull(
        id=test.id,
        title=test.title,
        description=test.description,
        is_active=test.is_active,
        access_settings_json=test.access_settings_json,
        logic_tree_json=data.logic_tree_json,
        calculation_rules_json=data.calculation_rules_json
    )

@router.get("/{test_id}/sessions")
async def get_test_sessions(
    test_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Получение всех сессий (клиентов), прошедших данный тест.
    Доступно только психологу-создателю теста.
    """
    from app.models.models import Session
    
    test_query = select(Test).where(Test.id == test_id, Test.psychologist_id == current_user.id)
    test_res = await db.execute(test_query)
    if not test_res.scalars().first():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    query = select(Session).where(Session.test_id == test_id).order_by(Session.id.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{test_id}/results")
async def get_test_results(
    test_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Получение всех результатов (TestResult) для конкретного теста.
    Доступно только психологу-создателю теста.
    Отсортировано по дате (свежие сверху).
    """
    from app.models.models import TestResult

    # Проверяем, что тест принадлежит психологу
    test_query = select(Test).where(Test.id == test_id, Test.psychologist_id == current_user.id)
    test_res = await db.execute(test_query)
    if not test_res.scalars().first():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    query = select(TestResult).where(TestResult.test_id == test_id).order_by(TestResult.created_at.desc())
    result = await db.execute(query)
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "client_fio": r.client_fio,
            "total_points": r.total_points,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]

