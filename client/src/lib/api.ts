import { authHeaders } from "./auth";

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  for (const [k, v] of Object.entries(authHeaders())) {
    if (!headers.has(k)) headers.set(k, v);
  }
  if (
    init?.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  const r = await fetch(path, { ...init, headers });
  if (!r.ok) {
    let msg = `request failed (${r.status})`;
    try {
      const j = await r.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  return r.json();
}

export function post<T = any>(path: string, body?: any): Promise<T> {
  return api<T>(path, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  });
}

export function patch<T = any>(path: string, body?: any): Promise<T> {
  return api<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) });
}

export function del<T = any>(path: string): Promise<T> {
  return api<T>(path, { method: "DELETE" });
}
