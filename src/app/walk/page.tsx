"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    MapPin, Trophy, ChevronRight, ChevronLeft,
    Flame, Cookie, Timer, Footprints, Play, Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLACES } from "@/data/mockPlaces";
import dynamic from "next/dynamic";
import { WalkDeals } from "@/components/walk/WalkDeals";
import { PetSwitcher } from "@/components/common/PetSwitcher";
import { useActivity } from "@/context/ActivityContext";
import { usePet } from "@/context/PetContext";
import { useWeather } from "@/context/WeatherContext";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { QuestBentoCard } from "@/components/quests/QuestBentoCard";

// Dynamic Import for Leaflet Map
const GoogleLiveMap = dynamic(() => import('@/components/walk/LiveMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#242f3e] animate-pulse rounded-[2rem] flex items-center justify-center text-white/20 font-bold">Harita Yükleniyor...</div>
});

export default function WalkPage() {
    const router = useRouter();
    const { walkData, walkStats, walkHistory, startWalk, stopWalk, isWalkSimulation, setIsWalkSimulation } = useActivity();
    const { activePet } = usePet();
    const { weather, isLoading: weatherLoading } = useWeather();
    const { dailyGoal, progressPercent, durationPercent } = useQuestEngine();
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
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#121212] pb-24 font-sans transition-colors duration-300">
            {/* 1. HEADER & LOCATION */}
            <header className="px-6 py-4 flex justify-between items-center sticky top-0 z-30 bg-[#F8F9FC]/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-card-border/50 dark:border-white/[0.02]">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            if (window.history.length > 2) {
                                router.back();
                            } else {
                                router.push('/community');
                            }
                        }} 
                        className="w-10 h-10 rounded-full bg-card dark:bg-white/5 flex items-center justify-center shadow-moffi-card active:scale-95 transition-all border border-card-border dark:border-card-border"
                    >
                        <ChevronLeft className="w-5 h-5 text-foreground dark:text-white" />
                    </button>
                    <div>
                        <div className="flex items-center gap-1 text-[#5B4D9D] dark:text-purple-400 font-bold text-xs uppercase tracking-wider mb-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>Mevcut Konum</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <h1 className="text-base font-black text-foreground dark:text-white">Caddebostan, İstanbul</h1>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>
                </div>
                <div className="scale-90 origin-right">
                    <PetSwitcher mode="compact" />
                </div>
            </header>

            {/* Segmented Tab Switcher */}
            <div className="px-5 mt-4">
                <div className="bg-slate-200/50 dark:bg-white/5 p-1 rounded-2xl flex gap-1 relative overflow-hidden">
                    {(['controls', 'stats', 'map'] as const).map((tab) => {
                        const label = {
                            controls: 'Yürüyüş',
                            stats: 'İstatistikler',
                            map: 'Harita'
                        }[tab];
                        const isActive = tab === 'stats';
                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    if (tab === 'controls') {
                                        router.push('/community?openWalk=true');
                                    } else if (tab === 'map') {
                                        router.push('/walk/tracking');
                                    }
                                }}
                                className={cn(
                                    "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all relative cursor-pointer border-0 z-10",
                                    isActive ? "text-slate-800 dark:text-white bg-white dark:bg-white/10 shadow-sm" : "text-slate-400 dark:text-slate-400 hover:text-slate-700 bg-transparent"
                                )}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <main className="px-5 mt-4 space-y-5">

                {/* 2. WEATHER WIDGET - GERÇEK VERİ */}
                <div className={`bg-gradient-to-r border rounded-2xl p-3.5 flex items-center justify-between shadow-sm backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 ${
                    !weather || weather.badgeColor === 'emerald'
                        ? 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5 border-emerald-500/20 dark:border-emerald-500/10'
                        : weather.badgeColor === 'yellow'
                        ? 'from-yellow-500/10 to-amber-500/10 dark:from-yellow-500/5 dark:to-amber-500/5 border-yellow-500/20 dark:border-yellow-500/10'
                        : weather.badgeColor === 'orange'
                        ? 'from-orange-500/10 to-red-500/10 dark:from-orange-500/5 dark:to-red-500/5 border-orange-500/20 dark:border-orange-500/10'
                        : 'from-red-500/10 to-pink-500/10 dark:from-red-500/5 dark:to-pink-500/5 border-red-500/20 dark:border-red-500/10'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md text-lg">
                            {weatherLoading ? '⏳' : (weather?.emoji || '☀️')}
                        </div>
                        <div>
                            <h4 className="text-foreground dark:text-white/90 font-black text-xs uppercase tracking-wider leading-none">
                                {weatherLoading
                                    ? 'Hava Durumu Yükleniyor...'
                                    : weather
                                    ? `Hava Yürüyüşe ${weather.walkLabel}`
                                    : 'Hava Yürüyüşe Uygun'
                                }
                            </h4>
                            <p className="text-gray-500 dark:text-white/50 text-[10px] font-semibold mt-1">
                                {weatherLoading
                                    ? 'Konum ve hava durumu alınıyor...'
                                    : weather
                                    ? `Bugün ${weather.city} ${weather.temp}°C • ${weather.condition} ${weather.emoji} • Hissedilen ${weather.feelsLike}°C`
                                    : 'Hava verileri alınamadı'
                                }
                            </p>
                        </div>
                    </div>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        !weather || weather.badgeColor === 'emerald'
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15'
                            : weather.badgeColor === 'yellow'
                            ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/15'
                            : weather.badgeColor === 'orange'
                            ? 'text-orange-600 dark:text-orange-400 bg-orange-500/15'
                            : 'text-red-600 dark:text-red-400 bg-red-500/15'
                    }`}>
                        {weatherLoading ? '...' : weather ? `%${weather.walkScore} UYGUN` : '%100 UYGUN'}
                    </span>
                </div>

                {/* 3. DOSTUM BENTO DURUM KARTI (NEW!) */}
                <div className="bg-white/80 dark:bg-[#1A1A1A]/80 border border-card-border dark:border-card-border rounded-2xl p-4 flex gap-4 items-center shadow-sm backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-400">
                    <div className="w-14 h-14 rounded-2xl border border-card-border dark:border-card-border overflow-hidden relative shrink-0 bg-gray-50 dark:bg-black/20 flex items-center justify-center">
                        {activePet?.avatar || activePet?.image ? (
                            <img 
                                src={activePet?.avatar || activePet?.image} 
                                className="w-full h-full object-cover"
                                alt={activePet?.name || 'Moffi'}
                            />
                        ) : (
                            <span className="text-gray-400 dark:text-zinc-500 text-xl font-black select-none uppercase font-sans">
                                {activePet?.name ? activePet.name[0] : '🐾'}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-foreground dark:text-white font-black text-sm uppercase tracking-tight truncate leading-none">
                            {activePet?.name || 'Dostun'}
                        </h4>
                        <p className="text-[10px] font-bold text-gray-400 truncate mt-1.5 uppercase tracking-wider">
                            {activePet?.breed || 'Golden Retriever'}
                        </p>
                        <div className="flex gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] animate-pulse">❤️</span>
                                <span className="text-[9px] font-black text-emerald-400 font-mono">%98 Keyif</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px]">💧</span>
                                <span className="text-[9px] font-black text-blue-400 font-mono">%85 Su</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. STATS + DAILY GOAL - GERÇEK VERİ */}
                <div className="space-y-2.5">
                    {/* Dual progress goals */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-white/80 dark:bg-[#1A1A1A]/80 p-3.5 rounded-2xl border border-card-border dark:border-card-border shadow-sm backdrop-blur-md">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <Footprints className="w-3 h-3 text-orange-500" />
                                    <span className="text-[9px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest">Mesafe</span>
                                </div>
                                <span className="text-[8px] font-black text-orange-500 font-mono">{Math.round(progressPercent)}%</span>
                            </div>
                            <div className="text-base font-black text-foreground dark:text-white leading-none mb-1">
                                {walkData.isActive
                                    ? (walkData.distance >= 1000 ? (walkData.distance / 1000).toFixed(2) : Math.floor(walkData.distance))
                                    : walkStats ? (walkStats.totalDistanceKm ?? 0).toFixed(1) : '0'
                                }
                                <span className="text-[9px] font-normal text-gray-400 dark:text-white/30 ml-0.5">
                                    /{dailyGoal.distance}km
                                </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-[#1A1A1A]/80 p-3.5 rounded-2xl border border-card-border dark:border-card-border shadow-sm backdrop-blur-md">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <Timer className="w-3 h-3 text-indigo-500" />
                                    <span className="text-[9px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest">Süre</span>
                                </div>
                                <span className="text-[8px] font-black text-indigo-500 font-mono">{Math.round(durationPercent)}%</span>
                            </div>
                            <div className="text-base font-black text-foreground dark:text-white leading-none mb-1">
                                {Math.floor(walkData.time / 60)}
                                <span className="text-[9px] font-normal text-gray-400 dark:text-white/30 ml-0.5">
                                    /{dailyGoal.duration}dk
                                </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all duration-700"
                                    style={{ width: `${durationPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. GÜNLÜK GÖREVLER — Merkezi Quest Engine */}
                <QuestBentoCard />

                {/* 6. WEEKLY ACTIVITY SUMMARY - GERÇEK VERİ */}
                <div className="bg-white/80 dark:bg-[#1A1A1A]/80 p-4 rounded-2xl shadow-sm border border-card-border dark:border-card-border space-y-3 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-gray-400 dark:text-white/45 uppercase tracking-widest flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-purple-500" /> Son 7 Gün
                        </h4>
                        {walkStats && (
                            <span className="text-[8px] font-black text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                🔥 {walkStats.currentStreak} Gün Seri
                            </span>
                        )}
                    </div>
                    <div className="flex justify-between items-end h-16 pt-2 px-1">
                        {(() => {
                            const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
                            const today = new Date();
                            return days.map((day, i) => {
                                // Son 7 gün için tarih hesapla
                                const targetDate = new Date(today);
                                const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
                                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                                targetDate.setDate(today.getDate() + mondayOffset + i);
                                const dateStr = targetDate.toISOString().split('T')[0];
                                const isToday = dateStr === today.toISOString().split('T')[0];
                                const isFuture = targetDate > today;

                                // O güne ait yürüyüşleri bul
                                const dayWalks = walkHistory.filter(w => {
                                    const wDate = w.started_at || w.ended_at || '';
                                    return wDate.startsWith(dateStr);
                                });
                                const totalMins = dayWalks.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
                                const heightPercent = isFuture ? 0 : Math.min(100, (totalMins / 60) * 100);
                                const hasData = totalMins > 0;

                                return (
                                    <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                                        <div className="w-2 bg-gray-100 dark:bg-white/5 h-12 rounded-full overflow-hidden flex items-end relative">
                                            <div 
                                                className={`w-full rounded-full transition-all duration-1000 ${
                                                    isToday && walkData.isActive
                                                        ? 'bg-gradient-to-t from-emerald-500 to-teal-400 animate-pulse'
                                                        : hasData
                                                        ? 'bg-gradient-to-t from-purple-500 to-indigo-400'
                                                        : 'bg-gray-200/50 dark:bg-white/5'
                                                }`}
                                                style={{ height: isFuture ? '0%' : hasData ? `${heightPercent}%` : '8%' }}
                                            />
                                        </div>
                                        <span className={`text-[8px] font-black uppercase ${
                                            isToday ? 'text-purple-500 dark:text-purple-400' : 'text-gray-400 dark:text-white/30'
                                        }`}>{day}</span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                    {walkStats && (
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-card-border/50 dark:border-white/[0.03]">
                            <div className="text-center">
                                <div className="text-[10px] font-black text-foreground dark:text-white">{(walkStats.totalDistanceKm ?? 0).toFixed(1)} km</div>
                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Toplam</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[10px] font-black text-foreground dark:text-white">{(walkStats.longestWalkKm ?? 0).toFixed(1)} km</div>
                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">En Uzun</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[10px] font-black text-foreground dark:text-white">{walkStats.bestStreak} gün</div>
                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">En İyi Seri</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 7. LEADERBOARD TEASER */}
                <div
                    onClick={() => router.push('/walk/leaderboard')}
                    className="bg-gradient-to-r from-[#240b36] to-[#c31432] p-3.5 rounded-2xl relative overflow-hidden shadow-lg shadow-red-900/10 cursor-pointer group"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-card-border">
                                <Trophy className="w-5 h-5 text-yellow-400 fill-current" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-sm leading-tight uppercase italic">Global Arena</h3>
                                <div className="text-white/80 text-[10px] font-bold">Sıralaman: <span className="text-yellow-300 text-xs">#6</span></div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="bg-white/10 px-2 py-0.5 rounded text-[8px] text-white font-bold h-min whitespace-nowrap mb-1">
                                Gümüş Lig
                            </div>
                        </div>
                    </div>
                </div>

                {/* 8. DISCOVERY MAP (Interactive Preview) */}
                <div 
                    onClick={() => {
                        if (walkData.isActive) {
                            router.push('/walk/tracking');
                        }
                    }}
                    className={cn(
                        "relative w-full h-[230px] rounded-2xl overflow-hidden shadow-lg border border-card-border/50 dark:border-card-border group transition-all",
                        walkData.isActive ? "cursor-pointer hover:border-purple-500/50 hover:shadow-purple-500/5" : ""
                    )}
                >
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

                    <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-3">
                        <div className="bg-black/25 backdrop-blur-md p-3.5 rounded-2xl border border-card-border/50 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-white font-black text-base mb-0.5 tracking-tight uppercase italic leading-none">
                                    {walkData.isActive ? 'Yürüyüş Aktif' : 'Keşfe Çık'}
                                </h2>
                                <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest leading-normal mt-1.5">
                                    {walkData.isActive ? 'Haritayı görmek için tıklayın...' : 'Çevredeki parkları, kafeleri keşfet ve ödülleri topla.'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (walkData.isActive) {
                                    stopWalk();
                                } else {
                                    startWalk();
                                    router.push('/walk/tracking');
                                }
                            }}
                            className={cn(
                                "w-full h-12 rounded-xl font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 group overflow-hidden text-xs",
                                walkData.isActive ? "bg-red-500 text-white" : "bg-card text-black"
                            )}
                        >
                            {walkData.isActive ? (
                                <><Square className="w-4 h-4 fill-current" /> Yürüyüşü Bitir</>
                            ) : (
                                <><Play className="w-4 h-4 fill-current" /> Yürüyüşü Başlat</>
                            )}
                        </button>
                    </div>
                </div>

                {/* 9. NEARBY DEALS (GAMIFICATION) */}
                <div className="pb-8">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="font-black text-foreground dark:text-white text-base flex items-center gap-2">
                            <Cookie className="w-4.5 h-4.5 text-orange-500" /> Yakındaki Fırsatlar
                        </h3>
                        <button className="text-xs font-bold text-[#5B4D9D] dark:text-purple-400">Tümü</button>
                    </div>
                    <WalkDeals />
                </div>
            </main>
        </div>
    );
}
