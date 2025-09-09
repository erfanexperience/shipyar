
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import UserResponse, UserPublicResponse, UserUpdate
from app.repositories.user_repository import UserRepository
from app.api.deps import get_current_user, get_current_active_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[UserPublicResponse])
def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    
    user_repo = UserRepository(db)
    users = user_repo.get_active_users(skip=skip, limit=limit)
    return [UserPublicResponse.model_validate(user) for user in users]

@router.get("/shoppers", response_model=List[UserPublicResponse])
def get_shoppers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    
    user_repo = UserRepository(db)
    users = user_repo.get_shoppers(skip=skip, limit=limit)
    return [UserPublicResponse.model_validate(user) for user in users]

@router.get("/travelers", response_model=List[UserPublicResponse])
def get_travelers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    verified_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    
    user_repo = UserRepository(db)
    users = user_repo.get_travelers(
        skip=skip, 
        limit=limit, 
        verified_only=verified_only
    )
    return [UserPublicResponse.model_validate(user) for user in users]

@router.get("/search", response_model=List[UserPublicResponse])
def search_users(
    q: str = Query(..., min_length=2),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    
    user_repo = UserRepository(db)
    users = user_repo.search_users(query=q, skip=skip, limit=limit)
    return [UserPublicResponse.model_validate(user) for user in users]

@router.get("/{user_id}", response_model=UserPublicResponse)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    
    user_repo = UserRepository(db)
    user = user_repo.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserPublicResponse.model_validate(user)

@router.patch("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    
    user_repo = UserRepository(db)

    update_data = user_update.model_dump(exclude_unset=True)

    updated_user = user_repo.update(current_user.id, **update_data)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(updated_user)

@router.delete("/me")
def delete_current_user(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    
    user_repo = UserRepository(db)

    success = user_repo.delete(current_user.id, hard_delete=False)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User account deleted successfully"}