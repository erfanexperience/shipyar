
from sqlalchemy import Column, String, Boolean, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel

class Country(BaseModel):
    
    __tablename__ = "countries"

    id = None
    code = Column(String(2), primary_key=True)
    name = Column(String(100), nullable=False)
    currency = Column(String(3), nullable=True)
    phone_prefix = Column(String(10), nullable=True)
    enabled = Column(Boolean, default=True)

    cities = relationship("City", back_populates="country")
    
    def __repr__(self):
        return f"<Country(code={self.code}, name={self.name})>"

class City(BaseModel):
    
    __tablename__ = "cities"
    
    name = Column(String(100), nullable=False)
    country_code = Column(String(2), ForeignKey("countries.code"), nullable=False)
    state_province = Column(String(100), nullable=True)

    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)

    timezone = Column(String(50), nullable=True)
    population = Column(String, nullable=True)
    is_major = Column(Boolean, default=False)

    country = relationship("Country", back_populates="cities")
    
    @property
    def coordinates(self) -> tuple:
        
        if self.latitude and self.longitude:
            return (float(self.latitude), float(self.longitude))
        return None
    
    def __repr__(self):
        return f"<City(name={self.name}, country={self.country_code})>"