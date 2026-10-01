'use client';

// Doğum günü kartı: pasaporttaki doğum tarihi bugünse ana sayfada görünür ve hazır bir kutlama gönderisi önerir.
// Doğum tarihi girilmemiş hayvan için hiç gösterilmez; kapatılırsa o yıl için bir daha çıkmaz.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Pet } from '@/context/PetContext';

const KEY = (petId: string, year: number) => `moffi_bday_dismissed_${petId}_${year}`;

/** Bugün doğum günü olan hayvanlar ve yeni yaşları. 29 Şubat doğumlular artık yıllarda 28 Şubat'ta kutlanır. */
export function birthdaysToday(pets: Pet[], now = new Date()) {
    const leap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return pets.flatMap(p => {
        if (!p.birthday) return [];
        const [y, m, d] = p.birthday.split('-').map(Number);
        if (!y || !m || !d) return [];
        let bm = m, bd = d;
        if (m === 2 && d === 29 && !leap(now.getFullYear())) bd = 28;
        if (now.getMonth() + 1 !== bm || now.getDate() !== bd) return [];
        const age = now.getFullYear() - y;
        return age >= 1 ? [{ pet: p, age }] : [];
    });
}

export function BirthdayCard({ pets }: { pets: Pet[] }) {
    const year = new Date().getFullYear();
    const today = useMemo(() => birthdaysToday(pets), [pets]);
    const [hidden, setHidden] = useState<Record<string, boolean>>({});
    useEffect(() => {
        const h: Record<string, boolean> = {};
        for (const { pet } of today) { try { h[pet.id] = localStorage.getItem(KEY(pet.id, year)) === '1'; } catch { /* yoksay */ } }
        setHidden(h);
    }, [today, year]);

    const visible = today.filter(b => !hidden[b.pet.id]);
    const dismiss = (id: string) => {
        try { localStorage.setItem(KEY(id, year), '1'); } catch { /* yoksay */ }
        setHidden(h => ({ ...h, [id]: true }));
    };

    return (
        <AnimatePresence initial={false}>
            {visible.map(({ pet, age }) => (
                <motion.div key={pet.id} initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    className="relative mb-4 overflow-hidden rounded-[1.75rem] border border-[#F4C9B8] bg-gradient-to-br from-[#FFF1E8] to-[#FCE3D6] dark:from-[#2B1D16] dark:to-[#2A1712] dark:border-[#4A2C20] p-4">
                    <button onClick={() => dismiss(pet.id)} aria-label="Kartı kapat"
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/70 dark:bg-black/30 flex items-center justify-center text-[#6F675B] dark:text-white/70">
                        <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3 pr-8">
                        <span className="relative shrink-0">
                            {pet.image
                                ? <img src={pet.image} alt="" className="w-16 h-16 rounded-full object-cover border-[3px] border-white dark:border-[#3A251B]" />
                                : <span className="w-16 h-16 rounded-full bg-white dark:bg-[#3A251B] flex items-center justify-center text-2xl">🐾</span>}
                            <motion.span className="absolute -top-2 -right-1 text-2xl" animate={{ rotate: [-8, 10, -8] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}>🎂</motion.span>
                        </span>
                        <span className="min-w-0">
                            <span className="block text-[11px] font-black tracking-wide text-[#EE5B3D]">DOĞUM GÜNÜ</span>
                            <span className="block text-lg font-black text-[#201B16] dark:text-white leading-tight">{pet.name} bugün {age} yaşında!</span>
                            <span className="block text-[13px] font-semibold text-[#6F675B] dark:text-white/70">Bu günü toplulukla kutlamak ister misin?</span>
                        </span>
                    </div>
                    <Link href={`/community/yeni?dogumgunu=${pet.id}`}
                        className="mt-3 flex h-11 w-full items-center justify-center rounded-2xl bg-[#EE5B3D] text-white text-sm font-black active:scale-[0.98] transition-transform">
                        Kutlama gönderisi paylaş
                    </Link>
                </motion.div>
            ))}
        </AnimatePresence>
    );
}
