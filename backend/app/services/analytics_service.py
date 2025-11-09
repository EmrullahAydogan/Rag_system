"""
Analytics Service
"""
from typing import Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models import Conversation, Message, Document, AnalyticsEvent, MessageFeedback


class AnalyticsService:
    """Service for analytics and statistics"""

    @staticmethod
    def get_summary(db: Session) -> Dict[str, Any]:
        """Get overall analytics summary"""

        # Total counts
        total_conversations = db.query(Conversation).count()
        total_messages = db.query(Message).count()
        total_documents = db.query(Document).count()
        total_feedback = db.query(MessageFeedback).count()

        # Average messages per conversation
        avg_messages = total_messages / total_conversations if total_conversations > 0 else 0

        # Average rating
        avg_rating_result = db.query(func.avg(MessageFeedback.rating)).scalar()
        avg_rating = float(avg_rating_result) if avg_rating_result else None

        # Average response time (from analytics events)
        avg_response_time_result = db.query(func.avg(AnalyticsEvent.value)).filter(
            AnalyticsEvent.event_type == "response_time"
        ).scalar()
        avg_response_time = float(avg_response_time_result) if avg_response_time_result else None

        return {
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "total_documents": total_documents,
            "avg_messages_per_conversation": round(avg_messages, 2),
            "avg_response_time": round(avg_response_time, 2) if avg_response_time else None,
            "total_feedback": total_feedback,
            "avg_rating": round(avg_rating, 2) if avg_rating else None,
        }

    @staticmethod
    def get_time_series(
        db: Session,
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """Get time series data for conversations"""
        start_date = datetime.utcnow() - timedelta(days=days)

        results = db.query(
            func.date(Conversation.created_at).label('date'),
            func.count(Conversation.id).label('count')
        ).filter(
            Conversation.created_at >= start_date
        ).group_by(
            func.date(Conversation.created_at)
        ).order_by('date').all()

        return [
            {
                "date": str(result.date),
                "count": result.count
            }
            for result in results
        ]

    @staticmethod
    def get_top_topics(
        db: Session,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top topics from analytics events"""
        results = db.query(
            AnalyticsEvent.metadata['topic'].astext.label('topic'),
            func.count(AnalyticsEvent.id).label('count')
        ).filter(
            AnalyticsEvent.event_type == "chat_message",
            AnalyticsEvent.metadata['topic'] != None
        ).group_by(
            'topic'
        ).order_by(
            desc('count')
        ).limit(limit).all()

        return [
            {
                "topic": result.topic,
                "count": result.count
            }
            for result in results
        ]

    @staticmethod
    def get_document_usage(db: Session) -> List[Dict[str, Any]]:
        """Get document usage statistics"""
        results = db.query(
            Document.filename,
            Document.id,
            Document.chunks_count,
            Document.upload_date
        ).order_by(
            desc(Document.upload_date)
        ).limit(10).all()

        return [
            {
                "document_id": result.id,
                "filename": result.filename,
                "chunks_count": result.chunks_count,
                "upload_date": result.upload_date.isoformat()
            }
            for result in results
        ]

    @staticmethod
    def log_event(
        db: Session,
        event_type: str,
        metadata: Dict[str, Any] = None,
        value: float = None
    ):
        """Log an analytics event"""
        event = AnalyticsEvent(
            event_type=event_type,
            metadata=metadata or {},
            value=value
        )
        db.add(event)
        db.commit()
