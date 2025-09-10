from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from uuid import UUID

class CountryBase(BaseModel):
    code: str
    name: str

class CountryCreate(CountryBase):
    pass

class CountryResponse(CountryBase):
    model_config = ConfigDict(from_attributes=True)

class CityBase(BaseModel):
    name: str
    country_code: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timezone: Optional[str] = None

class CityCreate(CityBase):
    pass

class CityResponse(CityBase):
    id: UUID
    
    model_config = ConfigDict(from_attributes=True)

class CityWithCountry(CityResponse):
    country: CountryResponse
    
    model_config = ConfigDict(from_attributes=True)