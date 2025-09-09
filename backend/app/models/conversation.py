
from datetime import datetime
import enum
from sqlalchemy import (
    Column, ForeignKey, Text, DateTime, Boolean, Enum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class MessageType(str, enum.Enum):
    
    TEXT = "text"
    IMAGE = "image"
    DOCUMENT = "document"
    SYSTEM = "system"
    LOCATION = "location"

class Conversation(BaseModel):
    
    __tablename__ = "conversations"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, unique=True)
    shopper_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    traveler_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    is_unlocked = Column(Boolean, default=False)
    unlocked_at = Column(DateTime(timezone=True), nullable=True)

    is_active = Column(Boolean, default=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)

    last_message_at = Column(DateTime(timezone=True), nullable=True)

    order = relationship("Order")
    shopper = relationship("User", foreign_keys=[shopper_id])
    traveler = relationship("User", foreign_keys=[traveler_id])
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    
    @property
    def participant_ids(self) -> list:
        
        return [self.shopper_id, self.traveler_id]
    
    def is_participant(self, user_id: UUID) -> bool:
        
        return user_id in self.participant_ids
    
    def unlock(self):
        
        if not self.is_unlocked:
            self.is_unlocked = True
            self.unlocked_at = datetime.utcnow()
    
    def close(self):
        
        if self.is_active:
            self.is_active = False
            self.closed_at = datetime.utcnow()
    
    def can_send_message(self, user_id: UUID) -> bool:
        
        return (self.is_unlocked and 
                self.is_active and 
                self.is_participant(user_id))

class Message(BaseModel):
    
    __tablename__ = "messages"

    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    message_type = Column(Enum(MessageType), nullable=False, default=MessageType.TEXT)
    content = Column(Text, nullable=False)

    filtered_content = Column(Text, nullable=True)
    violations_detected = Column(JSONB, nullable=True)
    is_blocked = Column(Boolean, default=False)

    attachment_url = Column(Text, nullable=True)
    attachment_metadata = Column(JSONB, nullable=True)

    read_at = Column(DateTime(timezone=True), nullable=True)
    edited_at = Column(DateTime(timezone=True), nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")
    
    @property
    def is_read(self) -> bool:
        
        return self.read_at is not None
    
    @property
    def is_edited(self) -> bool:
        
        return self.edited_at is not None
    
    @property
    def has_violations(self) -> bool:
        
        return self.violations_detected is not None and len(self.violations_detected) > 0
    
    def mark_as_read(self):
        
        if not self.is_read:
            self.read_at = datetime.utcnow()
    
    def edit_content(self, new_content: str):
        
        self.content = new_content
        self.edited_at = datetime.utcnow()
    
    def get_display_content(self) -> str:
        
        if self.is_blocked:
            return "[Message blocked due to policy violations]"
        return self.filtered_content or self.content