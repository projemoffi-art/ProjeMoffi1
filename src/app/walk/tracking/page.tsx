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
    Car, Syringe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bluetooth, BluetoothConnected, BluetoothSearching, Smartphone } from "lucide-react";
import { parseHeartRate, HR_SERVICE_UUID, HR_CHARACTERISTIC_UUID } from "@/lib/bluetoothManager";
import { PLACES, Place } from "@/data/mockPlaces";

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
    const [userPos, setUserPos] = useState<[number, number]>([41.0082, 28.9784]);
    const [path, setPath] = useState<[number, number][]>([]);
    const [distance, setDistance] = useState(0);
    const [calories, setCalories] = useState(0);
    const [duration, setDuration] = useState(0); // seconds
    const [isPaused, setIsPaused] = useState(false);
    const [showStopConfirm, setShowStopConfirm] = useState(false);
    const [visitedPlaceIds, setVisitedPlaceIds] = useState<string[]>([]);
    const [reward, setReward] = useState<Place | null>(null);

    // Simulated Stats
    const [pulse, setPulse] = useState(72);
    const [speed, setSpeed] = useState(0);

    // Marks State (Lifted Up)
    const [marks, setMarks] = useState(MOCK_MARKS);

    // STATE
    const [activeModal, setActiveModal] = useState<'camera' | 'music' | null>(null);
    const [activeSidebar, setActiveSidebar] = useState<'danger' | null>(null); // Sidebar Expanded State
    const [musicService, setMusicService] = useState<'spotify' | 'yt' | null>(null);
    const [musicQuery, setMusicQuery] = useState("");
    const [currentEmbedUrl, setCurrentEmbedUrl] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

    // Bluetooth States
    const [isBleSupported, setIsBleSupported] = useState(true);
    const [bleDevice, setBleDevice] = useState<BluetoothDevice | null>(null);
    const [bleConnectionStatus, setBleConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

    // CAMERA
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

    const watchIdRef = useRef<number | null>(null);


    // PRESET PLAYLISTS
    const PLAYLISTS = [
        { id: 'workout', label: 'Workout Power', service: 'spotify', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX76Wlfdnj7AP' },
        { id: 'chill', label: 'Chill Walk', service: 'spotify', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX3qCx5yEZkcJ' },
    ];

    // DANGER TYPES (Icon Only for Sidebar)
    const DANGER_TYPES = [
        { id: 'traffic', label: 'Trafik', icon: Car, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
        { id: 'poison', label: 'Zehir/Gıda', icon: Skull, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
        { id: 'glass', label: 'Cam Kırığı', icon: AlertOctagon, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
        { id: 'dog', label: 'Hırçın Köpek', icon: Footprints, color: 'text-red-400 bg-red-400/10 border-red-400/20' },
    ];

    // --- MUSIC LOGIC ---
    const handleMusicSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!musicQuery) return;
        setMusicService('yt');
        setCurrentEmbedUrl(`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(musicQuery)}+Music`);
    };

    const playPlaylist = (item: typeof PLAYLISTS[0]) => {
        setMusicService(item.service as any);
        setCurrentEmbedUrl(item.url);
    };

    // --- ACTION LOGIC ---
    const handleAction = (type: string, message: string) => {
        setActiveSidebar(null);
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // TIMER
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (!isPaused) {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
                
                // --- Smart Pulse (Reacts to Speed) ---
                // Skip simulation if real BLE sensor is connected
                if (bleConnectionStatus !== 'connected') {
                    setPulse(prev => {
                        const targetHR = 85 + (speed * 12); 
                        const fluctuation = (Math.random() * 4) - 2;
                        return Math.min(170, Math.max(70, prev + (targetHR - prev) * 0.1 + fluctuation));
                    });
                }

                // --- MET Calories (Weight * MET * Time) ---
                // Simulating a 15kg dog. MET for walking is approx 3.0.
                // Formula: 15kg * 3.0 MET * (1/3600 hrs) = calories per second
                const met = speed > 6 ? 6.0 : speed > 3 ? 3.5 : 2.0;
                const calPerSec = (15 * met) / 3600;
                setCalories(prev => prev + calPerSec);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPaused, speed]); // Pulse/Calories now depend on speed intensity

    // GPS TRACKING
    useEffect(() => {
        if (!navigator.geolocation) return;

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, speed: gpsSpeed } = pos.coords;
                const newPos: [number, number] = [latitude, longitude];
                setUserPos(newPos);
                
                if (!isPaused) {
                    // --- REAL SPEED INTEGRATION ---
                    if (gpsSpeed !== null) {
                        // m/s to km/h conversion
                        setSpeed(Number((gpsSpeed * 3.6).toFixed(1)));
                    }

                    setPath(prev => {
                        const newPath = [...prev, newPos];
                        if (prev.length > 0) {
                            const lastPos = prev[prev.length - 1];
                            const distDelta = getDistKm(lastPos[0], lastPos[1], latitude, longitude);
                            
                            // Manual Speed Fallback (if native API fails)
                            if (gpsSpeed === null) {
                                // Assuming 1 update per 2 seconds approx (very rough fallback)
                                const fallBackSpeed = (distDelta * 3600) / 2;
                                setSpeed(Number(Math.min(15, fallBackSpeed).toFixed(1)));
                            }
                            
                            setDistance(curr => curr + distDelta);
                        }
                        return newPath;
                    });

                    PLACES.forEach(place => {
                        if (getDistKm(latitude, longitude, place.lat, place.lng) < 0.05 && !visitedPlaceIds.includes(place.id)) {
                            setVisitedPlaceIds(prev => [...prev, place.id]);
                            setReward(place);
                        }
                    });
                }
            },
            (err) => console.error(err),
            { enableHighAccuracy: true }
        );

        return () => {
            if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [isPaused, visitedPlaceIds]);

    // --- CAMERA LOGIC ---
    useEffect(() => {
        if (activeModal === 'camera' && !cameraStream) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => {
                    setCameraStream(stream);
                    if (videoRef.current) videoRef.current.srcObject = stream;
                })
                .catch(err => console.error("Camera denied:", err));
        } else if (activeModal !== 'camera' && cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
            setCapturedPhoto(null);
        }
    }, [activeModal]);

    useEffect(() => {
        if (activeModal === 'camera' && cameraStream && videoRef.current) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [activeModal, cameraStream]);

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const data = canvasRef.current.toDataURL('image/png');
                setCapturedPhoto(data);
            }
        }
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // BLE Connection
    const connectHR = async () => {
        if (!navigator.bluetooth) {
            setToastMessage("Tarayıcı Bluetooth desteklemiyor.");
            return;
        }

        try {
            setBleConnectionStatus('connecting');
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [HR_SERVICE_UUID] }]
            });

            setBleDevice(device);
            const server = await device.gatt?.connect();
            const service = await server?.getPrimaryService(HR_SERVICE_UUID);
            const characteristic = await service?.getCharacteristic(HR_CHARACTERISTIC_UUID);

            await characteristic?.startNotifications();
            characteristic?.addEventListener('characteristicvaluechanged', (event: any) => {
                const value = event.target.value;
                const bpm = parseHeartRate(value);
                setPulse(bpm);
            });

            device.addEventListener('gattserverdisconnected', () => {
                setBleConnectionStatus('idle');
                setBleDevice(null);
                setToastMessage("Cihaz bağlantısı kesildi.");
            });

            setBleConnectionStatus('connected');
            setToastMessage("Nabız Bandı Bağlandı! ❤️");
        } catch (error) {
            console.error(error);
            setBleConnectionStatus('error');
            setToastMessage("Bağlantı kurulamadı.");
        }
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
                    {/* Time & Pulse Section */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-start gap-4">
                            {/* Duration Clock with fixed width */}
                            <div className="text-5xl font-black tracking-tighter tabular-nums leading-none min-w-[145px]">
                                {formatTime(duration)}
                            </div>
                            
                            {/* Status & Biometrics - Non-shifting anchor */}
                            <div className="flex flex-col gap-1.5 pt-1">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 border transition-colors w-fit",
                                    isPaused ? "bg-gray-500/20 border-gray-500/30 text-gray-400" : "bg-red-500/10 border-red-500/20 text-red-500"
                                )}>
                                    <Heart className={cn("w-3 h-3 fill-current", !isPaused && "animate-pulse")} /> 
                                    {isPaused ? "PAUSE" : "CANLI"}
                                </span>
                                <div className="flex items-center gap-1.5 text-sm font-black tabular-nums tracking-tight text-white/90">
                                    <div className="flex items-center justify-center w-5 h-5 bg-red-500/20 rounded-full">
                                        <Activity className="w-3 h-3 text-red-500" />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn("text-lg", bleConnectionStatus === 'connected' && "text-green-400")}>
                                            {Math.floor(pulse)}
                                        </span>
                                        <span className="opacity-40 text-[9px] uppercase">BPM</span>
                                    </div>

                                    {/* BLE Connect Button */}
                                    <button
                                        onClick={connectHR}
                                        className={cn(
                                            "ml-1 w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 border",
                                            bleConnectionStatus === 'connected' 
                                                ? "bg-green-500/20 border-green-500/40 text-green-400" 
                                                : bleConnectionStatus === 'connecting'
                                                    ? "bg-blue-500/20 border-blue-500/40 text-blue-400 animate-pulse"
                                                    : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                                        )}
                                        title="Nabız Sensörü Bağla"
                                    >
                                        {bleConnectionStatus === 'connected' ? <BluetoothConnected className="w-3 h-3" /> : <Bluetooth className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Distance & Speed Section */}
                    <div className="text-right flex flex-col gap-1 items-end">
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black tabular-nums tracking-tighter">{distance.toFixed(2)}</span>
                            <span className="text-xs font-black opacity-40 uppercase tracking-widest">km</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-xs font-black tabular-nums text-white/60">
                                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {speed.toFixed(1)} <span className="text-[9px] opacity-40 uppercase">km/h</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-black tabular-nums text-orange-400">
                                <Flame className="w-3 h-3 fill-orange-400" /> {Math.floor(calories)} <span className="text-[9px] opacity-40 uppercase">kcal</span>
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
                    isTracking={true}
                    visitedPlaceIds={visitedPlaceIds}
                    guardianMode={mode === 'guardian'}
                    places={PLACES}
                    marks={marks}
                />
            </div>

            {/* --- LEFT SIDEBAR (Sihirli Sidebar - Vertical Drawer) --- */}
            <div className="absolute left-6 bottom-32 z-[55] flex flex-col items-center gap-4">
                
                {/* Expandable Icons (Upwards) */}
                <AnimatePresence>
                    {isActionMenuOpen && (
                        <motion.div
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={{
                                open: { opacity: 1, y: 0, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
                                closed: { opacity: 0, y: 20, transition: { staggerChildren: 0.05, staggerDirection: -1 } }
                            }}
                            className="flex flex-col gap-4 mb-2"
                        >
                            {/* Quick Water (💧) */}
                            <motion.button
                                variants={{ open: { opacity: 1, scale: 1 }, closed: { opacity: 0, scale: 0.8 } }}
                                onClick={() => { handleAction('water', 'Su Molası Kaydedildi! 💧'); setIsActionMenuOpen(false); }}
                                className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 backdrop-blur-xl flex items-center justify-center text-blue-400 hover:bg-blue-500/40 transition-all shadow-xl active:scale-90"
                            >
                                <Droplets className="w-6 h-6 fill-current" />
                            </motion.button>

                            {/* Quick Pee (✨) */}
                            <motion.button
                                variants={{ open: { opacity: 1, scale: 1 }, closed: { opacity: 0, scale: 0.8 } }}
                                onClick={() => { handleAction('pee', 'Çiş İşaretlendi! ✨'); setIsActionMenuOpen(false); }}
                                className="w-12 h-12 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 backdrop-blur-xl flex items-center justify-center text-yellow-400 hover:bg-yellow-500/40 transition-all shadow-xl active:scale-90"
                            >
                                <Zap className="w-6 h-6 fill-current" />
                            </motion.button>

                            {/* Quick Poop (💩) */}
                            <motion.button
                                variants={{ open: { opacity: 1, scale: 1 }, closed: { opacity: 0, scale: 0.8 } }}
                                onClick={() => { handleAction('poop', 'Tuvalet Kaydedildi! 💩'); setIsActionMenuOpen(false); }}
                                className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-xl active:scale-90"
                            >
                                <span className="text-xl leading-none">💩</span>
                            </motion.button>

                            {/* Quick Treat (🦴) */}
                            <motion.button
                                variants={{ open: { opacity: 1, scale: 1 }, closed: { opacity: 0, scale: 0.8 } }}
                                onClick={() => { handleAction('treat', 'Ödül Verildi! 🦴'); setIsActionMenuOpen(false); }}
                                className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/30 backdrop-blur-xl flex items-center justify-center text-green-400 hover:bg-green-500/40 transition-all shadow-xl active:scale-90"
                            >
                                <Bone className="w-6 h-6 fill-current" />
                            </motion.button>

                            {/* Danger Reporting (⚠️) */}
                            <motion.div
                                variants={{ open: { opacity: 1, scale: 1 }, closed: { opacity: 0, scale: 0.8 } }}
                                className="relative"
                            >
                                <button
                                    onClick={() => setActiveSidebar(activeSidebar === 'danger' ? null : 'danger')}
                                    className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 border backdrop-blur-xl",
                                        activeSidebar === 'danger' 
                                            ? "bg-red-500 text-white border-red-400" 
                                            : "bg-red-500/20 border-red-500/30 text-red-500 hover:bg-red-500/40"
                                    )}
                                >
                                    <AlertTriangle className="w-6 h-6 fill-current" />
                                </button>

                                {/* Danger Sub-menu (Side Reveal) */}
                                <AnimatePresence>
                                    {activeSidebar === 'danger' && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20, scale: 0.8 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: -20, scale: 0.8 }}
                                            className="absolute left-full ml-4 bottom-0 bg-black/60 backdrop-blur-2xl p-2 rounded-2xl border border-white/10 flex gap-2 shadow-2xl"
                                        >
                                            {DANGER_TYPES.map(type => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => { handleAction(type.id, `${type.label} Bildirildi! ⚠️`); setIsActionMenuOpen(false); }}
                                                    className={cn(
                                                        "w-11 h-11 rounded-xl flex items-center justify-center border transition-all active:scale-90",
                                                        type.color
                                                    )}
                                                >
                                                    <type.icon className="w-6 h-6" />
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Toggle Button (Magic +) */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setIsActionMenuOpen(!isActionMenuOpen); setActiveSidebar(null); }}
                    className={cn(
                        "w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all shadow-2xl border relative overflow-hidden group",
                        isActionMenuOpen 
                            ? "bg-white text-black border-white/20" 
                            : "bg-black/40 text-white border-white/10 backdrop-blur-xl"
                    )}
                >
                    <AnimatePresence mode="wait">
                        {isActionMenuOpen ? (
                            <motion.div
                                key="close-icon"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                            >
                                <X className="w-8 h-8" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="open-icon"
                                initial={{ rotate: 90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -90, opacity: 0 }}
                                className="flex items-center justify-center"
                            >
                                <Plus className="w-8 h-8" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Subtle pulse for closed state */}
                    {!isActionMenuOpen && (
                        <div className="absolute inset-0 bg-white/5 animate-pulse group-hover:bg-white/10 transition-colors" />
                    )}
                </motion.button>
            </div>

            {/* TOAST NOTIFICATION */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-32 left-0 right-0 z-[70] flex justify-center pointer-events-none">
                        <div className="bg-black/80 backdrop-blur text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 border border-white/10">
                            <CheckCircle2 className="w-5 h-5 text-green-500" /> {toastMessage}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BOTTOM CONTROLS */}
            <AnimatePresence>
                {!activeModal && (
                    <motion.div
                        initial={{ y: 0 }} exit={{ y: 200 }}
                        className="absolute bottom-0 left-0 right-0 z-[50] p-8 pb-12 bg-gradient-to-t from-black via-black/80 to-transparent"
                    >
                        <div className="flex items-center justify-between gap-8 max-w-sm mx-auto">
                            <button onClick={() => setActiveModal('camera')} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                <Camera className="w-5 h-5" />
                            </button>
                            <div className="relative">
                                {!showStopConfirm ? (
                                    <button onClick={() => setIsPaused(!isPaused)} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${isPaused ? 'bg-green-500 text-white' : 'bg-white text-black'}`}>
                                        {isPaused ? <Play className="w-8 h-8 fill-current translate-x-1" /> : <Pause className="w-8 h-8 fill-current" />}
                                    </button>
                                ) : (
                                    <div className="flex gap-4">
                                        <button onClick={() => setShowStopConfirm(false)} className="w-16 h-16 rounded-full bg-white/20 text-white flex items-center justify-center"><ChevronLeft className="w-6 h-6" /></button>
                                        <button onClick={handleFinish} className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse"><StopCircle className="w-8 h-8 fill-current" /></button>
                                    </div>
                                )}
                                {isPaused && !showStopConfirm && (
                                    <button onClick={() => setShowStopConfirm(true)} className="absolute -right-20 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 flex items-center justify-center">
                                        <StopCircle className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setActiveModal('music')} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors relative">
                                <Music className="w-5 h-5" />
                                {musicService && <div className={`absolute top-0 right-0 w-3 h-3 rounded-full border border-black ${musicService === 'spotify' ? 'bg-[#1DB954]' : 'bg-[#FF0000]'}`} />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- MODALS --- */}
            <AnimatePresence>
                {/* CAMERA */}
                {activeModal === 'camera' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black">
                        {capturedPhoto ? (
                            <div className="relative w-full h-full">
                                <img src={capturedPhoto} className="w-full h-full object-cover" />
                                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between bg-gradient-to-b from-black/50 to-transparent">
                                    <button onClick={() => setCapturedPhoto(null)} className="text-white font-bold drop-shadow-md">Vazgeç</button>
                                    <button onClick={() => { setActiveModal(null); }} className="text-white font-bold drop-shadow-md">Kaydet</button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-full h-full">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                <canvas ref={canvasRef} className="hidden" />
                                <button onClick={() => setActiveModal(null)} className="absolute top-6 left-6 text-white bg-black/50 p-2 rounded-full"><X className="w-6 h-6" /></button>
                                <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8">
                                    <button onClick={takePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
                                        <div className="w-16 h-16 bg-white rounded-full active:scale-95 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* MUSIC */}
                {activeModal === 'music' && (
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-x-0 bottom-0 z-[60] bg-[#121212] rounded-t-[2rem] shadow-2xl h-[70vh] flex flex-col overflow-hidden">
                        <div className="p-4 bg-[#121212] z-20 border-b border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">Müzik İstasyonu</h2>
                                <button onClick={() => setActiveModal(null)} className="bg-white/10 p-2 rounded-full"><X className="w-5 h-5 text-white" /></button>
                            </div>
                            <form onSubmit={handleMusicSearch} className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text" placeholder="Şarkı, sanatçı veya tür ara..."
                                    className="w-full bg-[#2A2A2A] text-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#5B4D9D]"
                                    value={musicQuery} onChange={(e) => setMusicQuery(e.target.value)}
                                />
                            </form>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-black/50">
                            {currentEmbedUrl && (
                                <div className="w-full aspect-video bg-black sticky top-0 z-10 shadow-xl">
                                    <iframe src={currentEmbedUrl} width="100%" height="100%" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                    <div className="bg-[#121212] p-2 flex justify-between items-center">
                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                            {musicService === 'spotify' ? <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" className="w-4 h-4" /> : <Play className="w-4 h-4 text-red-500 fill-current" />}
                                            {musicService === 'spotify' ? 'Spotify Çalıyor' : 'YouTube Çalıyor'}
                                        </div>
                                        <button onClick={() => { setCurrentEmbedUrl(null); setMusicService(null); }} className="text-xs text-red-400 font-bold px-2">Kapat</button>
                                    </div>
                                </div>
                            )}
                            <div className="p-4">
                                <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm opacity-80"><LayoutGrid className="w-4 h-4" /> Sizin İçin Seçtiklerimiz</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {PLAYLISTS.map((list) => (
                                        <button key={list.id} onClick={() => playPlaylist(list)} className="bg-[#2A2A2A] p-3 rounded-xl flex flex-col gap-2 hover:bg-[#333] transition-colors group text-left relative overflow-hidden">
                                            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${list.service === 'spotify' ? 'bg-[#1DB954]' : 'bg-[#FF0000]'}`} />
                                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"><Music className="w-5 h-5 text-white" /></div>
                                            <div>
                                                <div className="text-white font-bold text-sm">{list.label}</div>
                                                <div className="text-[10px] text-gray-400 opacity-70 uppercase tracking-wider">{list.service}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* REWARD */}
                {reward && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
                        <div className="bg-black/90 backdrop-blur-md text-white p-8 rounded-[2rem] text-center border border-white/10 pointer-events-auto shadow-[0_0_50px_rgba(147,51,234,0.5)]">
                            <div className="text-6xl mb-4 animate-bounce">🎉</div>
                            <h3 className="text-2xl font-black mb-1">{reward.name}</h3>
                            <div className="text-yellow-400 font-black text-4xl mb-4">+{reward.coinReward} PC</div>
                            <button onClick={() => setReward(null)} className="w-full bg-[#5B4D9D] px-6 py-3 rounded-xl font-bold hover:bg-[#4a3e80]">Devam Et</button>
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
