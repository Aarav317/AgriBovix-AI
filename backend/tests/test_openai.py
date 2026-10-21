import json

import httpx
import pytest

from app.services import openai_provider


@pytest.fixture
def openai_enabled(client, monkeypatch):
    # Synthetic key and MockTransport only; no paid network calls in tests.
    monkeypatch.setenv('AI_PROVIDER', 'openai')
    monkeypatch.setenv('OPENAI_API_KEY', 'test-only-secret-not-a-real-key')
    monkeypatch.setenv('OPENAI_MODEL', 'gpt-5.4-mini')


@pytest.fixture
def findings():
    return {
        'supported_subject': True, 'subject': 'Test crop', 'possible_condition': None,
        'observations': ['A test-only visible observation.'],
        'care_steps': ['Ask a local expert to inspect the plant.'],
        'prevention': [], 'limitations': ['Test fixture, not a real prediction.'],
        'urgency': 'expert_review',
    }


def response_body(findings):
    return {'status': 'completed', 'model': 'gpt-5.4-mini',
            'output': [{'type': 'message', 'content': [{'type': 'output_text', 'text': json.dumps(findings)}]}]}


def install_transport(monkeypatch, handler):
    real_client = httpx.AsyncClient
    monkeypatch.setattr(openai_provider.httpx, 'AsyncClient',
                        lambda **kwargs: real_client(transport=httpx.MockTransport(handler), **kwargs))


def scan(client, image_bytes, workspace='agrivision'):
    return client.post(f'/api/{workspace}/analyze', files={'image': ('test.png', image_bytes, 'image/png')})


def test_openai_missing_key_is_honest(client, register, image_bytes, monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'openai')
    response = scan(client, image_bytes)
    assert response.status_code == 503
    assert response.json()['detail']['code'] == 'model_unavailable'
    assert client.get('/api/health').json()['workspaces']['agrivision']['analysis_configured'] is False


def test_real_protocol_and_success_persistence(client, register, image_bytes, openai_enabled, findings, monkeypatch):
    def handler(request):
        assert str(request.url) == 'https://api.openai.com/v1/responses'
        assert request.headers['authorization'] == 'Bearer test-only-secret-not-a-real-key'
        payload = json.loads(request.content)
        assert payload['store'] is False
        assert payload['text']['format']['strict'] is True
        assert payload['input'][0]['content'][1]['image_url'].startswith('data:image/jpeg;base64,')
        assert 'AgriVision' in payload['instructions']
        return httpx.Response(200, json=response_body(findings))
    install_transport(monkeypatch, handler)
    response = scan(client, image_bytes)
    assert response.status_code == 200
    result = response.json()['result']
    assert result['confidence'] is None
    assert result['treatment_options'] == [] and result['sources'] == []
    assert result['model_name'] == 'OpenAI · gpt-5.4-mini'
    assert client.get('/api/agrivision/history').json()['total'] == 1
    assert client.get('/api/pashuvision/history').json()['total'] == 0
    assert 'test-only-secret' not in response.text


def test_livestock_does_not_persist_diagnostic_condition(client, register, image_bytes, openai_enabled, findings, monkeypatch):
    findings.update(subject='Test cattle', possible_condition='Unsupported condition from test model')
    def handler(request):
        assert 'PashuVision' in json.loads(request.content)['instructions']
        return httpx.Response(200, json=response_body(findings))
    install_transport(monkeypatch, handler)
    response = scan(client, image_bytes, 'pashuvision')
    assert response.status_code == 200
    assert response.json()['result']['possible_condition'] is None


def test_irrelevant_image_not_saved(client, register, image_bytes, openai_enabled, findings, monkeypatch):
    findings['supported_subject'] = False
    install_transport(monkeypatch, lambda request: httpx.Response(200, json=response_body(findings)))
    response = scan(client, image_bytes)
    assert response.status_code == 422
    assert response.json()['detail']['code'] == 'unsupported_subject'
    assert client.get('/api/agrivision/history').json()['total'] == 0


@pytest.mark.parametrize('status,error,status_expected,code', [
    (401, {'code': 'invalid_api_key'}, 502, 'openai_auth_error'),
    (403, {'code': 'access_denied'}, 502, 'openai_access_error'),
    (404, {'code': 'model_not_found'}, 502, 'openai_model_unavailable'),
    (429, {'code': 'insufficient_quota'}, 503, 'openai_quota_exceeded'),
    (429, {'code': 'rate_limit_exceeded'}, 429, 'openai_rate_limited'),
    (400, {'code': 'bad_request'}, 502, 'openai_request_error'),
])
def test_provider_errors_are_actionable_and_redacted(client, register, image_bytes, openai_enabled, monkeypatch, status, error, status_expected, code):
    error['message'] = 'DO NOT ECHO test-only-secret-not-a-real-key'
    install_transport(monkeypatch, lambda request: httpx.Response(status, json={'error': error}))
    response = scan(client, image_bytes)
    assert response.status_code == status_expected
    assert response.json()['detail']['code'] == code
    assert 'DO NOT ECHO' not in response.text and 'test-only-secret' not in response.text
    assert client.get('/api/agrivision/history').json()['total'] == 0


def test_timeout_does_not_save(client, register, image_bytes, openai_enabled, monkeypatch):
    def handler(request):
        raise httpx.ReadTimeout('test timeout', request=request)
    install_transport(monkeypatch, handler)
    assert scan(client, image_bytes).status_code == 504


@pytest.mark.parametrize('body,code', [
    ({'status': 'incomplete', 'output': []}, 'openai_incomplete'),
    ({'status': 'completed', 'output': [{'type': 'message', 'content': [{'type': 'refusal', 'refusal': 'test refusal'}]}]}, 'model_refused'),
    ({'status': 'completed', 'output': []}, 'invalid_model_result'),
])
def test_incomplete_refused_or_empty_results(client, register, image_bytes, openai_enabled, monkeypatch, body, code):
    install_transport(monkeypatch, lambda request: httpx.Response(200, json=body))
    response = scan(client, image_bytes)
    assert response.status_code in (422, 502)
    assert response.json()['detail']['code'] == code
    assert client.get('/api/agrivision/history').json()['total'] == 0


def test_assistant_scope_and_response(client, register, openai_enabled, monkeypatch):
    def handler(request):
        payload = json.loads(request.content)
        assert 'PashuVision' in payload['instructions']
        assert payload['input'] == [{'role': 'user', 'content': 'How should I record observations?'}]
        return httpx.Response(200, json=response_body({'message': 'Record when the change began and contact your veterinarian.'}))
    install_transport(monkeypatch, handler)
    response = client.post('/api/assistant/pashuvision', json={'messages': [{'role': 'user', 'content': 'How should I record observations?'}]})
    assert response.status_code == 200
    assert response.json()['sources'] == []


def test_invented_confidence_field_rejected(client, register, image_bytes, openai_enabled, findings, monkeypatch):
    findings['confidence'] = 0.99
    install_transport(monkeypatch, lambda request: httpx.Response(200, json=response_body(findings)))
    assert scan(client, image_bytes).status_code == 502
