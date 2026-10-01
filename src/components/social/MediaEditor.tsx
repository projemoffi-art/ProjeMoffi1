'use client';

// Referans Ekran 5 — Medya Düzenleme: filtre (kaydırarak ya da şeritten), ayarlar, kırp, döndür.
// Fotoğrafta önizleme ile paylaşılan dosya aynı işlemden geçer (ne görülürse o paylaşılır). Videoda sadece filtre
// seçilir; oynatılırken uygulanır (bkz. lib/mediaFilters).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ADJUST_FIELDS, DEFAULT_ADJUST, MEDIA_FILTERS, applyPixels, filterCss, filterLabel, isDefaultAdjust,
    type Adjust, type FilterId,
} from '@/lib/mediaFilters';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';

export type Aspect = 'original' | 'square' | 'portrait';
export interface EditState { rotation: 0 | 90 | 180 | 270; aspect: Aspect; filter: FilterId; adjust: Adjust }
export const DEFAULT_EDIT: EditState = { rotation: 0, aspect: 'original', filter: 'none', adjust: DEFAULT_ADJUST };
export const isEdited = (e: EditState) => e.rotation !== 0 || e.aspect !== 'original' || e.filter !== 'none' || !isDefaultAdjust(e.adjust);

export interface EditableMedia { key: string; preview: string; isVideo: boolean; edit: EditState }

const ASPECTS: { id: Aspect; label: string }[] = [{ id: 'original', label: 'Orijinal' }, { id: 'square', label: '1:1' }, { id: 'portrait', label: '4:5' }];
const MAX_SIDE = 2048;

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

/** Kırpma + döndürme + filtre + ayarları uygular, tuval döndürür. */
async function renderCanvas(src: string, edit: EditState, maxSide: number): Promise<HTMLCanvasElement> {
    const img = await loadImage(src);
    const turned = edit.rotation === 90 || edit.rotation === 270;
    const w = turned ? img.naturalHeight : img.naturalWidth;
    const h = turned ? img.naturalWidth : img.naturalHeight;
    const target = edit.aspect === 'square' ? 1 : edit.aspect === 'portrait' ? 4 / 5 : w / h;
    let cw = w, ch = h;
    if (w / h > target) cw = Math.round(h * target); else ch = Math.round(w / target);
    const scale = Math.min(1, maxSide / Math.max(cw, ch));
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(cw * scale)); out.height = Math.max(1, Math.round(ch * scale));
    const ctx = out.getContext('2d', { willReadFrequently: true })!;
    ctx.save();
    ctx.translate(out.width / 2, out.height / 2);
    ctx.rotate((edit.rotation * Math.PI) / 180);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    if (edit.filter !== 'none' || !isDefaultAdjust(edit.adjust)) {
        const d = ctx.getImageData(0, 0, out.width, out.height);
        applyPixels(d, edit.filter, edit.adjust);
        ctx.putImageData(d, 0, 0);
    }
    return out;
}

/** Düzenlemeyi uygular ve JPEG olarak döndürür (paylaşılacak dosya). */
export async function renderEdited(src: string, edit: EditState, maxSide = MAX_SIDE): Promise<Blob> {
    const c = await renderCanvas(src, edit, maxSide);
    return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('Görsel işlenemedi.'))), 'image/jpeg', 0.9));
}

/** Filtre şeridi için küçük kare kaynak (fotoğraftan ya da videonun bir karesinden). */
async function thumbSource(item: EditableMedia): Promise<HTMLCanvasElement | null> {
    const S = 132;
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    const draw = (el: CanvasImageSource, w: number, h: number) => {
        const s = Math.min(w, h);
        ctx.drawImage(el, (w - s) / 2, (h - s) / 2, s, s, 0, 0, S, S);
    };
    try {
        if (item.isVideo) {
            const v = document.createElement('video');
            v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = item.preview;
            await new Promise<void>((res, rej) => { v.onloadeddata = () => res(); v.onerror = () => rej(); });
            v.currentTime = Math.min(0.5, (v.duration || 1) / 2);
            await new Promise<void>(res => { v.onseeked = () => res(); setTimeout(res, 1200); });
            draw(v, v.videoWidth, v.videoHeight);
        } else {
            const img = await loadImage(item.preview);
            draw(img, img.naturalWidth, img.naturalHeight);
        }
        return c;
    } catch { return null; }
}

function useFilterThumbs(item: EditableMedia | undefined) {
    const [thumbs, setThumbs] = useState<Record<string, string>>({});
    useEffect(() => {
        if (!item) return;
        let alive = true;
        setThumbs({});
        thumbSource(item).then(base => {
            if (!alive || !base) return;
            const out: Record<string, string> = {};
            for (const f of MEDIA_FILTERS) {
                const c = document.createElement('canvas'); c.width = base.width; c.height = base.height;
                const ctx = c.getContext('2d', { willReadFrequently: true })!;
                ctx.drawImage(base, 0, 0);
                if (f.id !== 'none') { const d = ctx.getImageData(0, 0, c.width, c.height); applyPixels(d, f.id); ctx.putImageData(d, 0, 0); }
                out[f.id] = c.toDataURL('image/jpeg', 0.8);
            }
            setThumbs(out);
        });
        return () => { alive = false; };
    }, [item?.key]); // eslint-disable-line react-hooks/exhaustive-deps
    return thumbs;
}

type Tool = 'filter' | 'adjust' | 'crop' | 'rotate';

export function MediaEditor({ items, index, onIndex, onChange, onApplyAll }: {
    items: EditableMedia[];
    index: number;
    onIndex: (i: number) => void;
    onChange: (i: number, edit: EditState) => void;
    onApplyAll?: (edit: EditState) => void;
}) {
    const item = items[index];
    const value = item?.edit || DEFAULT_EDIT;
    const [tool, setTool] = useState<Tool>('filter');
    const [field, setField] = useState<keyof Adjust>('brightness');
    const [preview, setPreview] = useState<string | null>(null);
    const [flash, setFlash] = useState<string | null>(null);
    const thumbs = useFilterThumbs(item);
    const stripRef = useRef<HTMLDivElement>(null);
    const startX = useRef<number | null>(null);
    const photos = items.filter(i => !i.isVideo).length;

    useEffect(() => { if (item?.isVideo) setTool('filter'); }, [item?.isVideo]);

    // Fotoğraf önizlemesi: değişiklikleri bir kareye toplayıp yeniden çizer.
    const editKey = JSON.stringify(value);
    useEffect(() => {
        if (!item || item.isVideo) { setPreview(null); return; }
        let alive = true; let url: string | null = null;
        const raf = requestAnimationFrame(() => {
            renderCanvas(item.preview, value, 1080).then(c => c.toBlob(b => {
                if (!alive || !b) return;
                url = URL.createObjectURL(b);
                setPreview(prev => { if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev); return url; });
            }, 'image/jpeg', 0.85)).catch(() => setPreview(item.preview));
        });
        return () => { alive = false; cancelAnimationFrame(raf); };
    }, [item?.key, editKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const setFilter = (id: FilterId, announce = false) => {
        if (!item) return;
        onChange(index, { ...value, filter: id });
        haptics.tap();
        if (announce) { setFlash(filterLabel(id)); setTimeout(() => setFlash(f => (f === filterLabel(id) ? null : f)), 900); }
        const el = stripRef.current?.querySelector<HTMLElement>(`[data-filter="${id}"]`);
        el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    };

    const swipe = (dx: number) => {
        if (Math.abs(dx) < 45) return;
        const i = MEDIA_FILTERS.findIndex(f => f.id === value.filter);
        const next = MEDIA_FILTERS[(i + (dx < 0 ? 1 : -1) + MEDIA_FILTERS.length) % MEDIA_FILTERS.length];
        setFilter(next.id, true);
    };

    const fieldDef = useMemo(() => ADJUST_FIELDS.find(f => f.key === field)!, [field]);
    if (!item) return null;

    const tools: [Tool, string, string][] = item.isVideo
        ? [['filter', 'Filtre', '◐']]
        : [['filter', 'Filtre', '◐'], ['adjust', 'Ayarla', '☀'], ['crop', 'Kırp', '⌗'], ['rotate', 'Döndür', '↻']];

    return (
        <div className="space-y-3">
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/5] flex items-center justify-center select-none touch-pan-y"
                onPointerDown={e => { startX.current = e.clientX; }}
                onPointerUp={e => { if (startX.current != null) swipe(e.clientX - startX.current); startX.current = null; }}
                onPointerCancel={() => { startX.current = null; }}>
                {item.isVideo ? (
                    <video src={item.preview} autoPlay muted loop playsInline className="max-w-full max-h-full object-contain"
                        style={{ filter: filterCss(value.filter) }} />
                ) : preview ? (
                    <img src={preview} alt="" draggable={false} className="max-w-full max-h-full object-contain pointer-events-none" />
                ) : null}
                {tool === 'crop' && (
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                        {Array.from({ length: 9 }).map((_, i) => <span key={i} className="border border-white/25" />)}
                    </div>
                )}
                <AnimatePresence>
                    {flash && (
                        <motion.div key={flash} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="px-4 py-2 rounded-full bg-black/55 text-white text-lg font-black backdrop-blur-sm">{flash}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                {tool === 'filter' && (
                    <span className="absolute bottom-2 inset-x-0 text-center text-[11px] font-bold text-white/70 pointer-events-none">← kaydırarak filtre değiştir →</span>
                )}
            </div>

            {items.length > 1 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {items.map((m, i) => (
                        <button key={m.key} onClick={() => onIndex(i)} className={cn('relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2', i === index ? 'border-accent' : 'border-transparent opacity-70')}>
                            {m.isVideo ? <video src={m.preview} muted className="w-full h-full object-cover" /> : <img src={m.preview} alt="" className="w-full h-full object-cover" style={{ filter: filterCss(m.edit.filter) }} />}
                            {isEdited(m.edit) && <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-accent" />}
                        </button>
                    ))}
                </div>
            )}

            {tool === 'filter' && (
                <div ref={stripRef} className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                    {MEDIA_FILTERS.map(f => (
                        <motion.button key={f.id} data-filter={f.id} whileTap={{ scale: 0.92 }} onClick={() => setFilter(f.id)} className="shrink-0 w-[70px] space-y-1">
                            <span className={cn('block w-[70px] h-[70px] rounded-xl overflow-hidden bg-card-border/40 border-2 transition-colors',
                                value.filter === f.id ? 'border-accent' : 'border-transparent')}>
                                {thumbs[f.id] && <img src={thumbs[f.id]} alt="" className="w-full h-full object-cover" />}
                            </span>
                            <span className={cn('block text-[11px] font-black text-center truncate', value.filter === f.id ? 'text-accent' : 'text-secondary')}>{f.label}</span>
                        </motion.button>
                    ))}
                </div>
            )}

            {tool === 'adjust' && (
                <div className="space-y-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {ADJUST_FIELDS.map(f => (
                            <button key={f.key} onClick={() => setField(f.key)}
                                className={cn('h-9 px-3.5 rounded-full text-xs font-black border shrink-0 inline-flex items-center gap-1.5',
                                    field === f.key ? 'bg-foreground text-background border-foreground' : 'bg-card border-card-border text-secondary')}>
                                {f.label}{value.adjust[f.key] !== 0 && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="range" min={fieldDef.min} max={100} step={1} value={value.adjust[field]}
                            onChange={e => onChange(index, { ...value, adjust: { ...value.adjust, [field]: Number(e.target.value) } })}
                            className="flex-1 accent-[var(--color-accent)]" aria-label={fieldDef.label} />
                        <span className="w-10 text-right text-sm font-black tabular-nums">{value.adjust[field] > 0 && fieldDef.min < 0 ? '+' : ''}{value.adjust[field]}</span>
                    </div>
                    {!isDefaultAdjust(value.adjust) && (
                        <button onClick={() => onChange(index, { ...value, adjust: DEFAULT_ADJUST })} className="text-xs font-black text-secondary">Ayarları sıfırla</button>
                    )}
                </div>
            )}

            {tool === 'crop' && (
                <div className="flex gap-2 justify-center">
                    {ASPECTS.map(a => (
                        <button key={a.id} onClick={() => onChange(index, { ...value, aspect: a.id })}
                            className={cn('h-9 px-4 rounded-full text-xs font-black border', value.aspect === a.id ? 'bg-foreground text-background border-foreground' : 'bg-card border-card-border text-secondary')}>{a.label}</button>
                    ))}
                </div>
            )}
            {tool === 'rotate' && (
                <div className="flex gap-2 justify-center">
                    <button onClick={() => onChange(index, { ...value, rotation: ((value.rotation + 270) % 360) as EditState['rotation'] })} className="h-9 px-4 rounded-full bg-card border border-card-border text-xs font-black">↺ Sola</button>
                    <button onClick={() => onChange(index, { ...value, rotation: ((value.rotation + 90) % 360) as EditState['rotation'] })} className="h-9 px-4 rounded-full bg-card border border-card-border text-xs font-black">Sağa ↻</button>
                </div>
            )}

            {onApplyAll && photos > 1 && !item.isVideo && (value.filter !== 'none' || !isDefaultAdjust(value.adjust)) && (
                <button onClick={() => { onApplyAll(value); haptics.success(); }} className="w-full h-10 rounded-2xl bg-card border border-card-border text-xs font-black">
                    Bu efekti tüm fotoğraflara uygula
                </button>
            )}

            <div className={cn('grid gap-2', tools.length === 1 ? 'grid-cols-1' : 'grid-cols-4')}>
                {tools.map(([id, label, icon]) => (
                    <motion.button key={id} whileTap={{ scale: 0.94 }} onClick={() => setTool(id)}
                        className={cn('h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-xs font-black',
                            tool === id ? 'bg-accent text-white' : 'bg-card border border-card-border')}>
                        <span className="text-base leading-none">{icon}</span>{label}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
