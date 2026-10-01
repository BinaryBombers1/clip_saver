# 04 — 5-Day roadmap

**Rule:** something that *runs* at the end of every day. Polish comes last.

---

## Day 1 — Skeleton that already tracks (MVP)
- [ ] Init monorepo: npm workspaces, `client/` (Vite + React + TS + Tailwind v4), `server/` (express + ts)
- [ ] Express: mongoose connect, `Visitor` model, `POST /api/sessions` (token + ip → ipapi geo)
- [ ] `/e/:token` page: session bootstrap + silent device fingerprint PATCH
- [ ] Landing page `/` v1 (hero + CTAs, dark theme)
- [ ] **EOD demo:** open link → `GET /api/sessions` shows IP, city, device. ✅

## Day 2 — Realtime + map (the dashboard appears)
- [ ] Socket.io on server + `visitor:update` / `feed:line` emits
- [ ] Dashboard v1: Leaflet dark map, visitor markers, live feed ticker
- [ ] Geo step: `getCurrentPosition` flow + success/deny branches + PATCH `/geo`
- [ ] Marker UX: IP-city circle (low accuracy) vs GPS accuracy ring
- [ ] **EOD demo:** two devices — phone grants GPS, dashboard pin snaps live. ✅

## Day 3 — Media pipeline (faces + voice)
- [ ] Camera step: getUserMedia, 3 canvas frames, upload via multer, static `/uploads`
- [ ] Voice clip: MediaRecorder 5s webm, waveform animation while recording
- [ ] Dashboard gallery: thumbnails → lightbox with device/geo side panel
- [ ] Consent logging (which prompts granted/denied) + graceful skip paths
- [ ] **EOD demo:** face appears on dashboard < 1s after capture. ✅

## Day 4 — Reveal, polish, defense (the product feel)
- [ ] Reveal screen: count-up metrics, data cards, "Delete my data" endpoint + UI
- [ ] Landing page finished: how-it-works, kill-chain cards, ethics footer
- [ ] Dashboard tabs: Map / Feed / Gallery / Data table / **Defense panel**
- [ ] Microcopy pass, animation pass, empty states, error toasts
- [ ] Fallback QA: deny-all-permissions path tested end-to-end
- [ ] **EOD demo:** full flow 3 min with a teammate playing judge. ✅

## Day 5 — Rehearse + harden (no new features)
- [ ] iOS Safari + Android Chrome + desktop Firefox test matrix (remember: HTTPS
      requirement — set up mkcert or tunnel for real phones)
- [ ] Load test: 5 concurrent sessions, reconnect logic, upload retry
- [ ] Pre-seed 3 fake visitors so dashboard is never empty (incl. one out-of-country pin)
- [ ] Record backup screen video of the whole flow (in case venue wifi dies)
- [ ] Rehearse the 3-minute pitch 3× to the choreography in `02-judge-strategy.md`
- [ ] Slides: escalation ladder (City → Street → Face → Voice) + wow metrics with REAL numbers

---

## Demo-day checklist (morning of)

- [ ] Dashboard open + projector resolution checked
- [ ] QR code + short URL printed large on slide
- [ ] Server running with `pm2`/nodemon detached (survives terminal close)
- [ ] Atlas reachable; local `uploads/` writable; disk has space
- [ ] Backup video + screenshots of dashboard on a USB stick
- [ ] Phone charged, tested link opened once (but not revealed yet)
- [ ] Delete-my-data demo rehearsed
- [ ] Team: one presenter (talks), one operator (dashboard), one "victim" volunteer

---

## Out of scope (explicitly — don't get tempted)

- Real CNIC/phone-number lookups (no legal data source — dropped idea)
- Any permission-prompt bypass or hidden capture
- User accounts / auth / multi-tenant
- Production deployment beyond a demo tunnel
- ML face recognition or voice transcription (would creep out judges, not impress)
