'use client';

// Ana sayfanın ortak yazı tipleri ve küçük parçaları (design-reference/home-final).
// Renkler .theme-vet kapsamındaki değişkenlerden gelir (bg-background, bg-card, text-accent ...);
// koyu temada aynı değişkenlerin sıcak koyu karşılıkları devreye girer.

import { Baloo_2, Nunito } from 'next/font/google';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const baloo = Baloo_2({ subsets: ['latin', 'latin-ext'], weight: ['600', '700', '800'] });
export const nunito = Nunito({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700', '800'] });

export function SectionHeader({ title, subtitle, actionLabel = 'Tümünü Gör', href, onAction }: {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    href?: string;
    onAction?: () => void;
}) {
    const action = href || onAction ? (
        <span className="flex items-center gap-0.5 text-[13px] font-bold text-secondary">
            {actionLabel}
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
        </span>
    ) : null;
    return (
        <div className="flex items-end justify-between gap-3 mb-3 px-0.5">
            <div className="min-w-0">
                <h2 className={`${baloo.className} text-[20px] leading-tight font-bold text-foreground`}>{title}</h2>
                {subtitle && <p className="text-[12.5px] font-semibold text-secondary mt-0.5">{subtitle}</p>}
            </div>
            {action && (href
                ? <Link href={href} className="shrink-0 py-1 active:opacity-60">{action}</Link>
                : <button type="button" onClick={onAction} className="shrink-0 py-1 active:opacity-60">{action}</button>)}
        </div>
    );
}

/** Yüklenirken kartın yerini tutan sade iskelet. */
export function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse rounded-2xl bg-foreground/[0.06] ${className}`} />;
}

/** Kaydırmalı listelerde gerçek konuma bağlı nokta göstergesi. */
export function ScrollDots({ count, active }: { count: number; active: number }) {
    if (count < 2) return null;
    return (
        <div className="flex justify-center gap-1.5 pt-3" aria-hidden>
            {Array.from({ length: count }).map((_, i) => (
                <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-4 bg-accent' : 'w-1.5 bg-foreground/15'}`}
                />
            ))}
        </div>
    );
}

/** Yatay kaydırmalı bir kabın o an en çok görünen öğesinin sırası. */
export function activeIndexOf(el: HTMLElement, count: number): number {
    if (count < 2) return 0;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return 0;
    return Math.min(count - 1, Math.round((el.scrollLeft / max) * (count - 1)));
}
