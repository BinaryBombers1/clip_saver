const KEY = "echo_admin_token";
const EMAIL_KEY = "echo_admin_email";

export function getToken(): string | null {
  return localStorage.getItem(KEY);
}

export function setSession(token: string, email: string) {
  localStorage.setItem(KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearToken() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export function adminEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

export function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
