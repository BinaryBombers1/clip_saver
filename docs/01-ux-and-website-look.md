# 01 — How the website looks & the experience flow

## Visual direction

**Vibe:** premium cybersecurity product — not a hacker's ugly terminal, not a generic
bootstrap template. Think Linear.app meets CrowdStrike marketing page.

| Token | Value |
|---|---|
| Background | Near-black `#05060A` with subtle animated grid/particles |
| Surface | Glassmorphism cards `rgba(255,255,255,0.04)` + 1px `rgba(255,255,255,0.08)` borders |
| Accent | Electric cyan `#22D3EE` → violet `#8B5CF6` gradient |
| Success/data | Green `#34D399` (used for incoming-data ticks) |
| Font | `Space Grotesk` (headings) + `Inter` (body), both from Google Fonts |
| Motion | Framer-style entrances (fade + 12px rise), typewriter for terminal lines, count-up numbers |
| Status bar | Top of dashboard: live pulse dot "● LIVE" |

Dark + neon is on-theme (cybersec) and instantly screenshots well.

---

## Site map

```
/                              → Project landing (marketing + entry points)
/e/:token                      → THE EXPERIENCE (this is the link you share)
/dashboard                     → Live ops dashboard (projector view)
/dashboard/sessions            → Admin: all sessions, cinematic list
/dashboard/sessions/:token     → Admin: SESSION DOSSIER (cinematic detail)
```

---

## Screen flow — `/e/:token` (the money path)

```
┌──────────────────────────────────────────────────────────┐
│ STAGE 0 — SESSION (auto, ~1s)                            │
│ Spinner: "Establishing secure session…"                  │
│ Silent capture: IP → ISP/city, UA, screen, timezone…    │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 1 — CONSENT CARD                                   │
│ Title: "This experience uses your device sensors"        │
│ Chips: 📍 Location   📷 Camera   🎙️ Microphone           │
│ Body: "Your browser will ask for permission for each.    │
│        You'll see exactly what we collected at the end." │
│ Button: [ Continue ]          (small link: Demo project  │
│                                · data deleted after demo)│
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 2 — LOCATION                                       │
│ Copy: "Step 1 of 3 — Location"                           │
│ Sub:  "Tap allow so we can pin your exact position"      │
│ → browser prompt fires (native)                          │
│ On grant: quick toast "Locked · ±12m accuracy"           │
│ On deny: graceful skip (flow continues)                  │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 3 — CAMERA SNAP                                    │
│ Copy: "Step 2 of 3 — You're on camera"                   │>
│ Live self-view with cyber frame overlay                  │
│ "Say cheese — 3… 2… 1…" → 3 frames auto-captured        │
│ → browser prompt fires (native) for camera+mic           │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 4 — VOICE CLIP                                     │
│ Copy: "Step 3 of 3 — 5-second voice note"                │
│ Waveform animation while MediaRecorder runs 5s           │
│ (mic already granted in stage 3)                         │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 5 — ANALYZING (fake-terminal, ~2.5s, fun)           │
│ > resolving ip 82.x.x.x … done                          │
│ > fingerprint match: iPhone 14 · iOS 18 · Chrome 129     │
│ > triangulating … locked ±12m                            │
│ > media uploaded 3 frames + clip.webm                    │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 6 — REVEAL (the applause moment on the phone)      │
│ Count-up: "23 data points · 11 seconds · 1 link"         │
│ Cards fly in: your photo · your pin on mini-map ·        │
│ device · IP/ISP · screen · battery                      │
│ CTA: [ See it on the big screen → ]  (joins dashboard)   │
│ Ethical close: [ Delete my data ]                        │
└──────────────────────────────────────────────────────────┘
```

**Permission-denied fallbacks:** every stage has a graceful path (e.g., deny location →
show IP-based city instead with note "IP estimate: Lahore, ±25km"). The flow NEVER
breaks — judges may deny on purpose to test us.

---

## Landing page `/`

```
┌─────────────────────────────────────────────────┐
│ Echo               [Brief]  [Console]           │
├─────────────────────────────────────────────────┤
│                                                 │
│   ONE LINK.                                    │
│   THE WHOLE FOOTPRINT.      ← huge type,       │
│                              gradient text      │
│   See exactly what a single URL learns about   │
│   you — location, device, face, voice — in     │
│   under 15 seconds.                             │
│                                                 │
│   [ Try the live demo → ]  [ Open dashboard → ] │
│                                                 │
│   ── live strip: 142 sessions · 3.2k data points│
└─────────────────────────────────────────────────┘
        ↓ below the fold: "How it works" (4 steps)
        ↓ "The kill chain" (attack → defense cards)
        ↓ footer: ethics note + built-with stack
```

Landing is honest — it *says* what the tool does (judges read this). The surprise is
for the person who opens `/e/:token` unprepared.

---

## Dashboard `/dashboard` (projector view)

```
┌────────────────────────────────────────────────────────────┐
│ ● LIVE   Echo Console            visitors: 12  points: 308  │
├───────────────────────────────────┬────────────────────────┤
│                                   │  LATEST VISITOR        │
│        L E A F L E T   M A P      │  ┌──────────────────┐  │
│        dark tiles (CartoDB dark)  │  │ photo thumbnail  │  │
│        ● ● pulsing visitor pins   │  │ iPhone 14 · iOS  │  │
│        accuracy rings around GPS  │  │ 82.x.x · StormFbr│  │
│                                   │  │ ±12m · 51.5074N  │  │
│                                   │  └──────────────────┘  │
├───────────────────────────────────┴────────────────────────┤
│ FEED (socket.io, newest top):                              │
│ 12:04:11 ⚡ new session 82.117.x.x → Lahore, PK            │
│ 12:04:14 📍 geo locked ±12m (31.55, 74.34)                 │
│ 12:04:17 📷 3 frames uploaded · clip.webm 4.8s             │
├────────────────────────────────────────────────────────────┤
│ [ Media gallery ]  [ Data table ]  [ Defense panel ]       │
└────────────────────────────────────────────────────────────┘
```

- Map: **Leaflet** + CartoDB dark raster tiles (no API key needed).
- New visitor = marker drops with bounce animation + feed line + sound blip (optional).
- Media gallery tab: grid of faces, click → lightbox with device/geo side panel.
- Defense tab: for each captured data class → "why it worked / how to stop it".

---

## Admin — session list `/dashboard/sessions`

Table reimagined as a **cinema roll**: each session is a wide card, newest on top,
auto-scrolling when live.

```
┌──────────────────────────────────────────────────────────────┐
│ ◉ 142 SESSIONS                                   filter ▾   │
├──────────────────────────────────────────────────────────────┤
│ ▸ [face] 82.117.x.x · Lahore     iPhone 14 · Safari  GPS±12m│
│          23 pts · 11s · 3 photos + clip      12:04:11  ●LIVE│
├──────────────────────────────────────────────────────────────┤
│ ▸ [face] 110.54.x.x · Karachi    Pixel 8 · Chrome    GPS±9m │
│          19 pts · 9s · 2 photos            12:03:47         │
├──────────────────────────────────────────────────────────────┤
│ ▸ [◐ no photo] 203.x.x.x · London  Firefox · Win11  IP-only │
│          8 pts · location denied              12:01:02      │
└──────────────────────────────────────────────────────────────┘
```

- Left color-rail encodes capture depth: grey=IP only → blue=geo → cyan=media.
- Hover: mini-map preview chip + data-point count ticks up.
- Click → dossier.

## Admin — SESSION DOSSIER `/dashboard/sessions/:token` (cinematic detail)

Full-screen dark page, film-title energy. This is where we show "every piece of info
on one session" in a modern, cinematic way.

```
┌──────────────────────────────────────────────────────────────┐
│ ← back                    SESSION 7f3a91c2       [DELETE]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   HERO — visitor photo full-bleed, slow Ken-Burns zoom,      │
│   gradient scrim, big count-up: "23 DATA POINTS · 11s"      │
│   name-line: device + browser, animated in                  │
│                                                              │
├───────────────────────┬──────────────────────────────────────┤
│ MAP PANEL             │  IDENTITY PANEL                      │
│ Leaflet dark, accuracy│  IP · ISP · ASN · city/country       │
│ ring pulsing around   │  UA · OS · screen · dpr · language   │
│ GPS pin, IP circle    │  timezone · cores · memory · battery │
│ as ghost behind       │  connection (4g/3g, rtt)             │
├───────────────────────┼──────────────────────────────────────┤
│ MEDIA STRIP           │  TIMELINE                            │
│ photo carousel with   │  0.0s session opened (ip recon)      │
│ frame-step anim,      │  1.2s device fingerprinted           │
│ clip player with      │  3.4s consent accepted               │
│ waveform scrubber     │  4.1s location ±12m (gps)            │
│                       │  6.8s 3 frames uploaded              │
│                       │  9.9s voice clip 4.8s                │
│                       │ 11.0s reveal shown · data exported   │
├───────────────────────┴──────────────────────────────────────┤
│ PERMISSIONS ROW — 📍granted  📷granted  🎙️granted  (+when)  │
│ DEFENSE NOTE — "GPS gave street level. Fix: deny by default."│
└──────────────────────────────────────────────────────────────┘
```

Cinematic rules for this page:
- Section entrance: fade + rise on scroll (IntersectionObserver), 80ms stagger.
- Numbers always count-up; timeline types itself in line-by-line.
- Photo hero uses subtle zoom (CSS transform 20s ease loop).
- One accent color per capture depth (grey → blue → cyan) drives rails/glow.
- Delete button = red outline → confirm dialog → wipes files + row → toast.

---

## Microcopy rules

- **Playful-confident, never sinister.** We're the good guys demonstrating the attack.
  ("We did this with your permission. Most links don't ask.")
- **No threatening language** ("we know where you live" ❌ → "±12m from your phone" ✅).
- Consent card and reveal always mention: demo project · data can be deleted.
