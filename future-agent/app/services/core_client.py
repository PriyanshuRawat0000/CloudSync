import httpx
from app.config.settings import settings


class CoreClient:
    def __init__(self, base_url: str | None = None):
        self.base_url = (base_url or settings.core_server_url).rstrip('/')

    async def get(self, path: str, token: str | None = None):
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(f'{self.base_url}{path}', headers=headers)
            response.raise_for_status()
            return response.json()

    async def post(self, path: str, payload: dict | None = None, token: str | None = None):
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(f'{self.base_url}{path}', json=payload or {}, headers=headers)
            response.raise_for_status()
            return response.json()

    async def put(self, path: str, payload: dict | None = None, token: str | None = None):
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.put(f'{self.base_url}{path}', json=payload or {}, headers=headers)
            response.raise_for_status()
            return response.json()
