
from datetime import date, datetime
import enum
from sqlalchemy import (
    Column, String, Integer, ForeignKey, Text, Date, 
    Numeric, DateTime, Enum, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class OrderStatus(str, enum.Enum):
    
    DRAFT = "draft"
    ACTIVE = "active"
    MATCHED = "matched"
    PURCHASED = "purchased"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"

class Order(BaseModel):
    
    __tablename__ = "orders"

    shopper_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    product_name = Column(String(255), nullable=False)
    product_url = Column(Text, nullable=False)
    product_description = Column(Text, nullable=True)
    product_image_url = Column(Text, nullable=True)
    product_price = Column(Numeric(10, 2), nullable=True)
    product_currency = Column(String(3), default='USD')
    quantity = Column(Integer, default=1)

    destination_country = Column(String(2), ForeignKey("countries.code"), nullable=False)
    destination_city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id"), nullable=True)
    destination_address = Column(Text, nullable=True)

    destination_latitude = Column(Numeric(10, 7), nullable=True)
    destination_longitude = Column(Numeric(10, 7), nullable=True)

    deadline_date = Column(Date, nullable=False)
    preferred_delivery_date = Column(Date, nullable=True)

    reward_amount = Column(Numeric(10, 2), nullable=False)
    reward_currency = Column(String(3), default='USD')
    platform_fee = Column(Numeric(10, 2), nullable=True)
    total_cost = Column(Numeric(10, 2), nullable=False)

    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.DRAFT)
    special_instructions = Column(Text, nullable=True)
    weight_estimate = Column(Numeric(5, 2), nullable=True)
    size_description = Column(String(100), nullable=True)

    matched_traveler_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    matched_at = Column(DateTime(timezone=True), nullable=True)

    purchased_at = Column(DateTime(timezone=True), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    shopper = relationship("User", foreign_keys=[shopper_id], back_populates="orders_as_shopper")
    matched_traveler = relationship("User", foreign_keys=[matched_traveler_id])
    destination_city = relationship("City")
    offers = relationship("Offer", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(
            "reward_amount > 0 AND total_cost > 0 AND (platform_fee IS NULL OR platform_fee >= 0)",
            name="orders_positive_amounts"
        ),
        CheckConstraint(
            "deadline_date >= CURRENT_DATE",
            name="orders_future_deadline"
        ),
    )
    
    @property
    def is_active(self) -> bool:
        
        return self.status == OrderStatus.ACTIVE
    
    @property
    def is_matched(self) -> bool:
        
        return self.matched_traveler_id is not None
    
    @property
    def can_accept_offers(self) -> bool:
        
        return self.status == OrderStatus.ACTIVE and not self.is_matched
    
    @property
    def destination_coordinates(self) -> tuple:
        
        if self.destination_latitude and self.destination_longitude:
            return (float(self.destination_latitude), float(self.destination_longitude))
        return None
    
    def update_status(self, new_status: OrderStatus, user_id: UUID = None, notes: str = None):
        
        old_status = self.status
        self.status = new_status

        if new_status == OrderStatus.MATCHED:
            self.matched_at = datetime.utcnow()
        elif new_status == OrderStatus.PURCHASED:
            self.purchased_at = datetime.utcnow()
        elif new_status == OrderStatus.IN_TRANSIT:
            self.shipped_at = datetime.utcnow()
        elif new_status == OrderStatus.DELIVERED:
            self.delivered_at = datetime.utcnow()
        elif new_status == OrderStatus.COMPLETED:
            self.completed_at = datetime.utcnow()

        history = OrderStatusHistory(
            order_id=self.id,
            old_status=old_status,
            new_status=new_status,
            changed_by=user_id,
            notes=notes
        )
        self.status_history.append(history)
        
        return history

class OrderStatusHistory(BaseModel):
    
    __tablename__ = "order_status_history"
    
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    old_status = Column(Enum(OrderStatus), nullable=True)
    new_status = Column(Enum(OrderStatus), nullable=False)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)

    order = relationship("Order", back_populates="status_history")
    user = relationship("User")
    
    def __repr__(self):
        return f"<OrderStatusHistory(order_id={self.order_id}, {self.old_status} -> {self.new_status})>"