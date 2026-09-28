'use client';

import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';

// İşletmenin harita konumu: haritaya dokunarak ya da iğneyi sürükleyerek seçilir. Harici API anahtarı gerektirmez.
const pin = L.divIcon({
    className: '',
    html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#EE5B3D;border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.25)"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({ click: e => onPick(e.latlng.lat, e.latlng.lng) });
    return null;
}

function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
    const map = useMap();
    useEffect(() => {
        if (lat != null && lng != null) map.setView([lat, lng], Math.max(map.getZoom(), 16));
    }, [lat, lng, map]);
    return null;
}

export default function LocationPicker({ lat, lng, fallbackCenter, onChange }: {
    lat: number | null;
    lng: number | null;
    fallbackCenter: [number, number];
    onChange: (lat: number, lng: number) => void;
}) {
    const center: [number, number] = lat != null && lng != null ? [lat, lng] : fallbackCenter;
    return (
        <MapContainer center={center} zoom={lat != null ? 16 : 12} className="h-64 w-full rounded-2xl z-0">
            <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap katkıcıları" maxZoom={19} />
            <ClickToPlace onPick={onChange} />
            <Recenter lat={lat} lng={lng} />
            {lat != null && lng != null && (
                <Marker
                    position={[lat, lng]}
                    icon={pin}
                    draggable
                    eventHandlers={{ dragend: e => { const p = (e.target as L.Marker).getLatLng(); onChange(p.lat, p.lng); } }}
                />
            )}
        </MapContainer>
    );
}
