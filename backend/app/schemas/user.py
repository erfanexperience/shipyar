
from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID
from app.models.user import UserRole, UserStatus

class UserBase(BaseModel):
    model_config = ConfigDict(use_enum_values=True)
    
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    display_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = Field(default=UserRole.BOTH)
    primary_country: Optional[str] = Field(None, max_length=2)
    primary_city: Optional[str] = Field(None, max_length=100)
    timezone: Optional[str] = Field(None, max_length=50)
    bio: Optional[str] = None
    date_of_birth: Optional[date] = None
    preferred_language: str = "en"
    preferred_currency: str = "USD"

class UserCreate(UserBase):
    
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    display_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    primary_country: Optional[str] = Field(None, max_length=2)
    primary_city: Optional[str] = Field(None, max_length=100)
    timezone: Optional[str] = Field(None, max_length=50)
    bio: Optional[str] = None
    date_of_birth: Optional[date] = None
    preferred_language: Optional[str] = None
    preferred_currency: Optional[str] = None

class UserLogin(BaseModel):
    
    email: EmailStr
    password: str

class PasswordChange(BaseModel):
    
    current_password: str
    new_password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    
    id: UUID
    status: UserStatus
    email_verified: bool
    phone_verified: bool
    identity_verified: bool
    payment_verified: bool
    shopper_rating: float
    shopper_review_count: int
    traveler_rating: float
    traveler_review_count: int
    total_orders_as_shopper: int
    total_orders_as_traveler: int
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)

class UserPublicResponse(BaseModel):
    
    id: UUID
    display_name: Optional[str]
    first_name: str
    last_name: str
    avatar_url: Optional[str]
    bio: Optional[str]
    identity_verified: bool
    shopper_rating: float
    shopper_review_count: int
    traveler_rating: float
    traveler_review_count: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    
    access_token: str
    token_type: str = "bearer"
    user: UserResponse