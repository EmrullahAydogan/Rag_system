"""
Vector Store Service using ChromaDB
"""
import os
from typing import List, Dict, Any, Optional
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document as LangchainDocument
from app.core.config import settings


class VectorStoreService:
    """Service for managing vector store operations"""

    def __init__(self):
        self.embedding_model = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={'device': 'cpu'}
        )

        # Ensure persist directory exists
        os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)

        self.vectorstore = Chroma(
            persist_directory=settings.CHROMA_PERSIST_DIRECTORY,
            embedding_function=self.embedding_model,
            collection_name="techstore_documents"
        )

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def add_document(
        self,
        content: str,
        metadata: Dict[str, Any]
    ) -> int:
        """
        Add a document to the vector store

        Args:
            content: Document text content
            metadata: Document metadata (must include 'document_id')

        Returns:
            Number of chunks created
        """
        # Split document into chunks
        chunks = self.text_splitter.split_text(content)

        # Create LangChain documents with metadata
        documents = [
            LangchainDocument(
                page_content=chunk,
                metadata={
                    **metadata,
                    "chunk_index": i,
                    "total_chunks": len(chunks)
                }
            )
            for i, chunk in enumerate(chunks)
        ]

        # Add to vector store
        self.vectorstore.add_documents(documents)
        self.vectorstore.persist()

        return len(chunks)

    def search(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant documents

        Args:
            query: Search query
            k: Number of results to return
            filter: Metadata filter

        Returns:
            List of relevant documents with scores
        """
        results = self.vectorstore.similarity_search_with_score(
            query=query,
            k=k,
            filter=filter
        )

        return [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score)
            }
            for doc, score in results
        ]

    def delete_by_document_id(self, document_id: int):
        """Delete all chunks of a document"""
        # ChromaDB delete by metadata filter
        self.vectorstore.delete(
            where={"document_id": document_id}
        )
        self.vectorstore.persist()

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store"""
        collection = self.vectorstore._collection
        count = collection.count()

        return {
            "total_chunks": count,
            "embedding_model": settings.EMBEDDING_MODEL,
            "chunk_size": settings.CHUNK_SIZE,
            "chunk_overlap": settings.CHUNK_OVERLAP
        }


# Singleton instance
_vector_store = None


def get_vector_store() -> VectorStoreService:
    """Get or create vector store singleton"""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStoreService()
    return _vector_store
