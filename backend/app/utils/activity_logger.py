"""
Activity Logger Utility
"""
from sqlalchemy.orm import Session
from app.models import ActivityLog
from typing import Optional, Dict, Any


def log_activity(
    db: Session,
    action_type: str,
    resource_type: str,
    description: str,
    resource_id: Optional[int] = None,
    user_id: str = "anonymous",
    status: str = "success",
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Log an activity to the database

    Args:
        db: Database session
        action_type: Type of action (upload, delete, chat, etc.)
        resource_type: Type of resource (document, conversation, tag, etc.)
        description: Human-readable description
        resource_id: ID of the affected resource
        user_id: User ID
        status: Status of the action (success, failed, pending)
        metadata: Additional metadata
    """
    log = ActivityLog(
        user_id=user_id,
        action_type=action_type,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
        status=status,
        metadata=metadata or {}
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return log
