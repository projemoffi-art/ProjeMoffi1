import React from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

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
                        className="absolute top-[20%] text-slate-800 dark:text-slate-100/20 w-8 h-8 pointer-events-none"
                        animate={{ x: ["-100vw", "100vw"], y: [0, -15, 5, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 25 / windMultiplier, ease: "linear" }}
                    >
                        <BirdSVG />
                    </motion.div>
                    <motion.div
                        className="absolute top-[25%] text-slate-800 dark:text-slate-100/15 w-6 h-6 pointer-events-none"
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


export { WeatherSphereEffect };
