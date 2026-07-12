"use client";

import React from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useSpring } from "framer-motion";
import { 
    X, Trophy, Flame, Timer, 
    Footprints, Play, ArrowRight,
    Activity, Square,
    Sparkles, CheckCircle2, Target, Zap, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useActivity } from "@/context/ActivityContext";
import { usePet } from "@/context/PetContext";
import { useWeather } from "@/context/WeatherContext";
import { useQuestEngine, type Quest } from "@/context/QuestEngineContext";
import confetti from "canvas-confetti";
import { WeatherDetailSheet } from "./WeatherDetailSheet";
import { supabase } from "@/lib/supabase";

interface WalkQuickSheetProps {
    isOpen: boolean;
    onClose: () => void;
    petId?: string;
}

const MOCK_ROUTES = [
    { id: 'free', name: 'Serbest Gezi', distance: 1.5, icon: '🍃', color: '#10b981' },
    { id: 'park', name: 'Park Rotası', distance: 2.5, icon: '🌳', color: '#f59e0b' },
    { id: 'sahil', name: 'Sahil Yolu', distance: 4.0, icon: '🌊', color: '#3b82f6' },
    { id: 'mahalle', name: 'Mahalle Turu', distance: 1.8, icon: '🏠', color: '#8b5cf6' }
];

// ─── Mini circular progress ──────────────────────────────────────────────────
function CircularProgress({ percent, size = 48, stroke = 4, color = "#f97316", trackColor = "rgba(0,0,0,0.04)" }: {
    percent: number; size?: number; stroke?: number; color?: string; trackColor?: string;
}) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={stroke} strokeDasharray={circ}
                strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
        </svg>
    );
}

// ─── Weather Sphere Effect (Küre İçi/Arkası Canlı Hava Animasyonları) ─────────
// ─── Double Ring Dome (Merkez Cam Küre Göstergesi) ───────────────────────────
function DoubleRingDome({
    activePet, distPercent, durPercent, walkData, level, activeWeather
}: {
    activePet: any; distPercent: number; durPercent: number; walkData: any; level: number; activeWeather?: any;
}) {
    const size = 160;
    const stroke = 8;
    
    // Outer ring (Distance - Orange)
    const r1 = (size - stroke) / 2;
    const circ1 = 2 * Math.PI * r1;
    const offset1 = circ1 - (distPercent / 100) * circ1;
    
    // Inner ring (Duration - Indigo)
    const r2 = r1 - stroke - 4;
    const circ2 = 2 * Math.PI * r2;
    const offset2 = circ2 - (durPercent / 100) * circ2;

    // Gyroscope/Mouse local spring values for 3D photo tilt
    const rawPhotoX = useMotionValue(0);
    const rawPhotoY = useMotionValue(0);
    const photoX = useSpring(rawPhotoX, { stiffness: 60, damping: 25 });
    const photoY = useSpring(rawPhotoY, { stiffness: 60, damping: 25 });

    // Dynamic contrast determination based on weather condition
    const cond = activeWeather?.condition || '';
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour >= 20 || cond.includes('Gece') || cond.includes('Akşam');
    
    let isDarkBg = isNight;
    if (
        cond.includes('Yağmur') || 
        cond.includes('Sağanak') || 
        cond.includes('Çiseleyen') || 
        cond.includes('Fırtına') ||
        cond.includes('Bulut') || 
        cond.includes('Sis')
    ) {
        isDarkBg = true;
    }

    React.useEffect(() => {
        let hasGyro = false;

        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.gamma !== null && e.beta !== null) {
                hasGyro = true;
                const x = Math.max(-15, Math.min(15, e.gamma)) * -0.25;
                const y = Math.max(-15, Math.min(15, e.beta - 45)) * -0.25;
                rawPhotoX.set(x);
                rawPhotoY.set(y);
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (hasGyro) return;
            const width = window.innerWidth;
            const height = window.innerHeight;
            const x = ((e.clientX / width) - 0.5) * -12;
            const y = ((e.clientY / height) - 0.5) * -12;
            rawPhotoX.set(x);
            rawPhotoY.set(y);
        };

        if (typeof window !== 'undefined') {
            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientation', handleOrientation);
            }
            window.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('deviceorientation', handleOrientation);
                window.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, [rawPhotoX, rawPhotoY]);

    const handlePetClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        // Visual Paw and Heart Confetti Pop
        confetti({
            particleCount: 16,
            angle: 90,
            spread: 55,
            origin: { x, y },
            colors: ['#f97316', '#6366f1', '#fbbf24', '#ec4899', '#10b981'],
            scalar: 0.9,
            ticks: 60
        });
    };

    return (
        <div className="flex flex-col items-center justify-center shrink-0 relative">
            {/* Ripple Rings - Ambient Organic Energy Wave */}
            {walkData.isActive && (
                <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
                    {/* Layer 3: Ambient Breathing Core Glow */}
                    <motion.div
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            width: size + 12,
                            height: size + 12,
                            background: isDarkBg
                                ? "radial-gradient(circle, rgba(249,115,22,0.2) 0%, rgba(99,102,241,0.08) 55%, rgba(0,0,0,0) 75%)"
                                : "radial-gradient(circle, rgba(249,115,22,0.12) 0%, rgba(99,102,241,0.04) 55%, rgba(0,0,0,0) 75%)",
                            filter: "blur(8px)",
                        }}
                        animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.7, 0.9, 0.7],
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 3,
                            ease: "easeInOut",
                        }}
                    />

                    {/* Layer 1: Glassmorphic Refraction Expansion Wave */}
                    {[0, 1].map((i) => (
                        <motion.div
                            key={`glass-wave-${i}`}
                            className="absolute rounded-full border pointer-events-none shadow-inner"
                            style={{
                                width: size,
                                height: size,
                                backdropFilter: "blur(6px)",
                                WebkitBackdropFilter: "blur(6px)",
                                borderColor: isDarkBg ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.12)",
                                background: isDarkBg ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.02)",
                                boxShadow: isDarkBg 
                                    ? "0 0 25px rgba(249,115,22,0.15), inset 0 0 10px rgba(255,255,255,0.05)"
                                    : "0 4px 15px rgba(15,23,42,0.08), inset 0 0 10px rgba(255,255,255,0.3)",
                            }}
                            initial={{ scale: 0.95, opacity: 0.8 }}
                            animate={{ scale: 1.45, opacity: 0 }}
                            transition={{
                                repeat: Infinity,
                                duration: 4.2,
                                delay: i * 2.1,
                                ease: [0.1, 0.8, 0.15, 1],
                            }}
                        />
                    ))}

                    {/* Layer 2: Rotating Dashed Telemetry Ring */}
                    {[0, 1].map((i) => (
                        <motion.div
                            key={`telemetry-ring-${i}`}
                            className="absolute rounded-full pointer-events-none"
                            style={{
                                width: size + 20,
                                height: size + 20,
                            }}
                            initial={{ scale: 0.9, opacity: 0.8 }}
                            animate={{ 
                                scale: 1.35, 
                                opacity: 0,
                                rotate: i === 0 ? 90 : -90
                            }}
                            transition={{
                                scale: { repeat: Infinity, duration: 4.2, delay: i * 2.1, ease: [0.1, 0.8, 0.15, 1] },
                                opacity: { repeat: Infinity, duration: 4.2, delay: i * 2.1, ease: [0.1, 0.8, 0.15, 1] },
                                rotate: { repeat: Infinity, duration: 4.2, delay: i * 2.1, ease: "linear" }
                            }}
                        >
                            <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
                                <circle 
                                    cx="50" 
                                    cy="50" 
                                    r="48" 
                                    fill="none" 
                                    stroke={isDarkBg ? "rgba(249,115,22,0.55)" : "rgba(234,88,12,0.35)"} 
                                    strokeWidth="0.8" 
                                    strokeDasharray="4 8"
                                />
                            </svg>
                        </motion.div>
                    ))}

                    {/* Layer 4: Orbiting Telemetry Particles (Satellites) */}
                    <div className="absolute inset-0 pointer-events-none" style={{ width: size + 40, height: size + 40, left: -20, top: -20 }}>
                        <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0 opacity-15">
                            <circle 
                                cx="50" 
                                cy="50" 
                                r="45" 
                                fill="none" 
                                stroke={isDarkBg ? "rgba(255,255,255,0.3)" : "rgba(15,23,42,0.2)"} 
                                strokeWidth="0.5" 
                                strokeDasharray="3 6"
                            />
                        </svg>
                        <motion.div
                            className="absolute inset-0"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                        >
                            <div 
                                className="absolute rounded-full animate-pulse"
                                style={{
                                    width: 6,
                                    height: 6,
                                    background: "#ea580c",
                                    boxShadow: "0 0 10px #f97316",
                                    top: "50%",
                                    left: "calc(50% + 45%)",
                                    transform: "translate(-50%, -50%)"
                                }}
                            />
                        </motion.div>
                        <motion.div
                            className="absolute inset-0"
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 13, ease: "linear" }}
                        >
                            <div 
                                className="absolute rounded-full animate-pulse"
                                style={{
                                    width: 5,
                                    height: 5,
                                    background: "#6366f1",
                                    boxShadow: "0 0 8px #6366f1",
                                    top: "50%",
                                    left: "calc(50% - 45%)",
                                    transform: "translate(-50%, -50%)"
                                }}
                            />
                        </motion.div>
                    </div>
                </div>
            )}

            <div className="relative z-10" style={{ width: size, height: size }}>
                {/* SVGs */}
                <svg width={size} height={size} className="-rotate-90 absolute inset-0">
                    <defs>
                        <linearGradient id="outerOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ea580c" />
                            <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                        <linearGradient id="innerIndigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                    </defs>

                    {/* Outer Track & Progress */}
                    <circle cx={size / 2} cy={size / 2} r={r1} fill="none" stroke="rgba(249,115,22,0.03)" strokeWidth={stroke} />
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={r1} fill="none"
                        stroke="url(#outerOrangeGrad)" strokeWidth={stroke} strokeLinecap="round"
                        strokeDasharray={circ1}
                        initial={{ strokeDashoffset: circ1 }}
                        animate={{ 
                            strokeDashoffset: offset1,
                            rotate: walkData.isActive ? 360 : 0,
                            filter: walkData.isActive
                                ? ["drop-shadow(0 0 4px rgba(249,115,22,0.2))", "drop-shadow(0 0 12px rgba(249,115,22,0.55))", "drop-shadow(0 0 4px rgba(249,115,22,0.2))"]
                                : "drop-shadow(0 0 6px rgba(249,115,22,0.25))"
                        }}
                        transition={{
                            strokeDashoffset: { duration: 1.2, ease: "easeOut" },
                            rotate: { repeat: Infinity, duration: 20, ease: "linear" },
                            filter: { repeat: Infinity, duration: 3.5, ease: "easeInOut" }
                        }}
                        style={{ 
                            transformOrigin: "center"
                        }}
                    />
                    
                    {/* Inner Track & Progress */}
                    <circle cx={size / 2} cy={size / 2} r={r2} fill="none" stroke="rgba(99,102,241,0.03)" strokeWidth={stroke} />
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={r2} fill="none"
                        stroke="url(#innerIndigoGrad)" strokeWidth={stroke} strokeLinecap="round"
                        strokeDasharray={circ2}
                        initial={{ strokeDashoffset: circ2 }}
                        animate={{ 
                            strokeDashoffset: offset2,
                            rotate: walkData.isActive ? -360 : 0,
                            filter: walkData.isActive
                                ? ["drop-shadow(0 0 4px rgba(99,102,241,0.2))", "drop-shadow(0 0 12px rgba(99,102,241,0.55))", "drop-shadow(0 0 4px rgba(99,102,241,0.2))"]
                                : "drop-shadow(0 0 6px rgba(99,102,241,0.25))"
                        }}
                        transition={{
                            strokeDashoffset: { duration: 1.2, delay: 0.1, ease: "easeOut" },
                            rotate: { repeat: Infinity, duration: 16, ease: "linear" },
                            filter: { repeat: Infinity, duration: 3.5, ease: "easeInOut" }
                        }}
                        style={{ 
                            transformOrigin: "center"
                        }}
                    />
                </svg>
                
                {/* Center Glass Pod */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <motion.div 
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                            repeat: Infinity,
                            duration: 4,
                            ease: "easeInOut"
                        }}
                        onClick={handlePetClick}
                        className="w-[106px] h-[106px] rounded-full overflow-hidden border-2 border-white bg-white/75 backdrop-blur-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.1),0_12px_28px_rgba(0,0,0,0.06)] flex items-center justify-center relative group cursor-pointer select-none active:scale-95 transition-transform duration-200"
                    >
                        {/* 3D Mercek (Glass Orb) Inner Image Wrapper */}
                        <motion.div 
                            style={{ x: photoX, y: photoY }}
                            className="w-full h-full rounded-full overflow-hidden relative"
                        >
                            {/* Pet Image */}
                            {activePet?.avatar || activePet?.image ? (
                                <img
                                    src={activePet.avatar || activePet.image}
                                    className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500"
                                    alt={activePet?.name || 'Pet'}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">🐾</div>
                            )}
                        </motion.div>

                        {/* 3D Convex Glass Lens Effect Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none rounded-full" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/30 pointer-events-none rounded-full" />
                        <div className="absolute top-[2px] left-[12px] right-[12px] h-[32%] bg-gradient-to-b from-white/35 to-white/0 rounded-full blur-[0.3px] pointer-events-none" />
                        <div className="absolute bottom-[4px] left-[20px] right-[20px] h-[12%] bg-gradient-to-t from-white/20 to-transparent rounded-full blur-[0.8px] pointer-events-none" />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </motion.div>
                </div>

                {/* Level badge */}
                <div className="absolute bottom-1 right-1 bg-slate-900 border-2 border-white text-white text-[9px] font-black w-7 h-7 rounded-full flex items-center justify-center shadow-md select-none">
                    L{level}
                </div>

                {/* Mood badge */}
                <div 
                    className="absolute bottom-1 left-1 bg-emerald-500 border-2 border-white text-white text-[9px] w-7 h-7 rounded-full flex items-center justify-center shadow-md select-none animate-bounce"
                    style={{ animationDuration: '3s' }}
                >
                    ❤️
                </div>
            </div>
            
            <div className="mt-4 px-3.5 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-white/60 flex items-center justify-center">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest leading-none italic">{activePet?.name || "Luna"}</h4>
            </div>
            {walkData.isActive && (
                <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-full shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest leading-none">Yolda Takipte</span>
                </div>
            )}
        </div>
    );
}

// ─── Quest progress bar ───────────────────────────────────────────────────────
function QuestBar({ quest }: { quest: Quest }) {
    const isCompleted = !!quest.completedAt;
    const pct = Math.min(100, (quest.current / Math.max(0.001, quest.target)) * 100);
    
    const categoryColors = {
        pet: { border: 'border-amber-100', bar: 'from-amber-500 to-orange-400', badge: 'bg-amber-50 text-amber-700' },
        activity: { border: 'border-orange-100', bar: 'from-orange-50 to-amber-400', badge: 'bg-orange-50 text-orange-700' },
        social: { border: 'border-blue-100', bar: 'from-blue-50 to-indigo-400', badge: 'bg-blue-50 text-blue-700' },
        explore: { border: 'border-purple-100', bar: 'from-purple-50 to-pink-400', badge: 'bg-purple-50 text-purple-700' },
        health: { border: 'border-emerald-100', bar: 'from-emerald-50 to-teal-400', badge: 'bg-emerald-50 text-emerald-700' },
    };
    const c = categoryColors[quest.category] || categoryColors.activity;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "relative rounded-2xl p-4 transition-all duration-300 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.015)] border-0",
                isCompleted
                    ? "bg-emerald-50/80"
                    : `bg-card`
            )}
        >
            <div className="flex items-start gap-3.5 relative z-10">
                <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 mt-0.5 shadow-[0_4px_10px_rgba(0,0,0,0.02)]",
                    isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-slate-50 dark:bg-white/5"
                )}>
                    {isCompleted ? "✅" : quest.icon}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <span className={cn(
                            "text-xs font-black uppercase tracking-tight leading-none",
                            isCompleted ? "text-emerald-700 line-through opacity-60" : "text-slate-800 dark:text-slate-100"
                        )}>
                            {quest.title}
                        </span>
                        <span className={cn(
                            "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ml-2 shrink-0 border border-slate-100",
                            isCompleted ? "bg-emerald-200/50 text-emerald-800 border-emerald-300/30" : c.badge
                        )}>
                            +{quest.reward.pp} PP
                        </span>
                    </div>
                    
                    <p className="text-[9px] text-slate-500 font-semibold mb-2 leading-tight">{quest.description}</p>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className={cn("h-full rounded-full", isCompleted ? "bg-emerald-500" : `bg-gradient-to-r ${c.bar}`)}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                        <span className="text-[8.5px] font-black text-slate-400 font-mono shrink-0 w-14 text-right">
                            {quest.type === 'distance'
                                ? `${Math.min(quest.current, quest.target).toFixed(1)}/${quest.target}km`
                                : quest.type === 'duration' || quest.type === 'speed'
                                ? `${Math.floor(Math.min(quest.current, quest.target))}/${quest.target}dk`
                                : `${Math.min(quest.current, quest.target)}/${quest.target}`
                            }
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export function WalkQuickSheet({ isOpen, onClose }: WalkQuickSheetProps) {
    const router = useRouter();
    const { 
        walkData, walkStats, startWalk, stopWalk
    } = useActivity();
    const { activePet } = usePet();
    const { weather, isLoading: weatherLoading } = useWeather();
    const activeWeather = weather;
    const [isWeatherDetailOpen, setIsWeatherDetailOpen] = React.useState(false);
    const { dailyQuests, dailyGoal, todayEarned, level } = useQuestEngine();
    const [activeTab, setActiveTab] = React.useState<'controls' | 'stats' | 'map'>('controls');

    // Gerçek Zamanlı GPS Telemetrisi ve Hesaplamaları
    const paceMinKm = React.useMemo(() => {
        if (walkData.distance <= 5) return "--'--\"";
        const totalMin = walkData.time / 60;
        const distKmVal = walkData.distance / 1000;
        const paceRaw = totalMin / distKmVal;
        const paceMins = Math.floor(paceRaw);
        const paceSecs = Math.floor((paceRaw - paceMins) * 60);
        return `${paceMins}'${paceSecs.toString().padStart(2, '0')}"`;
    }, [walkData.time, walkData.distance]);

    const liveStatusText = React.useMemo(() => {
        if (!walkData.isActive) return "Yola Çıkmaya Hazır 🐾";
        if (walkData.isPaused) return "Yürüyüş Duraklatıldı ⏸️";
        if (walkData.speed > 5.5) return "Aktif Koşu/Hızlı Yürüyüş ⚡";
        return "Yürüyüş Takibi Aktif 🚶";
    }, [walkData.isActive, walkData.isPaused, walkData.speed]);

    // Rota seçici state'leri
    const [selectedRoute, setSelectedRoute] = React.useState(MOCK_ROUTES[0]);
    const [activeRoute, setActiveRoute] = React.useState<any>(null);

    // Hibrit Hedef Sistemi (Akıllı Özel Hedef)
    const initialCustomTarget = React.useMemo(() => {
        if (walkStats && walkStats.totalWalks > 0 && walkStats.totalDistanceKm) {
            // Gerçek verilere dayalı akıllı öneri (Geçmiş ortalamaya göre + 0.5km teşvik)
            return parseFloat((Math.max(1.0, (walkStats.totalDistanceKm / walkStats.totalWalks) + 0.5)).toFixed(1));
        }
        return 3.0; // Fallback
    }, [walkStats]);

    const [customTargetKm, setCustomTargetKm] = React.useState(3.0);
    const [isCustomTargetEnabled, setIsCustomTargetEnabled] = React.useState(false);

    // Initial load logic only once when walkStats arrive
    React.useEffect(() => {
        if (walkStats && customTargetKm === 3.0) {
            setCustomTargetKm(initialCustomTarget);
        }
    }, [initialCustomTarget]);

    // Hazırlık checklist'i state'leri
    const [checkedItems, setCheckedItems] = React.useState({ poopBag: false, water: false, leash: false });
    const checklistComplete = checkedItems.poopBag && checkedItems.water && checkedItems.leash;

    // Hold-to-Start Apple Watch Style Logic
    const [isHolding, setIsHolding] = React.useState(false);
    const holdProgress = useMotionValue(0);
    const holdTransform = useTransform(holdProgress, [0, 100], [251.2, 0]); // 2 * pi * 40

    React.useEffect(() => {
        let controls: any;
        if (isHolding) {
            controls = animate(holdProgress, 100, {
                duration: 1.2,
                ease: 'linear',
                onComplete: () => {
                    handleStartWalk();
                    setIsHolding(false);
                    setTimeout(() => holdProgress.set(0), 500);
                }
            });
        } else {
            controls = animate(holdProgress, 0, {
                duration: 0.3,
                ease: 'easeOut'
            });
        }
        return () => controls?.stop();
    }, [isHolding, holdProgress]);

    // Load checklist from localStorage
    React.useEffect(() => {
        const savedChecklist = localStorage.getItem('moffi_walk_checklist');
        if (savedChecklist) {
            try { setCheckedItems(JSON.parse(savedChecklist)); } catch {}
        }
    }, []);

    // Save checklist whenever it changes
    React.useEffect(() => {
        localStorage.setItem('moffi_walk_checklist', JSON.stringify(checkedItems));
    }, [checkedItems]);



    // Dinamik Lig Sıralaması
    const globalRank = React.useMemo(() => {
        if (!level) return 6; // Default
        // Seviye ve seriye (streak) göre deterministik ama dinamik bir sıra
        // Yüksek level = Düşük sıra (Daha iyi)
        const baseRank = Math.max(1, 100 - (level * 2) - (walkStats?.currentStreak || 0));
        return baseRank;
    }, [level, walkStats?.currentStreak]);

    // Sürgü (Swipe-to-Start) referans ve koordinatları
    const sliderTrackRef = React.useRef<HTMLDivElement>(null);
    const [maxDrag, setMaxDrag] = React.useState(200);
    const dragX = useMotionValue(0);

    // Yürüyüş durdurulduğunda sürgüyü başa sar
    React.useEffect(() => {
        if (!walkData.isActive) {
            dragX.set(0);
        }
    }, [walkData.isActive, dragX]);

    // Kayıtlı rotayı yükle
    React.useEffect(() => {
        const saved = localStorage.getItem('moffi_selected_route');
        if (saved) {
            try { setSelectedRoute(JSON.parse(saved)); } catch {}
        }
    }, []);

    // Aktif yürüyüş rotasını eşleştir
    React.useEffect(() => {
        if (walkData.isActive) {
            const active = localStorage.getItem('moffi_active_route');
            if (active) {
                try { setActiveRoute(JSON.parse(active)); } catch {}
            }
        } else {
            setActiveRoute(null);
        }
    }, [walkData.isActive]);

    // Slider genişliğini hesapla
    React.useEffect(() => {
        if (sliderTrackRef.current) {
            setMaxDrag(sliderTrackRef.current.clientWidth - 52);
        }
    }, [isOpen, walkData.isActive]);

    // Yürüyüşü rota ile başlat
    const handleStartWalk = async () => {
        // Request gyroscope permission on iOS 13+ if supported
        if (typeof window !== 'undefined' && 
            typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                await (DeviceOrientationEvent as any).requestPermission();
            } catch (err) {
                console.error("Failed requesting orientation permission on iOS:", err);
            }
        }
        localStorage.setItem('moffi_active_route', JSON.stringify(selectedRoute));
        startWalk();
        router.push('/walk/tracking');
        onClose();
    };

    // Helper to format time (MM:SS)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const distKm = walkData.distance / 1000;
    const durationMin = walkData.time / 60;

    // Yürüyüşle ilgili görevleri filtrele
    const walkQuests = dailyQuests.filter(q => 
        q.category === 'activity' || 
        q.type === 'distance' || 
        q.type === 'duration' || 
        q.type === 'weather_walk' ||
        q.type === 'time_of_day'
    );

    // Rota seçimine veya aktif rotaya göre dinamik hedef belirle (Hibrit)
    const targetDistance = walkData.isActive 
        ? (isCustomTargetEnabled ? customTargetKm : (activeRoute?.distance || dailyGoal.distance)) 
        : (isCustomTargetEnabled ? customTargetKm : selectedRoute.distance);

    const distPercent = Math.round(Math.min(100, (distKm / Math.max(0.1, targetDistance)) * 100));
    const durPercent = Math.round(Math.min(100, (durationMin / Math.max(1, dailyGoal.duration)) * 100));

    // Slider arka plan dinamik dolgu genişliği
    const sliderFillWidth = useTransform(dragX, (x) => x + 44);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Full-Screen Container */}
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 250 }}
                            className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
                        >
                            {/* Header Area */}
                            <div className="px-6 pt-6 flex items-center justify-between pb-2 z-20 relative shrink-0">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1">Moffi ile Yürüyüş</h2>
                                    <span className={cn(
                                        "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                                        walkData.isActive ? "text-emerald-700 bg-emerald-100" : "text-indigo-700 bg-indigo-100"
                                    )}>
                                        {walkData.isActive ? "Aktif Yürüyüş" : "Hazırlık Paneli"}
                                    </span>
                                    {todayEarned.pp > 0 && (
                                        <span className="text-[8px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full leading-none">
                                            +{todayEarned.pp} PP Bugün
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-9 h-9 bg-card rounded-full flex items-center justify-center shadow-moffi-card hover:bg-slate-50 dark:bg-white/5 transition-all cursor-pointer border-0"
                                >
                                    <X className="w-5 h-5 text-slate-450" />
                                </button>
                            </div>

                            {/* Segmented Tab Switcher */}
                            <div className="px-6 pb-2.5 shrink-0 z-20">
                                <div className="bg-slate-200 dark:bg-white/10/50 dark:bg-white/5 p-1 rounded-2xl flex gap-1 relative overflow-hidden">
                                    {(['controls', 'stats', 'map'] as const).map((tab) => {
                                        const label = {
                                            controls: 'Yürüyüş',
                                            stats: 'İstatistikler',
                                            map: 'Harita'
                                        }[tab];
                                        const isActive = activeTab === tab;
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => {
                                                    if (tab === 'map') {
                                                        router.push('/walk/tracking');
                                                        onClose();
                                                    } else if (tab === 'stats') {
                                                        router.push('/walk');
                                                        onClose();
                                                    } else {
                                                        setActiveTab(tab);
                                                    }
                                                }}
                                                className={cn(
                                                    "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all relative cursor-pointer border-0 z-10",
                                                    isActive ? "text-slate-800 dark:text-slate-100" : "text-slate-400 hover:text-slate-700 dark:text-slate-200 bg-transparent"
                                                )}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeTabIndicator"
                                                        className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                                    />
                                                )}
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── SCROLLABLE CONTENT ── */}
                            <div className="px-6 pb-8 pt-4 space-y-5.5 overflow-y-auto no-scrollbar flex-1 z-20">

                                {/* APPLE FITNESS STYLE METRICS */}
                                <div className="flex flex-col items-center justify-center py-6 animate-in fade-in zoom-in-95 duration-500">
                                    {/* Mevcut Mesafe (Massive Display) */}
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                        <Footprints className="w-3 h-3" /> Mevcut Mesafe
                                    </span>
                                    <div className="flex items-baseline justify-center">
                                        <span className="text-8xl font-black tracking-tighter text-slate-800 dark:text-white font-mono leading-none drop-shadow-sm">
                                            {distKm.toFixed(2)}
                                        </span>
                                        <span className="text-xl font-black text-slate-400 ml-2 tracking-widest uppercase">KM</span>
                                    </div>
                                    
                                    {/* Minimalist Progress Ring for Walk (Horizontal Bar) */}
                                    <div className="w-full max-w-[240px] mt-8 mb-6">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hedef İlerlemesi</span>
                                            <span className="text-[11px] font-black text-orange-500">% {distPercent}</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                                            <motion.div 
                                                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                                                style={{ width: `${Math.max(3, Math.min(100, distPercent))}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Secondary Metrics (Time, Pace, Speed) */}
                                    <div className="grid grid-cols-3 w-full gap-4 mt-2 border-t border-slate-100 dark:border-white/5 pt-6">
                                        <div className="flex flex-col items-center text-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Timer className="w-3 h-3 text-indigo-500"/> Süre</span>
                                            <span className="text-2xl font-black text-slate-800 dark:text-white font-mono leading-none">{formatTime(walkData.time)}</span>
                                        </div>
                                        <div className="flex flex-col items-center text-center border-x border-slate-100 dark:border-white/5">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Activity className="w-3 h-3 text-pink-500"/> Tempo</span>
                                            <span className="text-2xl font-black text-slate-800 dark:text-white font-mono leading-none">{paceMinKm}</span>
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500"/> Hız</span>
                                            <div className="flex items-baseline">
                                                <span className="text-2xl font-black text-slate-800 dark:text-white font-mono leading-none">{walkData.speed.toFixed(1)}</span>
                                                <span className="text-[10px] font-bold text-slate-400 ml-0.5">km/h</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>




                                {/* 10. ACTIONS / SWIPE-TO-START */}
                            <div className="space-y-4 pt-2">
                                {walkData.isActive ? (
                                    <button
                                        onClick={() => { stopWalk(); onClose(); }}
                                        className="w-full h-14 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-3xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_6px_25px_rgba(239,68,68,0.25)] font-black text-[11px] uppercase tracking-[0.15em] cursor-pointer border-0"
                                    >
                                        <Square className="w-3.5 h-3.5 fill-current" /> Yürüyüşü Bitir
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        {/* YÜRÜYÜŞ ÖNCESİ HAZIRLIK KONTROL LİSTESİ (Pebble-styled interactive buttons) */}
                                        <div className="bg-card rounded-3xl p-4.5 space-y-3.5 shadow-moffi-card border border-slate-200/50 dark:border-white/5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-slate-450 uppercase tracking-[0.2em]">Yürüyüş Hazırlığı</span>
                                                <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100/50">
                                                    {Object.values(checkedItems).filter(Boolean).length}/3 Hazır
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2.5">
                                                {[
                                                    { key: 'poopBag', label: 'Kaka Poşeti', emoji: '💩' },
                                                    { key: 'water', label: 'Su Matarası', emoji: '💧' },
                                                    { key: 'leash', label: 'Tasma & Kayış', emoji: '🦮' }
                                                ].map(item => {
                                                    const isChecked = checkedItems[item.key as keyof typeof checkedItems];
                                                    return (
                                                        <button
                                                            key={item.key}
                                                            onClick={() => setCheckedItems(prev => ({ ...prev, [item.key]: !isChecked }))}
                                                            className={cn(
                                                                "py-3 px-2 rounded-2xl border-0 text-[9px] font-black text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
                                                                isChecked
                                                                    ? "bg-emerald-50 text-emerald-800 shadow-[inset_0_2px_6px_rgba(16,185,129,0.06)]"
                                                                    : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-white/10/70"
                                                            )}
                                                        >
                                                            <span className="text-lg leading-none">{item.emoji}</span>
                                                            <span className="leading-none">{item.label}</span>
                                                            <span className={cn(
                                                                "w-1.5 h-1.5 rounded-full mt-0.5",
                                                                isChecked ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                                                            )} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* HOLD TO START (Apple Watch Style) */}
                                        <div className="flex flex-col items-center justify-center mt-6 mb-2">
                                            <div className="relative w-32 h-32 flex items-center justify-center">
                                                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                                                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-white/5" />
                                                    <motion.circle 
                                                        cx="50" cy="50" r="40" 
                                                        stroke="url(#gradient-ring)" 
                                                        strokeWidth="5" 
                                                        fill="transparent" 
                                                        strokeDasharray="251.2"
                                                        strokeDashoffset={holdTransform}
                                                        strokeLinecap="round"
                                                        className="drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                                                    />
                                                    <defs>
                                                        <linearGradient id="gradient-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#f97316" />
                                                            <stop offset="100%" stopColor="#ec4899" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>

                                                <motion.button
                                                    whileTap={{ scale: checklistComplete ? 0.9 : 1 }}
                                                    onPointerDown={() => checklistComplete && setIsHolding(true)}
                                                    onPointerUp={() => setIsHolding(false)}
                                                    onPointerLeave={() => setIsHolding(false)}
                                                    className={cn(
                                                        "w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 z-10 select-none transition-colors",
                                                        checklistComplete 
                                                            ? "bg-slate-900 text-white cursor-pointer" 
                                                            : "bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed"
                                                    )}
                                                >
                                                    <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] text-center", checklistComplete && !isHolding && "animate-pulse")}>
                                                        {checklistComplete ? "BASILI\nTUT" : "HAZIRLIK"}
                                                    </span>
                                                </motion.button>
                                            </div>
                                            <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 mt-3">
                                                {checklistComplete ? "Yürüyüşü başlatmak için halkanın dolmasını bekle" : "Önce hazırlık kontrolünü tamamla"}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => { router.push('/walk'); onClose(); }}
                                    className="w-full bg-card py-3.5 rounded-3xl flex items-center justify-center gap-1.5 group hover:bg-slate-50 dark:bg-white/5 transition-all cursor-pointer shadow-moffi-card border-0"
                                >
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-700 dark:text-slate-200 transition-colors">Yürüyüş İstatistikleri</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-slate-650 transition-all" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>

        <WeatherDetailSheet 
            isOpen={isWeatherDetailOpen} 
            onClose={() => setIsWeatherDetailOpen(false)} 
            weather={activeWeather} 
        />
        </>
    );
}
