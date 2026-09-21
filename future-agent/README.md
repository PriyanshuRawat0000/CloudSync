# CloudSync Agentic AI

This is the fully implemented Agentic AI service for CloudSync. It remains decoupled from the core business logic and communicates only via the CloudSync Core server APIs.

## Purpose

- Natural language interface to CloudSync state
- Controlled access to provider and workload information
- Safe, authorized action flow for state-changing requests
- LLM provider abstraction via environment variables

## Run locally

```bash
cd future-agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Config

Set values in `.env` based on `.env.example`.
