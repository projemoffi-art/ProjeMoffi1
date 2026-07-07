import { useState, useEffect, useCallback } from 'react';

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
            // Curated, admin-controlled channels with multiple transitioning slides
            const systemChannels: UserStoryGroup[] = [
                {
                    user_id: 'system_featured_pets',
                    author_name: '👑 Yıldız Patiler & Gagalar',
                    author_avatar: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?q=80&w=200',
                    hasUnseen: true,
                    stories: [
                        {
                            id: 'feat_tarcin_1',
                            media_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=600',
                            created_at: new Date().toISOString(),
                            title: 'Haftanın Şampiyonu: Tarçın 🐕',
                            description: 'Moda mahallesinden Tarçın, bu hafta topladığı 3.500 Aura Puanı ile liderlik koltuğunda!',
                            badge: 'Aura Lideri 👑',
                            ctaText: 'Tarçın\'ı Alkışla 👏',
                            ctaType: 'toast',
                            ctaValue: 'Tarçın başarıyla alkışlandı!'
                        },
                        {
                            id: 'feat_pamuk_1',
                            media_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600',
                            created_at: new Date().toISOString(),
                            title: 'Uykucu Güzeli: Pamuk 🐈',
                            description: 'Göztepe mahallesinin uykucu güzeli Pamuk, paylaşılan tatlı esneme videosu ile 2.900 Aura kazandı.',
                            badge: 'Halkın Seçimi 🌸',
                            ctaText: 'Pamuk\'u Sev 💖',
                            ctaType: 'toast',
                            ctaValue: 'Pamuk\'a sevgi gönderildi!'
                        },
                        {
                            id: 'feat_duman_1',
                            media_url: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=600',
                            created_at: new Date().toISOString(),
                            title: 'Karizmatik Beyefendi: Duman 😎',
                            description: 'Bostancı\'nın en şık kedisi Duman, yeni Moffi yeşil papyonuyla göz kamaştırıyor.',
                            badge: 'Tarz Sahibi ✨',
                            ctaText: 'Tarzını Keşfet 👔',
                            ctaType: 'toast',
                            ctaValue: 'Duman\'ın gardırobuna yönlendiriliyorsunuz...'
                        },
                        {
                            id: 'feat_kopuk_1',
                            media_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600',
                            created_at: new Date().toISOString(),
                            title: 'Köpük Gurme Yolculuğunda 🥩',
                            description: 'Maltese Terrier Köpük, bu hafta denediği somonlu ödül bisküvisine 5 yıldız verdi!',
                            badge: 'Minik Gurme 🍖',
                            ctaText: 'Mamayı İncele 🛒',
                            ctaType: 'toast',
                            ctaValue: 'Somonlu Ödül Maması sayfasına yönlendiriliyorsunuz...'
                        },
                        {
                            id: 'feat_milo_1',
                            media_url: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?q=80&w=600',
                            created_at: new Date().toISOString(),
                            title: 'Frizbi Yıldızı: Milo 🌟',
                            description: 'Border Collie Milo, havada 3 takla atarak frizbiyi yakaladığı videosu ile sosyal medyada viral oldu.',
                            badge: 'Zeka Yıldızı 🧠',
                            ctaText: 'Videoyu İzle 🎥',
                            ctaType: 'toast',
                            ctaValue: 'Milo\'nun frizbi performansı oynatılıyor...'
                        }
                    ]
                },
                {
                    user_id: 'system_sos',
                    author_name: '🚨 ACİL SOS',
                    author_avatar: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=200',
                    hasUnseen: true,
                    stories: [
                        {
                            id: 'sos_1',
                            media_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=600',
                            created_at: new Date().toISOString(),
                            title: 'Luna Kayıp! (Moda)',
                            description: 'Golden Retriever cinsi 2 yaşında Luna, Moda Parkı civarında kaybolmuştur. Tasmasında kırmızı SOS ışığı yanıp sönüyor.',
                            badge: 'Ödül: 5.000 TL',
                            ctaText: 'Konumu Haritada Gör 📍',
                            ctaType: 'map',
                            ctaValue: 'Moda Parkı, Kadıköy'
                        },
                        {
                            id: 'sos_2',
                            media_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600',
                            created_at: new Date(Date.now() - 3600000).toISOString(),
                            title: 'Felix Kayıp! (Göztepe)',
                            description: 'Tuxedo cinsi Felix, Göztepe Özgürlük Parkı yakınlarında balkondan düşerek kaybolmuştur. Çok ürkektir.',
                            badge: 'Ödül: 3.000 TL',
                            ctaText: 'Sahibiyle İletişime Geç 💬',
                            ctaType: 'chat',
                            ctaValue: '705d320c-13af-4979-8822-6673bf8f5e98'
                        },
                        {
                            id: 'sos_3',
                            media_url: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?q=80&w=600',
                            created_at: new Date(Date.now() - 7200000).toISOString(),
                            title: 'Şila Kayıp! (Bostancı)',
                            description: 'Alman Çoban Köpeği Şila, dün akşam Bostancı Sahili\'nde ses fişeğinden korkarak kaçmıştır. İnsan canlısıdır.',
                            badge: 'Acil Bildirim',
                            ctaText: 'İhbar Bildir 📞',
                            ctaType: 'toast',
                            ctaValue: 'Şila için Bostancı ihbar hattı aktif edildi!'
                        }
                    ]
                },
                {
                    user_id: 'system_announcements',
                    author_name: '📢 Moffi Duyuru',
                    author_avatar: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?q=80&w=200',
                    hasUnseen: true,
                    stories: [
                        {
                            id: 'ann_1',
                            media_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=600',
                            created_at: new Date().toISOString(),
                            title: 'Kadıköy Patimaratonu!',
                            description: '24 Mayıs Pazar günü Caddebostan Sahili\'nde buluşuyoruz. Tüm patili dostlarımız ve sahipleri davetlidir.',
                            badge: 'Etkinlik',
                            ctaText: 'Ücretsiz Kaydol 🎟️',
                            ctaType: 'toast',
                            ctaValue: 'Patimaraton katılım biletiniz Moffi cüzdanınıza eklendi!'
                        },
                        {
                            id: 'ann_2',
                            media_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600',
                            created_at: new Date(Date.now() - 7200000).toISOString(),
                            title: 'Akıllı Tasma V2 Çıktı!',
                            description: 'Tasma yazılımı için yeni geofence optimizasyonları ve pil tasarruf modu yayınlandı. Ayarlar sekmesinden güncelleyebilirsiniz.',
                            badge: 'Sistem Güncellemesi',
                            ctaText: 'Hemen Güncelle ⚡',
                            ctaType: 'toast',
                            ctaValue: 'Akıllı Tasma V2 güncellemesi tasmanıza kablosuz (OTA) olarak yükleniyor...'
                        }
                    ]
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
