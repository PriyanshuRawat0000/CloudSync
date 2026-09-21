import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.config.settings import settings
from app.routes.chat import router as chat_router
from app.routes.health import router as health_router

load_dotenv()

app = FastAPI(title='CloudSync Agentic AI', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(health_router, prefix='/api')
app.include_router(chat_router, prefix='/api')

@app.get('/')
def root():
    return {'service': 'CloudSync Agentic AI', 'status': 'ok'}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('app.main:app', host='0.0.0.0', port=int(settings.port), reload=True)
