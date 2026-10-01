export default function Brief() {
  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <a href="/" className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-lg border border-accent/40 grid place-items-center">
              <span className="h-3 w-3 rounded-full bg-accent" />
            </span>
            <span className="font-display font-semibold text-white">Echo</span>
          </a>
          <a href="/login" className="text-sm text-slate-500 hover:text-white">
            operator console →
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="text-xs font-medium tracking-widest text-accent uppercase">
          for judges · project brief
        </div>
        <h1 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">
          The permission-based phishing simulation
        </h1>
        <p className="mt-4 max-w-3xl text-slate-400">
          Echo looks like a moment-capsule app. Under the hood it is a full
          red-team exercise: one link runs the entire kill chain — recon,
          fingerprint, geolocation, visual/audio capture — end to end, realtime,
          with native browser prompts, a victim-facing reveal and a delete
          button. The operator console is admin-gated.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            { k: "1", v: "link" },
            { k: "23+", v: "data points" },
            { k: "±12m", v: "gps accuracy" },
            { k: "0", v: "exploits used" },
          ].map((m) => (
            <div key={m.v} className="glass rounded-2xl p-5 text-center">
              <div className="font-display text-3xl font-bold text-accent">
                {m.k}
              </div>
              <div className="mt-1 text-xs tracking-wider text-slate-500 uppercase">
                {m.v}
              </div>
            </div>
          ))}
        </div>

        <h2 className="font-display mt-12 text-2xl font-semibold text-white">
          Kill chain → defense
        </h2>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/8">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-white/[0.03] text-left text-xs tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3">phase</th>
                <th className="px-5 py-3">what the app does</th>
                <th className="px-5 py-3">how to break it</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Recon", "IP, ISP, city from the request alone", "VPN/Tor changes your public story"],
                ["Enumeration", "JS reads OS, screen, timezone, battery, hardware", "Updated browser + reduced fingerprint modes"],
                ["Delivery", "One shared link — no malware", "Inspect short URLs; curiosity is the exploit"],
                ["Collection", "After native prompts: GPS ±accuracy, face, voice", "Deny by default; grant per-session"],
                ["Consolidation", "Everything joins one live profile on the dashboard", "Assume granted permissions are realtime-observable"],
                ["Debrief", "Visitor is shown everything + can delete it", "Permission fatigue is the real attack"],
              ].map((r) => (
                <tr key={r[0]} className="border-t border-white/5">
                  <td className="px-5 py-3.5 font-medium text-white">{r[0]}</td>
                  <td className="px-5 py-3.5 text-slate-400">{r[1]}</td>
                  <td className="px-5 py-3.5 text-good">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="font-display mt-12 text-2xl font-semibold text-white">
          Demo choreography
        </h2>
        <ol className="mt-5 space-y-3 text-slate-300">
          {[
            "Open the console (login) on the projector — map + feed ready.",
            "Audience opens the shared /e/:token link on their phones.",
            "Pins snap live on the map as they grant location.",
            "Their face appears in the gallery — pause for effect.",
            "The reveal fires on their phones: count-up + delete button.",
            "Open a dossier: identity graph, timeline, permission ledger, defense notes.",
          ].map((s, i) => (
            <li key={i} className="flex gap-4">
              <span className="font-display shrink-0 text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              {s}
            </li>
          ))}
        </ol>

        <div className="glass mt-12 rounded-2xl p-6 text-sm leading-relaxed text-slate-400">
          <b className="text-white">Ethics line:</b> every camera / microphone /
          location capture goes through the browser's native permission prompt —
          nothing is bypassed, nothing is hidden from the browser. Visitors get a
          full reveal and a working delete button. Dashboard access requires admin
          credentials. Demo use only.
        </div>
      </main>
    </div>
  );
}
