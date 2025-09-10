from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.models.order import Order
from app.models.offer import Offer


class NotificationService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_notification(
        self,
        user_id: UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """Create a new notification for a user"""
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            data=data or {}
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification
    
    def create_offer_received_notification(
        self,
        order: Order,
        offer: Offer,
        traveler: User
    ) -> Notification:
        """Create notification when an offer is received on an order"""
        title = "New Offer Received!"
        message = f"{traveler.first_name} has made an offer on your order for {order.product_name}"
        
        data = {
            "order_id": str(order.id),
            "offer_id": str(offer.id),
            "traveler_id": str(traveler.id),
            "traveler_name": traveler.full_name,
            "proposed_amount": float(offer.proposed_reward_amount) if offer.proposed_reward_amount else float(order.reward_amount),
            "proposed_delivery_date": offer.proposed_delivery_date.isoformat() if offer.proposed_delivery_date else None
        }
        
        return self.create_notification(
            user_id=order.shopper_id,
            notification_type=NotificationType.OFFER_RECEIVED,
            title=title,
            message=message,
            data=data
        )
    
    def create_offer_accepted_notification(
        self,
        offer: Offer,
        order: Order
    ) -> Notification:
        """Create notification when an offer is accepted"""
        title = "Offer Accepted!"
        message = f"Your offer for {order.product_name} has been accepted"
        
        data = {
            "order_id": str(order.id),
            "offer_id": str(offer.id),
            "product_name": order.product_name
        }
        
        return self.create_notification(
            user_id=offer.traveler_id,
            notification_type=NotificationType.OFFER_ACCEPTED,
            title=title,
            message=message,
            data=data
        )
    
    def create_offer_declined_notification(
        self,
        offer: Offer,
        order: Order
    ) -> Notification:
        """Create notification when an offer is declined/rejected"""
        title = "Offer Declined"
        message = f"Your offer for {order.product_name} was declined"
        
        data = {
            "order_id": str(order.id),
            "offer_id": str(offer.id),
            "product_name": order.product_name
        }
        
        return self.create_notification(
            user_id=offer.traveler_id,
            notification_type=NotificationType.OFFER_DECLINED,
            title=title,
            message=message,
            data=data
        )
    
    def get_user_notifications(
        self,
        user_id: UUID,
        unread_only: bool = False,
        skip: int = 0,
        limit: int = 50
    ) -> List[Notification]:
        """Get notifications for a user"""
        query = self.db.query(Notification).filter(
            Notification.user_id == user_id
        )
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        return query.order_by(desc(Notification.created_at))\
                   .offset(skip)\
                   .limit(limit)\
                   .all()
    
    def get_unread_count(self, user_id: UUID) -> int:
        """Get count of unread notifications for a user"""
        return self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()
    
    def mark_as_read(self, notification_id: UUID, user_id: UUID) -> Optional[Notification]:
        """Mark a notification as read"""
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            notification.mark_as_read()
            self.db.commit()
            self.db.refresh(notification)
        
        return notification
    
    def mark_all_as_read(self, user_id: UUID) -> int:
        """Mark all notifications as read for a user"""
        count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({
            "is_read": True,
            "read_at": datetime.utcnow()
        })
        self.db.commit()
        return count
    
    def delete_notification(self, notification_id: UUID, user_id: UUID) -> bool:
        """Delete a notification"""
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            self.db.delete(notification)
            self.db.commit()
            return True
        
        return False
    
    def delete_old_notifications(self, days: int = 30) -> int:
        """Delete notifications older than specified days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        count = self.db.query(Notification).filter(
            Notification.created_at < cutoff_date
        ).delete()
        self.db.commit()
        return count