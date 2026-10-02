"use client";

import React from "react";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Giriş + ilk kurulum ekranlarının ortak parçaları (design-reference/onboarding-final).
// `theme-vet` sınıfı krem/turuncu-kiremit paletini (--color-accent vb.) verir.

export type Stage = 1 | 2 | 3;
const STAGES = ["Kayıt", "Doğrulama", "Pet Kurulum"];

export function Stepper({ stage }: { stage: Stage }) {
    return (
        <ol className="flex items-start justify-center gap-1 px-4" aria-label="Kurulum adımları">
            {STAGES.map((label, i) => {
                const n = (i + 1) as Stage;
                const done = n < stage;
                const current = n === stage;
                return (
                    <li key={label} className="flex items-start" aria-current={current ? "step" : undefined}>
                        <div className="flex flex-col items-center w-24">
                            <span className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors",
                                done ? "bg-accent-secondary text-white" : current ? "bg-accent text-white" : "bg-card border border-card-border text-secondary",
                            )}>
                                {done ? <Check className="w-4 h-4" strokeWidth={3} /> : n}
                            </span>
                            <span className={cn("mt-1.5 text-[11px] font-semibold", current ? "text-accent" : "text-secondary")}>{label}</span>
                        </div>
                        {i < STAGES.length - 1 && <span className={cn("h-0.5 w-8 mt-3.5 rounded-full", done ? "bg-accent-secondary" : "bg-card-border")} />}
                    </li>
                );
            })}
        </ol>
    );
}

export function ScreenFrame({ title, stage, onBack, footer, children }: {
    title?: string; stage?: Stage; onBack?: () => void; footer?: React.ReactNode; children: React.ReactNode;
}) {
    return (
        <main className="theme-vet min-h-[100dvh] bg-background text-foreground flex flex-col">
            <header className="px-4 pt-[calc(14px+env(safe-area-inset-top,0px))] pb-2">
                <div className="h-10 relative flex items-center justify-center">
                    {onBack && (
                        <button type="button" onClick={onBack} aria-label="Geri"
                            className="absolute left-0 w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-card active:scale-95 transition">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}
                    {title && <h1 className="text-[17px] font-bold">{title}</h1>}
                </div>
                {stage && <div className="mt-3"><Stepper stage={stage} /></div>}
            </header>
            <div className="flex-1 w-full max-w-md mx-auto px-5 pt-5 pb-6 flex flex-col">{children}</div>
            {footer && (
                <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-background/0 pt-4 px-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))]">
                    <div className="max-w-md mx-auto">{footer}</div>
                </div>
            )}
        </main>
    );
}

export function PrimaryButton({ children, loading, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
    return (
        <button {...props} disabled={props.disabled || loading}
            className={cn("w-full h-14 rounded-2xl bg-accent text-white font-bold text-[15px] shadow-[0_10px_24px_-8px_rgba(238,91,61,0.55)] active:scale-[0.98] transition disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2", className)}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
        </button>
    );
}

export function SecondaryButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button {...props}
            className={cn("w-full h-14 rounded-2xl bg-card border border-accent/40 text-accent font-bold text-[15px] active:scale-[0.98] transition disabled:opacity-40 flex items-center justify-center gap-2", className)}>
            {children}
        </button>
    );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
    if (!children) return null;
    return <p role="alert" className="text-sm font-semibold text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">{children}</p>;
}

export const inputCls = "w-full h-14 pl-12 pr-4 rounded-2xl bg-card border border-card-border text-[15px] font-medium text-foreground placeholder:text-secondary/70 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition";
