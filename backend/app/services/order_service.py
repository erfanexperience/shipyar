from typing import Optional, List
from uuid import UUID
from datetime import date
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func

from app.models.order import Order, OrderStatus
from app.repositories.order_repository import OrderRepository
from app.schemas.order import OrderCreate, OrderUpdate, OrderFilter


class OrderService:
    
    def __init__(self, db: Session):
        self.db = db
        self.order_repo = OrderRepository(db)
    
    def create_order(self, order_data: OrderCreate, user_id: UUID) -> Order:
        platform_fee = self._calculate_platform_fee(order_data.reward_amount)
        total_cost = order_data.reward_amount + platform_fee
        
        order = self.order_repo.create(
            shopper_id=user_id,
            platform_fee=platform_fee,
            total_cost=total_cost,
            **order_data.model_dump()
        )
        
        return order
    
    def get_order(self, order_id: UUID, user_id: Optional[UUID] = None) -> Optional[Order]:
        order = self.order_repo.get(order_id)
        
        if not order:
            return None
        
        if user_id and not self._can_user_view_order(order, user_id):
            return None
        
        return order
    
    def update_order(
        self, 
        order_id: UUID, 
        order_data: OrderUpdate, 
        user_id: UUID
    ) -> Optional[Order]:
        order = self.order_repo.get(order_id)
        
        if not order or order.shopper_id != user_id:
            return None
        
        if not self._can_update_order(order):
            raise ValueError("Order cannot be updated in current status")
        
        update_data = order_data.model_dump(exclude_unset=True)
        
        if 'reward_amount' in update_data:
            platform_fee = self._calculate_platform_fee(update_data['reward_amount'])
            update_data['platform_fee'] = platform_fee
            update_data['total_cost'] = update_data['reward_amount'] + platform_fee
        
        return self.order_repo.update(order_id, **update_data)
    
    def delete_order(self, order_id: UUID, user_id: UUID) -> bool:
        order = self.order_repo.get(order_id)
        
        if not order or order.shopper_id != user_id:
            return False
        
        if not self._can_delete_order(order):
            raise ValueError("Order cannot be deleted in current status")
        
        return self.order_repo.soft_delete(order_id)
    
    def get_user_orders(
        self,
        user_id: UUID,
        as_shopper: bool = True,
        status: Optional[OrderStatus] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[Order]:
        if status:
            orders = self.order_repo.get_orders_by_status(status, skip, limit)
            if as_shopper:
                return [o for o in orders if o.shopper_id == user_id]
            else:
                return [o for o in orders if o.matched_traveler_id == user_id]
        
        return self.order_repo.get_user_orders(user_id, as_shopper, skip, limit)
    
    def search_orders(self, filters: OrderFilter, exclude_user_id: Optional[UUID] = None) -> List[Order]:
        from sqlalchemy.orm import joinedload
        query = self.db.query(Order).options(
            joinedload(Order.destination_city),
            joinedload(Order.shopper)
        ).filter(Order.deleted_at.is_(None))
        
        # Exclude orders from the specified user (typically the current user)
        if exclude_user_id:
            query = query.filter(Order.shopper_id != exclude_user_id)
        
        if filters.destination_country:
            query = query.filter(Order.destination_country == filters.destination_country)
        
        if filters.destination_city_id:
            query = query.filter(Order.destination_city_id == filters.destination_city_id)
        
        if filters.status:
            query = query.filter(Order.status == filters.status)
        else:
            # If no status filter is provided, only show active orders (exclude matched, delivered, etc.)
            query = query.filter(Order.status == OrderStatus.ACTIVE)
        
        if filters.min_reward:
            query = query.filter(Order.reward_amount >= filters.min_reward)
        
        if filters.max_reward:
            query = query.filter(Order.reward_amount <= filters.max_reward)
        
        if filters.deadline_before:
            query = query.filter(Order.deadline_date <= filters.deadline_before)
        
        if filters.deadline_after:
            query = query.filter(Order.deadline_date >= filters.deadline_after)
        
        if filters.max_weight:
            query = query.filter(
                or_(
                    Order.weight_estimate.is_(None),
                    Order.weight_estimate <= filters.max_weight
                )
            )
        
        if filters.currency:
            query = query.filter(Order.reward_currency == filters.currency)
        
        if filters.search_query:
            search_term = f"%{filters.search_query}%"
            query = query.filter(
                or_(
                    Order.product_name.ilike(search_term),
                    Order.product_description.ilike(search_term),
                    Order.special_instructions.ilike(search_term)
                )
            )
        
        query = query.order_by(desc(Order.created_at))
        
        return query.offset(filters.skip).limit(filters.limit).all()
    
    def get_active_orders(
        self,
        destination_country: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
        exclude_user_id: Optional[UUID] = None
    ) -> List[Order]:
        orders = self.order_repo.get_active_orders(destination_country, skip, limit)
        # Filter out the current user's orders if exclude_user_id is provided
        if exclude_user_id:
            orders = [o for o in orders if o.shopper_id != exclude_user_id]
        return orders
    
    def update_order_status(
        self,
        order_id: UUID,
        new_status: OrderStatus,
        user_id: UUID,
        notes: Optional[str] = None
    ) -> Optional[Order]:
        order = self.order_repo.get(order_id)
        
        if not order:
            return None
        
        if not self._can_user_update_status(order, user_id, new_status):
            raise ValueError("User cannot update order to this status")
        
        if not self._is_valid_status_transition(order.status, new_status):
            raise ValueError(f"Invalid status transition from {order.status} to {new_status}")
        
        order.update_status(new_status, user_id, notes)
        self.db.commit()
        
        return order
    
    def get_nearby_orders(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 50.0,
        limit: int = 20,
        exclude_user_id: Optional[UUID] = None
    ) -> List[Order]:
        query = self.db.query(Order).filter(
            and_(
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.ACTIVE,
                Order.destination_coordinates.isnot(None)
            )
        )
        
        # Exclude orders from the specified user
        if exclude_user_id:
            query = query.filter(Order.shopper_id != exclude_user_id)
        
        return query.limit(limit).all()
    
    def _calculate_platform_fee(self, reward_amount: Decimal) -> Decimal:
        fee_percentage = Decimal('0.05')  # 5%
        min_fee = Decimal('0.50')
        max_fee = Decimal('10.00')
        
        fee = reward_amount * fee_percentage
        return max(min_fee, min(fee, max_fee))
    
    def _can_user_view_order(self, order: Order, user_id: UUID) -> bool:
        if order.shopper_id == user_id or order.matched_traveler_id == user_id:
            return True
        
        if order.status == OrderStatus.ACTIVE:
            return True
        
        return False
    
    def _can_update_order(self, order: Order) -> bool:
        return order.status in [OrderStatus.DRAFT, OrderStatus.ACTIVE]
    
    def _can_delete_order(self, order: Order) -> bool:
        return order.status in [OrderStatus.DRAFT, OrderStatus.ACTIVE]
    
    def _can_user_update_status(self, order: Order, user_id: UUID, new_status: OrderStatus) -> bool:
        if order.shopper_id == user_id:
            return new_status in [
                OrderStatus.ACTIVE, OrderStatus.CANCELLED, 
                OrderStatus.PURCHASED, OrderStatus.COMPLETED
            ]
        
        if order.matched_traveler_id == user_id:
            return new_status in [
                OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED
            ]
        
        return False
    
    def _is_valid_status_transition(self, current_status: OrderStatus, new_status: OrderStatus) -> bool:
        valid_transitions = {
            OrderStatus.DRAFT: [OrderStatus.ACTIVE, OrderStatus.CANCELLED],
            OrderStatus.ACTIVE: [OrderStatus.MATCHED, OrderStatus.CANCELLED],
            OrderStatus.MATCHED: [OrderStatus.PURCHASED, OrderStatus.CANCELLED],
            OrderStatus.PURCHASED: [OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED],
            OrderStatus.IN_TRANSIT: [OrderStatus.DELIVERED, OrderStatus.DISPUTED],
            OrderStatus.DELIVERED: [OrderStatus.COMPLETED, OrderStatus.DISPUTED],
            OrderStatus.COMPLETED: [],
            OrderStatus.CANCELLED: [],
            OrderStatus.DISPUTED: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
        }
        
        return new_status in valid_transitions.get(current_status, [])