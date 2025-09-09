from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime

class TripCreate(BaseModel):
    departure: str
    destination: str
    date: str
    available_weight: float
    price_per_kg: float

class Trip(BaseModel):
    id: int
    departure: str
    destination: str
    date: str
    available_weight: float
    price_per_kg: float
    traveler_id: int
    created_at: datetime

class ShipperRequest(BaseModel):
    departure: str
    destination: str
    date: Optional[str] = None
    weight: Optional[float] = None