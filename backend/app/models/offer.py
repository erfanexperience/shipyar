
from datetime import date, datetime, timezone
import enum
from sqlalchemy import (
    Column, ForeignKey, Text, Date, DateTime, 
    Enum, CheckConstraint, UniqueConstraint, Numeric
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class OfferStatus(str, enum.Enum):
    
    ACTIVE = "active"
    WITHDRAWN = "withdrawn"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"

class Offer(BaseModel):
    
    __tablename__ = "offers"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    traveler_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    message = Column(Text, nullable=True)
    proposed_delivery_date = Column(Date, nullable=True)
    proposed_reward_amount = Column(Numeric(10, 2), nullable=True)  # Can propose different amount
    travel_route = Column(JSONB, nullable=True)  # Keep for backward compatibility but optional

    status = Column(Enum(OfferStatus, values_callable=lambda obj: [e.value for e in obj]), nullable=False, default=OfferStatus.ACTIVE.value)

    expires_at = Column(DateTime(timezone=True), nullable=True)

    order = relationship("Order", back_populates="offers")
    traveler = relationship("User", back_populates="offers_as_traveler")

    __table_args__ = (
        UniqueConstraint('order_id', 'traveler_id', name='unique_offer_per_traveler'),
        CheckConstraint(
            "proposed_delivery_date >= CURRENT_DATE",
            name="offers_future_delivery"
        ),
    )
    
    @property
    def is_active(self) -> bool:
        
        if self.status != OfferStatus.ACTIVE:
            return False
        if self.expires_at and datetime.now(timezone.utc) > self.expires_at:
            return False
        return True
    
    @property
    def is_expired(self) -> bool:
        
        if self.expires_at and datetime.now(timezone.utc) > self.expires_at:
            return True
        return self.status == OfferStatus.EXPIRED
    
    @property
    def can_be_accepted(self) -> bool:
        
        return self.is_active and self.order.can_accept_offers
    
    def withdraw(self):
        
        if self.status == OfferStatus.ACTIVE:
            self.status = OfferStatus.WITHDRAWN
    
    def reject(self):
        
        if self.status == OfferStatus.ACTIVE:
            self.status = OfferStatus.REJECTED
    
    def accept(self):
        
        if self.can_be_accepted:
            self.status = OfferStatus.ACCEPTED

            self.order.matched_traveler_id = self.traveler_id
            self.order.update_status('matched', user_id=self.traveler_id)

            for other_offer in self.order.offers:
                if other_offer.id != self.id and other_offer.status == OfferStatus.ACTIVE:
                    other_offer.withdraw()
    
    def expire(self):
        
        if self.status == OfferStatus.ACTIVE:
            self.status = OfferStatus.EXPIRED
    
    def __repr__(self):
        return f"<Offer(order_id={self.order_id}, traveler_id={self.traveler_id}, status={self.status})>"