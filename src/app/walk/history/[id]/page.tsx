"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Play } from "lucide-react";
import { apiService } from "@/services/apiService";
import { usePet } from "@/context/PetContext";
import { useActivity } from "@/context/ActivityContext";
import { normalizePathToTuples, haversineKm, showToast } from "@/lib/utils";
import { haptics } from "@/native/haptics";
import { formatKm, formatSteps } from "@/lib/walkMetrics";
import { WalkHeader, WalkCard, StatRow, PrimaryButton, SoftButton } from "@/components/walk/WalkUI";

const WalkMap = dynamic(() => import("@/components/walk/WalkMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#EDE7DA] animate-pulse" />,
});

// Ekran 9 (Yürüyüş Detayı). Maks. hız gerçek GPS noktalarından; 25 km/sa üstü anlık değerler köpek
// yürüyüşünde GPS sıçramasıdır, sayılmaz. O günün havası kaydedilmediği için "Hava" alanı gösterilmez.
function maxSpeedKmh(raw: unknown): number {
    if (!Array.isArray(raw)) return 0;
    const pts = raw
        .map((p: any) => (p && typeof p.lat === 'number' && typeof p.lng === 'number' && p.timestamp)
            ? { lat: p.lat, lng: p.lng, t: new Date(p.timestamp).getTime() } : null)
        .filter((p): p is { lat: number; lng: number; t: number } => !!p && Number.isFinite(p.t));
    let max = 0;
    for (let i = 1; i < pts.length; i++) {
        const h = (pts[i].t - pts[i - 1].t) / 3600000;
        if (h <= 0) continue;
        const v = haversineKm([pts[i - 1].lat, pts[i - 1].lng], [pts[i].lat, pts[i].lng]) / h;
        if (v <= 25) max = Math.max(max, v);
    }
    return max;
}

interface WalkDetail {
    id: string;
    pet_id?: string | null;
    distance_meters?: number;
    start_time?: string;
    end_time?: string;
    active_seconds?: number | null;
    steps?: number | null;
    calories_kcal?: number | null;
    path_coordinates?: unknown;
    photo_urls?: string[];
}

export default function WalkDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = typeof params?.id === 'string' ? params.id : '';
    const { pets, activePet } = usePet();
    const { discardWalkRecord } = useActivity();

    const [walk, setWalk] = useState<WalkDetail | null>(null);
    const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
    const [replayIndex, setReplayIndex] = useState<number | null>(null);
    const [confirmRemove, setConfirmRemove] = useState(false);
    const [removing, setRemoving] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        apiService.getWalkById(id).then(data => {
            if (cancelled) return;
            if (data?.id && data.status === 'completed') { setWalk(data); setState('ready'); }
            else setState('missing');
        });
        return () => { cancelled = true; };
    }, [id]);

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

    const path = normalizePathToTuples(walk?.path_coordinates);
    const pet = pets.find(p => String(p.id) === String(walk?.pet_id)) || activePet;
    const distanceKm = Number(walk?.distance_meters || 0) / 1000;
    const activeSeconds = walk?.active_seconds ?? 0;
    const avgSpeed = activeSeconds > 0 ? distanceKm / (activeSeconds / 3600) : 0;
    const maxSpeed = maxSpeedKmh(walk?.path_coordinates);

    const start = walk?.start_time ? new Date(walk.start_time) : null;
    const end = walk?.end_time ? new Date(walk.end_time) : null;
    const dateLabel = start ? start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }) : '';
    const timeRange = start && end
        ? `${start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
        : '';

    const replay = () => {
        if (path.length < 2) return;
        haptics.tap();
        if (timerRef.current) clearInterval(timerRef.current);
        const stepMs = Math.max(30, Math.min(300, 8000 / path.length));
        let i = 0;
        setReplayIndex(0);
        timerRef.current = setInterval(() => {
            i += 1;
            if (i >= path.length - 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                setReplayIndex(null);
                return;
            }
            setReplayIndex(i);
        }, stepMs);
    };

    const remove = async () => {
        if (!walk) return;
        setRemoving(true);
        try {
            await discardWalkRecord(walk.id);
            haptics.success();
            showToast('Yürüyüş geçmişinden kaldırıldı.', 'CheckCircle2', 'text-emerald-500');
            router.replace('/walk/history');
        } catch (e) {
            console.error('Yürüyüş kaldırılamadı:', e);
            showToast('Yürüyüş kaldırılamadı, tekrar dene.', 'AlertCircle', 'text-red-500');
            setRemoving(false);
        }
    };

    const shownPath = replayIndex === null ? path : path.slice(0, replayIndex + 1);

    return (
        <div className="min-h-[100dvh] pb-16">
            <WalkHeader title="Yürüyüş Detayı" />

            {state === 'loading' && <div className="py-32 text-center text-secondary font-semibold text-sm">Yürüyüş getiriliyor...</div>}
            {state === 'missing' && (
                <div className="py-32 px-8 text-center">
                    <div className="text-4xl mb-3">🐾</div>
                    <p className="text-[14px] font-semibold text-secondary">Bu yürüyüş bulunamadı ya da geçmişinden kaldırılmış.</p>
                </div>
            )}

            {state === 'ready' && walk && (
                <div className="px-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-accent/10 flex items-center justify-center shrink-0">
                            {pet?.avatar || pet?.image ? <img src={pet.avatar || pet.image} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">🐾</span>}
                        </div>
                        <div className="min-w-0">
                            <div className="text-[15px] font-extrabold capitalize truncate">{dateLabel}</div>
                            <div className="text-[13px] text-secondary font-semibold">{timeRange}{pet?.name ? ` · ${pet.name}` : ''}</div>
                        </div>
                    </div>

                    <WalkCard className="overflow-hidden">
                        <div className="h-72 relative">
                            {path.length > 0 ? (
                                <>
                                    <WalkMap
                                        key={replayIndex === null ? 'full' : 'replay'}
                                        mode="static"
                                        path={shownPath}
                                        fitPath={path}
                                        current={shownPath[shownPath.length - 1]}
                                        petImage={pet?.avatar || pet?.image}
                                        showRecenter={false}
                                    />
                                    {path.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={replay}
                                            disabled={replayIndex !== null}
                                            className="absolute bottom-3 right-3 z-[500] h-10 pl-3 pr-4 rounded-full bg-white shadow-lg flex items-center gap-1.5 text-[12px] font-bold text-[#201B16] disabled:opacity-70"
                                        >
                                            <Play className="w-3.5 h-3.5 fill-current" /> {replayIndex !== null ? 'Oynatılıyor' : 'Rotayı oynat'}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-secondary text-[13px] font-semibold bg-[#EDE7DA]">Rota kaydı yok</div>
                            )}
                        </div>
                        <div className="px-5 py-4 border-t border-card-border">
                            <StatRow items={[
                                { value: formatKm(distanceKm), unit: 'km', label: 'Mesafe' },
                                { value: Math.round(activeSeconds / 60), unit: 'dk', label: 'Süre' },
                                { value: walk.calories_kcal ?? 0, unit: 'kcal', label: 'Kalori' },
                            ]} />
                        </div>
                    </WalkCard>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Ortalama hız', value: `${avgSpeed.toFixed(1).replace('.', ',')} km/sa` },
                            { label: 'Maks. hız', value: maxSpeed > 0 ? `${maxSpeed.toFixed(1).replace('.', ',')} km/sa` : '—' },
                            { label: 'Adım', value: formatSteps(walk.steps) },
                            { label: 'Rota türü', value: 'Serbest yürüyüş' },
                        ].map(item => (
                            <WalkCard key={item.label} className="px-4 py-3.5">
                                <div className="text-[12px] text-secondary font-semibold">{item.label}</div>
                                <div className="text-[16px] font-extrabold mt-1">{item.value}</div>
                            </WalkCard>
                        ))}
                    </div>

                    {walk.photo_urls && walk.photo_urls.length > 0 && (
                        <section>
                            <h2 className="text-[15px] font-extrabold mb-3">Fotoğraflar</h2>
                            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                                {walk.photo_urls.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-card-border">
                                        <img src={url} alt={`Yürüyüş fotoğrafı ${i + 1}`} className="w-full h-full object-cover" />
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}

                    <button type="button" onClick={() => { haptics.tap(); setConfirmRemove(true); }} className="w-full py-3 text-[13px] font-bold text-secondary">
                        Bu yürüyüşü geçmişten kaldır
                    </button>
                </div>
            )}

            <AnimatePresence>
                {confirmRemove && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/45 flex items-end" onClick={() => !removing && setConfirmRemove(false)}>
                        <motion.div
                            initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
                            onClick={e => e.stopPropagation()}
                            className="theme-vet w-full bg-card text-foreground rounded-t-[28px] px-6 pt-7 pb-[max(24px,env(safe-area-inset-bottom))]"
                        >
                            <h3 className="text-[19px] font-extrabold text-center mb-2">Yürüyüş kaldırılsın mı?</h3>
                            <p className="text-[13px] text-secondary text-center mb-6">Geçmişinden, istatistiklerinden ve sıralamadan çıkar. Bu işlem geri alınamaz.</p>
                            <div className="space-y-2.5">
                                <PrimaryButton onClick={remove} disabled={removing}>{removing ? 'Kaldırılıyor...' : 'Kaldır'}</PrimaryButton>
                                <SoftButton onClick={() => setConfirmRemove(false)} disabled={removing}>Vazgeç</SoftButton>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
