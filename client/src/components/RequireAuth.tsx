import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { api } from "../lib/api";
import { clearToken, getToken } from "../lib/auth";
import { resetSocket } from "../lib/socket";

export default function RequireAuth() {
  const [state, setState] = useState<"checking" | "ok" | "no">("checking");

  useEffect(() => {
    let alive = true;
    if (!getToken()) {
      setState("no");
      return;
    }
    api("/api/auth/me")
      .then(() => alive && setState("ok"))
      .catch(() => {
        clearToken();
        resetSocket();
        if (alive) setState("no");
      });
    return () => {
      alive = false;
    };
  }, []);

  if (state === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-ink">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }
  if (state === "no") return <Navigate to="/login" replace />;
  return <Outlet />;
}
