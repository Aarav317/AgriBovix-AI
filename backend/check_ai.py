"""Check configuration without printing secrets; --live makes one provider API request."""
import argparse
import asyncio
import sys

from fastapi import HTTPException
from app.config import provider_configured, provider_name, openai_model, gemini_model
from app.services.vision_policy import CHAT_SCHEMA


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--live', action='store_true', help='Make one small provider text request; consumes quota and may incur API charges')
    args = parser.parse_args()
    print('AI provider:', provider_name('agrivision'))
    provider = provider_name('agrivision')
    provider_label = 'OpenAI' if provider == 'openai' else 'Gemini'
    print('Model:', gemini_model('agrivision') if provider == 'gemini' else openai_model('agrivision') if provider == 'openai' else '(custom HTTP adapter)')
    print('API configuration:', 'present (not yet validated)' if provider_configured('agrivision') else 'missing')
    if not args.live:
        print('No API request was made. Add --live to test connectivity; free quotas/paid usage depend on your provider project.')
        return 0
    if provider not in {'openai', 'gemini'}:
        print('Set AI_PROVIDER=gemini or AI_PROVIDER=openai in the root .env file before this check.')
        return 1
    if provider == 'gemini':
        from app.services.gemini_provider import generate
    else:
        from app.services.openai_provider import generate
    try:
        await generate('agrivision', 'Return a short connection acknowledgement in the requested JSON format.',
                       [{'role': 'user', 'content': 'Reply with a short connection acknowledgement.'}],
                       CHAT_SCHEMA, 'connection_check')
        print(provider_label + ' connection: OK. This verifies one text request; image quality and diagnostic validity are not established.')
        return 0
    except HTTPException as error:
        print(provider_label + ' connection:', error.detail['code'])
        print(error.detail['message'])
        return 1


if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
