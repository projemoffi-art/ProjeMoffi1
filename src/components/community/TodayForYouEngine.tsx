'use client';

// Ana sayfa "Bugün senin için": sadece gerçek veriden kart üretir.
// Sağlık kartı Sağlık Kaydı'nın sıradaki işinden (lib/health/derive), kayıp kartı gerçek kayıp
// ilanlarından gelir; göstermeye değer bir şey yoksa kart çıkmaz. (Önceden her hayvana aynı
// "Yıllık Karma Aşı", saate bakıp "Güneşli hava", sabit "1.2 km yakınında kayıp ilanı" yazıyordu.)

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Activity, MapPin, Syringe, X } from 'lucide-react';
import { usePet } from '@/context/PetContext';
import { usePetHealthBundle } from '@/components/health/usePetHealthBundle';
import { daysLeftText, upcomingItems } from '@/lib/health/derive';
import { todayKey } from '@/lib/appointmentTime';
import { apiService } from '@/services/apiService';

interface CardData {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    iconBg: string;
    badgeText: string;
    title: string;
    subtitle: string;
    action: () => void;
}

const DISMISS_KEY = 'moffi_today_dismissed';
const HIDE_DURATION = 5 * 60 * 60 * 1000;

export const TodayForYouEngine = () => {
    const router = useRouter();
    const { activePet, appointments } = usePet();
    const bundle = usePetHealthBundle(activePet);
    const [dismissed, setDismissed] = useState<Record<string, number>>({});
    const [lostCount, setLostCount] = useState(0);

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}');
            const now = Date.now();
            const active: Record<string, number> = {};
            Object.keys(saved).forEach(k => { if (now - saved[k] < HIDE_DURATION) active[k] = saved[k]; });
            setDismissed(active);
            localStorage.setItem(DISMISS_KEY, JSON.stringify(active));
        } catch { /* kapatılan kart listesi okunamazsa hepsi görünür */ }
    }, []);

    useEffect(() => {
        let alive = true;
        apiService.getLostPets().then(list => { if (alive) setLostCount((list || []).length); }).catch(() => {});
        return () => { alive = false; };
    }, []);

    const dismiss = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const next = { ...dismissed, [id]: Date.now() };
        setDismissed(next);
        try { localStorage.setItem(DISMISS_KEY, JSON.stringify(next)); } catch { /* yoksay */ }
    };

    const cards = useMemo(() => {
        const list: CardData[] = [];
        const petAppointments = (activePet && appointments?.[activePet.id]) || [];
        const next = bundle ? upcomingItems(bundle, petAppointments, todayKey()).find(i => i.daysLeft <= 30) : null;
        if (activePet && next) {
            list.push({
                id: `health_${next.id}`,
                icon: Syringe,
                iconColor: next.daysLeft < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
                iconBg: next.daysLeft < 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30',
                badgeText: 'SAĞLIK',
                title: next.title,
                subtitle: daysLeftText(next.daysLeft),
                action: () => router.push(next.href),
            });
        }
        if (activePet) {
            list.push({
                id: 'walk_card',
                icon: Activity,
                iconColor: 'text-[#EE5B3D] dark:text-orange-400',
                iconBg: 'bg-orange-50 dark:bg-orange-950/30',
                badgeText: 'AKTİVİTE',
                title: `${activePet.name} ile yürüyüş`,
                subtitle: 'Bugünkü hedefine başla',
                action: () => router.push('/walk'),
            });
        }
        if (lostCount > 0) {
            list.push({
                id: 'radar_card',
                icon: MapPin,
                iconColor: 'text-red-500',
                iconBg: 'bg-red-50 dark:bg-red-950/30',
                badgeText: 'KAYIP',
                title: 'Kayıp ilanları',
                subtitle: `Toplulukta ${lostCount} kayıp ilanı var`,
                action: () => router.push('/community?tab=radar&mode=lost'),
            });
        }
        return list.filter(c => !dismissed[c.id]);
    }, [activePet, appointments, bundle, lostCount, dismissed, router]);

    if (cards.length === 0) return null;

    return (
        <section className="mb-6">
            <h3 className="text-[15px] font-bold text-gray-800 dark:text-white tracking-tight mb-3 px-1">Bugün senin için</h3>
            <div className="flex gap-3.5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none px-1">
                <AnimatePresence>
                    {cards.map((card, index) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -20, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            onClick={card.action}
                            className="relative w-[160px] h-[140px] shrink-0 snap-start bg-white dark:bg-zinc-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-white/5 rounded-[22px] p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:-translate-y-1 group"
                        >
                            <button
                                onClick={(e) => dismiss(e, card.id)}
                                aria-label="Kartı gizle"
                                className="absolute top-3 right-3 w-6 h-6 bg-gray-100/50 dark:bg-zinc-700/50 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors z-10 opacity-0 group-hover:opacity-100"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex justify-between items-start">
                                <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                                    <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                                </div>
                                <span className={`text-[9px] font-black ${card.iconColor} ${card.iconBg} px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                                    {card.badgeText}
                                </span>
                            </div>
                            <div>
                                <h4 className="text-[12px] font-black text-gray-800 dark:text-white leading-tight pr-4 line-clamp-2">{card.title}</h4>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-1">{card.subtitle}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    );
};
