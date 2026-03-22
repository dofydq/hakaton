from datetime import datetime
from typing import Any, Dict, List, Optional, Union
import uuid

from pydantic import BaseModel, ConfigDict, EmailStr

# Импортируем Enum из моделей, чтобы не дублировать
from app.models.enums import UserRole

# Определяем удобный тип для JSON (dict или list)
JsonType = Union[Dict[str, Any], List[Dict[str, Any]]]

# --- User ---

class UserBase(BaseModel):
    role: UserRole = UserRole.pending
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    bio_markdown: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    full_name: str
    phone: str
    password: str

class UserRead(UserBase):
    id: int
    access_until: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UserUpdateProfile(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    bio_markdown: Optional[str] = None
    avatar_url: Optional[str] = None
    access_until: Optional[datetime] = None

# Alias for generic UserUpdate as requested by user
UserUpdate = UserUpdateProfile

class UserAdminUpdate(UserUpdateProfile):
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class AdminUserResponse(UserRead):
    # This matches UserRead but we can keep the alias for clarity in admin.py
    pass


# --- Report config ---

class ReportConfig(BaseModel):
    """Конфигурация генерации DOCX-отчёта."""
    include_scales: bool = True          # таблица шкал и сырых баллов
    include_answers: bool = False        # список «Вопрос — Ответ»
    include_interpretation: bool = True  # текстовое заключение по каждой шкале
    anonymize_user: bool = False         # скрыть блок с ФИО (анонимный отчёт)
    report_type: str = "client"          # "client" | "psychologist"

# Обратная совместимость
ReportSettings = ReportConfig


# --- Test ---

class TestBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_active: bool = True
    access_settings_json: Optional[JsonType] = None
    report_config: Optional[JsonType] = {"show_table": True, "show_chart": False, "show_interpretation": True}

class TestCreate(TestBase):
    psychologist_id: int

class TestRead(TestBase):
    id: int
    psychologist_id: int

    model_config = ConfigDict(from_attributes=True)


# --- TestSchema ---

class TestSchemaBase(BaseModel):
    logic_tree_json: JsonType

class TestSchemaCreate(TestSchemaBase):
    test_id: int

class TestSchemaRead(TestSchemaBase):
    id: int
    test_id: int

    model_config = ConfigDict(from_attributes=True)


# --- Formula ---

class FormulaBase(BaseModel):
    calculation_rules_json: JsonType

class FormulaCreate(FormulaBase):
    test_id: int

class FormulaRead(FormulaBase):
    id: int
    test_id: int

    model_config = ConfigDict(from_attributes=True)

# --- Interpretation ---
class TestInterpretationBase(BaseModel):
    scale_tag: str
    min_val: float
    max_val: float
    is_percent: bool = False
    text: str

class TestInterpretationCreate(TestInterpretationBase):
    pass

class TestInterpretationRead(TestInterpretationBase):
    id: int
    test_id: int
    model_config = ConfigDict(from_attributes=True)


# --- Session ---

class SessionBase(BaseModel):
    client_fio: str
    client_extra_data_json: Optional[JsonType] = None
    current_progress_percent: int = 0

class SessionCreate(SessionBase):
    test_id: int

class SessionRead(SessionBase):
    id: int
    test_id: int
    client_fio: str
    status: str
    total_score: float = 0.0
    total_raw_score: float = 0.0
    max_possible_score: float = 0.0
    interpretation_result: Optional[str] = None
    detailed_results: Optional[dict] = None
    current_progress_percent: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Answer ---

class AnswerBase(BaseModel):
    question_id: str
    value_json: JsonType

class AnswerCreate(AnswerBase):
    session_id: int

class AnswerRead(AnswerBase):
    id: int
    session_id: int

    model_config = ConfigDict(from_attributes=True)

# --- Test API (CRUD) ---

class TestCreateFull(BaseModel):
    title: str
    description: Optional[str] = None
    access_settings_json: Optional[JsonType] = None
    report_config: Optional[JsonType] = {"show_table": True, "show_chart": False, "show_interpretation": True}
    logic_tree_json: JsonType
    calculation_rules_json: JsonType

class TestResponseFull(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    is_active: bool
    access_settings_json: Optional[JsonType] = None
    report_config: Optional[JsonType] = None
    logic_tree_json: JsonType
    calculation_rules_json: JsonType

    model_config = ConfigDict(from_attributes=True)

# --- Import ---
class TestImportSchema(BaseModel):
    title: str
    description: Optional[str] = None
    access_settings_json: Optional[dict] = None
    report_config: Optional[dict] = None
    logic_tree_json: list
    calculation_rules_json: Optional[dict] = None
    interpretations: List[TestInterpretationCreate] = []

# --- Client API ---

class SessionStart(BaseModel):
    client_fio: str
    client_extra_data_json: Optional[JsonType] = None

class AnswerSubmit(BaseModel):
    question_id: str
    value_json: Any

class TestResultSubmit(BaseModel):
    test_id: int
    client_fio: str
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    answers_json: dict # key: question_id, value: string/list of answers

class ClientTestResponse(BaseModel):
    title: str
    description: Optional[str] = None
    access_settings_json: Optional[JsonType] = None
    logic_tree_json: JsonType

    model_config = ConfigDict(from_attributes=True)
    
class SessionStartResponse(BaseModel):
    session_id: int


class TestResultSubmitResponse(BaseModel):
    """Ответ после завершения теста — возвращает итог по шкалам."""
    status: str
    total_points: float
    detailed_results: Dict[str, float]
    result_id: str


# --- Admin Stats ---
class AdminStats(BaseModel):
    total_users: int
    pending_users: int
    total_tests: int
    total_sessions: int
    top_tests: List[dict] # [{"title": str, "sessions_count": int}]


# --- Psychometric helpers (используются в QuestionBlock на фронте) ---

class AnswerOptionSchema(BaseModel):
    id: str
    text: str
    is_correct: bool = False
    points: float = 0.0        # балл варианта (float, может быть отрицательным)
    weight: float = 1.0        # множитель
    scale_tag: Optional[str] = None  # переопределяет шкалу вопроса

class QuestionSchema(BaseModel):
    id: str
    type: str
    title: str
    description: Optional[str] = None
    scale_tag: Optional[str] = "общая"  # шкала вопроса по умолчанию
    options: Optional[list[AnswerOptionSchema]] = None
    isRequired: bool = False
    shuffleOptions: bool = False

# --- TestLink ---

class TestLinkBase(BaseModel):
    label: str
    test_id: int

class TestLinkCreate(TestLinkBase):
    pass

class TestLinkRead(TestLinkBase):
    id: str
    psychologist_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Public API ---

class PublicTestSubmit(BaseModel):
    link_id: str
    client_fio: str
    client_email: Optional[EmailStr] = None
    answers_json: Dict[str, Any]  # question_id: answer_value
