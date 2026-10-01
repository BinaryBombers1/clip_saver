import crypto from "node:crypto";
import { Router, Request, Response, NextFunction } from "express";

const EMAIL = process.env.ADMIN_EMAIL || "bilawal@gmail.com";
const PASSWORD = process.env.ADMIN_PASSWORD || "Bilawal";
const SECRET = process.env.AUTH_SECRET || "echo-demo-secret-change-me";
const TTL_MS = 12 * 60 * 60 * 1000;

function hmac(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

function safeEq(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function signToken(): string {
  const exp = String(Date.now() + TTL_MS);
  return `${exp}.${hmac(exp)}`;
}

export function verifyToken(token?: string | null): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (Number(exp) < Date.now()) return false;
  const expect = hmac(exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function bearer(req: Request): string | null {
  const h = req.headers.authorization;
  return h && h.startsWith("Bearer ") ? h.slice(7) : null;
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!verifyToken(bearer(req))) {
    res.status(401).json({ error: "admin auth required" });
    return;
  }
  next();
}

const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 5 * 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  if (limited(req.ip || "")) {
    res.status(429).json({ error: "too many attempts — try again in 5 minutes" });
    return;
  }
  const { email, password } = req.body || {};
  const ok =
    safeEq(String(email || ""), EMAIL) && safeEq(String(password || ""), PASSWORD);
  if (!ok) {
    res.status(401).json({ error: "invalid email or password" });
    return;
  }
  res.json({ token: signToken(), email: EMAIL });
});

authRouter.get("/me", (req, res) => {
  if (!verifyToken(bearer(req))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  res.json({ email: EMAIL });
});
