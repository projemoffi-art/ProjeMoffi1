'use client';

// Referans Ekran 2 — Kayıp ve bulunan ilanlarının haritası. İlan konumları yaklaşık (~300 m) gelir.

import React, { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LostListing } from '@/services/lostService';

function esc(v: string) {
    return v.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));
}

function pin(l: LostListing, selected: boolean) {
    const size = selected ? 54 : 44;
    const ring = l.status === 'resolved' ? '#78716c' : l.kind === 'lost' ? '#EE5B3D' : '#16a34a';
    const inner = l.photos[0]
        ? `<img src="${esc(l.photos[0])}" alt="" style="width:100%;height:100%;object-fit:cover" />`
        : `<span style="font:800 18px system-ui">🐾</span>`;
    return L.divIcon({
        className: '',
        iconSize: [size, size + 8],
        iconAnchor: [size / 2, size + 8],
        html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;border:3px solid ${ring};box-shadow:0 4px 14px rgba(0,0,0,.25);background:#F7F3EA;display:flex;align-items:center;justify-content:center;overflow:hidden">${inner}</div>
               <div style="width:0;height:0;margin:-2px auto 0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid ${ring}"></div>`,
    });
}

const me = L.divIcon({
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: '<div style="width:22px;height:22px;border-radius:9999px;background:#2563eb;border:4px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.2)"></div>',
});

function Fit({ center, radiusKm }: { center: [number, number]; radiusKm: number }) {
    const map = useMap();
    useEffect(() => {
        map.fitBounds(L.latLng(center).toBounds(radiusKm * 2000), { padding: [24, 24] });
    }, [center[0], center[1], radiusKm]);
    return null;
}

export default function ListingsMap({ listings, center, radiusKm, selectedId, onSelect }: {
    listings: LostListing[];
    center: [number, number];
    radiusKm: number;
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    return (
        <MapContainer center={center} zoom={13} className="absolute inset-0 z-0">
            <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap katkıcıları" maxZoom={19} />
            <Fit center={center} radiusKm={radiusKm} />
            <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: '#EE5B3D', weight: 1, fillOpacity: 0.04 }} />
            <Marker position={center} icon={me} />
            {listings.filter(l => l.lat != null && l.lng != null).map(l => (
                <Marker key={l.id} position={[l.lat!, l.lng!]} icon={pin(l, l.id === selectedId)}
                    eventHandlers={{ click: () => onSelect(l.id) }} />
            ))}
        </MapContainer>
    );
}
