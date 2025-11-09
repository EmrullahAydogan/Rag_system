from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from app.models.document import DocumentStatus


class DocumentBase(BaseModel):
    filename: str
    file_type: str


class DocumentCreate(DocumentBase):
    pass


class DocumentResponse(DocumentBase):
    id: int
    file_size: int
    status: DocumentStatus
    chunks_count: int
    doc_metadata: Dict[str, Any]
    upload_date: datetime
    processed_date: Optional[datetime]
    error_message: Optional[str]

    class Config:
        from_attributes = True


class DocumentUpdate(BaseModel):
    status: Optional[DocumentStatus] = None
    chunks_count: Optional[int] = None
    processed_date: Optional[datetime] = None
    error_message: Optional[str] = None
