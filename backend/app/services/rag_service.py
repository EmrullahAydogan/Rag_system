"""
RAG Service - Main RAG Chain Implementation
"""
from typing import List, Dict, Any, Optional, Tuple
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.schema import HumanMessage, AIMessage
from app.services.llm_provider import LLMProvider
from app.services.vector_store import get_vector_store


class RAGService:
    """Service for RAG-based question answering"""

    # System prompt for the AI assistant
    SYSTEM_PROMPT = """You are a helpful customer support assistant for TechStore, an electronics e-commerce company.

Your role is to answer customer questions about:
- Product information and specifications
- Return and exchange policies
- Warranty terms and conditions
- Shipping and delivery information
- Frequently asked questions

Use the provided context to answer questions accurately. If you don't know the answer based on the context, politely say so and suggest contacting customer support.

Be friendly, professional, and concise. Always prioritize customer satisfaction.

Context:
{context}

Question: {question}

Answer:"""

    def __init__(self):
        self.vector_store = get_vector_store()

    def chat(
        self,
        query: str,
        conversation_history: List[Dict[str, str]] = None,
        llm_provider: Optional[str] = None,
        model: Optional[str] = None,
        document_ids: Optional[List[int]] = None,
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Process a chat query using RAG

        Args:
            query: User's question
            conversation_history: Previous messages [{"role": "user/assistant", "content": "..."}]
            llm_provider: LLM provider to use
            model: Model name to use
            document_ids: List of document IDs to filter search

        Returns:
            (answer, source_documents)
        """
        # Build filter for document IDs
        filter_dict = None
        if document_ids:
            filter_dict = {"document_id": {"$in": document_ids}}

        # Get relevant documents
        relevant_docs = self.vector_store.search(query, k=4, filter=filter_dict)

        # Build context from documents
        context = self._build_context(relevant_docs)

        # Get LLM
        llm = LLMProvider.get_llm(
            provider=llm_provider,
            model=model,
            temperature=0.7
        )

        # Build conversation messages
        messages = []

        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-6:]:  # Last 6 messages for context
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))

        # Build prompt with context
        prompt = self.SYSTEM_PROMPT.format(
            context=context,
            question=query
        )

        messages.append(HumanMessage(content=prompt))

        # Get response
        response = llm.invoke(messages)
        answer = response.content

        # Format sources
        sources = self._format_sources(relevant_docs)

        return answer, sources

    def _build_context(self, documents: List[Dict[str, Any]]) -> str:
        """Build context string from retrieved documents"""
        if not documents:
            return "No relevant information found in the knowledge base."

        context_parts = []
        for i, doc in enumerate(documents, 1):
            filename = doc["metadata"].get("filename", "Unknown")
            content = doc["content"]
            context_parts.append(f"[Source {i}: {filename}]\n{content}\n")

        return "\n".join(context_parts)

    def _format_sources(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format source documents for response"""
        sources = []
        seen_docs = set()

        for doc in documents:
            doc_id = doc["metadata"].get("document_id")
            if doc_id and doc_id not in seen_docs:
                seen_docs.add(doc_id)
                sources.append({
                    "document_id": doc_id,
                    "filename": doc["metadata"].get("filename", "Unknown"),
                    "chunk_index": doc["metadata"].get("chunk_index", 0),
                    "score": doc.get("score", 0.0)
                })

        return sources

    def get_available_providers(self) -> List[Dict[str, Any]]:
        """Get list of available LLM providers"""
        return LLMProvider.list_available_providers()
