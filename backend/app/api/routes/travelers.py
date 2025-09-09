from fastapi import APIRouter
from app.models.schemas import TripCreate, Trip

router = APIRouter()

@router.get("/trips")
async def get_trips():
    return [
        {
            "id": 1,
            "departure": "New York",
            "destination": "London", 
            "date": "2024-01-15",
            "available_weight": 15.0,
            "price_per_kg": 25.0,
            "traveler_id": 1,
            "created_at": "2024-01-01T00:00:00"
        }
    ]

@router.post("/trips", response_model=Trip)
async def create_trip(trip: TripCreate):
    return {
        "id": 1,
        "departure": trip.departure,
        "destination": trip.destination,
        "date": trip.date,
        "available_weight": trip.available_weight,
        "price_per_kg": trip.price_per_kg,
        "traveler_id": 1,
        "created_at": "2024-01-01T00:00:00"
    }

@router.get("/search")
async def search_shippers():
    return [
        {
            "id": 1,
            "item": "Electronics",
            "weight": 5.0,
            "departure": "New York",
            "destination": "London",
            "requested_date": "2024-01-15",
            "shipper": {
                "name": "Alice Johnson",
                "rating": 4.7
            }
        }
    ]