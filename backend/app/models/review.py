
from sqlalchemy import (
    Column, ForeignKey, Text, Integer, Boolean, DateTime, CheckConstraint, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Review(BaseModel):
    
    __tablename__ = "reviews"

    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reviewed_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)

    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)

    reviewer_role = Column(Text, nullable=False)  # 'shopper' or 'traveler'

    response = Column(Text, nullable=True)
    response_at = Column(DateTime(timezone=True), nullable=True)

    is_public = Column(Boolean, default=True)

    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewed = relationship("User", foreign_keys=[reviewed_id])
    order = relationship("Order")

    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='reviews_rating_range'),
        CheckConstraint("reviewer_role IN ('shopper', 'traveler')", name='reviews_role_check'),
        UniqueConstraint('reviewer_id', 'order_id', name='unique_review_per_order'),
        CheckConstraint('reviewer_id != reviewed_id', name='reviews_no_self_review'),
    )
    
    @property
    def is_positive(self) -> bool:
        
        return self.rating >= 4
    
    @property
    def is_negative(self) -> bool:
        
        return self.rating <= 2
    
    @property
    def has_response(self) -> bool:
        
        return self.response is not None
    
    def add_response(self, response_text: str):
        
        from datetime import datetime
        self.response = response_text
        self.response_at = datetime.utcnow()
    
    def __repr__(self):
        return f"<Review(reviewer={self.reviewer_id}, reviewed={self.reviewed_id}, rating={self.rating})>"