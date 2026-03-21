import enum
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from app.db.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    psychologist = "psychologist"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    role: Mapped[str] = mapped_column(String, default="client")
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bio_markdown: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    access_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    tests: Mapped[list["Test"]] = relationship("Test", back_populates="psychologist")


class Test(Base):
    __tablename__ = "tests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    psychologist_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    access_settings_json: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    max_submissions: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    report_config: Mapped[Optional[Any]] = mapped_column(JSONB, default={"show_table": True, "show_chart": False, "show_interpretation": True})
    secure_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)

    psychologist: Mapped["User"] = relationship("User", back_populates="tests")
    schemas: Mapped[list["TestSchema"]] = relationship("TestSchema", back_populates="test")
    formulas: Mapped[list["Formula"]] = relationship("Formula", back_populates="test")
    sessions: Mapped[list["Session"]] = relationship("Session", back_populates="test")


class TestSchema(Base):
    __tablename__ = "test_schemas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    test_id: Mapped[int] = mapped_column(Integer, ForeignKey("tests.id"))
    logic_tree_json: Mapped[Any] = mapped_column(JSONB, nullable=False)

    test: Mapped["Test"] = relationship("Test", back_populates="schemas")


class Formula(Base):
    __tablename__ = "formulas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    test_id: Mapped[int] = mapped_column(Integer, ForeignKey("tests.id"))
    calculation_rules_json: Mapped[Any] = mapped_column(JSONB, nullable=False)

    test: Mapped["Test"] = relationship("Test", back_populates="formulas")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    test_id: Mapped[int] = mapped_column(Integer, ForeignKey("tests.id"))
    client_fio: Mapped[str] = mapped_column(String, nullable=False)
    client_extra_data_json: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    current_progress_percent: Mapped[int] = mapped_column(Integer, default=0)
    total_score: Mapped[int] = mapped_column(Integer, default=0)

    test: Mapped["Test"] = relationship("Test", back_populates="sessions")
    answers: Mapped[list["Answer"]] = relationship("Answer", back_populates="session")


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("sessions.id"))
    question_id: Mapped[str] = mapped_column(String, nullable=False)
    value_json: Mapped[Any] = mapped_column(JSONB, nullable=False)

    session: Mapped["Session"] = relationship("Session", back_populates="answers")

class TestResult(Base):
    __tablename__ = "test_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    test_id: Mapped[int] = mapped_column(Integer, ForeignKey("tests.id"))
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    guest_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    client_fio: Mapped[str] = mapped_column(String, nullable=False)
    answers: Mapped[Any] = mapped_column(JSONB, nullable=False)
    total_points: Mapped[int] = mapped_column(Integer, default=0)
    test_snapshot: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    secure_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    test: Mapped["Test"] = relationship("Test")
