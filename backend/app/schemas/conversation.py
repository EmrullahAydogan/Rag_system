from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class MessageBase(BaseModel):
    role: str
    content: str


class MessageCreate(MessageBase):
    conversation_id: Optional[int] = None
    sources: Optional[List[Dict[str, Any]]] = []
    metadata: Optional[Dict[str, Any]] = {}


class MessageResponse(MessageBase):
    id: int
    conversation_id: int
    sources: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    timestamp: datetime

    class Config:
        from_attributes = True


class MessageFeedbackCreate(BaseModel):
    message_id: int
    rating: int  # 1-5
    comment: Optional[str] = None


class MessageFeedbackResponse(BaseModel):
    id: int
    message_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationBase(BaseModel):
    title: Optional[str] = "New Conversation"


class ConversationCreate(ConversationBase):
    user_id: Optional[str] = "anonymous"


class ConversationResponse(ConversationBase):
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


class ConversationListResponse(ConversationBase):
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    llm_provider: Optional[str] = None  # openai, anthropic, google
    model: Optional[str] = None
