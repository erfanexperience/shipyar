from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.location import Country, City
from app.repositories.location_repository import LocationRepository

class LocationService:
    
    def __init__(self, db: Session):
        self.db = db
        self.location_repo = LocationRepository(db)
    
    def get_countries(self) -> List[Country]:
        return self.location_repo.get_all_countries()
    
    def get_country(self, country_code: str) -> Optional[Country]:
        return self.location_repo.get_country(country_code)
    
    def get_cities_by_country(self, country_code: str, limit: int = 100) -> List[City]:
        return self.location_repo.get_cities_by_country(country_code, limit)
    
    def search_cities(self, query: str, country_code: Optional[str] = None, limit: int = 20) -> List[City]:
        return self.location_repo.search_cities(query, country_code, limit)
    
    def get_city(self, city_id: str) -> Optional[City]:
        return self.location_repo.get_city(city_id)
    
    def get_nearby_cities(self, latitude: float, longitude: float, radius_km: float = 100, limit: int = 20) -> List[City]:
        return self.location_repo.get_nearby_cities(latitude, longitude, radius_km, limit)