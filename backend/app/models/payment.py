
from datetime import datetime
import enum
from sqlalchemy import (
    Column, String, Integer, ForeignKey, Boolean, 
    Numeric, DateTime, Enum, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class PaymentStatus(str, enum.Enum):
    
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    REFUNDED = "refunded"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TransactionType(str, enum.Enum):
    
    ORDER_PAYMENT = "order_payment"
    PLATFORM_FEE = "platform_fee"
    TRAVELER_PAYOUT = "traveler_payout"
    REFUND = "refund"
    DISPUTE_RESOLUTION = "dispute_resolution"

class PaymentMethod(BaseModel):
    
    __tablename__ = "payment_methods"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    provider = Column(String(50), nullable=False)
    provider_payment_method_id = Column(String(255), nullable=False)

    card_last_four = Column(String(4), nullable=True)
    card_brand = Column(String(20), nullable=True)
    expires_month = Column(Integer, nullable=True)
    expires_year = Column(Integer, nullable=True)

    is_default = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)

    user = relationship("User")
    transactions = relationship("Transaction", back_populates="payment_method")
    
    @property
    def display_name(self) -> str:
        
        if self.card_brand and self.card_last_four:
            return f"{self.card_brand} ****{self.card_last_four}"
        return f"{self.provider} payment method"
    
    @property
    def is_expired(self) -> bool:
        
        if self.expires_month and self.expires_year:
            now = datetime.utcnow()
            return (self.expires_year < now.year or 
                   (self.expires_year == now.year and self.expires_month < now.month))
        return False

class Transaction(BaseModel):
    
    __tablename__ = "transactions"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    payment_method_id = Column(UUID(as_uuid=True), ForeignKey("payment_methods.id"), nullable=True)

    transaction_type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='USD')

    provider = Column(String(50), nullable=False)
    provider_transaction_id = Column(String(255), nullable=False)
    provider_response = Column(Text, nullable=True)

    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)

    processed_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    failure_reason = Column(Text, nullable=True)

    order = relationship("Order")
    user = relationship("User")
    payment_method = relationship("PaymentMethod", back_populates="transactions")
    escrow_holding = relationship(
        "EscrowHolding", 
        foreign_keys="EscrowHolding.transaction_id",
        back_populates="transaction", 
        uselist=False
    )
    
    @property
    def is_successful(self) -> bool:
        
        return self.status in [PaymentStatus.CAPTURED, PaymentStatus.AUTHORIZED]
    
    @property
    def is_failed(self) -> bool:
        
        return self.status == PaymentStatus.FAILED
    
    def mark_as_captured(self):
        
        self.status = PaymentStatus.CAPTURED
        self.processed_at = datetime.utcnow()
    
    def mark_as_failed(self, reason: str):
        
        self.status = PaymentStatus.FAILED
        self.failed_at = datetime.utcnow()
        self.failure_reason = reason

class EscrowHolding(BaseModel):
    
    __tablename__ = "escrow_holdings"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, unique=True)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=False)

    total_amount = Column(Numeric(10, 2), nullable=False)
    platform_fee = Column(Numeric(10, 2), nullable=False)
    traveler_payout = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='USD')

    is_released = Column(Boolean, default=False)
    released_at = Column(DateTime(timezone=True), nullable=True)
    release_transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=True)

    is_disputed = Column(Boolean, default=False)
    disputed_at = Column(DateTime(timezone=True), nullable=True)
    dispute_resolution = Column(Text, nullable=True)

    order = relationship("Order")
    transaction = relationship("Transaction", foreign_keys=[transaction_id], back_populates="escrow_holding")
    release_transaction = relationship("Transaction", foreign_keys=[release_transaction_id])
    
    @property
    def can_be_released(self) -> bool:
        
        return not self.is_released and not self.is_disputed and self.order.status == 'delivered'
    
    def release_funds(self):
        
        if self.can_be_released:
            self.is_released = True
            self.released_at = datetime.utcnow()
    
    def initiate_dispute(self):
        
        if not self.is_released:
            self.is_disputed = True
            self.disputed_at = datetime.utcnow()
    
    def resolve_dispute(self, resolution: str):
        
        self.dispute_resolution = resolution
        self.is_disputed = False