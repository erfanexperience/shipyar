from typing import Optional, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict, validator
from uuid import UUID
from app.models.offer import OfferStatus

class OfferBase(BaseModel):
    model_config = ConfigDict(use_enum_values=True)
    
    message: Optional[str] = Field(None, max_length=1000)
    proposed_delivery_date: Optional[date] = None
    proposed_reward_amount: Optional[float] = Field(None, ge=0, description="Proposed reward amount")
    travel_route: Optional[Dict[str, Any]] = None  # Keep for backward compatibility

    @validator('proposed_delivery_date')
    def validate_proposed_delivery_date(cls, v):
        if v and v <= date.today():
            raise ValueError('Proposed delivery date must be in the future')
        return v

class OfferCreate(OfferBase):
    pass

class OfferUpdate(BaseModel):
    message: Optional[str] = Field(None, max_length=1000)
    proposed_delivery_date: Optional[date] = None
    proposed_reward_amount: Optional[float] = Field(None, ge=0, description="Proposed reward amount")
    travel_route: Optional[Dict[str, Any]] = None

class OfferResponse(OfferBase):
    id: UUID
    order_id: UUID
    traveler_id: UUID
    status: OfferStatus
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class OfferWithDetails(OfferResponse):
    order_product_name: str
    order_destination_country: str
    order_reward_amount: float
    order_reward_currency: str
    order_deadline_date: date
    traveler_name: str
    traveler_rating: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)

class OfferSummary(BaseModel):
    id: UUID
    order_id: UUID
    traveler_id: UUID
    status: OfferStatus
    proposed_delivery_date: Optional[date]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class OfferStats(BaseModel):
    total_offers: int
    active_offers: int
    accepted_offers: int
    withdrawn_offers: int