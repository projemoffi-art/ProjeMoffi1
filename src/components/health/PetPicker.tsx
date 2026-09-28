'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHealth } from './HealthProvider';

export function PetAvatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
    return src
        ? <img src={src} alt="" className={cn('rounded-full object-cover bg-card-border', className)} />
        : <span className={cn('rounded-full bg-accent/15 text-accent font-black flex items-center justify-center', className)}>{name.charAt(0).toLocaleUpperCase('tr-TR')}</span>;
}

// Referans Ekran 1: "Luna ▾" seçici. Seçim uygulama genelindeki aktif evcil hayvanı değiştirir.
export function PetPicker() {
    const { pet, pets, switchPet } = useHealth();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    if (!pet) return null;
    return (
        <div className="relative" ref={ref}>
            <button onClick={() => pets.length > 1 && setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
                className="flex items-center gap-2 h-11 pl-1 pr-3 rounded-full bg-card border border-card-border">
                <PetAvatar src={pet.image} name={pet.name} className="w-9 h-9 text-sm" />
                <span className="text-sm font-black max-w-[140px] truncate">{pet.name}</span>
                {pets.length > 1 && <ChevronDown className={cn('w-4 h-4 text-secondary transition-transform', open && 'rotate-180')} />}
            </button>
            {open && (
                <div role="listbox" className="absolute left-0 top-full mt-2 z-40 w-60 bg-card border border-card-border rounded-2xl shadow-xl p-1.5">
                    {pets.map(p => (
                        <button key={p.id} role="option" aria-selected={p.id === pet.id}
                            onClick={() => { switchPet(p.id); setOpen(false); }}
                            className={cn('w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left', p.id === pet.id ? 'bg-accent/10' : 'hover:bg-card-border/40')}>
                            <PetAvatar src={p.image} name={p.name} className="w-8 h-8 text-xs" />
                            <span className="flex-1 text-sm font-bold truncate">{p.name}</span>
                            {p.id === pet.id && <Check className="w-4 h-4 text-accent" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
