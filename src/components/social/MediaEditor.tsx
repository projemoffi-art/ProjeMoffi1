'use client';

// Referans Ekran 5 — Medya Düzenleme: kırp (orijinal / kare / 4:5), filtre, döndür.
// Önizleme ile kaydedilen dosya aynı işlemden geçer (ne görülürse o paylaşılır). Filtreler piksel düzeyinde
// uygulanır; tarayıcının canvas filtresine (Safari'de eksik) bağlı değildir.

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type Aspect = 'original' | 'square' | 'portrait';
export interface EditState { rotation: 0 | 90 | 180 | 270; aspect: Aspect; filter: FilterId }
export type FilterId = 'none' | 'warm' | 'vivid' | 'soft' | 'mono' | 'cool';

export const DEFAULT_EDIT: EditState = { rotation: 0, aspect: 'original', filter: 'none' };

const FILTERS: { id: FilterId; label: string }[] = [
    { id: 'none', label: 'Yok' }, { id: 'warm', label: 'Sıcak' }, { id: 'vivid', label: 'Canlı' },
    { id: 'soft', label: 'Yumuşak' }, { id: 'cool', label: 'Serin' }, { id: 'mono', label: 'S&B' },
];
const ASPECTS: { id: Aspect; label: string }[] = [{ id: 'original', label: 'Orijinal' }, { id: 'square', label: '1:1' }, { id: 'portrait', label: '4:5' }];
const MAX_SIDE = 2048;

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

function applyFilter(data: Uint8ClampedArray, f: FilterId) {
    if (f === 'none') return;
    const p = {
        warm: { sat: 1.1, con: 1.02, bri: 1.03, sepia: 0.22, r: 1.04, g: 1, b: 0.94 },
        vivid: { sat: 1.35, con: 1.1, bri: 1.02, sepia: 0, r: 1, g: 1, b: 1 },
        soft: { sat: 0.88, con: 0.9, bri: 1.06, sepia: 0.05, r: 1, g: 1, b: 1 },
        cool: { sat: 1.05, con: 1.03, bri: 1.02, sepia: 0, r: 0.94, g: 1, b: 1.08 },
        mono: { sat: 0, con: 1.08, bri: 1.02, sepia: 0, r: 1, g: 1, b: 1 },
    }[f];
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * p.sat; g = gray + (g - gray) * p.sat; b = gray + (b - gray) * p.sat;
        if (p.sepia) {
            const sr = 0.393 * r + 0.769 * g + 0.189 * b, sg = 0.349 * r + 0.686 * g + 0.168 * b, sb = 0.272 * r + 0.534 * g + 0.131 * b;
            r += (sr - r) * p.sepia; g += (sg - g) * p.sepia; b += (sb - b) * p.sepia;
        }
        r = ((r - 128) * p.con + 128) * p.bri * p.r; g = ((g - 128) * p.con + 128) * p.bri * p.g; b = ((b - 128) * p.con + 128) * p.bri * p.b;
        data[i] = r; data[i + 1] = g; data[i + 2] = b;
    }
}

/** Düzenlemeyi uygular ve JPEG olarak döndürür. */
export async function renderEdited(src: string, edit: EditState, maxSide = MAX_SIDE): Promise<Blob> {
    const img = await loadImage(src);
    const turned = edit.rotation === 90 || edit.rotation === 270;
    let w = turned ? img.naturalHeight : img.naturalWidth;
    let h = turned ? img.naturalWidth : img.naturalHeight;
    // Kırpma: merkezden hedef orana
    const target = edit.aspect === 'square' ? 1 : edit.aspect === 'portrait' ? 4 / 5 : w / h;
    let cw = w, ch = h;
    if (w / h > target) cw = Math.round(h * target); else ch = Math.round(w / target);
    const scale = Math.min(1, maxSide / Math.max(cw, ch));
    const out = document.createElement('canvas');
    out.width = Math.round(cw * scale); out.height = Math.round(ch * scale);
    const ctx = out.getContext('2d')!;
    ctx.save();
    ctx.translate(out.width / 2, out.height / 2);
    ctx.rotate((edit.rotation * Math.PI) / 180);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    if (edit.filter !== 'none') {
        const d = ctx.getImageData(0, 0, out.width, out.height);
        applyFilter(d.data, edit.filter);
        ctx.putImageData(d, 0, 0);
    }
    return new Promise((res, rej) => out.toBlob(b => (b ? res(b) : rej(new Error('Görsel işlenemedi.'))), 'image/jpeg', 0.9));
}

type Tool = 'crop' | 'filter' | 'rotate';

export function MediaEditor({ src, value, onChange }: { src: string; value: EditState; onChange: (v: EditState) => void }) {
    const [tool, setTool] = useState<Tool>('crop');
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        let alive = true; let url: string | null = null;
        renderEdited(src, value, 1080).then(b => { if (!alive) return; url = URL.createObjectURL(b); setPreview(url); }).catch(() => setPreview(src));
        return () => { alive = false; if (url) URL.revokeObjectURL(url); };
    }, [src, value.rotation, value.aspect, value.filter]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-3">
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/5] flex items-center justify-center">
                {preview && <img src={preview} alt="" className="max-w-full max-h-full object-contain" />}
                {tool === 'crop' && (
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                        {Array.from({ length: 9 }).map((_, i) => <span key={i} className="border border-white/25" />)}
                    </div>
                )}
            </div>

            {tool === 'crop' && (
                <div className="flex gap-2 justify-center">
                    {ASPECTS.map(a => (
                        <button key={a.id} onClick={() => onChange({ ...value, aspect: a.id })}
                            className={cn('h-9 px-4 rounded-full text-xs font-black border', value.aspect === a.id ? 'bg-foreground text-background border-foreground' : 'bg-card border-card-border text-secondary')}>{a.label}</button>
                    ))}
                </div>
            )}
            {tool === 'filter' && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {FILTERS.map(f => (
                        <button key={f.id} onClick={() => onChange({ ...value, filter: f.id })}
                            className={cn('h-9 px-4 rounded-full text-xs font-black border shrink-0', value.filter === f.id ? 'bg-foreground text-background border-foreground' : 'bg-card border-card-border text-secondary')}>{f.label}</button>
                    ))}
                </div>
            )}
            {tool === 'rotate' && (
                <div className="flex gap-2 justify-center">
                    <button onClick={() => onChange({ ...value, rotation: ((value.rotation + 270) % 360) as EditState['rotation'] })} className="h-9 px-4 rounded-full bg-card border border-card-border text-xs font-black">↺ Sola</button>
                    <button onClick={() => onChange({ ...value, rotation: ((value.rotation + 90) % 360) as EditState['rotation'] })} className="h-9 px-4 rounded-full bg-card border border-card-border text-xs font-black">Sağa ↻</button>
                </div>
            )}

            <div className="grid grid-cols-3 gap-2">
                {([['crop', 'Kırp', '⌗'], ['filter', 'Filtre', '◐'], ['rotate', 'Döndür', '↻']] as const).map(([id, label, icon]) => (
                    <button key={id} onClick={() => setTool(id)}
                        className={cn('h-16 rounded-2xl flex flex-col items-center justify-center gap-1 text-xs font-black',
                            tool === id ? 'bg-accent text-white' : 'bg-card border border-card-border')}>
                        <span className="text-lg leading-none">{icon}</span>{label}
                    </button>
                ))}
            </div>
        </div>
    );
}
