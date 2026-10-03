"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Clock, ChevronRight, Route, PawPrint, MapPin, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useActivity } from "@/context/ActivityContext";
import { usePet } from "@/context/PetContext";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { haptics, sensors, geolocation } from "@/native";
import { formatKm, formatClock } from "@/lib/walkMetrics";
import { PrimaryButton, SoftButton } from "@/components/walk/WalkUI";

interface WalkQuickSheetProps {
    isOpen: boolean;
    onClose: () => void;
    // Navigasyon yapan aksiyonlar paneli hemen kapatmaz; yeni sayfa boyanınca DynamicNavigation kapatır
    // (eski sayfanın bir an görünmesini önler).
    onNavigateAway?: () => void;
    petId?: string;
}

// Ekran 2 (Yürüyüşe Hazırlık). Hedef satırı uygulamanın tek günlük hedefini (QuestEngine) değiştirir:
// takip ekranı ve ana sayfa kartı aynı değeri gösterir.
export function WalkQuickSheet({ isOpen, onClose, onNavigateAway }: WalkQuickSheetProps) {
    const router = useRouter();
    const { walkHistory, startWalk, recoverableWalk, continueRecoveredWalk, discardRecoveredWalk, enterReadyPhase, exitToIdlePhase } = useActivity();
    const { activePet, pets, switchPet } = usePet();
    const { dailyGoal, autoDailyGoalKm, manualDailyGoalKm, setManualDailyGoalKm } = useQuestEngine();
    const [goalOpen, setGoalOpen] = React.useState(false);
    const [starting, setStarting] = React.useState(false);
    const [resolving, setResolving] = React.useState(false);
    const [geoPermission, setGeoPermission] = React.useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

    React.useEffect(() => {
        if (!isOpen) return;
        return geolocation.watchPermission(setGeoPermission);
    }, [isOpen]);

    React.useEffect(() => {
        if (isOpen) enterReadyPhase();
        else { exitToIdlePhase(); setGoalOpen(false); setStarting(false); }
    }, [isOpen, enterReadyPhase, exitToIdlePhase]);

    // Tahmini süre: kullanıcının gerçek ortalama temposu (dk/km); geçmiş yoksa ortalama köpek yürüyüşü (14 dk/km).
    const estimate = React.useMemo(() => {
        const km = walkHistory.reduce((s, w) => s + w.distanceKm, 0);
        const min = walkHistory.reduce((s, w) => s + w.activeSeconds / 60, 0);
        const pace = km > 0.5 && min > 0 ? Math.min(30, Math.max(8, min / km)) : 14;
        const mid = pace * dailyGoal.distance;
        const low = Math.max(5, Math.round((mid * 0.85) / 5) * 5);
        const high = Math.max(low + 5, Math.round((mid * 1.15) / 5) * 5);
        return `${low}-${high} dk`;
    }, [walkHistory, dailyGoal.distance]);

    const adjustGoal = (delta: number) => {
        haptics.tap();
        const base = manualDailyGoalKm ?? autoDailyGoalKm;
        setManualDailyGoalKm(Math.max(0.5, Math.min(20, Math.round((base + delta) * 2) / 2)));
    };

    const cyclePet = () => {
        if (pets.length <= 1) return;
        haptics.tap();
        const idx = pets.findIndex(p => p.id === activePet?.id);
        const next = pets[(idx + 1) % pets.length];
        if (next) switchPet(next.id);
    };

    const handleStart = async () => {
        if (starting) return;
        setStarting(true);
        // iOS: hareket sensörü izni dokunuşla aynı çağrı zincirinde istenmeli.
        await sensors.requestPermission();
        haptics.success();
        startWalk();
        onNavigateAway?.();
        router.push('/walk/tracking');
    };

    const handleContinueRecovered = async () => {
        haptics.tap();
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
                    <header className="px-4 pt-4 pb-2 grid grid-cols-[44px_1fr_44px] items-center shrink-0">
                        <span />
                        <h2 className="text-center text-[17px] font-extrabold">Yürüyüşe Hazırlık</h2>
                        <button type="button" onClick={onClose} aria-label="Kapat" className="w-11 h-11 rounded-full flex items-center justify-center">
                            <X className="w-6 h-6" />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
                        {recoverableWalk ? (
                            <div className="px-6 pt-10 flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-4xl mb-5">🐾</div>
                                <h3 className="text-[21px] font-extrabold mb-1.5">Yarım kalmış bir yürüyüş var</h3>
                                <p className="text-[13px] text-secondary mb-7">Uygulama kapanmadan önce başlamış bir yürüyüşün kaldı. Devam edelim mi, yoksa burada mı bitirelim?</p>
                                <div className="w-full bg-card border border-card-border rounded-3xl py-4 grid grid-cols-2 divide-x divide-card-border mb-7">
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
                                <div className="relative h-60 mx-4 rounded-[28px] overflow-hidden bg-accent/10">
                                    {petImage
                                        ? <img src={petImage} alt={activePet?.name} className="w-full h-full object-cover" />
                                        : <img src="/images/walk-normal.jpg" alt="" className="w-full h-full object-cover" />}
                                </div>

                                <div className="mx-4 -mt-10 relative bg-card rounded-[28px] border border-card-border shadow-moffi-card px-5 pt-5 pb-4">
                                    <h3 className="text-[22px] font-extrabold text-center">{activePet?.name || 'Dostun'} ile Yürüyüş</h3>
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center shrink-0"><Target className="w-5 h-5 text-emerald-600" /></span>
                                            <div><div className="text-[17px] font-extrabold leading-tight">{formatKm(dailyGoal.distance, 1)} km</div><div className="text-[11.5px] text-secondary font-semibold">Bugünkü hedef</div></div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-accent" /></span>
                                            <div><div className="text-[17px] font-extrabold leading-tight">{estimate}</div><div className="text-[11.5px] text-secondary font-semibold">Tahmini süre</div></div>
                                        </div>
                                    </div>
                                </div>

                                <div className={cn("mx-4 mt-4 rounded-3xl px-4 py-3.5 flex items-start gap-3", geoPermission === 'denied' ? "bg-red-50" : "bg-accent/10")}>
                                    <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-white" /></span>
                                    <div className="flex-1">
                                        {geoPermission === 'denied' ? (
                                            <>
                                                <div className="text-[13.5px] font-bold text-red-700">Konum izni kapalı</div>
                                                <div className="text-[12px] text-red-700/80 mt-0.5">Mesafe ve rota için Moffi'ye konum izni vermen gerekiyor.</div>
                                                <button type="button" onClick={() => geolocation.openSettings()} className="mt-2 text-[12px] font-extrabold text-red-700 underline">Ayarları aç</button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-[13.5px] font-bold">GPS konumun yürüyüş sırasında kullanılacak.</div>
                                                <div className="text-[12px] text-secondary mt-0.5">Mesafe, rota ve aktivite verilerini hesaplamak için gerekli.</div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <h4 className="mx-5 mt-6 mb-2.5 text-[16px] font-extrabold">Yürüyüş Ayarları</h4>
                                <div className="mx-4 bg-card rounded-3xl border border-card-border divide-y divide-card-border overflow-hidden">
                                    <div>
                                        <button type="button" onClick={() => { haptics.tap(); setGoalOpen(v => !v); }} className="w-full px-4 py-4 flex items-center gap-3 text-left">
                                            <Target className="w-5 h-5 text-foreground shrink-0" />
                                            <span className="flex-1 text-[14px] font-bold">Hedef</span>
                                            <span className="text-[14px] font-bold text-secondary">{formatKm(dailyGoal.distance, 1)} km</span>
                                            <ChevronRight className={cn("w-4 h-4 text-secondary transition-transform", goalOpen && "rotate-90")} />
                                        </button>
                                        <AnimatePresence initial={false}>
                                            {goalOpen && (
                                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                    <div className="px-4 pb-4 flex items-center gap-3">
                                                        <button type="button" onClick={() => adjustGoal(-0.5)} className="w-10 h-10 rounded-full bg-black/5 text-[20px] font-bold">−</button>
                                                        <span className="flex-1 text-center text-[18px] font-extrabold">{formatKm(dailyGoal.distance, 1)} km</span>
                                                        <button type="button" onClick={() => adjustGoal(0.5)} className="w-10 h-10 rounded-full bg-accent text-white text-[20px] font-bold">+</button>
                                                        <button type="button" onClick={() => { haptics.tap(); setManualDailyGoalKm(null); }} className={cn("h-10 px-3 rounded-full text-[12px] font-bold", manualDailyGoalKm === null ? "bg-foreground text-background" : "bg-black/5 text-secondary")}>Otomatik</button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <button type="button" onClick={cyclePet} disabled={pets.length <= 1} className="w-full px-4 py-4 flex items-center gap-3 text-left disabled:cursor-default">
                                        <PawPrint className="w-5 h-5 text-foreground shrink-0" />
                                        <span className="flex-1 text-[14px] font-bold">Pet</span>
                                        <span className="text-[14px] font-bold text-secondary">{activePet?.name || '—'}</span>
                                        {pets.length > 1 && <ChevronRight className="w-4 h-4 text-secondary" />}
                                    </button>
                                    <div className="w-full px-4 py-4 flex items-center gap-3">
                                        <Route className="w-5 h-5 text-foreground shrink-0" />
                                        <span className="flex-1 text-[14px] font-bold">Rota türü</span>
                                        <span className="text-[14px] font-bold text-secondary">Serbest yürüyüş</span>
                                    </div>
                                </div>

                                <div className="mx-4 mt-6 space-y-2.5">
                                    <PrimaryButton onClick={handleStart} disabled={starting || geoPermission === 'denied'}>
                                        {starting ? 'Başlatılıyor...' : 'Yürüyüşe Başla'}
                                    </PrimaryButton>
                                    <button
                                        type="button"
                                        onClick={() => { haptics.tap(); onNavigateAway?.(); router.push('/walk'); }}
                                        className="w-full py-3 text-[13px] font-bold text-secondary"
                                    >
                                        Yürüyüş istatistiklerim
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
