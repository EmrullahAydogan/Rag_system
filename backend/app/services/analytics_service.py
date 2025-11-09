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
            AnalyticsEvent.event_metadata['topic'].astext.label('topic'),
            func.count(AnalyticsEvent.id).label('count')
        ).filter(
            AnalyticsEvent.event_type == "chat_message",
            AnalyticsEvent.event_metadata['topic'] != None
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
            event_metadata=metadata or {},
            value=value
        )
        db.add(event)
        db.commit()

    @staticmethod
    def get_response_times(db: Session, days: int = 7) -> List[Dict[str, Any]]:
        """Get response times over time"""
        start_date = datetime.utcnow() - timedelta(days=days)

        results = db.query(
            func.date(AnalyticsEvent.timestamp).label('date'),
            func.avg(AnalyticsEvent.value).label('avg_time'),
            func.min(AnalyticsEvent.value).label('min_time'),
            func.max(AnalyticsEvent.value).label('max_time')
        ).filter(
            AnalyticsEvent.event_type == "chat_message",
            AnalyticsEvent.timestamp >= start_date,
            AnalyticsEvent.value != None
        ).group_by(
            func.date(AnalyticsEvent.timestamp)
        ).order_by('date').all()

        return [
            {
                "date": str(result.date),
                "avg_response_time": round(float(result.avg_time), 2),
                "min_response_time": round(float(result.min_time), 2),
                "max_response_time": round(float(result.max_time), 2)
            }
            for result in results
        ]

    @staticmethod
    def get_model_performance(db: Session, days: int = 30) -> List[Dict[str, Any]]:
        """Get performance metrics for each LLM model"""
        start_date = datetime.utcnow() - timedelta(days=days)

        # Get usage count and average response time per model
        results = db.query(
            AnalyticsEvent.event_metadata['llm_provider'].astext.label('provider'),
            func.count(AnalyticsEvent.id).label('usage_count'),
            func.avg(AnalyticsEvent.value).label('avg_response_time')
        ).filter(
            AnalyticsEvent.event_type == "chat_message",
            AnalyticsEvent.timestamp >= start_date,
            AnalyticsEvent.event_metadata['llm_provider'] != None
        ).group_by('provider').all()

        return [
            {
                "provider": result.provider or "unknown",
                "usage_count": result.usage_count,
                "avg_response_time": round(float(result.avg_response_time), 2) if result.avg_response_time else 0
            }
            for result in results
        ]

    @staticmethod
    def get_user_engagement(db: Session, days: int = 30) -> Dict[str, Any]:
        """Get user engagement metrics"""
        start_date = datetime.utcnow() - timedelta(days=days)

        # Total conversations in period
        conversations_in_period = db.query(Conversation).filter(
            Conversation.created_at >= start_date
        ).count()

        # Total messages in period
        messages_in_period = db.query(Message).filter(
            Message.timestamp >= start_date
        ).count()

        # Active days (days with at least one message)
        active_days = db.query(
            func.count(func.distinct(func.date(Message.timestamp)))
        ).filter(
            Message.timestamp >= start_date
        ).scalar()

        # Average conversations per day
        avg_conversations_per_day = conversations_in_period / days if days > 0 else 0

        return {
            "period_days": days,
            "total_conversations": conversations_in_period,
            "total_messages": messages_in_period,
            "active_days": active_days or 0,
            "avg_conversations_per_day": round(avg_conversations_per_day, 2),
            "avg_messages_per_conversation": round(messages_in_period / conversations_in_period, 2) if conversations_in_period > 0 else 0
        }

    @staticmethod
    def get_peak_hours(db: Session, days: int = 7) -> List[Dict[str, Any]]:
        """Get peak usage hours"""
        start_date = datetime.utcnow() - timedelta(days=days)

        results = db.query(
            func.extract('hour', Message.timestamp).label('hour'),
            func.count(Message.id).label('count')
        ).filter(
            Message.timestamp >= start_date
        ).group_by('hour').order_by('hour').all()

        return [
            {
                "hour": int(result.hour),
                "message_count": result.count
            }
            for result in results
        ]

    @staticmethod
    def get_conversation_metrics(db: Session, days: int = 30) -> Dict[str, Any]:
        """Get conversation length and quality metrics"""
        start_date = datetime.utcnow() - timedelta(days=days)

        # Get conversations in period with message counts
        conversations = db.query(Conversation).filter(
            Conversation.created_at >= start_date
        ).all()

        if not conversations:
            return {
                "avg_conversation_length": 0,
                "median_conversation_length": 0,
                "shortest_conversation": 0,
                "longest_conversation": 0,
                "total_conversations": 0
            }

        message_counts = []
        for conv in conversations:
            count = db.query(Message).filter(
                Message.conversation_id == conv.id
            ).count()
            message_counts.append(count)

        message_counts.sort()

        return {
            "avg_conversation_length": round(sum(message_counts) / len(message_counts), 2),
            "median_conversation_length": message_counts[len(message_counts) // 2],
            "shortest_conversation": min(message_counts),
            "longest_conversation": max(message_counts),
            "total_conversations": len(conversations)
        }
