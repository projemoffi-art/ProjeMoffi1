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
function PineTree({ className, color, snowColor }: { className?: string; color: string; snowColor?: string }) {
    return (
        <svg viewBox="0 0 40 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="18" y="44" width="4" height="16" rx="1" fill="#78350f" />
            <path d="M6 44 L34 44 L20 24 Z" fill={color} />
            <path d="M9 31 L31 31 L20 13 Z" fill={color} />
            <path d="M12 18 L28 18 L20 2 Z" fill={color} />
            {snowColor && (
                <>
                    <path d="M20 2 L16 11 L24 11 Z" fill={snowColor} opacity="0.95" />
                    <path d="M20 13 L17 20 L23 20 Z" fill={snowColor} opacity="0.9" />
                    <path d="M20 24 L16 31 L24 31 Z" fill={snowColor} opacity="0.9" />
                </>
            )}
        </svg>
    );
}

function OakTree({ className, color, snowColor }: { className?: string; color: string; snowColor?: string }) {
    return (
        <svg viewBox="0 0 40 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="17" y="40" width="6" height="20" rx="2" fill="#78350f" />
            <circle cx="20" cy="22" r="14" fill={color} />
            <circle cx="12" cy="30" r="10" fill={color} />
            <circle cx="28" cy="30" r="10" fill={color} />
            {snowColor && (
                <>
                    <path d="M12 12 Q20 4 28 12 Q33 13 32 18 Q20 14 10 18 Q8 13 12 12 Z" fill={snowColor} opacity="0.95" />
                    <path d="M4 25 Q12 18 18 24 Q12 28 5 28 Z" fill={snowColor} opacity="0.9" />
                    <path d="M36 25 Q28 18 22 24 Q28 28 35 28 Z" fill={snowColor} opacity="0.9" />
                </>
            )}
        </svg>
    );
}

function CloudSVG({ className, fill = "white", opacity = 0.8 }: { className?: string; fill?: string; opacity?: number }) {
    return (
        <svg viewBox="0 0 100 60" className={className} fill={fill} opacity={opacity} xmlns="http://www.w3.org/2000/svg">
            <path d="M20 40 A 15 15 0 0 1 35 25 A 20 20 0 0 1 70 23 A 15 15 0 0 1 85 40 A 12 12 0 0 1 80 50 H 20 A 10 10 0 0 1 20 40 Z" />
        </svg>
    );
}

function BirdSVG({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12 Q7 5 12 12 Q17 5 22 12" />
        </svg>
    );
}

function StarSVG({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2 L14.8 9.2 L22 12 L14.8 14.8 L12 22 L9.2 14.8 L2 12 L9.2 9.2 Z" />
        </svg>
    );
}

function DistantHills({ fill }: { fill: string }) {
    return (
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[95px] pointer-events-none" fill={fill} xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80 C 100 40, 200 110, 300 60 C 350 40, 380 70, 400 65 L 400 120 L 0 120 Z" />
        </svg>
    );
}

function MidgroundHills({ fill }: { fill: string }) {
    return (
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[75px] pointer-events-none" fill={fill} xmlns="http://www.w3.org/2000/svg">
            <path d="M0 90 C 80 70, 160 110, 240 80 C 300 60, 350 90, 400 80 L 400 120 L 0 120 Z" />
        </svg>
    );
}

function ForegroundMeadows({ fill }: { fill: string }) {
    return (
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[55px] pointer-events-none" fill={fill} xmlns="http://www.w3.org/2000/svg">
            <path d="M0 100 C 100 85, 180 115, 280 95 C 340 85, 370 100, 400 95 L 400 120 L 0 120 Z" />
        </svg>
    );
}

function WeatherSphereEffect({ condition, temp, windSpeed = 5 }: { condition: string; temp: number; windSpeed?: number }) {
    const cond = condition || '';
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour >= 20;

    // Gyroscope Parallax Logic with Desktop Mouse Fallback
    const rawGyroX = useMotionValue(0);
    const rawGyroY = useMotionValue(0);
    const gyroX = useSpring(rawGyroX, { stiffness: 50, damping: 20 });
    const gyroY = useSpring(rawGyroY, { stiffness: 50, damping: 20 });

    React.useEffect(() => {
        let hasGyro = false;

        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.gamma !== null && e.beta !== null) {
                hasGyro = true;
                // gamma is left/right tilt [-90, 90]
                // beta is front/back tilt [-180, 180]
                const x = Math.max(-30, Math.min(30, e.gamma));
                const y = Math.max(-30, Math.min(30, e.beta - 45)); // Assumes phone is held at 45 degree angle
                rawGyroX.set(x);
                rawGyroY.set(y);
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (hasGyro) return; // Ignore mouse if gyroscope is active
            
            const width = window.innerWidth;
            const height = window.innerHeight;
            const x = ((e.clientX / width) - 0.5) * 60; // range [-30, 30]
            const y = ((e.clientY / height) - 0.5) * 60; // range [-30, 30]
            rawGyroX.set(x);
            rawGyroY.set(y);
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
    }, [rawGyroX, rawGyroY]);

    const bgX = useTransform(gyroX, [-30, 30], [-8, 8]);
    const bgY = useTransform(gyroY, [-30, 30], [-8, 8]);
    const midX = useTransform(gyroX, [-30, 30], [-18, 18]);
    const midY = useTransform(gyroY, [-30, 30], [-18, 18]);
    const foreX = useTransform(gyroX, [-30, 30], [-35, 35]);
    const foreY = useTransform(gyroY, [-30, 30], [-35, 35]);

    // Wind Logic
    const windMultiplier = Math.max(0.3, Math.min(2.5, windSpeed / 10)); // Normal speed is ~10km/h
    const rainAngle = 10 + (windSpeed * 0.7); // Wind bends the rain
    const cloudSpeed = { slow: 65 / windMultiplier, med: 45 / windMultiplier, fast: 30 / windMultiplier };


    let state: 'rain' | 'snow' | 'clouds' | 'sun' = 'sun';
    if (
        cond.includes('Yağmur') || 
        cond.includes('Sağanak') || 
        cond.includes('Çiseleyen') || 
        cond.includes('Fırtına')
    ) {
        state = 'rain';
    } else if (cond.includes('Kar')) {
        state = 'snow';
    } else if (cond.includes('Bulut') || cond.includes('Sis')) {
        state = 'clouds';
    }

    const isNightTime = isNight || cond.includes('Gece') || cond.includes('Akşam');

    // ─── Forest layout config (V2: Added Oak Trees for variety) ───
    const midgroundTrees = [
        { left: "5%", scale: 0.7, type: 'pine' },
        { left: "18%", scale: 0.65, type: 'oak' },
        { left: "32%", scale: 0.8, type: 'pine' },
        { left: "46%", scale: 0.7, type: 'oak' },
        { left: "62%", scale: 0.75, type: 'pine' },
        { left: "78%", scale: 0.6, type: 'pine' },
        { left: "88%", scale: 0.72, type: 'oak' }
    ];

    const foregroundTrees = [
        { left: "1%", scale: 1.1, type: 'pine' },
        { left: "12%", scale: 0.95, type: 'oak' },
        { left: "26%", scale: 1.2, type: 'pine' },
        { left: "44%", scale: 0.85, type: 'pine' },
        { left: "58%", scale: 1.05, type: 'oak' },
        { left: "72%", scale: 0.9, type: 'pine' },
        { left: "84%", scale: 1.1, type: 'oak' },
        { left: "95%", scale: 1.15, type: 'pine' }
    ];

    // Determine colors & assets based on weather state (V2: Richer Gradients + Hybridization)
    let bgSky = isNightTime ? "bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#2e1065]" : "bg-gradient-to-b from-[#0ea5e9] via-[#7dd3fc] to-[#fde047]";
    let distantHillsColor = isNightTime ? "#0f172a" : "#86efac";
    let midgroundHillsColor = isNightTime ? "#090d16" : "#4ade80";
    let foregroundMeadowsColor = isNightTime ? "#020617" : "#22c55e";
    let treeColor = isNightTime ? "#064e3b" : "#047857";
    let foreTreeColor = isNightTime ? "#022c22" : "#065f46";
    let snowColor: string | undefined = undefined;

    if (state === 'rain') {
        bgSky = isNightTime ? "bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#1e293b]" : "bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#475569]";
        distantHillsColor = "#1e3a5f";
        midgroundHillsColor = "#115e59";
        foregroundMeadowsColor = "#0f766e";
        treeColor = "#134e4a";
        foreTreeColor = "#042f2e";
    } else if (state === 'snow') {
        bgSky = isNightTime ? "bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#334155]" : "bg-gradient-to-b from-[#7dd3fc] via-[#bae6fd] to-[#f8fafc]";
        distantHillsColor = isNightTime ? "#334155" : "#cbd5e1";
        midgroundHillsColor = isNightTime ? "#1e293b" : "#94a3b8";
        foregroundMeadowsColor = isNightTime ? "#0f172a" : "#ffffff"; 
        treeColor = isNightTime ? "#0f172a" : "#475569";
        foreTreeColor = isNightTime ? "#020617" : "#334155";
        snowColor = isNightTime ? "#cbd5e1" : "#ffffff";
    } else if (state === 'clouds') {
        bgSky = isNightTime ? "bg-gradient-to-b from-[#020617] via-[#1e293b] to-[#334155]" : "bg-gradient-to-b from-[#475569] via-[#94a3b8] to-[#e2e8f0]";
        distantHillsColor = isNightTime ? "#1e293b" : "#65a30d";
        midgroundHillsColor = isNightTime ? "#0f172a" : "#4d7c0f";
        foregroundMeadowsColor = isNightTime ? "#020617" : "#3f6212";
        treeColor = isNightTime ? "#022c22" : "#15803d";
        foreTreeColor = isNightTime ? "#020617" : "#166534";
    }

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            {/* 1. Sky Gradient Background */}
            <div className={`absolute inset-0 ${bgSky}`} />

            {/* 2. Atmospheric & Celestial Elements (Sun / Moon / Stars / Lightning) */}
            {(!isNightTime && state === 'sun') && (
                <motion.div style={{ x: bgX, y: bgY, zIndex: 1 }} className="absolute inset-0 pointer-events-none">
                    <div 
                        className="absolute right-[8%] pointer-events-none" 
                        style={{ 
                            top: hour >= 10 && hour <= 15 ? '5%' : hour >= 18 ? '25%' : '15%',
                            transition: 'top 1s ease-in-out'
                        }}
                    >
                        <motion.div 
                            className="absolute -inset-10 bg-yellow-300/20 rounded-full blur-2xl"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        />
                        <motion.div 
                            className="absolute -inset-5 bg-amber-400/30 rounded-full blur-xl"
                            animate={{ scale: [1.1, 0.95, 1.1] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        />
                        <motion.svg 
                            viewBox="0 0 100 100" 
                            className="absolute -inset-6 w-24 h-24 text-yellow-300/30"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
                        >
                            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="8, 14" />
                            <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4, 18" />
                        </motion.svg>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-yellow-200 shadow-[0_0_30px_rgba(251,191,36,0.6)]" />
                    </div>

                    {/* Flying Birds */}
                    <motion.div
                        className="absolute top-[20%] text-slate-800/20 w-8 h-8 pointer-events-none"
                        animate={{ x: ["-100vw", "100vw"], y: [0, -15, 5, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 25 / windMultiplier, ease: "linear" }}
                    >
                        <BirdSVG />
                    </motion.div>
                    <motion.div
                        className="absolute top-[25%] text-slate-800/15 w-6 h-6 pointer-events-none"
                        animate={{ x: ["-100vw", "100vw"], y: [5, -5, 10, -5, 5] }}
                        transition={{ repeat: Infinity, duration: 28 / windMultiplier, ease: "linear", delay: 2 }}
                    >
                        <BirdSVG />
                    </motion.div>
                </motion.div>
            )}

            {isNightTime && (
                <motion.div style={{ x: bgX, y: bgY, zIndex: 1 }} className="absolute inset-0 pointer-events-none">
                    {/* Twinkling Stars */}
                    {Array.from({ length: 20 }).map((_, i) => {
                        const left = `${5 + (i * 17.1 + 13) % 90}%`;
                        const top = `${5 + (i * 11.3 + 7) % 55}%`;
                        const delay = i * 0.15;
                        const duration = 1.5 + (i % 3) * 0.8;
                        const size = 5 + (i % 3) * 4;
                        return (
                            <motion.div
                                key={i}
                                className="absolute text-yellow-50/90 pointer-events-none"
                                style={{ left, top, width: size, height: size, zIndex: 1 }}
                                animate={{ 
                                    opacity: [0.1, 1, 0.1],
                                    scale: [0.6, 1.2, 0.6]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration,
                                    delay,
                                    ease: "easeInOut"
                                }}
                            >
                                <StarSVG />
                            </motion.div>
                        );
                    })}
                    {/* Shooting Star */}
                    <motion.div
                        className="absolute bg-gradient-to-r from-transparent via-white to-white rounded-full w-24 h-[1px] pointer-events-none blur-[0.5px]"
                        style={{ zIndex: 1, top: '20%', left: '-20%', transform: 'rotate(25deg)' }}
                        animate={{ x: [0, 800], y: [0, 300], opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeIn", repeatDelay: 12 }}
                    />
                    {/* Glowing Crescent Moon */}
                    <div className="absolute right-[10%] pointer-events-none" style={{ top: hour >= 23 || hour < 3 ? '5%' : '15%' }}>
                        <motion.div 
                            className="absolute -inset-8 bg-amber-200/10 rounded-full blur-2xl"
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        />
                        <motion.svg 
                            viewBox="0 0 24 24" 
                            className="w-10 h-10 text-yellow-100/95 filter drop-shadow-[0_0_10px_rgba(253,254,196,0.6)]"
                            fill="currentColor"
                            animate={{ rotate: [-2, 3, -2] }}
                            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
                        >
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </motion.svg>
                    </div>
                </motion.div>
            )}

            {state === 'rain' && (
                /* Lightning flash */
                <motion.div 
                    className="absolute inset-0 bg-card pointer-events-none"
                    style={{ zIndex: 0 }}
                    animate={{ 
                        opacity: [0, 0, 0.7, 0, 0, 0.85, 0, 0] 
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 7.5,
                        times: [0, 0.45, 0.47, 0.49, 0.85, 0.87, 0.89, 1]
                    }}
                />
            )}

            {/* 3. Distant Hills Layer (V2: Added slight blur for depth of field) */}
            <motion.div style={{ x: bgX, y: bgY }} className="absolute inset-0 blur-[1px]">
                <DistantHills fill={distantHillsColor} />
            </motion.div>

            {/* 4. Midground Forest Layer (Trees + Hills) */}
            <motion.div style={{ x: midX, y: midY, zIndex: 2 }} className="absolute inset-0 pointer-events-none">
                {midgroundTrees.map((tree, idx) => (
                <div 
                    key={`mid-tree-${idx}`}
                    className="absolute bottom-[35px] origin-bottom pointer-events-none"
                    style={{ 
                        left: tree.left, 
                        transform: `scale(${tree.scale})`,
                        zIndex: 2
                    }}
                >
                    {tree.type === 'pine' ? (
                        <PineTree color={treeColor} snowColor={snowColor} className="w-8 h-12" />
                    ) : (
                        <OakTree color={treeColor} snowColor={snowColor} className="w-8 h-12" />
                    )}
                </div>
            ))}
            <MidgroundHills fill={midgroundHillsColor} />

            {/* Fog / Mist Layer for Rain & Clouds */}
            {(state === 'rain' || state === 'clouds') && (
                <motion.div
                    className="absolute bottom-[20px] left-0 w-[200%] h-[60px] bg-gradient-to-t from-white/30 to-transparent blur-md pointer-events-none"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ repeat: Infinity, duration: 20 / windMultiplier, ease: "linear" }}
                />
            )}
            </motion.div>

            {/* 5. Foreground Meadows Layer (Trees + Meadows) */}
            <motion.div style={{ x: foreX, y: foreY, zIndex: 4 }} className="absolute inset-0 pointer-events-none">
                {foregroundTrees.map((tree, idx) => (
                <div 
                    key={`fore-tree-${idx}`}
                    className="absolute bottom-[14px] origin-bottom pointer-events-none"
                    style={{ 
                        left: tree.left, 
                        transform: `scale(${tree.scale})`,
                        zIndex: 4
                    }}
                >
                    {tree.type === 'pine' ? (
                        <PineTree color={foreTreeColor} snowColor={snowColor} className="w-9 h-14" />
                    ) : (
                        <OakTree color={foreTreeColor} snowColor={snowColor} className="w-9 h-14" />
                    )}
                </div>
            ))}
            <ForegroundMeadows fill={foregroundMeadowsColor} />
            </motion.div>

            {/* 6. Drifting Clouds (Layered on top of landscape to give height) */}
            {state === 'sun' && (
                <>
                    <motion.div
                        className="absolute left-0 top-2 w-20 h-12 pointer-events-none"
                        style={{ zIndex: 5 }}
                        animate={{ x: ["-100vw", "100vw"] }}
                        transition={{ repeat: Infinity, duration: 55, ease: "linear" }}
                    >
                        <CloudSVG opacity={0.8} fill="white" />
                    </motion.div>
                    <motion.div
                        className="absolute left-0 top-10 w-28 h-16 pointer-events-none blur-[0.5px]"
                        style={{ zIndex: 5 }}
                        animate={{ x: ["-100vw", "100vw"] }}
                        transition={{ repeat: Infinity, duration: 42, ease: "linear", delay: 12 }}
                    >
                        <CloudSVG opacity={0.9} fill="white" />
                    </motion.div>
                </>
            )}

            {state === 'clouds' && (
                <>
                    {/* Extra heavy layers for cloudy weather */}
                    <motion.div
                        className="absolute left-0 top-1 w-32 h-18 pointer-events-none blur-[1px]"
                        style={{ zIndex: 5 }}
                        animate={{ x: ["-100vw", "100vw"] }}
                        transition={{ repeat: Infinity, duration: 35, ease: "linear", delay: 3 }}
                    >
                        <CloudSVG opacity={0.7} fill="#f8fafc" />
                    </motion.div>
                    <motion.div
                        className="absolute left-0 top-8 w-24 h-14 pointer-events-none blur-[1.5px]"
                        style={{ zIndex: 5 }}
                        animate={{ x: ["-100vw", "100vw"] }}
                        transition={{ repeat: Infinity, duration: 48, ease: "linear", delay: 18 }}
                    >
                        <CloudSVG opacity={0.8} fill="#cbd5e1" />
                    </motion.div>
                </>
            )}

            {state === 'rain' && (
                <>
                    {/* Dark rain clouds */}
                    <motion.div
                        className="absolute left-0 top-1 w-28 h-16 pointer-events-none blur-[0.5px]"
                        style={{ zIndex: 5 }}
                        animate={{ x: ["-100vw", "100vw"] }}
                        transition={{ repeat: Infinity, duration: 32, ease: "linear" }}
                    >
                        <CloudSVG opacity={0.85} fill="#475569" />
                    </motion.div>
                    <motion.div
                        className="absolute left-0 top-6 w-24 h-14 pointer-events-none"
                        style={{ zIndex: 5 }}
                        animate={{ x: ["-100vw", "100vw"] }}
                        transition={{ repeat: Infinity, duration: 40, ease: "linear", delay: 8 }}
                    >
                        <CloudSVG opacity={0.9} fill="#334155" />
                    </motion.div>
                </>
            )}

            {isNightTime && state === 'sun' && (
                /* Faint midnight clouds (only when clear night) */
                <motion.div
                    className="absolute left-0 top-5 w-24 h-14 pointer-events-none blur-[1px]"
                    style={{ zIndex: 5 }}
                    animate={{ x: ["-100vw", "100vw"] }}
                    transition={{ repeat: Infinity, duration: 65, ease: "linear", delay: 5 }}
                >
                    <CloudSVG opacity={0.15} fill="#38bdf8" />
                </motion.div>
            )}

            {/* 7. Rain and Snow Particles (Rendered in foreground) */}
            {state === 'rain' && (
                <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 6 }}>
                    {Array.from({ length: 45 }).map((_, i) => {
                        const left = `${(i * 13.7 + 19) % 100}%`;
                        const delay = (i * 0.11) % 1.5;
                        const duration = (0.4 + (i % 4) * 0.1) / windMultiplier;
                        const height = `${12 + (i % 3) * 8}px`;
                        return (
                            <motion.div
                                key={`rain-drop-${i}`}
                                className="absolute bg-sky-200/50 w-[1.5px]"
                                style={{ 
                                    left, 
                                    top: -30, 
                                    height,
                                    transform: `rotate(${rainAngle}deg)` // angled rain based on wind
                                }}
                                animate={{ y: [0, 280], x: [0, rainAngle * 2] }}
                                transition={{
                                    repeat: Infinity,
                                    duration,
                                    delay,
                                    ease: "linear"
                                }}
                            />
                        );
                    })}
                </div>
            )}

            {state === 'snow' && (
                <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 6 }}>
                    {Array.from({ length: 35 }).map((_, i) => {
                        const left = `${(i * 17.3 + 9) % 100}%`;
                        const delay = (i * 0.19) % 4;
                        const duration = (2.5 + (i % 3) * 1.5) / Math.max(1, windMultiplier * 0.8);
                        const size = 3 + (i % 4) * 2;
                        return (
                            <motion.div
                                key={`snow-flake-${i}`}
                                className="absolute bg-white/90 rounded-full blur-[0.5px]"
                                style={{ left, top: -20, width: size, height: size }}
                                animate={{ 
                                    y: [0, 280],
                                    x: [0, (i % 2 === 0 ? 1 : -1) * 25 + (windSpeed * 3), 0] // drifting side-to-side + wind
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration,
                                    delay,
                                    ease: "easeInOut"
                                }}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

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
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none italic">{activePet?.name || "Luna"}</h4>
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
                    isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-slate-50"
                )}>
                    {isCompleted ? "✅" : quest.icon}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <span className={cn(
                            "text-xs font-black uppercase tracking-tight leading-none",
                            isCompleted ? "text-emerald-700 line-through opacity-60" : "text-slate-800"
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
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
        walkData, walkStats, startWalk, stopWalk,
        isWalkSimulation, setIsWalkSimulation
    } = useActivity();
    const { activePet } = usePet();
    const { weather, isLoading: weatherLoading } = useWeather();
    const [weatherOverride, setWeatherOverride] = React.useState<any>(null);
    const activeWeather = weatherOverride || weather;
    const [isWeatherDetailOpen, setIsWeatherDetailOpen] = React.useState(false);
    const { dailyQuests, dailyGoal, todayEarned, level } = useQuestEngine();

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

    // Hazırlık checklist'i state'leri
    const [checkedItems, setCheckedItems] = React.useState({ poopBag: false, water: false, leash: false });
    const checklistComplete = checkedItems.poopBag && checkedItems.water && checkedItems.leash;

    // Davet durumları
    const [isInviting, setIsInviting] = React.useState(false);
    const [inviteSent, setInviteSent] = React.useState(false);

    // Sürgü (Swipe-to-Start) referans ve koordinatları
    const sliderTrackRef = React.useRef<HTMLDivElement>(null);
    const [maxDrag, setMaxDrag] = React.useState(200);
    const dragX = useMotionValue(0);

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

    // Davet gönderme simulasyonu
    const handleSendInvite = () => {
        if (isInviting || inviteSent) return;
        setIsInviting(true);
        setTimeout(() => {
            setIsInviting(false);
            setInviteSent(true);
            
            window.dispatchEvent(new CustomEvent('moffi-toast', {
                detail: {
                    message: `📣 Çevredeki 12 Moffi arkadaşına yürüyüş daveti başarıyla gönderildi! 🐾`,
                    icon: 'Radio',
                    color: 'text-indigo-600 font-bold',
                }
            }));
            
            setTimeout(() => {
                setInviteSent(false);
            }, 5000);
        }, 1200);
    };

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

    // Rota seçimine veya aktif rotaya göre dinamik hedef belirle
    const targetDistance = walkData.isActive 
        ? (activeRoute?.distance || dailyGoal.distance) 
        : selectedRoute.distance;

    const distPercent = Math.round(Math.min(100, (distKm / Math.max(0.1, targetDistance)) * 100));
    const durPercent = Math.round(Math.min(100, (durationMin / Math.max(1, dailyGoal.duration)) * 100));

    // Slider arka plan dinamik dolgu genişliği
    const sliderFillWidth = useTransform(dragX, (x) => x + 44);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                        />

                        {/* Sheet Container */}
                        <motion.div
                            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="fixed bottom-4 left-4 right-4 z-50 bg-slate-100 rounded-[2.5rem] shadow-[0_-20px_80px_rgba(0,0,0,0.15)] border border-white/60 overflow-hidden flex flex-col"
                            style={{ height: '85vh', maxHeight: '700px' }}
                        >
                            {/* Grab handle */}
                            <div className="w-full flex justify-center pt-4 pb-2 z-20 relative shrink-0">
                                <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                            </div>

                            {/* Header Area */}
                            <div className="px-6 flex items-center justify-between pb-2 z-20 relative shrink-0">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">Moffi ile Yürüyüş</h2>
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
                                    className="w-9 h-9 bg-card rounded-full flex items-center justify-center shadow-moffi-card hover:bg-slate-50 transition-all cursor-pointer border-0"
                                >
                                    <X className="w-5 h-5 text-slate-450" />
                                </button>
                            </div>

                            {/* ── SCROLLABLE CONTENT ── */}
                            <div className="px-6 pb-8 pt-4 space-y-5.5 overflow-y-auto no-scrollbar flex-1 z-20">

                                {/* Weather Banner + Floating Counter Card Group */}
                                <div className="flex flex-col">
                                    {/* 1. DOUBLE PROGRESS RING DOME (YAŞAYAN PET MERKEZİ) & LIVE WEATHER BACKDROP */}
                                    <div className="-mx-6 -mt-4 relative overflow-hidden min-h-[230px] flex flex-col items-center justify-center">
                                        {/* Dynamic Live Weather Animation Backdrop - Full width & height of this header-to-counter section */}
                                        {activeWeather && (
                                            <div className="absolute inset-0 z-0">
                                                <WeatherSphereEffect 
                                                    condition={activeWeather.condition} 
                                                    temp={activeWeather.temp}
                                                    windSpeed={activeWeather.windSpeed}
                                                />
                                            </div>
                                        )}

                                        {/* Floating Live Weather Info (Left Side of Theme) */}
                                        <button 
                                            onClick={() => setIsWeatherDetailOpen(true)}
                                            className="absolute top-6 left-6 z-20 flex flex-col items-start bg-black/15 backdrop-blur-[2px] border border-card-border p-3 rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.1)] cursor-pointer hover:scale-105 active:scale-95 transition-all text-left"
                                        >
                                            <span className="text-2xl filter drop-shadow-md mb-2">{weatherLoading ? '⏳' : (activeWeather?.emoji || '☀️')}</span>
                                            <div className="flex flex-col">
                                                <span className="text-white font-black text-2xl drop-shadow-md leading-none">{weatherLoading ? '...' : activeWeather?.temp + '°C'}</span>
                                                <span className="text-white/95 font-bold text-[9px] uppercase tracking-wider drop-shadow-md mt-1.5 leading-none max-w-[80px] break-words">{weatherLoading ? 'Yükleniyor...' : activeWeather?.condition}</span>
                                            </div>
                                        </button>
                                        
                                        {/* Double Ring Dome renders centered on top of the weather backdrop */}
                                        <div className="relative z-10 w-full flex justify-center pt-4 pb-8">
                                            <DoubleRingDome
                                                activePet={activePet}
                                                distPercent={distPercent}
                                                durPercent={durPercent}
                                                walkData={walkData}
                                                level={level}
                                                activeWeather={activeWeather}
                                            />
                                        </div>
                                    </div>

                                    {/* 2. DYNAMIC METRICS DASHBOARD (Nike Run Club Style - Huge text, borderless) */}
                                    <div className="bg-card rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-moffi-card border-0 shrink-0 -mt-5 relative z-20 w-full">
                                        
                                        {/* Live Dynamic Island Status Capsule */}
                                        <div className="mb-4 px-3 py-1 rounded-full bg-slate-950 text-white flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-card-border animate-pulse max-w-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-200 truncate max-w-[200px]">
                                                {liveStatusText}
                                            </span>
                                            <span className="text-[7px] font-black text-emerald-400 bg-emerald-950/80 border border-emerald-900/50 px-1.5 py-0.5 rounded-full shrink-0">GPS LIVE</span>
                                        </div>

                                        {/* Mevcut KM Sayacı (Protected Layout) */}
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Mevcut Mesafe</span>
                                        <div className="flex items-baseline justify-center">
                                            <span className="text-6xl font-black italic tracking-tighter text-slate-800 font-mono leading-none">
                                                {distKm.toFixed(2)}
                                            </span>
                                            <span className="text-sm font-black text-slate-400 italic ml-1 tracking-wider">KM</span>
                                        </div>
                                        
                                        <div className="w-full h-px bg-slate-50 my-4" />
                                        
                                        {/* Real-time GPS Telemetry Grid */}
                                        <div className="grid grid-cols-2 w-full gap-x-6 gap-y-4 text-left">
                                            <div className="border-r border-slate-100 pr-2">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Süre (MM:SS)</span>
                                                </div>
                                                <span className="text-xl font-black text-slate-800 font-mono leading-none">
                                                    {formatTime(walkData.time)}
                                                    <span className="text-[10px] font-bold text-slate-400 ml-1">/{dailyGoal.duration}dk</span>
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1 mb-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Mesafe Hedefi</span>
                                                </div>
                                                <span className="text-xl font-black text-slate-800 font-mono leading-none">
                                                    {targetDistance.toFixed(1)}
                                                    <span className="text-[10px] font-bold text-slate-400 ml-1 font-sans">km</span>
                                                </span>
                                            </div>
                                            <div className="border-r border-slate-100 pr-2">
                                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Ortalama Tempo</span>
                                                <span className="text-xl font-black text-slate-800 font-mono leading-none">
                                                    {paceMinKm}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Anlık Hız</span>
                                                <div className="text-xl font-black text-slate-800 font-mono leading-none">
                                                    {walkData.speed.toFixed(1)} <span className="text-[9px] font-semibold text-slate-400 font-sans">km/h</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. MILESTONE PROGRESS TIMELINE */}
                                        <div className="w-full mt-5 pt-4 border-t border-slate-100 flex flex-col gap-1.5 text-left">
                                            <div className="flex justify-between items-center text-[7.5px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>Hedef Yol Haritası</span>
                                                <span className="text-orange-600 font-black">Hedef: %{distPercent}</span>
                                            </div>
                                            <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                                                <motion.div 
                                                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-indigo-500"
                                                    style={{ width: `${Math.max(3, Math.min(100, distPercent))}%` }}
                                                />
                                                {[25, 50, 75].map((pct) => (
                                                    <div 
                                                        key={pct}
                                                        className={cn(
                                                            "absolute top-0 bottom-0 w-0.5 z-10 transition-colors duration-300",
                                                            distPercent >= pct ? "bg-white/70" : "bg-slate-300/40"
                                                        )}
                                                        style={{ left: `${pct}%` }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 mt-1 select-none">
                                                <span className="flex items-center gap-0.5">🏁 <span>Başla</span></span>
                                                <span className={cn("flex items-center gap-0.5", distPercent >= 25 ? "text-orange-500" : "text-slate-400")}>🪙 <span>25%</span></span>
                                                <span className={cn("flex items-center gap-0.5", distPercent >= 50 ? "text-pink-500" : "text-slate-400")}>🎁 <span>50%</span></span>
                                                <span className={cn("flex items-center gap-0.5", distPercent >= 75 ? "text-indigo-500" : "text-slate-400")}>🏆 <span>75%</span></span>
                                                <span className={cn("flex items-center gap-0.5", distPercent >= 100 ? "text-emerald-600 font-black" : "text-slate-400")}>👑 <span>Bitti</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Weather Simulation Switcher (Dev Tools for UI Testing) */}
                                <div className="bg-slate-100/50 rounded-3xl p-3 flex flex-col gap-2 border border-slate-200/20">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Hava Simülatörü (Test Paneli)</span>
                                        {weatherOverride && (
                                            <button 
                                                onClick={() => setWeatherOverride(null)}
                                                className="text-[7.5px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full hover:bg-indigo-100 transition-all cursor-pointer"
                                            >
                                                Canlı Konum 🔄
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5" style={{ scrollbarWidth: 'none' }}>
                                        {[
                                            { id: 'sun', label: '☀️ Güneşli', cond: 'Açık Gökyüzü', temp: 24, wind: 5, walkScore: 100, walkLabel: 'Mükemmel', badgeColor: 'emerald', emoji: '☀️' },
                                            { id: 'rain', label: '🌧️ Yağmurlu', cond: 'Kuvvetli Yağmur', temp: 14, wind: 15, walkScore: 30, walkLabel: 'Dikkatli Ol', badgeColor: 'orange', emoji: '🌧️' },
                                            { id: 'snow', label: '❄️ Karlı', cond: 'Yoğun Kar Yağışı', temp: -2, wind: 8, walkScore: 20, walkLabel: 'Dikkatli Ol', badgeColor: 'orange', emoji: '❄️' },
                                            { id: 'clouds', label: '☁️ Bulutlu', cond: 'Sisli ve Kapalı', temp: 16, wind: 2, walkScore: 80, walkLabel: 'Uygun', badgeColor: 'yellow', emoji: '☁️' },
                                            { id: 'night', label: '🌙 Gece', cond: 'Açık Gece', temp: 11, wind: 4, walkScore: 70, walkLabel: 'Uygun', badgeColor: 'yellow', emoji: '🌙' },
                                            { id: 'storm', label: '🌩️ Fırtına', cond: 'Fırtınalı', temp: 18, wind: 28, walkScore: 5, walkLabel: 'Çıkmayın', badgeColor: 'red', emoji: '🌩️' }
                                        ].map(w => {
                                            const isSelected = weatherOverride?.condition === w.cond;
                                            return (
                                                <button
                                                    key={w.id}
                                                    onClick={() => setWeatherOverride({
                                                        temp: w.temp,
                                                        feelsLike: w.temp - 2,
                                                        condition: w.cond,
                                                        icon: w.emoji,
                                                        emoji: w.emoji,
                                                        humidity: 65,
                                                        windSpeed: w.wind,
                                                        walkScore: w.walkScore,
                                                        walkLabel: w.walkLabel,
                                                        badgeColor: w.badgeColor,
                                                        city: `${w.cond.split(' ')[0]} Test`,
                                                        lat: 40.9877,
                                                        lon: 29.0215,
                                                        lastUpdated: new Date()
                                                    })}
                                                    className={cn(
                                                        "flex-shrink-0 px-2.5 py-1.5 rounded-xl text-[8px] font-black cursor-pointer transition-all border border-slate-200/50 shadow-sm",
                                                        isSelected 
                                                            ? "bg-slate-900 text-white border-slate-900 scale-105 shadow-md" 
                                                            : "bg-card text-slate-600 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {w.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* GPS & Simulation Tracking Mode Switcher */}
                                <div className="bg-slate-100/50 rounded-3xl p-3 flex flex-col gap-2 border border-slate-200/20">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Yürüyüş Takip Modu</span>
                                        <span className={cn(
                                            "text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                                            isWalkSimulation ? "text-indigo-650 bg-indigo-50 border border-indigo-100" : "text-emerald-650 bg-emerald-50 border border-emerald-100"
                                        )}>
                                            {isWalkSimulation ? "Simülasyon Modu" : "Gerçek GPS Modu"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setIsWalkSimulation(true)}
                                            className={cn(
                                                "py-2 rounded-2xl text-[9px] font-black transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer",
                                                isWalkSimulation 
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]" 
                                                    : "bg-card text-slate-650 border-slate-200/60 hover:bg-slate-50"
                                            )}
                                        >
                                            <span className="text-sm">🧭</span>
                                            <span>Simülasyon (Sanal)</span>
                                        </button>
                                        <button
                                            onClick={() => setIsWalkSimulation(false)}
                                            className={cn(
                                                "py-2 rounded-2xl text-[9px] font-black transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer",
                                                !isWalkSimulation 
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]" 
                                                    : "bg-card text-slate-650 border-slate-200/60 hover:bg-slate-50"
                                            )}
                                        >
                                            <span className="text-sm">📍</span>
                                            <span>Gerçek GPS</span>
                                        </button>
                                    </div>
                                    <p className="text-[7.5px] text-slate-400 font-bold px-1 text-center leading-normal">
                                        {isWalkSimulation 
                                            ? "Simülasyon Modu aktif: Evde test ederken mesafe otomatik olarak artar." 
                                            : "Gerçek GPS aktif: Mesafe sadece telefondaki GPS hareket ettikçe artar."}
                                    </p>
                                </div>

                                {/* 4. HIZLI ROTA SEÇİCİ (Workouts style list, no borders) */}
                                {!walkData.isActive && (
                                    <div className="space-y-3">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] px-1">Yürüyüş Rotası</span>
                                        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5" style={{ scrollbarWidth: 'none' }}>
                                            {MOCK_ROUTES.map(route => {
                                                const isSelected = selectedRoute.id === route.id;
                                                return (
                                                    <button
                                                        key={route.id}
                                                        onClick={() => {
                                                            setSelectedRoute(route);
                                                            localStorage.setItem('moffi_selected_route', JSON.stringify(route));
                                                        }}
                                                        className={cn(
                                                            "flex-shrink-0 px-4 py-3 rounded-2xl border-0 text-left transition-all cursor-pointer flex items-center gap-3 shadow-[0_10px_25px_rgba(0,0,0,0.015)]",
                                                            isSelected
                                                                ? "bg-slate-900 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] scale-[1.03]"
                                                                : "bg-card text-slate-700 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <span className="text-lg leading-none">{route.icon}</span>
                                                        <div>
                                                            <div className={cn("text-[10px] font-black leading-none", isSelected ? "text-white" : "text-slate-800")}>{route.name}</div>
                                                            <div className={cn("text-[8px] font-bold mt-1 leading-none", isSelected ? "text-white/60" : "text-slate-400")}>{route.distance} km</div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* 5. YÜRÜYÜŞ ÖNCESİ HAZIRLIK KONTROL LİSTESİ (Pebble-styled interactive buttons) */}
                                {!walkData.isActive && (
                                    <div className="bg-card rounded-3xl p-4.5 space-y-3.5 shadow-moffi-card border-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-slate-455 uppercase tracking-[0.2em]">Yürüyüş Hazırlığı</span>
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
                                                            : "bg-slate-50 text-slate-600 hover:bg-slate-100/70"
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
                            )}

                            {/* 7. ACTIVE WALK QUESTS */}
                            {walkQuests.length > 0 && (
                                <div className="space-y-3">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] px-1">Mevcut Görevler</span>
                                    <div className="space-y-2">
                                        {walkQuests.map(q => (
                                            <QuestBar key={q.id} quest={q} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 8. STATS — STREAK + RANK */}
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => { onClose(); router.push('/walk'); }}
                                    className="bg-card rounded-3xl p-4.5 shadow-moffi-card border-0 relative overflow-hidden text-left cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group"
                                >
                                    {/* Small background flame glow */}
                                    <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
                                    <div className="flex items-center gap-2 mb-1 z-10 relative">
                                        <span className="text-base group-hover:animate-bounce">🔥</span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Yürüyüş Serisi</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-850 z-10 relative flex items-baseline gap-1">
                                        <span>{walkStats?.currentStreak || 0}</span>
                                        <span className="text-[10px] font-bold text-slate-400">gün</span>
                                    </div>
                                    <div className="text-[9px] text-orange-650 font-bold mt-1 z-10 relative flex items-center gap-0.5">
                                        <span>Detayları Gör</span> <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </button>

                                <button 
                                    onClick={() => { onClose(); router.push('/quests?tab=league'); }}
                                    className="bg-card rounded-3xl p-4.5 shadow-moffi-card border-0 relative overflow-hidden text-left cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group"
                                >
                                    <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />
                                    <div className="flex items-center gap-2 mb-1 z-10 relative">
                                        <Trophy className="w-3.5 h-3.5 text-yellow-500 fill-current group-hover:rotate-12 transition-transform" />
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Global Arena</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-850 z-10 relative">#6</div>
                                    <div className="text-[9px] text-yellow-650 font-bold mt-1 z-10 relative flex items-center gap-0.5">
                                        <span>Lige Katıl</span> <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </button>
                            </div>

                            {/* 9. LIVE RADAR + SOSYAL DAVET ET (Floating Pod) */}
                            <div className="bg-card rounded-3xl p-4 flex items-center justify-between shadow-moffi-card border-0">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                                            <Activity className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping" />
                                    </div>
                                    <div>
                                        <h6 className="text-slate-800 font-black text-[10px] uppercase tracking-tight italic leading-none">Çevrede Hareketlilik</h6>
                                        <p className="text-indigo-600 text-[8.5px] font-black uppercase tracking-widest mt-1.5 leading-none">12 Moffi Arkadaşı Aktif</p>
                                        
                                        {/* Overlapping Pet Avatars (Social Stack) */}
                                        <div className="flex items-center -space-x-1.5 overflow-hidden mt-1.5">
                                            <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100" alt="" />
                                            <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=100" alt="" />
                                            <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?q=80&w=100" alt="" />
                                            <span className="text-[7.5px] font-black text-slate-400 pl-1.5 flex items-center leading-none">+9</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={handleSendInvite}
                                        disabled={isInviting || inviteSent}
                                        className={cn(
                                            "px-3.5 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-all border-0 shadow-[0_4px_12px_rgba(0,0,0,0.02)]",
                                            inviteSent 
                                                ? "bg-emerald-500 text-white" 
                                                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                                        )}
                                    >
                                        {isInviting ? "..." : inviteSent ? "Gönderildi ✓" : "Davet Et 📣"}
                                    </button>
                                    <div className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-3.5 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)] border-0">
                                        <Zap className="w-3.5 h-3.5" /> Radar
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
                                    <div className="space-y-2">
                                        {/* Taktil Sürgülü Buton (Swipe to Start - Pill container with heavy drop-shadow) */}
                                        <div 
                                            ref={sliderTrackRef} 
                                            className="relative w-full h-14 bg-card rounded-full flex items-center p-1 overflow-hidden shadow-moffi-card border-0"
                                        >
                                            {/* Dinamik dolgu */}
                                            <motion.div 
                                                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-500/10 to-orange-500/20 rounded-l-full"
                                                style={{ width: sliderFillWidth }}
                                            />

                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-[0.2em] select-none",
                                                    checklistComplete ? "text-slate-600 animate-pulse" : "text-slate-400/80"
                                                )}>
                                                    {checklistComplete ? "Kaydır ve Başlat 🐾" : "Önce Hazırlık Kontrolü"}
                                                </span>
                                            </div>

                                            <motion.div
                                                drag={checklistComplete ? "x" : false}
                                                dragConstraints={{ left: 0, right: maxDrag }}
                                                dragElastic={0.05}
                                                dragMomentum={false}
                                                onDrag={(_, info) => {
                                                    if (dragX.get() >= maxDrag - 10) {
                                                        handleStartWalk();
                                                    }
                                                }}
                                                onDragEnd={() => {
                                                    if (dragX.get() < maxDrag - 10) {
                                                        animate(dragX, 0, { type: "spring", stiffness: 320, damping: 22 });
                                                    }
                                                }}
                                                style={{ x: dragX }}
                                                className={cn(
                                                    "w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-[0_4px_16px_rgba(0,0,0,0.1)] select-none z-10 border-0",
                                                    checklistComplete 
                                                        ? "bg-slate-900 text-white cursor-grab active:cursor-grabbing hover:bg-slate-800" 
                                                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                                )}
                                            >
                                                🐾
                                            </motion.div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => { router.push('/walk'); onClose(); }}
                                    className="w-full bg-card py-3.5 rounded-3xl flex items-center justify-center gap-1.5 group hover:bg-slate-50 transition-all cursor-pointer shadow-moffi-card border-0"
                                >
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-700 transition-colors">Yürüyüş İstatistikleri</span>
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
