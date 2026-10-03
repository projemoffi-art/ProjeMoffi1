"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { haptics } from "@/native/haptics";

// design-reference/walk-final (v2, 14 ekran) görsel dili: krem zemin, beyaz yuvarlak kartlar, mercan ana
// buton, açık mercan ikincil buton, koyu seçili sekme, ince ayraçlı istatistik satırı. Renkler .theme-vet
// (home-final paleti) değişkenlerinden gelir; yürüyüş sayfaları layout'ta bu temaya sarılır.

export function WalkHeader({ title, right, onBack, transparent }: { title: string; right?: ReactNode; onBack?: () => void; transparent?: boolean }) {
    const router = useRouter();
    const back = () => {
        haptics.tap();
        if (onBack) return onBack();
        if (window.history.length > 1) router.back();
        else router.replace('/home');
    };
    return (
        <header className={cn("sticky top-0 z-30 px-4 pt-4 pb-3 grid grid-cols-[44px_1fr_44px] items-center", transparent ? "bg-transparent" : "bg-background/90 backdrop-blur-md")}>
            <button type="button" onClick={back} aria-label="Geri" className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform">
                <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-center text-[17px] font-extrabold text-foreground truncate">{title}</h1>
            <div className="flex justify-end">{right}</div>
        </header>
    );
}

export function SegmentTabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
    return (
        <div className="flex gap-2">
            {tabs.map(t => (
                <button
                    key={t.id}
                    type="button"
                    onClick={() => { haptics.tap(); onChange(t.id); }}
                    className={cn(
                        "flex-1 h-10 rounded-full text-[13px] font-bold transition-colors",
                        value === t.id ? "bg-foreground text-background" : "bg-card text-secondary border border-card-border"
                    )}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}

export function StatRow({ items, size = "md" }: { items: { value: ReactNode; unit?: string; label: string }[]; size?: "md" | "lg" }) {
    return (
        <div className="grid divide-x divide-card-border" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
            {items.map((it, i) => (
                <div key={i} className={cn("flex flex-col items-center justify-center px-1", i === 0 && size === "lg" && "items-start")}>
                    <span className={cn("font-extrabold text-foreground leading-none tracking-tight", size === "lg" && i === 0 ? "text-[30px]" : "text-[20px]")}>
                        {it.value}{it.unit && <span className={cn("font-bold ml-1", size === "lg" && i === 0 ? "text-[17px]" : "text-[13px]")}>{it.unit}</span>}
                    </span>
                    <span className="text-[11px] font-semibold text-secondary mt-1.5">{it.label}</span>
                </div>
            ))}
        </div>
    );
}

export function WalkCard({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn("bg-card rounded-3xl border border-card-border shadow-moffi-card", className)}>{children}</div>;
}

export function PrimaryButton({ children, onClick, disabled, className }: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
    return (
        <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            disabled={disabled}
            className={cn("w-full h-14 rounded-2xl bg-accent text-white text-[15px] font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_24px_-8px_rgba(238,91,61,0.55)] disabled:opacity-60", className)}
        >
            {children}
        </motion.button>
    );
}

export function SoftButton({ children, onClick, disabled, className }: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
    return (
        <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            disabled={disabled}
            className={cn("w-full h-12 rounded-2xl bg-accent/10 text-accent text-[14px] font-extrabold flex items-center justify-center gap-2 disabled:opacity-60", className)}
        >
            {children}
        </motion.button>
    );
}

export function ProgressBar({ percent }: { percent: number }) {
    return (
        <div className="h-2.5 w-full rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden">
            <motion.div
                className="h-full rounded-full bg-emerald-500"
                initial={false}
                animate={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
                transition={{ type: "spring", damping: 24, stiffness: 140 }}
            />
        </div>
    );
}
