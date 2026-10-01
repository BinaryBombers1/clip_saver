# Echo (working name: LinkLens) — Project Plan

**One link. The whole footprint.**
A consent-based phishing-awareness demo: a visitor opens a link, grants normal browser
permissions, and every piece of data they exposed is captured, stored, and visualized
live — then revealed back to them.

> Hackathon goal: beat every "IP grabber" project in the room by being **realtime,
> full-stack, visually stunning, and ethically clean**.

---

## What we are building

| Page | URL | Who sees it |
|---|---|---|
| Project landing | `/` | Judges, visitors, anyone |
| Experience (the shared link) | `/e/:token` | Whoever opens the link |
| Live ops dashboard | `/dashboard` | Judges (projector) + us |
| Reveal screen | inside `/e/:token` (final stage) | The visitor, at the end |
| Admin session list | `/dashboard/sessions` | Us (operator view) |
| Admin session dossier (cinematic) | `/dashboard/sessions/:token` | Us — full detail on one session |

**Data captured (all after normal browser permission prompts):**
- IP + IP-based geolocation, ISP/ASN (server-side, no prompt needed — every site has this)
- Device/browser fingerprint (UA, OS, screen, language, timezone, battery, touch, hardware)
- Precise GPS location (`navigator.geolocation` — browser prompt)
- Photo frames + short video clip with voice (`getUserMedia` — browser prompt)
- Timestamps, consent log, connection type

**Stored in:** MongoDB Atlas (metadata) + server disk/Atlas GridFS (media).

---

## Hard rules (agreed boundaries — do not violate)

1. **Every camera / mic / location access goes through the browser's native permission
   prompt.** No bypass tricks, no hidden capture, no auto-grant fantasy. Browsers don't
   allow it and we don't want it.
2. **No false pretexts.** The camera step is honestly framed (a photo/snap moment).
   Never fake a quiz, reward, captcha, or QR scan to trick a grant.
3. **Every visitor gets a Reveal at the end** showing exactly what was collected,
   plus a **"Delete my data"** button.
4. **Demo use only** — shared with judges/participants who know it's a demo project.
   No stealth deployment against strangers.

These rules are also our **pitch**: we show the attack *and* the ethics. That's what
separates a senior red teamer from a script kiddie.

---

## Files

- `01-ux-and-website-look.md` — visual design, screen-by-screen flow, wireframes, microcopy
- `02-judge-strategy.md` — demo choreography, kill-chain narrative, wow metrics, Q&A prep
- `03-architecture.md` — stack, folder structure, data model, API, realtime, media pipeline
- `04-5-day-roadmap.md` — day-by-day build plan + demo-day checklist
