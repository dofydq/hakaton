import enum
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from app.db.database import Base
from app.models.enums import UserRole, SessionStatus


# Models are defined below


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    role: Mapped[UserRole] = mapped_column(String, default=UserRole.pending)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    specialization: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bio_markdown: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Keeping for backward compat
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
    questions: Mapped[list["Question"]] = relationship("Question", back_populates="test")
    interpretations: Mapped[list["TestInterpretation"]] = relationship("TestInterpretation", back_populates="test")


class TestInterpretation(Base):
    __tablename__ = "test_interpretations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    test_id: Mapped[int] = mapped_column(Integer, ForeignKey("tests.id"))
    scale_tag: Mapped[str] = mapped_column(String, nullable=False)
    min_val: Mapped[float] = mapped_column(Float, nullable=False)
    max_val: Mapped[float] = mapped_column(Float, nullable=False)
    is_percent: Mapped[bool] = mapped_column(Boolean, default=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)

    test: Mapped["Test"] = relationship("Test", back_populates="interpretations")


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
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    current_progress_percent: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String, default="started")  # started | completed
    total_score: Mapped[float] = mapped_column(Float, default=0.0)
    total_raw_score: Mapped[float] = mapped_column(Float, default=0.0)
    max_possible_score: Mapped[float] = mapped_column(Float, default=0.0)
    interpretation_result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    detailed_results: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)  # {scale_tag: score}

    test: Mapped["Test"] = relationship("Test", back_populates="sessions")
    answers: Mapped[list["Answer"]] = relationship("Answer", back_populates="session")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    test_id: Mapped[int] = mapped_column(Integer, ForeignKey("tests.id"))
    type: Mapped[str] = mapped_column(String)  # single_choice, multiple_choice, etc.
    title: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scale_tag: Mapped[str] = mapped_column(String, index=True, default="общая")
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)

    test: Mapped["Test"] = relationship("Test", back_populates="questions")
    options: Mapped[list["AnswerOption"]] = relationship("AnswerOption", back_populates="question")


class AnswerOption(Base):
    __tablename__ = "answer_options"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    question_id: Mapped[str] = mapped_column(String, ForeignKey("questions.id"))
    text: Mapped[str] = mapped_column(String)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    points: Mapped[float] = mapped_column(Float, default=0.0)
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    scale_tag: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    question: Mapped["Question"] = relationship("Question", back_populates="options")


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("sessions.id"))
    question_id: Mapped[str] = mapped_column(String, nullable=False)
    value_json: Mapped[Any] = mapped_column(JSONB, nullable=False)

    session: Mapped["Session"] = relationship("Session", back_populates="answers")

class TestLink(Base):
    __tablename__ = "test_links"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    test_id: Mapped[int] = mapped_column(Integer, ForeignKey("tests.id"))
    psychologist_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    label: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    test: Mapped["Test"] = relationship("Test")
    psychologist: Mapped["User"] = relationship("User")


class TestResult(Base):
    __tablename__ = "test_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    test_id: Mapped[int] = mapped_column(Integer, ForeignKey("tests.id"))
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    link_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("test_links.id"), nullable=True)
    guest_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    client_fio: Mapped[str] = mapped_column(String, nullable=False)
    client_email: Mapped[str] = mapped_column(String, nullable=False)
    answers: Mapped[Any] = mapped_column(JSONB, nullable=False)
    total_points: Mapped[float] = mapped_column(Float, default=0.0)
    detailed_results: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)  # {"scale_tag": score, ...}
    interpretation_result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    max_possible_score: Mapped[float] = mapped_column(Float, default=0.0)
    test_snapshot: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    additional_info: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    secure_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    test: Mapped["Test"] = relationship("Test")
    user: Mapped[Optional["User"]] = relationship("User")

