"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { apiService } from "@/services/apiService";

// Piyasa araştırması #4: Strava Beacon tarzı canlı konum paylaşımı — bu sayfa
// BİLEREK tamamen herkese açık (hesap gerekmez, middleware.ts bu rotayı
// auth'a kilitlemiyor). Sadece `walk_beacons` tablosundaki tek-nokta anlık
// konumu okuyor (bkz. apiService.getBeacon) — gerçek GPS geçmişi/rotası
// (`walk_sessions`) hiçbir zaman buradan erişilebilir değil, Faz 10'daki
// gizlilik disiplini bozulmuyor.
const BeaconMap = dynamic(() => import("./BeaconMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-sm font-bold">Harita yükleniyor...</div>
});

interface BeaconData {
    lat: number;
    lng: number;
    petName: string | null;
    updatedAt: string;
    expiresAt: string;
}

function timeAgoLabel(iso: string): string {
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (diffSec < 10) return "az önce";
    if (diffSec < 60) return `${diffSec} saniye önce`;
    return `${Math.floor(diffSec / 60)} dakika önce`;
}

export default function BeaconPage() {
    const params = useParams();
    const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
    const [beacon, setBeacon] = useState<BeaconData | null>(null);
    const [status, setStatus] = useState<'loading' | 'active' | 'expired'>('loading');
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        const poll = async () => {
            const data = await apiService.getBeacon(id);
            if (cancelled) return;
            if (!data) {
                setStatus('expired');
                if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
                return;
            }
            setBeacon(data);
            setStatus('active');
        };

        poll();
        pollRef.current = setInterval(poll, 8000); // Strava Beacon ~15sn'de bir güncelliyor, biz 8sn'de kontrol ediyoruz

        return () => {
            cancelled = true;
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [id]);

    return (
        <main className="h-screen w-full flex flex-col bg-background font-sans">
            <div className="px-5 py-4 bg-card border-b border-card-border flex items-center gap-3">
                <span className="text-2xl">🐾</span>
                <div>
                    <h1 className="text-sm font-black text-foreground">
                        {beacon?.petName ? `${beacon.petName} ile Canlı Konum` : 'Canlı Konum'}
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400">Moffi Konum Paylaşımı</p>
                </div>
            </div>

            <div className="flex-1 relative">
                {status === 'loading' && (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">
                        Konum yükleniyor...
                    </div>
                )}
                {status === 'expired' && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-8 text-center">
                        <span className="text-3xl">⏳</span>
                        <p className="text-sm font-bold text-slate-500">
                            Bu bağlantının süresi doldu ya da yürüyüş sona erdi.
                        </p>
                    </div>
                )}
                {status === 'active' && beacon && (
                    <BeaconMap lat={beacon.lat} lng={beacon.lng} />
                )}
            </div>

            {status === 'active' && beacon && (
                <div className="px-5 py-3 bg-card border-t border-card-border text-center">
                    <span className="text-[11px] font-bold text-slate-400">
                        Son güncelleme: {timeAgoLabel(beacon.updatedAt)}
                    </span>
                </div>
            )}
        </main>
    );
}
