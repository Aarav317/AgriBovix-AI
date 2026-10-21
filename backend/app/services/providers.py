import re
import httpx
from fastapi import HTTPException
from pydantic import ValidationError
from app.config import provider_config, provider_name
from app.models.schemas import Analysis, AssistantOutput

def unavailable(kind):
    return HTTPException(503, detail={'code':'model_unavailable','message':f'{kind} is not connected yet. No prediction has been made. You can still preview your image and read the care guide.'})

def headers(key):
    return {'Authorization':f'Bearer {key}'} if key else {}

async def request_provider(workspace, kind, **kwargs):
    if provider_name(workspace, kind) == 'gemini':
        from app.services import gemini_provider
        if kind == 'MODEL':
            return await gemini_provider.analyze(workspace, kwargs['files']['image'][1], kwargs.get('data', {}).get('task', 'general'))
        return await gemini_provider.assistant(workspace, kwargs['json']['messages'])
    if provider_name(workspace, kind) == 'openai':
        from app.services import openai_provider
        if kind == 'MODEL':
            return await openai_provider.analyze(workspace, kwargs['files']['image'][1], kwargs.get('data', {}).get('task', 'general'))
        return await openai_provider.assistant(workspace, kwargs['json']['messages'])
    url, key = provider_config(workspace, kind)
    if not url:
        raise unavailable('Image analysis' if kind == 'MODEL' else 'The AI assistant')
    try:
        async with httpx.AsyncClient(timeout=60, follow_redirects=False, trust_env=False) as client:
            response = await client.post(url, headers=headers(key), **kwargs)
            response.raise_for_status()
            if len(response.content) > 100_000:
                raise ValueError('Provider response too large')
            return response.json()
    except httpx.TimeoutException:
        raise HTTPException(504, detail={'code':'model_timeout','message':'The model took too long. Please try again.'})
    except (httpx.HTTPError, ValueError):
        raise HTTPException(502, detail={'code':'model_error','message':'The model service could not return a valid response. No result was saved.'})

def safety_check(text, workspace):
    # Defense in depth, not a substitute for provider validation and clinical review.
    if workspace == 'pashuvision' and re.search(r'\b(mg|mcg|ml|antibiotic|ivermectin|oxytetracycline|penicillin|inject|dosage)\b', text, re.I):
        raise ValueError('Image-based medication guidance is not accepted')

async def analyze(workspace, image, task='general'):
    raw = await request_provider(workspace, 'MODEL', files={'image':('image.jpg',image,'image/jpeg')}, data={'workspace':workspace,'task':task})
    try:
        result = Analysis.model_validate(raw)
        safety_check(result.model_dump_json(), workspace)
        if result.treatment_options and (not result.sources or workspace == 'pashuvision'):
            raise ValueError('Treatment needs validated sources; livestock treatment must come from a veterinarian')
        return result.model_dump(mode='json')
    except (ValidationError, ValueError):
        raise HTTPException(502, detail={'code':'invalid_model_result','message':'The model response did not meet the required evidence and safety format. No result was saved.'})

async def assistant(workspace, messages):
    raw = await request_provider(workspace, 'ASSISTANT', json={'workspace':workspace,'messages':messages,'policy':'Educational information only. Stay within this workspace. Cite trusted sources. No livestock medicine prescriptions or dosages. Never claim professional diagnosis.'})
    try:
        result = AssistantOutput.model_validate(raw)
        safety_check(result.message, workspace)
        return result.model_dump(mode='json')
    except (ValidationError, ValueError):
        raise HTTPException(502, detail={'code':'invalid_assistant_result','message':'The assistant response could not be verified. Please consult the care guide or a qualified expert.'})
