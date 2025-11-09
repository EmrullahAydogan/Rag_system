"""
Tags API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.models import Tag, Document


class TagCreate(BaseModel):
    name: str
    color: str = "#0ea5e9"


class TagResponse(BaseModel):
    id: int
    name: str
    color: str
    document_count: int = 0

    class Config:
        from_attributes = True


router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("/", response_model=List[TagResponse])
def list_tags(db: Session = Depends(get_db)):
    """List all tags with document counts"""
    tags = db.query(Tag).all()

    result = []
    for tag in tags:
        doc_count = len(tag.documents)
        result.append(
            TagResponse(
                id=tag.id,
                name=tag.name,
                color=tag.color,
                document_count=doc_count
            )
        )

    return result


@router.post("/", response_model=TagResponse)
def create_tag(tag: TagCreate, db: Session = Depends(get_db)):
    """Create a new tag"""
    # Check if tag already exists
    existing = db.query(Tag).filter(Tag.name == tag.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tag with this name already exists")

    db_tag = Tag(name=tag.name, color=tag.color)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)

    return TagResponse(
        id=db_tag.id,
        name=db_tag.name,
        color=db_tag.color,
        document_count=0
    )


@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    """Delete a tag"""
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    db.delete(tag)
    db.commit()
    return None


@router.post("/documents/{document_id}/tags/{tag_id}", status_code=201)
def add_tag_to_document(document_id: int, tag_id: int, db: Session = Depends(get_db)):
    """Add a tag to a document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    if tag not in document.tags:
        document.tags.append(tag)
        db.commit()

    return {"message": "Tag added to document"}


@router.delete("/documents/{document_id}/tags/{tag_id}", status_code=204)
def remove_tag_from_document(document_id: int, tag_id: int, db: Session = Depends(get_db)):
    """Remove a tag from a document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    if tag in document.tags:
        document.tags.remove(tag)
        db.commit()

    return None
