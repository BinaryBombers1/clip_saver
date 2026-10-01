export type IpInfo = {
  addr: string;
  city?: string;
  region?: string;
  country?: string;
  lat?: number;
  lon?: number;
  isp?: string;
  asn?: string;
  source: string;
};

const TTL = 10 * 60_000;
const cache = new Map<string, { info: IpInfo; at: number }>();

function normalize(ip: string): string {
  return (ip || "").replace(/^::ffff:/i, "");
}

export function isPrivate(ip: string): boolean {
  const h = normalize(ip);
  if (!h || h === "::1" || h === "unknown") return true;
  if (/^(10\.|127\.|169\.254\.)/.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^(fc|fd|fe80)/i.test(h)) return true;
  return false;
}

async function call(url: string): Promise<any | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 5000);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) return null;
    const j: any = await r.json();
    if (!j || j.success === false || j.status === "fail" || j.error) return null;
    return j;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

type Parsed = Omit<IpInfo, "addr">;

const PROVIDERS: Array<{
  url: (target: string) => string;
  parse: (j: any) => Parsed | null;
}> = [
  {
    // ipwho.is — no key, generous limits
    url: (t) => `https://ipwho.is/${t}`,
    parse: (j) =>
      j && typeof j.latitude === "number" && typeof j.longitude === "number"
        ? {
            city: j.city || undefined,
            region: j.region || undefined,
            country: j.country || undefined,
            lat: j.latitude,
            lon: j.longitude,
            isp: j.connection?.isp || j.connection?.org || undefined,
            asn: j.connection?.asn ? `AS${j.connection.asn}` : undefined,
            source: "ipwho.is",
          }
        : null,
  },
  {
    // ipapi.co — fallback (sometimes 403s on free tier)
    url: (t) => (t ? `https://ipapi.co/${t}/json/` : "https://ipapi.co/json/"),
    parse: (j) =>
      j && typeof j.latitude === "number" && typeof j.longitude === "number"
        ? {
            city: j.city || undefined,
            region: j.region || undefined,
            country: j.country_name || undefined,
            lat: j.latitude,
            lon: j.longitude,
            isp: j.org || undefined,
            asn: j.asn || undefined,
            source: "ipapi.co",
          }
        : null,
  },
  {
    // ip-api.com — last resort, plain http free tier
    url: (t) =>
      `http://ip-api.com/json/${t}?fields=status,message,country,regionName,city,lat,lon,isp,as`,
    parse: (j) =>
      j && j.status === "success" && typeof j.lat === "number"
        ? {
            city: j.city || undefined,
            region: j.regionName || undefined,
            country: j.country || undefined,
            lat: j.lat,
            lon: j.lon,
            isp: j.isp || undefined,
            asn: j.as || undefined,
            source: "ip-api.com",
          }
        : null,
  },
];

export async function lookupIp(raw: string): Promise<IpInfo> {
  const addr = normalize(raw) || "unknown";
  const pub = !isPrivate(addr);
  const key = pub ? addr : "egress";
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return { ...hit.info, addr };

  const target = pub ? encodeURIComponent(addr) : "";
  let merged: Parsed | null = null;
  for (const p of PROVIDERS) {
    const j = await call(p.url(target));
    merged = j ? p.parse(j) : null;
    if (merged) break;
  }

  const info: IpInfo = {
    addr,
    city: merged?.city,
    region: merged?.region,
    country: merged?.country,
    lat: merged?.lat,
    lon: merged?.lon,
    isp: merged?.isp,
    asn: merged?.asn,
    source: merged?.source || "unavailable",
  };
  if (merged && typeof merged.lat === "number") {
    cache.set(key, { info, at: Date.now() });
  }
  return { ...info };
}
