import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Visitor } from "../lib/types";

function esc(s: string) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

export default function MapPanel({
  visitors,
  className = "",
  interactive = true,
}: {
  visitors: Visitor[];
  className?: string;
  interactive?: boolean;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const fittedRef = useRef(0);

  useEffect(() => {
    let dead = false;
    import("leaflet").then((mod: any) => {
      if (dead || !elRef.current || mapRef.current) return;
      const L = mod.default || mod;
      LRef.current = L;
      const map = L.map(elRef.current, {
        zoomControl: false,
        attributionControl: true,
        dragging: interactive,
        scrollWheelZoom: false,
        doubleClickZoom: interactive,
        touchZoom: interactive,
      }).setView([28, 62], 3);
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri, HERE, Garmin, FAO, NOAA, OpenStreetMap contributors",
          maxZoom: 15,
        }
      ).addTo(map);
      if (interactive) L.control.zoom({ position: "bottomright" }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      const onResize = () => map.invalidateSize();
      window.addEventListener("resize", onResize);
      (map as any)._rcleanup = () => window.removeEventListener("resize", onResize);
      setTimeout(() => map.invalidateSize(), 120);
      draw();
    });
    return () => {
      dead = true;
      if (mapRef.current) {
        (mapRef.current as any)._rcleanup?.();
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
        LRef.current = null;
        fittedRef.current = 0;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitors]);

  function draw() {
    const L = LRef.current;
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!L || !layer || !map) return;
    layer.clearLayers();
    const pts: number[][] = [];
    for (const v of visitors) {
      const gps = v.geo?.method === "gps" && typeof v.geo.lat === "number";
      const lat = gps ? v.geo!.lat : v.ip?.lat;
      const lon = gps ? v.geo!.lon : v.ip?.lon;
      if (typeof lat !== "number" || typeof lon !== "number") continue;
      pts.push([lat, lon]);
      const hasMedia = (v.media?.length || 0) > 0;
      const color = gps ? "#22d3ee" : hasMedia ? "#8b5cf6" : "#fbbf24";
      if (gps && typeof v.geo?.accuracy === "number") {
        L.circle([lat, lon], {
          radius: Math.max(v.geo.accuracy, 15),
          color,
          weight: 1,
          fillColor: color,
          fillOpacity: 0.12,
          interactive: false,
        }).addTo(layer);
      } else {
        L.circle([lat, lon], {
          radius: 5000,
          color,
          weight: 1,
          dashArray: "4 6",
          fillColor: color,
          fillOpacity: 0.05,
          interactive: false,
        }).addTo(layer);
      }
      L.circleMarker([lat, lon], {
        radius: 7,
        color: "#05060a",
        weight: 2,
        fillColor: color,
        fillOpacity: 1,
        interactive: false,
      }).addTo(layer);
      const name = v.ip?.city || v.ip?.addr || v.token;
      const popupHtml = `<div style="font:13px/1.6 Inter,sans-serif;color:#0b0e14;padding:2px">
<b>${esc(name)}</b><br/>
${esc(v.device?.os || "?")} · ${esc(v.device?.browser || "?")}<br/>
${v.points ?? "?"} data points<br/>
<a href="/dashboard/sessions/${esc(v.token)}" style="display:inline-block;margin-top:6px;padding:8px 14px;background:#0e7490;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">open dossier →</a>
</div>`;
      L.circleMarker([lat, lon], {
        radius: 16,
        stroke: false,
        fillOpacity: 0,
        fillColor: color,
        className: "map-hit",
      })
        .addTo(layer)
        .bindPopup(popupHtml, { minWidth: 200, maxWidth: 280 });
    }
    if (pts.length > fittedRef.current && pts.length > 0) {
      fittedRef.current = pts.length;
      try {
        map.flyToBounds(L.latLngBounds(pts), { padding: [70, 70], maxZoom: 13, duration: 1.4 });
      } catch {}
    }
  }

  return <div ref={elRef} className={className} />;
}
