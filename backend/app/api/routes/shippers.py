from fastapi import APIRouter
from app.models.schemas import ShipperRequest

router = APIRouter()

@router.get("/search")
async def search_travelers(departure: str = None, destination: str = None):
    return [
        {
            "id": 1,
            "departure": departure or "New York",
            "destination": destination or "London",
            "date": "2024-01-15",
            "available_weight": 15.0,
            "price_per_kg": 25.0,
            "traveler": {
                "name": "John Doe",
                "rating": 4.8,
                "trips_completed": 25
            }
        },
        {
            "id": 2,
            "departure": departure or "Los Angeles", 
            "destination": destination or "Paris",
            "date": "2024-01-20",
            "available_weight": 20.0,
            "price_per_kg": 30.0,
            "traveler": {
                "name": "Jane Smith",
                "rating": 4.9,
                "trips_completed": 42
            }
        }
    ]