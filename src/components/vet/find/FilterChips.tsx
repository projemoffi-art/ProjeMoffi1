"use client";

import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

// Faz 25 (bkz. design-reference/vet-final/) — yatay filtre/sekme chip satırı,
// Ekran 2/3/4/8/12/14'ün hepsinde tekrar eden AYNI desen — tek bileşen.
export function FilterChips<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { key: T; label: string }[];
    value: T;
    onChange: (key: T) => void;
}) {
    return (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {options.map(opt => (
                <button
                    key={opt.key}
                    onClick={() => { haptics.tap(); onChange(opt.key); }}
                    className={cn(
                        "px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border-0 cursor-pointer active:scale-95",
                        value === opt.key ? "bg-slate-900 text-white" : "bg-gray-100 dark:bg-white/5 text-slate-500 hover:bg-gray-200 dark:hover:bg-white/10"
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
