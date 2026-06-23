"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useTheme } from "@/context/ThemeContext";

interface SightingMapSelectorProps {
    userPos?: [number, number];
    onChange: (coords: [number, number]) => void;
}

function MapClickHandler({ onMapClick }: { onMapClick: (coords: [number, number]) => void }) {
    useMapEvents({
        click(e) {
            onMapClick([e.latlng.lat, e.latlng.lng]);
        }
    });
    return null;
}

export default function SightingMapSelector({ userPos, onChange }: SightingMapSelectorProps) {
    const { isDark } = useTheme();
    const defaultCenter: [number, number] = userPos || [40.9850, 29.0300];
    const [markerPos, setMarkerPos] = useState<[number, number]>(defaultCenter);

    useEffect(() => {
        if (userPos) {
            setMarkerPos(userPos);
        }
    }, [userPos]);

    const handleMapClick = (coords: [number, number]) => {
        setMarkerPos(coords);
        onChange(coords);
    };

    const redIcon = L.divIcon({
        className: "sighting-selector-pin",
        html: `
            <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.3); animation: ping 1.5s infinite;"></div>
                <div style="width: 16px; height: 16px; border-radius: 50%; background-color: #ef4444; border: 2.5px solid white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.8); z-index: 10;"></div>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative bg-[#1A1A1A]">
            <MapContainer
                center={defaultCenter}
                zoom={14}
                style={{ width: "100%", height: "100%" }}
                zoomControl={false}
                doubleClickZoom={false}
            >
                <TileLayer
                    key={isDark ? 'dark-map-sighting' : 'light-map-sighting'}
                    url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
                    attribution='&copy; OpenStreetMap &copy; CARTO'
                />
                
                <Marker position={markerPos} icon={redIcon} />
                <MapClickHandler onMapClick={handleMapClick} />
            </MapContainer>
            <div className="absolute bottom-2 left-2 z-[1000] bg-black/80 px-2 py-1 rounded text-[9px] text-white/70 pointer-events-none">
                İhbar konumunu haritada tıklayarak taşıyabilirsiniz.
            </div>
        </div>
    );
}
