import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    psychologist = "psychologist"
    pending = "pending"

class SessionStatus(str, enum.Enum):
    started = "started"
    completed = "completed"
