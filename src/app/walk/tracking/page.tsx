"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Pause, Play, ChevronLeft, Settings, MapPin, Clock,
    AlertTriangle, Zap, Camera, Share2, Footprints
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, animate as animateMotionValue } from "framer-motion";
import { cn, showToast } from "@/lib/utils";
import { useActivity } from "@/context/ActivityContext";
import { usePet } from "@/context/PetContext";
import { useWeather } from "@/context/WeatherContext";
import { useQuestEngine } from "@/context/QuestEngineContext";
import { WALK_ISSUE_LABELS } from "@/lib/walkIssueLabels";
import { haptics } from "@/lib/haptics";
import { audioCues } from "@/lib/audioCues";
import { apiService } from "@/services/apiService";

// Piyasa araştırması #11: pati güvenliği uyarısı — WeatherContext'in zaten
// bildiği gerçek sıcaklıktan türetilen, dürüst bir uyarı (uydurma bir "pati
// sıcaklığı sensörü" değil, gerçek hava sıcaklığından mantıklı bir çıkarım).
function pawSafetyWarning(temp: number | undefined): string | null {
    if (temp === undefined) return null;
    if (temp >= 28) return 'Asfalt patiler için sıcak olabilir — gölgeli veya çimenli rotaları tercih et 🐾';
    if (temp <= 0) return 'Tuzlu/karlı zemin pati tahrişi yapabilir — yürüyüş sonrası patilerini kontrol et 🐾';
    return null;
}

const LiveMap = dynamic(() => import('@/components/walk/LiveMap'), { ssr: false, loading: () => <div className="bg-card dark:bg-[#1A1A1A] w-full h-full flex items-center justify-center text-white font-bold">Harita Yükleniyor...</div> });

// Faz 2/4: GPS durumunu referans tasarımdaki "GPS İyi" tarzı kısa bir rozete çevirir
function gpsStatusFromIssue(issue: string) {
    switch (issue) {
        case 'none': return { label: 'GPS İyi', tone: 'emerald' as const };
        case 'gps_searching': return { label: 'GPS Aranıyor', tone: 'amber' as const };
        case 'gps_weak': return { label: 'GPS Zayıf', tone: 'amber' as const };
        case 'location_lost': return { label: 'GPS Kayıp', tone: 'red' as const };
        case 'location_permission_required': return { label: 'Konum İzni Gerekli', tone: 'red' as const };
        case 'network_unavailable': return { label: 'Bağlantı Yok', tone: 'amber' as const };
        case 'background_permission_required': return { label: 'Arka Planda', tone: 'amber' as const };
        default: return { label: 'GPS Hatası', tone: 'red' as const };
    }
}

const TONE_CLASS: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
};

function TrackingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams?.get('mode');
    const { walkData, startWalk, pauseWalk, resumeWalk, walkIssue, autoPauseEnabled, setAutoPauseEnabled } = useActivity();
    const { activePet } = usePet();
    const { weather } = useWeather();
    const { dailyGoal } = useQuestEngine();

    const [userPos, setUserPos] = useState<[number, number]>([40.9850, 29.0300]);
    const [path, setPath] = useState<[number, number][]>([]);
    const [showStopConfirm, setShowStopConfirm] = useState(false);
    const [screenAwake, setScreenAwake] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);
    // Baran'ın gerçek bulgusu: dişli ikonu sadece Wake Lock'u açıp kapatıyordu ama
    // "Ayarlar" gibi görünüyordu — gerçek bir ayarlar sistemi yoktu. Artık gerçek bir
    // panel: Ekranı Açık Tut + Sesli Geri Bildirim + Otomatik Duraklatma (üçü de
    // gerçek, çalışan state'lere bağlı — hiçbiri sahte/işlevsiz değil).
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const prevWasAutoPausedRef = useRef(false);
    const announcedStartRef = useRef(false);
    const lastAnnouncedSplitRef = useRef(0);
    // Piyasa araştırması #6: bu yürüyüşte çekilen fotoğraflar (gerçek Storage
    // upload'ı — bkz. apiService.uploadWalkPhoto)
    const [walkPhotos, setWalkPhotos] = useState<string[]>([]);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    // Piyasa araştırması #4: Strava Beacon tarzı canlı konum paylaşımı
    const [beaconId, setBeaconId] = useState<string | null>(null);
    const [beaconLoading, setBeaconLoading] = useState(false);

    // Baran'ın gerçek bulgusu: gösterge paneli sabitti, kullanıcı haritayı ya da
    // paneli tam ekran yapamıyordu. Gerçek bir sürüklenebilir bottom-sheet:
    // 3 durak (Kısaltılmış/Varsayılan/Tam Ekran). Yanlış dokunmalara karşı
    // hassasiyet: SADECE üstteki tutamaç sürüklemeyi başlatabiliyor — panel
    // içeriği (istatistikler/Duraklat/Bitir) kendi alanında sürüklemeyi
    // `stopPropagation` ile durduruyor (bkz. JSX'teki asıl uygulama ve
    // gerekçe notu; ilk denenen `dragControls.start` deseni canlı testte
    // ikinci jestte tamamen tepkisiz kaldığı için terk edildi).
    type SheetState = 'collapsed' | 'default' | 'full';
    const [sheetState, setSheetState] = useState<SheetState>('default');
    const [viewportHeight, setViewportHeight] = useState(700);
    useEffect(() => {
        const update = () => setViewportHeight(window.innerHeight);
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);
    const SHEET_HEIGHT = Math.round(viewportHeight * 0.9);
    const COLLAPSED_VISIBLE = 128;
    const DEFAULT_VISIBLE = Math.min(430, Math.round(viewportHeight * 0.52));
    const snapY: Record<SheetState, number> = {
        collapsed: SHEET_HEIGHT - COLLAPSED_VISIBLE,
        default: SHEET_HEIGHT - DEFAULT_VISIBLE,
        full: 0,
    };
    // Framer Motion gerçek tuzağı: JSX `animate` prop'u ile aynı eksende aktif
    // `drag` birleştirilince, ikinci sürükleme jesti "layout" ölçümünü mevcut
    // (transform uygulanmış) konuma göre yanlış referans alıp neredeyse hiç
    // hareket etmiyordu (canlı testte doğrulandı: ilk sürükleme tam çalışıyor,
    // ikincisi 400px hareketi ~4px'e sıkıştırıyordu). Resmi/önerilen çözüm:
    // konumu bir `useMotionValue` ile tutup `style`e vermek, `animate` prop'u
    // yerine imperatif `animate()` çağırmak — `drag` ve programatik animasyon
    // AYNI motion value'yu paylaşıyor, çakışma ortadan kalkıyor.
    const sheetY = useMotionValue(snapY.default);
    const targetY = snapY[sheetState];
    useEffect(() => {
        const controls = animateMotionValue(sheetY, targetY, { type: "spring", damping: 32, stiffness: 320 });
        return () => controls.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetY]);
    const handleSheetDragEnd = (_e: any, info: { offset: { y: number }; velocity: { y: number } }) => {
        const projectedY = sheetY.get();
        let next: SheetState;
        if (info.velocity.y > 600) {
            next = sheetState === 'full' ? 'default' : 'collapsed';
        } else if (info.velocity.y < -600) {
            next = sheetState === 'collapsed' ? 'default' : 'full';
        } else {
            next = (Object.entries(snapY) as [SheetState, number][])
                .sort((a, b) => Math.abs(a[1] - projectedY) - Math.abs(b[1] - projectedY))[0][0];
        }
        if (next !== sheetState) haptics.tap();
        setSheetState(next);
    };

    const toggleBeacon = async () => {
        if (beaconLoading) return;
        haptics.tap();
        if (beaconId) {
            setBeaconLoading(true);
            try { await apiService.stopBeacon(beaconId); } catch {}
            setBeaconId(null);
            setBeaconLoading(false);
            showToast('Canlı konum paylaşımı durduruldu.', 'ShieldAlert');
            return;
        }
        if (!walkData.sessionId) {
            showToast('Konumunu paylaşmak için önce yürüyüşün sunucuya kaydedilmesini bekle.', 'AlertCircle');
            return;
        }
        setBeaconLoading(true);
        try {
            const id = await apiService.startBeacon(walkData.sessionId, activePet?.name || 'Dostum', userPos[0], userPos[1]);
            setBeaconId(id);
            const url = `${window.location.origin}/beacon/${id}`;
            if (navigator.share) {
                await navigator.share({ title: 'Canlı Konumum', text: `${activePet?.name || 'Dostum'} ile yürüyorum, canlı konumumu takip edebilirsin:`, url }).catch(() => {});
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                showToast('Canlı konum bağlantısı kopyalandı! Güvendiğin biriyle paylaşabilirsin.', 'Share2');
            }
        } catch (err) {
            console.error('Beacon başlatılamadı:', err);
            showToast('Canlı konum paylaşımı başlatılamadı.', 'AlertCircle');
        } finally {
            setBeaconLoading(false);
        }
    };

    // Beacon açıkken her gerçek konum güncellemesinde (drift kalkanını zaten
    // geçmiş noktalar) sunucudaki tek-nokta konumu tazele.
    useEffect(() => {
        if (beaconId) apiService.updateBeaconLocation(beaconId, userPos[0], userPos[1]).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userPos, beaconId]);

    // Yürüyüş bitince veya sayfadan ayrılınca beacon'ı otomatik kapat
    useEffect(() => {
        return () => { if (beaconId) apiService.stopBeacon(beaconId).catch(() => {}); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [beaconId]);

    const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !walkData.sessionId) return;
        setUploadingPhoto(true);
        haptics.tap();
        try {
            const url = await apiService.uploadWalkPhoto(walkData.sessionId, file);
            setWalkPhotos(prev => [...prev, url]);
            showToast('Fotoğraf yürüyüşüne eklendi! 📸', 'Upload');
        } catch (err) {
            console.error('Yürüyüş fotoğrafı yüklenemedi:', err);
            showToast('Fotoğraf yüklenemedi, tekrar deneyebilirsin.', 'AlertCircle');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Kilodan hesaplanan kalori — ana sayfa kartı ve WalkQuickSheet ile aynı gerçek formül
    const distKm = walkData.distance / 1000;
    const parsedWeight = parseFloat(String(activePet?.weight ?? ''));
    const weightKg = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 15;
    const calories = Math.max(0, Math.round(distKm * weightKg));
    // Piyasa araştırması bulgusu: km her zaman öncelikliydi, gerçek zamanlı adım
    // sayısı hiç gösterilmiyordu. Gerçek bir pedometre/ivmeölçer API'si
    // kullanmıyoruz (tarayıcıda güvenilir değil) — bu yüzden km/km*adım
    // formülü zaten uygulamanın HER yerinde (özet, geçmiş) kullanılan aynı
    // dürüst tahmin — burada SADECE canlı, gerçek mesafeden sürekli güncelleniyor.
    const steps = Math.round(walkData.distance * 1.3);
    const remainingKm = Math.max(0, dailyGoal.distance - distKm);
    const goalPercent = Math.round(Math.min(100, (distKm / Math.max(0.1, dailyGoal.distance)) * 100));
    const gpsStatus = gpsStatusFromIssue(walkIssue);

    // --- SYNC MAP WITH GLOBAL GPS ---
    useEffect(() => {
        if (walkData && Array.isArray(walkData.path) && walkData.path.length > 0) {
            const lastPos = walkData.path[walkData.path.length - 1];
            setUserPos(lastPos);
            setPath(walkData.path);
        }
    }, [walkData?.path]);

    // Faz 4 (referans revizyonu): Ekranı Açık Tut — gerçek Wake Lock API, GPS takibi
    // sırasında ekranın kararıp kilitlenmesi çok yaygın bir şikayet olduğu için eklendi.
    useEffect(() => {
        let wakeLock: any = null;
        if (screenAwake && typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
            (navigator as any).wakeLock.request('screen').then((lock: any) => { wakeLock = lock; }).catch(() => {});
        }
        return () => { if (wakeLock) wakeLock.release().catch(() => {}); };
    }, [screenAwake]);

    // Piyasa araştırması #3: sesli geri bildirim tetikleyicileri — sadece
    // gerçek durum değişikliklerinde konuşuyor (yürüyüş başlangıcı bir kez,
    // her yeni split bir kez, otomatik duraklatma/devam geçişleri).
    useEffect(() => {
        if (walkData.isActive && !announcedStartRef.current && walkData.time <= 2) {
            announcedStartRef.current = true;
            audioCues.walkStarted();
        }
    }, [walkData.isActive, walkData.time]);

    useEffect(() => {
        const splits = walkData.splits || [];
        if (splits.length > lastAnnouncedSplitRef.current) {
            const latest = splits[splits.length - 1];
            audioCues.split(latest.km, latest.splitSeconds);
            lastAnnouncedSplitRef.current = splits.length;
        }
    }, [walkData.splits]);

    useEffect(() => {
        if (walkData.isAutoPaused && !prevWasAutoPausedRef.current) {
            audioCues.autoPaused();
            haptics.warn();
        } else if (!walkData.isAutoPaused && prevWasAutoPausedRef.current) {
            audioCues.autoResumed();
            haptics.tap();
        }
        prevWasAutoPausedRef.current = walkData.isAutoPaused;
    }, [walkData.isAutoPaused]);

    // Handle Finish — Faz 6: stopWalk walkData'yı sıfırlamadan önce anlık görüntüyü al,
    // sonra Ekran 6'daki (design-reference/walk-final/) gerçek "İşleme Ekranı"na
    // yönlendir — stopWalk() ÇAĞRISI ARTIK ORADA yapılıyor, burada değil.
    const handleFinish = async () => {
        haptics.success();
        audioCues.walkFinished(distKm);
        if (beaconId) { apiService.stopBeacon(beaconId).catch(() => {}); setBeaconId(null); }
        const summaryDistanceKm = distKm;
        const summaryDurationSec = walkData.time;
        const summaryCalories = calories;
        const summarySteps = steps;
        // Piyasa araştırması #5/#13: bu yürüyüşün en hızlı kilometresi ve kısa
        // duraklama sayısı özet ekranına taşınıyor (kişisel rekor karşılaştırması
        // ve eğlenceli "durma sayacı" için).
        const bestSplitSeconds = (walkData.splits && walkData.splits.length > 0)
            ? Math.min(...walkData.splits.map(s => s.splitSeconds))
            : undefined;
        const params = new URLSearchParams({
            distanceKm: String(summaryDistanceKm),
            durationSec: String(summaryDurationSec),
            calories: String(summaryCalories),
            steps: String(summarySteps),
            sniffStops: String(walkData.sniffStops || 0),
        });
        if (bestSplitSeconds !== undefined) params.set('bestSplitSeconds', String(bestSplitSeconds));
        router.replace(`/walk/processing?${params.toString()}`);
    };

    return (
        <div className="h-screen w-full bg-white dark:bg-black relative overflow-hidden flex flex-col font-sans">

            {/* HEADER — gösterge paneli tam ekran ('full') olduğunda haritanın üzerindeki
                bu yüzen katman, panelin tutamacının TAM ÜSTÜNE binip tıklama/sürükleme
                olaylarını yutuyordu (canlı Playwright testiyle kanıtlanan gerçek bir hata:
                paneli tam ekrana çektikten sonra kullanıcı BİR DAHA ASLA geri
                çekemiyordu, çünkü tutamaç bu z-[60] katmanın altında kalıyordu). Panel tam
                ekranken zaten gösterecek bir harita yok, bu yüzden bu katman görünmez VE
                tıklanamaz hale getiriliyor — kök neden çözümü, geçici bir z-index yaması
                değil. */}
            <div className={cn(
                "absolute top-0 left-0 right-0 z-[60] px-4 pt-4 flex items-center justify-between transition-opacity duration-200",
                sheetState === 'full' ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                <button
                    onClick={() => { haptics.tap(); router.back(); }}
                    className="w-10 h-10 bg-white/90 dark:bg-black/60 backdrop-blur-md border border-card-border rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
                >
                    <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
                </button>
                <span className="font-black text-[13px] text-slate-800 dark:text-white bg-white/90 dark:bg-black/60 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
                    {activePet?.name || 'Moffi'} ile Yürüyüş
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { haptics.tap(); setAudioEnabled(v => { const next = !v; audioCues.setEnabled(next); return next; }); }}
                        className={cn(
                            "w-10 h-10 backdrop-blur-md border border-card-border rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all",
                            audioEnabled ? "bg-white/90 dark:bg-black/60 text-slate-700 dark:text-white" : "bg-slate-800 text-white"
                        )}
                        title="Sesli Geri Bildirim"
                    >
                        {audioEnabled ? <span className="text-base leading-none">🔊</span> : <span className="text-base leading-none">🔇</span>}
                    </button>
                    <button
                        onClick={() => { haptics.tap(); setIsSettingsOpen(true); }}
                        className="w-10 h-10 bg-white/90 dark:bg-black/60 backdrop-blur-md border border-card-border rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all text-slate-700 dark:text-white"
                        title="Ayarlar"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* STATUS PILLS — aynı sebeple ('full' durumunda tutamacı engelliyordu) */}
            <div className={cn(
                "absolute top-16 left-4 right-4 z-[55] flex flex-wrap gap-2 transition-opacity duration-200",
                sheetState === 'full' ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg backdrop-blur-md", TONE_CLASS[gpsStatus.tone])}>
                    <MapPin className="w-3 h-3" /> {gpsStatus.label}
                </span>
                {weather && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg bg-white/90 dark:bg-black/60 backdrop-blur-md text-slate-700 dark:text-white">
                        <span>{weather.icon}</span> Hava {weather.temp}°C
                    </span>
                )}
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg bg-white/90 dark:bg-black/60 backdrop-blur-md text-slate-700 dark:text-white">
                    <Clock className="w-3 h-3" /> {Math.floor(walkData.time / 60)} dk
                </span>
                {/* Ekran 4 (Duraklatılmış) yeniden inşası — referansta harita KARARMIYOR,
                    sadece küçük bir rozet duraklatıldığını gösteriyor (bkz. design-reference/walk-final/). */}
                {walkData.isActive && walkData.isPaused && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg bg-black/70 backdrop-blur-md text-white">
                        <Pause className="w-3 h-3 fill-current" /> {walkData.isAutoPaused ? 'Otomatik Duraklatıldı' : 'Duraklatıldı'}
                    </span>
                )}
                {walkData.splits && walkData.splits.length > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg bg-white/90 dark:bg-black/60 backdrop-blur-md text-slate-700 dark:text-white">
                        <Zap className="w-3 h-3 text-amber-500" /> En hızlı km: {formatTime(Math.min(...walkData.splits.map(s => s.splitSeconds)))}
                    </span>
                )}
                {/* Piyasa araştırması #4: Strava Beacon tarzı canlı konum paylaşımı — tek
                    dokunuşla bir bağlantı üretip güvenilen birine gönderme */}
                <button
                    onClick={toggleBeacon}
                    disabled={beaconLoading}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg backdrop-blur-md border-0 cursor-pointer disabled:opacity-60",
                        beaconId ? "bg-emerald-500 text-white" : "bg-white/90 dark:bg-black/60 text-slate-700 dark:text-white"
                    )}
                >
                    <Share2 className="w-3 h-3" /> {beaconId ? 'Konum Paylaşılıyor' : 'Konumu Paylaş'}
                </button>
            </div>

            {/* Uyarı bandı yığını: GPS/izin/bağlantı sorunu VE pati güvenliği uyarısı
                aynı anda görünebileceği için tek bir dikey yığın olarak konumlandırıldı
                (ikisi de "top-28"e bağımsız oturursa üst üste biner). */}
            <div className={cn(
                "absolute top-28 left-4 right-4 z-[55] space-y-2 transition-opacity duration-200",
                sheetState === 'full' ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                {walkIssue !== 'none' && (
                    <div className="bg-amber-500 text-white rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span className="text-[10.5px] font-bold leading-snug">{WALK_ISSUE_LABELS[walkIssue] || WALK_ISSUE_LABELS.error}</span>
                    </div>
                )}
                {/* Piyasa araştırması #11: pati güvenliği uyarısı — gerçek hava sıcaklığından */}
                {pawSafetyWarning(weather?.temp) && (
                    <div className="bg-orange-500 text-white rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg">
                        <span className="text-base shrink-0">🐾</span>
                        <span className="text-[10.5px] font-bold leading-snug">{pawSafetyWarning(weather?.temp)}</span>
                    </div>
                )}
            </div>

            {/* LIVE MAP — artık tam ekran arka plan; alttaki gösterge paneli üzerine
                sürüklenebilir bir katman olarak biniyor (bkz. aşağısı) */}
            <div className="absolute inset-0 z-[0]">
                <LiveMap
                    userPos={userPos}
                    path={path}
                    isTracking={walkData.isActive}
                    visitedPlaceIds={[]}
                    guardianMode={mode === 'guardian'}
                    hideInternalUI
                />

                {/* Piyasa araştırması #6: yürüyüş sırasında fotoğraf çekme — gerçek
                    Supabase Storage upload'ı, dummy görsel değil (bkz. apiService.uploadWalkPhoto).
                    Panel tam ekranken (sheetState 'full') haritanın üzerinde anlamsız
                    kaldığı için gizleniyor. */}
                {sheetState !== 'full' && (
                    <>
                        <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handlePhotoSelected}
                        />
                        <button
                            onClick={() => { if (!uploadingPhoto) photoInputRef.current?.click(); }}
                            disabled={uploadingPhoto || !walkData.sessionId}
                            className="absolute z-[40] w-14 h-14 rounded-full bg-white/95 dark:bg-black/70 backdrop-blur-md shadow-lg border border-card-border flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
                            style={{ bottom: (SHEET_HEIGHT - snapY[sheetState]) + 16, right: 16 }}
                            title="Fotoğraf Çek"
                        >
                            {uploadingPhoto ? (
                                <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                            ) : (
                                <Camera className="w-6 h-6 text-slate-700 dark:text-white" />
                            )}
                        </button>
                        {walkPhotos.length > 0 && (
                            <span
                                className="absolute z-[40] bg-white/95 dark:bg-black/70 backdrop-blur-md shadow-lg rounded-full px-2.5 py-1 text-[10px] font-black text-slate-700 dark:text-white"
                                style={{ bottom: (SHEET_HEIGHT - snapY[sheetState]) + 28, right: 80 }}
                            >
                                📸 {walkPhotos.length}
                            </span>
                        )}
                    </>
                )}
            </div>

            {/* GERÇEK SÜRÜKLENEBİLİR GÖSTERGE PANELİ (bkz. yukarıdaki snapY açıklaması) —
                Baran'ın bulduğu gerçek eksiklik: panel sabitti, kullanıcı haritayı ya da
                paneli tam ekran yapamıyordu.
                NOT: `useDragControls()` + `dragListener={false}` + handle'ın
                `onPointerDown`'ında `dragControls.start(e)` — Framer'ın KENDİ önerdiği
                "sadece tutamaçtan sürükle" deseni — canlı testte gerçek bir Framer Motion
                hatası çıkardı: İLK sürükleme jesti çalışıyor, ama ikinci ve sonraki HER
                jest tamamen tepkisiz kalıyordu (yön farketmeksizin, 20+ adımlı yavaş/
                gerçekçi sürükleme dahil, playwright ile kanıtlandı) — framer/motion
                GitHub'ında da (#712, #525) bilinen, versiyondan bağımsız bir dragControls
                tekrar-jest sorunu. Bunun yerine sürükleme DOĞRUDAN bu panelin kendi
                üzerinde dinleniyor (varsayılan dragListener), ve içerik alanı (istatistik/
                buton bölümü) kendi `onPointerDown`'ında `stopPropagation()` çağırarak
                sürüklemeyi bu paneldeki dokunuşlardan İZOLE ediyor — SADECE üstteki
                tutamaç bu izolasyonun DIŞINDA olduğu için sürüklemeyi başlatabiliyor. Aynı
                güvenlik hedefine (yanlış dokunmalara karşı hassasiyet) ulaşan, ama
                gerçekte çalışan bir yöntem. */}
            <motion.div
                className="absolute left-0 right-0 bottom-0 z-[50] bg-card rounded-t-[2.5rem] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col touch-none"
                style={{ height: SHEET_HEIGHT, y: sheetY }}
                drag="y"
                dragConstraints={{ top: 0, bottom: SHEET_HEIGHT - COLLAPSED_VISIBLE }}
                dragElastic={0.04}
                dragMomentum={false}
                onDragEnd={handleSheetDragEnd}
            >
                {/* Tutamaç — bu SADECE görsel bir ipucu değil, panelin geri kalanı
                    sürüklemeyi kendi içinde durdurduğu için (aşağıya bkz.) sürüklemeyi
                    başlatabilen TEK alan burası. */}
                <div className="pt-3 pb-2 flex flex-col items-center cursor-grab active:cursor-grabbing shrink-0">
                    <div className="w-10 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full" />
                </div>

                <div
                    className="flex-1 overflow-y-auto px-6 pb-8 no-scrollbar"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {/* Ekran 4 (Duraklatılmış): referansa göre büyük sayı/ilerleme yerine tek
                        satırlık kompakt bir özet gösteriliyor — bkz. design-reference/walk-final/. */}
                    {walkData.isActive && walkData.isPaused ? (
                        <div className="flex items-center gap-2.5 mb-5 bg-slate-50 dark:bg-white/5 rounded-2xl px-4 py-3.5">
                            <Pause className="w-4 h-4 text-slate-500 dark:text-slate-300 fill-current shrink-0" />
                            <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 leading-snug">
                                Yürüyüş Duraklatıldı · {steps.toLocaleString('tr-TR')} adım · {distKm.toFixed(2).replace('.', ',')} km · {formatTime(walkData.time)}
                            </span>
                        </div>
                    ) : (
                        <>
                            {/* Piyasa araştırması bulgusu: ADIM artık birincil, büyük gösterge —
                                km ikincil/küçük bir satıra indi (önceden tam tersiydi, adım hiç
                                yoktu). Aynı dürüst tahmin formülü (mesafe*1.3), sadece görünürlüğü
                                değişti. */}
                            <div className="flex items-baseline gap-2 mb-0.5">
                                <span className="text-4xl font-black tracking-tighter text-slate-800 dark:text-white font-mono">{steps.toLocaleString('tr-TR')}</span>
                                <span className="text-sm font-black text-slate-400 uppercase">adım</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 dark:text-slate-300 mb-4">
                                <Footprints className="w-3.5 h-3.5 text-slate-400" /> {distKm.toFixed(2).replace('.', ',')} km
                            </div>

                            <div className="flex items-center gap-5 mb-4">
                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 dark:text-slate-300">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {formatTime(walkData.time)}
                                </div>
                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 dark:text-slate-300">
                                    🔥 {calories} kcal
                                </div>
                            </div>

                            <div className="mb-5">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-bold text-slate-400">Hedefe kalan: {remainingKm.toFixed(1)} km</span>
                                    <span className="text-[11px] font-black text-orange-500">%{goalPercent}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${Math.max(3, goalPercent)}%` }} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Ekran 5 (Bitirme Onayı) artık burada inline bir buton takası değil, aşağıdaki
                        gerçek dimmed-backdrop modal'a (showStopConfirm) devrediliyor. */}
                    <div className="space-y-2.5">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                                haptics.tap();
                                if (!walkData.isActive) startWalk();
                                else if (walkData.isPaused) resumeWalk();
                                else pauseWalk();
                            }}
                            className={cn(
                                "w-full h-14 text-white rounded-full flex items-center justify-center gap-2 font-black text-[13px] uppercase tracking-widest border-0",
                                (!walkData.isActive || walkData.isPaused)
                                    ? "bg-orange-500 shadow-[0_8px_20px_rgba(249,115,22,0.3)]"
                                    : "bg-slate-900 shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
                            )}
                        >
                            {(!walkData.isActive || walkData.isPaused) ? (
                                <><Play className="w-4 h-4 fill-current" /> Devam Et</>
                            ) : (
                                <><Pause className="w-4 h-4 fill-current" /> Duraklat</>
                            )}
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { haptics.tap(); setShowStopConfirm(true); }}
                            className="w-full h-12 bg-red-50 text-red-500 rounded-full font-black text-[12px] uppercase tracking-widest border-0"
                        >
                            Yürüyüşü Bitir
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Ekran 5 (Bitirme Onayı) — design-reference/walk-final/'e göre gerçek bir
                dimmed-backdrop modal: harita arka planda kararıyor, X ile kapanıyor. */}
            <AnimatePresence>
                {showStopConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm flex items-center justify-center px-6"
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
                                <span className="sr-only">Kapat</span>
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                <Pause className="w-6 h-6 text-red-500 fill-current" />
                            </div>
                            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 leading-snug pr-6">Yürüyüşü bitirmek istediğinize emin misiniz?</h3>
                            <div className="grid grid-cols-3 gap-2 mb-5">
                                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl py-3 flex flex-col items-center">
                                    <span className="text-sm font-black text-slate-800 dark:text-white">{steps.toLocaleString('tr-TR')}</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Adım</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl py-3 flex flex-col items-center">
                                    <span className="text-sm font-black text-slate-800 dark:text-white">{distKm.toFixed(2).replace('.', ',')} km</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Mesafe</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl py-3 flex flex-col items-center">
                                    <span className="text-sm font-black text-slate-800 dark:text-white">{formatTime(walkData.time)}</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Süre</span>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <motion.button whileTap={{ scale: 0.96 }} onClick={handleFinish} className="w-full h-13 py-3.5 bg-red-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest border-0">
                                    Yürüyüşü Bitir
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { haptics.tap(); setShowStopConfirm(false); }} className="w-full py-3 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest border-0 bg-transparent">
                                    Devam Et
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* GERÇEK AYARLAR PANELİ — dişli ikonu önceden sadece Wake Lock'u açıp
                    kapatıyordu (görünüşte "Ayarlar" ama arkasında tek, gizli bir işlev).
                    Artık üç gerçek, çalışan tercih burada: Ekranı Açık Tut, Sesli Geri
                    Bildirim, Otomatik Duraklatma (üçü de gerçek state'lere bağlı). */}
                {isSettingsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm flex items-end justify-center"
                        onClick={() => { haptics.tap(); setIsSettingsOpen(false); }}
                    >
                        <motion.div
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 320 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-card rounded-t-[2rem] p-6 pb-8 shadow-2xl border-t border-card-border"
                        >
                            <div className="w-10 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-5" />
                            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-5">Yürüyüş Ayarları</h3>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between py-3">
                                    <div className="pr-4">
                                        <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Ekranı Açık Tut</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">Yürüyüş sırasında ekran kararmaz</div>
                                    </div>
                                    <button
                                        onClick={() => { haptics.tap(); setScreenAwake(v => !v); }}
                                        className={cn("w-12 h-7 rounded-full relative transition-colors shrink-0 border-0", screenAwake ? "bg-orange-500" : "bg-slate-200 dark:bg-white/10")}
                                    >
                                        <span className={cn("absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform", screenAwake ? "translate-x-5" : "translate-x-0.5")} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-white/5">
                                    <div className="pr-4">
                                        <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Sesli Geri Bildirim</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">Kilometre ve durum anonsları</div>
                                    </div>
                                    <button
                                        onClick={() => { haptics.tap(); setAudioEnabled(v => { const next = !v; audioCues.setEnabled(next); return next; }); }}
                                        className={cn("w-12 h-7 rounded-full relative transition-colors shrink-0 border-0", audioEnabled ? "bg-orange-500" : "bg-slate-200 dark:bg-white/10")}
                                    >
                                        <span className={cn("absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform", audioEnabled ? "translate-x-5" : "translate-x-0.5")} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-white/5">
                                    <div className="pr-4">
                                        <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Otomatik Duraklatma</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">Durunca yürüyüş kendiliğinden duraklar</div>
                                    </div>
                                    <button
                                        onClick={() => { haptics.tap(); setAutoPauseEnabled(!autoPauseEnabled); }}
                                        className={cn("w-12 h-7 rounded-full relative transition-colors shrink-0 border-0", autoPauseEnabled ? "bg-orange-500" : "bg-slate-200 dark:bg-white/10")}
                                    >
                                        <span className={cn("absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform", autoPauseEnabled ? "translate-x-5" : "translate-x-0.5")} />
                                    </button>
                                </div>

                                {/* Piyasa araştırması: yürüyüş sırasında müzik. Gerçek bir uygulama-içi
                                    çalar (Spotify/Apple Music parçalarını gerçekten çalmak) telif
                                    anlaşması + resmi API entegrasyonu gerektirir — bilinçli olarak
                                    kapsam dışı bırakıldı. Bunun yerine dürüst, sıfır maliyetli bir
                                    kısayol: kullanıcının kendi Spotify'ını açıyor, uygulama içinde
                                    "çalıyormuş gibi" sahte bir oynatıcı GÖSTERMİYORUZ. */}
                                <button
                                    onClick={() => { haptics.tap(); window.open('https://open.spotify.com', '_blank'); }}
                                    className="w-full flex items-center justify-between py-3 border-t border-slate-100 dark:border-white/5"
                                >
                                    <div className="pr-4 text-left">
                                        <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Müzik</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">Spotify'ı aç, yürürken dinle</div>
                                    </div>
                                    <span className="text-[11px] font-black text-orange-500 shrink-0">Aç →</span>
                                </button>
                            </div>

                            <button
                                onClick={() => { haptics.tap(); setIsSettingsOpen(false); }}
                                className="w-full h-12 mt-5 bg-slate-900 dark:bg-white/10 text-white rounded-full font-black text-[12px] uppercase tracking-widest border-0"
                            >
                                Tamam
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function TrackingPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full bg-white dark:bg-black flex items-center justify-center text-white text-sm font-bold">Hazırlanıyor... 🐾</div>}>
            <TrackingContent />
        </Suspense>
    );
}
