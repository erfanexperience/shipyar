from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict, validator
from uuid import UUID
from app.models.order import OrderStatus

class OrderBase(BaseModel):
    model_config = ConfigDict(use_enum_values=True)
    
    product_name: str = Field(..., min_length=1, max_length=255)
    product_url: str = Field(..., max_length=2000)
    product_description: Optional[str] = None
    product_image_url: Optional[str] = Field(None, max_length=2000)
    product_price: Optional[Decimal] = Field(None, gt=0)
    product_currency: str = Field(default="USD", max_length=3)
    quantity: int = Field(default=1, gt=0)
    
    destination_country: str = Field(..., min_length=2, max_length=2)
    destination_city_id: Optional[UUID] = None
    destination_address: Optional[str] = None
    destination_coordinates: Optional[str] = None
    
    deadline_date: date
    preferred_delivery_date: Optional[date] = None
    
    reward_amount: Decimal = Field(..., gt=0)
    reward_currency: str = Field(default="USD", max_length=3)
    
    special_instructions: Optional[str] = None
    weight_estimate: Optional[Decimal] = Field(None, gt=0)
    size_description: Optional[str] = Field(None, max_length=100)

    @validator('deadline_date')
    def validate_deadline_date(cls, v):
        if v <= date.today():
            raise ValueError('Deadline must be in the future')
        return v

    @validator('preferred_delivery_date')
    def validate_preferred_delivery_date(cls, v, values):
        if v and 'deadline_date' in values and v > values['deadline_date']:
            raise ValueError('Preferred delivery date cannot be after deadline')
        return v

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    product_name: Optional[str] = Field(None, min_length=1, max_length=255)
    product_url: Optional[str] = Field(None, max_length=2000)
    product_description: Optional[str] = None
    product_image_url: Optional[str] = Field(None, max_length=2000)
    product_price: Optional[Decimal] = Field(None, gt=0)
    product_currency: Optional[str] = Field(None, max_length=3)
    quantity: Optional[int] = Field(None, gt=0)
    
    destination_country: Optional[str] = Field(None, min_length=2, max_length=2)
    destination_city_id: Optional[UUID] = None
    destination_address: Optional[str] = None
    destination_coordinates: Optional[str] = None
    
    deadline_date: Optional[date] = None
    preferred_delivery_date: Optional[date] = None
    
    reward_amount: Optional[Decimal] = Field(None, gt=0)
    reward_currency: Optional[str] = Field(None, max_length=3)
    
    special_instructions: Optional[str] = None
    weight_estimate: Optional[Decimal] = Field(None, gt=0)
    size_description: Optional[str] = Field(None, max_length=100)

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str] = None

class OrderFilter(BaseModel):
    destination_country: Optional[str] = Field(None, min_length=2, max_length=2)
    destination_city_id: Optional[UUID] = None
    status: Optional[OrderStatus] = None
    min_reward: Optional[Decimal] = Field(None, gt=0)
    max_reward: Optional[Decimal] = Field(None, gt=0)
    deadline_before: Optional[date] = None
    deadline_after: Optional[date] = None
    max_weight: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=3)
    search_query: Optional[str] = None
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=20, gt=0, le=100)

class OrderResponse(OrderBase):
    id: UUID
    shopper_id: UUID
    status: OrderStatus
    platform_fee: Optional[Decimal]
    total_cost: Decimal
    matched_traveler_id: Optional[UUID]
    matched_at: Optional[datetime]
    purchased_at: Optional[datetime]
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class OrderSummary(BaseModel):
    id: UUID
    product_name: str
    product_image_url: Optional[str]
    product_price: Optional[Decimal]
    destination_country: str
    destination_city_id: Optional[UUID]
    destination_city: Optional[dict] = None  # Will be populated in the endpoint
    deadline_date: date
    preferred_delivery_date: Optional[date]
    reward_amount: Decimal
    reward_currency: str
    special_instructions: Optional[str]
    status: OrderStatus
    created_at: datetime
    updated_at: Optional[datetime]
    shopper_id: Optional[UUID] = None
    shopper: Optional[dict] = None  # Will be populated in the endpoint
    
    model_config = ConfigDict(from_attributes=True)

class OrderWithOffers(OrderResponse):
    offers_count: int
    has_pending_offers: bool
    
    model_config = ConfigDict(from_attributes=True)

class OrderStats(BaseModel):
    total_orders: int
    active_orders: int
    completed_orders: int
    total_reward_amount: Decimal
    avg_reward_amount: Decimal