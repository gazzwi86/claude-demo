// Thin fetch wrapper for the Fastify API. Cookies are sent with every
// request so the api can read the JWT cookie. Throws ApiError on non-2xx.

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type ApiInit = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: Record<string, string>;
};

export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const hasBody = init.body !== undefined;
  const headers: Record<string, string> = {
    ...(hasBody ? { "content-type": "application/json" } : {}),
    ...init.headers,
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
    body: hasBody ? JSON.stringify(init.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const errPayload = (payload && typeof payload === "object" ? (payload as { error?: { message?: string; code?: string } }).error : undefined) ?? {};
    throw new ApiError(res.status, errPayload.message ?? `Request failed: ${res.status}`, errPayload.code);
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string) => api<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => api<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => api<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => api<T>(path, { method: "DELETE" }),
};
