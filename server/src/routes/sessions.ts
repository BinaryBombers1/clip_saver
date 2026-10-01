import { Router, Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { Visitor } from "../models/Visitor";
import { MediaFile } from "../mediaStore";
import { serialize } from "../serialize";
import { lookupIp } from "../ipGeo";
import { requireAdmin } from "../auth";

const ah =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/webm",
  "video/mp4",
]);

const baseMime = (m: string) => (m || "").split(";")[0].trim().toLowerCase();

const extFor = (mime: string): string =>
  mime === "video/webm"
    ? "webm"
    : mime === "video/mp4"
      ? "mp4"
      : mime === "image/png"
        ? "png"
        : mime === "image/webp"
          ? "webp"
          : "jpg";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED.has(baseMime(file.mimetype))),
});

export const sessionsRouter = Router();

const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 20;
}

function emit(
  req: Request,
  doc: any,
  feed?: { text: string; kind: string }
) {
  const io = req.app.get("io");
  if (!io) return;
  io.emit("visitor:update", serialize(doc));
  if (feed) io.emit("feed:line", { ...feed, at: new Date().toISOString() });
}

function pushEvent(doc: any, type: string, label: string) {
  doc.events.push({ type, label, at: new Date() });
}

async function ensure(req: Request, token: string) {
  let doc = await Visitor.findOne({ token });
  if (doc) {
    if (!doc.ip || !doc.ip.addr) {
      doc.ip = await lookupIp(req.ip || "");
    }
    return doc;
  }
  const info = await lookupIp(req.ip || "");
  doc = await Visitor.create({
    token,
    startedAt: new Date(),
    ip: info,
    events: [
      { type: "open", label: `session opened — recon ${info.addr}`, at: new Date() },
    ],
  });
  emit(req, doc, {
    text: `new session ${info.addr} → ${info.city || "unknown city"}`,
    kind: "open",
  });
  return doc;
}

sessionsRouter.get(
  "/stats",
  ah(async (_req, res) => {
    const docs = await Visitor.find({ deletedAt: null }).lean();
    let points = 0;
    let media = 0;
    for (const d of docs) {
      points += serialize(d).points;
      media += d.media?.length || 0;
    }
    res.json({ sessions: docs.length, points, media });
  })
);

sessionsRouter.get(
  "/",
  requireAdmin,
  ah(async (_req, res) => {
    const docs = await Visitor.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(docs.map(serialize));
  })
);

sessionsRouter.get(
  "/public/:token",
  ah(async (req, res) => {
    const doc = await Visitor.findOne({
      token: req.params.token,
      deletedAt: null,
    });
    if (!doc) {
      res.status(404).json({ error: "session not found" });
      return;
    }
    res.json(serialize(doc));
  })
);

sessionsRouter.get(
  "/:token",
  requireAdmin,
  ah(async (req, res) => {
    const doc = await Visitor.findOne({
      token: req.params.token,
      deletedAt: null,
    });
    if (!doc) {
      res.status(404).json({ error: "session not found" });
      return;
    }
    res.json(serialize(doc));
  })
);

sessionsRouter.post(
  "/",
  ah(async (req, res) => {
    if (rateLimited(req.ip || "")) {
      res.status(429).json({ error: "too many sessions" });
      return;
    }
    const token = crypto.randomBytes(6).toString("hex");
    const doc = await ensure(req, token);
    res.json(serialize(doc));
  })
);

sessionsRouter.patch(
  "/:token/device",
  ah(async (req, res) => {
    const doc = await ensure(req, req.params.token);
    doc.device = req.body || {};
    if (!doc.startedAt) doc.startedAt = new Date();
    pushEvent(
      doc,
      "device",
      `device fingerprinted — ${doc.device.os || "?"} · ${doc.device.browser || "?"}`
    );
    await doc.save();
    emit(req, doc, {
      text: `fingerprint ${doc.device.os || "?"} · ${doc.device.browser || "?"}`,
      kind: "device",
    });
    res.json(serialize(doc));
  })
);

sessionsRouter.patch(
  "/:token/geo",
  ah(async (req, res) => {
    const doc = await ensure(req, req.params.token);
    const { lat, lon, accuracy, altitude, speed, method } = req.body || {};
    const gps = method === "gps" && typeof lat === "number" && typeof lon === "number";
    doc.geo = {
      lat: gps ? lat : undefined,
      lon: gps ? lon : undefined,
      accuracy: gps && typeof accuracy === "number" ? accuracy : undefined,
      altitude: gps && typeof altitude === "number" ? altitude : undefined,
      speed: gps && typeof speed === "number" ? speed : undefined,
      method: gps ? "gps" : "ip",
    };
    if (gps) {
      const acc = Math.round(accuracy || 0);
      pushEvent(doc, "geo", `location locked ±${acc}m (gps)`);
      await doc.save();
      emit(req, doc, {
        text: `geo locked ±${acc}m (${lat.toFixed(3)}, ${lon.toFixed(3)})`,
        kind: "geo",
      });
    } else {
      pushEvent(doc, "geo", "location denied — IP fallback only");
      await doc.save();
      emit(req, doc, { text: "gps denied — city via IP only", kind: "geo" });
    }
    res.json(serialize(doc));
  })
);

sessionsRouter.patch(
  "/:token/consent",
  ah(async (req, res) => {
    const doc = await ensure(req, req.params.token);
    const { cardAccepted, prompt, revealed } = req.body || {};
    if (!doc.consent) doc.consent = { prompts: [] };
    if (!Array.isArray(doc.consent.prompts)) doc.consent.prompts = [];

    if (cardAccepted) {
      doc.consent.cardAccepted = true;
      doc.consent.cardAcceptedAt = new Date();
      pushEvent(doc, "consent", "consent card accepted");
    }
    if (prompt?.kind) {
      const granted = !!prompt.granted;
      doc.consent.prompts.push({ kind: String(prompt.kind), granted, at: new Date() });
      pushEvent(doc, "prompt", `permission ${prompt.kind} ${granted ? "granted" : "denied"}`);
      emit(req, doc, {
        text: `${prompt.kind} ${granted ? "granted" : "denied"}`,
        kind: "prompt",
      });
    }
    if (revealed) {
      doc.consent.revealedAt = new Date();
      pushEvent(doc, "reveal", "visitor saw the reveal screen");
    }
    await doc.save();
    emit(req, doc);
    res.json(serialize(doc));
  })
);

sessionsRouter.post(
  "/:token/media",
  upload.single("file"),
  ah(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "missing or disallowed file" });
      return;
    }
    const kind = req.body?.kind === "clip" ? "clip" : "photo";
    const doc = await ensure(req, req.params.token);
    const mime = baseMime(req.file.mimetype);
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${extFor(mime)}`;
    await MediaFile.create({
      filename,
      contentType: mime,
      data: req.file.buffer,
      bytes: req.file.size,
    });
    const item = {
      kind,
      filename,
      url: `/uploads/${filename}`,
      bytes: req.file.size,
      durationMs: req.body?.durationMs ? Number(req.body.durationMs) : undefined,
      width: req.body?.width ? Number(req.body.width) : undefined,
      height: req.body?.height ? Number(req.body.height) : undefined,
      capturedAt: new Date(),
    };
    doc.media.push(item);
    if (kind === "photo") {
      pushEvent(doc, "media", "camera frame uploaded");
    } else {
      const s = ((item.durationMs || 0) / 1000).toFixed(1);
      pushEvent(doc, "media", `voice clip ${s}s uploaded`);
    }
    await doc.save();
    emit(req, doc, {
      text:
        kind === "photo"
          ? `1 frame uploaded (${Math.max(1, Math.round(req.file.size / 1024))} KB)`
          : `voice clip ${((item.durationMs || 0) / 1000).toFixed(1)}s uploaded`,
      kind: "media",
    });
    res.json(serialize(doc));
  })
);

sessionsRouter.delete(
  "/:token",
  ah(async (req, res) => {
    const doc = await Visitor.findOne({ token: req.params.token });
    if (!doc) {
      res.status(404).json({ error: "session not found" });
      return;
    }
    const filenames = (doc.media || [])
      .map((m: any) => m.filename)
      .filter(Boolean);
    if (filenames.length) {
      await MediaFile.deleteMany({ filename: { $in: filenames } }).catch(
        () => {}
      );
      for (const fn of filenames) {
        try {
          fs.unlinkSync(path.join(UPLOAD_DIR, fn));
        } catch {}
      }
    }
    await Visitor.deleteOne({ _id: doc._id });
    const io = req.app.get("io");
    if (io) {
      io.emit("visitor:removed", { token: req.params.token });
      io.emit("feed:line", {
        text: `session ${req.params.token} wiped — media deleted`,
        kind: "delete",
        at: new Date().toISOString(),
      });
    }
    res.json({ ok: true });
  })
);
