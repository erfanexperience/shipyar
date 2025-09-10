from typing import Optional, List
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.offer import Offer, OfferStatus
from app.repositories.base import BaseRepository


class OfferRepository(BaseRepository[Offer]):
    
    def __init__(self, db: Session):
        super().__init__(Offer, db)
    
    def get_order_offers(
        self,
        order_id: UUID,
        status: Optional[OfferStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Offer]:
        query = self.db.query(Offer).filter(
            Offer.order_id == order_id
        )
        
        if status:
            query = query.filter(Offer.status == status)
        
        return query.offset(skip).limit(limit).all()
    
    def get_traveler_offers(
        self,
        traveler_id: UUID,
        status: Optional[OfferStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Offer]:
        query = self.db.query(Offer).filter(
            Offer.traveler_id == traveler_id
        )
        
        if status:
            query = query.filter(Offer.status == status)
        
        return query.order_by(Offer.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_order_and_traveler(
        self,
        order_id: UUID,
        traveler_id: UUID
    ) -> Optional[Offer]:
        return self.db.query(Offer).filter(
            and_(
                Offer.order_id == order_id,
                Offer.traveler_id == traveler_id
            )
        ).first()
    
    def get_active_offers_for_order(self, order_id: UUID) -> List[Offer]:
        return self.db.query(Offer).filter(
            and_(
                Offer.order_id == order_id,
                Offer.status == OfferStatus.ACTIVE,
                or_(
                    Offer.expires_at.is_(None),
                    Offer.expires_at > datetime.utcnow()
                )
            )
        ).all()
    
    def get_expired_offers(self, limit: int = 100) -> List[Offer]:
        return self.db.query(Offer).filter(
            and_(
                Offer.status == OfferStatus.ACTIVE,
                Offer.expires_at.isnot(None),
                Offer.expires_at <= datetime.utcnow()
            )
        ).limit(limit).all()
    
    def count_order_offers(
        self,
        order_id: UUID,
        status: Optional[OfferStatus] = None
    ) -> int:
        query = self.db.query(Offer).filter(
            Offer.order_id == order_id
        )
        
        if status:
            query = query.filter(Offer.status == status)
        
        return query.count()
    
    def count_traveler_offers(
        self,
        traveler_id: UUID,
        status: Optional[OfferStatus] = None
    ) -> int:
        query = self.db.query(Offer).filter(
            Offer.traveler_id == traveler_id
        )
        
        if status:
            query = query.filter(Offer.status == status)
        
        return query.count()
    
    def has_active_offer(self, order_id: UUID, traveler_id: UUID) -> bool:
        return self.db.query(Offer).filter(
            and_(
                Offer.order_id == order_id,
                Offer.traveler_id == traveler_id,
                Offer.status == OfferStatus.ACTIVE,
                or_(
                    Offer.expires_at.is_(None),
                    Offer.expires_at > datetime.utcnow()
                )
            )
        ).first() is not None