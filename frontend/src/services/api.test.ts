import { afterEach, describe, expect, it, vi } from "vitest";
import { api, request } from "./api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("API request time limits", () => {
  it("reports a response timeout separately from an unreachable backend", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      Object.assign(new Error("test timeout"), { name: "TimeoutError" }),
    );
    await expect(request("/health")).rejects.toMatchObject({
      code: "request_timeout",
      message: expect.stringContaining("waiting for a response"),
    });
  });

  it("keeps connection failures distinct from response timeouts", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("test network failure"));
    await expect(request("/health")).rejects.toMatchObject({
      code: "connection_error",
    });
  });

  it("lets image analysis and chat wait for the backend's AI deadline", async () => {
    const signal = new AbortController().signal;
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    await api.analyze("agrivision", new File(["test image"], "test.jpg", { type: "image/jpeg" }));
    await api.chat("pashuvision", [{ role: "user", content: "How do I record observations?" }]);
    expect(timeout.mock.calls).toEqual([[140000], [140000]]);
    expect(fetch.mock.calls.map(([, init]) => init?.signal)).toEqual([signal, signal]);
  });
});
