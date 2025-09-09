from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User, UserRole, UserStatus
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    
    def __init__(self, db: Session):
        super().__init__(User, db)
    
    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(
            User.email == email,
            User.deleted_at.is_(None)
        ).first()
    
    def get_by_phone(self, phone: str) -> Optional[User]:
        return self.db.query(User).filter(
            User.phone == phone,
            User.deleted_at.is_(None)
        ).first()
    
    def get_active_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.filter(
            skip=skip,
            limit=limit,
            status=UserStatus.ACTIVE
        )
    
    def get_shoppers(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.db.query(User).filter(
            User.role.in_([UserRole.SHOPPER, UserRole.BOTH]),
            User.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()
    
    def get_travelers(
        self, 
        skip: int = 0, 
        limit: int = 100,
        verified_only: bool = False
    ) -> List[User]:
        query = self.db.query(User).filter(
            User.role.in_([UserRole.TRAVELER, UserRole.BOTH]),
            User.deleted_at.is_(None)
        )
        
        if verified_only:
            query = query.filter(
                User.identity_verified == True,
                User.status == UserStatus.ACTIVE
            )
        
        return query.offset(skip).limit(limit).all()
    
    def email_exists(self, email: str, exclude_id: UUID = None) -> bool:
        query = self.db.query(User).filter(
            User.email == email,
            User.deleted_at.is_(None)
        )
        
        if exclude_id:
            query = query.filter(User.id != exclude_id)
        
        return query.first() is not None
    
    def phone_exists(self, phone: str, exclude_id: UUID = None) -> bool:
        query = self.db.query(User).filter(
            User.phone == phone,
            User.deleted_at.is_(None)
        )
        
        if exclude_id:
            query = query.filter(User.id != exclude_id)
        
        return query.first() is not None
    
    def update_verification_status(
        self,
        user_id: UUID,
        email_verified: bool = None,
        phone_verified: bool = None,
        identity_verified: bool = None,
        payment_verified: bool = None
    ) -> Optional[User]:
        updates = {}
        if email_verified is not None:
            updates['email_verified'] = email_verified
        if phone_verified is not None:
            updates['phone_verified'] = phone_verified
        if identity_verified is not None:
            updates['identity_verified'] = identity_verified
        if payment_verified is not None:
            updates['payment_verified'] = payment_verified
        
        if updates:
            return self.update(user_id, **updates)
        return self.get(user_id)
    
    def update_ratings(
        self,
        user_id: UUID,
        as_shopper: bool,
        new_rating: float,
        increment_count: bool = True
    ) -> Optional[User]:
        user = self.get(user_id)
        if not user:
            return None
        
        if as_shopper:
            total_rating = user.shopper_rating * user.shopper_review_count
            new_count = user.shopper_review_count + (1 if increment_count else 0)
            if new_count > 0:
                user.shopper_rating = (total_rating + new_rating) / new_count
            user.shopper_review_count = new_count
        else:
            total_rating = user.traveler_rating * user.traveler_review_count
            new_count = user.traveler_review_count + (1 if increment_count else 0)
            if new_count > 0:
                user.traveler_rating = (total_rating + new_rating) / new_count
            user.traveler_review_count = new_count
        
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def search_users(
        self,
        query: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        search_term = f"%{query}%"
        return self.db.query(User).filter(
            self.model.deleted_at.is_(None),
            (
                User.email.ilike(search_term) |
                User.first_name.ilike(search_term) |
                User.last_name.ilike(search_term) |
                User.display_name.ilike(search_term) |
                User.phone.ilike(search_term)
            )
        ).offset(skip).limit(limit).all()