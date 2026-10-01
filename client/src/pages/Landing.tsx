import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { post } from "../lib/api";
import CaptureEngine from "../components/CaptureEngine";
import MenuButton from "../components/MenuButton";

const PLATFORMS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Facebook",
  "X / Twitter",
  "Snapchat",
];

const STEPS = [
  { n: "01", t: "Paste the link", d: "Copy any Reel, TikTok or Short URL and drop it into the box." },
  { n: "02", t: "Choose quality", d: "MP4 in 1080p / 720p, or rip just the audio as an MP3." },
  { n: "03", t: "Save to device", d: "One tap and the file lands in your downloads folder. That's it." },
];

export default function Landing() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [link, setLink] = useState("https://www.instagram.com/reel/CxYz123AbCd/");
  const [format, setFormat] = useState("MP4 · 1080p");
  const tokenRef = useRef<string | null>(null);

  const ensureToken = async (): Promise<string> => {
    if (tokenRef.current) return tokenRef.current;
    const s = await post<{ token: string }>("/api/sessions");
    tokenRef.current = s.token;
    setToken(s.token);
    return s.token;
  };

  useEffect(() => {
    ensureToken().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const download = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const t = await ensureToken();
      nav(`/e/${t}`);
    } catch {
      alert("Could not reach the server — is it running? (npm run dev)");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg">
      {token && <CaptureEngine token={token} onChange={() => {}} />}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 sm:py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-lg">
            🎬
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            ClipSaver
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a href="#how" className="text-slate-400 hover:text-white transition">
            How it works
          </a>
          <Link to="/brief" className="text-slate-400 hover:text-white transition">
            Project brief
          </Link>
          <Link
            to="/login"
            className="rounded-lg glass px-4 py-2 text-slate-200 hover:border-accent/40 transition"
          >
            Console
          </Link>
        </nav>
        <MenuButton
          items={[
            { label: "How it works", href: "#how" },
            { label: "Project brief", to: "/brief" },
            { label: "Console", to: "/login" },
          ]}
        />
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-10 pb-16 text-center sm:px-6 sm:pt-14 sm:pb-20">
        <div className="mx-auto mb-6 w-fit rounded-full border border-good/30 bg-good/5 px-4 py-1.5 text-xs font-medium tracking-widest text-good uppercase">
          100% free · no signup · no ads
        </div>
        <h1 className="font-display mx-auto max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-7xl">
          DOWNLOAD ANY VIDEO.
          <br />
          <span className="gradient-text">INSTAGRAM · TIKTOK · YOUTUBE.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-slate-400 sm:text-lg">
          Paste a link, pick your quality, save it to your device — straight from
          the browser, in seconds.
        </p>

        <div className="mx-auto mt-9 max-w-2xl glass rounded-2xl p-5 text-left">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Paste video link…"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:border-accent/50 focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {["MP4 · 1080p", "MP4 · 720p", "MP3 · audio"].map((f) => (
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
            <button
              onClick={download}
              disabled={busy}
              className="mt-1 w-full rounded-lg bg-gradient-to-r from-accent to-accent2 px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-60 sm:mt-0 sm:ml-auto sm:w-auto sm:py-2"
            >
              {busy ? "Starting…" : "Download ↓"}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <span
                key={p}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-slate-500">
          <span>
            <b className="text-slate-300">4.2M</b> videos saved
          </span>
          <span className="text-slate-700">·</span>
          <span>
            <b className="text-slate-300">128</b> countries
          </span>
          <span className="text-slate-700">·</span>
          <span>
            <b className="text-slate-300">12s</b> average wait
          </span>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="font-display text-3xl font-semibold text-white">
          How it works
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="glass rounded-2xl p-6 animate-rise"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="font-display text-sm font-bold text-accent">{s.n}</div>
              <div className="mt-3 font-display text-lg font-semibold text-white">{s.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="glass flex flex-col items-center gap-6 rounded-3xl p-6 text-center md:flex-row md:p-10 md:text-left">
          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold text-white md:text-2xl">
              Grab your first video — it takes about 12 seconds.
            </h2>
            <p className="mt-3 text-sm text-slate-400 md:text-base">
              No account, no limits, works on phone and desktop.
            </p>
          </div>
          <button
            onClick={download}
            disabled={busy}
            className="w-full shrink-0 rounded-xl bg-gradient-to-r from-accent to-accent2 px-7 py-3.5 font-semibold text-ink transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
          >
            {busy ? "Starting…" : "Download now ↓"}
          </button>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            ClipSaver is a hackathon awareness demo — every capture runs through
            the browser's native permission prompts, and participants can delete
            their data at the end.
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <button
              onClick={() => token && nav(`/e/${token}`)}
              className="underline hover:text-slate-300 transition"
            >
              Data & privacy
            </button>
            <span>React</span>
            <span>Express</span>
            <span>Socket.io</span>
            <span>MongoDB</span>
            <span>Leaflet</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
