/**
 * Thin API client that wraps fetch.
 * All requests go to relative paths (/api/...) so they work in
 * both development (proxied by Next.js rewrites) and production (Nginx routing).
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include', // Send the HttpOnly token cookie on every request
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const msg = (body as { error?: string })?.error ?? `Request failed with status ${res.status}`;
    throw new ApiError(res.status, msg, body);
  }

  return body as T;
}

// ─── Typed API surface ─────────────────────────────────────────────────────────

export type User = {
  id: number;
  username: string;
  role: string;
  status: string;
};

export type DateTimeResponse = {
  iso: string;
  utc: string;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
};

export type QueryCode = { code: string; preview: string };

export type QueryResult = {
  code: string;
  rowCount: number;
  columns: string[];
  data: unknown[];
  executedAt: string;
};

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ message: string; username: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    logout: () =>
      request<{ message: string }>('/api/auth/logout', { method: 'POST' }),
    me: () => request<{ username: string }>('/api/auth/me'),
  },

  users: {
    list: () => request<{ users: User[]; total: number }>('/api/users'),
  },

  datetime: {
    get: () => request<DateTimeResponse>('/api/datetime'),
  },

  query: {
    codes: () => request<{ codes: QueryCode[] }>('/api/query/codes'),
    run: (code: string) =>
      request<QueryResult>('/api/query/run', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
  },
};
