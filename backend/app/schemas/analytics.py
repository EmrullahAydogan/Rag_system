from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any


class AnalyticsEventCreate(BaseModel):
    event_type: str
    metadata: Optional[Dict[str, Any]] = {}
    value: Optional[float] = None


class AnalyticsEventResponse(BaseModel):
    id: int
    event_type: str
    metadata: Dict[str, Any]
    value: Optional[float]
    timestamp: datetime

    class Config:
        from_attributes = True


class AnalyticsSummary(BaseModel):
    total_conversations: int
    total_messages: int
    total_documents: int
    avg_messages_per_conversation: float
    avg_response_time: Optional[float]
    total_feedback: int
    avg_rating: Optional[float]


class TimeSeriesData(BaseModel):
    date: str
    count: int


class TopicData(BaseModel):
    topic: str
    count: int
