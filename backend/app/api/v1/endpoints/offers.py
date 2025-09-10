from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.offer import OfferStatus
from app.schemas.offer import (
    OfferCreate, OfferUpdate, OfferResponse, OfferSummary, OfferStats
)
from app.services.offer_service import OfferService

router = APIRouter()

@router.post("/{order_id}/offers", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
def create_offer(
    order_id: UUID,
    offer_data: OfferCreate,
    expires_in_hours: int = Query(48, ge=1, le=168),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offer_service = OfferService(db)
    
    try:
        offer = offer_service.create_offer(
            order_id, offer_data, current_user.id, expires_in_hours
        )
        return OfferResponse.model_validate(offer)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{order_id}/offers", response_model=List[OfferResponse])
def get_order_offers(
    order_id: UUID,
    status_filter: Optional[OfferStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, gt=0, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offer_service = OfferService(db)
    offers = offer_service.get_order_offers(order_id, status_filter, skip, limit)
    
    return [OfferResponse.model_validate(offer) for offer in offers if 
            offer_service._can_user_view_offer(offer, current_user.id)]

@router.get("/", response_model=List[OfferResponse])
def get_my_offers(
    status_filter: Optional[OfferStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, gt=0, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offer_service = OfferService(db)
    offers = offer_service.get_traveler_offers(current_user.id, status_filter, skip, limit)
    return [OfferResponse.model_validate(offer) for offer in offers]

@router.get("/stats", response_model=OfferStats)
def get_offer_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offer_service = OfferService(db)
    stats = offer_service.get_offer_stats(current_user.id)
    return OfferStats(**stats)

@router.get("/{offer_id}", response_model=OfferResponse)
def get_offer(
    offer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offer_service = OfferService(db)
    
    offer = offer_service.get_offer(offer_id, current_user.id)
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    return OfferResponse.model_validate(offer)

@router.put("/{offer_id}", response_model=OfferResponse)
def update_offer(
    offer_id: UUID,
    offer_data: OfferUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offer_service = OfferService(db)
    
    try:
        offer = offer_service.update_offer(offer_id, offer_data, current_user.id)
        if not offer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found or you don't have permission to update it"
            )
        return OfferResponse.model_validate(offer)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{offer_id}/accept", response_model=OfferResponse)
def accept_offer(
    offer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offer_service = OfferService(db)
    
    try:
        offer = offer_service.accept_offer(offer_id, current_user.id)
        return OfferResponse.model_validate(offer)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{offer_id}/withdraw", status_code=status.HTTP_204_NO_CONTENT)
def withdraw_offer(
    offer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offer_service = OfferService(db)
    
    try:
        success = offer_service.withdraw_offer(offer_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found or you don't have permission to withdraw it"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{offer_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
def reject_offer(
    offer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject an offer (shopper rejects traveler's offer)"""
    offer_service = OfferService(db)
    
    try:
        success = offer_service.reject_offer(offer_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found or you don't have permission to reject it"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )