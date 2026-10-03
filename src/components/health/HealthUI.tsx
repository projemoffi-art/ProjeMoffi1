'use client';

// Sağlık Karnesi ekranlarının ortak parçaları (design-reference/health-final).

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity, Bell, ChevronLeft, ClipboardList, FileText, Fingerprint, Pill, Scale, ShieldAlert, ShieldCheck,
    Stethoscope, Syringe, User, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DueStatus } from '@/lib/health/derive';

export type HealthModule =
    | 'pasaport' | 'kimlik' | 'karne' | 'asilar' | 'parazit' | 'ilaclar' | 'kilo' | 'muayeneler' | 'belgeler' | 'acil' | 'zaman';

export const MODULES: Record<HealthModule, { label: string; href: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
    pasaport:   { label: 'Pasaport',       href: '/pasaport',          icon: Fingerprint,   tone: 'bg-stone-200 text-stone-700 dark:bg-stone-500/20 dark:text-stone-200' },
    kimlik:     { label: 'Kimlik',         href: '/pasaport/kimlik',   icon: User,          tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' },
    karne:      { label: 'Sağlık Özeti',   href: '/health/karne',      icon: ClipboardList, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
    asilar:     { label: 'Aşılar',         href: '/health/asilar',     icon: Syringe,       tone: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300' },
    parazit:    { label: 'Parazit',        href: '/health/parazit',    icon: ShieldCheck,   tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
    ilaclar:    { label: 'İlaçlar',        href: '/health/ilaclar',    icon: Pill,          tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' },
    kilo:       { label: 'Kilo',           href: '/health/kilo',       icon: Scale,         tone: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-300' },
    muayeneler: { label: 'Muayeneler',     href: '/health/muayeneler', icon: Stethoscope,   tone: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300' },
    belgeler:   { label: 'Belgeler',       href: '/health/belgeler',   icon: FileText,      tone: 'bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300' },
    acil:       { label: 'Acil Bilgiler',  href: '/health/acil',       icon: ShieldAlert,   tone: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' },
    zaman:      { label: 'Zaman Çizelgesi', href: '/health/zaman',     icon: Activity,      tone: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
};

export function ModuleIcon({ module, size = 'md' }: { module: HealthModule; size?: 'sm' | 'md' | 'lg' }) {
    const m = MODULES[module];
    const box = size === 'lg' ? 'w-14 h-14 rounded-2xl' : size === 'sm' ? 'w-9 h-9 rounded-xl' : 'w-11 h-11 rounded-xl';
    const icon = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4.5 h-4.5' : 'w-5.5 h-5.5';
    return (
        <span className={cn('flex items-center justify-center shrink-0', box, m.tone)}>
            <m.icon className={icon} />
        </span>
    );
}

/**
 * Geri: kullanıcıyı GELDİĞİ yere götürür (profilden açtıysa profile, ana sayfadan açtıysa ana sayfaya).
 * backHref sadece sayfa doğrudan açıldığında (bildirim/e-posta bağlantısı, yeni sekme) kullanılır.
 * Önceden backHref'e router.push yapılıyordu: geçmişe yeni kayıt eklendiği için sayfalar arasında
 * geri tuşu döngüye giriyordu.
 */
export function useSmartBack(fallback = '/home') {
    const router = useRouter();
    return React.useCallback(() => {
        if (typeof window !== 'undefined' && window.history.length > 1) router.back();
        else router.replace(fallback);
    }, [router, fallback]);
}

export function HealthHeader({ title, backHref, action }: { title: string; backHref?: string; action?: React.ReactNode }) {
    const goBack = useSmartBack(backHref || '/health');
    return (
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-3">
            <div className="max-w-2xl mx-auto grid grid-cols-[40px_1fr_auto] items-center gap-2">
                <button
                    onClick={goBack}
                    aria-label="Geri"
                    className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-black text-center truncate">{title}</h1>
                <div className="min-w-10 flex justify-end">{action}</div>
            </div>
        </header>
    );
}

export function AddButton({ onClick, label = 'Ekle' }: { onClick: () => void; label?: string }) {
    return (
        <button onClick={onClick} className="h-10 px-2 text-accent font-black text-sm flex items-center gap-1">
            <span className="text-lg leading-none">+</span>{label}
        </button>
    );
}

const STATUS_META: Record<DueStatus, { label: string; cls: string }> = {
    overdue:   { label: 'Gecikti',      cls: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25' },
    due_soon:  { label: 'Yaklaşıyor',   cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25' },
    current:   { label: 'Güncel',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25' },
    done:      { label: 'Uygulandı',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25' },
    planned:   { label: 'Planlandı',    cls: 'bg-card-border/40 text-secondary border-card-border' },
    unplanned: { label: 'Planlanmadı',  cls: 'bg-card-border/40 text-secondary border-card-border' },
};

export function StatusBadge({ status, className }: { status: DueStatus; className?: string }) {
    const m = STATUS_META[status];
    return <span className={cn('px-2 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap', m.cls, className)}>{m.label}</span>;
}

export function HealthCard({ children, className, href, onClick }: { children: React.ReactNode; className?: string; href?: string; onClick?: () => void }) {
    const cls = cn('block bg-card border border-card-border rounded-2xl', (href || onClick) && 'hover:border-accent/30 transition-colors text-left w-full', className);
    if (href) return <Link href={href} className={cls}>{children}</Link>;
    if (onClick) return <button onClick={onClick} className={cls}>{children}</button>;
    return <div className={cls}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between mb-2.5 mt-1">
            <h2 className="text-base font-black">{children}</h2>
            {action}
        </div>
    );
}

export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
    return (
        <div className="py-12 px-6 text-center">
            {icon && <div className="flex justify-center mb-3">{icon}</div>}
            <h3 className="text-base font-black mb-1">{title}</h3>
            {text && <p className="text-sm font-semibold text-secondary max-w-xs mx-auto">{text}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function PrimaryButton({ children, onClick, disabled, type = 'button', className }: {
    children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'; className?: string;
}) {
    return (
        <button type={type} onClick={onClick} disabled={disabled}
            className={cn('w-full h-12 rounded-2xl bg-accent text-white font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2', className)}>
            {children}
        </button>
    );
}

export function SoftButton({ children, onClick, href, className }: { children: React.ReactNode; onClick?: () => void; href?: string; className?: string }) {
    const cls = cn('w-full h-12 rounded-2xl border border-accent/30 bg-accent/5 text-accent font-black text-sm flex items-center justify-center gap-2', className);
    if (href) return <Link href={href} className={cls}>{children}</Link>;
    return <button onClick={onClick} className={cls}>{children}</button>;
}

export function FilterTabs<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
    return (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist">
            {options.map(o => (
                <button key={o.id} role="tab" aria-selected={value === o.id} onClick={() => onChange(o.id)}
                    className={cn('px-4 h-9 rounded-full whitespace-nowrap text-xs font-bold shrink-0 transition-colors',
                        value === o.id ? 'bg-foreground text-background' : 'bg-card border border-card-border text-secondary')}>
                    {o.label}
                </button>
            ))}
        </div>
    );
}

/** layer='top': her yerden açılabilen ortak pencereler (paylaşım) için; açık çekmece ve tam ekran panellerin (z ≤ 9999) üstünde açılır. */
export function Sheet({ open, onClose, title, children, layer = 'page' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; layer?: 'page' | 'top' }) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
                        className={cn('fixed inset-0 bg-black/50 backdrop-blur-sm', layer === 'top' ? 'z-[10000]' : 'z-[3100]')} />
                    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                        className={cn('theme-vet fixed bottom-0 inset-x-0 bg-background text-foreground rounded-t-3xl border-t border-card-border max-h-[90vh] flex flex-col', layer === 'top' ? 'z-[10001]' : 'z-[3101]')}
                        role="dialog" aria-label={title}>
                        <div className="flex items-center justify-between px-5 pt-5 pb-3 max-w-2xl w-full mx-auto">
                            <h3 className="text-lg font-black">{title}</h3>
                            <button onClick={onClose} aria-label="Kapat" className="w-9 h-9 rounded-full bg-card border border-card-border flex items-center justify-center">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="overflow-y-auto px-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] max-w-2xl w-full mx-auto space-y-4">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

const fieldCls = 'w-full h-12 px-4 rounded-2xl bg-card border border-card-border text-sm font-semibold text-foreground outline-none focus:border-accent';

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="text-xs font-bold text-secondary mb-1.5 block">{label}</span>
            {children}
            {hint && <span className="text-[11px] font-semibold text-secondary mt-1 block">{hint}</span>}
        </label>
    );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={cn(fieldCls, props.className)} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return <select {...props} className={cn(fieldCls, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea {...props} className={cn(fieldCls, 'h-auto min-h-[88px] py-3', props.className)} />;
}

export function ErrorText({ children }: { children: React.ReactNode }) {
    if (!children) return null;
    return <p className="text-sm font-semibold text-red-600 dark:text-red-400">{children}</p>;
}

export function LoadingBlocks({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-card border border-card-border animate-pulse" />)}
        </div>
    );
}

export function ReminderHint() {
    return (
        <div className="flex items-start gap-3 rounded-2xl bg-accent/5 border border-accent/15 p-4">
            <Bell className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <p className="text-[13px] font-semibold text-secondary leading-relaxed">
                Tarihi yaklaşınca bildirim gönderiyoruz. Tarihi değiştirmek için kayda dokun.
            </p>
        </div>
    );
}
