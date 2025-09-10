
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, orders, offers, locations, amazon, notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(offers.router, prefix="/offers", tags=["Offers"])
api_router.include_router(locations.router, prefix="/locations", tags=["Locations"])
api_router.include_router(amazon.router, prefix="/amazon", tags=["Amazon"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])