from fastapi import APIRouter, HTTPException
from app.models.schemas import UserCreate, UserLogin, User

router = APIRouter()

@router.post("/register", response_model=User)
async def register(user: UserCreate):
    return {
        "id": 1,
        "email": user.email,
        "name": user.name,
        "created_at": "2024-01-01T00:00:00"
    }

@router.post("/login")
async def login(user: UserLogin):
    if user.email == "test@example.com" and user.password == "password":
        return {
            "access_token": "fake-jwt-token",
            "token_type": "bearer",
            "user": {
                "id": 1,
                "email": user.email,
                "name": "Test User"
            }
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")