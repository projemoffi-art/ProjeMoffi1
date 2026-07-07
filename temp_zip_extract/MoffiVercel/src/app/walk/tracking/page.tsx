"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Pause, Play, StopCircle, Camera, Music,
    Zap, Timer, Flame, CheckCircle2, ChevronLeft, X,
    SkipForward, SkipBack, Share2, Search, Mic, Home, LayoutGrid,
    AlertTriangle, Droplets, Bone, Plus, Heart, Activity,
    Skull, AlertOctagon, Footprints, MessageSquarePlus,
    Car, Syringe, Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bluetooth, BluetoothConnected, BluetoothSearching, Smartphone } from "lucide-react";
import { parseHeartRate, HR_SERVICE_UUID, HR_CHARACTERISTIC_UUID } from "@/lib/bluetoothManager";
import { PLACES, Place } from "@/data/mockPlaces";
import { useActivity } from "@/context/ActivityContext";
import { usePet } from "@/context/PetContext";

// Helper for dist
function getDistKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

import { MOCK_MARKS } from "@/data/mockMarks";

const LiveMap = dynamic(() => import('@/components/walk/GoogleLiveMap'), { ssr: false, loading: () => <div className="bg-[#1A1A1A] w-full h-full flex items-center justify-center text-white font-bold">Harita Yükleniyor...</div> });

function TrackingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams?.get('mode');
    const { walkData, startWalk, pauseWalk, resumeWalk, stopWalk, setWalkData } = useActivity();
    const { activePet } = usePet();
    
    const [userPos, setUserPos] = useState<[number, number]>([41.0082, 28.9784]);
    const [path, setPath] = useState<[number, number][]>([]);
    const [showStopConfirm, setShowStopConfirm] = useState(false);
    const [visitedPlaceIds, setVisitedPlaceIds] = useState<string[]>([]);
    const [reward, setReward] = useState<Place | null>(null);
    const [customTargetPos, setCustomTargetPos] = useState<[number, number] | null>(null);
    const [customTargetClaimed, setCustomTargetClaimed] = useState<boolean>(false);

    // Simulated Stats
    const [pulse, setPulse] = useState(72);

    // Heart Rate Simulation
    useEffect(() => {
        if (walkData.isActive && !walkData.isPaused) {
            const interval = setInterval(() => {
                setPulse(prev => {
                    const target = 110 + Math.random() * 20;
                    return prev + (target - prev) * 0.1;
                });
            }, 2000);
            return () => clearInterval(interval);
        } else {
            const interval = setInterval(() => {
                setPulse(prev => {
                    const target = 72 + Math.random() * 5;
                    return prev + (target - prev) * 0.05;
                });
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [walkData.isActive, walkData.isPaused]);

    // Marks State (Lifted Up)
    const [marks, setMarks] = useState(MOCK_MARKS);

    // STATE
    const [activeModal, setActiveModal] = useState<'camera' | 'music' | null>(null);
    const [activeSidebar, setActiveSidebar] = useState<'danger' | null>(null);
    const [musicService, setMusicService] = useState<'spotify' | 'yt' | null>(null);
    const [musicQuery, setMusicQuery] = useState("");
    const [currentEmbedUrl, setCurrentEmbedUrl] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

    // Bluetooth States
    const [bleConnectionStatus, setBleConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
    const [coins, setCoins] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

    const watchIdRef = useRef<number | null>(null);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // --- SYNC MAP WITH GLOBAL GPS ---
    useEffect(() => {
        if (walkData && Array.isArray(walkData.path) && walkData.path.length > 0) {
            const lastPos = walkData.path[walkData.path.length - 1];
            setUserPos(lastPos);
            
            // Sync local path state for the drawing
            setPath(walkData.path);
        }
    }, [walkData?.path]);

    // Auto-claim POIs when user gets close (within 60 meters)
    useEffect(() => {
        if (!walkData.isActive || walkData.isPaused) return;
        
        const isEligible = walkData.distance >= 300 || walkData.time >= 300;
        
        // Auto-claim custom target if eligible
        if (customTargetPos && !customTargetClaimed && isEligible) {
            const distToCustom = getDistKm(userPos[0], userPos[1], customTargetPos[0], customTargetPos[1]) * 1000;
            if (distToCustom < 60) {
                setCustomTargetClaimed(true);
                setReward({
                    id: 'custom-target',
                    name: 'Özel Hedef Konum',
                    lat: customTargetPos[0],
                    lng: customTargetPos[1],
                    type: 'park',
                    coinReward: 50,
                    isPremium: false
                } as any);
                
                // Trigger coin flying animation
                const newCoins = Array.from({ length: 15 }).map((_, i) => ({
                    id: Date.now() + i,
                    x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
                    y: window.innerHeight / 2 + (Math.random() - 0.5) * 120,
                    delay: Math.random() * 0.4
                }));
                setCoins(newCoins);
                setTimeout(() => setCoins([]), 2500);
            }
        }
        
        if (!isEligible) return;

        PLACES.forEach(place => {
            if (visitedPlaceIds.includes(place.id)) return;
            
            // Calculate distance in meters
            const dist = getDistKm(userPos[0], userPos[1], place.lat, place.lng) * 1000;
            if (dist < 60) {
                // Visit place
                setVisitedPlaceIds(prev => [...prev, place.id]);
                setReward(place);
                
                // Trigger coin flying animation
                const newCoins = Array.from({ length: 15 }).map((_, i) => ({
                    id: Date.now() + i,
                    x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
                    y: window.innerHeight / 2 + (Math.random() - 0.5) * 120,
                    delay: Math.random() * 0.4
                }));
                setCoins(newCoins);
                setTimeout(() => setCoins([]), 2500);
            }
        });
    }, [userPos, walkData.isActive, walkData.isPaused, visitedPlaceIds, customTargetPos, customTargetClaimed, walkData.distance, walkData.time]);

    // Handle Finish
    const handleFinish = () => {
        stopWalk();
        router.push('/walk');
    };

    return (
        <div className="h-screen w-full bg-black relative overflow-hidden flex flex-col font-sans">

            {/* BACK BUTTON */}
            <button
                onClick={() => router.back()}
                className="absolute top-4 left-4 z-[60] w-10 h-10 bg-white/10 backdrop-blur-md border border-card-border rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-lg active:scale-95"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            {/* TOP STATS (Premium Glass Overlay) */}
            <div className="absolute top-0 left-0 right-0 z-[50] p-5 pt-12 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none">
                <div className="flex justify-between items-start text-white pointer-events-auto">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-start gap-3">
                            <div className="text-3xl font-black tracking-tighter tabular-nums leading-none min-w-[100px]">
                                {formatTime(walkData.time)}
                            </div>
                            
                            <div className="flex flex-col gap-1 pt-0.5">
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 border transition-colors w-fit",
                                    (walkData.isPaused || !walkData.isActive) ? "bg-gray-500/20 border-gray-500/30 text-gray-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                )}>
                                    <Heart className={cn("w-2.5 h-2.5 fill-current", walkData.isActive && !walkData.isPaused && "animate-pulse")} /> 
                                    {(walkData.isPaused || !walkData.isActive) ? "PAUSE" : "CANLI"}
                                </span>
                                <div className="flex items-center gap-1 text-xs font-black tabular-nums tracking-tight text-white/90">
                                    <div className="flex items-center justify-center w-4 h-4 bg-red-500/20 rounded-full">
                                        <Activity className="w-2.5 h-2.5 text-red-500" />
                                    </div>
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-sm">
                                            {Math.floor(pulse)}
                                        </span>
                                        <span className="opacity-40 text-[8px] uppercase">BPM</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-right flex flex-col gap-0.5 items-end">
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-2xl font-black tabular-nums tracking-tighter">
                                {walkData.distance >= 1000 ? (walkData.distance/1000).toFixed(2) : walkData.distance.toFixed(0)}
                            </span>
                            <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">
                                {walkData.distance >= 1000 ? 'km' : 'm'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[10px] font-black tabular-nums text-white/60">
                                <Zap className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" /> {walkData.speed.toFixed(1)} <span className="text-[8px] opacity-40 uppercase">km/h</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-black tabular-nums text-orange-400">
                                <Flame className="w-2.5 h-2.5 fill-orange-400" /> {Math.floor(walkData.distance / 12)} <span className="text-[8px] opacity-40 uppercase">kcal</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIVE MAP */}
            <div className="flex-1 relative z-[0]">
                <LiveMap
                    userPos={userPos}
                    path={path}
                    isTracking={walkData.isActive}
                    visitedPlaceIds={visitedPlaceIds}
                    guardianMode={mode === 'guardian'}
                    places={PLACES}
                    marks={marks}
                    customTargetPos={customTargetPos}
                    customTargetClaimed={customTargetClaimed}
                    onMapLongPress={(pos) => {
                        if (customTargetClaimed) {
                            setToastMessage("Bu yürüyüşte zaten özel hedef ödülünü aldınız! 🏆");
                            setTimeout(() => setToastMessage(null), 3000);
                            return;
                        }
                        setCustomTargetPos(pos);
                        setCustomTargetClaimed(false);
                        setToastMessage("🎯 Özel Hedef Belirlendi! Buraya ulaşarak ödül kazanabilirsiniz.");
                        setTimeout(() => setToastMessage(null), 3000);
                    }}
                    onPlaceClick={(place) => {
                        if (!visitedPlaceIds.includes(place.id)) {
                            const isEligible = walkData.distance >= 300 || walkData.time >= 300;
                            if (!isEligible) {
                                setToastMessage("Ödül kazanmak için en az 300 metre yürümeli veya 5 dakika hareket etmelisiniz! 🐾");
                                setTimeout(() => setToastMessage(null), 3000);
                                return;
                            }
                            const dist = getDistKm(userPos[0], userPos[1], place.lat, place.lng) * 1000;
                            if (dist < 120) {
                                setVisitedPlaceIds(prev => [...prev, place.id]);
                                setReward(place);
                                const newCoins = Array.from({ length: 15 }).map((_, i) => ({
                                    id: Date.now() + i,
                                    x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
                                    y: window.innerHeight / 2 + (Math.random() - 0.5) * 120,
                                    delay: Math.random() * 0.4
                                }));
                                setCoins(newCoins);
                                setTimeout(() => setCoins([]), 2500);
                            } else {
                                setToastMessage("Mekana ödülü almak için biraz daha yaklaşmalısın! 🚶");
                                setTimeout(() => setToastMessage(null), 3000);
                            }
                        }
                    }}
                />
            </div>

            {/* TOAST MESSAGE */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-28 left-6 right-6 z-[60] bg-black/85 backdrop-blur border border-card-border px-4 py-3 rounded-2xl text-white font-bold text-center text-xs shadow-2xl pointer-events-none font-sans"
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ACTION MENU & CONTROLS */}
            <div className="absolute left-6 bottom-32 z-[55] flex flex-col items-center gap-2">
                 <AnimatePresence>
                    {isActionMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 15, scale: 0.85 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15, scale: 0.85 }}
                            className="flex flex-col gap-2.5 mb-1"
                        >
                            {/* Widget 1: Health */}
                            <button className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xl border border-card-border flex items-center justify-center shadow-lg group active:scale-90 transition-transform">
                                <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md">
                                    <Heart className="w-3.5 h-3.5 text-white fill-white/20" />
                                </div>
                            </button>

                            {/* Widget 2: Environment */}
                            <button className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xl border border-card-border flex items-center justify-center shadow-lg group active:scale-90 transition-transform">
                                <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                                    <Droplets className="w-3.5 h-3.5 text-white" />
                                </div>
                            </button>

                            {/* Widget 3: Social/Community */}
                            <button className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xl border border-card-border flex items-center justify-center shadow-lg group active:scale-90 transition-transform">
                                <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                                    <MessageSquarePlus className="w-3.5 h-3.5 text-white" />
                                </div>
                            </button>

                            {/* Widget 4: Danger/SOS */}
                            <button 
                                onClick={() => setActiveSidebar('danger')}
                                className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xl border border-card-border flex items-center justify-center shadow-lg group active:scale-90 transition-transform"
                            >
                                <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md">
                                    <AlertOctagon className="w-3.5 h-3.5 text-white animate-pulse" />
                                </div>
                            </button>
                        </motion.div>
                    )}
                 </AnimatePresence>

                 <button
                    onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                    className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-xl border backdrop-blur-2xl",
                        isActionMenuOpen 
                            ? "bg-card text-black border-white" 
                            : "bg-black/40 text-white border-card-border hover:bg-black/60"
                    )}
                >
                    {isActionMenuOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
            </div>

            {/* PET COMPANION LIVE INDICATORS (NEW EXTENSION!) */}
            <div className="absolute right-6 bottom-32 z-[55] flex flex-col gap-2">
                <div className="bg-black/40 backdrop-blur-xl border border-card-border rounded-2xl p-3 flex flex-col gap-1.5 shadow-2xl min-w-[90px]">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px]">🐕</span>
                        <span className="text-[8px] font-black text-white/80 uppercase tracking-wider">{activePet?.name || 'Moffi'}</span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center gap-3">
                            <span className="text-[7px] font-bold text-white/50 uppercase">Keyif</span>
                            <span className="text-[8px] font-black text-emerald-400 font-mono">%98</span>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                            <span className="text-[7px] font-bold text-white/50 uppercase">Su</span>
                            <span className="text-[8px] font-black text-blue-400 font-mono">%85</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM CONTROLS */}
            <div className="absolute bottom-0 left-0 right-0 z-[50] p-6 pb-10 bg-gradient-to-t from-black via-black/80 to-transparent">
                <div className="flex items-center justify-between gap-6 max-w-xs mx-auto">
                    <button onClick={() => setActiveModal('camera')} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-card-border flex items-center justify-center text-white active:scale-90 transition-transform">
                        <Camera className="w-4.5 h-4.5" />
                    </button>
                    <div className="relative">
                        {!showStopConfirm ? (
                            <button onClick={() => {
                                if (!walkData.isActive) {
                                    startWalk();
                                } else {
                                    if (walkData.isPaused) resumeWalk();
                                    else pauseWalk();
                                }
                            }} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all ${(!walkData.isActive || walkData.isPaused) ? 'bg-green-500 text-white' : 'bg-card text-black'}`}>
                                {(!walkData.isActive || walkData.isPaused) ? <Play className="w-6 h-6 fill-current translate-x-0.5" /> : <Pause className="w-6 h-6 fill-current" />}
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button onClick={() => setShowStopConfirm(false)} className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center active:scale-90 transition-transform"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={handleFinish} className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse active:scale-90 transition-transform"><Square className="w-5 h-5 fill-current" /></button>
                            </div>
                        )}
                        {walkData.isActive && !showStopConfirm && (
                            <button onClick={() => setShowStopConfirm(true)} className="absolute -right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 flex items-center justify-center active:scale-90 transition-transform">
                                <StopCircle className="w-4.5 h-4.5" />
                            </button>
                        )}
                    </div>
                    <button onClick={() => setActiveModal('music')} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-card-border flex items-center justify-center text-white active:scale-90 transition-transform">
                        <Music className="w-4.5 h-4.5" />
                    </button>
                </div>
            </div>

            {/* OVERLAYS & MODALS */}
            <AnimatePresence>
                {/* Spotify-Style Music Player Overlay (NEW!) */}
                {activeModal === 'music' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="fixed inset-x-6 bottom-28 z-[70] bg-[#121212]/80 backdrop-blur-xl border border-card-border p-5 rounded-[2.5rem] shadow-2xl flex flex-col gap-4 max-w-sm mx-auto"
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Çalan Şarkı</span>
                            <button onClick={() => setActiveModal(null)} className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center border border-card-border hover:bg-white/10 transition-colors">
                                <X className="w-3.5 h-3.5 text-white/50" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg relative overflow-hidden shrink-0">
                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                    <Music className="w-6 h-6 text-white/40 animate-pulse" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-white font-black text-sm truncate">Walking in the Park 🐾</h4>
                                <p className="text-white/40 text-[9px] font-bold mt-0.5 uppercase tracking-wider">Moffi Playlists</p>
                            </div>
                        </div>

                        <div className="space-y-1.5 mt-1">
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
                                <div className="h-full bg-purple-500 rounded-full w-[45%]" />
                            </div>
                            <div className="flex justify-between text-[8px] font-mono text-white/30">
                                <span>1:24</span>
                                <span>3:12</span>
                            </div>
                        </div>

                        <div className="flex justify-center items-center gap-8 py-1">
                            <button className="text-white/50 hover:text-white transition-colors active:scale-95"><SkipBack className="w-4.5 h-4.5" /></button>
                            <button className="w-10 h-10 bg-card text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><Play className="w-4.5 h-4.5 fill-current translate-x-0.5" /></button>
                            <button className="text-white/50 hover:text-white transition-colors active:scale-95"><SkipForward className="w-4.5 h-4.5" /></button>
                        </div>
                    </motion.div>
                )}

                {/* Camera Viewfinder Overlay (NEW!) */}
                {activeModal === 'camera' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col justify-between p-6"
                    >
                        {/* Camera Top Info */}
                        <div className="flex justify-between items-center relative z-10 pt-8">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[9px] font-black text-white uppercase tracking-widest font-mono">REC 4K 60FPS</span>
                            </div>
                            <button 
                                onClick={() => { 
                                    setCapturedPhoto(null); 
                                    setActiveModal(null); 
                                }} 
                                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-card-border text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Camera Viewfinder Borders & Background Pet Image */}
                        <div className="flex-1 border border-card-border rounded-[2.5rem] my-4 relative overflow-hidden flex items-center justify-center bg-zinc-950">
                            <img
                                src={activePet?.avatar || activePet?.image || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600'}
                                className={cn(
                                    "absolute inset-0 w-full h-full object-cover transition-all duration-300", 
                                    capturedPhoto ? "filter brightness-100 scale-100" : "filter brightness-90 scale-[1.02]"
                                )}
                                alt="Camera view"
                            />

                            {!capturedPhoto && (
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/60" />
                                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/60" />
                                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/60" />
                                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/60" />
                                </div>
                            )}

                            {/* DYNAMIC SPORTY OVERLAYS */}
                            <div className="absolute inset-0 p-5 flex flex-col justify-between pointer-events-none z-10">
                                {selectedTemplate === 0 && (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <div className="bg-white/15 backdrop-blur-md border border-white/25 px-2.5 py-1 rounded-lg text-[8px] font-black text-white uppercase tracking-widest font-sans">
                                                🐾 MOFFI YÜRÜYÜŞ KULÜBÜ
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end bg-gradient-to-t from-black/50 via-black/20 to-transparent p-3 -mx-5 -mb-5 rounded-b-[2.5rem] font-sans">
                                            <div>
                                                <div className="text-white text-xs font-black uppercase tracking-wider">{activePet?.name || 'Moffi'}</div>
                                                <div className="text-white/60 text-[8px] font-bold mt-0.5">{new Date().toLocaleDateString('tr-TR')}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white text-lg font-black italic">{(walkData.distance / 1000).toFixed(2)} KM</div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {selectedTemplate === 1 && (
                                    <>
                                        <div className="flex justify-end">
                                            <div className="bg-orange-500 text-white text-[7.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse font-sans">
                                                ⚡ LIVE ATHLETE
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-t from-black/80 via-black/30 to-transparent -mx-5 -mb-5 p-5 rounded-b-[2.5rem] flex flex-col gap-1 font-sans">
                                            <div className="text-white text-4xl font-black italic tracking-tighter leading-none font-mono">
                                                {(walkData.distance / 1000).toFixed(2)} <span className="text-xs uppercase font-normal tracking-wide not-italic text-white/70">KM</span>
                                            </div>
                                            <div className="flex justify-between items-center text-white/80 text-[10px] font-bold tracking-tight mt-1 font-mono">
                                                <span>⏱️ {formatTime(walkData.time)}</span>
                                                <span className="text-orange-400 font-black not-italic font-sans">MOFFI RUN PRO</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {selectedTemplate === 2 && (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <div className="w-10 h-10 rounded-full border border-card-border bg-black/30 backdrop-blur-sm flex items-center justify-center text-lg shadow-lg">
                                                🏆
                                            </div>
                                        </div>
                                        <div className="bg-black/45 backdrop-blur-md border border-card-border rounded-2xl p-3.5 flex justify-between items-center w-full shadow-2xl font-sans">
                                            <div>
                                                <div className="text-white font-black text-xs uppercase tracking-tight">{activePet?.name || 'Moffi'}</div>
                                                <div className="text-white/60 text-[8px] font-bold uppercase mt-0.5">{activePet?.breed || 'Dostun'}</div>
                                            </div>
                                            <div className="flex gap-4 text-right font-mono">
                                                <div>
                                                    <div className="text-white text-[9px] font-black">{Math.floor(walkData.distance / 12)}</div>
                                                    <div className="text-white/40 text-[7px] font-bold uppercase font-sans">KCAL</div>
                                                </div>
                                                <div>
                                                    <div className="text-white text-[9px] font-black">{walkData.speed.toFixed(1)}</div>
                                                    <div className="text-white/40 text-[7px] font-bold uppercase font-sans">KM/H</div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {capturedPhoto === "saved" && (
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 font-sans"
                                >
                                    <motion.div 
                                        animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                                        transition={{ duration: 0.5 }}
                                        className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-3xl shadow-lg shadow-emerald-500/30 mb-3"
                                    >
                                        ✓
                                    </motion.div>
                                    <div className="text-white font-black text-sm uppercase tracking-widest">
                                        Fotoğraf Galeriye Kaydedildi! 📸
                                    </div>
                                    <div className="text-white/40 text-[8px] font-bold uppercase tracking-widest mt-1">
                                        +5 PP ÖDÜL KAZANILDI!
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Camera Controls & Template Selector */}
                        <div className="flex flex-col items-center w-full pb-4">
                            {!capturedPhoto && (
                                <div className="flex justify-center gap-2.5 mb-5 relative z-10 w-full overflow-x-auto no-scrollbar font-sans">
                                    {[
                                        { id: 0, label: "Minimalist", emoji: "🍃" },
                                        { id: 1, label: "Pro Atlet", emoji: "⚡" },
                                        { id: 2, label: "Moffi Kartı", emoji: "🏆" }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTemplate(t.id)}
                                            className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer",
                                                selectedTemplate === t.id 
                                                    ? "bg-card text-black border-white shadow-lg scale-105" 
                                                    : "bg-white/10 text-white/80 border-card-border hover:bg-white/20"
                                            )}
                                        >
                                            {t.emoji} {t.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {capturedPhoto === "captured" ? (
                                <div className="flex justify-center gap-6 w-full max-w-xs px-6 font-sans">
                                    <button 
                                        onClick={() => setCapturedPhoto(null)}
                                        className="flex-1 py-3.5 bg-white/10 border border-white/15 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer"
                                    >
                                        Tekrar Çek
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setCapturedPhoto("saved");
                                            
                                            // Trigger coin explosion
                                            const newCoins = Array.from({ length: 10 }).map((_, i) => ({
                                                id: Date.now() + i,
                                                x: window.innerWidth / 2 + (Math.random() - 0.5) * 80,
                                                y: window.innerHeight / 2 + (Math.random() - 0.5) * 80,
                                                delay: Math.random() * 0.3
                                            }));
                                            setCoins(newCoins);
                                            
                                            setTimeout(() => {
                                                setCapturedPhoto(null);
                                                setActiveModal(null);
                                                setCoins([]);
                                            }, 2000);
                                        }}
                                        className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                                    >
                                        Galeriye Kaydet
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-center items-center gap-12 w-full">
                                    <div className="w-10" />
                                    <button 
                                        onClick={() => {
                                            setCapturedPhoto("captured");
                                        }}
                                        className="w-16 h-16 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                                    >
                                        <div className="w-full h-full bg-card rounded-full" />
                                    </button>
                                    <div className="w-10" />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Reward Modal */}
                {reward && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-[70] flex items-center justify-center">
                        <div className="bg-[#121212]/90 border border-card-border backdrop-blur-md text-white p-8 rounded-[2.5rem] text-center shadow-2xl">
                            <h3 className="text-xl font-black mb-1">{reward.name}</h3>
                            <div className="text-yellow-400 font-black text-3xl mb-4">+{reward.coinReward} PC</div>
                            <button onClick={() => setReward(null)} className="w-full bg-purple-600 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all">Devam Et</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Coin Splash Effect */}
            <AnimatePresence>
                {coins.map((coin) => (
                    <motion.div
                        key={coin.id}
                        initial={{ 
                            x: coin.x, 
                            y: coin.y, 
                            scale: 0, 
                            opacity: 1,
                            rotate: 0
                        }}
                        animate={{ 
                            x: [coin.x, coin.x + (Math.random() - 0.5) * 80, window.innerWidth - 60],
                            y: [coin.y, coin.y - 140, 48],
                            scale: [0, 1.2, 1, 0.4],
                            opacity: [1, 1, 1, 0],
                            rotate: 720
                        }}
                        transition={{ 
                            duration: 1.5, 
                            delay: coin.delay,
                            ease: "easeInOut" 
                        }}
                        className="fixed z-[9999] pointer-events-none w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-xl border border-yellow-100 flex items-center justify-center text-xs font-black text-amber-900 shadow-yellow-500/20"
                    >
                        🪙
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

export default function TrackingPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full bg-black flex items-center justify-center text-white">Yükleniyor...</div>}>
            <TrackingContent />
        </Suspense>
    );
}
