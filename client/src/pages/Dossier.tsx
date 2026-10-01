import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, del } from "../lib/api";
import { getSocket } from "../lib/socket";
import type { Visitor } from "../lib/types";
import CountUp from "../components/CountUp";
import MapPanel from "../components/MapPanel";

function row(label: string, value?: string | number | null) {
  if (value === null || value === undefined || value === "") return null;
  return { label, value: String(value) };
}

export default function Dossier() {
  const { token = "" } = useParams();
  const nav = useNavigate();
  const [v, setV] = useState<Visitor | null>(null);
  const [err, setErr] = useState("");
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api(`/api/sessions/${token}`)
      .then(setV)
      .catch((e) => setErr(e.message || "not found"));
    const s = getSocket();
    const onUpdate = (doc: Visitor) => {
      if (doc.token === token) setV(doc);
    };
    s.on("visitor:update", onUpdate);
    return () => {
      s.off("visitor:update", onUpdate);
    };
  }, [token]);

  const photos = (v?.media || []).filter((m) => m.kind === "photo");
  const clip = (v?.media || []).find((m) => m.kind === "clip");
  const hero = photos[idx % Math.max(1, photos.length)]?.url || null;

  const start = new Date(v?.startedAt || v?.createdAt || Date.now()).getTime();

  const prompts = useMemo(() => {
    const map = new Map<string, { granted: boolean; at?: string }>();
    for (const p of v?.consent?.prompts || []) map.set(p.kind, p);
    return map;
  }, [v]);

  const identity = useMemo(() => {
    if (!v) return [];
    const d = v.device || {};
    const ip = v.ip || {};
    const sc = d.screen || {};
    const con = d.connection || {};
    const bat = d.battery || {};
    return [
      row("IP address", ip.addr),
      row("ISP / ASN", ip.isp ? `${ip.isp}${ip.asn ? ` (${ip.asn})` : ""}` : null),
      row("City", [ip.city, ip.region, ip.country].filter(Boolean).join(", ")),
      row("IP geo source", ip.source),
      row("Device", d.device),
      row("OS", [d.os, d.osVersion].filter(Boolean).join(" ")),
      row("Browser", [d.browser, d.browserVersion].filter(Boolean).join(" ")),
      row("Screen", sc.w ? `${sc.w}×${sc.h} @${sc.dpr}x` : null),
      row("Language", d.language),
      row("Timezone", d.timezone),
      row("CPU cores", d.cores),
      row("Memory", d.memory ? `${d.memory} GB` : null),
      row("Touch points", d.touchPoints),
      row("Connection", con.effectiveType ? `${con.effectiveType}${con.rtt ? ` · ${con.rtt}ms RTT` : ""}` : null),
      row("Battery", bat.level !== undefined ? `${Math.round(bat.level * 100)}%${bat.charging ? " ⚡" : ""}` : null),
      row("User agent", d.userAgent),
    ].filter(Boolean) as { label: string; value: string }[];
  }, [v]);

  const defenses = useMemo(() => {
    const notes: string[] = [];
    if (prompts.get("location")?.granted) {
      notes.push("GPS gave street-level position. Fix: deny location by default, grant per-session only.");
    } else {
      notes.push("GPS was denied — yet the IP still leaked city-level location. VPN/Tor masks this layer.");
    }
    if (prompts.get("camera")?.granted) {
      notes.push("One camera prompt put a live photo on this dashboard. Treat the prompt like a lens pointed at you.");
    }
    if (prompts.get("mic")?.granted) {
      notes.push("Voice captured with the same permission burst. If a link asks to 'talk', ask why.");
    }
    notes.push("Permission fatigue is the real attack: three quick Allows = complete profile. Slow down at every prompt.");
    return notes;
  }, [prompts]);

  const wipe = async () => {
    if (!confirm("Wipe this session and all its media files?")) return;
    setDeleting(true);
    try {
      await del(`/api/sessions/${token}`);
      nav("/dashboard/sessions");
    } catch {
      setDeleting(false);
      alert("delete failed");
    }
  };

  if (err) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink text-slate-400">
        <div className="text-center">
          <p className="font-display text-xl text-white">Session not found</p>
          <p className="mt-2 text-sm">{err}</p>
          <Link to="/dashboard/sessions" className="mt-4 inline-block text-accent">
            ← back to sessions
          </Link>
        </div>
      </div>
    );
  }

  if (!v) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  const timeline = [...(v.events || [])].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );

  return (
    <div className="min-h-screen bg-ink pb-16">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4 text-sm">
            <Link to="/dashboard/sessions" className="text-slate-500 hover:text-white transition">
              ← sessions
            </Link>
            <span className="font-mono text-slate-500">SESSION</span>
            <span className="font-mono text-accent">{v.token}</span>
          </div>
          <button
            onClick={wipe}
            disabled={deleting}
            className="rounded-lg border border-bad/40 px-4 py-2 text-sm font-semibold text-bad transition hover:bg-bad/10 disabled:opacity-50"
          >
            {deleting ? "wiping…" : "Delete"}
          </button>
        </div>
      </header>

      <section className="relative mx-auto mt-6 max-w-6xl overflow-hidden rounded-3xl px-0">
        <div className="relative h-[340px] overflow-hidden rounded-3xl">
          {hero ? (
            <img src={hero} alt="" className="h-full w-full object-cover object-top animate-kenburns" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-accent2/40 via-accent/15 to-transparent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
          <div className="absolute right-0 bottom-0 left-0 flex items-end justify-between gap-6 p-8">
            <div>
              <div className="flex items-center gap-3 text-xs tracking-widest text-accent uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
                session dossier
              </div>
              <div className="font-display mt-2 flex items-end gap-3 text-6xl font-bold text-white">
                <CountUp to={v.points || 0} />
                <span className="mb-2 text-sm font-medium tracking-widest text-slate-400 uppercase">
                  data points in{" "}
                  {v.durationMs ? `${(v.durationMs / 1000).toFixed(1)}s` : "progress"}
                </span>
              </div>
              <div className="mt-2 text-slate-300">
                {[v.device?.device, v.device?.os, v.device?.browser].filter(Boolean).join(" · ") || "device pending"}
              </div>
            </div>
            <div className="hidden gap-6 text-right sm:flex">
              <div>
                <div className="font-display text-2xl font-bold text-white">
                  {v.ip?.city || "?"}
                </div>
                <div className="text-xs text-slate-500">{v.ip?.addr}</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-accent">
                  {v.geo?.method === "gps" ? `±${Math.round(v.geo.accuracy || 0)}m` : "IP"}
                </div>
                <div className="text-xs text-slate-500">
                  {v.geo?.method === "gps" ? "gps lock" : "fallback"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-5 grid max-w-6xl gap-5 px-6 lg:grid-cols-2">
        <section className="glass overflow-hidden rounded-2xl animate-rise">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
            <h2 className="font-display text-sm font-semibold text-white">Position</h2>
            <span className="text-xs text-slate-500">
              {v.geo?.method === "gps" ? "gps · high accuracy" : ipLabel(v)}
            </span>
          </div>
          <MapPanel visitors={[v]} className="h-[280px] w-full" />
        </section>

        <section
          className="glass rounded-2xl animate-rise"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
            <h2 className="font-display text-sm font-semibold text-white">Identity graph</h2>
            <span className="text-xs text-slate-500">{identity.length} fields</span>
          </div>
          <div className="max-h-[280px] overflow-y-auto px-5 py-2">
            {identity.map((r, i) => (
              <div
                key={r.label}
                className="flex items-start justify-between gap-4 border-b border-white/5 py-2.5 text-sm last:border-0 animate-rise"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className="shrink-0 text-slate-500">{r.label}</span>
                <span className="truncate text-right text-slate-200" title={r.value}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass rounded-2xl animate-rise" style={{ animationDelay: "160ms" }}>
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
            <h2 className="font-display text-sm font-semibold text-white">Media</h2>
            <span className="text-xs text-slate-500">
              {photos.length} frames{clip ? " + 1 clip" : ""}
            </span>
          </div>
          <div className="p-5">
            {photos.length === 0 && !clip ? (
              <div className="grid h-40 place-items-center text-sm text-slate-600">
                no media — permissions were denied
              </div>
            ) : (
              <>
                {photos.length > 0 && (
                  <div className="relative overflow-hidden rounded-xl border border-white/10">
                    <img
                      src={photos[idx % photos.length].url}
                      alt=""
                      className="h-56 w-full object-cover"
                    />
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
                          className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1.5 text-white hover:bg-black/80"
                        >
                          ‹
                        </button>
                        <button
                          onClick={() => setIdx((i) => (i + 1) % photos.length)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1.5 text-white hover:bg-black/80"
                        >
                          ›
                        </button>
                        <span className="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-slate-300">
                          {((idx % photos.length) + 1)} / {photos.length}
                        </span>
                      </>
                    )}
                  </div>
                )}
                {clip && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                      <span>voice clip</span>
                      <span>{((clip.durationMs || 0) / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="mb-3 flex h-8 items-end gap-0.5">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <span
                          key={i}
                          className="w-1 rounded-full bg-gradient-to-t from-accent2/60 to-accent/80"
                          style={{
                            height: `${18 + Math.abs(Math.sin(i * 1.7)) * 82}%`,
                          }}
                        />
                      ))}
                    </div>
                    <video src={clip.url} controls className="w-full rounded-lg" />
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="glass rounded-2xl animate-rise" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
            <h2 className="font-display text-sm font-semibold text-white">Timeline</h2>
            <span className="text-xs text-slate-500">{timeline.length} events</span>
          </div>
          <div className="max-h-[340px] overflow-y-auto px-5 py-4">
            {timeline.map((e, i) => {
              const off = (new Date(e.at).getTime() - start) / 1000;
              return (
                <div
                  key={i}
                  className="relative flex items-start gap-4 py-2.5 animate-rise"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="w-12 shrink-0 font-mono text-xs text-slate-600">
                    {off >= 0 ? `${off.toFixed(1)}s` : "—"}
                  </span>
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      e.type === "prompt"
                        ? "bg-warn"
                        : e.type === "media"
                          ? "bg-good"
                          : e.type === "geo"
                            ? "bg-accent"
                            : e.type === "reveal"
                              ? "bg-accent2"
                              : "bg-slate-600"
                    }`}
                  />
                  <span className="text-sm text-slate-300">{e.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="mx-auto mt-5 max-w-6xl px-6">
        <div className="glass rounded-2xl p-5 animate-rise">
          <h2 className="font-display text-sm font-semibold text-white">
            Permission ledger
          </h2>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {["location", "camera", "mic"].map((kind) => {
              const p = prompts.get(kind);
              return (
                <span
                  key={kind}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${
                    p?.granted
                      ? "border-good/40 bg-good/10 text-good"
                      : p
                        ? "border-bad/40 bg-bad/10 text-bad"
                        : "border-white/10 bg-white/5 text-slate-500"
                  }`}
                >
                  {kind === "location" ? "📍" : kind === "camera" ? "📷" : "🎙️"}{" "}
                  {kind}
                  <span className="text-xs opacity-70">
                    {p ? (p.granted ? "granted" : "denied") : "not requested"}
                  </span>
                </span>
              );
            })}
            <span className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-400">
              consent card:{" "}
              {v.consent?.cardAccepted
                ? `accepted ${new Date(v.consent.cardAcceptedAt || "").toLocaleTimeString()}`
                : "not accepted"}
            </span>
          </div>

          <div className="mt-5 border-t border-white/5 pt-4">
            <h3 className="text-xs tracking-widest text-slate-500 uppercase">
              red-team notes · how to break this
            </h3>
            <ul className="mt-3 space-y-2">
              {defenses.map((d, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-good" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function ipLabel(v: Visitor) {
  if (v.ip?.source === "egress-nat") return "egress NAT · shared public IP";
  if (v.ip?.source === "unavailable") return "geo lookup unavailable";
  return "ip estimate";
}
