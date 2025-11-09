"""
Document Processing Service
Handles file uploads and text extraction
"""
import os
from typing import Tuple
from pathlib import Path
import pypdf
import docx
import markdown


class DocumentProcessor:
    """Service for processing different document types"""

    @staticmethod
    def extract_text(file_path: str, file_type: str) -> str:
        """
        Extract text from various file types

        Args:
            file_path: Path to the file
            file_type: File extension (.pdf, .txt, .docx, .md)

        Returns:
            Extracted text content
        """
        if file_type == ".pdf":
            return DocumentProcessor._extract_pdf(file_path)
        elif file_type == ".txt":
            return DocumentProcessor._extract_txt(file_path)
        elif file_type == ".docx":
            return DocumentProcessor._extract_docx(file_path)
        elif file_type == ".md":
            return DocumentProcessor._extract_markdown(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    @staticmethod
    def _extract_pdf(file_path: str) -> str:
        """Extract text from PDF"""
        text = []
        with open(file_path, 'rb') as file:
            pdf_reader = pypdf.PdfReader(file)
            for page in pdf_reader.pages:
                text.append(page.extract_text())
        return "\n\n".join(text)

    @staticmethod
    def _extract_txt(file_path: str) -> str:
        """Extract text from TXT"""
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()

    @staticmethod
    def _extract_docx(file_path: str) -> str:
        """Extract text from DOCX"""
        doc = docx.Document(file_path)
        return "\n\n".join([paragraph.text for paragraph in doc.paragraphs])

    @staticmethod
    def _extract_markdown(file_path: str) -> str:
        """Extract text from Markdown"""
        with open(file_path, 'r', encoding='utf-8') as file:
            md_content = file.read()
            # Convert to HTML then strip tags for plain text
            # Or keep markdown format
            return md_content

    @staticmethod
    def validate_file(filename: str, file_size: int) -> Tuple[bool, str]:
        """
        Validate uploaded file

        Returns:
            (is_valid, error_message)
        """
        from app.core.config import settings

        # Check file size
        if file_size > settings.MAX_FILE_SIZE:
            return False, f"File size exceeds maximum allowed ({settings.MAX_FILE_SIZE} bytes)"

        # Check file extension
        file_ext = Path(filename).suffix.lower()
        if file_ext not in settings.ALLOWED_FILE_TYPES:
            return False, f"File type {file_ext} not allowed. Allowed types: {settings.ALLOWED_FILE_TYPES}"

        return True, ""
