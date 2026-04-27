"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { PLACES, Place } from "@/data/mockPlaces";
import { MOCK_MARKS, MapMark } from "@/data/mockMarks";
import { Star, Gift, Coins, Search, Coffee, Stethoscope, Trees, ShoppingBag, AlertCircle, Navigation, MapPin, Plus, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkCreationModal } from "./MarkCreationModal";
import { GuardianStatusOverlay } from "@/components/guardian/GuardianStatusOverlay";

// --- TYPES ---
interface LiveMapProps {
    userPos: [number, number];
    path: [number, number][];
    isTracking: boolean;
    visitedPlaceIds: string[];
    onPlaceClick?: (place: Place) => void;
    guardianMode?: boolean;
    deliveryPos?: [number, number];
    deliveryPath?: [number, number][];
    // External Controls
    externalSearchQuery?: string;
    externalFilterType?: string | null;
    forceGuardianMode?: boolean;
    hideInternalUI?: boolean;
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

// --- CUSTOM ICON ---
const createCustomIcon = (type: string, isPremium: boolean, isVisited: boolean) => {
    let colorClass = isVisited ? "bg-gray-400" : "bg-blue-500";
    let iconEmoji = "📍";
    let glow = "";

    switch (type) {
        case 'vet': colorClass = isVisited ? "bg-gray-400" : "bg-red-500"; iconEmoji = "🏥"; break;
        case 'cafe': colorClass = isVisited ? "bg-gray-400" : "bg-orange-500"; iconEmoji = "☕"; break;
        case 'park': colorClass = isVisited ? "bg-gray-400" : "bg-green-500"; iconEmoji = "🌳"; break;
        case 'shop': colorClass = isVisited ? "bg-gray-400" : "bg-purple-500"; iconEmoji = "🛍️"; break;
        case 'food': colorClass = isVisited ? "bg-gray-400" : "bg-amber-500"; iconEmoji = "🍖"; break;
        case 'toy': colorClass = isVisited ? "bg-gray-400" : "bg-blue-400"; iconEmoji = "🎾"; break;
        case 'care': colorClass = isVisited ? "bg-gray-400" : "bg-emerald-500"; iconEmoji = "💊"; break;
    }

    if (isPremium && !isVisited) {
        glow = "box-shadow: 0 0 15px 2px rgba(255, 215, 0, 0.6); border: 2px solid gold;";
    }

    return L.divIcon({
        className: "custom-marker-icon",
        html: `
            <div style="
                width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; 
                border-radius: 50%; background-color: ${isVisited ? '#e5e7eb' : 'white'}; 
                position: relative; ${glow} box-shadow: 0 4px 10px rgba(0,0,0,0.3); opacity: ${isVisited ? 0.8 : 1};
            ">
                <div class="${colorClass}" style="
                    width: 30px; height: 30px; border-radius: 50%; display: flex; 
                    align-items: center; justify-content: center; color: white; font-size: 16px;
                ">
                    ${isVisited ? '✅' : iconEmoji}
                </div>
                ${isPremium && !isVisited ? `<div style="position: absolute; top: -5px; right: -5px; font-size: 12px;">🌟</div>` : ''}
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
    });
};

const createMarkIcon = (mark: MapMark) => {
    const bgColorClass = {
        'info': '#dcfce7', // green-100
        'warning': '#ffedd5', // orange-100
        'social': '#dbeafe', // blue-100
        'love': '#fce7f3', // pink-100
    }[mark.type] || '#ffffff';

    const borderColorClass = {
        'info': '#22c55e',
        'warning': '#f97316',
        'social': '#3b82f6',
        'love': '#ec4899',
    }[mark.type] || '#9ca3af';

    return L.divIcon({
        className: "custom-mark-icon",
        html: `
            <div style="
                width: 40px; height: 40px; border-radius: 50% 50% 50% 5px; transform: rotate(-45deg); display: flex; 
                align-items: center; justify-content: center; border: 2px solid ${borderColorClass}; background-color: ${bgColorClass}; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            ">
                <div style="transform: rotate(45deg); font-size: 20px;">
                    ${mark.emoji}
                </div>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -30]
    });
};

// --- MAP CONTROLS ENGINE (The Brain) ---
function MapEngine({ center, searchQuery, filterType, setRouteTo, userPos }: { center: [number, number], searchQuery: string, filterType: string | null, setRouteTo: (p: [number, number] | null) => void, userPos: [number, number] }) {
    const map = useMap();

    // Auto-center on route or search
    useEffect(() => {
        // If searching, find place and fly to it
        if (searchQuery) {
            const place = PLACES.find(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
            if (place) {
                map.flyTo([place.lat, place.lng], 16);
                setRouteTo([place.lat, place.lng]); // Auto route
            }
        }
    }, [searchQuery, map]);

    // Initial center on user or when userPos changes significantly
    useEffect(() => {
        map.flyTo(userPos, 15);
    }, [userPos]);

    return null;
}

export default function LiveMap({ 
    userPos, path, isTracking, visitedPlaceIds, 
    onPlaceClick, guardianMode, deliveryPos, deliveryPath,
    externalSearchQuery, externalFilterType, forceGuardianMode, 
    hideInternalUI, markers: externalMarkers
}: LiveMapProps) {
    // UI State
    const [searchQuery, setSearchQuery] = useState(externalSearchQuery || "");
    const [searchResults, setSearchResults] = useState<any[]>([]); // Real Address Results
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [filterType, setFilterType] = useState<string | null>(externalFilterType || null);
    const [routeTo, setRouteTo] = useState<[number, number] | null>(null);
    const [routePath, setRoutePath] = useState<[number, number][]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync with external controls
    useEffect(() => {
        if (externalSearchQuery !== undefined) setSearchQuery(externalSearchQuery);
    }, [externalSearchQuery]);

    useEffect(() => {
        if (externalFilterType !== undefined) setFilterType(externalFilterType);
    }, [externalFilterType]);

    // REAL STREET ROUTING (OSRM)
    useEffect(() => {
        if (!routeTo) {
            setRoutePath([]);
            return;
        }

        const fetchRoute = async () => {
            try {
                // OSRM coordinates are [lng, lat]
                const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userPos[1]},${userPos[0]};${routeTo[1]},${routeTo[0]}?overview=full&geometries=geojson`);
                const data = await res.json();
                if (data.routes && data.routes[0]) {
                    const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
                    setRoutePath(coords);
                }
            } catch (e) {
                console.error("Routing Error", e);
                // Fallback to straight line
                setRoutePath([userPos, routeTo]);
            }
        };

        fetchRoute();
    }, [routeTo, userPos]);

    // Moffi World State
    const [marks, setMarks] = useState<MapMark[]>(MOCK_MARKS);
    const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);

    // Guardian Mode State
    const [searchParty, setSearchParty] = useState<{ id: string, lat: number, lng: number }[]>([]);

    const isSOSActive = guardianMode || forceGuardianMode;

    useEffect(() => {
        if (isSOSActive) {
            // Generate fake search party members around the user
            const newParty = Array.from({ length: 12 }).map((_, i) => ({
                id: `sp-${i}`,
                lat: userPos[0] + (Math.random() - 0.5) * 0.008,
                lng: userPos[1] + (Math.random() - 0.5) * 0.008,
            }));
            setSearchParty(newParty);
        } else {
            setSearchParty([]);
        }
    }, [isSOSActive, userPos]);

    // REAL SEARCH LOGIC (Nominatim)
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 3) {
            setSearchResults([]);
            return;
        }

        // Debounce
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&accept-language=tr&limit=5`,
                    {
                        headers: {
                            'User-Agent': 'Moffi-App-V1'
                        }
                    }
                );
                const data = await res.json();
                setSearchResults(data);
            } catch (e) {
                console.error("Search Error", e);
            }
        }, 600); 

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchQuery]);

    // Handle Address Select
    const handleSelectAddress = (lat: string, lon: string, name: string) => {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        setRouteTo([latitude, longitude]);
        setSearchResults([]);
        setSearchQuery(name); // Update input to full name
        setIsSearchFocused(false);
    };

    // Filters
    const filters = [
        { id: 'vet', label: 'Veteriner', icon: Stethoscope, color: 'text-red-500 bg-red-50' },
        { id: 'cafe', label: 'Kafe', icon: Coffee, color: 'text-orange-500 bg-orange-50' },
        { id: 'park', label: 'Park', icon: Trees, color: 'text-green-500 bg-green-50' },
        { id: 'shop', label: 'Market', icon: ShoppingBag, color: 'text-purple-500 bg-purple-50' },
    ];

    // Filtered Places (Local Mock Data)
    const displayedPlaces = PLACES.filter(p => {
        if (filterType && p.type !== filterType) return false;
        // Local search continues to work on Mock Data too!
        if (searchQuery && p.name.toLowerCase().includes(searchQuery.toLowerCase()) && searchResults.length === 0) return true;
        if (searchQuery && searchResults.length > 0) return true; // Show all if searching real web
        if (searchQuery) return false; // Hide if searching and not matching local
        return true;
    });

    const handleCreateMark = (data: { type: string, emoji: string, message: string }) => {
        const newMark: MapMark = {
            id: Date.now().toString(),
            type: data.type as any,
            emoji: data.emoji,
            message: data.message,
            lat: userPos[0] + (Math.random() - 0.5) * 0.0005, // Slight jitter for demo overlap
            lng: userPos[1] + (Math.random() - 0.5) * 0.0005,
            user: '@Ben',
            timestamp: 'Şimdi',
            likes: 0
        };
        setMarks(prev => [...prev, newMark]);
    };

    return (
        <div className="w-full h-full relative z-0">
            {/* Modal */}
            <MarkCreationModal
                isOpen={isMarkModalOpen}
                onClose={() => setIsMarkModalOpen(false)}
                onSubmit={handleCreateMark}
            />

            {/* --- GOOGLE STYLE FLOATING UI --- */}
            {!hideInternalUI && (
                <div className={cn("absolute top-24 left-4 right-4 z-[5000] flex flex-col gap-3 pointer-events-none transition-all duration-500", isTracking ? "translate-y-12" : "translate-y-0")}>

                {/* 1. SEARCH BAR */}
                <div className="shadow-xl relative z-[5001] pointer-events-auto">
                    <div className={cn("bg-white dark:bg-[#1A1A1A] rounded-2xl flex items-center p-3 transition-all border border-transparent", isSearchFocused ? "ring-2 ring-[#5B4D9D] border-[#5B4D9D]" : "border-gray-200 dark:border-white/10")}>
                        <Search className="w-5 h-5 text-gray-400 mr-3" />
                        <input
                            type="text"
                            placeholder="Mekan veya adres ara..."
                            className="bg-transparent flex-1 outline-none text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            // Delay blur to allow click on results
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        />
                        {/* Current Location Quick Button (re-center) */}
                        {searchQuery && <button onClick={() => { setSearchQuery(""); setRouteTo(null); setSearchResults([]); }} className="p-1 bg-gray-100 rounded-full"><div className="w-3 h-3 text-gray-500 px-1">✕</div></button>}
                    </div>

                    {/* SEARCH RESULTS DROPDOWN */}
                    {isSearchFocused && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                            {searchResults.map((result: any, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSelectAddress(result.lat, result.lon, result.display_name)}
                                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-white/5 border-b last:border-0 border-gray-100 dark:border-white/5 transition-colors"
                                >
                                    <div className="mt-1 min-w-[16px]"><MapPin className="w-4 h-4 text-gray-400" /></div>
                                    <div className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">
                                        {result.display_name}
                                    </div>
                                </button>
                            ))}
                            <div className="bg-gray-50 dark:bg-black/50 px-4 py-2 text-[10px] text-center text-gray-400 font-bold uppercase tracking-wider">
                                Nominatim ile sonuçlar
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. FILTER CHIPS (Only in Tracking Mode) */}
                {isTracking && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2 pl-1">
                        <button
                            onClick={() => setFilterType(null)}
                            className={cn("px-4 py-2 rounded-full text-xs font-bold shadow-sm border whitespace-nowrap transition-colors", !filterType ? "bg-[#5B4D9D] text-white border-transparent" : "bg-white text-gray-600 border-gray-200")}
                        >
                            Tümü
                        </button>
                        {filters.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilterType(filterType === f.id ? null : f.id)}
                                className={cn("px-3 py-2 rounded-full text-xs font-bold shadow-sm border flex items-center gap-1.5 whitespace-nowrap transition-colors bg-white",
                                    filterType === f.id ? "ring-2 ring-[#5B4D9D] border-[#5B4D9D]" : "border-gray-200"
                                )}
                            >
                                <f.icon className={cn("w-3.5 h-3.5", f.color.split(' ')[0])} />
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. SOS & LOCATION BUTTONS (Bottom Right) */}
            <div className="absolute bottom-24 right-4 z-[500] flex flex-col gap-3 pointer-events-auto">
                {/* SOS: Find nearest Vet */}
                <button
                    onClick={() => {
                        setFilterType('vet');
                        setSearchQuery("Vet"); // Hack to trigger search/fly logic for nearest
                        // In real app: calculate nearest and route
                    }}
                    className="w-12 h-12 bg-red-500 rounded-full text-white shadow-xl shadow-red-500/30 flex items-center justify-center animate-pulse-slow"
                >
                    <AlertCircle className="w-6 h-6" />
                </button>
            </div>


            <MapContainer
                center={userPos}
                zoom={15}
                style={{ width: "100%", height: "100%" }}
                zoomControl={false}
                className={cn("bg-gray-100 dark:bg-[#111] transition-all duration-1000", guardianMode && "grayscale brightness-50 contrast-125 sepia-[.3]")}
            >
                {guardianMode && <GuardianStatusOverlay />}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap &copy; CARTO'
                />

                <MapEngine center={userPos} searchQuery={searchQuery} filterType={filterType} setRouteTo={setRouteTo} userPos={userPos} />

                {/* ROUTES (Navigation Line) */}
                {routePath.length > 0 && (
                    <Polyline
                        positions={routePath}
                        pathOptions={{ color: '#3B82F6', weight: 6, opacity: 0.8, lineCap: 'round' }}
                    />
                )}

                {/* Tracking Path */}
                {isTracking && path.length > 1 && (
                    <Polyline
                        positions={path}
                        pathOptions={{ color: '#5B4D9D', weight: 6, opacity: 0.8, lineCap: 'round' }}
                    />
                )}

                {/* VISIBLE PLACES */}
                {displayedPlaces.map((place) => {
                    const isVisited = visitedPlaceIds.includes(place.id);
                    return (
                        <Marker
                            key={place.id}
                            position={[place.lat, place.lng]}
                            icon={createCustomIcon(place.type, place.isPremium, isVisited)}
                            eventHandlers={{
                                click: () => {
                                    setRouteTo([place.lat, place.lng]);
                                    if (onPlaceClick) onPlaceClick(place);
                                }
                            }}
                        >
                            <Popup className="custom-popup">
                                <div className="p-1 min-w-[180px]">
                                    <h3 className="font-bold text-sm text-gray-900">{place.name}</h3>
                                    <div className="text-blue-500 text-xs font-bold mt-1 flex items-center gap-1 cursor-pointer" onClick={() => setRouteTo([place.lat, place.lng])}>
                                        <Navigation className="w-3 h-3" /> Yol Tarifi
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* EXTERNAL DYNAMIC MARKERS (Lost Pets, Friends, etc.) */}
                {externalMarkers?.map((marker) => (
                    <Marker
                        key={marker.id}
                        position={[marker.lat, marker.lng]}
                        icon={createCustomIcon(marker.type === 'lost' ? 'vet' : marker.type === 'friend' ? 'social' : marker.type, false, false)}
                    >
                        <Popup className="custom-popup">
                            <div className="p-2 min-w-[150px]">
                                <div className="flex items-center gap-2 mb-2">
                                    {marker.img && <img src={marker.img} className="w-8 h-8 rounded-full object-cover border border-gray-200" />}
                                    <div>
                                        <h3 className="font-bold text-sm text-gray-900">{marker.title}</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                            {marker.type === 'lost' ? '⚠️ KAYIP ALARMI' : '👤 MOFFI DOSTU'}
                                        </p>
                                    </div>
                                </div>
                                {marker.desc && <p className="text-xs text-gray-600 mb-2">{marker.desc}</p>}
                                <button 
                                    onClick={() => setRouteTo([marker.lat, marker.lng])}
                                    className="w-full py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                                >
                                    <Navigation className="w-3 h-3" /> Yol Tarifi
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* USER POSITION */}
                {isSOSActive ? (
                    <>
                        {/* Emergency Hot Zone */}
                        <Circle
                            center={userPos}
                            radius={800}
                            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2, weight: 1, dashArray: '20, 20' }}
                        >
                            <Marker position={[userPos[0] + 0.002, userPos[1]]} icon={L.divIcon({ html: '<div class="text-red-500 font-bold text-xs bg-black/50 px-2 py-1 rounded">KAYIP BÖLGESİ</div>', className: 'bg-transparent' })} />
                        </Circle>

                        {/* Search Party Members */}
                        {searchParty.map(sp => (
                            <Marker
                                key={sp.id}
                                position={[sp.lat, sp.lng]}
                                icon={L.divIcon({
                                    className: '',
                                    html: `<div class="w-8 h-8 rounded-full bg-white border-2 border-red-500 flex items-center justify-center text-xs font-bold animate-pulse shadow-lg shadow-red-500/50">👤</div>`,
                                    iconSize: [32, 32]
                                })}
                            />
                        ))}
                    </>
                ) : (
                    <Circle
                        center={userPos}
                        radius={50}
                        pathOptions={{ color: '#5B4D9D', fillColor: '#5B4D9D', fillOpacity: 0.1, weight: 1 }}
                    />
                )}

                {/* DELIVERY TRACKING VISUALIZATION */}
                {deliveryPos && (
                    <>
                        {/* Courier Path */}
                        {deliveryPath && (
                            <Polyline
                                positions={deliveryPath}
                                pathOptions={{ 
                                    color: '#FF9500', 
                                    weight: 4, 
                                    opacity: 0.6, 
                                    dashArray: '10, 10' 
                                }}
                            />
                        )}
                        {/* Courier Marker */}
                        <Marker
                            position={deliveryPos}
                            icon={L.divIcon({
                                className: 'courier-icon',
                                html: `
                                    <div style="
                                        width: 40px; height: 40px; background: #FF9500; 
                                        border: 3px solid white; border-radius: 50%; shadow: 0 4px 15px rgba(255,149,0,0.4);
                                        display: flex; align-items: center; justify-content: center; font-size: 20px;
                                    ">
                                        🛵
                                    </div>
                                `,
                                iconSize: [40, 40],
                                iconAnchor: [20, 20]
                            })}
                        />
                    </>
                )}

                <Marker
                    position={userPos}
                    icon={L.divIcon({
                        className: '',
                        html: `<div style="width: 24px; height: 24px; background: ${guardianMode ? '#ef4444' : '#5B4D9D'}; border: 4px solid white; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.4); ${guardianMode ? 'animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;' : ''}"></div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    })}
                />

            </MapContainer>
        </div>
    );
}
