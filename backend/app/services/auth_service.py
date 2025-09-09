
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User, UserStatus
from app.repositories.user_repository import UserRepository

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.JWT_SECRET_KEY, 
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        
        try:
            payload = jwt.decode(
                token, 
                settings.JWT_SECRET_KEY, 
                algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            return None
    
    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        
        user_repo = UserRepository(db)
        user = user_repo.get_by_email(email)
        
        if not user:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        if user.status != UserStatus.ACTIVE and user.status != UserStatus.PENDING_VERIFICATION:
            return None

        user.last_login_at = datetime.utcnow()
        db.commit()
        
        return user
    
    def register_user(
        self, 
        db: Session, 
        email: str, 
        password: str,
        first_name: str,
        last_name: str,
        **kwargs
    ) -> User:
        
        user_repo = UserRepository(db)

        if user_repo.email_exists(email):
            raise ValueError("Email already registered")

        password_hash = self.get_password_hash(password)

        user = user_repo.create(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            status=UserStatus.PENDING_VERIFICATION.value,
            **kwargs
        )
        
        return user
    
    def get_current_user(self, db: Session, token: str) -> Optional[User]:
        
        payload = self.verify_token(token)
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user_repo = UserRepository(db)
        user = user_repo.get(UUID(user_id))
        
        if not user or user.status not in [UserStatus.ACTIVE, UserStatus.PENDING_VERIFICATION]:
            return None
        
        return user