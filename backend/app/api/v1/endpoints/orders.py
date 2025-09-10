from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.order import OrderStatus
from app.schemas.order import (
    OrderCreate, OrderUpdate, OrderResponse, OrderSummary,
    OrderFilter, OrderStatusUpdate, OrderWithOffers
)
from app.services.order_service import OrderService

router = APIRouter()

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order_service = OrderService(db)
    
    try:
        order = order_service.create_order(order_data, current_user.id)
        return OrderResponse.model_validate(order)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[OrderSummary])
def list_orders(
    destination_country: Optional[str] = Query(None, max_length=2),
    destination_city_id: Optional[str] = Query(None),
    status_filter: Optional[OrderStatus] = Query(None, alias="status"),
    min_reward: Optional[float] = Query(None, gt=0),
    max_reward: Optional[float] = Query(None, gt=0),
    deadline_before: Optional[str] = Query(None),
    deadline_after: Optional[str] = Query(None),
    search_query: Optional[str] = Query(None, max_length=100),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, gt=0, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    import logging
    logger = logging.getLogger(__name__)
    
    # Log all incoming parameters
    logger.info("=== ORDER SEARCH REQUEST ===")
    logger.info(f"destination_country: {destination_country}")
    logger.info(f"destination_city_id: {destination_city_id}")
    logger.info(f"status_filter: {status_filter}")
    logger.info(f"min_reward: {min_reward}")
    logger.info(f"max_reward: {max_reward}")
    logger.info(f"deadline_before: {deadline_before}")
    logger.info(f"deadline_after: {deadline_after}")
    logger.info(f"search_query: {search_query}")
    logger.info(f"skip: {skip}, limit: {limit}")
    
    order_service = OrderService(db)
    
    # Convert destination_city_id string to UUID if provided
    city_id = UUID(destination_city_id) if destination_city_id else None
    logger.info(f"Converted city_id: {city_id}")
    
    filters = OrderFilter(
        destination_country=destination_country,
        destination_city_id=city_id,
        status=status_filter,
        min_reward=min_reward,
        max_reward=max_reward,
        deadline_before=deadline_before,
        deadline_after=deadline_after,
        search_query=search_query,
        skip=skip,
        limit=limit
    )
    
    logger.info(f"Created filters object: {filters}")
    
    # Exclude current user's orders if they are authenticated
    exclude_user_id = current_user.id if current_user else None
    if exclude_user_id:
        logger.info(f"Excluding orders from user: {exclude_user_id}")
    
    orders = order_service.search_orders(filters, exclude_user_id=exclude_user_id)
    logger.info(f"Found {len(orders)} orders from database")
    
    # Convert orders to summaries with city information
    order_summaries = []
    for order in orders:
        # Create order dict without destination_city first
        order_data = {
            'id': order.id,
            'product_name': order.product_name,
            'product_image_url': order.product_image_url,
            'product_price': order.product_price,
            'destination_country': order.destination_country,
            'destination_city_id': order.destination_city_id,
            'deadline_date': order.deadline_date,
            'preferred_delivery_date': order.preferred_delivery_date,
            'reward_amount': order.reward_amount,
            'reward_currency': order.reward_currency,
            'special_instructions': order.special_instructions,
            'status': order.status,
            'created_at': order.created_at,
            'updated_at': order.updated_at,
            'shopper_id': order.shopper_id
        }
        
        # Add city information if available
        if order.destination_city:
            order_data['destination_city'] = {
                'id': str(order.destination_city.id),
                'name': order.destination_city.name,
                'country_code': order.destination_city.country_code
            }
        else:
            order_data['destination_city'] = None
            
        # Add shopper information if available
        if order.shopper:
            order_data['shopper'] = {
                'id': str(order.shopper.id),
                'first_name': order.shopper.first_name,
                'last_name': order.shopper.last_name,
                'display_name': order.shopper.display_name or f"{order.shopper.first_name} {order.shopper.last_name[0]}.",
                'avatar_url': order.shopper.avatar_url,
                'rating': order.shopper.rating_as_shopper if hasattr(order.shopper, 'rating_as_shopper') else 0,
                'review_count': order.shopper.review_count_as_shopper if hasattr(order.shopper, 'review_count_as_shopper') else 0,
                'verified': order.shopper.identity_verified
            }
        else:
            order_data['shopper'] = None
            
        order_summaries.append(order_data)
        logger.info(f"Order {order.id}: {order.product_name[:30]}... -> {order.destination_city.name if order.destination_city else 'No city'}")
    
    logger.info(f"Returning {len(order_summaries)} order summaries")
    logger.info("=== END ORDER SEARCH ===")
    
    return order_summaries

@router.get("/active", response_model=List[OrderSummary])
def get_active_orders(
    destination_country: Optional[str] = Query(None, max_length=2),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, gt=0, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    order_service = OrderService(db)
    # Exclude current user's orders if they are authenticated
    exclude_user_id = current_user.id if current_user else None
    orders = order_service.get_active_orders(destination_country, skip, limit, exclude_user_id)
    return [OrderSummary.model_validate(order) for order in orders]

@router.get("/my", response_model=List[OrderResponse])
def get_my_orders(
    as_shopper: bool = Query(True),
    status_filter: Optional[OrderStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, gt=0, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order_service = OrderService(db)
    orders = order_service.get_user_orders(
        current_user.id, as_shopper, status_filter, skip, limit
    )
    return [OrderResponse.model_validate(order) for order in orders]

@router.get("/nearby", response_model=List[OrderSummary])
def get_nearby_orders(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(50.0, gt=0, le=500),
    limit: int = Query(20, gt=0, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    order_service = OrderService(db)
    # Exclude current user's orders if they are authenticated
    exclude_user_id = current_user.id if current_user else None
    orders = order_service.get_nearby_orders(latitude, longitude, radius_km, limit, exclude_user_id)
    return [OrderSummary.model_validate(order) for order in orders]

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    order_service = OrderService(db)
    user_id = current_user.id if current_user else None
    
    order = order_service.get_order(order_id, user_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return OrderResponse.model_validate(order)

@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: UUID,
    order_data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order_service = OrderService(db)
    
    try:
        order = order_service.update_order(order_id, order_data, current_user.id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found or you don't have permission to update it"
            )
        return OrderResponse.model_validate(order)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order_service = OrderService(db)
    
    try:
        success = order_service.delete_order(order_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found or you don't have permission to delete it"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: UUID,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order_service = OrderService(db)
    
    try:
        order = order_service.update_order_status(
            order_id, status_update.status, current_user.id, status_update.notes
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        return OrderResponse.model_validate(order)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )