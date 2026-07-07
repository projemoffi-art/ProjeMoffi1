"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CloudSun, Wind, Droplets, ArrowRight,
    Footprints, Utensils, Heart, Play, ChevronRight,
    ThermometerSun, Umbrella, Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePet } from "@/context/PetContext";

// --- MOCK DATA ---
const WEATHER_DATA = {
    temp: 24,
    condition: "Parçalı Bulutlu",
    humidity: 65,
    wind: 12,
    groundTemp: 28, // Pati yakmaz
    hourly: [
        { time: '14:00', temp: 24, icon: CloudSun },
        { time: '15:00', temp: 23, icon: CloudSun },
        { time: '16:00', temp: 22, icon: Wind },
        { time: '17:00', temp: 21, icon: Droplets },
    ]
};

export default function HeroCard() {
    const router = useRouter();
    const { activePet } = usePet();
    const [showWeather, setShowWeather] = useState(false);
    const [fedState, setFedState] = useState(false);
    const [loveBurst, setLoveBurst] = useState(false);
    const [progress, setProgress] = useState({ walk: 65, food: 40, love: 85 });

    // --- ACTIONS ---

    const handleFeed = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (fedState) return;
        setFedState(true);
        setProgress(p => ({ ...p, food: 100 }));
        // Trigger server action here
    };

    const handleLove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLoveBurst(true);
        setProgress(p => ({ ...p, love: Math.min(100, p.love + 15) }));
        setTimeout(() => setLoveBurst(false), 1000);
    };

    const toggleWeather = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowWeather(!showWeather);
    };

    if (!activePet) return null;

    return (
        <section className="px-6 mb-8 mt-4 relative z-0">
            {/* MAIN CARD CONTAINER */}
            <div className="relative w-full h-[30rem] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-500/20 group cursor-pointer">

                {/* 1. DYNAMIC BACKGROUND IMAGE */}
                <img
                    src={activePet.image}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={activePet.name}
                    onClick={handleLove} // Double tap logic could be better, but single click anywhere for love is cute too
                />

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent opacity-60 pointer-events-none" />

                {/* --- TOP INTERACTIVE WIDGETS --- */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">

                    {/* WEATHER (Clickable) */}
                    <motion.button
                        layoutId="weather-widget"
                        onClick={toggleWeather}
                        className={cn("bg-white/20 backdrop-blur-md border border-card-border rounded-3xl p-2 pr-4 flex items-center gap-3 shadow-lg transition-all active:scale-95", showWeather && "bg-white/90 border-white text-black")}
                    >
                        <div className={cn("p-2 rounded-full transition-colors", showWeather ? "bg-orange-500 text-white" : "bg-orange-400 text-white")}>
                            <CloudSun className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <div className={cn("text-xs font-black leading-none mb-0.5", showWeather ? "text-foreground" : "text-white")}>{WEATHER_DATA.temp}°C</div>
                            <div className={cn("text-[10px] font-medium leading-none", showWeather ? "text-gray-500" : "text-white/80")}>{WEATHER_DATA.condition}</div>
                        </div>
                    </motion.button>

                    {/* LOVE BURST EFFECT */}
                    <AnimatePresence>
                        {loveBurst && (
                            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 1, y: -50 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Heart className="w-24 h-24 text-pink-500 fill-current drop-shadow-2xl" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* STATUS EDIT (Simplified) */}
                    <div className="bg-black/30 backdrop-blur-md border border-card-border rounded-full px-3 py-1.5 flex items-center gap-2 text-white/90 shadow-lg">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold">Çevrimiçi</span>
                    </div>
                </div>

                {/* --- WEATHER EXPANDED MODAL (In-Place) --- */}
                <AnimatePresence>
                    {showWeather && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className="absolute top-20 left-6 right-6 bg-white/90 backdrop-blur-xl rounded-3xl p-4 shadow-2xl z-20 overflow-hidden text-foreground"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                    <ThermometerSun className="w-4 h-4 text-orange-500" /> Zemin: {WEATHER_DATA.groundTemp}°C (Güvenli)
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                    <Wind className="w-4 h-4 text-blue-500" /> {WEATHER_DATA.wind} km/s
                                </div>
                            </div>
                            <div className="flex justify-between gap-2">
                                {WEATHER_DATA.hourly.map((h, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1 bg-card p-2 rounded-xl shadow-moffi-card w-full">
                                        <span className="text-[10px] font-bold text-gray-400">{h.time}</span>
                                        <h.icon className="w-5 h-5 text-foreground" />
                                        <span className="text-xs font-bold">{h.temp}°</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* 3. CENTER / BOTTOM CONTENT */}
                <div className="absolute bottom-0 left-0 right-0 p-8 pb-8 flex flex-col items-start z-10">

                    {/* Pet Info */}
                    <div className="mb-4">
                        <h2 className="text-5xl font-black text-white leading-none mb-2 drop-shadow-lg">
                            {activePet.name}
                        </h2>
                        <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                            <span className="bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-400/30">ENERJİK ⚡</span>
                            Bugün hiç yorulmadı!
                        </p>
                    </div>

                    {/* ACTIVITY RINGS (Clickable) */}
                    <div className="w-full grid grid-cols-3 gap-3 mb-5">
                        {/* Walk */}
                        <button onClick={() => router.push('/walk')} className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-card-border flex flex-col items-center gap-2 hover:bg-white/20 transition-colors active:scale-95">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentcolor" strokeWidth="3" />
                                    <path className="text-orange-400" strokeDasharray={`${progress.walk}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentcolor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                <Footprints className="w-5 h-5 text-white absolute" />
                            </div>
                            <span className="text-[10px] text-white font-bold">Yürüyüş</span>
                        </button>

                        {/* Food */}
                        <button onClick={handleFeed} className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-card-border flex flex-col items-center gap-2 hover:bg-white/20 transition-colors active:scale-95 relative overflow-hidden">
                            {fedState && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center text-white font-bold text-xs">Mmm! 🥣</div>}
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentcolor" strokeWidth="3" />
                                    <path className={cn("text-green-400 transition-all duration-1000", fedState && "text-green-500")} strokeDasharray={`${progress.food}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentcolor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                <Utensils className="w-5 h-5 text-white absolute" />
                            </div>
                            <span className="text-[10px] text-white font-bold">{fedState ? 'Beslendi' : 'Besle'}</span>
                        </button>

                        {/* Love */}
                        <button onClick={handleLove} className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-card-border flex flex-col items-center gap-2 hover:bg-white/20 transition-colors active:scale-95">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentcolor" strokeWidth="3" />
                                    <path className="text-pink-500" strokeDasharray={`${progress.love}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentcolor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                <Heart className={cn("w-5 h-5 text-white absolute fill-current", loveBurst && "animate-ping")} />
                            </div>
                            <span className="text-[10px] text-white font-bold">Sevgi</span>
                        </button>
                    </div>

                    {/* MAIN CTA */}
                    <button
                        onClick={() => router.push('/walk')}
                        className="w-full bg-[#5B4D9D] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:bg-[#4a3e80] transition-colors active:scale-95 border border-card-border"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        Günün Macerasını Başlat
                    </button>

                </div>
            </div>
        </section>
    );
}
