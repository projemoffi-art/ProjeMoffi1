"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Standalone, minimal harita — LiveMap.tsx'in tüm mock POI/SOS/hazine avı
// mantığını (hiç uygun olmayan) taşımadan, tek bir noktayı gösteriyor.
// Carto tile sunucusu bu projede zaten bilinen bir "API KEY REQUIRED"
// filigranı sorunu yaşıyor (bkz. CLAUDE.md 8.1) — bu YENİ, tamamen herkese
// açık sayfa o soruna miras kalmasın diye standart OpenStreetMap tile'ları
// kullanıyor.
const petIcon = L.divIcon({
    html: '<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">🐾</div>',
    className: 'bg-transparent border-0',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => { map.setView([lat, lng], map.getZoom() < 14 ? 15 : map.getZoom()); }, [lat, lng, map]);
    return null;
}

export default function BeaconMap({ lat, lng }: { lat: number; lng: number }) {
    return (
        <MapContainer center={[lat, lng]} zoom={15} style={{ width: '100%', height: '100%' }} zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[lat, lng]} icon={petIcon} />
            <Recenter lat={lat} lng={lng} />
        </MapContainer>
    );
}
