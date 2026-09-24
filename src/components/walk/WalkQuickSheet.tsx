"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Timer,
    Footprints, ArrowRight, Play,
    Activity, Square,
    Zap, AlertTriangle, Pause,
    Target, Clock, ChevronRight, Route, PawPrint
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useActivity } from "@/context/ActivityContext";
import { usePet } from "@/context/PetContext";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { WALK_ISSUE_LABELS } from "@/lib/walkIssueLabels";
import { haptics } from "@/lib/haptics";

interface WalkQuickSheetProps {
    isOpen: boolean;
    onClose: () => void;
    // KÖK NEDEN DÜZELTMESİ ("Yürüyüşe Başla"ya basınca panel kapanıp bir an
    // altındaki sayfa görünen, sert iki-adımlı geçiş hatası): navigasyon
    // tetikleyen aksiyonlar (Başla/Devam Et/Bitir) artık `onClose()` YERİNE
    // bunu çağırıyor — SADECE history temizliğini senkron yapıyor, paneli
    // HEMEN kapatmıyor. Panel görsel olarak DynamicNavigation'daki bir
    // pathname-izleme efekti tarafından, yeni sayfa GERÇEKTEN boyandıktan
    // sonra kapatılıyor — böylece kapanış animasyonu eski sayfayı değil
    // zaten hazır olan yeni sayfayı açığa çıkarıyor.
    onNavigateAway?: () => void;
    petId?: string;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export function WalkQuickSheet({ isOpen, onClose, onNavigateAway }: WalkQuickSheetProps) {
    const router = useRouter();
    const {
        walkData, walkStats, startWalk, pauseWalk, resumeWalk,
        walkPhase, walkIssue, recoverableWalk,
        continueRecoveredWalk, discardRecoveredWalk,
        enterReadyPhase, exitToIdlePhase
    } = useActivity();
    const { activePet, pets, switchPet } = usePet();
    const { dailyGoal, todayEarned } = useQuestEngine();

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

    // Faz "Yürüyüşe Hazırlık" yeniden inşası (bkz. design-reference/walk-final/,
    // ekran 2): poşet/su/tasma kontrol listesi (işlevsiz bir hatırlatmaydı)
    // KALDIRILDI, yerine referanstaki gerçek "Yürüyüş Ayarları" (Hedef/Pet/Rota
    // türü) geldi. "Hedef" satırı, daha önce hiçbir UI'dan hiç tetiklenmeyen
    // (tamamen ölü) `customTargetKm`/`isCustomTargetEnabled` state'ini artık
    // gerçekten kullanıyor - dokununca gerçek bir hedef listesinde döngüye giriyor.
    const TARGET_PRESETS_KM = [1, 2, 3, 5, 8, 10];
    const cycleTarget = () => {
        haptics.tap();
        // Döngü, gizli/senkronize olmayan `customTargetKm` taban değerinden değil,
        // O AN EKRANDA GÖSTERİLEN değerden (targetDistance — henüz özel hedef
        // açılmadıysa adaptif günlük hedef) başlamalı; aksi halde ilk dokunuş
        // ekrandaki sayıyla alakasız bir sıçrama yapabiliyordu (örn. 2,0 km
        // gösterilirken dokununca birden 5,0 km'ye atlamak gibi).
        const current = targetDistance;
        let idx = TARGET_PRESETS_KM.findIndex(v => Math.abs(v - current) < 0.05);
        if (idx === -1) {
            idx = TARGET_PRESETS_KM.reduce((closest, v, i) =>
                Math.abs(v - current) < Math.abs(TARGET_PRESETS_KM[closest] - current) ? i : closest, 0);
        }
        const next = TARGET_PRESETS_KM[(idx + 1) % TARGET_PRESETS_KM.length];
        setCustomTargetKm(next);
        setIsCustomTargetEnabled(true);
    };

    const cyclePet = () => {
        if (pets.length <= 1) return;
        haptics.tap();
        const idx = pets.findIndex(p => p.id === activePet?.id);
        const next = pets[(idx + 1) % pets.length];
        if (next) switchPet(next.id);
    };

    const handleRouteTypeTap = () => {
        haptics.tap();
        window.dispatchEvent(new CustomEvent('moffi-toast', {
            detail: { message: 'Şu an sadece "Serbest Yürüyüş" var — farklı rota türleri yakında geliyor! 🗺️', icon: 'Route' as any, color: 'text-orange-400' }
        }));
    };

    // Tahmini süre - gerçek geçmiş ortalama temposundan (varsa) hesaplanan bir
    // aralık; hiç geçmiş yoksa dürüst, belgelenmiş bir varsayılan tempo (14 dk/km,
    // ortalama bir köpek yürüyüşü) kullanılıyor. Uydurma sabit bir sayı değil.
    const estimatedDurationLabel = React.useMemo(() => {
        const target = isCustomTargetEnabled ? customTargetKm : dailyGoal.distance;
        const hasHistory = walkStats && walkStats.totalWalks > 0 && walkStats.totalDistanceKm > 0 && walkStats.totalDurationMinutes > 0;
        const avgPaceMinPerKm = hasHistory
            ? walkStats.totalDurationMinutes / walkStats.totalDistanceKm
            : 14; // dakika/km - gerçek veri yokken kullanılan belgelenmiş varsayım
        const mid = avgPaceMinPerKm * target;
        const low = Math.max(5, Math.round((mid * 0.8) / 5) * 5);
        const high = Math.max(low + 5, Math.round((mid * 1.2) / 5) * 5);
        return `${low}-${high} dk`;
    }, [customTargetKm, isCustomTargetEnabled, dailyGoal.distance, walkStats]);


    // Yürüyüşü başlat
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
        haptics.success();
        startWalk();
        // KÖK NEDEN DÜZELTMESİ (bkz. WalkQuickSheetProps.onNavigateAway açıklaması):
        // history temizliği YENİ route'a geçmeden ÖNCE senkron çağrılmalı (aksi
        // halde router.push zaten yeni bir history girdisi eklemiş oluyor ve
        // hayalet {modal:'walk'} girdisi temizlenemez) — AMA panel GÖRSEL olarak
        // hemen kapatılmıyor, yeni sayfa gerçekten boyanana kadar açık kalıp
        // sonra DynamicNavigation tarafından kapatılıyor (sert "kapan-aç" yerine
        // tek, yumuşak bir geçiş).
        onNavigateAway?.();
        router.push('/walk/tracking');
    };

    // Helper to format time (MM:SS)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const distKm = walkData.distance / 1000;
    const durationMin = walkData.time / 60;

    // Faz 2/3: başlık rozetini gerçek state machine fazına göre göster (duraklatıldı dahil)
    const phaseLabel = walkPhase === 'completed' ? 'Tamamlandı 🎉'
        : walkPhase === 'paused' ? 'Duraklatıldı'
        : walkPhase === 'active' ? 'Aktif Yürüyüş'
        : 'Hazırlık Paneli';
    const phaseBadgeClass = walkPhase === 'completed' ? 'text-amber-700 bg-amber-100'
        : walkPhase === 'paused' ? 'text-slate-700 bg-slate-200'
        : walkPhase === 'active' ? 'text-emerald-700 bg-emerald-100'
        : 'text-orange-700 bg-orange-100';

    // Hedef mesafe: özel hedef açıksa onu, değilse gerçek/adaptif günlük hedefi (dailyGoal, streak'e göre hesaplanıyor) kullan
    const targetDistance = isCustomTargetEnabled ? customTargetKm : dailyGoal.distance;

    const distPercent = Math.round(Math.min(100, (distKm / Math.max(0.1, targetDistance)) * 100));
    const durPercent = Math.round(Math.min(100, (durationMin / Math.max(1, dailyGoal.duration)) * 100));

    // Ekran 2 (Yürüyüşe Hazırlık) GPS izin bildirimi — gerçek `navigator.permissions`
    // durumunu okuyor, uydurma/sabit bir metin değil. Panel her açıldığında tazeleniyor
    // (kullanıcı ayarlardan izni değiştirip geri dönebilir).
    const [geoPermission, setGeoPermission] = React.useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
    React.useEffect(() => {
        if (!isOpen || typeof navigator === 'undefined' || !('permissions' in navigator)) return;
        let cancelled = false;
        (navigator as any).permissions.query({ name: 'geolocation' as PermissionName })
            .then((status: PermissionStatus) => {
                if (cancelled) return;
                setGeoPermission(status.state as 'granted' | 'denied' | 'prompt');
                status.onchange = () => { if (!cancelled) setGeoPermission(status.state as 'granted' | 'denied' | 'prompt'); };
            })
            .catch(() => { if (!cancelled) setGeoPermission('unknown'); });
        return () => { cancelled = true; };
    }, [isOpen]);

    // Faz 6: yürüyüşü bitirme onayı — "Bitir" tek dokunuşla değil, iki adımlı
    const [showStopConfirm, setShowStopConfirm] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) setShowStopConfirm(false);
    }, [isOpen]);

    // Faz 3: panel açılıp kapanırken state machine'i idle <-> ready arasında geçir
    // (yürüyüş zaten aktif/tamamlanmışsa bu çağrılar no-op kalır, bkz. ActivityContext)
    React.useEffect(() => {
        if (isOpen) {
            enterReadyPhase();
        } else {
            exitToIdlePhase();
        }
    }, [isOpen, enterReadyPhase, exitToIdlePhase]);

    const handleContinueRecovered = () => {
        haptics.tap();
        continueRecoveredWalk();
        onNavigateAway?.();
        router.push('/walk/tracking');
    };

    const handleDiscardRecovered = async () => {
        haptics.tap();
        await discardRecoveredWalk();
    };

    // Faz 6: bitirmeden hemen önce anlık görüntüyü al (stopWalk walkData'yı sıfırlıyor),
    // sonra Ekran 6'daki (design-reference/walk-final/) gerçek "İşleme Ekranı"na
    // yönlendir — stopWalk() çağrısı artık orada yapılıyor, burada değil.
    const handleStopWalk = async () => {
        const parsedWeight = parseFloat(String(activePet?.weight ?? ''));
        const weightKg = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 15;
        const summaryDistanceKm = distKm;
        const summaryDurationSec = walkData.time;
        const summaryCalories = Math.max(0, Math.round(distKm * weightKg));
        const summarySteps = Math.round(walkData.distance * 1.3);
        const params = new URLSearchParams({
            distanceKm: String(summaryDistanceKm),
            durationSec: String(summaryDurationSec),
            calories: String(summaryCalories),
            steps: String(summarySteps),
        });
        onNavigateAway?.();
        router.replace(`/walk/processing?${params.toString()}`);
    };

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
                            <div className="px-4 sm:px-6 pt-4 sm:pt-6 flex items-center justify-between pb-2 z-20 relative shrink-0">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1">Moffi ile Yürüyüş</h2>
                                    <span className={cn(
                                        "text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                                        phaseBadgeClass
                                    )}>
                                        {phaseLabel}
                                    </span>
                                    {todayEarned.pp > 0 && (
                                        <span className="text-[7.5px] sm:text-[8px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full leading-none ml-1.5 sm:ml-2">
                                            +{todayEarned.pp} PP Bugün
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 sm:w-9 sm:h-9 bg-card rounded-full flex items-center justify-center shadow-moffi-card hover:bg-slate-50 dark:bg-white/5 transition-all cursor-pointer border-0"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-450" />
                                </button>
                            </div>

                            {/* ── SCROLLABLE CONTENT ── */}
                            <div className="px-4 sm:px-6 pb-8 pt-4 space-y-4 sm:space-y-5.5 overflow-y-auto no-scrollbar flex-1 z-20">
                            {recoverableWalk ? (
                                /* Faz 2/3: kapanış/çökme sonrası yarım kalmış yürüyüş bulundu — sessizce
                                   devam etmek yerine kullanıcıya soruyoruz (brief madde 52) */
                                <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in-95 duration-500">
                                    <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-4xl mb-5">🐾</div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1">Devam eden bir yürüyüş bulduk</h3>
                                    <p className="text-[11px] font-bold text-slate-400 mb-8 px-4">Uygulama kapanmadan önce yarım kalmış bir yürüyüşün var. Devam mı edelim, yoksa burada mı bitirelim?</p>

                                    <div className="grid grid-cols-2 w-full gap-3 mb-8">
                                        <div className="bg-card rounded-2xl py-4 flex flex-col items-center shadow-moffi-card border border-slate-200/50 dark:border-white/5">
                                            <span className="text-lg font-black text-slate-800 dark:text-white">{(recoverableWalk.distance / 1000).toFixed(2)}</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">KM</span>
                                        </div>
                                        <div className="bg-card rounded-2xl py-4 flex flex-col items-center shadow-moffi-card border border-slate-200/50 dark:border-white/5">
                                            <span className="text-lg font-black text-slate-800 dark:text-white">{formatTime(recoverableWalk.time)}</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Süre</span>
                                        </div>
                                    </div>

                                    <div className="w-full space-y-3">
                                        <button
                                            onClick={handleContinueRecovered}
                                            className="w-full h-14 bg-slate-900 text-white rounded-3xl flex items-center justify-center gap-2 font-black text-[12px] uppercase tracking-[0.15em] cursor-pointer border-0 active:scale-95 transition-all"
                                        >
                                            <Play className="w-4 h-4 fill-current" /> Devam Et
                                        </button>
                                        <button
                                            onClick={handleDiscardRecovered}
                                            className="w-full h-14 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-3xl flex items-center justify-center font-black text-[12px] uppercase tracking-[0.15em] cursor-pointer border-0 active:scale-95 transition-all"
                                        >
                                            Burada Bitir
                                        </button>
                                    </div>
                                </div>
                            ) : (
                            <>
                                {/* APPLE FITNESS STYLE METRICS — sadece aktif/duraklatılmış yürüyüşte
                                    gösterilir; Hazırlık (idle) ekranında henüz 0.00 km gibi yanıltıcı
                                    bir canlı ölçüm gösterilmiyor (bkz. design-reference/walk-final/, ekran 2). */}
                                {walkData.isActive && (
                                <div className={cn(
                                    "flex flex-col items-center justify-center py-6 animate-in fade-in zoom-in-95 duration-500 transition-opacity",
                                    walkData.isPaused && "opacity-50"
                                )}>
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
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Timer className="w-3 h-3 text-orange-500"/> Süre</span>
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
                                )}

                                {/* 10. ACTIONS / SWIPE-TO-START */}
                            <div className="space-y-4 pt-2">
                                {walkData.isActive ? (
                                    <>
                                        {walkIssue !== 'none' && (
                                            <div className="w-full bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-2.5">
                                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                                <span className="text-[10.5px] font-bold text-amber-800 leading-snug">{WALK_ISSUE_LABELS[walkIssue] || WALK_ISSUE_LABELS.error}</span>
                                            </div>
                                        )}
                                        {/* Faz "Bitirme Onayı" (ekran 5, design-reference/walk-final/): artık paneli
                                            aynı yerde değiştiren bir buton takası değil, gerçek dimmed-backdrop'lu
                                            bir modal (aşağıda, AnimatePresence içinde, showStopConfirm state'i ile
                                            kontrol ediliyor) — kapatma X butonu ve arka planı karartma dahil. */}
                                        <div className="flex gap-3">
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => { haptics.tap(); walkData.isPaused ? resumeWalk() : pauseWalk(); }}
                                                className="flex-1 h-14 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-3xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-[0.15em] cursor-pointer border-0"
                                            >
                                                {walkData.isPaused ? (
                                                    <><Play className="w-3.5 h-3.5 fill-current" /> Devam Et</>
                                                ) : (
                                                    <><Pause className="w-3.5 h-3.5 fill-current" /> Duraklat</>
                                                )}
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => { haptics.tap(); setShowStopConfirm(true); }}
                                                className="flex-1 h-14 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-3xl flex items-center justify-center gap-2 shadow-[0_6px_25px_rgba(239,68,68,0.25)] font-black text-[11px] uppercase tracking-[0.15em] cursor-pointer border-0"
                                            >
                                                <Square className="w-3.5 h-3.5 fill-current" /> Bitir
                                            </motion.button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Ekran 2 (Yürüyüşe Hazırlık) yeniden inşası — design-reference/walk-final/
                                            ekran 2 ile birebir: pet fotoğrafı + başlık, iki-istatistik satırı, gerçek
                                            GPS izin bildirimi, gerçek/düzenlenebilir "Yürüyüş Ayarları" satırları.
                                            Eskiden burada işlevsiz poşet/su/tasma kontrol listesi vardı — kaldırıldı. */}
                                        <div className="rounded-3xl overflow-hidden shadow-moffi-card border border-slate-200/50 dark:border-white/5 bg-card">
                                            <div className="h-40 sm:h-44 w-full relative bg-slate-100 dark:bg-white/5">
                                                {activePet?.image ? (
                                                    <img src={activePet.image} alt={activePet.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-5xl">🐾</div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">
                                                    {activePet?.name || 'Dostun'} ile Yürüyüş
                                                </h3>
                                                <div className="grid grid-cols-2 gap-3 mt-3">
                                                    <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-white/5 rounded-2xl px-3 py-2.5">
                                                        <Target className="w-4 h-4 text-orange-500 shrink-0" />
                                                        <div className="min-w-0">
                                                            <span className="text-[12.5px] font-black text-slate-800 dark:text-slate-100 block leading-none mb-0.5">{targetDistance.toFixed(1)} km</span>
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Bugünkü hedef</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-white/5 rounded-2xl px-3 py-2.5">
                                                        <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                                                        <div className="min-w-0">
                                                            <span className="text-[12.5px] font-black text-slate-800 dark:text-slate-100 block leading-none mb-0.5">{estimatedDurationLabel}</span>
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Tahmini süre</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* GPS izin bildirimi — gerçek `navigator.permissions` durumuna göre */}
                                        {geoPermission === 'denied' ? (
                                            <div className="w-full bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-start gap-2.5">
                                                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                                <span className="text-[10.5px] font-bold text-red-800 leading-snug">Konum izni kapalı. Yürüyüşü başlatmadan önce tarayıcı/telefon ayarlarından Moffi için konum iznini açman gerekiyor.</span>
                                            </div>
                                        ) : (
                                            <div className="w-full bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-start gap-2.5">
                                                <Target className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                <span className="text-[10.5px] font-bold text-amber-800 leading-snug">GPS konumunuz yürüyüş sırasında kullanılacaktır. Mesafe, rota ve aktivite verilerini hesaplamak için gereklidir.</span>
                                            </div>
                                        )}

                                        {/* YÜRÜYÜŞ AYARLARI — gerçek, düzenlenebilir 3 satır */}
                                        <div className="bg-card rounded-3xl p-1.5 shadow-moffi-card border border-slate-200/50 dark:border-white/5 divide-y divide-slate-100 dark:divide-white/5">
                                            <div className="px-3 py-1.5">
                                                <span className="text-[9px] font-black text-slate-450 uppercase tracking-[0.2em]">Yürüyüş Ayarları</span>
                                            </div>
                                            <button
                                                onClick={cycleTarget}
                                                className="w-full flex items-center gap-3 px-3 py-3 cursor-pointer border-0 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 transition-all rounded-2xl"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                                    <Target className="w-4 h-4 text-orange-600" />
                                                </div>
                                                <span className="text-[11.5px] font-bold text-slate-600 dark:text-slate-300 flex-1 text-left">Hedef</span>
                                                <span className="text-[11.5px] font-black text-slate-800 dark:text-slate-100">{targetDistance.toFixed(1)} km</span>
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                            </button>
                                            <button
                                                onClick={cyclePet}
                                                disabled={pets.length <= 1}
                                                className="w-full flex items-center gap-3 px-3 py-3 cursor-pointer border-0 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 transition-all rounded-2xl disabled:cursor-default disabled:hover:bg-transparent"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                                    <PawPrint className="w-4 h-4 text-orange-600" />
                                                </div>
                                                <span className="text-[11.5px] font-bold text-slate-600 dark:text-slate-300 flex-1 text-left">Pet</span>
                                                <span className="text-[11.5px] font-black text-slate-800 dark:text-slate-100">{activePet?.name || '—'}</span>
                                                {pets.length > 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                                            </button>
                                            <button
                                                onClick={handleRouteTypeTap}
                                                className="w-full flex items-center gap-3 px-3 py-3 cursor-pointer border-0 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 transition-all rounded-2xl"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                                    <Route className="w-4 h-4 text-orange-600" />
                                                </div>
                                                <span className="text-[11.5px] font-bold text-slate-600 dark:text-slate-300 flex-1 text-left">Rota türü</span>
                                                <span className="text-[11.5px] font-black text-slate-800 dark:text-slate-100">Serbest Yürüyüş</span>
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                            </button>
                                        </div>

                                        {/* TEK DOKUNUŞLA BAŞLA */}
                                        <motion.button
                                            whileTap={{ scale: 0.96 }}
                                            onClick={handleStartWalk}
                                            className="w-full h-16 mt-4 bg-slate-900 text-white rounded-3xl flex items-center justify-center gap-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.15)] border-0 cursor-pointer font-black text-[12px] uppercase tracking-[0.15em]"
                                        >
                                            <Play className="w-4 h-4 fill-current" /> Yürüyüşe Başla
                                        </motion.button>
                                    </div>
                                )}

                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => { haptics.tap(); onNavigateAway?.(); router.push('/walk'); }}
                                    className="w-full bg-card py-3.5 rounded-3xl flex items-center justify-center gap-1.5 group hover:bg-slate-50 dark:bg-white/5 transition-all cursor-pointer shadow-moffi-card border-0"
                                >
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-700 dark:text-slate-200 transition-colors">Yürüyüş İstatistikleri</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-slate-650 transition-all" />
                                </motion.button>
                            </div>
                            </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>

        {/* Ekran 5 (Bitirme Onayı) — design-reference/walk-final/'e göre gerçek bir
            dimmed-backdrop modal: arka plan kararıyor, X ile kapanıyor, "Vazgeç"
            artık ikincil (soluk) buton, "Evet, Bitir" tam genişlik birincil aksiyon. */}
        <AnimatePresence>
            {showStopConfirm && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm flex items-center justify-center px-6"
                    onClick={() => { haptics.tap(); setShowStopConfirm(false); }}
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 6 }}
                        transition={{ type: "spring", damping: 28, stiffness: 320 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-xs bg-card rounded-3xl p-6 shadow-2xl relative border border-slate-200/50 dark:border-white/10"
                    >
                        <button
                            onClick={() => { haptics.tap(); setShowStopConfirm(false); }}
                            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center border-0 cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                            <Pause className="w-6 h-6 text-red-500 fill-current" />
                        </div>
                        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 leading-snug pr-6">Yürüyüşü bitirmek istediğinize emin misiniz?</h3>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl py-3 flex flex-col items-center">
                                <span className="text-sm font-black text-slate-800 dark:text-white">{distKm.toFixed(2)} km</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Mesafe</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl py-3 flex flex-col items-center">
                                <span className="text-sm font-black text-slate-800 dark:text-white">{formatTime(walkData.time)}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Süre</span>
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={handleStopWalk}
                                className="w-full h-13 py-3.5 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-2xl flex items-center justify-center gap-1.5 shadow-[0_6px_20px_rgba(239,68,68,0.3)] font-black text-[11px] uppercase tracking-widest cursor-pointer border-0"
                            >
                                <Square className="w-3.5 h-3.5 fill-current" /> Yürüyüşü Bitir
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => { haptics.tap(); setShowStopConfirm(false); }}
                                className="w-full py-3 text-slate-500 dark:text-slate-400 rounded-2xl flex items-center justify-center font-black text-[11px] uppercase tracking-widest cursor-pointer border-0 bg-transparent"
                            >
                                Devam Et
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        </>
    );
}
