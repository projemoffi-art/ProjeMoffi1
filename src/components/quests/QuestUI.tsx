'use client';

// Görev Merkezi ortak parçaları — design-reference/quests-final/quests-reference.jpg (Baran onaylı, 2026-10-03):
// krem zemin, beyaz yuvarlak kartlar, mercan vurgu ve hap sekmeler, yeşil "tamam", üstte hayvanın fotoğrafı.
// Renkler .theme-vet (home-final paleti) değişkenlerinden; mavi/indigo yok.

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { haptics } from '@/native/haptics';
import type { DailyQuest } from '@/services/questService';

export function useBack(fallback = '/quests') {
    const router = useRouter();
    return () => {
        haptics.tap();
        if (window.history.length > 1) router.back();
        else router.replace(fallback);
    };
}

export function BackButton({ fallback, onDark }: { fallback?: string; onDark?: boolean }) {
    const back = useBack(fallback);
    return (
        <button type="button" onClick={back} aria-label="Geri"
            className={cn('w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform shrink-0',
                onDark ? 'bg-white/85 text-[#201B16] shadow-sm' : 'bg-card border border-card-border text-foreground')}>
            <ChevronLeft className="w-5 h-5" />
        </button>
    );
}

/** Başlık: geri + ortada büyük başlık (+ açıklama) + sağda isteğe bağlı düğme. */
export function QuestHeader({ title, subtitle, icon, right, fallback }: { title: string; subtitle?: React.ReactNode; icon?: string; right?: React.ReactNode; fallback?: string }) {
    return (
        <header className="px-4 pt-[calc(14px+env(safe-area-inset-top,0px))] pb-2">
            <div className="grid grid-cols-[40px_1fr_40px] items-center">
                <BackButton fallback={fallback} />
                <h1 className="text-center text-[24px] font-extrabold tracking-tight leading-tight text-foreground flex items-center justify-center gap-2">
                    {icon && <span aria-hidden>{icon}</span>}{title}
                </h1>
                <div className="flex justify-end">{right}</div>
            </div>
            {subtitle && <p className="text-center text-[13.5px] font-semibold text-secondary mt-1.5 px-6 leading-snug">{subtitle}</p>}
        </header>
    );
}

/** Mercan dolgulu aktif sekme (referans: Rozet Kasası, Programlar, Birlikte). */
export function PillTabs<T extends string>({ tabs, value, onChange, compact }: { tabs: { id: T; label: string; badge?: number }[]; value: T; onChange: (v: T) => void; compact?: boolean }) {
    return (
        <div className={cn('flex overflow-x-auto no-scrollbar py-1', compact ? 'gap-1.5 px-4' : 'gap-2 px-4')} role="tablist">
            {tabs.map(t => (
                <button key={t.id} type="button" role="tab" aria-selected={value === t.id}
                    onClick={() => { haptics.tap(); onChange(t.id); }}
                    className={cn('rounded-full font-bold whitespace-nowrap shrink-0 transition-colors inline-flex items-center gap-1.5',
                        compact ? 'h-8 px-3 text-[12px]' : 'h-9 px-4 text-[13px]',
                        value === t.id ? 'bg-accent text-white shadow-[0_6px_14px_-8px_rgba(238,91,61,0.9)]' : 'bg-card border border-card-border text-secondary')}>
                    {t.label}
                    {!!t.badge && <span className={cn('min-w-5 h-5 px-1 rounded-full text-[11px] flex items-center justify-center', value === t.id ? 'bg-white/25' : 'bg-accent text-white')}>{t.badge}</span>}
                </button>
            ))}
        </div>
    );
}

const coralStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, #FF7A57 0%, #EE5B3D 100%)',
    boxShadow: '0 12px 24px -12px rgba(238,91,61,0.9), inset 0 1px 0 rgba(255,255,255,0.35)',
};

export function CoralButton({ children, onClick, href, disabled, className, sub }: {
    children: React.ReactNode; onClick?: () => void; href?: string; disabled?: boolean; className?: string; sub?: string;
}) {
    const cls = cn('w-full min-h-12 rounded-2xl text-white text-[15px] font-extrabold flex flex-col items-center justify-center px-4 py-2 disabled:opacity-100', className);
    const inner = <><span className="flex items-center gap-1.5">{children}</span>{sub && <span className="text-[11.5px] font-bold opacity-80">{sub}</span>}</>;
    if (href) return <Link href={href} onClick={() => haptics.tap()} className={cls} style={coralStyle}>{inner}</Link>;
    return (
        <motion.button type="button" whileTap={disabled ? undefined : { scale: 0.97 }} onClick={() => { if (!disabled) { haptics.tap(); onClick?.(); } }}
            disabled={disabled} className={cn(cls, disabled && 'bg-black/[0.08] dark:bg-white/10 text-secondary')} style={disabled ? undefined : coralStyle}>
            {inner}
        </motion.button>
    );
}

export function QuestCard({ children, className, onClick, href }: { children: React.ReactNode; className?: string; onClick?: () => void; href?: string }) {
    const cls = cn('block w-full text-left bg-card border border-card-border rounded-3xl shadow-[0_8px_24px_-18px_rgba(32,27,22,0.35)]', className);
    if (href) return <Link href={href} className={cls} onClick={() => haptics.tap()}>{children}</Link>;
    if (onClick) return <button type="button" className={cls} onClick={() => { haptics.tap(); onClick(); }}>{children}</button>;
    return <div className={cls}>{children}</div>;
}

/** İnce ilerleme çubuğu; değer metni çubuğun içinde (referans E1) ya da yanında. */
export function ProgressLine({ value, max, tone = 'green', label, className }: { value: number; max: number; tone?: 'green' | 'coral' | 'amber'; label?: string; className?: string }) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    const color = tone === 'green' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-400' : 'bg-accent';
    return (
        <div className={cn('relative h-3.5 w-full rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden', className)}>
            <motion.div className={cn('h-full rounded-full', color)} initial={false} animate={{ width: `${Math.max(pct, pct > 0 ? 6 : 0)}%` }}
                transition={{ type: 'spring', damping: 24, stiffness: 140 }} />
            {/* Doluluk azken yazı zemin üstünde koyu, doluyken dolgu üstünde beyaz (okunur kalsın). */}
            {label && <span className={cn('absolute inset-y-0 left-2 flex items-center text-[9.5px] font-black',
                pct >= 45 ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]' : 'text-foreground/70')}>{label}</span>}
        </div>
    );
}

/** Dairesel ilerleme halkası (Bugünün görevleri, seviye). */
export function Ring({ value, max, size = 48, stroke = 6, children, tone = '#8FD14F' }: { value: number; max: number; size?: number; stroke?: number; children?: React.ReactNode; tone?: string }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = max > 0 ? Math.min(1, value / max) : 0;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-black/[0.07] dark:text-white/10" />
                <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ duration: 0.8 }} />
            </svg>
            {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
        </div>
    );
}

/** Hayvanın fotoğrafı; yoksa türüne göre sıcak bir yer tutucu. */
export function PetPhoto({ url, species, className }: { url: string | null | undefined; species?: string; className?: string }) {
    if (url) {
        // eslint-disable-next-line @next/next/no-img-element -- kullanıcı yüklemesi, depodan doğrudan
        return <img src={url} alt="" className={cn('object-cover', className)} />;
    }
    return (
        <div className={cn('flex items-center justify-center bg-gradient-to-br from-[#FCE6DF] via-[#FBEFD3] to-[#E7F4D9]', className)} aria-hidden>
            <span className="text-6xl">{species === 'cat' ? '🐈' : species === 'dog' ? '🐕' : '🐾'}</span>
        </div>
    );
}

/** Program/bilgi kartı görseli: renkli zemin + büyük emoji (görsel gelene kadar). */
export function Tile({ emoji, tint, className, size = 'md' }: { emoji: string; tint: string; className?: string; size?: 'sm' | 'md' | 'lg' }) {
    return (
        <div className={cn('flex items-center justify-center rounded-2xl shrink-0', className)} style={{ background: tint }} aria-hidden>
            <span className={size === 'lg' ? 'text-6xl' : size === 'sm' ? 'text-2xl' : 'text-4xl'}>{emoji}</span>
        </div>
    );
}

/** Rozet madalyonu: kazanılmış (renkli) / kilitli (gri + kilit). */
export function Medallion({ icon, earned, size = 64, className }: { icon: string; earned: boolean; size?: number; className?: string }) {
    return (
        <div className={cn('relative rounded-full flex items-center justify-center shrink-0', className)}
            style={{
                width: size, height: size,
                background: earned ? 'radial-gradient(circle at 30% 25%, #FFF6D6 0%, #F7D774 45%, #E7A93A 100%)' : 'radial-gradient(circle at 30% 25%, #F1EEE8 0%, #D9D3C8 100%)',
                boxShadow: earned ? '0 10px 22px -12px rgba(231,169,58,0.9), inset 0 -3px 0 rgba(0,0,0,0.08)' : 'inset 0 -3px 0 rgba(0,0,0,0.06)',
            }}>
            <span style={{ fontSize: size * 0.46, filter: earned ? undefined : 'grayscale(1) opacity(0.45)' }} aria-hidden>{icon}</span>
            {!earned && <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#8A8175] text-white text-[11px] flex items-center justify-center border-2 border-card" aria-hidden>🔒</span>}
        </div>
    );
}

/** Alt sayfa (A1–A4): üstte isteğe bağlı görsel alan (top), kapat düğmesi, kaydırılabilir içerik. */
export function QuestSheet({ open, onClose, title, top, children, footer }: {
    open: boolean; onClose: () => void; title: string; top?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode;
}) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
                        className="fixed inset-0 z-[6500] bg-black/45 backdrop-blur-[2px]" />
                    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                        role="dialog" aria-label={title}
                        className="theme-vet fixed bottom-0 inset-x-0 z-[6501] mx-auto max-w-lg bg-background text-foreground rounded-t-[28px] max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl">
                        {top ?? (
                            <div className="flex items-center justify-between px-5 pt-5 pb-2">
                                <h2 className="text-[19px] font-extrabold">{title}</h2>
                                <button type="button" onClick={onClose} aria-label="Kapat" className="w-9 h-9 rounded-full bg-card border border-card-border flex items-center justify-center">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <div className="overflow-y-auto px-5 pb-4 flex-1 min-h-0">{children}</div>
                        {footer && <div className="px-5 pt-2 pb-[calc(16px+env(safe-area-inset-bottom,0px))] border-t border-card-border bg-background">{footer}</div>}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export function SheetClose({ onClose, onDark }: { onClose: () => void; onDark?: boolean }) {
    return (
        <button type="button" onClick={onClose} aria-label="Kapat"
            className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', onDark ? 'bg-white/85 text-[#201B16]' : 'bg-card border border-card-border')}>
            <X className="w-4 h-4" />
        </button>
    );
}

export function PawCoinChip({ value, className }: { value: number; className?: string }) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/90 text-[#201B16] text-[13px] font-black shadow-sm', className)}>
            <span aria-hidden>🪙</span>{value.toLocaleString('tr-TR')}
        </span>
    );
}

/** Görevin eylemi: yürüyüş paneli, bakım kaydı ya da bir ekran. */
export type QuestAction = { kind: 'walk' } | { kind: 'care'; care: 'meal' | 'water' | 'play' } | { kind: 'link'; href: string };
export function questAction(q: Pick<DailyQuest, 'route'>): QuestAction {
    if (q.route === 'walk') return { kind: 'walk' };
    if (q.route.startsWith('care:')) return { kind: 'care', care: q.route.slice(5) as 'meal' | 'water' | 'play' };
    return { kind: 'link', href: q.route };
}

/** Görev ilerlemesini insan diliyle yaz: "3,2 / 5 km", "1 / 2 öğün". */
export function progressText(q: Pick<DailyQuest, 'progress' | 'target' | 'unit'>) {
    const fmt = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
    return `${fmt(q.progress)} / ${fmt(q.target)} ${q.unit}`.trim();
}

/** Görevin kategorisine göre ikon zemini (referans: yeşil yürüyüş, mercan beslenme, mavi yerine turkuaz-yeşil su). */
export const QUEST_TINT: Record<string, string> = {
    hareket: '#DFF3EA', bakim: '#FCE6DF', saglik: '#F9E1E8', egitim: '#FBEFD3', ani: '#F3EBDD', sosyal: '#F9E1E8',
};

export function DayName({ date }: { date: string }) {
    return <>{new Date(date + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'short' })}</>;
}
