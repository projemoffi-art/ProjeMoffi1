
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Play,
    Zap,
    Timer,
    Footprints,
    Award,
    Instagram,
    MessageCircle,
    Share2,
    Sun,
    Smile,
    Compass
} from "lucide-react";
import { motion } from "framer-motion";
import { useSocial } from "@/context/SocialContext";
import { cn } from "@/lib/utils";

import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

function WalkSummaryContent() {
    const router = useRouter();
    const { currentUser } = useSocial();
    const searchParams = useSearchParams();
    const sessionId = searchParams?.get('id');

    // ... logic ...
    // Find the session (convert both to string or number to be safe)
    const session = currentUser.walks?.find(w => w.id.toString() === sessionId) || currentUser.walks?.[0]; // Fallback to latest

    // Derived Stats or Defaults
    const stats = session ? {
        steps: session.steps,
        km: session.distance,
        time: Math.floor(session.duration / 60), // duration is in seconds
        calories: Math.floor(session.steps * 0.04), // simple calc
        mood: session.steps > 5000 ? "Harika! 🚀" : "Mutlu 😊"
    } : {
        steps: 0,
        km: 0,
        time: 0,
        calories: 0,
        mood: "Nötr 😐"
    };

    // Calculate Aura Intensity based on steps
    // Low: < 2000 | Mid: 2000-5000 | High: > 5000
    const intensity = stats.steps > 5000 ? "high" : stats.steps > 2000 ? "mid" : "low";

    const auraColors = {
        low: "from-blue-400/80 via-cyan-300/60 to-transparent dark:from-blue-600/50 dark:via-cyan-900/40",
        mid: "from-emerald-400/80 via-teal-300/60 to-transparent dark:from-emerald-600/50 dark:via-teal-900/40",
        high: "from-purple-500/80 via-pink-400/60 to-transparent dark:from-purple-600/50 dark:via-pink-900/40"
    };

    const activeColor = auraColors[intensity];

    // MOOD CONFIGURATION - PREMIUM NEON
    const moodConfig = {
        energetic: { label: "Enerjik", color: "shadow-teal-500/30", text: "text-teal-700 dark:text-teal-300", icon: Zap, gradient: "from-teal-400 to-emerald-400" },
        calm: { label: "Sakin", color: "shadow-blue-500/30", text: "text-blue-700 dark:text-blue-300", icon: Sun, gradient: "from-blue-400 to-indigo-400" },
        happy: { label: "Mutlu", color: "shadow-yellow-500/30", text: "text-yellow-700 dark:text-yellow-300", icon: Smile, gradient: "from-yellow-400 to-orange-400" },
        adventure: { label: "Macera", color: "shadow-orange-500/30", text: "text-orange-700 dark:text-orange-300", icon: Compass, gradient: "from-orange-400 to-red-400" }
    };

    // Determine Mood Logic (Enhanced)
    let currentMood: keyof typeof moodConfig = "happy";
    if (stats.steps > 8000) currentMood = "adventure";
    else if (stats.steps > 5000) currentMood = "energetic";
    else if (stats.time > 45) currentMood = "calm";

    const moodStyle = moodConfig[currentMood];

    // Particle State for Hydration Safe Rendering
    const [particles, setParticles] = useState<{ x: number, y: number, scale: number, color: string }[]>([]);

    useEffect(() => {
        const colors = ['#FCD34D', '#F59E0B', '#EF4444'];
        const newParticles = Array.from({ length: 12 }).map(() => ({
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200 - 50,
            scale: Math.random() * 1.5,
            color: colors[Math.floor(Math.random() * 3)]
        }));
        setParticles(newParticles);
    }, []);

    return (
        <main className="min-h-screen relative overflow-hidden font-sans flex flex-col items-center justify-center">

            {/* 1. DYNAMIC AURA BACKGROUND (3 LAYERS) */}
            <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">

                {/* Layer 1: The "Atmosphere" (Wide, Slow) */}
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.1, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className={cn(
                        "absolute w-[800px] h-[800px] rounded-full bg-gradient-radial blur-[100px]",
                        activeColor
                    )}
                />

                {/* Layer 2: The "Pulse" (Mid, Rhythmic) */}
                <motion.div
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.6, 0.3, 0.6]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className={cn(
                        "absolute w-[550px] h-[550px] rounded-full bg-gradient-to-tr blur-[80px] mix-blend-screen opacity-50",
                        activeColor
                    )}
                />

                {/* Layer 3: The "Core Energy" (Tight, Vibrating) */}
                <motion.div
                    animate={{
                        scale: [0.95, 1.05, 0.95],
                        rotate: [0, 5, -5, 0], // Subtle vibration
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={cn(
                        "absolute w-[350px] h-[350px] rounded-full bg-gradient-to-br blur-[40px] opacity-80",
                        activeColor
                    )}
                />
            </div>

            {/* 2. PET SPOTLIGHT (The Star) */}
            <div className="relative z-10 flex flex-col items-center mb-10 w-full animate-in fade-in zoom-in duration-700">

                {/* Floating XP Badge */}
                {/* Floating XP Badge - PREMIUM REDESIGN */}
                <div className="relative mb-8 z-20">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-40 animate-pulse" />

                    <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                        whileHover={{ scale: 1.1 }}
                        className="relative bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 p-[2px] rounded-full shadow-[0_0_30px_rgba(251,191,36,0.6)] cursor-pointer"
                    >
                        <div className="bg-black/10 backdrop-blur-sm rounded-full px-6 py-2 flex items-center gap-2">
                            <motion.div
                                animate={{ rotate: [0, 20, -20, 0] }}
                                transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                            >
                                <Award className="w-5 h-5 text-white fill-yellow-200" />
                            </motion.div>
                            <span className="text-sm font-black text-white tracking-wide drop-shadow-sm">
                                +{Math.floor(stats.steps / 100)} MoffiPuan
                            </span>
                        </div>

                        {/* Shine Animation */}
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ x: ["-100%", "200%"] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1 }}
                                className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12"
                            />
                        </div>
                    </motion.div>

                    {/* Particle Explosion (Hydration Safe) */}
                    {particles.map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                            animate={{
                                opacity: 0,
                                x: p.x,
                                y: p.y,
                                scale: p.scale
                            }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full pointer-events-none"
                            style={{ backgroundColor: p.color }}
                        />
                    ))}
                </div>

                {/* Giant Avatar with Inner Glow */}
                <div className="relative group cursor-pointer">
                    {/* Spinning Border Ring */}
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-white/0 via-white/50 to-white/0 dark:via-white/20 animate-spin-slow opacity-70" />

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="relative w-48 h-48 rounded-full border-4 border-white dark:border-card-border shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_0_60px_rgba(255,255,255,0.05)] overflow-hidden bg-gray-100"
                    >
                        <img
                            src={currentUser.avatar || "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=400&auto=format&fit=crop"}
                            className="w-full h-full object-cover scale-105"
                            alt="Pet"
                        />
                        {/* Glossy Overlay & Depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
                        <div className="absolute inset-0 border-[6px] border-card-border rounded-full pointer-events-none" />
                    </motion.div>

                    {/* MOOD CARD - MINI & MODERN (Apple Glare Style) */}
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-30">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, type: "spring" }}
                            className={cn(
                                "bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl px-2 py-2 pr-5 rounded-full shadow-2xl flex items-center gap-2.5 border border-white/40 dark:border-card-border",
                                moodStyle.color // specific shadow
                            )}
                        >
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-lg text-white ring-2 ring-white/20", `bg-gradient-to-tr ${moodStyle.gradient}`)}>
                                <moodStyle.icon className="w-4 h-4 fill-white" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Ruh Hali</span>
                                <span className={cn("text-xs font-black tracking-wide", moodStyle.text)}>{moodStyle.label}</span>
                            </div>
                        </motion.div>
                    </div>
                </div>





                {/* 3. GLASS METRICS CARD (Premium Redesign) */}
                <div className="w-full max-w-[90%] mb-10 z-10">
                    <motion.div
                        transition={{ delay: 0.5 }}
                        className="bg-white/60 dark:bg-[#1E293B]/60 backdrop-blur-3xl rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 dark:border-card-border relative overflow-hidden group"
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        <div className="grid grid-cols-3 divide-x divide-gray-200/60 dark:divide-white/10 relative z-10">
                            {/* Steps */}
                            <div className="flex flex-col items-center gap-1.5 p-2">
                                <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-full mb-1 shadow-sm">
                                    <Footprints className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="text-3xl font-black text-foreground dark:text-white tracking-tighter drop-shadow-sm">{stats.steps}</span>
                                <span className="text-[10px] font-bold text-gray-400/80 uppercase tracking-widest">Adım</span>
                            </div>

                            {/* Time */}
                            <div className="flex flex-col items-center gap-1.5 p-2">
                                <div className="p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-full mb-1 shadow-sm">
                                    <Timer className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-3xl font-black text-foreground dark:text-white tracking-tighter leading-none flex items-baseline drop-shadow-sm">
                                    {stats.time}<span className="text-sm font-bold text-gray-400/80 ml-0.5">dk</span>
                                </span>
                                <span className="text-[10px] font-bold text-gray-400/80 uppercase tracking-widest">Süre</span>
                            </div>

                            {/* KM */}
                            <div className="flex flex-col items-center gap-1.5 p-2">
                                <div className="p-3 bg-orange-100/50 dark:bg-orange-900/30 rounded-full mb-1 shadow-sm">
                                    <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-3xl font-black text-foreground dark:text-white tracking-tighter drop-shadow-sm">{stats.km}</span>
                                    <span className="text-[10px] font-bold text-gray-400/80 uppercase tracking-widest mt-1">KM</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* 4. ACTION ZONE */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="w-[85%] max-w-sm flex flex-col gap-3 z-10"
                >
                    {/* Cinematic Walk Replay Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98, y: 4 }}
                        className="group relative w-full h-16 bg-gradient-to-br from-[#2D3342] to-[#0F1218] rounded-[2rem] border border-card-border shadow-[0_8px_0_#0B0D11,0_20px_40px_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center gap-3 overflow-hidden"
                    >
                        {/* Shimmer / Ripple Hint */}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Glowing Icon Frame */}
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-card-border flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-shadow duration-500">
                            <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
                            <Play className="relative z-10 w-5 h-5 text-white fill-white ml-0.5" />
                        </div>

                        {/* Text */}
                        <span className="text-lg font-black text-white/90 tracking-wide uppercase drop-shadow-md">
                            Walk Replay
                        </span>
                    </motion.button>

                    <div className="flex gap-4 w-full">
                        {/* Instagram Story Button - Premium Gradient */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 h-12 rounded-full relative group overflow-hidden shadow-[0_8px_20px_rgba(225,48,108,0.2)] hover:shadow-[0_12px_25px_rgba(225,48,108,0.3)] transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#FFBE0B] via-[#FF006E] to-[#8338EC] group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-20 transition-opacity" />
                            <div className="relative flex items-center justify-center gap-2 text-white">
                                <Instagram className="w-5 h-5 drop-shadow-md" />
                                <span className="text-sm font-bold tracking-wide text-shadow-sm">Story</span>
                            </div>
                        </motion.button>

                        {/* WhatsApp Button - Modern & Clean */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 h-12 bg-card dark:bg-[#1E2B3A] rounded-full border border-card-border dark:border-card-border shadow-[0_8px_20px_rgba(37,211,102,0.15)] hover:shadow-[0_12px_25px_rgba(37,211,102,0.25)] flex items-center justify-center gap-2 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center group-hover:bg-[#25D366] transition-colors duration-300">
                                <MessageCircle className="w-4 h-4 text-[#25D366] group-hover:text-white transition-colors duration-300 fill-current" />
                            </div>
                            <span className="text-sm font-bold text-foreground dark:text-white group-hover:text-[#25D366] dark:group-hover:text-[#25D366] transition-colors">WhatsApp</span>
                        </motion.button>
                    </div>

                    <button
                        onClick={() => router.push('/walk')}
                        className="mt-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold transition-colors"
                    >
                        Kapat ve Ana Ekrana Dön
                    </button>
                </motion.div>


            </div>
        </main>
    );
}

export default function WalkSummaryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
            <WalkSummaryContent />
        </Suspense>
    );
}
