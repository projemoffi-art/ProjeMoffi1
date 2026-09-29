'use client';

// Sahiplendirme ekranlarının ortak parçaları (design-reference/community-final/sahiplendirme-reference.jpg).

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Heart, MapPin } from 'lucide-react';
import { cn, showToast } from '@/lib/utils';
import { distanceText } from '@/lib/geo';
import { SPECIES_LABEL } from '@/services/lostService';
import { adoptionService, AGE_GROUP_SHORT, APPLICATION_STATUS, type AdoptionListing, type ApplicationStatus } from '@/services/adoptionService';
import { genderLabel } from '@/lib/petIdentity';
import { useAuth } from '@/context/AuthContext';

/** "3 ay · Erkek · Golden Mix" */
export function listingFacts(l: Pick<AdoptionListing, 'ageText' | 'gender' | 'breed' | 'species'>, withBreed = true) {
    return [l.ageText, genderLabel(l.gender), withBreed ? l.breed || SPECIES_LABEL[l.species] : null].filter(Boolean).join(' · ');
}

/** Kartlardaki kısa etiketler: yaş grubu önce, sonra sağlık bilgileri. */
export function listingTags(l: AdoptionListing, max = 3): { label: string; strong?: boolean }[] {
    const tags: { label: string; strong?: boolean }[] = [];
    if (l.ageGroup) tags.push({ label: AGE_GROUP_SHORT[l.ageGroup], strong: true });
    if (l.vaccinated) tags.push({ label: 'Aşılı' });
    if (l.neutered) tags.push({ label: 'Kısırlaştırılmış' });
    if (l.microchipped) tags.push({ label: 'Çipli' });
    if (l.isShelter) tags.push({ label: 'Barınak' });
    return tags.slice(0, max);
}

export function Tag({ label, strong, className }: { label: string; strong?: boolean; className?: string }) {
    return (
        <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-black whitespace-nowrap',
            strong ? 'bg-accent text-white' : 'bg-[#8FD14F]/25 text-[#3F6F12] dark:text-[#B9E68C]', className)}>{label}</span>
    );
}

export function FavoriteButton({ listing, className, onChange }: { listing: AdoptionListing; className?: string; onChange?: (on: boolean) => void }) {
    const { user } = useAuth();
    const router = useRouter();
    const [on, setOn] = useState(listing.isFavorite);
    const [busy, setBusy] = useState(false);
    if (listing.isMine) return null;
    const toggle = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!user) { showToast('Kaydetmek için giriş yapmalısın.', 'AlertCircle', 'text-red-500 font-bold'); router.push('/'); return; }
        if (busy) return;
        setBusy(true);
        const next = !on;
        setOn(next);
        try { await adoptionService.setFavorite(listing.id, next); onChange?.(next); }
        catch (err: any) { setOn(!next); showToast(err?.message || 'Kaydedilemedi.', 'AlertCircle', 'text-red-500 font-bold'); }
        finally { setBusy(false); }
    };
    return (
        <button onClick={toggle} aria-label={on ? 'Kaydedilenlerden çıkar' : 'Kaydet'} aria-pressed={on}
            className={cn('w-9 h-9 rounded-full bg-white/90 dark:bg-black/50 flex items-center justify-center shadow-sm', className)}>
            <Heart className={cn('w-4.5 h-4.5', on ? 'fill-accent text-accent' : 'text-accent')} />
        </button>
    );
}

/** Ekran 1 — iki sütunlu kart. */
export function GridCard({ listing, distanceKm }: { listing: AdoptionListing; distanceKm?: number | null }) {
    const dist = distanceText(distanceKm ?? null);
    return (
        <Link href={`/sahiplendirme/${listing.id}`} className="block bg-card border border-card-border rounded-2xl overflow-hidden hover:border-accent/30 transition-colors">
            <div className="relative aspect-square bg-card-border/40">
                {listing.photos[0]
                    ? <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl">🐾</div>}
                <FavoriteButton listing={listing} className="absolute top-2 right-2" />
                <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                    {listingTags(listing, 2).map(t => <Tag key={t.label} {...t} className={t.strong ? '' : 'bg-white/90 dark:bg-black/60'} />)}
                </div>
            </div>
            <div className="p-2.5 space-y-0.5">
                <div className="text-sm font-black truncate">{listing.petName}</div>
                <div className="text-[11px] font-semibold text-secondary truncate">{listingFacts(listing, false) || SPECIES_LABEL[listing.species]}</div>
                {dist && <div className="text-[11px] font-bold text-secondary inline-flex items-center gap-0.5"><MapPin className="w-3 h-3 text-accent" />{dist}</div>}
                {listing.locationText && <div className="text-[11px] font-semibold text-secondary truncate">{listing.locationText}</div>}
            </div>
        </Link>
    );
}

/** Ekran 3 — liste satırı. */
export function RowCard({ listing, distanceKm }: { listing: AdoptionListing; distanceKm?: number | null }) {
    const dist = distanceText(distanceKm ?? null);
    return (
        <Link href={`/sahiplendirme/${listing.id}`} className="flex gap-3 bg-card border border-card-border rounded-2xl p-2.5 hover:border-accent/30 transition-colors">
            <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-card-border/40">
                {listing.photos[0]
                    ? <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>}
            </div>
            <div className="flex-1 min-w-0 py-0.5 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1">{listingTags(listing, 2).map(t => <Tag key={t.label} {...t} />)}</div>
                    <FavoriteButton listing={listing} className="w-8 h-8 -mt-1 -mr-1 shrink-0 shadow-none bg-transparent dark:bg-transparent" />
                </div>
                <div className="text-base font-black truncate">{listing.petName}</div>
                <div className="text-xs font-semibold text-secondary truncate">{listingFacts(listing)}</div>
                {listing.description && <p className="text-xs font-semibold text-secondary line-clamp-2">{listing.description}</p>}
                {(listing.locationText || dist) && (
                    <div className="text-[11px] font-semibold text-secondary truncate inline-flex items-center gap-1 max-w-full">
                        <MapPin className="w-3 h-3 shrink-0 text-accent" /><span className="truncate">{[listing.locationText, dist].filter(Boolean).join(', ')}</span>
                    </div>
                )}
            </div>
        </Link>
    );
}

export function ApplicationStatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
    const m = APPLICATION_STATUS[status];
    return <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-black whitespace-nowrap', m.tone, className)}>{m.label}</span>;
}

export function ListingStatusBadge({ status }: { status: AdoptionListing['status'] }) {
    const m = {
        active: ['Aktif', 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'],
        paused: ['Durduruldu', 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'],
        adopted: ['Sahiplendirildi', 'bg-accent/10 text-accent'],
        closed: ['Kapandı', 'bg-stone-200 text-stone-700 dark:bg-white/10 dark:text-stone-300'],
        removed: ['Kaldırıldı', 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200'],
    }[status];
    return <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-black whitespace-nowrap', m[1])}>{m[0]}</span>;
}

/** Onay kutusu satırı (Ekran 5 ve 10). */
export function CheckRow({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
    return (
        <button type="button" role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)} className="w-full flex items-center gap-3 py-2 text-left">
            <span className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0',
                checked ? 'bg-accent border-accent text-white' : 'border-card-border bg-card')}>
                {checked && <Check className="w-3.5 h-3.5" />}
            </span>
            <span className="flex-1">
                <span className="block text-sm font-bold">{label}</span>
                {hint && <span className="block text-[11px] font-semibold text-secondary">{hint}</span>}
            </span>
        </button>
    );
}

/** Sayfadaki gizli QRCodeCanvas'ı PNG olarak indirir. */
export function downloadQr(canvasId: string, fileName: string) {
    const c = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = fileName;
    a.click();
}

/** Başvuru ve ilan paylaşımı için ortak paylaş fonksiyonu. */
export async function shareListing(l: Pick<AdoptionListing, 'id' | 'petName'>) {
    const url = `${window.location.origin}/sahiplendirme/${l.id}`;
    try {
        if (navigator.share) await navigator.share({ title: `${l.petName} yuva arıyor`, url });
        else { await navigator.clipboard.writeText(url); showToast('Bağlantı kopyalandı.', 'CheckCircle2', 'text-emerald-500 font-bold'); }
        adoptionService.recordEvent(l.id, 'share');
    } catch { /* kullanıcı vazgeçti */ }
}
