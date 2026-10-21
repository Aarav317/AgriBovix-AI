# Direct OpenAI setup

This version includes a direct **OpenAI Responses API** integration for image observations and workspace chat. It uses the existing server-side `httpx` dependency; installing the OpenAI SDK is not required.

## Configure the key privately

In the project root, next to `README.md`, create or edit `.env`:

```dotenv
AI_PROVIDER=openai
OPENAI_API_KEY=replace_this_value_locally_with_your_actual_key
OPENAI_MODEL=gpt-5.4-mini
```

Do not paste the secret key into chat, frontend code, screenshots, Git, logs or a ZIP. The `.gitignore` already excludes `.env`. The backend reads this file on startup. If the file already contains database/origin settings, keep them. Change existing OpenAI entries rather than duplicating them.

The default model supports image input and Structured Outputs according to the official model documentation linked below. Account/model access and API billing still need to be available. Model availability may change; override `OPENAI_MODEL` with a currently accessible Responses model supporting image input and strict Structured Outputs. The selected model must support the payload features used in `openai_provider.py`.

## Restart the backend

In its terminal press **Ctrl+C**, then from `backend/` run:

```powershell
..\.venv\Scripts\python.exe -m pip install -r requirements.txt
..\.venv\Scripts\python.exe -m uvicorn run:application --host 127.0.0.1 --port 8000
```

The frontend can remain running. Refresh the browser so its workspace configuration status is reloaded. A nonempty key sets the configuration flag; **AI configured does not prove that the key or billing is valid**.

Sign in, open the relevant workspace, choose a clear image and select Analyze. A valid response shows observations, limitations, conservative general care and the actual model name. It is saved in that account's workspace history. Unavailable, refused, invalid, unsupported-image or failed responses do not create reports.

## Connection check

From `backend/`, check configuration without making a paid request:

```powershell
..\.venv\Scripts\python.exe check_ai.py
```

To make one small **billable text API request** and check access/billing:

```powershell
..\.venv\Scripts\python.exe check_ai.py --live
```

The script never prints the key. A successful text check does not verify image interpretation quality. If it succeeds, test an image through the signed-in application.

## What this integration does and does not establish

- Sends the backend's validated, re-encoded JPEG to OpenAI using an inline base64 image input.
- Uses strict structured JSON output and validates it again before returning/saving a report.
- Gives separate crop/livestock instructions and passes the intended task.
- Uses a general-purpose vision model. It is not a validated agricultural classifier, calibrated breed detector or veterinary diagnostic system.
- Always sets `confidence` to null. The model cannot generate a made-up accuracy/confidence percentage.
- Rejects unclear/irrelevant subjects when the model marks them unsupported. Model subject recognition remains fallible.
- Does not save livestock diagnoses. Breed confirmation and clinical diagnosis require stronger evidence/professional assessment.
- Returns no pesticide/medicine treatment options or fabricated source links in OpenAI mode. No retrieval service is configured. General educational care is explicitly limited; use a qualified local expert for treatment.
- Sets `store:false` for Responses request storage. This does not override the provider's applicable data processing/retention policies. Images/messages are sent to OpenAI when the user submits them.
- Has a 60-second request timeout, bounded response reading, and no automatic retries. API calls may incur charges even if a response is later rejected or times out.

## Common errors

| Message/code | Action |
|---|---|
| `model_unavailable` / missing key | Set `AI_PROVIDER=openai` and `OPENAI_API_KEY`, then restart |
| `openai_auth_error` | Check the actual key, project and permissions; restart after edits |
| `openai_quota_exceeded` | Check API billing/credits/quota; ChatGPT subscription usage is separate |
| `openai_rate_limited` | Wait and retry; reduce concurrent scans |
| `openai_model_unavailable` | Check model access and `OPENAI_MODEL` |
| `model_timeout` | Retry later or with a clearer/smaller image |
| `unsupported_subject` | Upload a clearer appropriate photo in the right workspace |
| `model_refused` / `invalid_model_result` | No report saved; retry a suitable image or consult an expert |

Raw provider errors and authorization headers are never returned to the frontend. Do not enable HTTP debug logging that prints authorization headers or image payloads.

## Advanced workspace configuration

`AI_PROVIDER=adapter` retains the original custom HTTP-adapter workflow documented in AI_MODEL_SETUP. Per-workspace overrides include `AGRIVISION_MODEL_PROVIDER`, `PASHUVISION_MODEL_PROVIDER`, `AGRIVISION_ASSISTANT_PROVIDER` and `PASHUVISION_ASSISTANT_PROVIDER`. Values are `openai` or `adapter`. Model overrides are `AGRIVISION_OPENAI_MODEL` and `PASHUVISION_OPENAI_MODEL`. A configured adapter URL is ignored when that pipeline explicitly uses `openai`.

## Official references

- [OpenAI developer quickstart](https://developers.openai.com/api/docs/quickstart)
- [Responses API](https://developers.openai.com/api/reference/responses/overview)
- [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [GPT-5.4 mini model capabilities](https://developers.openai.com/api/docs/models/gpt-5.4-mini)
- [API authentication and keeping keys on the server](https://developers.openai.com/api/reference/overview)

Protocol/error handling is tested offline with explicit mock transports. No genuine API key is bundled, and no successful live inference is claimed before the user's local key and API access are tested.
