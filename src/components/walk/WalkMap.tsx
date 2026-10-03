"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Crosshair } from "lucide-react";

// Yürüyüşe özel sade harita (takip + geçmiş detay). Canlı modda kullanıcıyı takip eder ama
// yakınlaştırmayı bozmaz; kullanıcı haritayı kaydırınca takip durur, "konumuma dön" ile geri gelir.
// Statik modda rotanın tamamını kadraja sığdırır.

const ROUTE_COLOR = "#EE5B3D";
const FOLLOW_ZOOM = 17;

function escapeAttr(value: string) {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function petMarkerIcon(image?: string | null) {
    const inner = image
        ? `<img src="${escapeAttr(image)}" style="width:100%;height:100%;object-fit:cover;border-radius:9999px" alt="" />`
        : `<div style="width:100%;height:100%;border-radius:9999px;background:#FDE7E1;display:flex;align-items:center;justify-content:center;font-size:20px">🐾</div>`;
    return L.divIcon({
        className: "bg-transparent border-0",
        html: `<div style="width:46px;height:46px;border-radius:9999px;border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.25);background:#fff;overflow:hidden">${inner}</div>`,
        iconSize: [46, 46],
        iconAnchor: [23, 23],
    });
}

const startIcon = L.divIcon({
    className: "bg-transparent border-0",
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:#201B16;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

// topInset: haritanın üstünü örten başlık/hap alanı (px). İşaretçi kalan görünür alanın ortasında durur.
function centerFor(map: L.Map, position: [number, number], zoom: number, topInset: number): L.LatLng {
    const point = map.project(position, zoom).subtract([0, topInset / 2]);
    return map.unproject(point, zoom);
}

function LiveFollow({ position, follow, topInset, onUserMove }: { position: [number, number] | null; follow: boolean; topInset: number; onUserMove: () => void }) {
    const map = useMap();
    const centeredOnce = useRef(false);
    useMapEvents({ dragstart: onUserMove });
    useEffect(() => {
        if (!position) return;
        if (!centeredOnce.current) {
            map.setView(centerFor(map, position, FOLLOW_ZOOM, topInset), FOLLOW_ZOOM, { animate: false });
            centeredOnce.current = true;
        } else if (follow) {
            map.panTo(centerFor(map, position, map.getZoom(), topInset), { animate: true, duration: 0.6 });
        }
    }, [position?.[0], position?.[1], follow]); // eslint-disable-line react-hooks/exhaustive-deps
    return null;
}

function ResizeWatcher() {
    const map = useMap();
    useEffect(() => {
        const ro = new ResizeObserver(() => map.invalidateSize({ pan: false }));
        ro.observe(map.getContainer());
        return () => ro.disconnect();
    }, [map]);
    return null;
}

function FitRoute({ path }: { path: [number, number][] }) {
    const map = useMap();
    const fitted = useRef(false);
    useEffect(() => {
        if (fitted.current || path.length === 0) return;
        fitted.current = true;
        if (path.length === 1) map.setView(path[0], FOLLOW_ZOOM, { animate: false });
        else map.fitBounds(L.latLngBounds(path), { padding: [28, 28], animate: false });
    }, [path, map]);
    return null;
}

function RecenterControl({ position, topInset, onRecenter }: { position: [number, number]; topInset: number; onRecenter: () => void }) {
    const map = useMap();
    const ref = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (ref.current) { L.DomEvent.disableClickPropagation(ref.current); L.DomEvent.disableScrollPropagation(ref.current); }
    }, []);
    return (
        <button
            ref={ref}
            type="button"
            onClick={() => { const z = Math.max(map.getZoom(), FOLLOW_ZOOM); map.setView(centerFor(map, position, z, topInset), z); onRecenter(); }}
            className="absolute right-4 z-[500] w-11 h-11 rounded-2xl bg-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
            style={{ top: "var(--walkmap-controls-top, 140px)" }}
            aria-label="Konumuma dön"
        >
            <Crosshair className="w-5 h-5 text-[#201B16]" />
        </button>
    );
}

export default function WalkMap({
    path,
    current,
    petImage,
    mode,
    showRecenter = true,
    fitPath,
    topInset = 0,
}: {
    path: [number, number][];
    fitPath?: [number, number][];
    topInset?: number;
    current?: [number, number] | null;
    petImage?: string | null;
    mode: "live" | "static";
    showRecenter?: boolean;
}) {
    const [follow, setFollow] = useState(true);
    const position = current ?? (path.length ? path[path.length - 1] : null);
    const initialCenter: [number, number] = position ?? [39.0, 35.0];

    return (
        <MapContainer
            center={initialCenter}
            zoom={position ? FOLLOW_ZOOM : 5}
            zoomControl={false}
            className="w-full h-full z-0"
            style={{ background: "#EDE7DA" }}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            {path.length > 1 && (
                <Polyline positions={path} pathOptions={{ color: ROUTE_COLOR, weight: 5, opacity: 0.95, lineCap: "round", lineJoin: "round" }} />
            )}
            {path.length > 0 && <Marker position={path[0]} icon={startIcon} />}
            {position && <Marker position={position} icon={petMarkerIcon(petImage)} />}
            <ResizeWatcher />
            {mode === "live" ? (
                <>
                    <LiveFollow position={position} follow={follow} topInset={topInset} onUserMove={() => setFollow(false)} />
                    {showRecenter && position && !follow && <RecenterControl position={position} topInset={topInset} onRecenter={() => setFollow(true)} />}
                </>
            ) : (
                <FitRoute path={fitPath ?? path} />
            )}
        </MapContainer>
    );
}
