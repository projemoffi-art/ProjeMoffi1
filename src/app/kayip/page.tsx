'use client';

// Referans Ekran 1 (liste) ve Ekran 2 (harita) — Kayıp & Bulunan.

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MapPin, Search } from 'lucide-react';
import { PanelHeader } from '@/components/lost/PanelHeader';
import { ListingCard, ToggleRow, KindBadge, listingTitle } from '@/components/lost/LostUI';
import { useSearchArea } from '@/components/lost/useSearchArea';
import { LoadingBlocks, Sheet, PrimaryButton, SoftButton } from '@/components/health/HealthUI';
import { lostService, type LostListing, type Species } from '@/services/lostService';
import { distanceKm, distanceText } from '@/lib/geo';
import { useAuth } from '@/context/AuthContext';
import { cn, showToast } from '@/lib/utils';

const ListingsMap = dynamic(() => import('@/components/lost/ListingsMap'), { ssr: false });
const LocationPicker = dynamic(() => import('@/components/business/LocationPicker'), { ssr: false });

const RADII = [1, 3, 5, 10, 25];
const TIMES: { id: string; label: string; hours: number | null }[] = [
    { id: '24h', label: '24 saat', hours: 24 },
    { id: '7d', label: '7 gün', hours: 24 * 7 },
    { id: '30d', label: '30 gün', hours: 24 * 30 },
    { id: 'all', label: 'Tüm zamanlar', hours: null },
];
const KINDS = [{ id: 'all', label: 'Kayıp ve bulunan' }, { id: 'lost', label: 'Kayıp' }, { id: 'found', label: 'Bulunan' }] as const;

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick} className={cn('h-9 px-3.5 rounded-full text-xs font-bold whitespace-nowrap border shrink-0',
            on ? 'bg-foreground text-background border-foreground' : 'bg-card border-card-border text-secondary')}>{children}</button>
    );
}

export default function LostHomePage() {
    const { user } = useAuth();
    const { area, choose, detectDevice } = useSearchArea();
    const [listings, setListings] = useState<LostListing[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState('');
    const [species, setSpecies] = useState<'all' | Species>('all');
    const [radius, setRadius] = useState(10);
    const [time, setTime] = useState('30d');
    const [kind, setKind] = useState<'all' | 'lost' | 'found'>('all');
    const [view, setView] = useState<'list' | 'map'>('list');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [areaOpen, setAreaOpen] = useState(false);

    useEffect(() => {
        lostService.list().then(setListings).catch(e => setError(e?.message || 'İlanlar yüklenemedi.'));
    }, []);

    const shown = useMemo(() => {
        if (!listings || !area) return [];
        const hours = TIMES.find(t => t.id === time)?.hours ?? null;
        const minTs = hours ? Date.now() - hours * 3600000 : 0;
        const term = q.trim().toLocaleLowerCase('tr-TR');
        return listings
            .map(l => ({ l, km: l.lat != null && l.lng != null ? distanceKm(area, { lat: l.lat, lng: l.lng }) : null }))
            .filter(({ l, km }) =>
                (species === 'all' || l.species === species)
                && (kind === 'all' || l.kind === kind)
                && (km == null || km <= radius)
                && new Date(l.eventAt).getTime() >= minTs
                && (!term || [l.petName, l.breed, l.color, l.locationText, ...l.features].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR').includes(term)))
            .sort((a, b) => (a.l.status === 'active' ? 0 : 1) - (b.l.status === 'active' ? 0 : 1) || (a.km ?? 999) - (b.km ?? 999));
    }, [listings, area, species, kind, radius, time, q]);

    const mine = (listings || []).filter(l => l.isMine && l.status === 'active');
    const selected = shown.find(s => s.l.id === selectedId) || null;

    return (
        <>
            <main className="max-w-2xl mx-auto px-4 pt-[calc(16px+env(safe-area-inset-top,0px))] space-y-3.5">
                <PanelHeader active="lost" subtitle="Kayıp olanları bulalım, birlikte." />

                <label className="flex items-center gap-2 h-11 px-4 rounded-2xl bg-card border border-card-border">
                    <Search className="w-4 h-4 text-secondary shrink-0" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="İlanlarda ara (ad, ırk, renk, yer)"
                        className="flex-1 bg-transparent text-sm font-semibold outline-none" />
                </label>

                <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold min-w-0">
                        <MapPin className="w-4 h-4 text-accent shrink-0" /><span className="truncate">{area?.name || 'Konum alınıyor…'}</span>
                    </span>
                    <button onClick={() => setAreaOpen(true)} className="h-9 px-3.5 rounded-full bg-card border border-card-border text-xs font-bold shrink-0">Konum değiştir</button>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                    {(['all', 'dog', 'cat', 'other'] as const).map(s => (
                        <Chip key={s} on={species === s} onClick={() => setSpecies(s)}>{{ all: 'Tümü', dog: 'Köpek', cat: 'Kedi', other: 'Diğer' }[s]}</Chip>
                    ))}
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                    <Chip on={false} onClick={() => setRadius(RADII[(RADII.indexOf(radius) + 1) % RADII.length])}>{radius} km</Chip>
                    <Chip on={false} onClick={() => setTime(TIMES[(TIMES.findIndex(t => t.id === time) + 1) % TIMES.length].id)}>{TIMES.find(t => t.id === time)?.label}</Chip>
                    <Chip on={false} onClick={() => setKind(KINDS[(KINDS.findIndex(k => k.id === kind) + 1) % KINDS.length].id)}>{KINDS.find(k => k.id === kind)?.label}</Chip>
                    <Chip on={view === 'map'} onClick={() => setView(v => (v === 'list' ? 'map' : 'list'))}>{view === 'list' ? 'Harita' : 'Liste'}</Chip>
                </div>

                {mine.length > 0 && (
                    <Link href={`/kayip/${mine[0].id}/yonet`} className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-3">
                        {mine[0].photos[0] && <img src={mine[0].photos[0]} alt="" className="w-11 h-11 rounded-xl object-cover" />}
                        <span className="flex-1 min-w-0">
                            <span className="block text-sm font-black truncate">İlanın yayında: {listingTitle(mine[0])}</span>
                            <span className="block text-xs font-semibold text-secondary">Görülmeleri ve mesajları buradan takip et</span>
                        </span>
                        <span className="text-xs font-black text-accent">Yönet</span>
                    </Link>
                )}

                {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

                {view === 'list' ? (
                    !listings || !area ? <LoadingBlocks count={3} /> : shown.length === 0 ? (
                        <div className="bg-card border border-card-border rounded-2xl p-6 text-center space-y-1">
                            <div className="text-base font-black">Bu alanda ilan yok</div>
                            <p className="text-sm font-semibold text-secondary">Mesafeyi ya da zaman aralığını genişletmeyi dene.</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {shown.map(({ l, km }) => <ListingCard key={l.id} listing={l} distanceKm={km} />)}
                        </div>
                    )
                ) : area && (
                    <div className="relative h-[58vh] rounded-3xl overflow-hidden border border-card-border">
                        <ListingsMap listings={shown.map(s => s.l)} center={[area.lat, area.lng]} radiusKm={radius}
                            selectedId={selectedId} onSelect={setSelectedId} />
                        {selected && (
                            <Link href={`/kayip/${selected.l.id}`} className="absolute inset-x-3 bottom-3 z-[500] flex items-center gap-3 bg-card border border-card-border rounded-2xl p-2.5 shadow-lg">
                                {selected.l.photos[0] && <img src={selected.l.photos[0]} alt="" className="w-14 h-14 rounded-xl object-cover" />}
                                <span className="flex-1 min-w-0">
                                    <KindBadge listing={selected.l} />
                                    <span className="block text-sm font-black truncate mt-0.5">{listingTitle(selected.l)}</span>
                                    <span className="block text-xs font-semibold text-secondary truncate">{[selected.l.locationText, distanceText(selected.km)].filter(Boolean).join(' · ')}</span>
                                </span>
                            </Link>
                        )}
                    </div>
                )}
                <p className="text-[11px] font-semibold text-secondary text-center">İlanların konumu yaklaşık gösterilir; tam konumu sadece ilan sahibi görür.</p>
            </main>

            <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] z-40 px-4 pointer-events-none">
                <div className="max-w-2xl mx-auto grid grid-cols-2 gap-2.5 pointer-events-auto">
                    <Link href={user ? '/kayip/ilan-ver' : '/'} className="h-12 rounded-2xl bg-accent text-white font-black text-sm flex items-center justify-center shadow-lg">Kayıp ilanı ver</Link>
                    <Link href={user ? '/kayip/buldum' : '/'} className="h-12 rounded-2xl bg-card border border-accent/40 text-accent font-black text-sm flex items-center justify-center shadow-lg">Bir hayvan buldum</Link>
                </div>
            </div>

            {area && <AreaSheet open={areaOpen} onClose={() => setAreaOpen(false)} area={area} onChoose={choose} onDevice={detectDevice} />}
        </>
    );
}

function AreaSheet({ open, onClose, area, onChoose, onDevice }: {
    open: boolean; onClose: () => void; area: { lat: number; lng: number; name: string };
    onChoose: (lat: number, lng: number) => Promise<unknown>; onDevice: () => Promise<unknown>;
}) {
    const { user } = useAuth();
    const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
    const [alerts, setAlerts] = useState<{ enabled: boolean } | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setPoint(null);
        if (user) lostService.alertArea().then(a => setAlerts({ enabled: a.enabled })).catch(() => setAlerts({ enabled: false }));
    }, [open, user]);

    const save = async () => {
        setSaving(true);
        try {
            const p = point || area;
            if (point) await onChoose(point.lat, point.lng);
            if (user && alerts) await lostService.setAlertArea(alerts.enabled, p.lat, p.lng);
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
                    <ToggleRow on={alerts.enabled} onChange={v => setAlerts({ enabled: v })}
                        label="Yakınımda kayıp ilanı olursa haber ver"
                        hint="Bu bölge mahalle düzeyinde kaydedilir; ilan veren kişi seni görmez. İstediğin an kapatabilirsin." />
                </div>
            )}
            <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</PrimaryButton>
        </Sheet>
    );
}
