/**
 * Moffi Veri Dışa Aktarma Yardımcı Aracı (KVKK Uyumlu)
 * Kullanıcının platform üzerindeki tüm verilerini paketler ve indirir.
 */
export const exportUserData = (packageData: {
    user: any,
    pets?: any[],
    posts?: any[],
    adoptions?: any[],
    notifications?: any[],
    orders?: any[],
    chats?: any[],
    walkStats?: any
}) => {
    try {
        const { user, pets, posts, adoptions, notifications, orders, chats, walkStats } = packageData;

        // İndirilecek veriyi hazırla
        const exportData = {
            export_version: "2.0.0 (Premium)",
            export_date: new Date().toISOString(),
            platform: "Moffi Ecosystem",
            licence_type: user.subscription_status || 'free',
            
            // 1. KİMLİK VE PROFİL
            account: {
                id: user.id,
                username: user.username,
                email: user.email,
                joined_at: user.joinedAt,
                bio: user.bio,
                avatar_url: user.avatar,
                stats: user.stats,
                wallet: {
                    balance: user.wallet_balance || 0,
                    moffi_coins: user.moffi_coins || 0
                }
            },

            // 2. AYARLAR VE TERCİHLER
            preferences: user.settings,

            // 3. EVCİL HAYVANLAR VE SAĞLIK
            pets: (pets || []).map(p => ({
                id: p.id,
                name: p.name,
                type: p.type,
                breed: p.breed,
                age: p.age,
                is_lost: p.is_lost,
                sos_settings: p.sos_settings
            })),

            // 4. TOPLULUK VE İÇERİK
            content: {
                posts: posts || [],
                adoption_ads: adoptions || []
            },

            // 5. ETKİLEŞİM VE SOSYAL
            social: {
                notifications: notifications || [],
                conversations: (chats || []).map(c => ({
                    id: c.id,
                    with_user: c.userName,
                    message_count: c.messages?.length || 0,
                    messages: c.messages || []
                }))
            },

            // 6. TİCARET VE FİTNESS
            activity: {
                orders: orders || [],
                fitness: walkStats || {}
            },

            // 7. GÜVENLİK
            security: {
                login_activity: user.loginActivity || []
            }
        };

        // Blob oluştur
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Gizli bir link oluştur ve tıkla
        const link = document.createElement('a');
        link.href = url;
        link.download = `moffi_full_data_${user.username}_${new Date().getFullYear()}_${new Date().getMonth()+1}.json`;
        document.body.appendChild(link);
        link.click();
        
        // Temizlik
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return { success: true };
    } catch (error) {
        console.error("Veri dışa aktarılırken hata oluştu:", error);
        return { success: false, error };
    }
};
