"""Server-only Gemini image/chat integration, using a key header rather than URL secrets."""
import asyncio
import json
import os
import re

import httpx

from app.config import gemini_model
from app.services.vision_policy import failure, analyze_with, assistant_with

API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models'
MAX_RESPONSE_BYTES = 150_000
REQUEST_DEADLINE_SECONDS = 120


def to_contents(inputs):
    """Translate the internal text/image turns into Google's Content/Part format."""
    contents = []
    for message in inputs:
        content = message['content']
        if isinstance(content, str):
            parts = [{'text': content}]
        else:
            parts = []
            for part in content:
                if part['type'] == 'input_text':
                    parts.append({'text': part['text']})
                elif part['type'] == 'input_image':
                    prefix, separator, image = part['image_url'].partition(';base64,')
                    if prefix != 'data:image/jpeg' or not separator or not image:
                        raise ValueError('Only validated inline JPEG input is supported')
                    parts.append({'inlineData': {'mimeType': 'image/jpeg', 'data': image}})
                else:
                    raise ValueError('Unsupported content part')
        contents.append({'role': 'model' if message['role'] == 'assistant' else 'user', 'parts': parts})
    return contents


def provider_error(status, data):
    error = data.get('error') or {}
    reasons = {detail.get('reason', '') for detail in error.get('details', []) if isinstance(detail, dict)} if isinstance(error, dict) else set()
    if status == 401 or reasons.intersection({'API_KEY_INVALID', 'API_KEY_EXPIRED'}):
        return failure(502, 'gemini_auth_error', 'Google rejected the Gemini API key. Check GEMINI_API_KEY in the backend .env file and restart the backend.')
    if status == 403:
        return failure(502, 'gemini_access_error', 'This Google project or API key cannot access Gemini. Check Gemini API permissions, key restrictions and regional eligibility in AI Studio.')
    if status == 429:
        return failure(429, 'gemini_quota_exceeded', 'Gemini project quota or rate limit was reached. Wait for the applicable reset and check the project limits in Google AI Studio. There is no automatic paid-provider fallback.')
    if status == 404:
        return failure(502, 'gemini_model_unavailable', 'The selected Gemini model is unavailable to this project. Check GEMINI_MODEL against the models accessible in Google AI Studio.')
    if status == 400:
        return failure(502, 'gemini_request_error', 'Google rejected the Gemini request. Check model support, API key settings and project eligibility. No report was saved.')
    return failure(502, 'model_error', 'Gemini could not complete the request. Please try again later; no result was saved.')


async def generate(workspace, instructions, inputs, schema, schema_name):
    key = os.getenv('GEMINI_API_KEY', '').strip()
    if not key:
        raise failure(503, 'model_unavailable', 'Gemini is selected but its API key is missing. Set GEMINI_API_KEY in the root .env file and restart the backend. No prediction has been made.')
    model = gemini_model(workspace)
    if not re.fullmatch(r'[A-Za-z0-9._-]{1,100}', model):
        raise failure(503, 'model_unavailable', 'Set GEMINI_MODEL to a supported Gemini model ID, then restart the backend.')
    try:
        payload = {
            'systemInstruction': {'parts': [{'text': instructions}]},
            'contents': to_contents(inputs),
            'generationConfig': {
                'maxOutputTokens': 4096,
                # TextResponseFormat uses Google's enum, unlike inlineData's MIME string.
                'responseFormat': {'text': {'mimeType': 'APPLICATION_JSON', 'schema': schema}},
            },
        }
        # This model defaults to medium thinking. LOW is its supported latency control.
        # Do not send model-specific thinking fields to other configured Gemini models.
        if model == 'gemini-3.8-flash' or model.startswith('gemini-3.8-flash-'):
            payload['generationConfig']['thinkingConfig'] = {'thinkingLevel': 'LOW'}
        timeout = httpx.Timeout(110, connect=10, write=20, pool=5)
        async with asyncio.timeout(REQUEST_DEADLINE_SECONDS), httpx.AsyncClient(timeout=timeout, follow_redirects=False, trust_env=False) as client:
            async with client.stream('POST', f'{API_ROOT}/{model}:generateContent',
                                     headers={'x-goog-api-key': key, 'Content-Type': 'application/json'},
                                     json=payload) as response:
                content = bytearray()
                async for chunk in response.aiter_bytes():
                    content.extend(chunk)
                    if len(content) > MAX_RESPONSE_BYTES:
                        raise failure(502, 'invalid_model_result', 'Gemini returned an oversized response. No report was saved.')
                data = json.loads(content)
                if not isinstance(data, dict):
                    raise ValueError('Expected an object')
                if response.is_error:
                    raise provider_error(response.status_code, data)
    except httpx.ConnectTimeout:
        raise failure(504, 'model_timeout', 'The backend could not connect to Gemini in time. Check the server internet connection and try again. No report was saved.')
    except (httpx.TimeoutException, TimeoutError):
        raise failure(504, 'model_timeout', 'Gemini did not finish responding within the allowed time. Its service or network may be slow. Please try again later; no report was saved.')
    except httpx.HTTPError:
        raise failure(502, 'model_error', 'The backend could not reach Gemini. Check the server internet connection.')
    except (ValueError, TypeError, AttributeError):
        raise failure(502, 'invalid_model_result', 'Gemini did not return valid response data. No report was saved.')

    try:
        if data.get('promptFeedback', {}).get('blockReason'):
            raise failure(422, 'model_refused', 'Gemini could not assess this request. Try an appropriate farm photo or consult an expert.')
        candidates = data.get('candidates') or []
        if not candidates:
            raise ValueError('No candidate')
        candidate = candidates[0]
        finish = candidate.get('finishReason')
        if finish in {'SAFETY', 'RECITATION', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII'}:
            raise failure(422, 'model_refused', 'Gemini could not assess this request. No report was saved.')
        if finish != 'STOP':
            raise failure(502, 'gemini_incomplete', 'Gemini did not finish a usable result. Try a clearer image or shorter question. No report was saved.')
        text = ''.join(part.get('text', '') for part in candidate.get('content', {}).get('parts', []) if not part.get('thought'))
        result = json.loads(text)
        if not isinstance(result, dict):
            raise ValueError('Expected a structured object')
        return result, str(data.get('modelVersion') or model)
    except (ValueError, KeyError, TypeError, AttributeError):
        raise failure(502, 'invalid_model_result', 'Gemini returned an unreadable result. No report was saved.')


async def analyze(workspace, image, task='general'):
    return await analyze_with(workspace, image, task, generate, 'Gemini')


async def assistant(workspace, messages):
    return await assistant_with(workspace, messages, generate, 'Gemini')
