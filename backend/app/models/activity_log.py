from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)

    # User information
    user_id = Column(String(100), default="anonymous")

    # Action details
    action_type = Column(String(50), nullable=False, index=True)  # e.g., 'upload', 'delete', 'chat', 'tag_create'
    resource_type = Column(String(50), nullable=False)  # e.g., 'document', 'conversation', 'tag'
    resource_id = Column(Integer, nullable=True)  # ID of the affected resource

    # Action description
    description = Column(Text, nullable=False)

    # Additional metadata
    log_metadata = Column(JSON, default={})  # Store extra info like IP, browser, etc.

    # Status
    status = Column(String(20), default="success")  # success, failed, pending

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def __repr__(self):
        return f"<ActivityLog {self.id}: {self.action_type} on {self.resource_type}>"
