import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { lostService } from '@/services/lostService';

// Ana sayfa hikâye kanalları. Her kanal yalnızca GERÇEK içerikle gösterilir: içeriği olmayan kanal için
// "yakında" / "kampanya yok" gibi yer tutucu hikâye üretilmez, kanal hiç görünmez.

// Kayıp ilanı başlığı (LostUI'deki listingTitle ile aynı kural; hook bileşen modülü içe aktarmasın diye burada).
const listingTitle = (l: { petName: string | null; kind: string }) =>
    l.petName?.trim() || (l.kind === 'found' ? 'Bulunan dost' : 'Kayıp dost');

export interface Story {
    id: string;
    media_url: string;
    created_at: string;
    title?: string;
    description?: string;
    badge?: string;
    /** Düğme yalnızca gidilecek gerçek bir yer varsa (uygulama içi yol, dış bağlantı, kupon kodu) gösterilir. */
    ctaText?: string;
    ctaType?: 'link' | 'url' | 'coupon';
    ctaValue?: string;
    expires_at?: string;
}

export type StoryChannel = 'stars' | 'sos' | 'announcements' | 'vet' | 'deals';

export interface UserStoryGroup {
    user_id: string;
    channel: StoryChannel;
    author_name: string;
    author_avatar: string | null;
    stories: Story[];
}

// Sunucudan gelen satırların bu dosyada kullanılan alanları
interface AnnouncementRow { id: string | number; title?: string; description?: string; media_url?: string | null; badge?: string | null; cta_text?: string | null; cta_type?: string | null; cta_value?: string | null; expires_at?: string | null; created_at?: string | null }
interface StarRow { id?: string; rank?: number; title?: string; description?: string; badge?: string; media_url?: string | null; created_at?: string; pet?: { image?: string | null } | null }
interface VetAdviceRow { id: string; content?: string; media_url?: string | null; badge?: string | null; clinic_id?: string | null; created_at?: string; profiles?: { business_name?: string; full_name?: string; avatar_url?: string | null } | null }
interface DealRow { id: string; media_url?: string | null; created_at: string; expires_at?: string; title?: string; description?: string; value?: string | null; coupon_code?: string | null }

function ctaOf(type: unknown, value: unknown, text: unknown): Pick<Story, 'ctaText' | 'ctaType' | 'ctaValue'> {
    const v = String(value || '').trim();
    if (!v) return {};
    const label = String(text || '').trim();
    if (type === 'coupon') return { ctaType: 'coupon', ctaValue: v, ctaText: label || 'Kodu kopyala' };
    if (v.startsWith('/')) return { ctaType: 'link', ctaValue: v, ctaText: label || 'Aç' };
    if (/^https?:\/\//.test(v)) return { ctaType: 'url', ctaValue: v, ctaText: label || 'Aç' };
    return {};
}

export function useStories() {
    const [storyGroups, setStoryGroups] = useState<UserStoryGroup[]>([]);
    const [activeLostCount, setActiveLostCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStories = useCallback(async () => {
        setIsLoading(true);
        try {
            const todayStr = new Date().toISOString().slice(0, 10);
            const [lostListings, announcements, dailyStars, vetAdvices, liveDeals] = await Promise.all([
                lostService.list().catch(() => []),
                apiService.getAnnouncements().catch(() => []),
                apiService.getDailyStars(todayStr).catch(() => []),
                apiService.getVetAdvices().catch(() => []),
                fetch('/api/deals').then(r => r.json()).then((d): DealRow[] => (d?.success ? d.deals || [] : [])).catch((): DealRow[] => []),
            ]);

            const activeLost = lostListings.filter(l => l.kind === 'lost' && l.status === 'active');
            setActiveLostCount(activeLost.length);

            // Yayındaki kayıp ilanları; dokununca ilanın kendisi açılır (Gördüm / Sahibine yaz oradan).
            const sosStories: Story[] = activeLost
                .filter(l => l.photos[0])
                .slice(0, 10)
                .map(l => ({
                    id: l.id,
                    media_url: l.photos[0],
                    created_at: l.createdAt,
                    title: `Kayıp: ${listingTitle(l)}`,
                    description: [l.locationText, l.description].filter(Boolean).join(' · '),
                    badge: l.rewardEnabled && l.rewardAmount ? `Ödül: ${l.rewardAmount.toLocaleString('tr-TR')} TL` : 'Kayıp ilanı',
                    ctaText: 'İlanı aç',
                    ctaType: 'link' as const,
                    ctaValue: `/kayip/${l.id}`,
                }));

            const announcementStories: Story[] = ((announcements || []) as AnnouncementRow[])
                .filter(a => !a.expires_at || new Date(a.expires_at).getTime() > Date.now())
                .filter(a => a.media_url)
                .map(a => ({
                    id: String(a.id),
                    media_url: a.media_url as string,
                    created_at: a.created_at || new Date().toISOString(),
                    title: a.title,
                    description: a.description,
                    badge: a.badge || 'Duyuru',
                    expires_at: a.expires_at || undefined,
                    ...ctaOf(a.cta_type, a.cta_value, a.cta_text),
                }));

            const starStories: Story[] = ((dailyStars || []) as StarRow[])
                .filter(s => s.media_url || s.pet?.image)
                .map(s => ({
                    id: String(s.id || `daily_star_${s.rank}`),
                    media_url: (s.media_url || s.pet?.image) as string,
                    created_at: s.created_at || new Date().toISOString(),
                    title: s.title,
                    description: s.description,
                    badge: s.badge || 'Günün Yıldızı',
                }));

            const vetStories: Story[] = ((vetAdvices || []) as VetAdviceRow[])
                .filter(a => a.content)
                .map(a => {
                    const clinicName = a.profiles?.business_name || a.profiles?.full_name;
                    return {
                        id: String(a.id),
                        media_url: a.media_url || a.profiles?.avatar_url || '/images/moffi_pet_trio.png',
                        created_at: a.created_at || new Date().toISOString(),
                        title: clinicName ? `${clinicName} öneriyor` : 'Veteriner tavsiyesi',
                        description: a.content,
                        badge: a.badge || 'Tavsiye',
                        ...(a.clinic_id && clinicName ? { ctaText: 'Kliniği gör', ctaType: 'link' as const, ctaValue: `/vet?clinicId=${a.clinic_id}` } : {}),
                    };
                });

            const dealStories: Story[] = (liveDeals || [])
                .filter(d => d.media_url)
                .map(d => ({
                    id: String(d.id),
                    media_url: d.media_url as string,
                    created_at: d.created_at,
                    expires_at: d.expires_at,
                    title: d.title,
                    description: d.description,
                    badge: d.value ? `${d.value} fırsat` : 'Fırsat',
                    ...ctaOf(d.coupon_code ? 'coupon' : null, d.coupon_code, d.coupon_code ? 'Kodu kopyala' : ''),
                }));

            const starAvatar = (() => {
                const img = dailyStars?.[0]?.pet?.image;
                return img && img !== '/images/moffi_pet_trio.png' ? img : '/images/header-hero.jpg';
            })();

            const groups: UserStoryGroup[] = [
                { user_id: 'system_featured_pets', channel: 'stars', author_name: 'Yıldız Patiler', author_avatar: starAvatar, stories: starStories },
                { user_id: 'system_sos', channel: 'sos', author_name: 'ACİL SOS', author_avatar: null, stories: sosStories },
                { user_id: 'system_announcements', channel: 'announcements', author_name: 'Moffi Duyuru', author_avatar: null, stories: announcementStories },
                { user_id: 'system_vet', channel: 'vet', author_name: 'Vet Tavsiyesi', author_avatar: null, stories: vetStories },
                { user_id: 'system_deals', channel: 'deals', author_name: 'Günün Fırsatı', author_avatar: null, stories: dealStories },
            ];
            setStoryGroups(groups.filter(g => g.stories.length > 0));
        } catch (err) {
            console.error('Hikâyeler yüklenemedi:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStories();
        const handleSync = () => fetchStories();
        window.addEventListener('moffi_announcements_changed', handleSync);
        // Yönetici panelinde duyuru değişince açık sekmeler de yenilenir.
        const channel = new BroadcastChannel('moffi_announcements_channel');
        channel.onmessage = (event) => { if (event.data === 'REFRESH_STORIES') fetchStories(); };
        return () => {
            window.removeEventListener('moffi_announcements_changed', handleSync);
            channel.close();
        };
    }, [fetchStories]);

    return { storyGroups, activeLostCount, isLoading, refreshStories: fetchStories };
}
