"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    MapPin, Trophy, ChevronRight, ChevronLeft,
    Flame, Cookie, Timer, Footprints, Play, Square
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLACES } from "@/data/mockPlaces";
import dynamic from "next/dynamic";
import { WalkDeals } from "@/components/walk/WalkDeals";
import { PetSwitcher } from "@/components/common/PetSwitcher";
import { useActivity } from "@/context/ActivityContext";

// Dynamic Import for Google Map
const GoogleLiveMap = dynamic(() => import('@/components/walk/GoogleLiveMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#242f3e] animate-pulse rounded-[2rem] flex items-center justify-center text-white/20 font-bold">Harita Yükleniyor...</div>
});

export default function WalkPage() {
    const router = useRouter();
    const { walkData, startWalk, stopWalk } = useActivity();
    const [userPos, setUserPos] = useState<[number, number]>([41.0082, 28.9784]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        return mins;
    };

    // Initial GPS
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
                (err) => console.error(err)
            );
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#121212] pb-24 font-sans">
            {/* 1. HEADER & LOCATION */}
            <header className="px-6 py-4 flex justify-between items-center sticky top-0 z-30 bg-[#F8F9FC]/80 dark:bg-[#121212]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            if (window.history.length > 2) {
                                router.back();
                            } else {
                                router.push('/community');
                            }
                        }} 
                        className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-gray-100 dark:border-white/10"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-white" />
                    </button>
                    <div>
                        <div className="flex items-center gap-1 text-[#5B4D9D] font-bold text-xs uppercase tracking-wider mb-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>Mevcut Konum</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <h1 className="text-xl font-black text-gray-900 dark:text-white">Caddebostan, İstanbul</h1>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                </div>
                <div className="scale-90 origin-right">
                    <PetSwitcher mode="compact" />
                </div>
            </header>

            <main className="px-5 space-y-6">

                {/* 2. LEADERBOARD TEASER (NEW!) */}
                <div
                    onClick={() => router.push('/walk/leaderboard')}
                    className="bg-gradient-to-r from-[#240b36] to-[#c31432] p-4 rounded-3xl relative overflow-hidden shadow-xl shadow-red-900/20 cursor-pointer group"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
                                <Trophy className="w-6 h-6 text-yellow-400 fill-current" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-lg leading-tight uppercase italic">Global Arena</h3>
                                <div className="text-white/80 text-xs font-bold">Sıralaman: <span className="text-yellow-300 text-sm">#6</span></div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-white font-bold h-min whitespace-nowrap mb-1">
                                Gümüş Lig
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover:bg-yellow-400 transition-colors">
                                <ChevronRight className="w-5 h-5 text-black" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. STATS SUMMARY COMPONENT (Sync with Sidebar) */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center gap-1 group truncate">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 mb-1 group-hover:scale-110 transition-transform">
                            <Flame className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-black text-gray-900 dark:text-white">
                            {Math.floor(walkData.distance / 12)}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kcal</span>
                    </div>
                    <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center gap-1 group truncate">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 mb-1 group-hover:scale-110 transition-transform">
                            <Footprints className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-black text-gray-900 dark:text-white">
                            {walkData.distance >= 1000 ? (walkData.distance / 1000).toFixed(1) : Math.floor(walkData.distance)}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {walkData.distance >= 1000 ? 'Km' : 'Metre'}
                        </span>
                    </div>
                    <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center gap-1 group truncate">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-500 mb-1 group-hover:scale-110 transition-transform">
                            <Timer className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-black text-gray-900 dark:text-white">
                            {formatTime(walkData.time)}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dk</span>
                    </div>
                </div>

                {/* 4. DISCOVERY MAP (Interactive Preview) */}
                <div className="relative w-full h-[320px] rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-200/50 dark:shadow-none border border-white/50 dark:border-white/10 group">
                    <GoogleLiveMap
                        userPos={userPos}
                        path={[]}
                        isTracking={walkData.isActive}
                        visitedPlaceIds={[]}
                        places={PLACES}
                        marks={[]}
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Floating Elements on Map */}
                    <div className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none">
                        <div className="bg-white/95 dark:bg-[#0A0A0E]/95 backdrop-blur-xl px-4 py-2 rounded-2xl text-[10px] font-black text-gray-800 dark:text-white shadow-xl flex items-center gap-2 border border-white/10">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> 12 Moffi Arkadaşı Yakınında
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col gap-4">
                        <div className="bg-black/20 backdrop-blur-sm p-4 rounded-[2rem] border border-white/10">
                            <h2 className="text-white font-black text-xl mb-0.5 tracking-tight uppercase italic">
                                {walkData.isActive ? 'Yürüyüş Takibi' : 'Keşfe Çık'}
                            </h2>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest leading-normal">
                                {walkData.isActive ? 'Yürüyüşün canlı olarak kaydediliyor...' : 'Çevredeki parkları, kafeleri keşfet ve ödülleri topla.'}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                if (walkData.isActive) {
                                    stopWalk();
                                } else {
                                    startWalk();
                                    router.push('/walk/tracking');
                                }
                            }}
                            className={cn(
                                "w-full h-16 rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95 group overflow-hidden",
                                walkData.isActive ? "bg-red-500 text-white" : "bg-white text-black"
                            )}
                        >
                            {walkData.isActive ? (
                                <><Square className="w-6 h-6 fill-current" /> Yürüyüşü Bitir</>
                            ) : (
                                <><Play className="w-6 h-6 fill-current" /> Yürüyüşü Başlat</>
                            )}
                        </button>
                    </div>
                </div>

                {/* 5. NEARBY DEALS (GAMIFICATION) */}
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="font-black text-gray-900 dark:text-white text-lg flex items-center gap-2">
                            <Cookie className="w-5 h-5 text-orange-500" /> Yakındaki Fırsatlar
                        </h3>
                        <button className="text-xs font-bold text-[#5B4D9D]">Tümü</button>
                    </div>
                    {/* We reuse the Deals Component here if defined, or inline mock */}
                    <WalkDeals />
                </div>
            </main>
        </div>
    );
}
