'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
    Syringe, Calendar, MapPin, CloudSun, Moon, Sun, 
    Bone, Activity, X, HeartPulse 
} from 'lucide-react';
import { usePet } from '@/context/PetContext';

interface CardData {
    id: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    badgeText: string;
    title: string;
    subtitle: string;
    action: () => void;
    priority: number;
}

export const TodayForYouEngine = () => {
    const router = useRouter();
    const { activePet } = usePet();
    const [dismissedCards, setDismissedCards] = useState<Record<string, number>>({});
    const [cards, setCards] = useState<CardData[]>([]);

    // Load dismissed cards from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('moffi_today_dismissed');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Clean up expired ones (older than 4-5 hours)
                const now = Date.now();
                const HIDE_DURATION = 5 * 60 * 60 * 1000; // 5 hours
                const activeDismissals: Record<string, number> = {};
                
                Object.keys(parsed).forEach(key => {
                    if (now - parsed[key] < HIDE_DURATION) {
                        activeDismissals[key] = parsed[key];
                    }
                });
                
                setDismissedCards(activeDismissals);
                localStorage.setItem('moffi_today_dismissed', JSON.stringify(activeDismissals));
            }
        } catch (e) {
            console.error("Failed to parse dismissed cards", e);
        }
    }, []);

    const dismissCard = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newDismissed = { ...dismissedCards, [id]: Date.now() };
        setDismissedCards(newDismissed);
        localStorage.setItem('moffi_today_dismissed', JSON.stringify(newDismissed));
    };

    // Generate dynamic cards based on context
    useEffect(() => {
        if (!activePet) return;

        const generatedCards: CardData[] = [];
        const hour = new Date().getHours();
        const isPuppy = activePet.age < 2;
        const isOverweight = activePet.weight > 15; // Mock metric
        const isCat = activePet.breed?.toLowerCase().includes('kedi') || activePet.name === 'Milo';

        // 1. Health / Vaccine Logic
        generatedCards.push({
            id: 'vaccine_card',
            icon: Syringe,
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
            badgeText: 'SAĞLIK',
            title: isPuppy ? 'Yavru Aşı Takvimi' : 'Yıllık Karma Aşı',
            subtitle: isPuppy ? 'Karma 2 Zamanı Geldi' : 'Kontrol Vakti',
            action: () => window.dispatchEvent(new CustomEvent('open-care-hub', { detail: { tab: 'health' } })),
            priority: 10
        });

        // 2. Nutrition Logic
        generatedCards.push({
            id: 'nutrition_card',
            icon: Bone,
            iconColor: 'text-amber-600 dark:text-amber-400',
            iconBg: 'bg-amber-50 dark:bg-amber-950/30',
            badgeText: 'BESLENME',
            title: isCat ? 'Tüy Yumağı Önleyici' : (isOverweight ? 'Diyet Mamaya Geçiş' : 'Eklem Sağlığı (Glukozamin)'),
            subtitle: isOverweight ? 'Porsiyonları azaltalım' : 'Petshop\'ta İndirimde',
            action: () => window.dispatchEvent(new CustomEvent('open-care-hub', { detail: { tab: 'nutrition' } })),
            priority: 8
        });

        // 3. Time-based Activity / Weather
        let weatherIcon = Sun;
        let weatherTitle = 'Güneşli Hava';
        let weatherSub = 'Patilere Dikkat, Asfalt Sıcak!';
        let weatherColor = 'text-yellow-500';
        let weatherBg = 'bg-yellow-50 dark:bg-yellow-950/30';

        if (hour < 11) {
            weatherIcon = CloudSun;
            weatherTitle = 'Sabah Serinliği';
            weatherSub = 'Uzun yürüyüş için harika';
            weatherColor = 'text-sky-500';
            weatherBg = 'bg-sky-50 dark:bg-sky-950/30';
        } else if (hour > 18) {
            weatherIcon = Moon;
            weatherTitle = 'Akşam Yürüyüşü';
            weatherSub = 'Günün yorgunluğunu atın';
            weatherColor = 'text-indigo-500';
            weatherBg = 'bg-indigo-50 dark:bg-indigo-950/30';
        }

        generatedCards.push({
            id: 'weather_card',
            icon: weatherIcon,
            iconColor: weatherColor,
            iconBg: weatherBg,
            badgeText: 'AKTİVİTE',
            title: weatherTitle,
            subtitle: weatherSub,
            action: () => router.push('/walk'),
            priority: 9
        });

        // 4. Community / Lost Pet (Random simulated event)
        generatedCards.push({
            id: 'radar_card',
            icon: MapPin,
            iconColor: 'text-red-500',
            iconBg: 'bg-red-50 dark:bg-red-950/30',
            badgeText: 'ACİL',
            title: 'Çevrede Kayıp İlanı',
            subtitle: '1.2 KM Yakınında',
            action: () => router.push('/topluluk?tab=radar&mode=lost'),
            priority: 7
        });

        // Filter dismissed cards and sort by priority
        const visibleCards = generatedCards
            .filter(c => !dismissedCards[c.id])
            .sort((a, b) => b.priority - a.priority);

        setCards(visibleCards);
    }, [activePet, dismissedCards, router]);


    if (cards.length === 0) return null; // Hide section if all cards dismissed

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
                            {/* Dismiss Button */}
                            <button
                                onClick={(e) => dismissCard(e, card.id)}
                                className="absolute top-3 right-3 w-6 h-6 bg-gray-100/50 dark:bg-zinc-700/50 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors z-10 opacity-0 group-hover:opacity-100"
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
                                <h4 className="text-[12px] font-black text-gray-800 dark:text-white leading-tight pr-4">{card.title}</h4>
                                <p className="text-[10px] text-gray-400 font-semibold mt-1">{card.subtitle}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    );
};
