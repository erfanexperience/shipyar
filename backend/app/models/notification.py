from datetime import datetime
import enum
from sqlalchemy import Column, ForeignKey, Text, Boolean, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class NotificationType(str, enum.Enum):
    OFFER_RECEIVED = "offer_received"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_DECLINED = "offer_declined"
    ORDER_MATCHED = "order_matched"
    ORDER_PURCHASED = "order_purchased"
    ORDER_IN_TRANSIT = "order_in_transit"
    ORDER_DELIVERED = "order_delivered"
    ORDER_COMPLETED = "order_completed"
    ORDER_CANCELLED = "order_cancelled"
    MESSAGE_RECEIVED = "message_received"
    PAYMENT_RECEIVED = "payment_received"
    REVIEW_RECEIVED = "review_received"
    SYSTEM = "system"


class Notification(BaseModel):
    __tablename__ = "notifications"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(
        Enum(NotificationType, values_callable=lambda obj: [e.value for e in obj]), 
        nullable=False
    )
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSONB, nullable=True)  # Store additional data like order_id, offer_id, etc.
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.utcnow()
    
    def __repr__(self):
        return f"<Notification(user_id={self.user_id}, type={self.type}, is_read={self.is_read})>"