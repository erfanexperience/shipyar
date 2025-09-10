from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.offer import Offer, OfferStatus
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.repositories.offer_repository import OfferRepository
from app.repositories.order_repository import OrderRepository
from app.schemas.offer import OfferCreate, OfferUpdate
from app.services.notification_service import NotificationService


class OfferService:
    
    def __init__(self, db: Session):
        self.db = db
        self.offer_repo = OfferRepository(db)
        self.order_repo = OrderRepository(db)
        self.notification_service = NotificationService(db)
    
    def create_offer(
        self,
        order_id: UUID,
        offer_data: OfferCreate,
        traveler_id: UUID,
        expires_in_hours: int = 48
    ) -> Offer:
        order = self.order_repo.get(order_id)
        if not order:
            raise ValueError("Order not found")
        
        if not order.can_accept_offers:
            raise ValueError("Order is not accepting offers")
        
        if order.shopper_id == traveler_id:
            raise ValueError("Cannot submit offer on own order")
        
        existing_offer = self.offer_repo.get_by_order_and_traveler(order_id, traveler_id)
        if existing_offer and existing_offer.status == OfferStatus.ACTIVE:
            raise ValueError("You already have an active offer for this order")
        
        expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
        
        offer = self.offer_repo.create(
            order_id=order_id,
            traveler_id=traveler_id,
            expires_at=expires_at,
            **offer_data.model_dump()
        )
        
        # Send notification to the order owner
        traveler = self.db.query(User).filter(User.id == traveler_id).first()
        if traveler:
            self.notification_service.create_offer_received_notification(
                order=order,
                offer=offer,
                traveler=traveler
            )
        
        return offer
    
    def get_offer(self, offer_id: UUID, user_id: Optional[UUID] = None) -> Optional[Offer]:
        offer = self.offer_repo.get(offer_id)
        
        if not offer:
            return None
        
        if user_id and not self._can_user_view_offer(offer, user_id):
            return None
        
        return offer
    
    def update_offer(
        self,
        offer_id: UUID,
        offer_data: OfferUpdate,
        traveler_id: UUID
    ) -> Optional[Offer]:
        offer = self.offer_repo.get(offer_id)
        
        if not offer or offer.traveler_id != traveler_id:
            return None
        
        if not self._can_update_offer(offer):
            raise ValueError("Offer cannot be updated")
        
        update_data = offer_data.model_dump(exclude_unset=True)
        return self.offer_repo.update(offer_id, **update_data)
    
    def withdraw_offer(self, offer_id: UUID, traveler_id: UUID) -> bool:
        offer = self.offer_repo.get(offer_id)
        
        if not offer or offer.traveler_id != traveler_id:
            return False
        
        if offer.status != OfferStatus.ACTIVE:
            raise ValueError("Only active offers can be withdrawn")
        
        offer.withdraw()
        self.db.commit()
        return True
    
    def reject_offer(self, offer_id: UUID, shopper_id: UUID) -> bool:
        """Reject an offer (called by shopper to reject a traveler's offer)"""
        offer = self.offer_repo.get(offer_id)
        
        if not offer:
            return False
        
        # Verify the shopper owns the order
        if offer.order.shopper_id != shopper_id:
            return False
        
        if offer.status != OfferStatus.ACTIVE:
            raise ValueError("Only active offers can be rejected")
        
        # Reject the offer (sets status to REJECTED)
        offer.reject()
        self.db.commit()
        
        # Send notification to traveler
        self.notification_service.create_offer_declined_notification(
            offer=offer,
            order=offer.order
        )
        
        return True
    
    def accept_offer(self, offer_id: UUID, shopper_id: UUID) -> Offer:
        offer = self.offer_repo.get(offer_id)
        
        if not offer:
            raise ValueError("Offer not found")
        
        if offer.order.shopper_id != shopper_id:
            raise ValueError("You can only accept offers on your own orders")
        
        if not offer.can_be_accepted:
            raise ValueError("Offer cannot be accepted")
        
        offer.accept()
        self.db.commit()
        
        # Send notification to the traveler
        self.notification_service.create_offer_accepted_notification(
            offer=offer,
            order=offer.order
        )
        
        return offer
    
    def get_order_offers(
        self,
        order_id: UUID,
        status: Optional[OfferStatus] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[Offer]:
        return self.offer_repo.get_order_offers(order_id, status, skip, limit)
    
    def get_traveler_offers(
        self,
        traveler_id: UUID,
        status: Optional[OfferStatus] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[Offer]:
        return self.offer_repo.get_traveler_offers(traveler_id, status, skip, limit)
    
    def get_active_offers_count(self, order_id: UUID) -> int:
        return self.offer_repo.count_order_offers(order_id, OfferStatus.ACTIVE)
    
    def has_pending_offers(self, order_id: UUID) -> bool:
        return self.get_active_offers_count(order_id) > 0
    
    def expire_old_offers(self) -> int:
        expired_offers = self.offer_repo.get_expired_offers()
        count = 0
        
        for offer in expired_offers:
            offer.expire()
            count += 1
        
        if count > 0:
            self.db.commit()
        
        return count
    
    def get_offer_stats(self, traveler_id: UUID) -> dict:
        total_offers = self.offer_repo.count_traveler_offers(traveler_id)
        active_offers = self.offer_repo.count_traveler_offers(traveler_id, OfferStatus.ACTIVE)
        accepted_offers = self.offer_repo.count_traveler_offers(traveler_id, OfferStatus.ACCEPTED)
        withdrawn_offers = self.offer_repo.count_traveler_offers(traveler_id, OfferStatus.WITHDRAWN)
        
        return {
            "total_offers": total_offers,
            "active_offers": active_offers,
            "accepted_offers": accepted_offers,
            "withdrawn_offers": withdrawn_offers
        }
    
    def _can_user_view_offer(self, offer: Offer, user_id: UUID) -> bool:
        return (
            offer.traveler_id == user_id or 
            offer.order.shopper_id == user_id
        )
    
    def _can_update_offer(self, offer: Offer) -> bool:
        return (
            offer.status == OfferStatus.ACTIVE and
            offer.is_active
        )