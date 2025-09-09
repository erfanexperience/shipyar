from typing import Generic, TypeVar, Type, Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from app.models.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db
    
    def get(self, id: UUID, include_deleted: bool = False) -> Optional[ModelType]:
        query = self.db.query(self.model).filter(self.model.id == id)
        if not include_deleted:
            query = query.filter(self.model.deleted_at.is_(None))
        return query.first()
    
    def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100,
        include_deleted: bool = False,
        order_by: str = None,
        order_desc: bool = True
    ) -> List[ModelType]:
        query = self.db.query(self.model)
        
        if not include_deleted:
            query = query.filter(self.model.deleted_at.is_(None))
        
        if order_by:
            column = getattr(self.model, order_by, None)
            if column:
                query = query.order_by(desc(column) if order_desc else asc(column))
        else:
            query = query.order_by(desc(self.model.created_at))
        
        return query.offset(skip).limit(limit).all()
    
    def create(self, **kwargs) -> ModelType:
        db_obj = self.model(**kwargs)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def update(self, id: UUID, **kwargs) -> Optional[ModelType]:
        db_obj = self.get(id)
        if not db_obj:
            return None
        
        for key, value in kwargs.items():
            if hasattr(db_obj, key):
                setattr(db_obj, key, value)
        
        db_obj.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def delete(self, id: UUID, hard_delete: bool = False) -> bool:
        db_obj = self.get(id, include_deleted=True)
        if not db_obj:
            return False
        
        if hard_delete:
            self.db.delete(db_obj)
        else:
            db_obj.soft_delete()
        
        self.db.commit()
        return True
    
    def restore(self, id: UUID) -> Optional[ModelType]:
        db_obj = self.get(id, include_deleted=True)
        if not db_obj or not db_obj.is_deleted:
            return None
        
        db_obj.restore()
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def count(self, include_deleted: bool = False, **filters) -> int:
        query = self.db.query(self.model)
        
        if not include_deleted:
            query = query.filter(self.model.deleted_at.is_(None))
        
        for key, value in filters.items():
            if hasattr(self.model, key):
                query = query.filter(getattr(self.model, key) == value)
        
        return query.count()
    
    def exists(self, id: UUID, include_deleted: bool = False) -> bool:
        return self.get(id, include_deleted) is not None
    
    def filter(
        self,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
        order_by: str = None,
        order_desc: bool = True,
        **filters
    ) -> List[ModelType]:
        query = self.db.query(self.model)
        
        if not include_deleted:
            query = query.filter(self.model.deleted_at.is_(None))
        
        for key, value in filters.items():
            if hasattr(self.model, key):
                column = getattr(self.model, key)
                if value is None:
                    query = query.filter(column.is_(None))
                elif isinstance(value, list):
                    query = query.filter(column.in_(value))
                elif isinstance(value, dict):
                    if 'gte' in value:
                        query = query.filter(column >= value['gte'])
                    if 'gt' in value:
                        query = query.filter(column > value['gt'])
                    if 'lte' in value:
                        query = query.filter(column <= value['lte'])
                    if 'lt' in value:
                        query = query.filter(column < value['lt'])
                    if 'like' in value:
                        query = query.filter(column.like(f"%{value['like']}%"))
                else:
                    query = query.filter(column == value)
        
        if order_by:
            column = getattr(self.model, order_by, None)
            if column:
                query = query.order_by(desc(column) if order_desc else asc(column))
        else:
            query = query.order_by(desc(self.model.created_at))
        
        return query.offset(skip).limit(limit).all()
    
    def bulk_create(self, objects: List[Dict[str, Any]]) -> List[ModelType]:
        db_objs = [self.model(**obj) for obj in objects]
        self.db.add_all(db_objs)
        self.db.commit()
        return db_objs
    
    def bulk_update(self, updates: List[Dict[str, Any]]) -> int:
        updated_count = 0
        for update in updates:
            if 'id' in update:
                id = update.pop('id')
                if self.update(id, **update):
                    updated_count += 1
        return updated_count