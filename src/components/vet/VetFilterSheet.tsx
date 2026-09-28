'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import turkeyCities from '@/data/turkey_cities.json';

export interface VetFilters {
    maxKm: number | null;
    sort: 'distance' | 'rating';
    openNow: boolean;
    services: string[];
}

export const DEFAULT_VET_FILTERS: VetFilters = { maxKm: null, sort: 'distance', openNow: false, services: [] };

export function countActiveFilters(f: VetFilters) {
    return (f.maxKm != null ? 1 : 0) + (f.sort !== 'distance' ? 1 : 0) + (f.openNow ? 1 : 0) + (f.services.length > 0 ? 1 : 0);
}

const KM_STEPS = [1, 2, 3, 5, 10, 20];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    value: VetFilters;
    onApply: (f: VetFilters) => void;
    serviceOptions: string[];
    province: string;
    district: string;
    onLocationChange: (province: string, district: string) => void;
    hasGps: boolean;
}

// Referans Ekran 13 — Filtreler.
export function VetFilterSheet({ isOpen, onClose, value, onApply, serviceOptions, province, district, onLocationChange, hasGps }: Props) {
    const [draft, setDraft] = useState<VetFilters>(value);
    const [prov, setProv] = useState(province);
    const [dist, setDist] = useState(district);

    useEffect(() => {
        if (!isOpen) return;
        setDraft(value);
        setProv(province);
        setDist(district);
    }, [isOpen]);

    const kmIndex = draft.maxKm == null ? KM_STEPS.length : KM_STEPS.indexOf(draft.maxKm);
    const districts = (turkeyCities as any[]).find(c => c.name === prov)?.districts || [];

    const toggleService = (s: string) => setDraft(d => ({
        ...d,
        services: d.services.includes(s) ? d.services.filter(x => x !== s) : [...d.services, s]
    }));

    const apply = () => {
        if (prov && dist && (prov !== province || dist !== district)) onLocationChange(prov, dist);
        onApply(draft);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[3050]" />
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                        className="fixed bottom-0 inset-x-0 z-[3051] bg-background text-foreground rounded-t-3xl border-t border-card-border max-h-[88vh] flex flex-col"
                        role="dialog"
                        aria-label="Filtreler"
                    >
                        <div className="flex items-center justify-between px-6 pt-6 pb-3">
                            <h3 className="text-lg font-black">Filtreler</h3>
                            <button onClick={onClose} aria-label="Kapat" className="w-8 h-8 rounded-full bg-card border border-card-border flex items-center justify-center"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-6">
                            <div>
                                <label className="text-sm font-black block mb-2">Konum</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <select aria-label="İl" value={prov} onChange={e => { setProv(e.target.value); setDist(''); }} className="h-11 px-3 rounded-xl border border-card-border bg-card text-sm font-semibold">
                                        <option value="" disabled>İl seç</option>
                                        {(turkeyCities as any[]).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                    <select aria-label="İlçe" value={dist} onChange={e => setDist(e.target.value)} disabled={!prov} className="h-11 px-3 rounded-xl border border-card-border bg-card text-sm font-semibold disabled:opacity-50">
                                        <option value="" disabled>İlçe seç</option>
                                        {districts.map((d: any) => <option key={d.name} value={d.name}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="vet-km" className="text-sm font-black">Mesafe</label>
                                    <span className="text-sm font-bold text-accent tabular-nums">{draft.maxKm == null ? 'Sınır yok' : `${draft.maxKm} km'ye kadar`}</span>
                                </div>
                                <input
                                    id="vet-km"
                                    type="range"
                                    min={0}
                                    max={KM_STEPS.length}
                                    step={1}
                                    value={kmIndex}
                                    disabled={!hasGps}
                                    onChange={e => {
                                        const i = Number(e.target.value);
                                        setDraft(d => ({ ...d, maxKm: i >= KM_STEPS.length ? null : KM_STEPS[i] }));
                                    }}
                                    className="w-full accent-[var(--color-accent)] disabled:opacity-40"
                                />
                                <div className="flex justify-between text-[10px] font-semibold text-secondary mt-1">
                                    {KM_STEPS.map(k => <span key={k}>{k} km</span>)}<span>Tümü</span>
                                </div>
                                {!hasGps && <p className="text-[11px] font-semibold text-secondary mt-1">Mesafe filtresi için konum iznine ihtiyaç var.</p>}
                            </div>

                            <div>
                                <label className="text-sm font-black block mb-2">Sıralama</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {([['distance', 'En yakın'], ['rating', 'En yüksek puan']] as const).map(([k, l]) => (
                                        <button key={k} onClick={() => setDraft(d => ({ ...d, sort: k }))}
                                            className={cn("h-11 rounded-xl border text-sm font-bold", draft.sort === k ? "border-accent bg-accent/10 text-accent" : "border-card-border bg-card")}>
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => setDraft(d => ({ ...d, openNow: !d.openNow }))} className="w-full flex items-center justify-between h-12 px-4 rounded-xl border border-card-border bg-card">
                                <span className="text-sm font-bold">Sadece şu an açık olanlar</span>
                                <span className={cn("w-11 h-6 rounded-full p-0.5 transition-colors", draft.openNow ? "bg-accent" : "bg-card-border")}>
                                    <span className={cn("block w-5 h-5 rounded-full bg-white transition-transform", draft.openNow && "translate-x-5")} />
                                </span>
                            </button>

                            {serviceOptions.length > 0 && (
                                <div>
                                    <label className="text-sm font-black block mb-1">Hizmet</label>
                                    <p className="text-[11px] font-semibold text-secondary mb-2">Hiçbiri seçili değilse tüm işletmeler gösterilir.</p>
                                    <div className="divide-y divide-card-border border border-card-border rounded-xl bg-card">
                                        {serviceOptions.map(s => {
                                            const checked = draft.services.includes(s);
                                            return (
                                                <button key={s} onClick={() => toggleService(s)} className="w-full flex items-center gap-3 px-4 h-12 text-left" role="checkbox" aria-checked={checked}>
                                                    <span className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center", checked ? "bg-accent border-accent" : "border-card-border")}>
                                                        {checked && <Check className="w-3.5 h-3.5 text-white" />}
                                                    </span>
                                                    <span className="text-sm font-semibold">{s}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 px-6 pt-3 pb-[calc(20px+env(safe-area-inset-bottom,0px))] border-t border-card-border">
                            <button onClick={() => setDraft(DEFAULT_VET_FILTERS)} className="h-12 rounded-xl border border-accent/40 text-accent font-black text-sm">Temizle</button>
                            <button onClick={apply} className="h-12 rounded-xl bg-accent text-white font-black text-sm">Uygula</button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
