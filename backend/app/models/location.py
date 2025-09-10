
from sqlalchemy import Column, String, Boolean, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.core.database import Base

class Country(Base):
    
    __tablename__ = "countries"

    code = Column(String(2), primary_key=True)
    name = Column(String(100), nullable=False)
    currency = Column(String(3), nullable=True)
    phone_prefix = Column(String(10), nullable=True)
    enabled = Column(Boolean, default=True)

    cities = relationship("City", back_populates="country")
    
    def __repr__(self):
        return f"<Country(code={self.code}, name={self.name})>"

class City(Base):
    
    __tablename__ = "cities"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(100), nullable=False)
    country_code = Column(String(2), ForeignKey("countries.code"), nullable=False)

    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)

    timezone = Column(String(50), nullable=True)
    enabled = Column(Boolean, default=True)

    country = relationship("Country", back_populates="cities")
    
    @property
    def coordinates(self) -> tuple:
        
        if self.latitude and self.longitude:
            return (float(self.latitude), float(self.longitude))
        return None
    
    def __repr__(self):
        return f"<City(name={self.name}, country={self.country_code})>"