"""
Documents API Endpoints
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from pathlib import Path
from datetime import datetime

from app.core.database import get_db
from app.schemas import DocumentResponse, DocumentUpdate
from app.models import Document, DocumentStatus
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import get_vector_store

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process a document"""

    # Validate file
    file_size = 0
    file_content = await file.read()
    file_size = len(file_content)
    await file.seek(0)

    is_valid, error_msg = DocumentProcessor.validate_file(file.filename, file_size)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # Create file path
    upload_dir = "data/documents"
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = Path(file.filename).suffix.lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create database record
    db_document = Document(
        filename=file.filename,
        file_type=file_ext,
        file_size=file_size,
        file_path=file_path,
        status=DocumentStatus.PENDING
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    # Process document asynchronously (in background)
    try:
        # Update status to processing
        db_document.status = DocumentStatus.PROCESSING
        db.commit()

        # Extract text
        text_content = DocumentProcessor.extract_text(file_path, file_ext)

        # Add to vector store
        vector_store = get_vector_store()
        chunks_count = vector_store.add_document(
            content=text_content,
            metadata={
                "document_id": db_document.id,
                "filename": file.filename,
                "file_type": file_ext,
            }
        )

        # Update document status
        db_document.status = DocumentStatus.COMPLETED
        db_document.chunks_count = chunks_count
        db_document.processed_date = datetime.utcnow()
        db.commit()
        db.refresh(db_document)

    except Exception as e:
        db_document.status = DocumentStatus.FAILED
        db_document.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

    return db_document


@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all documents"""
    documents = db.query(Document).order_by(Document.upload_date.desc()).offset(skip).limit(limit).all()
    return documents


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Delete a document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from vector store
    vector_store = get_vector_store()
    vector_store.delete_by_document_id(document_id)

    # Delete file
    if os.path.exists(document.file_path):
        os.remove(document.file_path)

    # Delete from database
    db.delete(document)
    db.commit()

    return None


@router.get("/stats/overview")
def get_document_stats(db: Session = Depends(get_db)):
    """Get document statistics"""
    total_docs = db.query(Document).count()
    completed_docs = db.query(Document).filter(Document.status == DocumentStatus.COMPLETED).count()
    failed_docs = db.query(Document).filter(Document.status == DocumentStatus.FAILED).count()

    vector_store = get_vector_store()
    vector_stats = vector_store.get_collection_stats()

    return {
        "total_documents": total_docs,
        "completed_documents": completed_docs,
        "failed_documents": failed_docs,
        **vector_stats
    }
