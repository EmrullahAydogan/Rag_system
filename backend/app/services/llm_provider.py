"""
Multi-LLM Provider Service
Supports OpenAI, Anthropic Claude, and Google Gemini
"""
from typing import Optional, List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings
import openai
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class LLMProvider:
    """Factory class for creating LLM instances"""

    # Cache for model lists (to avoid repeated API calls)
    _model_cache: Dict[str, Dict[str, Any]] = {}
    _cache_duration = timedelta(hours=1)  # Cache for 1 hour

    # Fallback model lists (used if API calls fail)
    FALLBACK_MODELS = {
        "openai": [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-4",
            "gpt-3.5-turbo"
        ],
        "anthropic": [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307"
        ],
        "google": [
            "models/gemini-flash-latest",
            "models/gemini-pro-latest",
            "models/gemini-1.5-flash-latest",
            "models/gemini-1.5-pro-latest"
        ]
    }

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
        model = model or "gpt-4o-mini"  # Default to fast, capable model
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            openai_api_key=settings.OPENAI_API_KEY,
            **kwargs
        )

    @staticmethod
    def _get_anthropic(model: Optional[str], temperature: float, **kwargs):
        """Get Anthropic Claude LLM"""
        model = model or "claude-3-5-sonnet-20241022"  # Default to latest Sonnet
        return ChatAnthropic(
            model=model,
            temperature=temperature,
            anthropic_api_key=settings.ANTHROPIC_API_KEY,
            **kwargs
        )

    @staticmethod
    def _get_google(model: Optional[str], temperature: float, **kwargs):
        """Get Google Gemini LLM"""
        model = model or "models/gemini-flash-latest"  # Default to fast Flash model
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            google_api_key=settings.GOOGLE_API_KEY,
            **kwargs
        )

    @staticmethod
    def _get_openai_models() -> List[str]:
        """
        Get available OpenAI models dynamically from API
        Falls back to FALLBACK_MODELS if API call fails
        """
        try:
            # Check cache first
            cache_key = "openai_models"
            if cache_key in LLMProvider._model_cache:
                cached_data = LLMProvider._model_cache[cache_key]
                if datetime.now() - cached_data["timestamp"] < LLMProvider._cache_duration:
                    logger.info("Returning cached OpenAI models")
                    return cached_data["models"]

            # Fetch from API
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            models_response = client.models.list()

            # Filter for chat models (gpt-* models)
            all_models = [model.id for model in models_response.data]
            chat_models = [
                model for model in all_models
                if model.startswith("gpt-") and not model.endswith("-instruct")
            ]

            # Sort models: gpt-4o first, then gpt-4, then gpt-3.5
            def model_sort_key(model: str):
                if "gpt-4o" in model:
                    return (0, model)
                elif "gpt-4" in model:
                    return (1, model)
                elif "gpt-3.5" in model:
                    return (2, model)
                else:
                    return (3, model)

            chat_models.sort(key=model_sort_key)

            # Limit to reasonable number of models (show only the main ones)
            # Filter out fine-tuned models and old versions
            filtered_models = [
                m for m in chat_models
                if not (":" in m or "ft-" in m)  # Skip fine-tuned models
            ]

            # If we found models, cache them
            if filtered_models:
                LLMProvider._model_cache[cache_key] = {
                    "models": filtered_models,
                    "timestamp": datetime.now()
                }
                logger.info(f"Fetched {len(filtered_models)} OpenAI models from API")
                return filtered_models
            else:
                # If no models found, use fallback
                logger.warning("No OpenAI models found from API, using fallback")
                return LLMProvider.FALLBACK_MODELS["openai"]

        except Exception as e:
            logger.error(f"Error fetching OpenAI models: {str(e)}")
            return LLMProvider.FALLBACK_MODELS["openai"]

    @staticmethod
    def _get_anthropic_models() -> List[str]:
        """
        Get available Anthropic models
        Anthropic doesn't have a public models API, so we use a curated list
        """
        return LLMProvider.FALLBACK_MODELS["anthropic"]

    @staticmethod
    def _get_google_models() -> List[str]:
        """
        Get available Google models
        Using curated list of stable models
        """
        return LLMProvider.FALLBACK_MODELS["google"]

    @staticmethod
    def list_available_providers():
        """
        List available providers based on API keys with dynamic model lists
        """
        available = []

        if settings.OPENAI_API_KEY:
            available.append({
                "provider": "openai",
                "models": LLMProvider._get_openai_models()
            })

        if settings.ANTHROPIC_API_KEY:
            available.append({
                "provider": "anthropic",
                "models": LLMProvider._get_anthropic_models()
            })

        if settings.GOOGLE_API_KEY:
            available.append({
                "provider": "google",
                "models": LLMProvider._get_google_models()
            })

        return available

    @staticmethod
    def clear_cache():
        """Clear the model cache (useful for testing or forcing refresh)"""
        LLMProvider._model_cache.clear()
        logger.info("Model cache cleared")
