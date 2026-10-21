# Gemini setup — image observations and workspace chat

Direct Gemini support is included alongside OpenAI and custom adapters. No new Python package is needed: the backend uses the existing `httpx` dependency.

## Configure privately

In the root `.env` file (next to README), change the existing provider line and add your Gemini settings:

```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=replace_locally_with_your_actual_gemini_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Keep just one `AI_PROVIDER` assignment. Keep any existing database/origin settings. Existing `OPENAI_API_KEY` settings are ignored when Gemini is selected for a pipeline; the application never automatically falls back to a paid provider.

Do not paste a key into chat, frontend code, screenshots, source control or a ZIP. The backend sends the key in Google's `x-goog-api-key` header, never in a URL. `.env` is excluded from source archives.

You can create your own Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey). If using a key for a shared project, that project's account access, billing and quotas apply.

## Free-tier limits and cost

Google's current pricing documentation lists free-tier input/output for eligible Gemini models, including the default selected here. This is limited project access, not unlimited free usage. Available models, region/account eligibility and quotas must be checked in AI Studio. A key does not force an already-paid Google project onto the free tier. Verify the project's tier before sending requests if zero cost is required. No billing settings are changed by this application.

The app has no automatic retries or fallback to OpenAI. A quota failure is shown clearly and does not create a saved report. Google's free-tier and paid-tier data-use terms differ; consult the official pricing/terms before uploading sensitive content. Selecting Gemini sends submitted photos and chat messages to Google.

## Restart and test

From the `backend` directory:

```powershell
..\.venv\Scripts\python.exe check_ai.py
```

This prints configuration presence and selected model, without printing the secret or making a network request. For one small real text request, which consumes the selected project's API quota and may be billable under that project's tier:

```powershell
..\.venv\Scripts\python.exe check_ai.py --live
```

Expected success: `Gemini connection: OK`. A successful text request does not validate image interpretation or medical/agricultural accuracy.

Stop the running backend with Ctrl+C, then run:

```powershell
..\.venv\Scripts\python.exe -m uvicorn run:application --host 127.0.0.1 --port 8000
```

Refresh the frontend at http://127.0.0.1:3000, sign in, select the correct workspace, upload a clear image and Analyze. Successful validated results are saved privately by account and workspace. Failed, blocked, unsupported or incomplete responses are not saved.

## Implementation and limits

- Calls Google's documented `POST /v1beta/models/{model}:generateContent` REST endpoint. This compatible API is labeled Generate Content (Legacy) in current documentation.
- Uses `systemInstruction`, inline JPEG `contents`, and `generationConfig.responseFormat.text` with JSON schema. This text format's `mimeType` is Google's enum `APPLICATION_JSON`; the ordinary string `application/json` is rejected with HTTP 400. Inline images still use the MIME string `image/jpeg`.
- Sends only the backend-validated/re-encoded image, not its original EXIF data.
- Returns conservative observations and general care. It does not establish a professional diagnosis or validated breed classification.
- The common policy and server validators enforce null confidence, no invented sources, no treatment-option arrays, and non-diagnostic livestock results.
- The configured model ID is restricted to a single safe identifier and cannot redirect requests to another host/path.
- Responses are bounded to 150 KB. Connections have a 10-second limit, response reads have a 110-second limit, and the entire Gemini request has a 120-second deadline. The frontend allows 140 seconds for image analysis and chat so it can display the backend's actual error. Other API calls retain their 75-second client limit. No provider output or key is logged by the adapter.
- The selected default is `gemini-3.5-flash-lite`, Google's low-latency model with image and structured-output support. A real bundled crop-image check completed in 4.2 seconds on the tested local configuration; future request times can vary. If you explicitly select Gemini 3.8 Flash, it uses documented `thinkingConfig.thinkingLevel: LOW`. Other model families do not receive that model-specific field. The app makes no automatic model/provider fallback and changes no billing settings.
- This stateless Generate Content request does not use a stored provider conversation. Provider processing and retention policies still apply; the app does not claim zero data retention.
- `AGRIVISION_GEMINI_MODEL` and `PASHUVISION_GEMINI_MODEL` optionally select different models. Existing per-workspace/provider overrides take precedence over the common `AI_PROVIDER` setting.

## Errors

| Code | Action |
|---|---|
| `model_unavailable` | Add GEMINI_API_KEY and a valid GEMINI_MODEL, then restart |
| `gemini_auth_error` | Check the actual key and expiry; never share it in chat |
| `gemini_access_error` | Check key restrictions, API permissions, project and regional eligibility |
| `gemini_quota_exceeded` | Check project quotas/reset; repeated retries do not restore an exhausted quota |
| `gemini_model_unavailable` | Choose a model actually available to that Google project |
| `gemini_request_error` | Check model/payload support and API project settings |
| `model_timeout` | The message distinguishes connection failure from a delayed Gemini response. Retry later; repeatedly resending does not guarantee faster service |
| `model_refused`, `unsupported_subject`, `gemini_incomplete` | No report saved; use an appropriate clear farm image or ask an expert |

## Official references

- [Gemini pricing and free-tier availability](https://ai.google.dev/gemini-api/docs/pricing)
- [API keys](https://ai.google.dev/gemini-api/docs/api-key)
- [Generate Content API fields](https://ai.google.dev/api/generate-content)
- [Generate Content structured output format](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)
- [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

No Gemini key is bundled. Offline tests validate protocol/error handling with mock responses; genuine image inference is not claimed until a real eligible project/key is tested.
