from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.location import Country, City
from app.repositories.base import BaseRepository

class LocationRepository:
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all_countries(self) -> List[Country]:
        return self.db.query(Country).order_by(Country.name).all()
    
    def get_country(self, country_code: str) -> Optional[Country]:
        return self.db.query(Country).filter(Country.code == country_code).first()
    
    def get_cities_by_country(self, country_code: str, limit: int = 100) -> List[City]:
        return (self.db.query(City)
               .filter(City.country_code == country_code)
               .order_by(City.name)
               .limit(limit)
               .all())
    
    def search_cities(self, query: str, country_code: Optional[str] = None, limit: int = 20) -> List[City]:
        query_filter = City.name.ilike(f"%{query}%")
        
        base_query = self.db.query(City).filter(query_filter)
        
        if country_code:
            base_query = base_query.filter(City.country_code == country_code)
        
        return base_query.order_by(City.name).limit(limit).all()
    
    def get_city(self, city_id: str) -> Optional[City]:
        try:
            city_uuid = UUID(city_id)
            return self.db.query(City).filter(City.id == city_uuid).first()
        except ValueError:
            return None
    
    def get_nearby_cities(self, latitude: float, longitude: float, radius_km: float = 100, limit: int = 20) -> List[City]:
        return (self.db.query(City)
               .filter(
                   and_(
                       City.latitude.isnot(None),
                       City.longitude.isnot(None)
                   )
               )
               .filter(
                   func.ST_DWithin(
                       func.ST_MakePoint(City.longitude, City.latitude),
                       func.ST_MakePoint(longitude, latitude),
                       radius_km * 1000
                   )
               )
               .order_by(
                   func.ST_Distance(
                       func.ST_MakePoint(City.longitude, City.latitude),
                       func.ST_MakePoint(longitude, latitude)
                   )
               )
               .limit(limit)
               .all())