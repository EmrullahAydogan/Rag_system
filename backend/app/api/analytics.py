"""
Analytics API Endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas import AnalyticsSummary, TimeSeriesData, TopicData
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    """Get overall analytics summary"""
    return AnalyticsService.get_summary(db)


@router.get("/time-series", response_model=List[TimeSeriesData])
def get_time_series(
    days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """Get time series data for conversations"""
    return AnalyticsService.get_time_series(db, days=days)


@router.get("/top-topics", response_model=List[TopicData])
def get_top_topics(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get top discussion topics"""
    return AnalyticsService.get_top_topics(db, limit=limit)


@router.get("/document-usage")
def get_document_usage(db: Session = Depends(get_db)):
    """Get document usage statistics"""
    return AnalyticsService.get_document_usage(db)
