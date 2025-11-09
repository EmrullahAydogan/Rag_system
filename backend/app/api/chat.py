"""
Chat API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import time

from app.core.database import get_db
from app.schemas import (
    ChatRequest,
    ConversationResponse,
    ConversationCreate,
    ConversationListResponse,
    MessageResponse,
    MessageFeedbackCreate,
    MessageFeedbackResponse,
)
from app.models import Conversation, Message, MessageFeedback
from app.services.rag_service import RAGService
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/", response_model=MessageResponse)
def send_message(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Send a chat message and get RAG response"""

    start_time = time.time()

    # Get or create conversation
    conversation = None
    if request.conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == request.conversation_id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Create new conversation
        conversation = Conversation(
            title=request.message[:50] + "..." if len(request.message) > 50 else request.message
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Get conversation history
    history_messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.timestamp).all()

    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in history_messages
    ]

    # Save user message
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )
    db.add(user_message)
    db.commit()

    # Get RAG response
    rag_service = RAGService()
    try:
        answer, sources = rag_service.chat(
            query=request.message,
            conversation_history=conversation_history,
            llm_provider=request.llm_provider,
            model=request.model,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG service error: {str(e)}")

    # Save assistant message
    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=answer,
        sources=sources,
    )
    db.add(assistant_message)

    # Update conversation timestamp
    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assistant_message)

    # Log analytics
    response_time = time.time() - start_time
    AnalyticsService.log_event(
        db,
        event_type="chat_message",
        metadata={
            "conversation_id": conversation.id,
            "message_length": len(request.message),
            "sources_count": len(sources),
        },
        value=response_time
    )

    return assistant_message


@router.get("/conversations", response_model=List[ConversationListResponse])
def list_conversations(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List all conversations"""
    conversations = db.query(Conversation).order_by(
        Conversation.updated_at.desc()
    ).offset(skip).limit(limit).all()

    # Add message count
    result = []
    for conv in conversations:
        message_count = db.query(Message).filter(
            Message.conversation_id == conv.id
        ).count()

        result.append(
            ConversationListResponse(
                id=conv.id,
                title=conv.title,
                user_id=conv.user_id,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=message_count
            )
        )

    return result


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific conversation with all messages"""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conversation


@router.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """Delete a conversation"""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()

    return None


@router.post("/feedback", response_model=MessageFeedbackResponse)
def add_feedback(
    feedback: MessageFeedbackCreate,
    db: Session = Depends(get_db)
):
    """Add feedback to a message"""

    # Check if message exists
    message = db.query(Message).filter(Message.id == feedback.message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Check if feedback already exists
    existing = db.query(MessageFeedback).filter(
        MessageFeedback.message_id == feedback.message_id
    ).first()

    if existing:
        # Update existing feedback
        existing.rating = feedback.rating
        existing.comment = feedback.comment
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new feedback
        db_feedback = MessageFeedback(**feedback.dict())
        db.add(db_feedback)
        db.commit()
        db.refresh(db_feedback)
        return db_feedback


@router.get("/providers")
def get_llm_providers():
    """Get available LLM providers"""
    rag_service = RAGService()
    return rag_service.get_available_providers()


@router.post("/compare")
def compare_models(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Compare responses from multiple LLM providers
    Returns responses from OpenAI, Anthropic, and Google Gemini
    """

    # Get conversation history if conversation_id provided
    conversation_history = []
    if request.conversation_id:
        history_messages = db.query(Message).filter(
            Message.conversation_id == request.conversation_id
        ).order_by(Message.timestamp).all()

        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in history_messages
        ]

    rag_service = RAGService()

    # Get responses from all 3 providers
    providers = ["openai", "anthropic", "google"]
    models = {
        "openai": "gpt-3.5-turbo",
        "anthropic": "claude-3-sonnet-20240229",
        "google": "gemini-pro"
    }

    results = {}

    for provider in providers:
        try:
            start_time = time.time()
            answer, sources = rag_service.chat(
                query=request.message,
                conversation_history=conversation_history,
                llm_provider=provider,
                model=models[provider],
            )
            response_time = time.time() - start_time

            results[provider] = {
                "answer": answer,
                "sources": sources,
                "model": models[provider],
                "response_time": round(response_time, 2),
                "success": True,
                "error": None
            }
        except Exception as e:
            results[provider] = {
                "answer": None,
                "sources": [],
                "model": models[provider],
                "response_time": 0,
                "success": False,
                "error": str(e)
            }

    return {
        "query": request.message,
        "results": results
    }
