from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config.settings import settings
from app.services.llm_service import LLMServiceFactory
from app.tools.registry import ToolRegistry

router = APIRouter()
llm_service = LLMServiceFactory.create()


class ChatRequest(BaseModel):
    message: str
    token: str | None = None
    userRole: str | None = None


SYSTEM_PROMPT = """
You are CloudSync AI.
You are an intelligent assistant for the CloudSync multi-cloud orchestration platform.
Your job is to help users understand the current state of CloudSync and perform authorized operations through approved tools.
You can inspect provider health, metrics, routing, workloads, decisions, monitoring history, logs, and available services.
Never invent system state.
When information is required, use the appropriate CloudSync tool.
Do not directly access MongoDB or mock cloud administrative endpoints.
Do not make arbitrary HTTP requests.
Use only approved tools.
Explain decisions using actual CloudSync data.
Respect the user's role and permissions.
Do not perform state-changing actions without required confirmation.
The deterministic CloudSync Decision Engine remains responsible for mathematical provider selection.
You may explain the decision, analyze alternatives, and recommend actions, but you must not fabricate or override CloudSync state.
"""


@router.get('/tools')
def get_tools():
    return {
        'tools': [
            'get_provider_metrics',
            'get_provider_health',
            'get_all_providers',
            'compare_providers',
            'get_current_routing',
            'get_recent_errors',
            'get_recent_logs',
            'get_decision_history',
            'get_workload_details',
            'get_monitoring_history',
            'get_system_status',
            'get_available_services',
            'request_provider_switch',
            'request_manual_routing',
            'request_automatic_routing',
        ]
    }


@router.post('/chat')
async def chat(request: ChatRequest):
    try:
        tools = ToolRegistry(request.token)
        message = request.message or ''
        tools_used: list[str] = []

        if 'provider' in message.lower() or 'health' in message.lower() or 'metrics' in message.lower() or 'compare' in message.lower():
            provider_data = await tools.get_all_providers()
            tools_used.append('get_all_providers')
        else:
            provider_data = {'providers': []}

        if 'routing' in message.lower() or 'switch' in message.lower() or 'workload' in message.lower() or 'selected' in message.lower():
            routing_data = await tools.get_current_routing()
            tools_used.append('get_current_routing')
        else:
            routing_data = {'routing': {}}

        if 'decision' in message.lower() or 'why' in message.lower() or 'selected' in message.lower():
            decision_data = await tools.get_decision_history()
            tools_used.append('get_decision_history')
        else:
            decision_data = {'decisions': []}

        llm_prompt = f"Question: {message}\nProvider data: {provider_data}\nRouting: {routing_data}\nDecisions: {decision_data}"
        response_text = llm_service.generate(llm_prompt, SYSTEM_PROMPT, {'userRole': request.userRole or 'CLIENT'})

        return {
            'response': response_text,
            'toolsUsed': list(dict.fromkeys(tools_used)),
            'actionRequired': False,
            'confirmationRequired': False,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
