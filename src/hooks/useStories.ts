'use client';

// Ana sayfa hikâye kanalları (2026-10-04, Baran onaylı; CLAUDE.md 8.64):
//   Kayıp Alarmı    → otomatik: kullanıcının çevresindeki (25 km) yayındaki kayıp ilanları
//   <Hayvan>'ın Haftası → otomatik: kullanıcının kendi verisinden haftalık özet (yürüyüş, seri, sağlık)
//   Moffi           → İçerik Stüdyosu (süper admin)
//   Veteriner Önerisi / Fırsatlar → işletme gönderir, admin onaylar, yalnızca işletmenin çevresine (content_feed)
// İçeriği olmayan kanal görünmez; yer tutucu hikâye üretilmez. "Görüldü" İçerik Stüdyosu öğelerinde sunucuda,
// otomatik kanallarda bu cihazda tutulur. "Moffi'den İlham" kartı da aynı akıştan (inspiration) beslenir.

import { useEffect, useMemo, useState } from 'react';
import { lostService } from '@/services/lostService';
import { contentService, type FeedItem } from '@/services/contentService';
import { useWeather } from '@/context/WeatherContext';
import { usePet } from '@/context/PetContext';
import { useActivity } from '@/context/ActivityContext';
import { speciesOf, daysLeftText } from '@/lib/health/derive';
import { formatKm } from '@/lib/walkMetrics';
import { genitive } from '@/lib/turkish';
import type { CareItem } from '@/hooks/useUpcomingCare';

const LOST_RADIUS_KM = 25;

export interface StoryCard {
    tone: 'warm' | 'green' | 'violet' | 'ink';
    eyebrow?: string;
    big?: string;
    unit?: string;
    lines?: string[];
    image?: string | null;
}

export interface Story {
    id: string;
    /** İçerik Stüdyosu öğesi ise kimliği (görüntülenme/dokunma kaydı için) */
    contentId?: string;
    media_url?: string;
    /** Görsel yerine tasarlanmış kart (otomatik özet hikâyeleri) */
    card?: StoryCard;
    created_at: string;
    title?: string;
    description?: string;
    badge?: string;
    /** Düğme yalnızca gidilecek gerçek bir yer varsa (uygulama içi yol, dış bağlantı, kupon kodu, uygulama olayı). */
    ctaText?: string;
    ctaType?: 'link' | 'url' | 'coupon' | 'event';
    ctaValue?: string;
    /** Kupon + işletme sayfası gibi ikinci düğme */
    secondary?: { text: string; type: 'link'; value: string };
    expires_at?: string;
    seen?: boolean;
}

export type StoryChannel = 'lost' | 'weekly' | 'moffi' | 'vet' | 'deal';

export interface UserStoryGroup {
    user_id: string;
    channel: StoryChannel;
    author_name: string;
    author_avatar: string | null;
    stories: Story[];
}

type LostListing = Awaited<ReturnType<typeof lostService.list>>[number];

function km(lat1: number, lng1: number, lat2: number, lng2: number) {
    const r = (d: number) => (d * Math.PI) / 180;
    const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const listingTitle = (l: { petName: string | null; kind: string }) =>
    l.petName?.trim() || (l.kind === 'found' ? 'Bulunan dost' : 'Kayıp dost');

function ctaFromUrl(label: string | null, url: string | null): Pick<Story, 'ctaText' | 'ctaType' | 'ctaValue'> {
    if (!url) return {};
    if (url.startsWith('/')) return { ctaType: 'link', ctaValue: url, ctaText: label || 'Aç' };
    if (/^https:\/\//.test(url)) return { ctaType: 'url', ctaValue: url, ctaText: label || 'Aç' };
    return {};
}

function weekKey(now: number) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function useStories(care: CareItem[] = []) {
    const { weather } = useWeather();
    const { pets, activePet } = usePet();
    const { walkHistory, walkStats } = useActivity();
    const [lostListings, setLostListings] = useState<LostListing[]>([]);
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [now, setNow] = useState(0);
    useEffect(() => { setNow(Date.now()); }, [walkHistory]);

    const lat = weather?.lat ?? null;
    const lng = weather?.lon ?? null;
    const species = useMemo(
        () => Array.from(new Set(pets.map(p => speciesOf(p)).filter((s): s is 'dog' | 'cat' => s === 'dog' || s === 'cat'))),
        [pets],
    );
    const speciesKey = species.join(',');

    useEffect(() => {
        let alive = true;
        lostService.list().then(l => { if (alive) setLostListings(l); }).catch(() => {});
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        let alive = true;
        contentService.feed(lat, lng, species.length ? species : null)
            .then(items => { if (alive) setFeed(items); })
            .finally(() => { if (alive) setIsLoading(false); });
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lat, lng, speciesKey]);

    // Kayıp Alarmı: yalnızca konum biliniyorsa ve çevredeki ilanlar.
    const nearbyLost = useMemo(() => {
        if (lat == null || lng == null) return [];
        return lostListings
            .filter(l => l.kind === 'lost' && l.status === 'active' && l.lat != null && l.lng != null)
            .map(l => ({ l, d: km(lat, lng, l.lat as number, l.lng as number) }))
            .filter(x => x.d <= LOST_RADIUS_KM)
            .sort((a, b) => a.d - b.d);
    }, [lostListings, lat, lng]);

    // Haftalık özet: kullanıcının kendi verisinden; hiç veri yoksa da hafta başı motivasyonu olarak gösterilir.
    const weekly = useMemo<UserStoryGroup | null>(() => {
        const pet = activePet || pets[0];
        if (!pet || !now) return null;
        const ageOf = (w: { ended_at?: string; started_at?: string }) => now - new Date(w.ended_at || w.started_at || 0).getTime();
        const thisWeek = walkHistory.filter(w => ageOf(w) < 7 * 86_400_000);
        const prevWeek = walkHistory.filter(w => ageOf(w) >= 7 * 86_400_000 && ageOf(w) < 14 * 86_400_000);
        const kmNow = thisWeek.reduce((s, w) => s + (w.distanceKm || 0), 0);
        const kmPrev = prevWeek.reduce((s, w) => s + (w.distanceKm || 0), 0);
        const steps = thisWeek.reduce((s, w) => s + (w.steps || 0), 0);
        const days = new Set(thisWeek.map(w => new Date(w.ended_at || w.started_at || 0).toDateString())).size;
        const change = kmPrev > 0.05 ? Math.round(((kmNow - kmPrev) / kmPrev) * 100) : null;
        const streak = walkStats?.currentStreak || 0;
        const nextCare = care.find(c => c.petId === pet.id && c.kind !== 'medication') || care.find(c => c.kind !== 'medication');
        const key = weekKey(now);
        const photo = pet.image || pet.avatar || null;

        const stories: Story[] = [
            {
                id: `weekly-${key}-cover`, created_at: key,
                card: { tone: 'warm', eyebrow: 'Haftalık özet', big: `${genitive(pet.name)} Haftası`, lines: ['Son 7 gününüze birlikte bakalım.'], image: photo },
            },
            {
                id: `weekly-${key}-walk`, created_at: key,
                card: thisWeek.length > 0
                    ? {
                        tone: 'green', eyebrow: 'Yürüyüş', big: formatKm(kmNow, 1), unit: 'km',
                        lines: [
                            `${thisWeek.length} yürüyüş · ${days} farklı gün`,
                            ...(steps > 0 ? [`${steps.toLocaleString('tr-TR')} adım`] : []),
                            ...(change !== null ? [change >= 0 ? `Geçen haftadan %${change} fazla` : `Geçen haftadan %${Math.abs(change)} az`] : []),
                        ],
                    }
                    : { tone: 'green', eyebrow: 'Yürüyüş', big: 'Yeni hafta', lines: ['Bu hafta henüz yürüyüş yok.', 'Kısa bir tur bile iyi gelir.'] },
                ...(thisWeek.length === 0 ? { ctaText: 'Yürüyüşe başla', ctaType: 'event' as const, ctaValue: 'open-walk-panel' } : {}),
            },
            {
                id: `weekly-${key}-streak`, created_at: key,
                card: streak > 0
                    ? { tone: 'violet', eyebrow: 'Seri', big: `${streak}`, unit: 'gün', lines: ['Üst üste yürüdünüz.', 'Seriyi korumak için yarın da kısa bir tur!'] }
                    : { tone: 'violet', eyebrow: 'Seri', big: 'Başla', lines: ['Bugün yürürsen yeni bir seri başlar.'] },
            },
            {
                id: `weekly-${key}-health`, created_at: key,
                card: nextCare
                    ? { tone: 'ink', eyebrow: 'Sağlık', big: daysLeftText(nextCare.daysLeft), lines: [`${nextCare.petName}: ${nextCare.title}`] }
                    : { tone: 'ink', eyebrow: 'Sağlık', big: 'Güncel', lines: ['Yaklaşan aşı, ilaç ya da randevu yok.'] },
                ...(nextCare ? { ctaText: 'Sağlık Merkezi', ctaType: 'link' as const, ctaValue: nextCare.href } : {}),
            },
        ];
        return { user_id: 'weekly', channel: 'weekly', author_name: `${genitive(pet.name)} Haftası`, author_avatar: photo, stories };
    }, [activePet, pets, walkHistory, walkStats, care, now]);

    const groups = useMemo<UserStoryGroup[]>(() => {
        const out: UserStoryGroup[] = [];

        const lostStories: Story[] = nearbyLost.filter(x => x.l.photos[0]).slice(0, 10).map(({ l, d }) => ({
            id: `lost-${l.id}`,
            media_url: l.photos[0],
            created_at: l.createdAt,
            title: `Kayıp: ${listingTitle(l)}`,
            description: [l.locationText, l.description].filter(Boolean).join(' · '),
            badge: `${d < 1 ? '1 km içinde' : `${Math.round(d)} km uzakta`}${l.rewardEnabled && l.rewardAmount ? ` · Ödül ${l.rewardAmount.toLocaleString('tr-TR')} TL` : ''}`,
            ctaText: 'İlanı aç', ctaType: 'link' as const, ctaValue: `/kayip/${l.id}`,
        }));
        if (lostStories.length) out.push({ user_id: 'lost', channel: 'lost', author_name: 'Kayıp Alarmı', author_avatar: null, stories: lostStories });

        if (weekly) out.push(weekly);

        const fromFeed = (channel: 'moffi' | 'vet' | 'deal'): Story[] => feed.filter(f => f.channel === channel && f.mediaUrl).map(f => {
            const base: Story = {
                id: `content-${f.id}`,
                contentId: f.id,
                media_url: f.mediaUrl as string,
                created_at: f.endsAt || '',
                expires_at: channel === 'deal' ? f.endsAt || undefined : undefined,
                title: f.title,
                description: f.body || undefined,
                badge: channel === 'deal' ? `Reklam · ${f.businessName || 'İşletme'}${f.discount ? ` · ${f.discount}` : ''}`
                    : channel === 'vet' ? `Klinik önerisi · ${f.businessName || 'Veteriner'}`
                    : 'Moffi',
                seen: f.seen,
            };
            if (channel === 'deal' && f.couponCode) {
                return { ...base, ctaText: `Kodu kopyala: ${f.couponCode}`, ctaType: 'coupon', ctaValue: f.couponCode, secondary: f.ctaUrl ? { text: 'İşletmeyi gör', type: 'link', value: f.ctaUrl } : undefined };
            }
            return { ...base, ...ctaFromUrl(f.ctaLabel, f.ctaUrl) };
        });

        const moffi = fromFeed('moffi');
        if (moffi.length) out.push({ user_id: 'moffi', channel: 'moffi', author_name: 'Moffi', author_avatar: null, stories: moffi });
        const vet = fromFeed('vet');
        if (vet.length) out.push({ user_id: 'vet', channel: 'vet', author_name: 'Veteriner Önerisi', author_avatar: null, stories: vet });
        const deal = fromFeed('deal');
        if (deal.length) out.push({ user_id: 'deal', channel: 'deal', author_name: 'Fırsatlar', author_avatar: null, stories: deal });
        return out;
    }, [nearbyLost, weekly, feed]);

    const inspiration = useMemo(() => feed.filter(f => f.channel === 'inspiration' && f.mediaUrl), [feed]);

    return { storyGroups: groups, inspiration, activeLostCount: nearbyLost.length, isLoading };
}
