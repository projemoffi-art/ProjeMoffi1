import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/apiService';

export interface Story {
    id: string;
    media_url: string;
    created_at: string;
    title?: string;
    description?: string;
    badge?: string;
    ctaText?: string;
    ctaType?: 'toast' | 'chat' | 'map' | 'coupon';
    ctaValue?: string;
}

export interface UserStoryGroup {
    user_id: string;
    author_name: string;
    author_avatar: string | null;
    stories: Story[];
    hasUnseen: boolean;
}

export function useStories() {
    const [storyGroups, setStoryGroups] = useState<UserStoryGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStories = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch live lost pets from Supabase
            const lostPets = await apiService.getLostPets();
            // Fetch live system announcements
            const announcements = await apiService.getAnnouncements();
            // Fetch today's daily star pets (up to 5)
            const todayStr = new Date().toISOString().slice(0, 10);
            const dailyStars = await apiService.getDailyStars(todayStr) || [];
            
            const liveAnnStories: Story[] = (announcements || [])
                .filter((ann: any) => {
                    if (!ann.expires_at) return true;
                    return new Date(ann.expires_at).getTime() > Date.now();
                })
                .map((ann: any) => ({
                    id: ann.id,
                    media_url: ann.media_url || 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?q=80&w=200',
                    created_at: ann.created_at || new Date().toISOString(),
                    title: ann.title,
                    description: ann.description,
                    badge: ann.badge || 'Duyuru',
                    ctaText: ann.cta_text || 'İncele',
                    ctaType: ann.cta_type || 'toast',
                    ctaValue: ann.cta_value || ''
                }));
            
            const liveSosStories: Story[] = lostPets.map((pet: any) => ({
                id: pet.id,
                media_url: pet.img || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600',
                created_at: pet.created_at || new Date().toISOString(),
                title: `${pet.name} Kayıp! (${pet.location || 'Bilinmiyor'})`,
                description: pet.description || `${pet.name} cinsi dostumuz kaybolmuştur. Görenlerin iletişime geçmesi rica olunur.`,
                badge: pet.reward ? `Ödül: ${pet.reward}` : 'Acil İhbar',
                ctaText: 'Konumu Haritada Gör 📍',
                ctaType: 'sos' as any,
                ctaValue: `${pet.latitude},${pet.longitude}`,
                ctaValue2: pet.user_id
            }));

            const featuredStories: Story[] = (dailyStars || []).map((star: any) => ({
                id: star.id || `daily_star_${star.rank}`,
                media_url: star.media_url || '/images/moffi_pet_trio.png',
                created_at: star.created_at || new Date().toISOString(),
                title: star.title,
                description: star.description,
                badge: star.badge || 'Günün Yıldızı 🌟',
                ctaText: 'İncele',
                ctaType: 'toast',
                ctaValue: star.description
            }));

            if (featuredStories.length === 0) {
                featuredStories.push({
                    id: 'feat_default_1',
                    media_url: '/images/moffi_pet_trio.png',
                    created_at: new Date().toISOString(),
                    title: 'Günün Yıldız Patileri Seçiliyor 🌟',
                    description: 'Moffi Evreninde günün en aktif patileri birazdan burada açıklanacak! Takipte kalın.',
                    badge: 'Moffi Yıldızı',
                    ctaText: 'Keşfet',
                    ctaType: 'toast',
                    ctaValue: 'Pati Keşfet alanına yönlendiriliyorsunuz...'
                });
            }

            const systemChannels: UserStoryGroup[] = [
                {
                    user_id: 'system_featured_pets',
                    author_name: '👑 Yıldız Patiler',
                    author_avatar: dailyStars[0]?.pet?.image || dailyStars[0]?.pet?.avatar || '/images/moffi_pet_trio.png',
                    hasUnseen: true,
                    stories: featuredStories
                },
                {
                    user_id: 'system_sos',
                    author_name: '🚨 ACİL SOS',
                    author_avatar: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=200',
                    hasUnseen: true,
                    stories: liveSosStories
                },
                {
                    user_id: 'system_announcements',
                    author_name: '📢 Moffi Duyuru',
                    author_avatar: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?q=80&w=200',
                    hasUnseen: true,
                    stories: liveAnnStories
                },
                {
                    user_id: 'system_vet',
                    author_name: '🩺 Vet Tavsiyesi',
                    author_avatar: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?q=80&w=200',
                    hasUnseen: true,
                    stories: [
                        {
                            id: 'vet_1',
                            media_url: 'https://images.unsplash.com/photo-1541599540903-216a46ca1ad0?q=80&w=600',
                            created_at: new Date().toISOString(),
                            title: 'Asfalt Sıcaklığına Dikkat!',
                            description: 'Yaz aylarında asfalt sıcaklığı hava sıcaklığının iki katına çıkabilir. Patileri yakmamak için yürüyüşleri sabah veya akşam yapın.',
                            badge: 'Yaz Bakımı',
                            ctaText: 'Sağlık Rehberini Oku 📚',
                            ctaType: 'toast',
                            ctaValue: 'Pati Sağlığı ve Koruma rehberi indirildi!'
                        },
                        {
                            id: 'vet_2',
                            media_url: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?q=80&w=200',
                            created_at: new Date(Date.now() - 14400000).toISOString(),
                            title: 'Kene ve Parazit Mevsimi',
                            description: 'İlkbahar ve yaz aylarında dış parazit aşılarını aksatmayın. Çimlerde yürüyüş sonrası pati aralarını mutlaka kontrol edin.',
                            badge: 'Sağlık Uyarısı',
                            ctaText: 'Aşı Takvimine Git 📅',
                            ctaType: 'toast',
                            ctaValue: 'Aşı takviminiz Hub paneli üzerinden senkronize edildi.'
                        }
                    ]
                },
                {
                    user_id: 'system_deals',
                    author_name: '🎁 Günün Fırsatı',
                    author_avatar: 'https://images.unsplash.com/photo-1585499193151-0f50d54c4e1c?q=80&w=200',
                    hasUnseen: true,
                    stories: [
                        {
                            id: 'deal_1',
                            media_url: 'https://images.unsplash.com/photo-1554818538-98e34543195f?q=80&w=600',
                            created_at: new Date().toISOString(),
                            title: 'Moda Pet Cafe\'de %15 İndirim!',
                            description: 'Moffi Pati-Kart sahiplerine özel tüm cafe menüsünde ve pet ikramlarında geçerli %15 anlık indirim kodu.',
                            badge: 'Pati-Kart Özel',
                            ctaText: 'Kupon Kodunu Al 🎟️',
                            ctaType: 'coupon',
                            ctaValue: 'MODAPET15'
                        },
                        {
                            id: 'deal_2',
                            media_url: 'https://images.unsplash.com/photo-1585499193151-0f50d54c4e1c?q=80&w=600',
                            created_at: new Date(Date.now() - 3600000).toISOString(),
                            title: 'Mama Alışverişine Hediye!',
                            description: 'Seçili 12kg ve üzeri kuru mamalarda Moffi Diş Oyuncağı hediye! Kampanya bu pazar gecesine kadar geçerlidir.',
                            badge: 'Sepet Fırsatı',
                            ctaText: 'Markete Git 🛒',
                            ctaType: 'toast',
                            ctaValue: 'Moffi Market sekmesine yönlendiriliyorsunuz...'
                        }
                    ]
                }
            ];

            setStoryGroups(systemChannels);
        } catch (err) {
            console.error('Error fetching stories:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStories();

        const handleSync = () => {
            fetchStories();
        };
        
        window.addEventListener('moffi_announcements_changed', handleSync);
        
        // Tab-to-tab real-time sync channel
        const channel = new BroadcastChannel('moffi_announcements_channel');
        channel.onmessage = (event) => {
            if (event.data === 'REFRESH_STORIES') {
                fetchStories();
            }
        };

        return () => {
            window.removeEventListener('moffi_announcements_changed', handleSync);
            channel.close();
        };
    }, [fetchStories]);

    const uploadStory = async (file: File) => {
        return { success: false, error: 'Stories are admin-only' };
    };

    return {
        storyGroups,
        isLoading,
        uploadStory,
        refreshStories: fetchStories
    };
}
