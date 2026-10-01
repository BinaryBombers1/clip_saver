import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { post } from "../lib/api";
import { setSession } from "../lib/auth";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const r = await post<{ token: string; email: string }>("/api/auth/login", {
        email,
        password,
      });
      setSession(r.token, r.email);
      nav("/dashboard");
    } catch (e: any) {
      setErr(e.message || "login failed");
      setBusy(false);
    }
  };

  return (
    <div className="grid-bg grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm animate-rise">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="h-9 w-9 rounded-xl border border-accent/40 grid place-items-center">
            <span className="h-3 w-3 rounded-full bg-accent" />
          </span>
          <span className="font-display text-xl font-semibold text-white">
            Echo
          </span>
        </div>
        <form onSubmit={submit} className="glass ring-glow rounded-3xl p-7">
          <div className="text-xs font-medium tracking-widest text-accent uppercase">
            operator console
          </div>
          <h1 className="font-display mt-2 text-2xl font-semibold text-white">
            Admin sign in
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Dashboards, visitor media and session dossiers are restricted.
          </p>

          <label className="mt-6 block text-xs text-slate-500">
            email
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/50"
              placeholder="admin@echo.app"
            />
          </label>
          <label className="mt-4 block text-xs text-slate-500">
            password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/50"
              placeholder="••••••••"
            />
          </label>

          {err && (
            <div className="mt-4 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2.5 text-sm text-bad">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-accent to-accent2 py-3.5 font-semibold text-ink transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Enter console →"}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-slate-600">
          unauthorized access to visitor media is not permitted — sessions are
          demo-only and deletable.
        </p>
      </div>
    </div>
  );
}
