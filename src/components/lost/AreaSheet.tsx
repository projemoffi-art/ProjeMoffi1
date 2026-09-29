'use client';

// Kayıp & Bulunan ve Sahiplendirme panelinin ortak "Konum" penceresi: aranan bölge (bu tarayıcıda) ve
// yakın çevre bildirimleri (kayıp / sahiplendirme ayrı onay, mahalle düzeyinde tek bölge).

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import { PrimaryButton, Sheet, SoftButton } from '@/components/health/HealthUI';
import { ToggleRow } from '@/components/lost/LostUI';
import { lostService } from '@/services/lostService';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/lib/utils';

const LocationPicker = dynamic(() => import('@/components/business/LocationPicker'), { ssr: false });

export function AreaSheet({ open, onClose, area, onChoose, onDevice }: {
    open: boolean; onClose: () => void; area: { lat: number; lng: number; name: string };
    onChoose: (lat: number, lng: number) => Promise<unknown>; onDevice: () => Promise<unknown>;
}) {
    const { user } = useAuth();
    const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
    const [alerts, setAlerts] = useState<{ lost: boolean; adoption: boolean } | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setPoint(null);
        if (user) lostService.alertArea().then(a => setAlerts({ lost: a.lost, adoption: a.adoption })).catch(() => setAlerts({ lost: false, adoption: false }));
    }, [open, user]);

    const save = async () => {
        setSaving(true);
        try {
            const p = point || area;
            if (point) await onChoose(point.lat, point.lng);
            if (user && alerts) await lostService.setAlerts(alerts.lost, alerts.adoption, p.lat, p.lng);
            onClose();
        } catch (e: any) {
            showToast(e?.message || 'Kaydedilemedi.', 'AlertCircle', 'text-red-500 font-bold');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet open={open} onClose={onClose} title="Konum">
            <SoftButton onClick={async () => { const r = await onDevice(); if (!r) showToast('Konum alınamadı, tarayıcı iznini kontrol et.', 'AlertCircle', 'text-red-500 font-bold'); else onClose(); }}>
                <MapPin className="w-4 h-4" /> Şu anki konumumu kullan
            </SoftButton>
            <p className="text-xs font-bold text-secondary">ya da haritada bir bölge seç</p>
            <LocationPicker lat={point?.lat ?? area.lat} lng={point?.lng ?? area.lng} fallbackCenter={[area.lat, area.lng]} onChange={(lat, lng) => setPoint({ lat, lng })} />
            {user && alerts && (
                <div className="bg-card border border-card-border rounded-2xl px-4 py-2">
                    <ToggleRow on={alerts.lost} onChange={v => setAlerts(a => a && { ...a, lost: v })}
                        label="Yakınımda kayıp ilanı olursa haber ver" />
                    <ToggleRow on={alerts.adoption} onChange={v => setAlerts(a => a && { ...a, adoption: v })}
                        label="Yakınımda sahiplendirme ilanı olursa haber ver" />
                    <p className="text-[11px] font-semibold text-secondary pb-1">
                        Bölge mahalle düzeyinde kaydedilir; ilan veren kişi seni görmez. İstediğin an kapatabilirsin.
                    </p>
                </div>
            )}
            <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</PrimaryButton>
        </Sheet>
    );
}
