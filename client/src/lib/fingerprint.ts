function ver(ua: string, re: RegExp): string | undefined {
  return ua.match(re)?.[1];
}

export function detectBrowser(ua: string) {
  if (/Edg\//.test(ua)) return { name: "Edge", version: ver(ua, /Edg\/([\d.]+)/) };
  if (/OPR\/|Opera/.test(ua))
    return { name: "Opera", version: ver(ua, /(?:OPR|Opera)\/([\d.]+)/) };
  if (/Firefox\//.test(ua))
    return { name: "Firefox", version: ver(ua, /Firefox\/([\d.]+)/) };
  if (/Chrome\//.test(ua))
    return { name: "Chrome", version: ver(ua, /Chrome\/([\d.]+)/) };
  if (/Safari\//.test(ua) && /Version\//.test(ua))
    return { name: "Safari", version: ver(ua, /Version\/([\d.]+)/) };
  return { name: "Unknown", version: undefined };
}

export function detectOS(ua: string) {
  if (/Windows NT/.test(ua))
    return { name: "Windows", version: ver(ua, /Windows NT ([\d.]+)/) };
  if (/iPhone|iPad|iPod/.test(ua))
    return {
      name: "iOS",
      version: ver(ua, /OS ([\d_]+)/)?.replace(/_/g, "."),
    };
  if (/Android/.test(ua))
    return { name: "Android", version: ver(ua, /Android ([\d.]+)/) };
  if (/Mac OS X/.test(ua))
    return {
      name: "macOS",
      version: ver(ua, /Mac OS X ([\d_.]+)/)?.replace(/_/g, "."),
    };
  if (/Linux/.test(ua)) return { name: "Linux", version: undefined };
  return { name: "Unknown", version: undefined };
}

export function detectDevice(ua: string) {
  if (/iPad/.test(ua)) return "iPad";
  if (/iPhone|iPod/.test(ua)) return "iPhone";
  if (/Android/.test(ua)) return "Android device";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Mac OS X/.test(ua)) return "Mac";
  if (/Linux/.test(ua)) return "Linux machine";
  return "Unknown device";
}

export async function collectDevice() {
  const ua = navigator.userAgent;
  const browser = detectBrowser(ua);
  const os = detectOS(ua);
  const nav: any = navigator;

  let battery: { level?: number; charging?: boolean } | undefined;
  try {
    if (typeof nav.getBattery === "function") {
      const b: any = await Promise.race([
        nav.getBattery(),
        new Promise((r) => setTimeout(() => r(null), 600)),
      ]);
      if (b) {
        battery = {
          level: Math.round((b.level || 0) * 100) / 100,
          charging: !!b.charging,
        };
      }
    }
  } catch {}

  const conn = nav.connection;

  return {
    userAgent: ua,
    browser: browser.name,
    browserVersion: browser.version,
    os: os.name,
    osVersion: os.version,
    device: detectDevice(ua),
    platform: nav.platform || "",
    screen: {
      w: window.screen.width,
      h: window.screen.height,
      dpr: window.devicePixelRatio,
      colorDepth: window.screen.colorDepth,
    },
    language: navigator.language,
    languages: Array.from(navigator.languages || []).slice(0, 4),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    touchPoints: navigator.maxTouchPoints || 0,
    cores: nav.hardwareConcurrency || undefined,
    memory: nav.deviceMemory || undefined,
    connection: conn
      ? {
          effectiveType: conn.effectiveType,
          downlink: conn.downlink,
          rtt: conn.rtt,
        }
      : undefined,
    battery,
  };
}
