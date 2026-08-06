"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { PLACES, Place } from "@/data/mockPlaces";
import { MOCK_MARKS, MapMark } from "@/data/mockMarks";
import { Star, Gift, Coins, Search, Coffee, Stethoscope, Trees, ShoppingBag, AlertCircle, Navigation, MapPin, Plus, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkCreationModal } from "./MarkCreationModal";
import { GuardianStatusOverlay } from "@/components/guardian/GuardianStatusOverlay";
import { useTheme } from "@/context/ThemeContext";

// Inject minimal popup CSS globally since Leaflet popups are rendered outside React DOM tree sometimes
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        .minimal-glass-popup .leaflet-popup-content-wrapper {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            padding: 4px;
        }
        .minimal-glass-popup .leaflet-popup-tip {
            background: rgba(255, 255, 255, 0.85);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }
        .minimal-glass-popup .leaflet-popup-content {
            margin: 8px;
        }
    `;
    document.head.appendChild(style);
}

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
    // Custom Waypoint Support
    onMapLongPress?: (pos: [number, number]) => void;
    customTargetPos?: [number, number] | null;
    customTargetClaimed?: boolean;
}

// --- CUSTOM ICON ---
const createCustomIcon = (type: string, isPremium: boolean, isVisited: boolean, isSelected: boolean = false, anySelected: boolean = false) => {
    const config: any = {
        'vet': { color: '#ef4444', icon: '🏥' },
        'cafe': { color: '#f97316', icon: '☕' },
        'park': { color: '#22c55e', icon: '🌳' },
        'shop': { color: '#a855f7', icon: '🛍️' },
        'food': { color: '#f59e0b', icon: '🍖' },
        'toy': { color: '#38bdf8', icon: '🎾' },
        'care': { color: '#10b981', icon: '💊' },
        'default': { color: '#3b82f6', icon: '📍' }
    }[type] || { color: '#3b82f6', icon: '📍' };

    let glow = "";
    if (isPremium && !isVisited) {
        glow = "box-shadow: 0 0 15px 2px rgba(255, 215, 0, 0.6); border: 2px solid gold;";
    }

    return L.divIcon({
        className: "custom-marker-icon",
        html: `
            <div style="
                width: ${isSelected ? '44px' : '32px'}; 
                height: ${isSelected ? '44px' : '32px'}; 
                background: ${isPremium ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : '#ffffff'}; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                box-shadow: ${isSelected ? '0 0 0 6px rgba(99, 102, 241, 0.3), 0 10px 25px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.15)'}; 
                border: ${isSelected ? '3px' : '2px'} solid ${isPremium ? '#ffffff' : (config.color || '#CBD5E1')};
                position: relative;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                transform: ${isSelected ? 'scale(1.1) translateY(-10px)' : 'scale(1)'};
                z-index: ${isSelected ? 1000 : 1};
                opacity: ${!isSelected && anySelected ? '0.3' : '1'};
                filter: ${!isSelected && anySelected ? 'grayscale(0.5)' : 'none'};
            ">
                <div style="
                    width: ${isSelected ? '28px' : '20px'}; 
                    height: ${isSelected ? '28px' : '20px'}; 
                    border-radius: 50%; display: flex; 
                    align-items: center; justify-content: center; color: white; 
                    font-size: ${isSelected ? '14px' : '10px'};
                    background-color: ${isVisited ? '#e5e7eb' : config.color};
                ">
                    ${isVisited ? '✅' : config.icon}
                </div>
                ${isPremium && !isVisited ? `<div style="position: absolute; top: -5px; right: -5px; font-size: 12px;">🌟</div>` : ''}
            </div>
        `,
        iconSize: [isSelected ? 44 : 32, isSelected ? 44 : 32],
        iconAnchor: [isSelected ? 22 : 16, isSelected ? 44 : 32],
        popupAnchor: [0, -32]
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
function MapEngine({ center, searchQuery, filterType, setRouteTo, userPos, routeTo }: { center: [number, number], searchQuery: string, filterType: string | null, setRouteTo: (p: [number, number] | null) => void, userPos: [number, number], routeTo: [number, number] | null }) {
    const map = useMap();

    useEffect(() => {
        if (!routeTo) {
            map.flyTo(userPos, 12); // Zoom level 12 shows roughly a 9km radius nicely
        }
    }, [userPos]);

    // Fly to selected place when clicked
    useEffect(() => {
        if (routeTo) {
            map.flyTo(routeTo, 15, { duration: 1.2, easeLinearity: 0.25 });
        }
    }, [routeTo]);

    return null;
}

function MapEventsHandler({ onMapLongPress }: { onMapLongPress?: (latlng: L.LatLng) => void }) {
    useMapEvents({
        dblclick(e) {
            if (onMapLongPress) onMapLongPress(e.latlng);
        },
        contextmenu(e) {
            if (onMapLongPress) onMapLongPress(e.latlng);
        }
    });
    return null;
}

export default function LiveMap({ 
    userPos, path, isTracking, visitedPlaceIds, 
    onPlaceClick, guardianMode, deliveryPos, deliveryPath,
    externalSearchQuery, externalFilterType, forceGuardianMode, 
    hideInternalUI, markers: externalMarkers,
    onMapLongPress, customTargetPos, customTargetClaimed
}: LiveMapProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // UI State
    const [searchQuery, setSearchQuery] = useState(externalSearchQuery || "");
    const [searchResults, setSearchResults] = useState<any[]>([]); // Real Address Results
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [filterType, setFilterType] = useState<string | null>(externalFilterType || null);
    const [routeTo, setRouteTo] = useState<[number, number] | null>(null);
    const [routePath, setRoutePath] = useState<[number, number][]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Dynamic Places List (Real OSM Data with local mock fallback)
    const [placesList, setPlacesList] = useState<Place[]>(PLACES);

    useEffect(() => {
        let isMounted = true;
        
        const fetchRealPlaces = async () => {
            try {
                // Query Overpass API for veterinary, park, cafe, pet_shop within 9000m (9km) of userPos
                // Using 'nwr' (node/way/relation) and 'out center' ensures we don't miss places mapped as buildings/areas!
                const query = `[out:json][timeout:5];(nwr["amenity"="veterinary"](around:9000,${userPos[0]},${userPos[1]});nwr["leisure"="park"](around:9000,${userPos[0]},${userPos[1]});nwr["amenity"="cafe"](around:9000,${userPos[0]},${userPos[1]});nwr["shop"="pet"](around:9000,${userPos[0]},${userPos[1]}););out center;`;
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds MAX wait
                
                const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) throw new Error("Overpass query failed");
                const data = await response.json();
                
                if (isMounted && data.elements && data.elements.length > 0) {
                    const mapped = data.elements.map((el: any) => {
                        let type = 'cafe';
                        if (el.tags.amenity === 'veterinary') type = 'vet';
                        else if (el.tags.leisure === 'park') type = 'park';
                        else if (el.tags.shop === 'pet' || el.tags.amenity === 'pet_shop') type = 'shop';
                        
                        const lat = el.lat || el.center?.lat;
                        const lng = el.lon || el.center?.lon;

                        return {
                            id: String(el.id),
                            name: el.tags.name || (type === 'vet' ? 'Veteriner' : type === 'park' ? 'Park' : type === 'shop' ? 'Pet Shop' : 'Kafe'),
                            lat: lat,
                            lng: lng,
                            type: type as any,
                            isPremium: Math.random() > 0.85,
                            coinReward: Math.floor(Math.random() * 20) + 10
                        };
                    }).filter((el: any) => el.lat && el.lng); // Ensure we have valid coordinates
                    setPlacesList(mapped);
                } else if (isMounted) {
                    // Fallback to shifting mock PLACES to userPos if no real places found nearby
                    const shiftedMock = PLACES.map((p, idx) => ({
                        ...p,
                        lat: userPos[0] + (Math.random() - 0.5) * 0.03, // Randomly spread within ~1.5km
                        lng: userPos[1] + (Math.random() - 0.5) * 0.03,
                        type: p.type === 'veteriner' ? 'vet' : p.type // Fix mock data type mapping if any
                    }));
                    setPlacesList(shiftedMock as any);
                }
            } catch (err) {
                console.error("OSM Places fetch error, falling back to mock:", err);
                if (isMounted) {
                    const shiftedMock = PLACES.map((p, idx) => ({
                        ...p,
                        lat: userPos[0] + (Math.random() - 0.5) * 0.03,
                        lng: userPos[1] + (Math.random() - 0.5) * 0.03,
                        type: p.type === 'veteriner' ? 'vet' : p.type
                    }));
                    setPlacesList(shiftedMock as any);
                }
            }
        };

        fetchRealPlaces();
        
        return () => {
            isMounted = false;
        };
    }, [userPos]);

    // Sync with external controls
    useEffect(() => {
        if (externalSearchQuery !== undefined) setSearchQuery(externalSearchQuery);
    }, [externalSearchQuery]);

    useEffect(() => {
        if (externalFilterType !== undefined) setFilterType(externalFilterType);
    }, [externalFilterType]);

    // REAL STREET ROUTING (OSRM) - REMOVED (External Google Maps used instead for directions)
    useEffect(() => {
        if (!routeTo) {
            setRoutePath([]);
            return;
        }
        // Removed internal OSRM routing to reduce bloat as per Option 1
        setRoutePath([userPos, routeTo]);
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
    const mapInstance = useRef<L.Map | null>(null);

    const handleSelectAddress = (lat: string, lon: string, displayName: string) => {
        const l = parseFloat(lat);
        const lg = parseFloat(lon);
        setRouteTo([l, lg]);
        setSearchQuery(displayName);
        setIsSearchFocused(false);
        // Explicitly fly to selected real address
        if (mapInstance.current) {
            mapInstance.current.flyTo([l, lg], 16);
        }
    };

    // Filters
    const filters = [
        { id: 'vet', label: 'Veteriner', icon: Stethoscope, color: 'text-red-500 bg-red-50' },
        { id: 'cafe', label: 'Kafe', icon: Coffee, color: 'text-orange-500 bg-orange-50' },
        { id: 'park', label: 'Park', icon: Trees, color: 'text-green-500 bg-green-50' },
        { id: 'shop', label: 'Pet Shop', icon: ShoppingBag, color: 'text-purple-500 bg-purple-50' },
    ];

    // Filtered Places (Real OSM Data with local mock fallback)
    const displayedPlaces = placesList.filter(p => {
        if (filterType && p.type !== filterType) return false;
        if (searchQuery && p.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
        if (searchQuery) return false;
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
                <div className="absolute top-[76px] left-6 right-6 z-[5000] flex items-center gap-4 pointer-events-none transition-all duration-500">
                    
                    {/* 1. SEARCH BAR (Expandable) */}
                    <div className="relative z-[5001] pointer-events-auto flex justify-start">
                        <div 
                            className={cn(
                                "bg-white/90 dark:bg-[#121215]/90 backdrop-blur-xl flex items-center transition-all duration-500 overflow-hidden shadow-lg",
                                isSearchExpanded 
                                    ? "w-[260px] md:w-[320px] rounded-2xl p-2.5" 
                                    : "w-11 h-11 rounded-full justify-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#18181b]"
                            )}
                            onClick={() => !isSearchExpanded && setIsSearchExpanded(true)}
                        >
                            <Search 
                                className={cn(
                                    "text-zinc-500 dark:text-zinc-400 shrink-0 transition-all", 
                                    isSearchExpanded ? "w-4 h-4 mr-3 cursor-default" : "w-5 h-5 cursor-pointer"
                                )} 
                            />
                            
                            {isSearchExpanded && (
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Mekan veya adres ara..."
                                    className="bg-transparent flex-1 outline-none text-xs font-bold text-zinc-850 dark:text-[#fafafa] placeholder-zinc-400 min-w-0"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => {
                                        setTimeout(() => {
                                            setIsSearchFocused(false);
                                            // Auto-collapse if empty and clicked outside
                                            if (!searchQuery) setIsSearchExpanded(false);
                                        }, 200);
                                    }}
                                />
                            )}
                            
                            {isSearchExpanded && searchQuery && (
                                <button onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setSearchQuery(""); 
                                    setRouteTo(null); 
                                    setSearchResults([]); 
                                }} className="p-1 hover:bg-zinc-100 dark:hover:bg-[#27272a] rounded-full shrink-0 ml-1 transition-colors">
                                    <X className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                                </button>
                            )}

                            {isSearchExpanded && !searchQuery && (
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    setIsSearchExpanded(false);
                                    setIsSearchFocused(false);
                                }} className="p-1 hover:bg-zinc-100 dark:hover:bg-[#27272a] rounded-full shrink-0 ml-1 transition-colors">
                                    <X className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                                </button>
                            )}
                        </div>

                        {/* SEARCH RESULTS DROPDOWN */}
                        {isSearchFocused && searchResults.length > 0 && isSearchExpanded && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-[260px] md:w-[320px] bg-white dark:bg-[#121215] rounded-2xl shadow-2xl border border-zinc-200 dark:border-[#27272a] overflow-hidden">
                                {searchResults.map((result: any, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSelectAddress(result.lat, result.lon, result.display_name)}
                                        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-[#18181b] border-b last:border-0 border-zinc-100 dark:border-[#27272a] transition-colors"
                                    >
                                        <div className="mt-0.5 min-w-[16px]"><MapPin className="w-3.5 h-3.5 text-zinc-400" /></div>
                                        <div className="text-xs font-bold text-zinc-800 dark:text-[#fafafa] line-clamp-2">
                                            {result.display_name}
                                        </div>
                                    </button>
                                ))}
                                <div className="bg-zinc-50 dark:bg-[#0b0c0f] px-4 py-2 text-[9px] text-center text-zinc-400 font-black uppercase tracking-widest">
                                    Nominatim ile sonuçlar
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. FILTER CHIPS (Text-only minimalist) */}
                    {!isSearchExpanded && isTracking && (
                        <div className="flex gap-5 overflow-x-auto no-scrollbar pointer-events-auto items-center pl-2">
                            <button
                                onClick={() => setFilterType(null)}
                                className={cn("text-[10px] font-black uppercase tracking-wider transition-all drop-shadow-md hover:text-indigo-500 flex flex-col items-center gap-1", 
                                    !filterType ? "text-indigo-600 dark:text-indigo-400 scale-105" : "text-zinc-700 dark:text-zinc-100"
                                )}
                            >
                                <span>Tümü</span>
                                {!filterType && <div className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                            </button>
                            
                            {filters.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilterType(filterType === f.id ? null : f.id)}
                                    className={cn("text-[10px] font-black uppercase tracking-wider transition-all drop-shadow-md hover:text-indigo-500 flex flex-col items-center gap-1",
                                        filterType === f.id ? "text-indigo-600 dark:text-indigo-400 scale-105" : "text-zinc-700 dark:text-zinc-100"
                                    )}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <f.icon className="w-3.5 h-3.5" />
                                        <span>{f.label}</span>
                                    </div>
                                    {filterType === f.id && <div className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 3. LOCATION BUTTONS (Bottom Right) - SOS Button removed for simplicity */}
            <div className="absolute bottom-24 right-4 z-[500] flex flex-col gap-3 pointer-events-auto">
                {/* Future location control buttons can go here */}
            </div>


            <MapContainer
                center={userPos}
                zoom={15}
                zoomControl={false}
                ref={mapInstance}
                doubleClickZoom={false}
                className={cn("w-full h-full z-0 bg-gray-100 dark:bg-[#111] transition-all duration-1000", guardianMode && "grayscale brightness-50 contrast-125 sepia-[.3]")}
            >
                {guardianMode && <GuardianStatusOverlay />}
                <TileLayer
                    key={isDark ? 'dark-map' : 'light-map'}
                    url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
                    attribution='&copy; OpenStreetMap &copy; CARTO'
                />

                <MapEngine center={userPos} searchQuery={searchQuery} filterType={filterType} setRouteTo={setRouteTo} userPos={userPos} />
                <MapEventsHandler onMapLongPress={(latlng) => { if (onMapLongPress) onMapLongPress([latlng.lat, latlng.lng]); }} />

                {/* CUSTOM TARGET PIN */}
                {customTargetPos && (
                    <Marker
                        position={customTargetPos}
                        icon={L.divIcon({
                            className: "custom-target-icon",
                            html: `
                                <div style="
                                    width: 40px; height: 40px; border-radius: 50% 50% 50% 5px; transform: rotate(-45deg); display: flex; 
                                    align-items: center; justify-content: center; border: 2px solid #f59e0b; background-color: #fef3c7; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                                ">
                                    <div style="transform: rotate(45deg); font-size: 20px;">
                                        ${customTargetClaimed ? '✅' : '🚩'}
                                    </div>
                                </div>
                            `,
                            iconSize: [40, 40],
                            iconAnchor: [20, 20]
                        })}
                    />
                )}

                {/* Guideline to custom target */}
                {customTargetPos && !customTargetClaimed && (
                    <Polyline
                        positions={[userPos, customTargetPos]}
                        pathOptions={{ color: '#f59e0b', weight: 3, opacity: 0.5, dashArray: '5, 10' }}
                    />
                )}

                {/* ROUTES (Navigation Line - Dashed Guideline) */}
                {routeTo && (
                    <Polyline
                        positions={[userPos, routeTo]}
                        pathOptions={{ color: '#6366f1', weight: 4, opacity: 0.8, dashArray: '8, 12', lineCap: 'round' }}
                    />
                )}

                {/* Tracking Path */}
                {isTracking && path.length > 1 && (
                    <>
                        <Polyline
                            positions={path}
                            pathOptions={{ color: '#c084fc', weight: 12, opacity: 0.3, lineCap: 'round' }}
                        />
                        <Polyline
                            positions={path}
                            pathOptions={{ color: '#5B4D9D', weight: 6, opacity: 0.9, lineCap: 'round' }}
                        />
                    </>
                )}

                {/* VISIBLE PLACES */}
                {displayedPlaces.map((place) => {
                    const isVisited = visitedPlaceIds.includes(place.id);
                    const isSelected = routeTo?.[0] === place.lat && routeTo?.[1] === place.lng;
                    const anySelected = routeTo !== null;
                    return (
                        <Marker
                            key={place.id}
                            position={[place.lat, place.lng]}
                            icon={createCustomIcon(place.type, place.isPremium, isVisited, isSelected, anySelected)}
                            eventHandlers={{
                                click: () => {
                                    setRouteTo([place.lat, place.lng]);
                                    if (onPlaceClick) onPlaceClick(place);
                                }
                            }}
                        >
                            <Popup className="minimal-glass-popup" closeButton={false} offset={[0, -20]}>
                                <div className="flex flex-col gap-2 min-w-[140px] items-center p-1">
                                    <div className="font-black text-xs text-zinc-800 text-center leading-tight">
                                        {place.name}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`, '_blank');
                                        }}
                                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg shadow-md transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <Navigation className="w-3 h-3" />
                                        Yol Tarifi
                                    </button>
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
                        eventHandlers={{
                            click: () => {
                                setRouteTo([marker.lat, marker.lng]);
                                if (onPlaceClick) onPlaceClick(marker);
                            }
                        }}
                    />
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
                                    html: `<div class="w-8 h-8 rounded-full bg-card border-2 border-red-500 flex items-center justify-center text-xs font-bold animate-pulse shadow-lg shadow-red-500/50">👤</div>`,
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
