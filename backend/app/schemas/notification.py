from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

from app.models.notification import NotificationType


class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None


class NotificationResponse(NotificationBase):
    id: UUID
    user_id: UUID
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class NotificationSummary(BaseModel):
    id: UUID
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UnreadCountResponse(BaseModel):
    unread_count: int