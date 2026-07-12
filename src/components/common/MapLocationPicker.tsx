'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapLocationPickerProps {
    coords: [number, number];
    onChange?: (coords: [number, number], addressName?: string) => void;
    height?: string;
    className?: string;
    readonly?: boolean;
}

// Map Click Handler
function MapClickHandler({ onLocationSelect, readonly }: { onLocationSelect: (lat: number, lng: number) => void, readonly?: boolean }) {
    useMapEvents({
        click(e) {
            if (!readonly) onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Map Center Controller
function MapCenterController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15, { animate: true, duration: 1.5 });
        }
    }, [center, map]);
    return null;
}

export function MapLocationPicker({ coords, onChange, height = "200px", className, readonly = false }: MapLocationPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                onChange([lat, lon], result.display_name.split(',')[0]);
            } else {
                alert("Konum bulunamadı. Lütfen daha detaylı arayın.");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            alert("Arama yapılırken bir hata oluştu.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className={cn("relative flex flex-col gap-2", className)}>
            {!readonly && (
                <div className="relative z-10 flex items-center gap-2">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Örn: Kadıköy Moda Sahili" 
                            className="w-full bg-foreground/5 border border-glass-border rounded-xl py-2.5 pl-9 pr-4 text-xs text-foreground outline-none focus:border-red-500 transition-colors" 
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    </div>
                    <button 
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="bg-red-500 text-white px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSearching ? "..." : "Ara"}
                    </button>
                </div>
            )}
            
            <div className={cn("rounded-xl overflow-hidden border border-[var(--card-border)] shadow-inner relative z-0")} style={{ height }}>
                <MapContainer center={coords} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={!readonly} dragging={true} touchZoom={true} doubleClickZoom={true} scrollWheelZoom={true}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                    />
                    <MapClickHandler onLocationSelect={(lat, lng) => onChange?.([lat, lng])} readonly={readonly} />
                    <MapCenterController center={coords} />
                    <Marker position={coords} />
                </MapContainer>
                
                {/* Overlay Hint */}
                {!readonly && (
                    <div className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-md rounded-lg p-2 flex items-center justify-center gap-2 pointer-events-none z-[1000] border border-glass-border">
                        <MapPin className="w-3 h-3 text-red-500" />
                        <span className="text-[9px] font-bold text-foreground">Haritaya tıklayarak pini taşıyabilirsiniz</span>
                    </div>
                )}
            </div>
        </div>
    );
}
