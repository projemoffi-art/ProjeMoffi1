"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Target, Clock, Play, MapPin, Check, Cloud, CloudLightning, CloudRain, CloudSun, Snowflake, Sun,
    ThermometerSun, History, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useActivity } from "@/context/ActivityContext";
import { usePet } from "@/context/PetContext";
import { useDailyProgress } from '@/context/DailyProgressContext';
import { haptics, sensors, geolocation } from "@/native";
import { formatKm, formatClock, formatMinutes } from "@/lib/walkMetrics";
import { useWeather, isHotForPaws } from "@/context/WeatherContext";
import { PrimaryButton, SoftButton } from "@/components/walk/WalkUI";
import { audioCues } from "@/lib/audioCues";

interface WalkQuickSheetProps {
    isOpen: boolean;
    onClose: () => void;
    // Navigasyon yapan aksiyonlar paneli hemen kapatmaz; yeni sayfa boyanınca DynamicNavigation kapatır
    // (eski sayfanın bir an görünmesini önler).
    onNavigateAway?: () => void;
    petId?: string;
}

const WEATHER_ICON: Record<string, typeof Sun> = { Sun, CloudSun, Cloud, CloudRain, Snowflake, CloudLightning };

// Hazırlık listesi: yalnızca hatırlatma (yürüyüşü engellemez). İşaretler bu cihazda o gün için tutulur.
const CHECKLIST = [
    { id: 'leash', label: 'Tasma' },
    { id: 'bags', label: 'Poşet' },
    { id: 'water', label: 'Su' },
    { id: 'treats', label: 'Ödül' },
];
const checklistKey = () => { const d = new Date(); return `moffi_walk_checklist_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

function relativeDay(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date();
    const diff = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000);
    if (diff <= 0) return 'Bugün';
    if (diff === 1) return 'Dün';
    if (diff < 7) return `${diff} gün önce`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

// Ekran 2 (Yürüyüşe Hazırlık). Hedef satırı uygulamanın tek günlük hedefini (DailyProgressContext → sunucu, pets.walk_goal_km) değiştirir:
// takip ekranı ve ana sayfa kartı aynı değeri gösterir.
export function WalkQuickSheet({ isOpen, onClose, onNavigateAway }: WalkQuickSheetProps) {
    const router = useRouter();
    const { walkHistory, walkStats, startWalk, recoverableWalk, continueRecoveredWalk, discardRecoveredWalk, enterReadyPhase, exitToIdlePhase } = useActivity();
    const { activePet, pets, switchPet } = usePet();
    const { dailyGoal, autoDailyGoalKm, manualDailyGoalKm, setManualDailyGoalKm, todayDistanceKm } = useDailyProgress();
    const [starting, setStarting] = React.useState(false);
    const [resolving, setResolving] = React.useState(false);
    const [geoPermission, setGeoPermission] = React.useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
    const [checked, setChecked] = React.useState<string[]>([]);
    const { weather, isLoading: weatherLoading, permissionDenied, requestPrecise } = useWeather();

    React.useEffect(() => {
        if (!isOpen) return;
        return geolocation.watchPermission(setGeoPermission);
    }, [isOpen]);

    React.useEffect(() => {
        if (isOpen) enterReadyPhase();
        else { exitToIdlePhase(); setStarting(false); }
    }, [isOpen, enterReadyPhase, exitToIdlePhase]);

    React.useEffect(() => {
        if (!isOpen) return;
        try { setChecked(JSON.parse(localStorage.getItem(checklistKey()) || '[]')); } catch { setChecked([]); }
    }, [isOpen]);

    const toggleCheck = (id: string) => {
        haptics.tap();
        const next = checked.includes(id) ? checked.filter(x => x !== id) : [...checked, id];
        setChecked(next);
        try { localStorage.setItem(checklistKey(), JSON.stringify(next)); } catch { /* gizli sekme */ }
    };

    // Tahmini süre: kullanıcının gerçek ortalama temposu (dk/km); geçmiş yoksa ortalama köpek yürüyüşü (14 dk/km).
    const remainingKm = Math.max(0, dailyGoal.distance - todayDistanceKm);
    const plannedKm = remainingKm > 0.05 ? remainingKm : dailyGoal.distance;
    const estimate = React.useMemo(() => {
        const km = walkHistory.reduce((s, w) => s + w.distanceKm, 0);
        const min = walkHistory.reduce((s, w) => s + w.activeSeconds / 60, 0);
        const pace = km > 0.5 && min > 0 ? Math.min(30, Math.max(8, min / km)) : 14;
        const mid = pace * plannedKm;
        const low = Math.max(5, Math.round((mid * 0.85) / 5) * 5);
        const high = Math.max(low + 5, Math.round((mid * 1.15) / 5) * 5);
        return `${low}-${high} dk`;
    }, [walkHistory, plannedKm]);

    const lastWalk = walkHistory[0];

    const adjustGoal = (delta: number) => {
        haptics.tap();
        const base = manualDailyGoalKm ?? autoDailyGoalKm;
        setManualDailyGoalKm(Math.max(0.5, Math.min(20, Math.round((base + delta) * 2) / 2)));
    };

    const handleStart = async () => {
        if (starting) return;
        setStarting(true);
        // iOS: hareket sensörü izni dokunuşla aynı çağrı zincirinde istenmeli.
        // Ses ve hareket sensörü izni dokunuşla aynı çağrı zincirinde açılmalı (iOS/tarayıcı kuralı).
        audioCues.unlock();
        await sensors.requestPermission();
        haptics.success();
        startWalk();
        onNavigateAway?.();
        router.push('/walk/tracking');
    };

    const handleContinueRecovered = async () => {
        haptics.tap();
        audioCues.unlock();
        await sensors.requestPermission();
        continueRecoveredWalk();
        onNavigateAway?.();
        router.push('/walk/tracking');
    };

    const handleFinishRecovered = async () => {
        haptics.tap();
        setResolving(true);
        await discardRecoveredWalk();
        setResolving(false);
    };

    const petImage = activePet?.avatar || activePet?.image;
    const WeatherIcon = weather ? WEATHER_ICON[weather.iconKey] || Sun : MapPin;
    const hot = isHotForPaws(weather);
    const streak = walkStats?.currentStreak || 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 32, stiffness: 260 }}
                    className="theme-vet fixed inset-0 z-50 bg-background text-foreground flex flex-col overflow-hidden"
                >
                    <header className="px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-2 grid grid-cols-[44px_1fr_44px] items-center shrink-0">
                        <span />
                        <h2 className="text-center text-[17px] font-extrabold">Yürüyüşe Hazırlık</h2>
                        <button type="button" onClick={onClose} aria-label="Kapat" className="w-11 h-11 rounded-full flex items-center justify-center active:bg-foreground/5">
                            <X className="w-6 h-6" />
                        </button>
                    </header>

                    {recoverableWalk ? (
                        <div className="flex-1 overflow-y-auto px-6 pt-10 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-4xl mb-5">🐾</div>
                            <h3 className="text-[21px] font-extrabold mb-1.5">Yarım kalmış bir yürüyüş var</h3>
                            <p className="text-[13px] text-secondary mb-7">Uygulama kapanmadan önce başlamış bir yürüyüşün kaldı. Devam edelim mi, yoksa burada mı bitirelim?</p>
                            <div className="w-full card-premium rounded-3xl py-4 grid grid-cols-2 divide-x divide-card-border mb-7">
                                <div><div className="text-[22px] font-extrabold">{formatKm(recoverableWalk.distance / 1000)}<span className="text-[13px] ml-1">km</span></div><div className="text-[11px] text-secondary font-semibold">Mesafe</div></div>
                                <div><div className="text-[22px] font-extrabold">{formatClock(recoverableWalk.time)}</div><div className="text-[11px] text-secondary font-semibold">Süre</div></div>
                            </div>
                            <div className="w-full space-y-2.5">
                                <PrimaryButton onClick={handleContinueRecovered}><Play className="w-4 h-4 fill-current" /> Devam Et</PrimaryButton>
                                <SoftButton onClick={handleFinishRecovered} disabled={resolving}>{resolving ? 'Kaydediliyor...' : 'Burada Bitir'}</SoftButton>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                                {/* Kapak */}
                                <div className="relative h-40 mx-4 rounded-[28px] overflow-hidden bg-accent/10">
                                    <img src={petImage || '/images/walk-normal.jpg'} alt={activePet?.name || ''} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                                        <div>
                                            <p className="text-[12.5px] font-bold text-white/80">Bugün</p>
                                            <p className="text-[22px] font-extrabold leading-tight">{activePet?.name || 'Dostun'} ile yürüyüş</p>
                                        </div>
                                        {streak > 0 && (
                                            <span className="glass-photo rounded-full px-2.5 py-1 flex items-center gap-1 text-[12.5px] font-extrabold">
                                                <Flame className="w-4 h-4 text-[#FFB14A]" fill="#FF8A3D" strokeWidth={1.5} /> {streak} gün
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Kim yürüyor */}
                                {pets.length > 1 && (
                                    <div className="mx-4 mt-4">
                                        <p className="text-[13px] font-extrabold mb-2 px-1">Kim yürüyor?</p>
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                            {pets.map(p => {
                                                const active = p.id === activePet?.id;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => { haptics.tap(); switchPet(p.id); }}
                                                        className={cn('shrink-0 flex items-center gap-2 rounded-full pl-1 pr-3.5 py-1 border text-[13.5px] font-bold transition-colors', active ? 'border-accent bg-accent/10 text-accent' : 'card-premium')}
                                                    >
                                                        {p.image || p.avatar
                                                            ? <img src={p.image || p.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                            : <span className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center">{p.name.charAt(0)}</span>}
                                                        {p.name}
                                                        {active && <Check className="w-4 h-4" strokeWidth={3} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Hedef + tahmini süre */}
                                <div className="mx-4 mt-4 card-premium rounded-[24px] p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-[14px] font-extrabold"><Target className="w-5 h-5 text-[#5C9B2E]" /> Günlük hedef</span>
                                        <button type="button" onClick={() => { haptics.tap(); setManualDailyGoalKm(null); }} className={cn("h-8 px-3 rounded-full text-[12px] font-bold", manualDailyGoalKm === null ? "bg-foreground text-background" : "bg-foreground/[0.06] text-secondary")}>Otomatik</button>
                                    </div>
                                    <div className="mt-3 flex items-center gap-3">
                                        <button type="button" aria-label="Hedefi azalt" onClick={() => adjustGoal(-0.5)} className="w-11 h-11 rounded-full bg-foreground/[0.06] text-[22px] font-bold active:scale-95">−</button>
                                        <span className="flex-1 text-center text-[26px] font-extrabold">{formatKm(dailyGoal.distance, 1)} <span className="text-[15px] text-secondary">km</span></span>
                                        <button type="button" aria-label="Hedefi artır" onClick={() => adjustGoal(0.5)} className="w-11 h-11 rounded-full bg-accent text-white text-[22px] font-bold active:scale-95">+</button>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-card-border flex flex-col gap-1 text-[13px] font-semibold text-secondary">
                                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-accent" /> Tahmini {estimate}</span>
                                        <span>{todayDistanceKm > 0.05 ? `Bugün ${formatKm(todayDistanceKm, 1)} km yürüdün` : 'Bugün henüz yürümedin'}</span>
                                    </div>
                                </div>

                                {/* Hava ve pati güvenliği */}
                                <button
                                    type="button"
                                    onClick={() => { if (weather) window.dispatchEvent(new CustomEvent('open-weather-detail')); else if (!permissionDenied) requestPrecise(); }}
                                    className={cn('mx-4 mt-3 w-[calc(100%-2rem)] rounded-[24px] p-4 flex items-center gap-3 text-left', hot ? 'bg-[#E0623F]/12 border border-[#E0623F]/30' : 'card-premium')}
                                >
                                    <span className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: hot ? 'linear-gradient(160deg,#F28A5B,#D9432F)' : 'linear-gradient(160deg,#F7C66B,#E8A33D)' }}>
                                        {hot ? <ThermometerSun className="w-6 h-6 text-white" /> : <WeatherIcon className="w-6 h-6 text-white" />}
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        {weather ? (
                                            <>
                                                <span className="block text-[15px] font-extrabold">{weather.temp}° · {weather.condition}</span>
                                                <span className="block text-[12.5px] font-semibold text-secondary leading-snug">{weather.advice}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="block text-[14px] font-extrabold">
                                                    {weatherLoading ? 'Hava durumu alınıyor…' : permissionDenied ? 'Konum izni kapalı' : 'Hava durumunu göster'}
                                                </span>
                                                <span className="block text-[12.5px] font-semibold text-secondary leading-snug">Sıcak zeminde patileri korumak için hava durumuna bakılır.</span>
                                            </>
                                        )}
                                    </span>
                                </button>

                                {/* Hazırlık listesi */}
                                <div className="mx-4 mt-3 card-premium rounded-[24px] p-4">
                                    <p className="text-[14px] font-extrabold">Yanına aldın mı?</p>
                                    <div className="mt-2.5 grid grid-cols-4 gap-2">
                                        {CHECKLIST.map(c => {
                                            const on = checked.includes(c.id);
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    aria-pressed={on}
                                                    onClick={() => toggleCheck(c.id)}
                                                    className={cn('h-11 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-1 transition-colors', on ? 'bg-[#8FD14F] text-[#1D2B0E]' : 'bg-foreground/[0.06] text-foreground')}
                                                >
                                                    {on && <Check className="w-4 h-4" strokeWidth={3} />}{c.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Son yürüyüş + bu hafta */}
                                <button
                                    type="button"
                                    onClick={() => { haptics.tap(); onNavigateAway?.(); router.push(lastWalk ? '/walk/history' : '/walk'); }}
                                    className="mx-4 mt-3 w-[calc(100%-2rem)] card-premium rounded-[24px] p-4 grid grid-cols-2 divide-x divide-card-border text-left"
                                >
                                    <span className="pr-3">
                                        <span className="flex items-center gap-1.5 text-[12px] font-bold text-secondary"><History className="w-4 h-4" /> Son yürüyüş</span>
                                        <span className="block text-[15px] font-extrabold mt-0.5">{lastWalk ? `${formatKm(lastWalk.distanceKm, 1)} km` : '—'}</span>
                                        <span className="block text-[12px] font-semibold text-secondary">{lastWalk ? `${relativeDay(lastWalk.ended_at || lastWalk.started_at)} · ${formatMinutes(lastWalk.activeSeconds / 60)}` : 'Henüz yok'}</span>
                                    </span>
                                    <LastSevenDays walks={walkHistory} />
                                </button>

                                {geoPermission === 'denied' && (
                                    <div className="mx-4 mt-3 rounded-[24px] px-4 py-3.5 flex items-start gap-3 bg-emergency/10 border border-emergency/25">
                                        <MapPin className="w-5 h-5 text-emergency shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="text-[13.5px] font-extrabold text-emergency">Konum izni kapalı</div>
                                            <div className="text-[12.5px] text-secondary mt-0.5">Mesafe ve rota için Moffi&apos;ye konum izni vermen gerekiyor.</div>
                                            <button type="button" onClick={() => geolocation.openSettings()} className="mt-2 text-[12.5px] font-extrabold text-emergency underline">Ayarları aç</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sabit başlat düğmesi */}
                            <div className="shrink-0 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] border-t border-card-border bg-background/95 backdrop-blur">
                                <PrimaryButton onClick={handleStart} disabled={starting || geoPermission === 'denied'}>
                                    <Play className="w-4 h-4 fill-current" /> {starting ? 'Başlatılıyor...' : 'Yürüyüşe Başla'}
                                </PrimaryButton>
                                {geoPermission !== 'denied' && <p className="text-center text-[11.5px] font-semibold text-secondary mt-2">Mesafe ve rota için yürüyüş boyunca konumun kullanılır.</p>}
                            </div>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** Son 7 gün özeti. Panel açıldığında takılır; "şimdi" o an bir kez alınır (render saf kalır). */
function LastSevenDays({ walks }: { walks: { ended_at?: string | null; started_at?: string | null; distanceKm: number }[] }) {
    const [now] = React.useState(() => Date.now());
    const week = React.useMemo(() => {
        const since = now - 7 * 86_400_000;
        const list = walks.filter(w => new Date(w.ended_at || w.started_at || 0).getTime() >= since);
        return { count: list.length, km: list.reduce((sum, w) => sum + w.distanceKm, 0) };
    }, [walks, now]);
    return (
        <span className="pl-3">
            <span className="block text-[12px] font-bold text-secondary">Son 7 gün</span>
            <span className="block text-[15px] font-extrabold mt-0.5">{formatKm(week.km, 1)} km</span>
            <span className="block text-[12px] font-semibold text-secondary">{week.count} yürüyüş</span>
        </span>
    );
}
