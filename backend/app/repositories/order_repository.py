from typing import Optional, List
from uuid import UUID
from datetime import date
from sqlalchemy.orm import Session
from app.models.order import Order, OrderStatus
from app.repositories.base import BaseRepository


class OrderRepository(BaseRepository[Order]):
    
    def __init__(self, db: Session):
        super().__init__(Order, db)
    
    def get_user_orders(
        self,
        user_id: UUID,
        as_shopper: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        if as_shopper:
            return self.filter(
                skip=skip,
                limit=limit,
                shopper_id=user_id
            )
        else:
            return self.filter(
                skip=skip,
                limit=limit,
                matched_traveler_id=user_id
            )
    
    def get_active_orders(
        self,
        destination_country: str = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        filters = {'status': OrderStatus.ACTIVE.value}
        if destination_country:
            filters['destination_country'] = destination_country
        
        return self.filter(
            skip=skip,
            limit=limit,
            **filters
        )
    
    def get_orders_by_status(
        self,
        status: OrderStatus,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        return self.filter(
            skip=skip,
            limit=limit,
            status=status
        )
    
    def get_orders_by_deadline(
        self,
        deadline_before: date = None,
        deadline_after: date = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        query = self.db.query(Order).filter(
            Order.deleted_at.is_(None)
        )
        
        if deadline_before:
            query = query.filter(Order.deadline_date <= deadline_before)
        if deadline_after:
            query = query.filter(Order.deadline_date >= deadline_after)
        
        return query.offset(skip).limit(limit).all()
    
    def search_orders(
        self,
        query: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        search_term = f"%{query}%"
        return self.db.query(Order).filter(
            Order.deleted_at.is_(None),
            (
                Order.product_name.ilike(search_term) |
                Order.product_description.ilike(search_term) |
                Order.special_instructions.ilike(search_term)
            )
        ).offset(skip).limit(limit).all()
    
    def get_matched_orders(
        self,
        traveler_id: UUID = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        query = self.db.query(Order).filter(
            Order.deleted_at.is_(None),
            Order.matched_traveler_id.isnot(None)
        )
        
        if traveler_id:
            query = query.filter(Order.matched_traveler_id == traveler_id)
        
        return query.offset(skip).limit(limit).all()
    
    def get_orders_in_transit(
        self,
        traveler_id: UUID = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        filters = {'status': OrderStatus.IN_TRANSIT}
        if traveler_id:
            filters['matched_traveler_id'] = traveler_id
        
        return self.filter(
            skip=skip,
            limit=limit,
            **filters
        )
    
    def count_user_orders(
        self,
        user_id: UUID,
        as_shopper: bool = True,
        status: OrderStatus = None
    ) -> int:
        filters = {}
        if as_shopper:
            filters['shopper_id'] = user_id
        else:
            filters['matched_traveler_id'] = user_id
        
        if status:
            filters['status'] = status
        
        return self.count(**filters)