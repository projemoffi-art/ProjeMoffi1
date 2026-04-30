"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Map, { Marker, Source, Layer, NavigationControl, FullscreenControl, GeolocateControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { PLACES, Place } from "@/data/mockPlaces";
import { MOCK_MARKS, MapMark } from "@/data/mockMarks";
import { Navigation, AlertCircle, MapPin, Compass, ShieldAlert, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// --- PRO TYPES ---
interface MapboxLiveMapProps {
    userPos: [number, number];
    path?: [number, number][];
    isTracking?: boolean;
    visitedPlaceIds?: string[];
    onPlaceClick?: (place: Place) => void;
    guardianMode?: boolean;
    places?: Place[];
    marks?: MapMark[];
    // External Controls
    externalSearchQuery?: string;
    externalFilterType?: string | null;
    forceGuardianMode?: boolean;
    hideInternalUI?: boolean;
    deliveryPos?: [number, number];
    deliveryPath?: [number, number][];
    markers?: Array<{
        id: string;
        lat: number;
        lng: number;
        type: 'lost' | 'friend' | 'vet' | 'cafe' | 'park' | 'shop';
        title: string;
        desc?: string;
        img?: string;
    }>;
}

// --- PREMIUM MAPBOX STYLES ---
const STYLES = {
    night: "mapbox://styles/mapbox/navigation-night-v1",
    satellite: "mapbox://styles/mapbox/satellite-v9",
    hybrid: "mapbox://styles/mapbox/satellite-streets-v12"
};

export default function MapboxLiveMap({
    userPos, path = [], isTracking = false, visitedPlaceIds = [], onPlaceClick, 
    guardianMode, places: propPlaces, marks: propMarks,
    externalSearchQuery, externalFilterType, forceGuardianMode, hideInternalUI, 
    deliveryPos, deliveryPath, markers: externalMarkers
}: MapboxLiveMapProps) {

    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;
    const [mapStyle, setMapStyle] = useState(STYLES.night);

    const [viewState, setViewState] = useState({
        latitude: deliveryPos ? deliveryPos[0] : userPos[0],
        longitude: deliveryPos ? deliveryPos[1] : userPos[1],
        zoom: 15,
        pitch: 45, // 3D Perspective
        bearing: 0
    });

    const isSOSActive = guardianMode || forceGuardianMode;

    // Sync with user position (if not in delivery tracking mode)
    useEffect(() => {
        if (!deliveryPos) {
            setViewState(prev => ({
                ...prev,
                latitude: userPos[0],
                longitude: userPos[1]
            }));
        }
    }, [userPos, deliveryPos]);

    // Data Filtering
    const displayedPlaces = useMemo(() => {
        const base = propPlaces || PLACES;
        if (externalFilterType) return base.filter(p => p.type === externalFilterType);
        if (externalSearchQuery) return base.filter(p => p.name.toLowerCase().includes(externalSearchQuery.toLowerCase()));
        return base;
    }, [propPlaces, externalFilterType, externalSearchQuery]);

    const displayedMarks = propMarks || MOCK_MARKS;

    // Path Data for Line Layer
    const pathGeoJSON = useMemo(() => ({
        type: "Feature",
        properties: {},
        geometry: {
            type: "LineString",
            coordinates: path.map(p => [p[1], p[0]])
        }
    }), [path]);

    const deliveryPathGeoJSON = useMemo(() => ({
        type: "Feature",
        properties: {},
        geometry: {
            type: "LineString",
            coordinates: deliveryPath?.map(p => [p[1], p[0]]) || []
        }
    }), [deliveryPath]);

    if (!MAPBOX_TOKEN) {
        return (
            <div className="w-full h-full bg-[#050508] relative flex flex-col items-center justify-center text-center p-12">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
                
                <div className="relative z-10 space-y-8 max-w-sm">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                        <Compass className="w-12 h-12 text-indigo-400 animate-spin-slow" />
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-white font-black text-2xl tracking-tight uppercase italic drop-shadow-lg">
                            Mapbox Bağlantısı Bekleniyor
                        </h3>
                        <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.3em] leading-loose">
                            Premium 3D harita deneyimi için Mapbox Access Token gereklidir. <br/>
                            <span className="text-indigo-400">.env.local</span> dosyasına ekleyelim kral.
                        </p>
                    </div>

                    <div className="pt-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-black text-white/60 tracking-widest uppercase">Radar Taranıyor...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative overflow-hidden">
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapboxAccessToken={MAPBOX_TOKEN}
                mapStyle={mapStyle}
                terrain={{ source: "mapbox-dem", exaggeration: 1.5 }}
                antialias={true}
            >
                {/* 3D BUILDINGS & TERRAIN */}
                <Source
                    id="mapbox-dem"
                    type="raster-dem"
                    url="mapbox://mapbox.mapbox-terrain-dem-v1"
                    tileSize={512}
                    maxzoom={14}
                />

                {/* TRACKING PATH */}
                {path.length > 1 && (
                    <Source type="geojson" data={pathGeoJSON as any}>
                        <Layer
                            id="path-line"
                            type="line"
                            layout={{ "line-join": "round", "line-cap": "round" }}
                            paint={{
                                "line-color": "#5B4D9D",
                                "line-width": 6,
                                "line-opacity": 0.8,
                                "line-blur": 2
                            }}
                        />
                    </Source>
                )}

                {/* DELIVERY PATH (COURIER) */}
                {deliveryPath && deliveryPath.length > 1 && (
                    <Source type="geojson" data={deliveryPathGeoJSON as any}>
                        <Layer
                            id="delivery-path"
                            type="line"
                            layout={{ "line-join": "round", "line-cap": "round" }}
                            paint={{
                                "line-color": "#FF9500",
                                "line-width": 4,
                                "line-opacity": 0.6,
                                "line-dasharray": [2, 2]
                            }}
                        />
                    </Source>
                )}

                {/* COURIER MARKER */}
                {deliveryPos && (
                    <Marker latitude={deliveryPos[0]} longitude={deliveryPos[1]} anchor="center">
                        <div className="w-10 h-10 bg-amber-500 border-2 border-white rounded-full flex items-center justify-center text-xl shadow-xl animate-bounce">
                            🛵
                        </div>
                    </Marker>
                )}

                {/* USER MARKER (PULSING) */}
                <Marker latitude={userPos[0]} longitude={userPos[1]} anchor="center">
                    <div className="relative flex items-center justify-center">
                        <div className={cn("absolute w-14 h-14 rounded-full opacity-30 animate-ping", isSOSActive ? "bg-red-500" : "bg-indigo-500")} />
                        <div className={cn("relative w-7 h-7 rounded-full border-4 border-white shadow-[0_0_20px_rgba(0,0,0,0.5)]", isSOSActive ? "bg-red-600" : "bg-indigo-600")} />
                    </div>
                </Marker>

                {/* PLACES */}
                {displayedPlaces.map(place => {
                    const isVisited = visitedPlaceIds.includes(place.id);
                    let color = "#3b82f6"; // default
                    let icon = "📍";

                    switch (place.type) {
                        case 'vet': color = "#ef4444"; icon = "🏥"; break;
                        case 'cafe': color = "#f97316"; icon = "☕"; break;
                        case 'park': color = "#10b981"; icon = "🌳"; break;
                        case 'shop': color = "#a855f7"; icon = "🛍️"; break;
                    }

                    return (
                        <Marker 
                            key={place.id} 
                            latitude={place.lat} 
                            longitude={place.lng} 
                            anchor="bottom"
                            onClick={e => {
                                e.originalEvent.stopPropagation();
                                if (onPlaceClick) onPlaceClick(place);
                            }}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-[1.2rem] flex items-center justify-center text-xl shadow-2xl transition-all hover:scale-110 cursor-pointer border-2 border-white/20 backdrop-blur-xl",
                                isVisited ? "bg-gray-800 grayscale" : ""
                            )} style={{ backgroundColor: isVisited ? undefined : `${color}33`, borderColor: color }}>
                                <span className="drop-shadow-lg">{isVisited ? "✅" : icon}</span>
                            </div>
                        </Marker>
                    );
                })}

                {/* COMMUNITY MARKS */}
                {displayedMarks.map(mark => (
                    <Marker key={mark.id} latitude={mark.lat} longitude={mark.lng} anchor="center">
                        <div className="w-9 h-9 rounded-tr-none rounded-full bg-white/90 backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center text-xl transform -rotate-45 hover:scale-110 transition-transform">
                            <div className="transform rotate-45 drop-shadow-md">{mark.emoji}</div>
                        </div>
                    </Marker>
                ))}

                {/* EXTERNAL DYNAMIC MARKERS */}
                {externalMarkers?.map((marker) => (
                    <Marker key={marker.id} latitude={marker.lat} longitude={marker.lng} anchor="bottom">
                        <div className="flex flex-col items-center group cursor-pointer">
                            <div className={cn(
                                "p-1 rounded-full border-2 bg-white shadow-xl mb-1 transition-transform group-hover:scale-110",
                                marker.type === 'lost' ? "border-red-500 animate-bounce" : "border-indigo-500"
                            )}>
                                {marker.img ? (
                                    <img src={marker.img} className="w-10 h-10 rounded-full object-cover" alt="" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl">🐾</div>
                                )}
                            </div>
                            {marker.type === 'lost' && (
                                <div className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest shadow-lg">KAYIP</div>
                            )}
                        </div>
                    </Marker>
                ))}

                {/* CONTROLS */}
                {!hideInternalUI && (
                    <div className="absolute top-4 right-4 space-y-2 flex flex-col items-end">
                        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1 flex flex-col gap-1 shadow-2xl pointer-events-auto">
                            <button 
                                onClick={() => setMapStyle(STYLES.night)}
                                className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", mapStyle === STYLES.night ? "bg-white text-black" : "text-white/40 hover:text-white")}
                            >
                                <Zap className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => setMapStyle(STYLES.hybrid)}
                                className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", mapStyle === STYLES.hybrid ? "bg-white text-black" : "text-white/40 hover:text-white")}
                            >
                                <Layers className="w-5 h-5" />
                            </button>
                        </div>
                        <NavigationControl position="top-right" showCompass={true} />
                        <GeolocateControl position="top-right" />
                    </div>
                )}
            </Map>

            {/* SOS / GUARDIAN OVERLAYS */}
            {isSOSActive && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay animate-pulse" />
                    <div className="absolute inset-0 border-[40px] border-red-500/5 blur-3xl pointer-events-none" />
                </div>
            )}
        </div>
    );
}
