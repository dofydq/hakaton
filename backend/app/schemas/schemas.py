from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict, EmailStr

# Импортируем Enum из моделей, чтобы не дублировать
from app.models.models import UserRole

# Определяем удобный тип для JSON (dict или list)
JsonType = Union[Dict[str, Any], List[Dict[str, Any]]]

# --- User ---

class UserBase(BaseModel):
    role: UserRole = UserRole.psychologist
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio_markdown: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    access_until: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UserUpdateProfile(BaseModel):
    bio_markdown: Optional[str] = None
    avatar_url: Optional[str] = None


# --- Test ---

class TestBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_active: bool = True
    access_settings_json: Optional[JsonType] = None

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
    logic_tree_json: JsonType
    calculation_rules_json: JsonType

class TestResponseFull(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    is_active: bool
    access_settings_json: Optional[JsonType] = None
    logic_tree_json: JsonType
    calculation_rules_json: JsonType

    model_config = ConfigDict(from_attributes=True)

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
