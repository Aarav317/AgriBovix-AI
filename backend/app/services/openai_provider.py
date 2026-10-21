"""Server-only OpenAI Responses integration. No simulated predictions or secret output."""
import json
import os
import httpx
from app.config import openai_model
from app.services.vision_policy import CHAT_SCHEMA, failure, analyze_with, assistant_with

OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
MAX_RESPONSE_BYTES = 150_000


async def generate(workspace, instructions, inputs, schema, schema_name):
    key = os.getenv('OPENAI_API_KEY', '').strip()
    if not key:
        raise failure(503, 'model_unavailable', 'OpenAI is selected but its API key is missing. Add OPENAI_API_KEY to the backend .env file and restart the backend. No prediction has been made.')
    model = openai_model(workspace)
    if not model:
        raise failure(503, 'model_unavailable', 'Set OPENAI_MODEL in the backend .env file and restart the backend.')
    payload = {
        'model': model,
        'store': False,
        'instructions': instructions,
        'input': inputs,
        'max_output_tokens': 4096,
        'text': {'format': {'type': 'json_schema', 'name': schema_name,
                            'strict': True, 'schema': schema}},
    }
    if model.startswith(('gpt-5', 'gpt-6')):
        payload['reasoning'] = {'effort': 'low'}
    try:
        async with httpx.AsyncClient(timeout=60, follow_redirects=False, trust_env=False) as client:
            async with client.stream('POST', OPENAI_RESPONSES_URL,
                                     headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
                                     json=payload) as response:
                content = bytearray()
                async for chunk in response.aiter_bytes():
                    content.extend(chunk)
                    if len(content) > MAX_RESPONSE_BYTES:
                        raise failure(502, 'invalid_model_result', 'OpenAI returned an oversized response. No result was saved.')
                data = json.loads(content)
                if not isinstance(data, dict):
                    raise ValueError('Expected an object')
                if response.status_code == 401:
                    raise failure(502, 'openai_auth_error', 'OpenAI rejected the API key. Check the key in the backend .env file and restart the backend.')
                if response.status_code == 403:
                    raise failure(502, 'openai_access_error', 'This OpenAI project does not have access to the requested model or API. Check project permissions.')
                if response.status_code == 429:
                    error = data.get('error') or {}
                    if isinstance(error, dict) and (error.get('code') == 'insufficient_quota' or error.get('type') == 'insufficient_quota'):
                        raise failure(503, 'openai_quota_exceeded', 'OpenAI API credits or quota are unavailable. Check API billing; a ChatGPT subscription does not include API credits.')
                    raise failure(429, 'openai_rate_limited', 'OpenAI is rate limiting requests. Wait a moment and try again.')
                if response.status_code == 404:
                    raise failure(502, 'openai_model_unavailable', 'The configured OpenAI model is unavailable to this project. Check OPENAI_MODEL and model access.')
                if response.is_error:
                    raise failure(502, 'openai_request_error', 'OpenAI could not complete this request. Check the configured model and backend integration. No result was saved.')
    except httpx.TimeoutException:
        raise failure(504, 'model_timeout', 'OpenAI took too long. Please try again; no result was saved.')
    except httpx.HTTPError:
        raise failure(502, 'model_error', 'The backend could not reach OpenAI. Check the server internet connection.')
    except (ValueError, TypeError):
        raise failure(502, 'invalid_model_result', 'OpenAI did not return valid response data. No result was saved.')

    if data.get('status') != 'completed':
        raise failure(502, 'openai_incomplete', 'OpenAI did not finish the response. Try again with a clearer image or shorter question. No result was saved.')
    try:
        texts = []
        for item in data.get('output', []):
            if item.get('type') != 'message':
                continue
            for part in item.get('content', []):
                if part.get('type') == 'refusal':
                    raise failure(422, 'model_refused', 'OpenAI could not assess this request. Try an appropriate farm image or consult a qualified expert.')
                if part.get('type') == 'output_text':
                    texts.append(part['text'])
        result = json.loads(''.join(texts))
        if not isinstance(result, dict):
            raise ValueError('Expected a structured object')
        return result, str(data.get('model') or model)
    except (ValueError, KeyError, TypeError, AttributeError):
        raise failure(502, 'invalid_model_result', 'OpenAI returned an unreadable result. No result was saved.')


async def analyze(workspace, image, task='general'):
    return await analyze_with(workspace, image, task, generate, 'OpenAI')


async def assistant(workspace, messages):
    return await assistant_with(workspace, messages, generate, 'OpenAI')
