'use client';

// Kayıp & Bulunan ekranlarının ortak parçaları (design-reference/community-final/kayip-bulunan-reference.jpg).

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Clock, MapPin, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { distanceText, shortAddress } from '@/lib/geo';
import { SPECIES_LABEL, type LostListing } from '@/services/lostService';
import { genderLabel } from '@/lib/petIdentity';

const LocationPicker = dynamic(() => import('@/components/business/LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-64 w-full rounded-2xl bg-card border border-card-border animate-pulse" />,
});

export function KindBadge({ listing, className }: { listing: Pick<LostListing, 'kind' | 'status' | 'resolution'>; className?: string }) {
    const resolved = listing.status === 'resolved';
    const label = resolved ? (listing.resolution === 'reunited' ? 'KAVUŞTU' : 'KAPANDI') : listing.kind === 'lost' ? 'KAYIP' : 'BULUNAN';
    return (
        <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-black text-white',
            resolved ? 'bg-stone-500' : listing.kind === 'lost' ? 'bg-accent' : 'bg-emerald-600', className)}>
            {label}
        </span>
    );
}

export function eventTimeText(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · '
        + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function relativeTime(iso: string) {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'şimdi';
    if (mins < 60) return `${mins} dk önce`;
    const h = Math.round(mins / 60);
    if (h < 24) return `${h} saat önce`;
    const d = Math.round(h / 24);
    return d < 30 ? `${d} gün önce` : new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export function listingTitle(l: Pick<LostListing, 'petName' | 'species' | 'kind'>) {
    return l.petName || (l.kind === 'found' ? `Bulunan ${SPECIES_LABEL[l.species].toLocaleLowerCase('tr-TR')}` : SPECIES_LABEL[l.species]);
}

export function ListingCard({ listing, distanceKm }: { listing: LostListing; distanceKm?: number | null }) {
    const dist = distanceText(distanceKm ?? null);
    return (
        <Link href={`/kayip/${listing.id}`} className="flex gap-3 bg-card border border-card-border rounded-2xl p-2.5 hover:border-accent/30 transition-colors">
            <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-card-border/40">
                {listing.photos[0]
                    ? <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>}
                <KindBadge listing={listing} className="absolute top-1.5 left-1.5" />
            </div>
            <div className="flex-1 min-w-0 py-0.5 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="text-base font-black truncate">{listingTitle(listing)}</div>
                    {dist && <span className="text-[11px] font-bold text-secondary shrink-0 inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{dist}</span>}
                </div>
                <div className="text-xs font-semibold text-secondary truncate">
                    {[listing.breed || SPECIES_LABEL[listing.species], genderLabel(listing.gender)].filter(Boolean).join(' · ')}
                </div>
                {listing.locationText && (
                    <div className="text-xs font-semibold text-secondary truncate inline-flex items-center gap-1 max-w-full">
                        <MapPin className="w-3 h-3 shrink-0 text-accent" /><span className="truncate">{listing.locationText}</span>
                    </div>
                )}
                <div className="text-xs font-semibold text-secondary inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />{eventTimeText(listing.eventAt)}
                </div>
                {listing.rewardEnabled && listing.rewardAmount ? (
                    <div className="text-[11px] font-black text-amber-700 dark:text-amber-300">Ödül: {listing.rewardAmount.toLocaleString('tr-TR')} TL</div>
                ) : null}
            </div>
        </Link>
    );
}

/** Sihirbaz üst çubuğu: 1 Hayvan · 2 Zaman · 3 Detay · 4 İletişim. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
    return (
        <div className="flex items-start justify-between gap-1 px-2">
            {steps.map((s, i) => {
                const n = i + 1;
                const done = n < current, on = n === current;
                return (
                    <div key={s} className="flex-1 flex flex-col items-center gap-1 relative">
                        {i > 0 && <span className={cn('absolute top-3.5 right-1/2 w-full h-0.5 -z-0', n <= current ? 'bg-accent/60' : 'bg-card-border')} />}
                        <span className={cn('relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2',
                            on ? 'bg-accent border-accent text-white' : done ? 'bg-accent/15 border-accent/40 text-accent' : 'bg-card border-card-border text-secondary')}>{n}</span>
                        <span className={cn('text-[10px] font-bold', on ? 'text-accent' : 'text-secondary')}>{s}</span>
                    </div>
                );
            })}
        </div>
    );
}

export interface PhotoItem { url?: string; file?: File; preview: string }

/**
 * Henüz yüklenmemiş fotoğrafları sırayı koruyarak yükler (ilk fotoğraf kapak). Dönen `kept` forma geri yazılır:
 * kayıt sunucuda reddedilip tekrar denenirse aynı fotoğraflar yeniden yüklenmez, depoda sahipsiz dosya kalmaz.
 */
export async function uploadPhotoItems(items: PhotoItem[], upload: (files: File[]) => Promise<string[]>): Promise<{ urls: string[]; kept: PhotoItem[] }> {
    const urls: string[] = [];
    const kept: PhotoItem[] = [];
    for (const p of items) {
        const url = p.url || (await upload([p.file!]))[0];
        urls.push(url);
        kept.push({ url, preview: p.preview });
    }
    return { urls, kept };
}

export function PhotoPicker({ items, onChange, max = 6 }: { items: PhotoItem[]; onChange: (items: PhotoItem[]) => void; max?: number }) {
    const ref = useRef<HTMLInputElement>(null);
    const add = (files: FileList | null) => {
        if (!files) return;
        const next = [...items];
        for (const f of Array.from(files)) {
            if (next.length >= max) break;
            if (!f.type.startsWith('image/')) continue;
            next.push({ file: f, preview: URL.createObjectURL(f) });
        }
        onChange(next);
    };
    return (
        <div className="grid grid-cols-3 gap-2">
            {items.map((p, i) => (
                <div key={p.preview + i} className="relative aspect-square rounded-xl overflow-hidden bg-card-border/40">
                    <img src={p.preview} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Fotoğrafı kaldır"
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center">
                        <X className="w-3.5 h-3.5" />
                    </button>
                    {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] font-black bg-black/60 text-white px-1.5 py-0.5 rounded">Kapak</span>}
                </div>
            ))}
            {items.length < max && (
                <button type="button" onClick={() => ref.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-card-border flex flex-col items-center justify-center text-secondary gap-1">
                    <Plus className="w-5 h-5" /><span className="text-[10px] font-bold">Fotoğraf ekle</span>
                </button>
            )}
            <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={e => { add(e.target.files); e.target.value = ''; }} />
        </div>
    );
}

export function ChipInput({ values, onChange, suggestions, placeholder, max = 12 }: {
    values: string[]; onChange: (v: string[]) => void; suggestions?: string[]; placeholder: string; max?: number;
}) {
    const [text, setText] = useState('');
    const add = (v: string) => {
        const t = v.trim();
        if (!t || values.includes(t) || values.length >= max) return;
        onChange([...values, t]);
        setText('');
    };
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
                {values.map(v => (
                    <span key={v} className="inline-flex items-center gap-1 px-2.5 h-8 rounded-full bg-accent/10 border border-accent/25 text-xs font-bold">
                        {v}
                        <button type="button" onClick={() => onChange(values.filter(x => x !== v))} aria-label={`${v} kaldır`}><X className="w-3 h-3" /></button>
                    </span>
                ))}
                {(suggestions || []).filter(s => !values.includes(s)).slice(0, 6).map(s => (
                    <button key={s} type="button" onClick={() => add(s)}
                        className="px-2.5 h-8 rounded-full bg-card border border-card-border text-xs font-bold text-secondary">+ {s}</button>
                ))}
            </div>
            <input value={text} onChange={e => setText(e.target.value)} placeholder={placeholder} maxLength={40}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(text); } }}
                onBlur={() => add(text)}
                className="w-full h-11 px-4 rounded-2xl bg-card border border-card-border text-sm font-semibold outline-none focus:border-accent" />
        </div>
    );
}

/** Haritaya dokunarak konum seçimi + kısa adres (tam konum sadece sahibine görünür). */
export function LocationField({ lat, lng, address, fallback, onChange }: {
    lat: number | null; lng: number | null; address: string; fallback: [number, number];
    onChange: (v: { lat: number; lng: number; address: string }) => void;
}) {
    const [resolving, setResolving] = useState(false);
    const pick = async (la: number, ln: number) => {
        onChange({ lat: la, lng: ln, address });
        setResolving(true);
        const a = await shortAddress(la, ln);
        setResolving(false);
        onChange({ lat: la, lng: ln, address: a || address });
    };
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 h-12 px-4 rounded-2xl bg-card border border-card-border">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <input value={address} onChange={e => lat != null && lng != null && onChange({ lat, lng, address: e.target.value })}
                    placeholder={lat == null ? 'Haritada bir nokta seç' : 'Adres'} disabled={lat == null}
                    className="flex-1 bg-transparent text-sm font-semibold outline-none disabled:opacity-60" />
                {resolving && <span className="text-[11px] font-bold text-secondary">bulunuyor…</span>}
            </div>
            <LocationPicker lat={lat} lng={lng} fallbackCenter={fallback} onChange={pick} />
            <p className="text-[11px] font-semibold text-secondary">Haritaya dokun ya da iğneyi sürükle.</p>
        </div>
    );
}

export function RadioRow({ checked, onClick, label, hint }: { checked: boolean; onClick: () => void; label: string; hint?: string }) {
    return (
        <button type="button" onClick={onClick} role="radio" aria-checked={checked}
            className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left', checked ? 'border-accent bg-accent/5' : 'border-card-border bg-card')}>
            <span className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0', checked ? 'border-accent' : 'border-card-border')}>
                {checked && <span className="w-2.5 h-2.5 rounded-full bg-accent" />}
            </span>
            <span className="flex-1">
                <span className="block text-sm font-bold">{label}</span>
                {hint && <span className="block text-[11px] font-semibold text-secondary">{hint}</span>}
            </span>
        </button>
    );
}

export function ToggleRow({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
    return (
        <button type="button" onClick={() => onChange(!on)} role="switch" aria-checked={on} className="w-full flex items-center gap-3 py-2 text-left">
            <span className="flex-1">
                <span className="block text-sm font-bold">{label}</span>
                {hint && <span className="block text-[11px] font-semibold text-secondary">{hint}</span>}
            </span>
            <span className={cn('w-11 h-6 rounded-full p-0.5 transition-colors shrink-0', on ? 'bg-accent' : 'bg-card-border')}>
                <span className={cn('block w-5 h-5 rounded-full bg-white transition-transform', on ? 'translate-x-5' : 'translate-x-0')} />
            </span>
        </button>
    );
}

/** Yerel saat → datetime-local değeri ve geri. */
export function toLocalInput(d: Date) {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
