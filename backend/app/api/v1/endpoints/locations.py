from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.location import CountryResponse, CityResponse, CityWithCountry
from app.services.location_service import LocationService

router = APIRouter()

@router.get("/countries", response_model=List[CountryResponse])
def get_countries(db: Session = Depends(get_db)):
    location_service = LocationService(db)
    countries = location_service.get_countries()
    return [CountryResponse.model_validate(country) for country in countries]

@router.get("/countries/{country_code}", response_model=CountryResponse)
def get_country(
    country_code: str,
    db: Session = Depends(get_db)
):
    location_service = LocationService(db)
    country = location_service.get_country(country_code.upper())
    
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Country not found"
        )
    
    return CountryResponse.model_validate(country)

@router.get("/countries/{country_code}/cities", response_model=List[CityResponse])
def get_cities_by_country(
    country_code: str,
    limit: int = Query(100, gt=0, le=500),
    db: Session = Depends(get_db)
):
    location_service = LocationService(db)
    cities = location_service.get_cities_by_country(country_code.upper(), limit)
    return [CityResponse.model_validate(city) for city in cities]

@router.get("/cities/search", response_model=List[CityWithCountry])
def search_cities(
    q: str = Query(..., min_length=2, max_length=100),
    country_code: Optional[str] = Query(None, max_length=2),
    limit: int = Query(20, gt=0, le=100),
    db: Session = Depends(get_db)
):
    location_service = LocationService(db)
    country_filter = country_code.upper() if country_code else None
    cities = location_service.search_cities(q, country_filter, limit)
    return [CityWithCountry.model_validate(city) for city in cities]

@router.get("/cities/nearby", response_model=List[CityWithCountry])
def get_nearby_cities(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(100, gt=0, le=1000),
    limit: int = Query(20, gt=0, le=100),
    db: Session = Depends(get_db)
):
    location_service = LocationService(db)
    cities = location_service.get_nearby_cities(latitude, longitude, radius_km, limit)
    return [CityWithCountry.model_validate(city) for city in cities]

@router.get("/cities/{city_id}", response_model=CityWithCountry)
def get_city(
    city_id: str,
    db: Session = Depends(get_db)
):
    location_service = LocationService(db)
    city = location_service.get_city(city_id)
    
    if not city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="City not found"
        )
    
    return CityWithCountry.model_validate(city)