
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import AuthService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()
auth_service = AuthService()

@router.post("/register", response_model=TokenResponse)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    
    try:

        role_value = user_data.role if isinstance(user_data.role, str) else user_data.role.value

        user = auth_service.register_user(
            db=db,
            email=user_data.email,
            password=user_data.password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            display_name=user_data.display_name,
            phone=user_data.phone,
            role=role_value,
            primary_country=user_data.primary_country,
            primary_city=user_data.primary_city,
            timezone=user_data.timezone,
            bio=user_data.bio,
            date_of_birth=user_data.date_of_birth,
            preferred_language=user_data.preferred_language,
            preferred_currency=user_data.preferred_currency
        )

        access_token = auth_service.create_access_token(
            data={"sub": str(user.id)}
        )
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse.model_validate(user)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=TokenResponse)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    
    user = auth_service.authenticate_user(
        db=db,
        email=credentials.email,
        password=credentials.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth_service.create_access_token(
        data={"sub": str(user.id)}
    )
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    
    return UserResponse.model_validate(current_user)

@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user)
):
    
    return {"message": "Successfully logged out"}