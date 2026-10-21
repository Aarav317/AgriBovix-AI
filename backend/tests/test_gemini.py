import asyncio
import json

import httpx
import pytest

from app.config import gemini_model
from app.services import gemini_provider


@pytest.fixture
def gemini_enabled(client, monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'gemini')
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only-google-secret')
    monkeypatch.setenv('GEMINI_MODEL', 'gemini-3.8-flash')


@pytest.fixture
def findings():
    return {'supported_subject': True, 'subject': 'Test plant', 'possible_condition': None,
            'observations': ['Test-only visible observation.'], 'care_steps': ['Ask a local expert to review.'],
            'prevention': [], 'limitations': ['Synthetic test fixture, not a real analysis.'], 'urgency': 'expert_review'}


def body(findings, finish='STOP'):
    return {'modelVersion': 'gemini-3.8-flash', 'candidates': [
        {'finishReason': finish, 'content': {'parts': [{'text': json.dumps(findings)}]}}]}


def transport(monkeypatch, handler):
    real_client = httpx.AsyncClient
    monkeypatch.setattr(gemini_provider.httpx, 'AsyncClient',
                        lambda **kwargs: real_client(transport=httpx.MockTransport(handler), **kwargs))


def scan(client, image_bytes, workspace='agrivision'):
    return client.post(f'/api/{workspace}/analyze', files={'image': ('test.png', image_bytes, 'image/png')})


def test_default_gemini_model_uses_flash_lite(monkeypatch):
    monkeypatch.delenv('GEMINI_MODEL', raising=False)
    monkeypatch.delenv('AGRIVISION_GEMINI_MODEL', raising=False)
    assert gemini_model('agrivision') == 'gemini-3.5-flash-lite'


def test_missing_gemini_key_never_uses_openai(client, register, image_bytes, monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'gemini')
    monkeypatch.setenv('OPENAI_API_KEY', 'test-only-openai-key-must-not-be-used')
    response = scan(client, image_bytes)
    assert response.status_code == 503
    assert 'GEMINI_API_KEY' in response.json()['detail']['message']
    assert client.get('/api/health').json()['workspaces']['agrivision']['analysis_configured'] is False


def test_gemini_inline_image_schema_and_persistence(client, register, image_bytes, gemini_enabled, findings, monkeypatch):
    def handler(request):
        assert str(request.url) == 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent'
        assert request.headers['x-goog-api-key'] == 'test-only-google-secret'
        assert not request.url.query
        payload = json.loads(request.content)
        # Google's TextResponseFormat.MimeType enum rejects the usual MIME string.
        assert payload['generationConfig']['responseFormat']['text']['mimeType'] == 'APPLICATION_JSON'
        assert payload['generationConfig']['thinkingConfig'] == {'thinkingLevel': 'LOW'}
        assert payload['contents'][0]['parts'][1]['inlineData']['mimeType'] == 'image/jpeg'
        assert 'AgriVision' in payload['systemInstruction']['parts'][0]['text']
        return httpx.Response(200, json=body(findings))
    transport(monkeypatch, handler)
    response = scan(client, image_bytes)
    assert response.status_code == 200
    result = response.json()['result']
    assert result['model_name'] == 'Gemini · gemini-3.8-flash'
    assert result['confidence'] is None
    assert result['treatment_options'] == [] and result['sources'] == []
    assert client.get('/api/agrivision/history').json()['total'] == 1
    assert client.get('/api/pashuvision/history').json()['total'] == 0


@pytest.mark.parametrize('model,expected_thinking', [
    ('gemini-3.8-flash-001', {'thinkingLevel': 'LOW'}),
    ('gemini-3.5-flash-lite', None),
    ('gemini-2.5-flash', None),
    ('other-configured-gemini-model', None),
])
def test_thinking_config_matches_supported_model(client, register, image_bytes, gemini_enabled, findings,
                                                monkeypatch, model, expected_thinking):
    monkeypatch.setenv('GEMINI_MODEL', model)
    seen = []

    def handler(request):
        seen.append(str(request.url))
        config = json.loads(request.content)['generationConfig']
        if expected_thinking is None:
            assert 'thinkingConfig' not in config
        else:
            assert config['thinkingConfig'] == expected_thinking
        return httpx.Response(200, json=body(findings))

    transport(monkeypatch, handler)
    assert scan(client, image_bytes).status_code == 200
    assert seen == [f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent']


def test_livestock_stays_non_diagnostic(client, register, image_bytes, gemini_enabled, findings, monkeypatch):
    findings.update(subject='Test cattle', possible_condition='Unsupported test diagnosis')
    transport(monkeypatch, lambda request: httpx.Response(200, json=body(findings)))
    response = scan(client, image_bytes, 'pashuvision')
    assert response.status_code == 200
    assert response.json()['result']['possible_condition'] is None


@pytest.mark.parametrize('status,error,expected,code', [
    (400, {'details': [{'reason': 'API_KEY_INVALID'}]}, 502, 'gemini_auth_error'),
    (401, {}, 502, 'gemini_auth_error'),
    (403, {}, 502, 'gemini_access_error'),
    (404, {}, 502, 'gemini_model_unavailable'),
    (429, {}, 429, 'gemini_quota_exceeded'),
    (400, {}, 502, 'gemini_request_error'),
    (500, {}, 502, 'model_error'),
])
def test_redacted_gemini_errors(client, register, image_bytes, gemini_enabled, monkeypatch, status, error, expected, code):
    error['message'] = 'NEVER ECHO test-only-google-secret'
    transport(monkeypatch, lambda request: httpx.Response(status, json={'error': error}))
    response = scan(client, image_bytes)
    assert response.status_code == expected
    assert response.json()['detail']['code'] == code
    assert 'NEVER ECHO' not in response.text and 'test-only-google-secret' not in response.text
    assert client.get('/api/agrivision/history').json()['total'] == 0


def test_quota_failure_does_not_fall_back_to_paid_provider(client, register, image_bytes, gemini_enabled, monkeypatch):
    monkeypatch.setenv('OPENAI_API_KEY', 'unused-paid-provider-key')
    seen = []
    def handler(request):
        seen.append(str(request.url))
        return httpx.Response(429, json={'error': {'status': 'RESOURCE_EXHAUSTED'}})
    transport(monkeypatch, handler)
    assert scan(client, image_bytes).status_code == 429
    assert len(seen) == 1 and 'googleapis.com' in seen[0]


@pytest.mark.parametrize('finish,expected,code', [
    ('SAFETY', 422, 'model_refused'), ('MAX_TOKENS', 502, 'gemini_incomplete'),
])
def test_blocked_and_incomplete_results(client, register, image_bytes, gemini_enabled, findings, monkeypatch, finish, expected, code):
    transport(monkeypatch, lambda request: httpx.Response(200, json=body(findings, finish)))
    response = scan(client, image_bytes)
    assert response.status_code == expected
    assert response.json()['detail']['code'] == code


def test_unsupported_subject_not_saved(client, register, image_bytes, gemini_enabled, findings, monkeypatch):
    findings['supported_subject'] = False
    transport(monkeypatch, lambda request: httpx.Response(200, json=body(findings)))
    assert scan(client, image_bytes).status_code == 422
    assert client.get('/api/agrivision/history').json()['total'] == 0


def test_gemini_assistant_preserves_roles_and_scope(client, register, gemini_enabled, monkeypatch):
    def handler(request):
        payload = json.loads(request.content)
        assert 'PashuVision' in payload['systemInstruction']['parts'][0]['text']
        assert [turn['role'] for turn in payload['contents']] == ['user', 'model', 'user']
        return httpx.Response(200, json=body({'message': 'Record the visible changes and speak with your veterinarian.'}))
    transport(monkeypatch, handler)
    response = client.post('/api/assistant/pashuvision', json={'messages': [
        {'role': 'user', 'content': 'Help with my cattle'}, {'role': 'assistant', 'content': 'What changed?'},
        {'role': 'user', 'content': 'How should I record observations?'}]})
    assert response.status_code == 200
    assert response.json()['sources'] == []


def test_gemini_timeout(client, register, image_bytes, gemini_enabled, monkeypatch):
    def handler(request):
        raise httpx.ReadTimeout('test timeout', request=request)
    transport(monkeypatch, handler)
    response = scan(client, image_bytes)
    assert response.status_code == 504
    assert response.json()['detail']['code'] == 'model_timeout'
    assert 'did not finish responding' in response.json()['detail']['message']
    assert client.get('/api/agrivision/history').json()['total'] == 0


def test_gemini_connection_timeout_is_distinct(client, register, image_bytes, gemini_enabled, monkeypatch):
    def handler(request):
        raise httpx.ConnectTimeout('test-only-google-secret', request=request)

    transport(monkeypatch, handler)
    response = scan(client, image_bytes)
    assert response.status_code == 504
    detail = response.json()['detail']
    assert detail['code'] == 'model_timeout'
    assert 'could not connect to Gemini' in detail['message']
    assert 'did not finish responding' not in detail['message']
    assert 'test-only-google-secret' not in response.text
    assert client.get('/api/agrivision/history').json()['total'] == 0


def test_gemini_overall_deadline_cancels_request_without_saving(client, register, image_bytes,
                                                              gemini_enabled, findings, monkeypatch):
    monkeypatch.setattr(gemini_provider, 'REQUEST_DEADLINE_SECONDS', 0.02)
    cancelled = []

    async def handler(request):
        try:
            await asyncio.sleep(10)
        except asyncio.CancelledError:
            cancelled.append(True)
            raise
        return httpx.Response(200, json=body(findings))

    transport(monkeypatch, handler)
    response = scan(client, image_bytes)
    assert response.status_code == 504
    assert response.json()['detail']['code'] == 'model_timeout'
    assert 'did not finish responding' in response.json()['detail']['message']
    assert cancelled == [True]
    assert client.get('/api/agrivision/history').json()['total'] == 0


def test_model_id_cannot_change_endpoint(client, register, image_bytes, gemini_enabled, monkeypatch):
    monkeypatch.setenv('GEMINI_MODEL', '../other?key=secret')
    assert scan(client, image_bytes).status_code == 503
