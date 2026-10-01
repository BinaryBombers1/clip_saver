const SKIP = new Set([
  "_id",
  "token",
  "__v",
  "events",
  "filename",
  "url",
  "bytes",
  "capturedAt",
]);

export function countPoints(v: any): number {
  let n = 0;
  const walk = (o: any) => {
    if (o == null) return;
    if (Array.isArray(o)) {
      o.forEach(walk);
      return;
    }
    if (typeof o !== "object") return;
    for (const [k, val] of Object.entries(o)) {
      if (SKIP.has(k) || val == null || val === "") continue;
      if (typeof val === "object") walk(val);
      else n++;
    }
  };
  walk({
    ip: v.ip,
    device: v.device,
    geo: v.geo,
    media: v.media,
    consent: v.consent
      ? {
          cardAccepted: v.consent.cardAccepted,
          prompts: v.consent.prompts,
          revealedAt: v.consent.revealedAt,
        }
      : null,
  });
  return n;
}

export function serialize(v: any) {
  const o = typeof v?.toObject === "function" ? v.toObject() : { ...v };
  o.points = countPoints(o);
  const start = o.startedAt || o.createdAt;
  if (o.consent?.revealedAt && start) {
    o.durationMs =
      new Date(o.consent.revealedAt).getTime() - new Date(start).getTime();
  }
  return o;
}
