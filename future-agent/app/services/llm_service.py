from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from app.config.settings import settings


class LLMService(ABC):
    @abstractmethod
    def generate(self, prompt: str, system_prompt: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> str:
        raise NotImplementedError


class MockLLMService(LLMService):
    def generate(self, prompt: str, system_prompt: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> str:
        context_info = ''
        if context:
            context_info = '\n'.join(f'{key}: {value}' for key, value in context.items())
        return (
            f"System: {system_prompt or 'CloudSync AI'}\n"
            f"Prompt: {prompt}\n"
            f"Context:\n{context_info}"
        )


class LLMServiceFactory:
    @staticmethod
    def create() -> LLMService:
        provider = (settings.llm_provider or 'mistral').lower()
        if provider in {'mock', 'demo'}:
            return MockLLMService()
        return MockLLMService()
