import express from "express";
import type { Request, Response, NextFunction } from "express";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import helmet from "helmet";
import { Server } from "socket.io";
import { connectDb } from "./db";
import { sessionsRouter } from "./routes/sessions";
import { authRouter, verifyToken } from "./auth";
import { Visitor } from "./models/Visitor";
import { MediaFile } from "./mediaStore";
import { lookupIp } from "./ipGeo";
import { serialize } from "./serialize";

const PORT = Number(process.env.PORT || 4000);

const ALLOW = (process.env.WEB_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const LAN_OK =
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

function originAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  return ALLOW.includes(origin) || LAN_OK.test(origin);
}

async function main() {
  const app = express();
  app.set("trust proxy", true);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          "default-src": ["'self'"],
          "base-uri": ["'self'"],
          "object-src": ["'none'"],
          "script-src": ["'self'"],
          "script-src-attr": ["'none'"],
          "style-src": ["'self'", "https:", "'unsafe-inline'"],
          "font-src": ["'self'", "https:", "data:"],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "https://server.arcgisonline.com",
            "https://*.tile.openstreetmap.org",
          ],
          "media-src": ["'self'", "blob:"],
          "connect-src": ["'self'", "ws:", "wss:"],
          "frame-ancestors": ["'self'"],
          "form-action": ["'self'"],
        },
      },
    })
  );
  app.use((_req, res, next) => {
    res.setHeader(
      "Permissions-Policy",
      "camera=(self), microphone=(self), geolocation=(self)"
    );
    next();
  });
  app.use(
    cors({
      origin: (origin, cb) => cb(null, originAllowed(origin)),
      credentials: false,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  const UPLOADS = path.resolve(process.cwd(), "uploads");
  fs.mkdirSync(UPLOADS, { recursive: true });

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/uploads/:fn", async (req, res) => {
    const fn = path.basename(req.params.fn || "");
    if (!/^[a-zA-Z0-9._-]+$/.test(fn)) {
      res.status(404).json({ error: "not found" });
      return;
    }
    try {
      const doc = await MediaFile.findOne({ filename: fn });
      if (doc?.data?.length) {
        res.setHeader("Content-Type", doc.contentType || "application/octet-stream");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.send(doc.data);
        return;
      }
    } catch (e) {
      console.error("[uploads]", e);
    }
    const legacy = path.join(UPLOADS, fn);
    if (fs.existsSync(legacy)) {
      res.sendFile(legacy);
      return;
    }
    res.status(404).json({ error: "not found" });
  });
  app.use("/api/auth", authRouter);
  app.use("/api/sessions", sessionsRouter);

  const DIST = path.resolve(process.cwd(), "../client/dist");
  if (fs.existsSync(DIST)) {
    app.use(
      express.static(DIST, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
        },
      })
    );
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
        res.status(404).json({ error: "not found" });
        return;
      }
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(path.join(DIST, "index.html"));
    });
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[api]", err);
    res.status(err.status || 500).json({ error: err.message || "server error" });
  });

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: (origin: string | undefined, cb: (e: Error | null, allow?: boolean) => void) =>
        cb(null, originAllowed(origin)),
    } as any,
  });
  io.use((socket, next) => {
    const t = socket.handshake.auth?.token;
    if (!verifyToken(typeof t === "string" ? t : null)) {
      return next(new Error("unauthorized"));
    }
    next();
  });
  app.set("io", io);

  await connectDb();
  server.listen(PORT, () => {
    console.log(`[api] Echo server → :${PORT}`);
    repairIpGeo(io).catch((e) => console.warn("[repair]", e));
  });
}

async function repairIpGeo(io: Server) {
  const docs = await Visitor.find({ deletedAt: null, "ip.lat": null }).limit(300);
  for (const doc of docs) {
    if (doc.geo?.method === "gps" && typeof doc.geo?.lat === "number") continue;
    const info = await lookupIp(doc.ip?.addr || "");
    if (typeof info.lat !== "number") continue;
    doc.ip = { ...(doc.ip?.toObject?.() || doc.ip), ...info };
    await doc.save();
    io.emit("visitor:update", serialize(doc));
    console.log(`[repair] ${doc.token} → ${info.city || "?"} (${info.source})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
