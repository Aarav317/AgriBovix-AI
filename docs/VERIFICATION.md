# Verification — 20 October 2026

## Gemini timeout follow-up

**Final model selection:** an explicit process-only trial of `gemini-3.5-flash-lite` completed the real crop-image pipeline successfully in **4.2 seconds**, returning **3 observations** that passed the server result validators. The input was the bundled generated crop asset; this proves API image processing and the application contract, not agricultural diagnostic accuracy. No account report was saved by the diagnostic. The default and local Desktop configuration were then changed from 3.8 Flash to 3.5 Flash-Lite. The API key and billing settings were preserved. There is no automatic fallback.

Network tracing established TCP/TLS and sent a tiny request in about 1.4 seconds; Google then returned no response headers before a 35-second diagnostic read timeout. The application now sends documented LOW thinking when 3.8 Flash is selected, uses separate connection/read limits with an overall 120-second deadline, and allows 140 seconds in the frontend for AI requests. Browser response timeouts are distinguished from an unreachable Python backend. No automatic retries or provider fallback were added.

A subsequent real `check_ai.py --live` using the Desktop project's configuration returned **Gemini connection: OK**. This proves a real structured text response, not image interpretation or diagnostic accuracy.

The subsequent real crop-image pipeline with 3.8 Flash still timed out after **111.5 seconds** while waiting for Gemini. No result was fabricated or saved. The later 3.5 Flash-Lite success is described above; neither LOW thinking nor a larger deadline guarantees provider response time.

**62 backend tests and 10 frontend tests passed**, and the frontend TypeScript/Vite production build succeeded. New regressions cover the Flash-Lite default, supported/other-model thinking configuration, connection/read/overall timeouts, request cancellation with no saved report, frontend AI time budgets and distinct connection/response errors. Mock tests use synthetic keys. No secret is bundled in the ZIP.

## Gemini integration update

A subsequent live diagnostic on the user's Desktop configuration returned HTTP 200 for the selected model metadata and HTTP 400 for generation, specifically identifying `generation_config.response_format.text.mime_type`. The adapter incorrectly sent `application/json`; it now sends the documented `APPLICATION_JSON` enum. The protocol assertion was corrected and all **55 backend tests passed again**. The corrected adapter was copied to the Desktop project without changing its `.env` or account data. Both the corrected text check and a subsequent image-pipeline check using the bundled generated crop asset returned `model_timeout`. No successful live Gemini output or diagnostic accuracy is claimed. No account report was saved, no provider fallback was used, and no billing/model setting was changed.

The initial combined backend suite had **55 passing tests**: the original 22, 16 OpenAI checks, and 17 Gemini checks. The shared educational vision/chat policy was extracted without regressing the OpenAI tests. Gemini tests cover key headers (no URL key), inline JPEG data, current JSON response format, separate workspace scope, role mapping, private report persistence, null confidence, non-diagnostic livestock results, unsupported subjects, redacted key/access/model/quota errors, safety/incomplete responses, timeouts, endpoint-safe model IDs, and no automatic fallback to a paid provider. Those tests used mock transports and synthetic keys; no genuine Gemini inference was tested at that initial stage. Frontend source was unchanged at that stage.

## Direct OpenAI integration update

The updated backend suite has **38 passing tests** (the original 22 plus 16 OpenAI protocol/error/response checks). The new tests use explicit MockTransport responses and a synthetic key; no real key, external inference, or billed request was used. They verify inline JPEG input, strict structured format, `store:false`, separate workspace instructions, null confidence, no medication treatment/source fabrication, non-diagnostic livestock reports, rejected unsupported subjects, redacted auth/access/quota/rate/model errors, timeout/refusal/incomplete response handling, scoped chat and persistence only after a valid success. The existing seven frontend tests/build remain valid; frontend source was not changed by the OpenAI update. Real OpenAI connectivity and image inference require the user's local key/billing and must be tested separately.

A subsequent local CLI connection check using the user's separately configured Desktop `.env` reached OpenAI and returned `insufficient_quota`, surfaced as `openai_quota_exceeded`. No successful live model output or image inference was obtained. The account's API credits/quota must be resolved before end-to-end image analysis can be verified. The key was not printed, copied into source, or included in either ZIP.

## Automated checks

- Frontend production build: TypeScript checking and Vite bundle succeeded.
- Backend: **22 tests passed**. Isolated SQLite databases cover health/configuration, private histories, registration/login/logout, hashed credentials/sessions, duplicate accounts, input redaction, origin checks, throttling, missing/unreadable/unsupported/oversized/over-resolution images, task separation, unconfigured model/assistant behavior, provider schema and treatment rejection, successful fixture persistence, owner/workspace isolation and deletion.
- Frontend: **7 tests passed**. Tests cover safe login destinations, separate workspace actions, selected-image preview, passing the correct workspace/task, honest unavailable-model errors, invalid/oversized files, removal and object-URL cleanup.
- Explicit test-only provider fixtures exercise the successful result contract; production routes do not use them or seed reports.
- A Starlette dependency deprecation warning recommends a future HTTP test-client migration. It does not fail the tests; the pinned stack runs successfully.

## Browser checks

- Opened the local Vite app and read the proxied backend health endpoint.
- Desktop **1440 × 1000**: homepage and both dashboard layouts rendered; all homepage images loaded; no horizontal overflow.
- Mobile **390 × 844** and the default narrow preview: homepage and AgriVision rendered without horizontal overflow; sidebar opened with the selected crop navigation and closed through normal navigation.
- Confirmed AgriVision has no PashuVision tools/content and PashuVision has no Crop History or crop tools.
- Signed in using an isolated synthetic local QA identity and confirmed navigation returned to PashuVision, the originally selected workspace. Registration, login, logout and history privacy also passed API tests.
- Browser file-picker automation stalled and the tab session disappeared before file selection completed. The image-preview/remove/error behavior was therefore verified through the automated component tests, while image decoding, upload limits and model failures were verified through the API suite. A successful real-model call was not browser-tested.
- Final screenshots were captured from the actual application, not a generated interface mockup.

## Branding and assets

- SHA-256 comparison confirms the local original-logo asset matches the supplied file byte for byte.
- Farmer, crop and cattle images and DM Sans font are included locally; images have explicit fallbacks.
- Original logo artwork was not regenerated, cropped, recolored, filtered or redrawn.

## Limits

Initial verification used mocked providers; subsequent live Gemini checks are described above. No diagnostic accuracy benchmark, clinical/agricultural validity study or validated disease/breed classifier has been tested. Configuration flags and a successful API request are not accuracy claims. Educational guidance is separate from predictions. Production security, legal disclosures and operational controls require deployment-specific work described in README and ARCHITECTURE.
