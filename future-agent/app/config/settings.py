import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    port: int = int(os.getenv('PORT', 8000))
    core_server_url: str = os.getenv('CORE_SERVER_URL', 'http://localhost:5000')
    llm_provider: str = os.getenv('LLM_PROVIDER', 'mistral')
    llm_api_key: str = os.getenv('LLM_API_KEY', '')
    llm_model: str = os.getenv('LLM_MODEL', 'mistral-small-latest')
    llm_base_url: str = os.getenv('LLM_BASE_URL', '')
    ai_max_tokens: int = int(os.getenv('AI_MAX_TOKENS', 2000))
    ai_temperature: float = float(os.getenv('AI_TEMPERATURE', 0.2))
    ai_require_confirmation: bool = os.getenv('AI_REQUIRE_CONFIRMATION', 'true').lower() == 'true'


settings = Settings()
