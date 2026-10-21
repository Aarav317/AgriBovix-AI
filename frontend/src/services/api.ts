import type {
  Health,
  User,
  Workspace,
  Report,
  Message,
  Source,
} from "../types";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "https://agribovix-ai.onrender.com" : "")
).replace(/\/+$/, "");
export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...init.headers,
      },
      signal: init.signal ?? AbortSignal.timeout(75000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ApiError(
        0,
        "request_timeout",
        "The request timed out while waiting for a response. Please try again later.",
      );
    }
    throw new ApiError(
      0,
      "connection_error",
      "Cannot reach the server. Check that the Python backend is running, then try again.",
    );
  }
  const body = await response.text();
  let data: { detail?: { code?: string; message?: string } } = {};
  if (body) {
    try {
      data = JSON.parse(body);
    } catch {
      if (response.ok) {
        throw new ApiError(
          response.status,
          "invalid_server_response",
          "The API returned a non-JSON response. Check VITE_API_BASE_URL in your Render static site settings.",
        );
      }
    }
  } else if (response.ok && response.status !== 204) {
    throw new ApiError(
      response.status,
      "empty_server_response",
      "The API returned an empty response. Check that the Render backend URL and API route are configured correctly.",
    );
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.detail?.code || "request_failed",
      data.detail?.message || `The server request failed (HTTP ${response.status}). Check your Render backend URL and service logs.`,
    );
  }
  if (response.status === 204) return undefined as T;
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new ApiError(response.status, "invalid_server_response", "The API returned invalid JSON. Check the deployed backend response.");
  }
}
export const api = {
  health: () => request<Health>("/health"),
  me: () => request<User>("/auth/me"),
  login: (email: string, password: string) =>
    request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  analyze: (workspace: Workspace, file: File, task = "general") => {
    const body = new FormData();
    body.append("image", file);
    body.append("task", task);
    return request<Report>(`/${workspace}/analyze`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(140000),
    });
  },
  history: (workspace: Workspace, offset = 0) =>
    request<{ items: Report[]; total: number }>(
      `/${workspace}/history?limit=20&offset=${offset}`,
    ),
  remove: (workspace: Workspace, id: string) =>
    request<void>(`/${workspace}/history/${id}`, { method: "DELETE" }),
  chat: (workspace: Workspace, messages: Message[]) =>
    request<{ message: string; sources: Source[] }>(`/assistant/${workspace}`, {
      method: "POST",
      signal: AbortSignal.timeout(140000),
      body: JSON.stringify({
        messages: messages.map(({ role, content }) => ({ role, content })),
      }),
    }),
};
