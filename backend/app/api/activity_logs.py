"""
Activity Logs API Endpoints
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.schemas import ActivityLogCreate, ActivityLogResponse
from app.models import ActivityLog

router = APIRouter(prefix="/api/logs", tags=["activity-logs"])


@router.post("/", response_model=ActivityLogResponse)
def create_log(
    log: ActivityLogCreate,
    db: Session = Depends(get_db)
):
    """Create a new activity log entry"""
    db_log = ActivityLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.get("/", response_model=List[ActivityLogResponse])
def get_logs(
    skip: int = 0,
    limit: int = 100,
    action_type: Optional[str] = None,
    resource_type: Optional[str] = None,
    status: Optional[str] = None,
    days: int = Query(default=7, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get activity logs with filters"""
    query = db.query(ActivityLog)

    # Apply filters
    if action_type:
        query = query.filter(ActivityLog.action_type == action_type)

    if resource_type:
        query = query.filter(ActivityLog.resource_type == resource_type)

    if status:
        query = query.filter(ActivityLog.status == status)

    # Date filter
    start_date = datetime.utcnow() - timedelta(days=days)
    query = query.filter(ActivityLog.created_at >= start_date)

    # Order by newest first
    query = query.order_by(desc(ActivityLog.created_at))

    # Pagination
    logs = query.offset(skip).limit(limit).all()

    return logs


@router.get("/stats")
def get_log_stats(
    days: int = Query(default=7, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get activity log statistics"""
    start_date = datetime.utcnow() - timedelta(days=days)

    total_logs = db.query(ActivityLog).filter(
        ActivityLog.created_at >= start_date
    ).count()

    # Count by action type
    action_counts = db.query(
        ActivityLog.action_type,
        db.func.count(ActivityLog.id)
    ).filter(
        ActivityLog.created_at >= start_date
    ).group_by(ActivityLog.action_type).all()

    # Count by status
    status_counts = db.query(
        ActivityLog.status,
        db.func.count(ActivityLog.id)
    ).filter(
        ActivityLog.created_at >= start_date
    ).group_by(ActivityLog.status).all()

    return {
        "total_logs": total_logs,
        "by_action": [{"action": action, "count": count} for action, count in action_counts],
        "by_status": [{"status": status, "count": count} for status, count in status_counts],
    }


@router.delete("/{log_id}")
def delete_log(
    log_id: int,
    db: Session = Depends(get_db)
):
    """Delete an activity log"""
    log = db.query(ActivityLog).filter(ActivityLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    db.delete(log)
    db.commit()
    return {"message": "Log deleted successfully"}
