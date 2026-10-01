import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import type { Visitor } from "../lib/types";

function depth(v: Visitor) {
  if ((v.media?.length || 0) > 0) return "media";
  if (v.geo?.method === "gps") return "gps";
  if (v.geo?.lat || v.ip?.lat) return "ip";
  return "none";
}

const RAIL: Record<string, string> = {
  media: "border-l-accent",
  gps: "border-l-accent2",
  ip: "border-l-warn",
  none: "border-l-white/15",
};

const BADGE: Record<string, string> = {
  media: "border-accent/40 text-accent",
  gps: "border-accent2/40 text-accent2",
  ip: "border-warn/40 text-warn",
  none: "border-white/15 text-slate-500",
};

export default function Sessions() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  useEffect(() => {
    api("/api/sessions")
      .then(setVisitors)
      .catch(() => {});
    const s = getSocket();
    const onUpdate = (v: Visitor) =>
      setVisitors((prev) => {
        const i = prev.findIndex((x) => x.token === v.token);
        if (i >= 0) {
          const c = [...prev];
          c[i] = v;
          return c;
        }
        return [v, ...prev];
      });
    const onRemoved = ({ token }: { token: string }) =>
      setVisitors((prev) => prev.filter((v) => v.token !== token));
    s.on("visitor:update", onUpdate);
    s.on("visitor:removed", onRemoved);
    return () => {
      s.off("visitor:update", onUpdate);
      s.off("visitor:removed", onRemoved);
    };
  }, []);

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              to="/dashboard"
              className="shrink-0 text-sm text-slate-500 hover:text-white transition"
            >
              ← ops
            </Link>
            <h1 className="font-display font-semibold text-white">
              Sessions
            </h1>
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-slate-500">
              {visitors.length}
            </span>
          </div>
          <Link
            to="/dashboard"
            className="shrink-0 rounded-lg glass px-3 py-2 text-sm text-slate-200 hover:border-accent/40 transition sm:px-4"
          >
            Map view
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-3 px-4 py-5 sm:px-6 sm:py-6">
        {visitors.length === 0 && (
          <div className="glass grid h-64 place-items-center rounded-2xl text-sm text-slate-500">
            no sessions yet — generate a demo link from the landing page
          </div>
        )}
        {visitors.map((v, i) => {
          const d = depth(v);
          const photo = v.media?.find((m) => m.kind === "photo");
          const fresh =
            Date.now() - new Date(v.startedAt || v.createdAt || 0).getTime() <
            120000;
          return (
            <Link
              key={v.token}
              to={`/dashboard/sessions/${v.token}`}
              className={`glass flex items-center gap-4 rounded-2xl border-l-4 p-4 transition hover:border-white/20 animate-rise ${RAIL[d]}`}
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              {photo ? (
                <img
                  src={photo.url}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl border border-white/10 object-cover"
                />
              ) : (
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white/5 font-display text-lg text-slate-600">
                  {(v.ip?.addr || "?").slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium text-white">
                    {v.ip?.city || "unknown city"}
                  </span>
                  <span className="truncate text-sm text-slate-500">{v.ip?.addr}</span>
                  {fresh && (
                    <span className="flex items-center gap-1 rounded-full bg-good/10 px-2 py-0.5 text-[10px] text-good">
                      <span className="h-1 w-1 rounded-full bg-good animate-pulse-dot" />
                      LIVE
                    </span>
                  )}
                </div>
                <div className="truncate text-sm text-slate-400">
                  {[v.device?.device, v.device?.os, v.device?.browser]
                    .filter(Boolean)
                    .join(" · ") || "device pending"}
                </div>
                <div className="mt-1.5 flex items-center gap-3 sm:hidden">
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${BADGE[d]}`}>
                    {d === "media"
                      ? `${v.media?.length} media`
                      : d === "gps"
                        ? `GPS ±${Math.round(v.geo?.accuracy || 0)}m`
                        : d === "ip"
                          ? "IP only"
                          : "just opened"}
                  </span>
                  <span className="font-display text-lg font-bold text-accent">
                    {v.points ?? 0}
                  </span>
                  <span className="text-[10px] tracking-wider text-slate-600 uppercase">
                    points
                  </span>
                </div>
              </div>

              <div className="hidden shrink-0 items-center gap-4 text-right sm:flex">
                <div>
                  <div
                    className={`rounded-full border px-2.5 py-1 text-[11px] ${BADGE[d]}`}
                  >
                    {d === "media"
                      ? `${v.media?.length} media`
                      : d === "gps"
                        ? `GPS ±${Math.round(v.geo?.accuracy || 0)}m`
                        : d === "ip"
                          ? "IP only"
                          : "just opened"}
                  </div>
                </div>
                <div className="w-20">
                  <div className="font-display text-xl font-bold text-accent">
                    {v.points ?? 0}
                  </div>
                  <div className="text-[10px] tracking-wider text-slate-600 uppercase">
                    points
                  </div>
                </div>
                <div className="w-16 text-xs text-slate-600">
                  {v.durationMs
                    ? `${(v.durationMs / 1000).toFixed(1)}s`
                    : new Date(
                        v.startedAt || v.createdAt || Date.now()
                      ).toLocaleTimeString()}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
