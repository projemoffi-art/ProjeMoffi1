"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useTheme } from "@/context/ThemeContext";

interface RadarMapProps {
    lostPets: any[];
    onPetClick: (pet: any) => void;
    userPos?: [number, number];
}

// Map centering helper component
function MapCenterController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

export default function RadarMap({ lostPets, onPetClick, userPos }: RadarMapProps) {
    const { isDark } = useTheme();
    const defaultCenter: [number, number] = userPos || [40.9850, 29.0300]; // Kadikoy/Moda center fallback

    // Custom pulsing marker icon with pet image
    const createLostPetIcon = (pet: any) => {
        const petImg = pet.img || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400";
        return L.divIcon({
            className: "lost-pet-marker-icon-wrapper",
            html: `
                <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                    <!-- Pulse waves -->
                    <div style="
                        position: absolute; width: 56px; height: 56px; border-radius: 50%;
                        background-color: rgba(239, 68, 68, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
                        z-index: 1; pointer-events: none;
                    "></div>
                    <!-- Photo circle -->
                    <div style="
                        width: 40px; height: 40px; border-radius: 50%; border: 3px solid #ef4444; 
                        background-color: #1a1a1a; overflow: hidden; display: flex; align-items: center; 
                        justify-content: center; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.5);
                        position: relative; z-index: 10;
                    ">
                        <img src="${petImg}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />
                    </div>
                    <!-- Pointer pin -->
                    <div style="
                        width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; 
                        border-top: 8px solid #ef4444; position: absolute; bottom: -8px; left: 16px; z-index: 5;
                    "></div>
                </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 44],
            popupAnchor: [0, -44]
        });
    };

    return (
        <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative bg-[#1A1A1A]">
            <MapContainer
                center={defaultCenter}
                zoom={13}
                style={{ width: "100%", height: "100%" }}
                zoomControl={false}
                doubleClickZoom={false}
            >
                <TileLayer
                    key={isDark ? 'dark-map-radar' : 'light-map-radar'}
                    url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
                    attribution='&copy; OpenStreetMap &copy; CARTO'
                />
                
                <MapCenterController center={defaultCenter} />

                {/* User Current Location Marker */}
                {userPos && (
                    <Marker
                        position={userPos}
                        icon={L.divIcon({
                            className: "user-loc-marker",
                            html: `
                                <div style="position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
                                    <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background-color: rgba(6, 182, 212, 0.3); animation: ping 1.5s infinite;"></div>
                                    <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #06b6d4; border: 2.5px solid white; box-shadow: 0 0 10px rgba(6, 182, 212, 0.8); z-index: 10;"></div>
                                </div>
                            `,
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        })}
                    />
                )}

                {/* Lost Pet Markers */}
                {lostPets.map((pet, idx) => {
                    // Seeded random coordinate fallback around center if coordinates are empty
                    // Using hash of pet name or id to ensure marker positions stay stable
                    const seed = String(pet.id || pet.name || idx).charCodeAt(0) || idx;
                    const latOffset = ((seed % 10) - 5) * 0.004;
                    const lngOffset = (((seed * 7) % 10) - 5) * 0.004;

                    const petLat = Number(pet.latitude) || (defaultCenter[0] + latOffset);
                    const petLng = Number(pet.longitude) || (defaultCenter[1] + lngOffset);

                    return (
                        <Marker
                            key={pet.id || idx}
                            position={[petLat, petLng]}
                            icon={createLostPetIcon(pet)}
                            eventHandlers={{
                                click: () => onPetClick(pet)
                            }}
                        />
                    );
                })}
            </MapContainer>
        </div>
    );
}
