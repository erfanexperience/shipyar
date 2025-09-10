from datetime import datetime
from typing import Optional
import enum
from sqlalchemy import (
    Column, String, Boolean, DateTime, Integer, 
    Numeric, Date, ForeignKey, Text, Enum, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class UserRole(str, enum.Enum):
    SHOPPER = "shopper"
    TRAVELER = "traveler"
    BOTH = "both"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"
    PENDING_VERIFICATION = "pending_verification"


class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    
    role = Column(Enum(UserRole, values_callable=lambda obj: [e.value for e in obj]), nullable=False, default=UserRole.BOTH.value)
    status = Column(Enum(UserStatus, values_callable=lambda obj: [e.value for e in obj]), nullable=False, default=UserStatus.PENDING_VERIFICATION.value)
    
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    display_name = Column(String(100), nullable=True)
    avatar_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    
    primary_country = Column(String(2), nullable=True)
    primary_city = Column(String(100), nullable=True)
    timezone = Column(String(50), nullable=True)
    
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    identity_verified = Column(Boolean, default=False)
    payment_verified = Column(Boolean, default=False)
    
    preferred_language = Column(String(5), default='en')
    preferred_currency = Column(String(3), default='USD')
    
    shopper_rating = Column(Numeric(3, 2), default=0.00)
    shopper_review_count = Column(Integer, default=0)
    traveler_rating = Column(Numeric(3, 2), default=0.00)
    traveler_review_count = Column(Integer, default=0)
    total_orders_as_shopper = Column(Integer, default=0)
    total_orders_as_traveler = Column(Integer, default=0)
    
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    verifications = relationship("UserVerification", back_populates="user", cascade="all, delete-orphan")
    
    orders_as_shopper = relationship("Order", foreign_keys="Order.shopper_id", back_populates="shopper")
    offers_as_traveler = relationship("Offer", back_populates="traveler")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint(
            "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'",
            name="users_email_check"
        ),
        CheckConstraint(
            "shopper_rating >= 0 AND shopper_rating <= 5 AND traveler_rating >= 0 AND traveler_rating <= 5",
            name="users_rating_check"
        ),
    )
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_shopper(self) -> bool:
        return self.role in [UserRole.SHOPPER, UserRole.BOTH]
    
    @property
    def is_traveler(self) -> bool:
        return self.role in [UserRole.TRAVELER, UserRole.BOTH]
    
    @property
    def is_active(self) -> bool:
        return self.status == UserStatus.ACTIVE
    
    @property
    def is_fully_verified(self) -> bool:
        return all([
            self.email_verified,
            self.identity_verified,
            self.payment_verified
        ])


class UserSession(BaseModel):
    __tablename__ = "user_sessions"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), nullable=False, index=True)
    device_info = Column(JSONB, nullable=True)
    ip_address = Column(INET, nullable=True)
    user_agent = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_used_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    user = relationship("User", back_populates="sessions")
    
    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    def update_last_used(self):
        self.last_used_at = datetime.utcnow()


class PasswordResetToken(BaseModel):
    __tablename__ = "password_reset_tokens"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), nullable=False, unique=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    
    user = relationship("User", back_populates="password_reset_tokens")
    
    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_used(self) -> bool:
        return self.used_at is not None
    
    @property
    def is_valid(self) -> bool:
        return not self.is_expired and not self.is_used
    
    def mark_as_used(self):
        self.used_at = datetime.utcnow()


class VerificationType(str, enum.Enum):
    EMAIL = "email"
    PHONE = "phone"
    IDENTITY = "identity"
    PAYMENT_METHOD = "payment_method"


class UserVerification(BaseModel):
    __tablename__ = "user_verifications"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    verification_type = Column(Enum(VerificationType, values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    verification_data = Column(JSONB, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    user = relationship("User", back_populates="verifications")
    
    @property
    def is_verified(self) -> bool:
        return self.verified_at is not None
    
    @property
    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at
    
    def mark_as_verified(self):
        self.verified_at = datetime.utcnow()