from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    file_path = Column(String(500), nullable=False)

    status = Column(
        Enum(DocumentStatus),
        default=DocumentStatus.PENDING,
        nullable=False
    )

    chunks_count = Column(Integer, default=0)
    metadata = Column(JSON, default={})

    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    processed_date = Column(DateTime(timezone=True), nullable=True)

    error_message = Column(Text, nullable=True)

    # Import here to avoid circular imports
    from app.models.tag import document_tags
    tags = relationship("Tag", secondary=document_tags, back_populates="documents")

    def __repr__(self):
        return f"<Document {self.filename}>"
