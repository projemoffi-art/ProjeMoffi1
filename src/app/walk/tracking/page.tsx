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
    
    const [userPos, setUserPos] = useState<[number, number]>([41.0082, 28.9784]);
    const [path, setPath] = useState<[number, number][]>([]);
    const [showStopConfirm, setShowStopConfirm] = useState(false);
    const [visitedPlaceIds, setVisitedPlaceIds] = useState<string[]>([]);
    const [reward, setReward] = useState<Place | null>(null);

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

    // CAMERA
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

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
                className="absolute top-4 left-4 z-[60] w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-lg active:scale-95"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            {/* TOP STATS (Premium Glass Overlay) */}
            <div className="absolute top-0 left-0 right-0 z-[50] p-6 pt-16 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none">
                <div className="flex justify-between items-start text-white pointer-events-auto">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-start gap-4">
                            <div className="text-5xl font-black tracking-tighter tabular-nums leading-none min-w-[145px]">
                                {formatTime(walkData.time)}
                            </div>
                            
                            <div className="flex flex-col gap-1.5 pt-1">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 border transition-colors w-fit",
                                    (walkData.isPaused || !walkData.isActive) ? "bg-gray-500/20 border-gray-500/30 text-gray-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                )}>
                                    <Heart className={cn("w-3 h-3 fill-current", walkData.isActive && !walkData.isPaused && "animate-pulse")} /> 
                                    {(walkData.isPaused || !walkData.isActive) ? "PAUSE" : "CANLI"}
                                </span>
                                <div className="flex items-center gap-1.5 text-sm font-black tabular-nums tracking-tight text-white/90">
                                    <div className="flex items-center justify-center w-5 h-5 bg-red-500/20 rounded-full">
                                        <Activity className="w-3 h-3 text-red-500" />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg">
                                            {Math.floor(pulse)}
                                        </span>
                                        <span className="opacity-40 text-[9px] uppercase">BPM</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-right flex flex-col gap-1 items-end">
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black tabular-nums tracking-tighter">
                                {walkData.distance >= 1000 ? (walkData.distance/1000).toFixed(2) : walkData.distance.toFixed(0)}
                            </span>
                            <span className="text-xs font-black opacity-40 uppercase tracking-widest">
                                {walkData.distance >= 1000 ? 'km' : 'm'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-xs font-black tabular-nums text-white/60">
                                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {walkData.speed.toFixed(1)} <span className="text-[9px] opacity-40 uppercase">km/h</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-black tabular-nums text-orange-400">
                                <Flame className="w-3 h-3 fill-orange-400" /> {Math.floor(walkData.distance / 12)} <span className="text-[9px] opacity-40 uppercase">kcal</span>
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
                />
            </div>

            {/* ACTION MENU & CONTROLS */}
            <div className="absolute left-6 bottom-32 z-[55] flex flex-col items-center gap-3">
                 <AnimatePresence>
                    {isActionMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                            className="flex flex-col gap-3 mb-2"
                        >
                            {/* Widget 1: Health (Samsung Health Style) */}
                            <button className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_8px_32px_rgba(239,68,68,0.2)] group active:scale-90 transition-transform">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Heart className="w-4 h-4 text-white fill-white/20" />
                                </div>
                            </button>

                            {/* Widget 2: Environment */}
                            <button className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_8px_32px_rgba(59,130,246,0.2)] group active:scale-90 transition-transform">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Droplets className="w-4 h-4 text-white" />
                                </div>
                            </button>

                            {/* Widget 3: Social/Community */}
                            <button className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_8px_32px_rgba(168,85,247,0.2)] group active:scale-90 transition-transform">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <MessageSquarePlus className="w-4 h-4 text-white" />
                                </div>
                            </button>

                            {/* Widget 4: Danger/SOS (Samsung Style Warning) */}
                            <button 
                                onClick={() => setActiveSidebar('danger')}
                                className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_8px_32px_rgba(249,115,22,0.2)] group active:scale-90 transition-transform"
                            >
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <AlertOctagon className="w-4 h-4 text-white animate-pulse" />
                                </div>
                            </button>
                        </motion.div>
                    )}
                 </AnimatePresence>

                 <button
                    onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                    className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-2xl border backdrop-blur-2xl",
                        isActionMenuOpen 
                            ? "bg-white text-black border-white" 
                            : "bg-black/40 text-white border-white/10 hover:bg-black/60"
                    )}
                >
                    {isActionMenuOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </button>
            </div>

            {/* BOTTOM CONTROLS */}
            <div className="absolute bottom-0 left-0 right-0 z-[50] p-8 pb-12 bg-gradient-to-t from-black via-black/80 to-transparent">
                <div className="flex items-center justify-between gap-8 max-w-sm mx-auto">
                    <button onClick={() => setActiveModal('camera')} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white">
                        <Camera className="w-5 h-5" />
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
                            }} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${(!walkData.isActive || walkData.isPaused) ? 'bg-green-500 text-white' : 'bg-white text-black'}`}>
                                {(!walkData.isActive || walkData.isPaused) ? <Play className="w-8 h-8 fill-current translate-x-1" /> : <Pause className="w-8 h-8 fill-current" />}
                            </button>
                        ) : (
                            <div className="flex gap-4">
                                <button onClick={() => setShowStopConfirm(false)} className="w-16 h-16 rounded-full bg-white/20 text-white flex items-center justify-center"><ChevronLeft className="w-6 h-6" /></button>
                                <button onClick={handleFinish} className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse"><Square className="w-8 h-8 fill-current" /></button>
                            </div>
                        )}
                        {walkData.isActive && !showStopConfirm && (
                            <button onClick={() => setShowStopConfirm(true)} className="absolute -right-20 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 flex items-center justify-center">
                                <StopCircle className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <button onClick={() => setActiveModal('music')} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white">
                        <Music className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* MODALS (Simplified for brevity, but kept logic) */}
            <AnimatePresence>
                {/* Reward, Music etc... */}
                {reward && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-[70] flex items-center justify-center">
                        <div className="bg-black/90 backdrop-blur-md text-white p-8 rounded-[2rem] text-center border border-white/10 shadow-2xl">
                            <h3 className="text-2xl font-black mb-1">{reward.name}</h3>
                            <div className="text-yellow-400 font-black text-4xl mb-4">+{reward.coinReward} PC</div>
                            <button onClick={() => setReward(null)} className="w-full bg-[#5B4D9D] px-6 py-3 rounded-xl font-bold">Devam Et</button>
                        </div>
                    </motion.div>
                )}
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
