# 02 — Judge strategy (how we win)

## The positioning

Everyone at a hackathon builds: "enter a number → shows fake data" or "my link shows
your IP". We build the only project that feels like a **real red-team operation**:

> *"We simulated the full phishing kill-chain — recon, fingerprint, geolocation,
> visual/audio capture — end to end, in real time, with consent, and we give the
> victim their data back."*

Three sentences. Memorize them. That's the pitch spine.

---

## Why judges score us higher than "link tracker" projects

| Script kiddie project | Our project |
|---|---|
| Static result page | **Realtime** — dashboard updates as they watch |
| IP + city only | IP **+ GPS ±accuracy + fingerprint + face + voice** |
| One person, one screen | Many visitors, **map, feed, gallery** |
| Ugly form | **Polished product-grade UI** |
| "haha got your IP" | **Kill-chain narrative + defense panel + delete button** |
| Prototype | **Full stack: React + Express + Socket.io + Atlas** |

---

## Demo choreography (3 minutes — rehearse this)

**Setup:** dashboard open on projector BEFORE the pitch. A pre-seeded visitor already
on the map so it never looks empty.

1. **(0:00) Hook:** "Everyone, take out your phones. Open the link on screen."
   (QR code + short URL visible — `lens.local/e/7f3a…`)
2. **(0:15) They open it.** Projector: feed line `⚡ new session` pops, pin drops on
   the map. **First reaction beat.**
3. **(0:30)** Judge grants location → on the projector, the pin *snaps* from IP-city
   circle to an accuracy ring ±12m. "City-level… now street-level. Because they
   pressed Allow."
4. **(1:00)** Judge takes the camera snap → **their face appears on the big screen.**
   This is the applause moment. Pause. Let it land.
5. **(1:30)** Voice clip waveform → gallery card lands with device + ISP info.
6. **(2:00)** On their phone, the **Reveal screen** fires: "23 data points in 11
   seconds." Judge sees what *they* gave away.
7. **(2:30)** Pivot to **defense panel**: "Here's each thing, why it worked, and how
   you stop it." + **Delete my data** button pressed live.
8. **(2:45)** Close: "Zero exploits. One link. Full permission — that's the trick:
   phishing doesn't need malware anymore."

---

## Kill-chain narrative (our "senior red teamer" frame)

Map the demo onto a real attack lifecycle (ATT&CK-flavored, but we keep it plain-English):

| Phase | What our app does | Data class |
|---|---|---|
| **Recon** | HTTP request alone | IP, ISP/ASN, city, language |
| **Enumeration** | Passive JS probes | OS, browser, screen, battery, timezone, hardware |
| **Delivery** | The link itself | session token |
| **Collection** | After native prompts | GPS ±accuracy, camera frames, voice clip |
| **Consolidation** | Atlas + feed | full profile joined on one token |
| **Reveal / Debrief** | Victim-facing screen | education + deletion |

Defense column for each phase (goes on the landing page AND dashboard "Defense" tab):

- Recon → VPN/Tor changes IP story; nothing you can do, sites always see IP.
- Enumeration → keep browser updated; fingerprinting shrinks with reduced-UA mode.
- Geolocation → deny by default; grant per-session, revoke in site settings.
- Camera/mic → treat the prompt like someone pointing a lens at you; deny unfamiliar sites.
- General → the tell is always **permission fatigue** — a link should rarely need all three.

---

## Wow-metric language (use exact numbers on slides)

- **"1 link → 23 data points → 11 seconds"** (measure real numbers on demo day, replace)
- **"±12 meters"** (actual GPS accuracy from the judge's phone)
- **"0 exploits, 0 malware, 100% browser-native permissions"**
- **"City (IP) → Street (GPS) → Face (camera) → Voice (mic)"** — the escalation ladder,
  great as a slide with 4 thumbnails.

---

## Q&A prep (they WILL ask these)

**Q: Isn't this illegal / stalkerware?**
A: "Every sensitive capture goes through the browser's own permission prompt — we
bypass nothing. The visitor gets a full reveal and a delete button, it's an awareness
demo run with consenting participants. The scary part isn't our app — it's that the
legitimate, permission-based path already gives all this away."

**Q: What's the real-world relevance?**
A: Permission-fatigue phishing + social engineering outscore malware in real incidents;
this makes an invisible risk visible in 11 seconds.

**Q: Could you do this without permission?**
A: No — precise GPS and camera are hard-gated by browser vendors on HTTPS origins.
We'll say this proudly: the platform defends the last line, users defeat it by pressing Allow.

**Q: How hard is the tech?**
A: Point at architecture doc — Socket.io realtime fan-out, multipart media pipeline,
fingerprint graph, Atlas joins, degrade paths on permission denial.

**Q: Where's the data go / privacy?**
A: Atlas + local media store, demo-only retention, delete endpoint wipes both.

---

## Scoring-criteria mapping

- **Innovation:** not the idea of tracking — the *realtime full-stack orchestration + reveal UX*.
- **Technical depth:** 4 services (React, Express, WS, Atlas), media pipeline, geolocation math.
- **Impact/ethics:** awareness framing, delete button, defense panel.
- **Presentation:** projector dashboard + face-on-screen moment + exact wow-metrics.

---

## Anti-fragility checklist (things judges try to break)

- [ ] Judge **denies** every permission → flow still completes with IP-based fallbacks
- [ ] Judge opens on **desktop without GPS** → browser asks, or falls back to IP; show it gracefully
- [ ] Judge opens **3 phones at once** → dashboard handles concurrent sockets
- [ ] Wi-Fi flaky at venue → pre-seed demo data + local dev Atlas ping; media retries upload
- [ ] Someone asks "does it work on iPhone Safari" → tested iOS Safari path (getUserMedia needs HTTPS — for local demo, use `mkcert` or tunnel)
