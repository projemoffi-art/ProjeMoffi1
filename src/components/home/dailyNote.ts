'use client';

// Ana sayfa selamlamasının altındaki "günün notu". Önce kişiye özel ve gerçek veriden gelen bir durum
// (geciken/yaklaşan sağlık işi, sıcak hava, uzun süredir yürünmemesi, hedefin tamamlanması); yoksa her gün
// değişen bir bakım bilgisi. Bilgi notları genel kabul görmüş bakım bilgileridir, tıbbi tavsiye yerine geçmez.

import { useMemo } from 'react';
import { daysLeftText } from '@/lib/health/derive';
import type { CareItem } from '@/hooks/useUpcomingCare';
import type { WeatherData } from '@/context/WeatherContext';

export type NoteTone = 'alert' | 'info' | 'good' | 'tip';
export interface DailyNote { text: string; tone: NoteTone; href?: string }

const TIPS = [
    'Çikolata, üzüm ve ksilitol (şekersiz sakız) köpekler için zehirlidir.',
    'Kediler günde 12-16 saat uyur; uzun uyku çoğu zaman normaldir.',
    'Sıcak günlerde yürüyüşü sabah erken ya da akşam serinliğinde yapmak patileri korur.',
    'Su kabını her gün tazele; birçok kedi akan suyu daha çok sever.',
    'Diş taşı çok yaygındır; düzenli diş fırçalama ağız sağlığını korur.',
    'Mikroçip kaydının güncel olması, kaybolan dostların bulunma şansını artırır.',
    'Zambak (lilyum) türleri kediler için çok zehirlidir; evde bulundurmamak en iyisi.',
    'Pire ve kene uygulamalarını veterinerin önerdiği aralıklarla yapmak önemlidir.',
    'Ayda bir tartmak, kilo değişimlerini ve olası sorunları erken fark ettirir.',
    'Soğan ve sarımsak kedi ve köpeklerde kansızlığa yol açabilir.',
    'Kediler susuzluğu geç fark eder; yaş mama sıvı alımını destekler.',
    'Kısa ve sık eğitim seansları (5-10 dakika) uzun seanslardan daha etkilidir.',
    'Yeni bir mamaya geçişi 7-10 güne yaymak mide sorunlarını azaltır.',
    'Zeminde tırnak sesi geliyorsa tırnak kesme zamanı gelmiş olabilir.',
    'Sürekli yalanan ya da kaşınan bir bölge alerjinin işareti olabilir.',
    'Evcil hayvanı araçta yalnız bırakma; içerisi birkaç dakikada tehlikeli ısınır.',
    'Kum kabı sayısı, evdeki kedi sayısından bir fazla olmalı.',
    'Yürüyüşte koklama molaları köpekler için zihinsel egzersizdir.',
];

export function useDailyNote(input: {
    care: CareItem[];
    weather: WeatherData | null;
    petName: string | null;
    daysSinceLastWalk: number | null;
    goalDone: boolean;
}): DailyNote {
    const { care, weather, petName, daysSinceLastWalk, goalDone } = input;
    return useMemo(() => {
        const overdue = care.find(c => c.daysLeft !== null && c.daysLeft < 0 && c.kind !== 'medication');
        if (overdue) return { text: `${overdue.petName} için ${overdue.title} ${daysLeftText(overdue.daysLeft)}.`, tone: 'alert', href: overdue.href };
        const soon = care.find(c => c.daysLeft !== null && c.daysLeft >= 0 && c.daysLeft <= 3 && c.kind !== 'medication');
        if (soon) return { text: `${soon.petName} için ${soon.title}: ${daysLeftText(soon.daysLeft).toLocaleLowerCase('tr-TR')}.`, tone: 'info', href: soon.href };
        if (weather && weather.temp >= 28) return { text: `Bugün ${weather.temp}°: öğle sıcağında asfalt patileri yakabilir.`, tone: 'alert' };
        if (goalDone) return { text: `Bugünkü yürüyüş hedefi tamam${petName ? `, ${petName} çok mutlu` : ''}!`, tone: 'good' };
        if (petName && daysSinceLastWalk !== null && daysSinceLastWalk >= 2) {
            return { text: `${petName} ${Math.floor(daysSinceLastWalk)} gündür yürümedi; kısa bir tur iyi gelir.`, tone: 'info' };
        }
        if (weather && weather.walkScore >= 85 && weather.source === 'gps') return { text: `${weather.temp}° ve ${weather.condition.toLocaleLowerCase('tr-TR')}: yürüyüş için harika bir hava.`, tone: 'good' };
        const day = Math.floor(Date.now() / 86_400_000);
        return { text: TIPS[day % TIPS.length], tone: 'tip' };
    }, [care, weather, petName, daysSinceLastWalk, goalDone]);
}
