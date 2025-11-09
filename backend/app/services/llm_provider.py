"""
Multi-LLM Provider Service
Supports OpenAI, Anthropic Claude, and Google Gemini
"""
from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings


class LLMProvider:
    """Factory class for creating LLM instances"""

    @staticmethod
    def get_llm(
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        **kwargs
    ):
        """
        Get LLM instance based on provider

        Args:
            provider: 'openai', 'anthropic', or 'google'
            model: Model name (if None, uses default)
            temperature: Temperature for generation
            **kwargs: Additional provider-specific parameters

        Returns:
            LangChain LLM instance
        """
        provider = provider or settings.DEFAULT_LLM_PROVIDER

        if provider == "openai":
            return LLMProvider._get_openai(model, temperature, **kwargs)
        elif provider == "anthropic":
            return LLMProvider._get_anthropic(model, temperature, **kwargs)
        elif provider == "google":
            return LLMProvider._get_google(model, temperature, **kwargs)
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

    @staticmethod
    def _get_openai(model: Optional[str], temperature: float, **kwargs):
        """Get OpenAI LLM"""
        model = model or "gpt-3.5-turbo"
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            openai_api_key=settings.OPENAI_API_KEY,
            **kwargs
        )

    @staticmethod
    def _get_anthropic(model: Optional[str], temperature: float, **kwargs):
        """Get Anthropic Claude LLM"""
        model = model or "claude-3-sonnet-20240229"
        return ChatAnthropic(
            model=model,
            temperature=temperature,
            anthropic_api_key=settings.ANTHROPIC_API_KEY,
            **kwargs
        )

    @staticmethod
    def _get_google(model: Optional[str], temperature: float, **kwargs):
        """Get Google Gemini LLM"""
        model = model or "gemini-pro"
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            google_api_key=settings.GOOGLE_API_KEY,
            **kwargs
        )

    @staticmethod
    def list_available_providers():
        """List available providers based on API keys"""
        available = []

        if settings.OPENAI_API_KEY:
            available.append({
                "provider": "openai",
                "models": ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"]
            })

        if settings.ANTHROPIC_API_KEY:
            available.append({
                "provider": "anthropic",
                "models": [
                    "claude-3-opus-20240229",
                    "claude-3-sonnet-20240229",
                    "claude-3-haiku-20240307"
                ]
            })

        if settings.GOOGLE_API_KEY:
            available.append({
                "provider": "google",
                "models": ["gemini-pro", "gemini-pro-vision"]
            })

        return available
