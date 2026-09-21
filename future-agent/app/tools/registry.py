from app.services.core_client import CoreClient


class ToolRegistry:
    def __init__(self, token: str | None = None):
        self.token = token
        self.core = CoreClient()

    async def get_provider_metrics(self, provider: str | None = None):
        path = f'/api/providers/{provider}/metrics' if provider else '/api/providers'
        result = await self.core.get(path, self.token)
        return result

    async def get_provider_health(self, provider: str | None = None):
        path = f'/api/providers/{provider}/health' if provider else '/api/providers'
        result = await self.core.get(path, self.token)
        return result

    async def get_all_providers(self):
        return await self.core.get('/api/providers', self.token)

    async def compare_providers(self):
        return await self.core.get('/api/providers', self.token)

    async def get_current_routing(self):
        return await self.core.get('/api/routing/current', self.token)

    async def get_recent_errors(self):
        return await self.core.get('/api/logs/errors', self.token)

    async def get_recent_logs(self):
        return await self.core.get('/api/logs', self.token)

    async def get_decision_history(self):
        return await self.core.get('/api/decisions/history', self.token)

    async def get_workload_details(self, workload_id: str | None = None):
        path = '/api/workloads'
        if workload_id:
            path = f'/api/workloads/{workload_id}'
        return await self.core.get(path, self.token)

    async def get_monitoring_history(self):
        return await self.core.get('/api/monitoring/history', self.token)

    async def get_system_status(self):
        return await self.core.get('/api/admin/dashboard', self.token)

    async def get_available_services(self):
        return await self.core.get('/api/providers', self.token)

    async def request_provider_switch(self, workload_id: str, provider: str):
        return await self.core.post('/api/routing/manual', {'workloadId': workload_id, 'provider': provider, 'mode': 'manual'}, self.token)

    async def request_manual_routing(self, workload_id: str, provider: str, service: str):
        return await self.core.post('/api/routing/manual', {'workloadId': workload_id, 'provider': provider, 'service': service, 'mode': 'manual'}, self.token)

    async def request_automatic_routing(self, workload_id: str):
        return await self.core.post('/api/routing/automatic', {'workloadId': workload_id}, self.token)
