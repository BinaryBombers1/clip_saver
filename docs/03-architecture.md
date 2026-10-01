# 03 — Architecture

## Stack (locked)

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Vite + React 19 + Tailwind v4 + TypeScript** | SPA, client-heavy app (permissions/media), no SSR needed |
| API | **Node.js + Express + TypeScript** | Simple media upload, Socket.io host |
| Realtime | **Socket.io** | Live dashboard fan-out |
| DB | **MongoDB Atlas (free M0)** | Metadata + optional GridFS for media |
| Media files | **Local `server/uploads/`** (dev/demo), GridFS/S3 optional later | Atlas free tier = 512MB, video blows it fast |
| Map | **Leaflet + CartoDB dark tiles** | No API key, dark theme free |
| IP geo | **ipapi.co** (server-side, on `req.ip`) | No key for low volume |
| Media capture | **canvas.captureStream / ImageCapture** (frames) + **MediaRecorder** (webm+opus = video+voice) | Browser-native, one prompt covers camera+mic |

**Important:** camera/geolocation APIs require **secure context** (HTTPS or localhost).
Demo options: localhost dev, or `mkcert` local cert, or a tunnel (cloudflared/ngrok)
for phone-on-venue-wifi testing.

---

## Repo structure (monorepo, npm workspaces)

```
hackaton/
├─ docs/                      ← this plan
├─ package.json               ← workspaces: ["client","server"]
├─ client/                    ← Vite + React SPA
│  ├─ index.html
│  ├─ vite.config.ts          ← dev proxy: /api, /uploads, /socket.io → :4000
│  └─ src/
│     ├─ main.tsx, App.tsx    ← router: /, /e/:token, /dashboard, /dashboard/sessions(/:token)
│     ├─ index.css            ← tailwind v4 theme + animations
│     ├─ pages/               ← Landing, Experience, Dashboard, Sessions, Dossier
│     ├─ components/          ← ConsentCard, CameraStep, Reveal, MapPanel, CountUp, Feed
│     └─ lib/                 ← api.ts, socket.ts, fingerprint.ts, types.ts
└─ server/                    ← Express API + static hosting
   ├─ src/
   │  ├─ index.ts             ← express + socket.io + static /uploads + serves client/dist
   │  ├─ routes/sessions.ts
   │  ├─ db.ts                ← mongoose (Atlas or in-memory fallback)
   │  ├─ models/Visitor.ts
   │  ├─ serialize.ts         ← points + durationMs computation
   │  └─ ipGeo.ts             ← ipapi.co wrapper + cache
   └─ uploads/                ← gitignored media files
```

Ports: client `:3000` (Vite dev, proxies API), server `:4000`.
**Single origin in production:** Express serves `client/dist` + API + uploads + sockets
on `:4000` — no CORS, no env vars on the client (all paths relative).

---

## Data model (mongoose)

```ts
// models/Visitor.ts
{
  token:    string,          // shareable id for /e/:token
  createdAt: Date,
  consent: {
    location: boolean, camera: boolean, mic: boolean,
    cardAcceptedAt: Date, prompts: [{ kind: string, granted: boolean, at: Date }]
  },
  ip: {
    addr: string, city?, region?, country?, lat?, lon?,
    isp?, asn?, org?          // from ipapi.co
  },
  device: {
    userAgent?, browser?, os?, device?,          // ua-parser-js
    screen?: { w, h, dpr, colorDepth },
    language?, timezone?, timezoneOffset?,
    touchPoints?, cores?, memory?, platform?,
    connection?: { effectiveType, downlink, rtt },
    battery?: { level, charging },
    fingerprintHash?: string                     // optional canvas hash (stretch)
  },
  geo: {
    lat?, lon?, accuracy?, altitude?, speed?,
    method: 'gps' | 'ip' | 'none'
  },
  media: [{
    kind: 'photo' | 'clip',
    filename, url, bytes?, durationMs?,
    width?, height?, capturedAt
  }],
  revealedAt?: Date,
  deletedAt?: Date           // soft-delete via "Delete my data"
}
```

---

## API surface

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/sessions` | create session → `{ token }`; server records `req.ip` → ipapi |
| `PATCH` | `/api/sessions/:token/device` | merge device fingerprint JSON |
| `PATCH` | `/api/sessions/:token/geo` | precise coords + accuracy; compute fallback flag |
| `POST` | `/api/sessions/:token/media` | multer multipart (`photo` \| `clip`) → `uploads/` |
| `POST` | `/api/sessions/:token/consent` | record prompt outcomes + reveal timestamp |
| `DELETE` | `/api/sessions/:token` | wipe media files + soft-delete record |
| `GET` | `/api/sessions` | dashboard list (newest first, media populated) |
| `GET` | `/api/sessions/:token` | single session (admin dossier view) |
| `GET` | `/uploads/:file` | static media (express.static) |
| WS | event `visitor:update` | server → dashboard on every mutation |
| WS | event `feed:line` | one-line activity for the ticker |

Rate-limit session creation (e.g., 10/min/IP) so a bored judge can't spam it.

---

## Client pipeline (`/e/:token`)

```
mount → POST /sessions (get token from URL)      // sets fetch credentials
      → collectDevice() → PATCH /device          // pure JS, no prompt
      → consent card accepted → PATCH /consent
      → geoStep: navigator.geolocation.getCurrentPosition({enableHighAccuracy:true})
                 success → PATCH /geo {lat,lon,accuracy}
                 error   → keep geo.method='ip' (graceful)
      → cameraStep: getUserMedia({video, audio})
                 3× canvas snapshot → POST /media (photo)
      → clipStep: MediaRecorder(stream, {mimeType:'video/webm;codecs=vp8,opus'})
                 5s → POST /media (clip)
      → analyzing animation (client-side only)
      → reveal: GET /sessions/:token (or reuse local state) → count-up
      → delete button → DELETE /sessions/:token
```

Every PATCH/POST fires `socket.emit` server-side → dashboard re-renders instantly.

**Failure policy:** each step wrapped try/catch; denial/timeouts mark the step
"skipped" and the flow continues. The reveal always shows what actually succeeded
(honest counts — never claim data we didn't get).

---

## Security / hygiene (baked in from day 1)

- Tokens are 12-hex random, non-sequential, no PII in URLs.
- Helmet + CORS locked to web origin; JSON body limit ~1MB, upload limit ~15MB.
- Uploads validated by mimetype whitelist (`image/jpeg|webp`, `video/webm`) + generated filenames (no user-controlled paths).
- `.env` gitignored: `MONGODB_URI`, `PORT`, `WEB_ORIGIN`.
- README ethics note + "demo only" disclaimer.
- Soft-delete wipes files from disk, not just the DB flag.

---

## External services quick refs (no keys needed)

- Map tiles: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` (Leaflet, attribution required)
- IP geo: `https://ipapi.co/json/` (rate-limited; fallback `http://ip-api.com/json/<ip>` — free tier is HTTP-only, keep it server-side only)
- UA parse: `ua-parser-js` (small, no network)
