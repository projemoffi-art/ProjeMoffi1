"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Footprints, Flame, Calendar, Route, Activity, Zap, Play } from "lucide-react";
import { apiService } from "@/services/apiService";
import { usePet } from "@/context/PetContext";
import { normalizePathToTuples, haversineKm } from "@/lib/utils";

// Faz 10: Yürüyüş Detay ekranı — daha önce hiç yoktu (getWalkById() servis
// katmanında tanımlıydı ama hiçbir UI bileşeni onu çağırmıyordu, tamamen
// orphan bir fonksiyondu). Gerçek GPS rotasını gerçek LiveMap üzerinde
// gösteriyor (statik/geçmiş modda — isTracking={false}).
// Ekran 9 (Yürüyüş Detayı) — gerçek GPS `path_coordinates` ({lat,lng,timestamp}[])
// üzerinden nokta-nokta hız hesaplıyor. >25 km/h anlık hızlar bir köpek yürüyüşü
// için gerçekçi değil (neredeyse her zaman GPS sıçraması) — maksimuma dahil
// edilmiyor, uydurma bir sayı değil ama gürültüden arındırılmış gerçek bir hesap.
function computeMaxSpeedKmh(rawPath: unknown): number {
    if (!Array.isArray(rawPath)) return 0;
    const points = rawPath
        .map((p: any) => (p && typeof p.lat === 'number' && typeof p.lng === 'number' && p.timestamp)
            ? { lat: p.lat, lng: p.lng, t: new Date(p.timestamp).getTime() }
            : null)
        .filter((p): p is { lat: number; lng: number; t: number } => p !== null && Number.isFinite(p.t));
    let max = 0;
    for (let i = 1; i < points.length; i++) {
        const dtHours = (points[i].t - points[i - 1].t) / 3600000;
        if (dtHours <= 0) continue;
        const distKm = haversineKm([points[i - 1].lat, points[i - 1].lng], [points[i].lat, points[i].lng]);
        const speed = distKm / dtHours;
        if (speed > 0 && speed <= 25) max = Math.max(max, speed);
    }
    return max;
}

const LiveMap = dynamic(() => import('@/components/walk/LiveMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 dark:bg-white/5 animate-pulse flex items-center justify-center text-slate-400 text-xs font-bold">Harita Yükleniyor...</div>
});

interface WalkDetail {
    id: string;
    pet_id?: string;
    distance_meters?: number;
    start_time?: string;
    end_time?: string;
    // Gerçek DB şekli {lat,lng,timestamp}[] — normalizePathToTuples ile dönüştürülüyor
    path_coordinates?: unknown;
    status?: string;
    // Piyasa araştırması #6: gerçek Storage upload'ından gelen fotoğraf URL'leri
    photo_urls?: string[];
}

export default function WalkDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
    const { pets, activePet } = usePet();

    const [walk, setWalk] = useState<WalkDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    // Piyasa araştırması #9: rota tekrar oynatma (replay) — gerçek path
    // noktaları üzerinden bir işaretçiyi hareket ettirip rotayı adım adım açığa
    // çıkarıyor, uydurma bir animasyon değil.
    const [isReplaying, setIsReplaying] = useState(false);
    const [replayIndex, setReplayIndex] = useState(0);
    const replayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            const data = await apiService.getWalkById(id);
            if (cancelled) return;
            if (!data || !data.id) {
                setNotFound(true);
            } else {
                setWalk(data);
            }
            setIsLoading(false);
        })();
        return () => { cancelled = true; };
    }, [id]);

    const pet = pets.find(p => p.id === walk?.pet_id) || activePet;

    const distanceKm = (walk?.distance_meters || 0) / 1000;
    const durationSec = (walk?.start_time && walk?.end_time)
        ? Math.max(0, Math.floor((new Date(walk.end_time).getTime() - new Date(walk.start_time).getTime()) / 1000))
        : 0;
    const durationLabel = `${Math.floor(durationSec / 60).toString().padStart(2, '0')}:${(durationSec % 60).toString().padStart(2, '0')}`;
    const calories = Math.round((walk?.distance_meters || 0) * 0.06);
    const steps = Math.round((walk?.distance_meters || 0) * 1.3);
    const path = normalizePathToTuples(walk?.path_coordinates);

    // Ekran 9: tarih + SAAT ARALIĞI (start_time - end_time, ikisi de DB'de zaten var)
    const dateLabel = walk?.end_time
        ? new Date(walk.end_time).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })
        : '';
    const timeRangeLabel = (walk?.start_time && walk?.end_time)
        ? `${new Date(walk.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(walk.end_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
        : '';

    // Ekran 9: Ortalama/Maks hız — ortalama toplam mesafe/toplam süreden, maks ise
    // gerçek GPS nokta-nokta hesaplamasından (computeMaxSpeedKmh, yukarıda).
    const avgSpeedKmh = durationSec > 0 ? distanceKm / (durationSec / 3600) : 0;

    const handleReplay = () => {
        if (path.length < 2) return;
        if (replayTimerRef.current) clearInterval(replayTimerRef.current);
        setIsReplaying(true);
        setReplayIndex(0);
        // Nokta sayısından bağımsız, toplam oynatma süresi ~9 saniyede sabit —
        // uzun rotalar daha hızlı, kısa rotalar daha yavaş "oynatılır".
        const stepMs = Math.max(40, Math.min(400, 9000 / path.length));
        let i = 0;
        replayTimerRef.current = setInterval(() => {
            i += 1;
            setReplayIndex(i);
            if (i >= path.length - 1) {
                if (replayTimerRef.current) clearInterval(replayTimerRef.current);
                setIsReplaying(false);
            }
        }, stepMs);
    };

    useEffect(() => {
        return () => { if (replayTimerRef.current) clearInterval(replayTimerRef.current); };
    }, []);
    const maxSpeedKmh = computeMaxSpeedKmh(walk?.path_coordinates);

    return (
        <main className="min-h-screen max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans flex flex-col border-x border-card-border">
            <div className="bg-card px-6 py-6 border-b border-card-border sticky top-0 z-20 flex items-center justify-between">
                <button onClick={() => router.back()} className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-gray-100 transition active:scale-90">
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <h1 className="text-lg font-bold text-foreground font-sans">Yürüyüş Detayı</h1>
                <div className="w-10" />
            </div>

            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-24 text-slate-400">
                    <span className="text-xl animate-bounce">🐾</span>
                    <span className="text-sm font-bold">Yürüyüş getiriliyor...</span>
                </div>
            ) : notFound ? (
                <div className="flex-1 flex flex-col items-center justify-center py-24 opacity-70 px-6 text-center">
                    <Route className="w-10 h-10 text-gray-300 mb-4" />
                    <p className="text-sm font-bold text-gray-500 leading-relaxed">Bu yürüyüşü bulamadık — silinmiş ya da sana ait olmayabilir.</p>
                </div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex-1 overflow-y-auto">
                    <div className="h-64 w-full relative">
                        {path.length > 1 ? (
                            <>
                                <LiveMap
                                    userPos={isReplaying ? path[replayIndex] : path[path.length - 1]}
                                    path={isReplaying ? path.slice(0, replayIndex + 1) : path}
                                    isTracking
                                    visitedPlaceIds={[]}
                                    hideInternalUI
                                />
                                <button
                                    onClick={handleReplay}
                                    disabled={isReplaying}
                                    className="absolute bottom-3 right-3 z-[40] bg-white/95 dark:bg-black/70 backdrop-blur-md shadow-lg rounded-full pl-3 pr-4 py-2 flex items-center gap-1.5 border border-card-border disabled:opacity-70"
                                >
                                    <Play className="w-3.5 h-3.5 text-slate-700 dark:text-white fill-current" />
                                    <span className="text-[10px] font-black text-slate-700 dark:text-white uppercase tracking-wide">
                                        {isReplaying ? 'Oynatılıyor...' : 'Rotayı Tekrar Oynat'}
                                    </span>
                                </button>
                            </>
                        ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-white/5 flex flex-col items-center justify-center gap-2">
                                <Route className="w-8 h-8 text-slate-300 dark:text-white/10" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rota kaydı yok</span>
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-6 space-y-5">
                        <div>
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold uppercase tracking-widest">{dateLabel}</span>
                            </div>
                            {timeRangeLabel && (
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-[12px] font-black">{timeRangeLabel}</span>
                                </div>
                            )}
                        </div>

                        {pet?.name && (
                            <div className="flex items-center gap-3 bg-card rounded-2xl p-3 shadow-moffi-card border border-card-border">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                                    {pet.avatar || pet.image ? (
                                        <img src={pet.avatar || pet.image} className="w-full h-full object-cover" alt={pet.name} />
                                    ) : (
                                        <span className="text-lg">🐾</span>
                                    )}
                                </div>
                                <span className="text-sm font-black text-foreground">{pet.name} ile</span>
                            </div>
                        )}

                        {/* Ekran 9: 3'lü istatistik satırı (km/dk/kcal — adım bu satırdan çıkarıldı) */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-card rounded-2xl p-4 flex flex-col gap-1.5 shadow-moffi-card border border-card-border">
                                <MapPin className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                <span className="text-lg font-black text-foreground">{distanceKm.toFixed(2)}</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Kilometre</span>
                            </div>
                            <div className="bg-card rounded-2xl p-4 flex flex-col gap-1.5 shadow-moffi-card border border-card-border">
                                <Clock className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                <span className="text-lg font-black text-foreground">{durationLabel}</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Süre</span>
                            </div>
                            <div className="bg-card rounded-2xl p-4 flex flex-col gap-1.5 shadow-moffi-card border border-card-border">
                                <Flame className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                <span className="text-lg font-black text-foreground">{calories}</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Kalori</span>
                            </div>
                        </div>

                        {/* Ekran 9: YENİ "Ortalama hız / Maks. hız / Rota Türü" bilgi satırı.
                            "Hava" referansta var ama o günün hava durumu DB'de kaydedilmiyor —
                            uydurma bir değer göstermektense DÜRÜSTÇE bu alan atlandı (bkz.
                            design-reference/walk-final/ Ekran 9 notu). */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-card rounded-2xl p-4 flex flex-col gap-1.5 shadow-moffi-card border border-card-border">
                                <Activity className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                <span className="text-lg font-black text-foreground">{avgSpeedKmh.toFixed(1)} <span className="text-xs font-bold text-slate-400">km/h</span></span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ortalama Hız</span>
                            </div>
                            <div className="bg-card rounded-2xl p-4 flex flex-col gap-1.5 shadow-moffi-card border border-card-border">
                                <Zap className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                <span className="text-lg font-black text-foreground">{maxSpeedKmh.toFixed(1)} <span className="text-xs font-bold text-slate-400">km/h</span></span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Maks. Hız</span>
                            </div>
                            <div className="bg-card rounded-2xl p-4 flex items-center gap-3 shadow-moffi-card border border-card-border col-span-2">
                                <Route className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                                <span className="text-[11px] font-black text-foreground flex-1">Serbest Yürüyüş</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rota Türü</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-card rounded-2xl p-3.5 shadow-moffi-card border border-card-border">
                            <Footprints className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                            <span className="text-[12px] font-black text-foreground flex-1">{steps.toLocaleString('tr-TR')} Adım</span>
                        </div>

                        {/* Piyasa araştırması #6: "Fotoğraflar" bölümü SADECE gerçek fotoğraf
                            varsa gösteriliyor — gerçek upload akışı kurulana kadar dürüstçe
                            gizlenmişti (bkz. design-reference/walk-final/ Ekran 9 notu), artık
                            gerçek Storage'dan gelen fotoğraflar burada. */}
                        {walk?.photo_urls && walk.photo_urls.length > 0 && (
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fotoğraflar</span>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {walk.photo_urls.map((url, i) => (
                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden shadow-moffi-card border border-card-border">
                                            <img src={url} alt={`Yürüyüş fotoğrafı ${i + 1}`} className="w-full h-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </main>
    );
}
