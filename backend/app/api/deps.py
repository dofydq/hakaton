from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from app.api.auth import get_current_user
from app.models.models import User
from app.models.enums import UserRole

async def check_access_active(current_user: User = Depends(get_current_user)):
    """
    Проверка, что у пользователя (психолога) активна подписка.
    Админы имеют полный доступ всегда.
    """
    if current_user.role == UserRole.admin:
        return current_user
        
    if not current_user.access_until:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Subscription required. Contact admin."
        )
        
    if current_user.access_until < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Subscription expired. Please renew."
        )
        
    return current_user
