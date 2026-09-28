'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Heart, ShieldAlert, ShieldCheck, Smile, Star, Stethoscope, Syringe } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { cn, showToast } from '@/lib/utils';

// Referans (design-reference/vet-final) Ekran 2, 3, 11 ve 12 aynı klinik kartını kullanır;
// bu dosya o kartın ve ortak parçaların tek kaynağıdır.

export function useFavoriteClinics() {
    const [ids, setIds] = useState<Set<string>>(new Set());
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        apiService.getFavoriteClinicIds()
            .then(list => setIds(new Set(list)))
            .catch(() => setIds(new Set()))
            .finally(() => setLoaded(true));
    }, []);

    const toggle = useCallback(async (clinicId: string) => {
        const next = !ids.has(clinicId);
        setIds(prev => {
            const copy = new Set(prev);
            if (next) copy.add(clinicId); else copy.delete(clinicId);
            return copy;
        });
        try {
            await apiService.setFavoriteClinic(clinicId, next);
        } catch (err: any) {
            setIds(prev => {
                const copy = new Set(prev);
                if (next) copy.delete(clinicId); else copy.add(clinicId);
                return copy;
            });
            showToast(err?.message || 'Favori güncellenemedi.', 'AlertCircle', 'text-red-500 font-bold');
        }
    }, [ids]);

    return { favoriteIds: ids, isFavorite: (id: string) => ids.has(id), toggleFavorite: toggle, loaded };
}

export function formatDistance(km?: number | null) {
    if (km == null || km >= 999999 || !Number.isFinite(km)) return null;
    const walkMin = Math.max(1, Math.round((km / 4.8) * 60));
    const dist = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
    return walkMin <= 60 ? `${dist} · ${walkMin} dk yürüme` : dist;
}

export function openStatusText(c: { isOpenNow?: boolean; closesAt?: string | null; opensAt?: string | null }) {
    if (c.isOpenNow) return c.closesAt ? `Açık · ${c.closesAt}'e kadar` : 'Açık';
    return c.opensAt ? `Kapalı · ${c.opensAt}'de açılıyor` : 'Kapalı';
}

export function directionsUrl(c: { name?: string; address?: string; location?: { lat: number; lng: number } | null }) {
    if (c.location) return `https://www.google.com/maps/dir/?api=1&destination=${c.location.lat},${c.location.lng}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([c.name, c.address].filter(Boolean).join(' '))}`;
}

interface ClinicCardProps {
    clinic: any;
    onOpen: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
    emphasizeDistance?: boolean;
    index?: number;
}

export function ClinicCard({ clinic, onOpen, isFavorite, onToggleFavorite, emphasizeDistance, index = 0 }: ClinicCardProps) {
    const distance = formatDistance(clinic.calculated_distance);
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index, 8) * 0.04 }}
            onClick={onOpen}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter') onOpen(); }}
            className="bg-card rounded-2xl p-3 border border-card-border shadow-sm dark:shadow-none flex items-center gap-3 cursor-pointer transition-colors hover:border-accent/30 focus-visible:outline-2 focus-visible:outline-accent"
        >
            <div className="w-[72px] h-[72px] rounded-xl overflow-hidden border border-card-border shrink-0 bg-card-border/40">
                {clinic.imageUrl ? (
                    <img src={clinic.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-black text-secondary">
                        {(clinic.name || 'K').charAt(0).toLocaleUpperCase('tr-TR')}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-foreground text-sm tracking-tight truncate">{clinic.name}</h3>
                    {clinic.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" aria-label="Moffi onaylı" />}
                </div>
                <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[11px] font-black text-foreground">{clinic.reviewCount > 0 ? clinic.rating : 'Yeni'}</span>
                    {clinic.reviewCount > 0 && <span className="text-[11px] font-semibold text-secondary">({clinic.reviewCount})</span>}
                </div>
                {distance && (
                    <div className={cn("text-[11px] mt-0.5 truncate", emphasizeDistance ? "font-black text-foreground" : "font-semibold text-secondary")}>{distance}</div>
                )}
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", clinic.isOpenNow ? "bg-accent-secondary" : "bg-secondary/40")} />
                    <span className={cn("text-[11px] font-semibold truncate", clinic.isOpenNow ? "text-accent-secondary" : "text-secondary")}>{openStatusText(clinic)}</span>
                </div>
            </div>

            {onToggleFavorite ? (
                <button
                    type="button"
                    aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                    aria-pressed={isFavorite}
                    onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:bg-card-border/50 self-start"
                >
                    <Heart className={cn("w-[18px] h-[18px]", isFavorite ? "fill-accent text-accent" : "text-secondary")} />
                </button>
            ) : (
                <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
            )}
        </motion.div>
    );
}

export function FilterChips<T extends string>({ options, value, onChange, className }: {
    options: { id: T; label: string }[];
    value: T;
    onChange: (id: T) => void;
    className?: string;
}) {
    return (
        <div className={cn("flex gap-2 overflow-x-auto no-scrollbar pb-1", className)} role="tablist">
            {options.map(o => (
                <button
                    key={o.id}
                    role="tab"
                    aria-selected={value === o.id}
                    onClick={() => onChange(o.id)}
                    className={cn(
                        "px-4 py-2 rounded-full whitespace-nowrap font-bold text-xs shrink-0 transition-colors",
                        value === o.id ? "bg-foreground text-background" : "bg-card text-secondary border border-card-border hover:text-foreground"
                    )}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

// Referans Ekran 2/4: kategori başına pastel arka plan. Veteriner dışı türlerde emoji kullanılır.
const VET_ICON: Record<string, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
    muayene: { icon: Stethoscope, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
    acil: { icon: ShieldAlert, tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' },
    asi: { icon: Syringe, tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
    dis: { icon: Smile, tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
};

export function CategoryTile({ shortcut, active, onClick, size = 'md' }: {
    shortcut: { key: string; label: string; icon: string };
    active?: boolean;
    onClick?: () => void;
    size?: 'md' | 'sm';
}) {
    const vet = VET_ICON[shortcut.key];
    const Icon = vet?.icon;
    const box = size === 'md' ? 'w-14 h-14' : 'w-12 h-12';
    return (
        <button type="button" onClick={onClick} aria-pressed={active} className="flex flex-col items-center gap-1.5 min-w-0">
            <div className={cn(box, "rounded-2xl flex items-center justify-center transition-all text-xl",
                vet ? vet.tone : "bg-accent/10 text-accent",
                active && "ring-2 ring-accent ring-offset-2 ring-offset-background")}>
                {Icon ? <Icon className="w-6 h-6" /> : shortcut.icon}
            </div>
            <span className="text-[10px] font-bold text-secondary text-center leading-tight">{shortcut.label}</span>
        </button>
    );
}
