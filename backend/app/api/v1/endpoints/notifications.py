from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse, 
    NotificationSummary,
    UnreadCountResponse
)
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/", response_model=List[NotificationSummary])
def get_notifications(
    unread_only: bool = Query(False, description="Get only unread notifications"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, gt=0, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notifications for the current user"""
    notification_service = NotificationService(db)
    notifications = notification_service.get_user_notifications(
        user_id=current_user.id,
        unread_only=unread_only,
        skip=skip,
        limit=limit
    )
    return [NotificationSummary.model_validate(n) for n in notifications]


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications"""
    notification_service = NotificationService(db)
    count = notification_service.get_unread_count(current_user.id)
    return UnreadCountResponse(unread_count=count)


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific notification"""
    notification_service = NotificationService(db)
    notifications = notification_service.get_user_notifications(
        user_id=current_user.id,
        skip=0,
        limit=1000
    )
    
    # Find the specific notification
    notification = next((n for n in notifications if n.id == notification_id), None)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return NotificationResponse.model_validate(notification)


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read"""
    notification_service = NotificationService(db)
    notification = notification_service.mark_as_read(notification_id, current_user.id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return NotificationResponse.model_validate(notification)


@router.put("/mark-all-read", response_model=dict)
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read"""
    notification_service = NotificationService(db)
    count = notification_service.mark_all_as_read(current_user.id)
    return {"marked_as_read": count}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a notification"""
    notification_service = NotificationService(db)
    success = notification_service.delete_notification(notification_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )