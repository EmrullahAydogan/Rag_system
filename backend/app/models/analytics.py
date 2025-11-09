from sqlalchemy import Column, Integer, String, DateTime, JSON, Float
from sqlalchemy.sql import func
from app.core.database import Base


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)

    event_type = Column(String(100), nullable=False, index=True)
    # Event types: chat_message, document_upload, search_query, etc.

    metadata = Column(JSON, default={})
    # Can include: query, response_time, documents_used, user_id, etc.

    value = Column(Float, nullable=True)  # Numeric value if applicable

    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def __repr__(self):
        return f"<AnalyticsEvent {self.event_type}>"
