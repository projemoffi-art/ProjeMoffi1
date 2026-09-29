'use client';

// İlanın yaklaşık konumu (~300 m daire) ya da görülme noktaları. Kaydırılamaz, sadece gösterir.

import React, { useEffect } from 'react';
import { Circle, CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function Fit({ points }: { points: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (points.length === 0) return;
        if (points.length === 1) map.setView(points[0], 15);
        else map.fitBounds(L.latLngBounds(points), { padding: [28, 28] });
    }, [points.map(p => p.join(',')).join('|')]);
    return null;
}

export default function MiniMap({ center, exact, sightings = [], height = 'h-40', interactive = false }: {
    center: [number, number];
    exact: boolean;
    sightings?: [number, number][];
    height?: string;
    interactive?: boolean;
}) {
    return (
        <MapContainer center={center} zoom={15} className={`${height} w-full rounded-2xl z-0`}
            dragging={interactive} scrollWheelZoom={false} zoomControl={interactive} doubleClickZoom={interactive} touchZoom={interactive}>
            <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap katkıcıları" maxZoom={19} />
            <Fit points={[center, ...sightings]} />
            {exact
                ? <CircleMarker center={center} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#EE5B3D', fillOpacity: 1 }} />
                : <Circle center={center} radius={300} pathOptions={{ color: '#EE5B3D', weight: 1.5, fillOpacity: 0.12 }} />}
            {sightings.map((p, i) => (
                <CircleMarker key={i} center={p} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: '#f59e0b', fillOpacity: 1 }} />
            ))}
        </MapContainer>
    );
}
