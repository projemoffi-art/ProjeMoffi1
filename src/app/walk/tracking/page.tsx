"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Pause, Play, Settings, Camera, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, showToast } from "@/lib/utils";
import { useActivity } from "@/context/ActivityContext";
import { usePet } from "@/context/PetContext";
import { useWeather } from "@/context/WeatherContext";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { WALK_ISSUE_LABELS } from "@/lib/walkIssueLabels";
import { haptics, share, device } from "@/native";
import { audioCues, TONE_THEMES } from "@/lib/audioCues";
import { apiService } from "@/services/apiService";
import { walkCalories, petWeightKg, formatKm, formatClock } from "@/lib/walkMetrics";
import { WalkHeader, StatRow, PrimaryButton, SoftButton, ProgressBar } from "@/components/walk/WalkUI";

const WalkMap = dynamic(() => import("@/components/walk/WalkMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#EDE7DA]" />,
});

// Pati güvenliği: gerçek hava sıcaklığından basit, dürüst bir çıkarım.
function pawSafetyWarning(temp: number | undefined): string | null {
    if (temp === undefined) return null;
    if (temp >= 28) return 'Asfalt patiler için sıcak olabilir; gölgeli veya çimenli yolları tercih et.';
    if (temp <= 0) return 'Tuzlu/karlı zemin patileri tahriş edebilir; dönüşte patilerini kontrol et.';
    return null;
}

function gpsPill(issue: string) {
    switch (issue) {
        case 'none': return { label: 'GPS İyi', tone: 'good' as const };
        case 'gps_searching': return { label: 'GPS Aranıyor', tone: 'warn' as const };
        case 'gps_weak': return { label: 'GPS Zayıf', tone: 'warn' as const };
        case 'location_lost': return { label: 'GPS Kayıp', tone: 'bad' as const };
        case 'location_permission_required': return { label: 'Konum İzni Yok', tone: 'bad' as const };
        case 'network_unavailable': return { label: 'Çevrimdışı', tone: 'warn' as const };
        case 'background_permission_required': return { label: 'Arka Planda', tone: 'warn' as const };
        default: return { label: 'GPS Hatası', tone: 'bad' as const };
    }
}

const PILL_TONE = {
    good: 'bg-emerald-50 text-emerald-700',
    warn: 'bg-amber-50 text-amber-700',
    bad: 'bg-red-50 text-red-700',
};

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
    return (
        <button type="button" onClick={onChange} className={cn("w-12 h-7 rounded-full relative transition-colors shrink-0", on ? "bg-accent" : "bg-black/10 dark:bg-white/15")}>
            <span className={cn("absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform", on ? "translate-x-5" : "translate-x-0")} />
        </button>
    );
}

function TrackingContent() {
    const router = useRouter();
    const { walkData, pauseWalk, resumeWalk, walkIssue, walkPhase, autoPauseEnabled, setAutoPauseEnabled, stepsSupported } = useActivity();
    const { activePet, pets } = usePet();
    const { weather } = useWeather();
    const { dailyGoal, todayDistanceKm, autoDailyGoalKm, manualDailyGoalKm, setManualDailyGoalKm } = useQuestEngine();

    const walkingPet = pets.find(p => String(p.id) === String(walkData.petId)) || activePet;
    const petName = walkData.petName || walkingPet?.name || 'Dostun';
    const petImage = walkingPet?.avatar || walkingPet?.image || null;

    const [showStopConfirm, setShowStopConfirm] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [screenAwake, setScreenAwake] = useState(false);
    const [audioPrefs, setAudioPrefs] = useState(() => audioCues.getPrefs());
    const updateAudio = (patch: Partial<ReturnType<typeof audioCues.getPrefs>>) => setAudioPrefs(audioCues.setPrefs(patch));
    const goalCuedRef = useRef(false);
    const [walkPhotos, setWalkPhotos] = useState<string[]>([]);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [beaconId, setBeaconId] = useState<string | null>(null);
    const [beaconLoading, setBeaconLoading] = useState(false);
    const prevWasAutoPausedRef = useRef(false);
    const announcedStartRef = useRef(false);
    const lastAnnouncedSplitRef = useRef(0);

    // Harita sadece alttaki kartın üstündeki görünür alanı kaplar: konum işaretçisi kartın altında kalmasın.
    const bottomPanelRef = useRef<HTMLDivElement>(null);
    const [bottomPanelHeight, setBottomPanelHeight] = useState(420);
    useEffect(() => {
        const el = bottomPanelRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setBottomPanelHeight(el.offsetHeight));
        ro.observe(el);
        return () => ro.disconnect();
    }, [walkData.isActive]);

    const position = walkData.path.length ? walkData.path[walkData.path.length - 1] : null;
    const distKm = walkData.distance / 1000;
    const calories = walkCalories(distKm, petWeightKg(walkingPet));
    const remainingKm = Math.max(0, dailyGoal.distance - todayDistanceKm);
    const goalPercent = Math.round(Math.min(100, (todayDistanceKm / Math.max(0.1, dailyGoal.distance)) * 100));
    const fastestSplit = walkData.splits.length ? Math.min(...walkData.splits.map(s => s.splitSeconds)) : null;
    const pill = gpsPill(walkIssue);
    const pawWarning = pawSafetyWarning(weather?.temp);

    // Günlük hedefe bu yürüyüşte ulaşıldığı an bir kez kutlama sesi.
    useEffect(() => {
        if (!walkData.isActive) return;
        if (goalPercent < 100) { goalCuedRef.current = false; return; }
        if (!goalCuedRef.current && walkData.distance > 0) { goalCuedRef.current = true; audioCues.goalReached(); haptics.celebrate(); }
    }, [goalPercent, walkData.isActive, walkData.distance]);

    // Ekranı açık tut
    useEffect(() => {
        if (!screenAwake) return;
        let release: (() => void) | null = null;
        let cancelled = false;
        device.keepScreenAwake().then(r => { if (cancelled) r(); else release = r; });
        return () => { cancelled = true; release?.(); };
    }, [screenAwake]);

    // Sesli anonslar: başlangıç, her km, otomatik duraklama/devam
    useEffect(() => {
        if (walkData.isActive && !announcedStartRef.current && walkData.time <= 2) {
            announcedStartRef.current = true;
            audioCues.walkStarted();
        }
    }, [walkData.isActive, walkData.time]);

    useEffect(() => {
        if (walkData.splits.length > lastAnnouncedSplitRef.current) {
            const latest = walkData.splits[walkData.splits.length - 1];
            audioCues.split(latest.km, latest.splitSeconds);
            lastAnnouncedSplitRef.current = walkData.splits.length;
        }
    }, [walkData.splits]);

    useEffect(() => {
        if (walkData.isAutoPaused && !prevWasAutoPausedRef.current) { audioCues.autoPaused(); haptics.warn(); }
        else if (!walkData.isAutoPaused && prevWasAutoPausedRef.current) { audioCues.autoResumed(); haptics.tap(); }
        prevWasAutoPausedRef.current = walkData.isAutoPaused;
    }, [walkData.isAutoPaused]);

    // Canlı konum paylaşımı: takip ekranı açıkken her yeni konumda güncellenir, ekrandan çıkınca kapanır.
    useEffect(() => {
        if (beaconId && position) apiService.updateBeaconLocation(beaconId, position[0], position[1]).catch(() => {});
    }, [beaconId, position?.[0], position?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => () => { if (beaconId) apiService.stopBeacon(beaconId).catch(() => {}); }, [beaconId]);

    const toggleBeacon = async () => {
        if (beaconLoading) return;
        haptics.tap();
        if (beaconId) {
            setBeaconLoading(true);
            await apiService.stopBeacon(beaconId).catch(() => {});
            setBeaconId(null);
            setBeaconLoading(false);
            showToast('Canlı konum paylaşımı durduruldu.', 'ShieldAlert');
            return;
        }
        if (!walkData.sessionId || !position) {
            showToast('Konumun bulunup yürüyüş kaydedilince paylaşabilirsin.', 'AlertCircle');
            return;
        }
        setBeaconLoading(true);
        try {
            const id = await apiService.startBeacon(walkData.sessionId, petName, position[0], position[1]);
            setBeaconId(id);
            const url = `${window.location.origin}/beacon/${id}`;
            const r = await share.shareOrCopy({ title: 'Canlı Konumum', text: `${petName} ile yürüyorum, canlı konumumu buradan görebilirsin:`, url, copyText: url });
            if (r === 'copied') showToast('Bağlantı kopyalandı. Sadece güvendiğin biriyle paylaş.', 'Share2');
        } catch (err) {
            console.error('Canlı konum başlatılamadı:', err);
            showToast('Canlı konum paylaşımı başlatılamadı.', 'AlertCircle');
        } finally {
            setBeaconLoading(false);
        }
    };

    const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !walkData.sessionId) return;
        setUploadingPhoto(true);
        haptics.tap();
        try {
            const url = await apiService.uploadWalkPhoto(walkData.sessionId, file);
            setWalkPhotos(prev => [...prev, url]);
            showToast('Fotoğraf yürüyüşüne eklendi.', 'Upload');
        } catch (err) {
            console.error('Yürüyüş fotoğrafı yüklenemedi:', err);
            showToast('Fotoğraf yüklenemedi, tekrar dene.', 'AlertCircle');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const adjustDailyGoal = (delta: number) => {
        haptics.tap();
        const base = manualDailyGoalKm ?? autoDailyGoalKm;
        setManualDailyGoalKm(Math.max(0.5, Math.min(20, Math.round((base + delta) * 2) / 2)));
    };

    const handleFinish = () => {
        haptics.success();
        audioCues.walkFinished(distKm);
        if (beaconId) { apiService.stopBeacon(beaconId).catch(() => {}); setBeaconId(null); }
        const params = new URLSearchParams({ sniffStops: String(walkData.sniffStops || 0) });
        if (fastestSplit !== null) params.set('bestSplitSeconds', String(fastestSplit));
        router.replace(`/walk/processing?${params.toString()}`);
    };

    if (!walkData.isActive && walkPhase !== 'completing') {
        return (
            <div className="min-h-[100dvh] flex flex-col">
                <WalkHeader title="Yürüyüş" onBack={() => router.replace('/home')} />
                <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-4xl mb-5">🐾</div>
                    <h2 className="text-lg font-extrabold mb-1.5">Şu an aktif bir yürüyüş yok</h2>
                    <p className="text-[13px] text-secondary mb-8">Yeni bir yürüyüşü hazırlık ekranından başlatabilirsin.</p>
                    <PrimaryButton onClick={() => router.replace('/home?openWalk=true')}>Yürüyüşe Hazırlan</PrimaryButton>
                </div>
            </div>
        );
    }

    const isPaused = walkData.isPaused;

    return (
        <div className="h-[100dvh] w-full relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 z-0" style={{ bottom: Math.max(0, bottomPanelHeight - 28), ['--walkmap-controls-top' as string]: '128px' }}>
                <WalkMap mode="live" path={walkData.path} current={position} petImage={petImage} topInset={140} />
            </div>
            <AnimatePresence>
                {isPaused && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[5] bg-[#1E1A15]/45 pointer-events-none" />
                )}
            </AnimatePresence>

            <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-background via-background/85 to-transparent pb-6">
                <WalkHeader
                    title={`${petName} ile Yürüyüş`}
                    transparent
                    right={
                        <button type="button" onClick={() => { haptics.tap(); setIsSettingsOpen(true); }} aria-label="Ayarlar" className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95">
                            <Settings className="w-[22px] h-[22px] text-foreground" />
                        </button>
                    }
                />
                <div className="px-4 flex flex-wrap gap-2">
                    <span className={cn("h-9 px-3.5 rounded-full text-[12px] font-bold flex items-center gap-1.5", PILL_TONE[pill.tone])}>
                        <span className="w-2 h-2 rounded-full bg-current" /> {pill.label}
                    </span>
                    {weather && (
                        <button type="button" aria-label="Hava durumu detayı" onClick={() => window.dispatchEvent(new CustomEvent('open-weather-detail'))} className="h-9 px-3.5 rounded-full text-[12px] font-bold flex items-center gap-1.5 glass text-foreground active:scale-95 transition-transform">
                            {weather.emoji} {Math.round(weather.temp)}°C
                        </button>
                    )}
                    {beaconId && (
                        <span className="h-9 px-3.5 rounded-full text-[12px] font-bold flex items-center bg-foreground text-background">Konum paylaşılıyor</span>
                    )}
                </div>
                {(walkIssue !== 'none' || pawWarning) && (
                    <div className="px-4 mt-2 space-y-2">
                        {walkIssue !== 'none' && (
                            <div className="rounded-2xl bg-amber-50 text-amber-800 text-[12px] font-semibold px-3.5 py-2.5 border border-amber-100">
                                {WALK_ISSUE_LABELS[walkIssue] || WALK_ISSUE_LABELS.error}
                            </div>
                        )}
                        {pawWarning && (
                            <div className="rounded-2xl glass text-foreground text-[12px] font-semibold px-3.5 py-2.5">🐾 {pawWarning}</div>
                        )}
                    </div>
                )}
            </div>

            <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelected} />

            <div className="absolute inset-x-0 bottom-0 z-20">
                {!isPaused && (
                    <div className="flex justify-end px-4 mb-3">
                        <button
                            type="button"
                            onClick={() => { if (!uploadingPhoto) photoInputRef.current?.click(); }}
                            disabled={uploadingPhoto || !walkData.sessionId}
                            className="relative w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center active:scale-95 disabled:opacity-50"
                            aria-label="Fotoğraf çek"
                        >
                            {uploadingPhoto
                                ? <span className="w-5 h-5 border-2 border-black/15 border-t-[#201B16] rounded-full animate-spin" />
                                : <Camera className="w-5 h-5 text-[#201B16]" />}
                            {walkPhotos.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">{walkPhotos.length}</span>
                            )}
                        </button>
                    </div>
                )}

                <div ref={bottomPanelRef} className="glass rounded-t-[28px] px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))]">
                    {isPaused ? (
                        <div className="flex flex-col items-center text-center mb-5">
                            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                                <Pause className="w-6 h-6 text-accent fill-current" />
                            </div>
                            <h2 className="text-[19px] font-extrabold">{walkData.isAutoPaused ? 'Otomatik Duraklatıldı' : 'Yürüyüş Duraklatıldı'}</h2>
                            <p className="text-[14px] text-secondary font-semibold mt-1">
                                {stepsSupported ? `${walkData.realSteps.toLocaleString('tr-TR')} adım · ` : ''}{formatKm(distKm)} km · {formatClock(walkData.time)}
                            </p>
                            {walkData.isAutoPaused && <p className="text-[12px] text-secondary mt-1">Yürümeye başlayınca kendiliğinden devam eder.</p>}
                        </div>
                    ) : (
                        <>
                            <StatRow
                                size="lg"
                                // Adım öne çıkar (kullanıcıların en çok baktığı ölçü); sensörü olmayan cihazda mesafe.
                                items={stepsSupported && !(distKm > 0.1 && walkData.realSteps === 0) ? [
                                    { value: walkData.realSteps.toLocaleString('tr-TR'), label: 'Adım' },
                                    { value: formatKm(distKm), unit: 'km', label: 'Mesafe' },
                                    { value: formatClock(walkData.time), label: 'Süre' },
                                ] : [
                                    { value: formatKm(distKm), unit: 'km', label: 'Mesafe' },
                                    { value: formatClock(walkData.time), label: 'Süre' },
                                    { value: calories, unit: 'kcal', label: 'Kalori' },
                                ]}
                            />
                            <div className="mt-5 mb-2 flex items-center justify-between text-[12px] font-bold">
                                <span className="text-foreground">{remainingKm > 0 ? `Hedefe kalan ${formatKm(remainingKm)} km` : 'Günlük hedef tamam 🎉'}</span>
                                <span className="text-emerald-600 text-[14px]">%{goalPercent}</span>
                            </div>
                            <ProgressBar percent={goalPercent} />
                            <div className="mt-3 flex items-center gap-3 text-[11.5px] font-semibold text-secondary">
                                <span>{stepsSupported ? `🔥 ${calories} kcal` : '👣 Bu cihazda adım sayılmıyor'}</span>
                                {fastestSplit !== null && <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-accent" /> En hızlı km {formatClock(fastestSplit)}</span>}
                                {!!walkData.sniffStops && <span>👃 {walkData.sniffStops} mola</span>}
                            </div>
                        </>
                    )}

                    <div className="space-y-2.5 mt-5">
                        <PrimaryButton onClick={() => { haptics.tap(); if (isPaused) { resumeWalk(); audioCues.resumed(); } else { pauseWalk(); audioCues.paused(); } }}>
                            {isPaused ? <><Play className="w-4 h-4 fill-current" /> Devam Et</> : <><Pause className="w-4 h-4 fill-current" /> Duraklat</>}
                        </PrimaryButton>
                        <SoftButton onClick={() => { haptics.tap(); setShowStopConfirm(true); }}>Yürüyüşü Bitir</SoftButton>
                    </div>
                </div>
            </div>

            {/* Bitirme onayı (Ekran 5) */}
            <AnimatePresence>
                {showStopConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/45 flex items-end" onClick={() => setShowStopConfirm(false)}>
                        <motion.div
                            initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
                            transition={{ type: "spring", damping: 28, stiffness: 320 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full bg-card rounded-t-[28px] px-6 pt-5 pb-[max(24px,env(safe-area-inset-bottom))]"
                        >
                            <div className="flex justify-end">
                                <button type="button" onClick={() => setShowStopConfirm(false)} aria-label="Kapat" className="w-9 h-9 rounded-full flex items-center justify-center">
                                    <X className="w-5 h-5 text-foreground" />
                                </button>
                            </div>
                            <h3 className="text-[21px] font-extrabold text-center leading-snug px-6 mb-6">Yürüyüşü bitirmek istediğine emin misin?</h3>
                            <div className="mb-7">
                                <StatRow items={[
                                    { value: formatKm(distKm), unit: 'km', label: 'Mesafe' },
                                    { value: formatClock(walkData.time), label: 'Süre' },
                                ]} />
                            </div>
                            <div className="space-y-2.5">
                                <PrimaryButton onClick={handleFinish}>Yürüyüşü Bitir</PrimaryButton>
                                <SoftButton onClick={() => setShowStopConfirm(false)}>Devam Et</SoftButton>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {isSettingsOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/45 flex items-end" onClick={() => setIsSettingsOpen(false)}>
                        <motion.div
                            initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
                            transition={{ type: "spring", damping: 30, stiffness: 320 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full bg-card rounded-t-[28px] px-6 pt-5 pb-[max(24px,env(safe-area-inset-bottom))]"
                        >
                            <div className="w-10 h-1.5 rounded-full bg-black/10 mx-auto mb-5" />
                            <h3 className="text-[17px] font-extrabold mb-3">Yürüyüş Ayarları</h3>

                            <div className="divide-y divide-card-border">
                                <div className="py-3.5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[14px] font-bold">Günlük hedef</span>
                                        <button type="button" onClick={() => { haptics.tap(); setManualDailyGoalKm(null); }} className={cn("text-[11px] font-bold px-3 py-1 rounded-full", manualDailyGoalKm === null ? "bg-accent text-white" : "bg-black/5 text-secondary")}>Otomatik</button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => adjustDailyGoal(-0.5)} className="w-10 h-10 rounded-full bg-black/5 text-[20px] font-bold">−</button>
                                        <span className="flex-1 text-center text-[18px] font-extrabold">{formatKm(dailyGoal.distance, 1)} km</span>
                                        <button type="button" onClick={() => adjustDailyGoal(0.5)} className="w-10 h-10 rounded-full bg-accent text-white text-[20px] font-bold">+</button>
                                    </div>
                                </div>
                                {[
                                    { title: 'Ekranı açık tut', desc: 'Yürüyüş sırasında ekran kararmaz', on: screenAwake, toggle: () => setScreenAwake(v => !v) },
                                    { title: 'Yürüyüş sesleri', desc: 'Başla, duraklat, her km ve hedefte kısa melodiler', on: audioPrefs.tones, toggle: () => updateAudio({ tones: !audioPrefs.tones }) },
                                    { title: 'Sesli anons', desc: 'Kilometre ve tempo, cihazın sesiyle okunur', on: audioPrefs.voice, toggle: () => updateAudio({ voice: !audioPrefs.voice }) },
                                    { title: 'Otomatik duraklatma', desc: 'Durunca yürüyüş kendiliğinden duraklar', on: autoPauseEnabled, toggle: () => setAutoPauseEnabled(!autoPauseEnabled) },
                                    { title: 'Canlı konumu paylaş', desc: 'Bağlantıyı alan kişi konumunu görür (bu ekran açıkken)', on: !!beaconId, toggle: toggleBeacon },
                                ].map(row => (
                                    <div key={row.title} className="py-3.5 flex items-center justify-between gap-4">
                                        <div>
                                            <div className="text-[14px] font-bold">{row.title}</div>
                                            <div className="text-[12px] text-secondary mt-0.5">{row.desc}</div>
                                        </div>
                                        <Toggle on={row.on} onChange={() => { haptics.tap(); row.toggle(); }} />
                                    </div>
                                ))}
                                {audioPrefs.tones && (
                                    <div className="py-3.5">
                                        <div className="text-[14px] font-bold">Ses teması</div>
                                        <div className="text-[12px] text-secondary mt-0.5">Dokununca örneğini dinlersin</div>
                                        <div className="mt-2.5 grid grid-cols-3 gap-2">
                                            {TONE_THEMES.map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => { haptics.tap(); updateAudio({ theme: t.id }); audioCues.preview(t.id); }}
                                                    className={cn('rounded-2xl px-2 py-2.5 text-center border transition-colors', audioPrefs.theme === t.id ? 'border-accent bg-accent/10' : 'border-card-border bg-foreground/[0.03]')}
                                                >
                                                    <div className={cn('text-[13.5px] font-extrabold', audioPrefs.theme === t.id && 'text-accent')}>{t.label}</div>
                                                    <div className="text-[11px] font-semibold text-secondary leading-tight mt-0.5">{t.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <button type="button" onClick={() => { haptics.tap(); device.openExternal('https://open.spotify.com'); }} className="w-full py-3.5 flex items-center justify-between text-left">
                                    <div>
                                        <div className="text-[14px] font-bold">Müzik</div>
                                        <div className="text-[12px] text-secondary mt-0.5">Spotify'ı aç, yürürken dinle</div>
                                    </div>
                                    <span className="text-[12px] font-bold text-accent">Aç →</span>
                                </button>
                            </div>

                            <PrimaryButton className="mt-4" onClick={() => setIsSettingsOpen(false)}>Tamam</PrimaryButton>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function TrackingPage() {
    return (
        <Suspense fallback={<div className="h-[100dvh] w-full bg-background" />}>
            <TrackingContent />
        </Suspense>
    );
}
