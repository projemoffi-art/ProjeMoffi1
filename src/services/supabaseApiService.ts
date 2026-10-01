// @ts-nocheck
import {
    Pet, Post, UserProfile, LostPet,
    ShopCategory, ShopProduct, ShopCartItem, ShopOrder, IApiService,
    SystemAnnouncement, SystemFeedback, SocialChallenge, BusinessAppointmentInput, ClinicClient, BusinessProfileData
} from './types';
import { supabase } from '@/lib/supabase';
import { MockApiService } from './mockApiService';
import { Doctor } from '@/types/domain';

/** Sohbette görünen ad: işletmede işletme adı, kişide ad soyad, yoksa kullanıcı adı. */
function chatDisplayName(p: any): string {
    return (p?.role === 'business' && p?.business_name) || p?.full_name || p?.username || 'Moffi üyesi';
}

function mapChatMessage(msg: any, myId: string, time: string) {
    return {
        id: msg.id,
        text: msg.is_deleted ? '' : msg.content,
        attachmentUrl: msg.is_deleted ? null : msg.attachment_url,
        sentByMe: msg.sender_id === myId,
        senderId: msg.sender_id,
        time,
        createdAt: msg.created_at,
        read: !!msg.is_read,
        deleted: !!msg.is_deleted,
        conversationId: msg.conversation_id,
    };
}

export class SupabaseApiService implements IApiService {
    // Session is managed internally by Supabase client very efficiently.
    // Custom aggressive caching causes cross-account validation bugs.
    
    private pendingActionLocks = new Set<string>();
    private mockApi = new MockApiService();
    // Bir sayfa aynı anda 10-60 arası fonksiyon çağırıp her biri getSessionUser() istediğinde
    // (dashboard/home gibi çok-veri-çeken ekranlarda normal), hepsi paralel, gereksiz
    // /auth/v1/user isteği atıyordu — bu da Supabase auth rate limit'ine takılıp giriş
    // akışını aralıklı olarak bozabiliyordu (2026-09-23 kontrol turunda tespit edildi).
    // Kısa ömürlü bir promise cache/dedup ile aynı pencuredeki tüm çağrılar TEK ağ
    // isteğini paylaşır; TTL çok kısa olduğu için hesap değiştirme senaryosunda (bu
    // deduplication'ın önceden var olma sebebi) bayat veri riski yok.
    private sessionUserCache: { promise: Promise<any> | null; timestamp: number } = { promise: null, timestamp: 0 };
    private static readonly SESSION_USER_CACHE_MS = 2000;

    invalidateCache() {
        // No-op for backwards compatibility
    }

    private async getSessionUser() {
        const now = Date.now();
        if (this.sessionUserCache.promise && (now - this.sessionUserCache.timestamp) < SupabaseApiService.SESSION_USER_CACHE_MS) {
            return this.sessionUserCache.promise;
        }

        const promise = (async () => {
            try {
                // Use getUser() NOT getSession() — getSession() reads from local cache
                // and can return a stale/wrong user when switching accounts.
                // getUser() validates the token with the Supabase server every time.
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) {
                    console.error("Supabase auth getUser error:", error);
                    return null;
                }
                return user || null;
            } catch (err) {
                console.error("Critical Auth Error in getSessionUser:", err);
                return null;
            }
        })();

        this.sessionUserCache = { promise, timestamp: now };
        return promise;
    }


    // --- AUTH & PROFILE ---
    
    async fetchMarketPlaces(): Promise<any[]> {
        return [];
    }
    async fetchVets(): Promise<any[]> {
        return [];
    }

    async getCurrentUser(): Promise<UserProfile | null> {
        const user = await this.getSessionUser();
        if (!user) return null;
        
        // Add a safety timeout for the profile fetch to prevent infinite loading
        return Promise.race([
            this.getUserProfile(user.id),
            new Promise<null>((_, reject) => 
                setTimeout(() => reject(new Error("Profile fetch timeout")), 10000)
            )
        ]).catch(err => {
            console.error("getCurrentUser error or timeout:", err);
            return null;
        });
    }

    async getUserProfile(id: string): Promise<UserProfile | null> {
        // Kendi profili: tüm alanlar (profiles). Başkasının: sadece herkese açık kart (profile_cards) —
        // telefon, adres, IBAN gibi alanlar başkasına hiç gelmez.
        const me = await this.getSessionUser();
        const source = me?.id === id ? 'profiles' : 'profile_cards';
        const [profileRes, followersRes, followingRes] = await Promise.all([
            supabase.from(source).select('*').eq('id', id).single(),
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id)
        ]);

        if (profileRes.error || !profileRes.data) {
            console.warn('Profile not found:', profileRes.error);
            return null;
        }

        const data = profileRes.data;

        return {
            id: data.id,
            name: data.full_name || 'Moffi Kullanıcısı',
            username: data.username || data.full_name || 'moffi_user',
            avatar: data.avatar_url || undefined,
            cover_photo: data.aura_settings?.cover_photo || undefined,
            petName: data.pet_name,
            role: data.role || 'user',
            bio: data.bio,
            default_allow_comments: data.default_allow_comments ?? true,
            default_comment_privacy: data.default_comment_privacy || 'everyone',
            comment_filter_words: data.comment_filter_words || [],
            phone: data.phone,
            birth_date: data.birth_date,
            gender: data.gender,
            account_status: data.account_status || 'active',
            businessType: data.business_type,
            businessName: data.business_name,
            businessApproved: data.business_approved,
            kybStatus: data.kyb_status,
            taxId: data.tax_id,
            iban: data.iban,
            address: data.address,
            ownerName: data.owner_name,
            working_hours: data.working_hours,
            wallet_balance: data.wallet_balance || 0,
            moffi_coins: data.coin_balance || 0,
            settings: data.settings || {
                appearance: { auraStyle: 'minimal', accentColor: 'cyan', font: 'font-sans', auraVisible: true, auraIntensity: 100 },
                privacy: { smartShopEnabled: true }
            },
            stats: {
                followers: followersRes.count || 0,
                following: followingRes.count || 0,
                walks: 0,
                pets: 1,
                friends: 0
            }
        } as any;
    }

    async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Unauthorized');

        const upsertPayload: any = {
            id: user.id, // Required for upsert
            updated_at: new Date().toISOString()
        };

        if (updates.name !== undefined || updates.username !== undefined) {
            upsertPayload.full_name = updates.name || updates.username;
        }
        if (updates.username !== undefined) upsertPayload.username = updates.username;
        if (updates.avatar !== undefined) upsertPayload.avatar_url = updates.avatar ?? null;
        if ((updates as any).cover_photo !== undefined) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('aura_settings')
                .eq('id', user.id)
                .single();
            
            const currentAura = profileData?.aura_settings || {};
            upsertPayload.aura_settings = {
                ...currentAura,
                cover_photo: (updates as any).cover_photo ?? null
            };
        }
        if ((updates as any).petName !== undefined) upsertPayload.pet_name = (updates as any).petName;
        if (updates.bio !== undefined) upsertPayload.bio = updates.bio;

        if (updates.default_allow_comments !== undefined) upsertPayload.default_allow_comments = updates.default_allow_comments;
        if (updates.default_comment_privacy !== undefined) upsertPayload.default_comment_privacy = updates.default_comment_privacy;
        if (updates.comment_filter_words !== undefined) upsertPayload.comment_filter_words = updates.comment_filter_words;
        if (updates.phone !== undefined) upsertPayload.phone = updates.phone;
        if (updates.birth_date !== undefined) upsertPayload.birth_date = updates.birth_date;
        if (updates.gender !== undefined) upsertPayload.gender = updates.gender;
        if (updates.account_status !== undefined) upsertPayload.account_status = updates.account_status;
        if (updates.working_hours !== undefined) upsertPayload.working_hours = updates.working_hours;

        const { data, error } = await supabase
            .from('profiles')
            .upsert(upsertPayload)
            .select()
            .single();

        if (error) throw error;


        return {
            ...updates,
            id: data.id,
            name: data.full_name,
            avatar: data.avatar_url,
            cover_photo: data.aura_settings?.cover_photo || undefined,
            petName: data.pet_name,
            bio: data.bio,
            default_allow_comments: data.default_allow_comments ?? true,
            default_comment_privacy: data.default_comment_privacy || 'everyone',
            comment_filter_words: data.comment_filter_words || [],
            phone: data.phone,
            birth_date: data.birth_date,
            gender: data.gender,
            working_hours: data.working_hours,
            account_status: data.account_status || 'active'
        } as UserProfile;
    }

    async isUsernameAvailable(username: string): Promise<boolean> {
        if (!username) return false;
        const { data, error } = await supabase
            .from('profile_cards')
            .select('username')
            .eq('username', username.toLowerCase())
            .single();

        // PGRST116 means no row found, which is what we want
        if (error && error.code === 'PGRST116') return true;
        return !data;
    }













    // --- DIGITAL PASSPORT (Pets) ---
    async getPets(): Promise<Pet[]> {
        const user = await this.getSessionUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('pets')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching pets:', error);
            return [];
        }

        return data.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type || 'dog',
            breed: item.breed,
            age: item.age,
            gender: item.gender,
            image: item.avatar_url || '',
            avatar: item.avatar_url,
            cover_photo: item.cover_url,
            is_neutered: item.is_neutered,
            neutered: item.is_neutered, // Alias for UI compatibility
            size: item.size,
            microchip_id: item.microchip_no,
            microchip: item.microchip_no, // Alias for UI compatibility
            personality: item.character,
            is_lost: item.is_lost,
            sos_settings: item.sos_settings,
            birthday: item.birth_date || '',
            color: item.color || '',
            petvet_no: item.petvet_no || '',
            passport_no: item.passport_no || '',
            created_at: item.created_at,
            // Owner bilgileri — sos_settings.owner JSON'undan oku
            owner: item.sos_settings?.owner || null,
            ownerName: item.sos_settings?.owner?.name || '',
            ownerPhone: item.sos_settings?.owner?.phone || '',
            ownerAddress: item.sos_settings?.owner?.address || '',
            // Parazit tarihleri — sos_settings'ten oku
            parasiteInternal: item.sos_settings?.parasiteInternal || '',
            parasiteExternal: item.sos_settings?.parasiteExternal || '',
            // Hub-preview dashboard alanları — önce direkt kolon, yoksa sos_settings'den oku
            weight: item.weight ? (String(item.weight).includes('kg') ? String(item.weight) : `${item.weight} kg`) : (item.sos_settings?.weight || ''),
            health: item.health || item.sos_settings?.health || '',
            streak: typeof item.streak === 'number' ? item.streak : (item.sos_settings?.streak ?? 0),
            activity_target: typeof item.activity_target === 'number' ? item.activity_target : (item.sos_settings?.activity_target ?? 70),
            water_target: typeof item.water_target === 'number' ? item.water_target : (item.sos_settings?.water_target ?? 1200),
            food_target: typeof item.food_target === 'number' ? item.food_target : (item.sos_settings?.food_target ?? 1600),
        })) as Pet[];
    }

    async getActivePet(): Promise<Pet | null> {
        const pets = await this.getPets();
        if (pets.length === 0) return null;

        // Read active_pet_id from Supabase profiles (not localStorage)
        const user = await this.getSessionUser();
        if (user) {
            const { data } = await supabase
                .from('profiles')
                .select('active_pet_id')
                .eq('id', user.id)
                .single();
            if (data?.active_pet_id) {
                return pets.find(p => p.id === data.active_pet_id) || pets[0];
            }
        }
        return pets[0] || null;
    }

    async setActivePet(id: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) return;
        // Persist active_pet_id to Supabase profiles table
        await supabase
            .from('profiles')
            .update({ active_pet_id: id })
            .eq('id', user.id);
    }

    async addPet(pet: Partial<Pet>): Promise<Pet> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");

        let numericWeight: number | null = null;
        const rawWeight = pet.weight || (pet as any).sos_settings?.weight;
        if (rawWeight) {
            const match = String(rawWeight).match(/[\d.]+/);
            if (match) {
                numericWeight = parseFloat(match[0]);
            }
        }

        // Temel kolon seti — tüm pets tablolarında mevcut
        const basePayload: any = {
            owner_id: user.id,
            name: pet.name,
            type: pet.type,
            
            
            
            avatar_url: pet.image || pet.avatar,
            is_neutered: (pet as any).is_neutered || false,
            size: (pet as any).size,
            character: (pet as any).character || (pet as any).personality,
            birth_date: /^\d{4}-\d{2}-\d{2}$/.test(pet.birthday || '') ? pet.birthday : null,
            color: pet.color?.trim() || null,
            microchip_no: (pet as any).microchip_id,
            weight: numericWeight,
        };

        // sos_settings JSON kolonu varsa ekle — tüm izleme verileri burada
        const sosPayload = (pet as any).sos_settings 
            ? { ...basePayload, sos_settings: (pet as any).sos_settings }
            : basePayload;

        let data: any = null;
        let insertError: any = null;

        // 1. Deneme: sos_settings ile
        const res1 = await supabase.from('pets').insert(sosPayload).select().single();
        if (!res1.error) {
            data = res1.data;
        } else {
            insertError = res1.error;
            console.warn('addPet with sos_settings failed, trying without:', res1.error.message);

            // 2. Deneme: sos_settings olmadan (kolon yoksa)
            const res2 = await supabase.from('pets').insert(basePayload).select().single();
            if (!res2.error) {
                data = res2.data;
                insertError = null;
            } else {
                insertError = res2.error;
                console.warn('addPet base failed too:', res2.error.message);

                // 3. Deneme: Sadece zorunlu alanlar
                const minimalPayload = { owner_id: user.id, name: pet.name };
                const res3 = await supabase.from('pets').insert(minimalPayload).select().single();
                if (!res3.error) { data = res3.data; insertError = null; }
                else { insertError = res3.error; }
            }
        }

        if (insertError || !data) {
            console.error('addPet final error:', insertError);
            throw insertError || new Error('Pet kaydedilemedi');
        }
        
        // Auto-set as active
        const pets = await this.getPets();
        if (pets.length <= 1) {
            await this.setActivePet(data.id);
        }

        return {
            id: data.id,
            name: data.name,
            type: data.type,
            breed: data.breed,
            age: data.age,
            gender: data.gender,
            image: data.avatar_url,
            sos_settings: data.sos_settings,
        } as Pet;
    }


    async updatePet(id: string, updates: Partial<Pet>): Promise<Pet> {
        let numericWeight: number | null | undefined = undefined;
        const rawWeight = updates.weight || updates.sos_settings?.weight;
        if (rawWeight !== undefined) {
            if (rawWeight === null || rawWeight === '') {
                numericWeight = null;
            } else {
                const match = String(rawWeight).match(/[\d.]+/);
                numericWeight = match ? parseFloat(match[0]) : null;
            }
        }

        const dbUpdates: any = {
            name: updates.name,
            type: (updates as any).type,
            breed: updates.breed,
            age: updates.age,
            gender: updates.gender,
            avatar_url: updates.image || updates.avatar,
            cover_url: updates.cover_photo,
            // Key normalization: UI'dan her iki formda gelebilir
            is_neutered: (updates as any).is_neutered ?? (updates as any).neutered,
            size: (updates as any).size,
            // Key normalization: microchip her iki formda gelebilir
            microchip_no: (updates as any).microchip_id || (updates as any).microchip,
            // Kimlik alanları (Pet Pasaportu → Kimlik Bilgileri); boş değer "girilmedi" demek.
            birth_date: updates.birthday !== undefined ? (/^\d{4}-\d{2}-\d{2}$/.test(updates.birthday || '') ? updates.birthday : null) : undefined,
            color: updates.color !== undefined ? (updates.color?.trim() || null) : undefined,
            petvet_no: updates.petvet_no !== undefined ? (updates.petvet_no?.trim() || null) : undefined,
            character: (updates as any).character || (updates as any).personality,
            is_lost: updates.is_lost,
            // Günlük hedefler (aktivite/su/mama) ayrı kolon değil, sos_settings içinde durur;
            // çağıran taraf güncel sos_settings'i hedeflerle birleştirip gönderir. Önceden burada
            // var olmayan kolonlara yazıldığı için tüm güncelleme reddediliyordu.
            sos_settings: updates.sos_settings,
            weight: numericWeight,
        };

        // Remove undefined keys
        Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);

        const { data, error } = await supabase
            .from('pets')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return updates as Pet; // For simplicity in UI update
    }

    async deletePet(id: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");
        const { error } = await supabase
            .from('pets')
            .delete()
            .eq('id', id)
            .eq('owner_id', user.id);
        if (error) throw error;
    }

    // --- TEMPORARY MOCK FALLBACKS (Until next phases) ---
    getInboxMessages = async () => {
        const user = await this.getSessionUser();
        if (!user) return [];
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false });
        return data || [];
    };

    addInboxMessage = async (m: any) => {
        await supabase.from('messages').insert(m);
    };


    // --- MARKETPLACE & COMMERCE ---
    async getProducts(category?: ShopCategory): Promise<ShopProduct[]> {
        let query = supabase.from('products').select('*');
        if (category && (category as string) !== 'Hepsi') {
            query = query.eq('category', category.toLowerCase());
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return [];

        return data.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: Number(p.price),
            oldPrice: p.old_price ? Number(p.old_price) : undefined,
            image: p.image_url,
            category: p.category as ShopCategory,
            
            inStock: p.stock > 0,
            stockCount: p.stock,
            rating: Number(p.rating) || 4.5,
            reviews: Number(p.review_count) || 0,
            isVetApproved: p.is_vet_approved || false,
            tag: p.tag || undefined,
            ownerId: p.owner_id || undefined
        }));
    }

    async getCart(): Promise<ShopCartItem[]> {
        const user = await this.getSessionUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', user.id);

        if (error) return [];

        return data.map((item: any) => ({
            productId: item.product_id,
            quantity: item.quantity,
            addedAt: item.created_at
        }));
    }

    async addToCart(productId: string, quantity: number): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");

        const { error } = await supabase
            .from('cart_items')
            .upsert({ 
                user_id: user.id, 
                product_id: productId, 
                quantity: quantity 
            }, { onConflict: 'user_id,product_id' });

        if (error) throw error;
    }

    async updateCartItem(productId: string, quantity: number): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) return;

        if (quantity <= 0) {
            await this.removeFromCart(productId);
            return;
        }

        const { error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('user_id', user.id)
            .eq('product_id', productId);

        if (error) throw error;
    }

    async removeFromCart(productId: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) return;

        await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);
    }

    async clearCart(): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) return;

        await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);
    }

    async getOrders(): Promise<ShopOrder[]> {
        const user = await this.getSessionUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(
                    quantity,
                    price_at_purchase,
                    product:products(*)
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) return [];

        return data.map((o: any) => ({
            id: o.id,
            userId: o.user_id,
            totalPrice: Number(o.total_amount),
            status: o.status,
            createdAt: o.created_at,
            updatedAt: o.updated_at || o.created_at,
            shippingAddress: o.shipping_address,
            items: o.items.map((item: any) => ({
                quantity: item.quantity,
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    price: Number(item.price_at_purchase),
                    image: item.product.image_url,
                    category: item.product.category,
                    
                    inStock: true,
                    rating: Number(item.product.rating) || 4.5,
                    reviews: Number(item.product.review_count) || 0
                }
            }))
        }));
    }




    async upgradeSubscription(planType: 'free' | 'plus' | 'pro'): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        const { error } = await supabase
            .from('user_subscriptions')
            .upsert({
                user_id: user.id,
                plan_type: planType,
                status: planType === 'free' ? 'cancelled' : 'active',
                end_date: planType === 'free' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            }, { onConflict: 'user_id' });
        if (error) throw error;
    }

    async addBalance(amount: number, type: 'fiat' | 'coin'): Promise<void> {
        // [GÜVENLİK YAMASI] - KRİTİK AÇIK KAPATILDI
        // Bu işlem tamamen istemci tarafında çalışıyordu ve cüzdan/coin bakiyesinin sınırsız manipüle edilmesine olanak tanıyordu.
        // Bu fonksiyon devre dışı bırakılmıştır. Bakiye artırma işlemleri yalnızca sunucu tarafında (Server-side) 
        // ve gerçek ödeme webhook'ları (Örn: PayTR/Stripe API rotası) üzerinden yapılmalıdır.
        console.error("GÜVENLİK İHLALİ: İstemci tarafından bakiye artırma işlemi engellendi!");
        throw new Error("Geçersiz işlem: Bakiye yalnızca yetkili ödeme kanalları aracılığıyla eklenebilir.");
    }

    async updateAuraSettings(settings: any): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        const { error } = await supabase
            .from('profiles')
            .update({ aura_settings: settings })
            .eq('id', user.id);
        if (error) throw error;
    }

    // --- FAZ 7: MOFFİ PUANI (PP) — transaction-tabanlı, coin_balance/PawCoin'den TAMAMEN AYRI ---
    // Yazma işlemleri her zaman SECURITY DEFINER RPC üzerinden gider (award_pati_puan) —
    // istemci doğrudan point_transactions'a veya profiles.pati_puan_balance'a yazamaz.
    async awardPatiPuan(amount: number, reason: string, source: string, referenceId?: string): Promise<number> {
        const { data, error } = await supabase.rpc('award_pati_puan', {
            p_amount: amount,
            p_reason: reason,
            p_source: source,
            p_reference_id: referenceId ?? null
        });
        if (error) throw error;
        return data as number;
    }

    async getPatiPuanBalance(): Promise<number> {
        const user = await this.getSessionUser();
        if (!user) return 0;
        const { data, error } = await supabase.from('profiles').select('pati_puan_balance').eq('id', user.id).single();
        if (error || !data) return 0;
        return data.pati_puan_balance || 0;
    }

    async getPatiPuanHistory(limit: number = 30) {
        const user = await this.getSessionUser();
        if (!user) return [];
        const { data, error } = await supabase
            .from('point_transactions')
            .select('id, amount, reason, source, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error || !data) return [];
        return data;
    }

    async getNearbyClinics(province?: string, district?: string, lat?: number | null, lng?: number | null, businessType?: string): Promise<any[]> {
        // Since we are no longer using the clinics table, we fetch approved businesses from profiles
        let query = supabase
            .from('profile_cards')
            .select('*')
            .eq('role', 'business')
            .eq('business_approved', true);

        if (province) {
            query = query.eq('province', province);
        }
        if (district) {
            query = query.eq('district', district);
        }
        if (businessType) {
            query = query.eq('business_type', businessType);
        }

        const { data, error } = await query;

        if (error || !data) {
            console.error("Error fetching nearby businesses:", error);
            return [];
        }
        if (data.length === 0) return [];

        return this.mapClinicProfiles(data, lat ?? null, lng ?? null);
    }

    // Klinik kartı verisi (liste, harita, favoriler, acil) tek yerde üretilir.
    private async mapClinicProfiles(data: any[], lat: number | null, lng: number | null): Promise<any[]> {
        const clinicIds = data.map((d: any) => d.id);
        const [{ data: servicesData }, { data: reviewsData }, { data: openData }] = await Promise.all([
            supabase.from('clinic_services').select('clinic_id, service_name').in('clinic_id', clinicIds),
            supabase.from('clinic_reviews').select('clinic_id, rating').in('clinic_id', clinicIds),
            supabase.rpc('get_clinics_open_status', { p_clinic_ids: clinicIds })
        ]);
        const openMap = new Map<string, { is_open: boolean; closes_at: string | null; opens_at: string | null }>(
            (openData || []).map((o: any) => [o.clinic_id, o])
        );
        
        const servicesMap = new Map();
        if (servicesData) {
            servicesData.forEach((s: any) => {
                if (!servicesMap.has(s.clinic_id)) servicesMap.set(s.clinic_id, []);
                servicesMap.get(s.clinic_id).push(s.service_name);
            });
        }

        // YENİ 2: Hangi kliniğin kaç puanı olduğunu grupla ve map'te tut
        const reviewsMap = new Map();
        if (reviewsData) {
            reviewsData.forEach((r: any) => {
                if (!reviewsMap.has(r.clinic_id)) reviewsMap.set(r.clinic_id, { sum: 0, count: 0 });
                const stats = reviewsMap.get(r.clinic_id);
                stats.sum += r.rating;
                stats.count += 1;
            });
        }

        return data.map((profile: any) => {
            const cServices = servicesMap.get(profile.id) || [];
            const pLat = profile.business_lat ? parseFloat(profile.business_lat) : null;
            const pLng = profile.business_lng ? parseFloat(profile.business_lng) : null;
            
            // YENİ 3: Ortalamayı hesapla
            const rStats = reviewsMap.get(profile.id);
            const avgRating = rStats && rStats.count > 0 ? (rStats.sum / rStats.count) : 0;
            const rCount = rStats ? rStats.count : 0;
            
            let distKm = 999999;
            if (pLat !== null && pLng !== null && lat && lng) {
                distKm = 6371 * Math.acos(
                    Math.sin(lat * Math.PI / 180) * Math.sin(pLat * Math.PI / 180) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(pLat * Math.PI / 180) * Math.cos((pLng - lng) * Math.PI / 180)
                );
                if (isNaN(distKm)) distKm = 0;
            }

            return {
                id: profile.id,
                name: profile.business_name || profile.full_name || 'İşletme',
                imageUrl: profile.cover_url || profile.avatar_url || null,
                logoUrl: profile.avatar_url || null,
                rating: avgRating ? parseFloat(avgRating.toFixed(1)) : 0, // B14
                reviewCount: rCount,
                address: profile.address || 'Adres bilgisi girilmedi',
                location: pLat !== null && pLng !== null ? { lat: pLat, lng: pLng } : null,
                is_premium: Boolean(profile.is_premium),
                isVerified: profile.business_approved === true,
                isOpenNow: openMap.get(profile.id)?.is_open === true,
                closesAt: openMap.get(profile.id)?.closes_at || null,
                opensAt: openMap.get(profile.id)?.opens_at || null,
                features: cServices.length > 0 ? cServices : [],
                phone: profile.phone || '',
                distance: pLat !== null && pLng !== null && lat && lng ? `${distKm.toFixed(1)} km` : 'Konum Belirtilmemiş',
                calculated_distance: distKm,
                type: profile.business_type || "vet"
            };
        })
        .sort((a, b) => a.calculated_distance - b.calculated_distance);
    }

    async getClinicDetails(clinicId: string): Promise<any> {
        const { data, error } = await supabase
            .from('profile_cards')
            .select('*')
            .eq('id', clinicId)
            .single();

        if (error || !data) return null;

        const pLat = data.business_lat ? parseFloat(data.business_lat) : null;
        const pLng = data.business_lng ? parseFloat(data.business_lng) : null;

        const reviewsRes = await this.getClinicReviews(clinicId);
        const services = await this.getClinicServices(clinicId);

        const { data: doctorsData } = await supabase
            .from('doctors')
            .select('id, name, title, photo_url')
            .eq('clinic_id', clinicId)
            .eq('is_active', true);

        const doctors = (doctorsData || []).map((d: any) => ({
            id: d.id,
            name: d.name,
            specialization: d.title,
            imageUrl: d.photo_url,
        }));

        const { data: openData } = await supabase.rpc('get_clinics_open_status', { p_clinic_ids: [clinicId] });
        const openStatus = openData?.[0];
        const dayOrder: [string, string][] = [
            ['monday', 'Pazartesi'], ['tuesday', 'Salı'], ['wednesday', 'Çarşamba'], ['thursday', 'Perşembe'],
            ['friday', 'Cuma'], ['saturday', 'Cumartesi'], ['sunday', 'Pazar']
        ];
        const weeklyHours = data.working_hours
            ? dayOrder.map(([key, label]) => {
                const day = data.working_hours[key];
                const closed = !day || day.closed === true;
                return { day: label, text: closed ? 'Kapalı' : `${day.open || '09:00'} – ${day.close || '18:00'}` };
            })
            : [];

        return {
            id: data.id,
            name: data.business_name || data.full_name || 'İşletme',
            imageUrl: data.avatar_url || null,
            rating: reviewsRes.averageRating ? parseFloat(reviewsRes.averageRating.toFixed(1)) : 0,
            reviewCount: reviewsRes.reviews.length || 0,
            address: data.address || 'Adres bilgisi girilmedi',
            location: pLat !== null && pLng !== null ? { lat: pLat, lng: pLng } : null,
            phone: data.phone || '',
            type: data.business_type || "vet",
            isOpenNow: openStatus?.is_open === true,
            closesAt: openStatus?.closes_at || null,
            opensAt: openStatus?.opens_at || null,
            weeklyHours,
            services: services,
            about: data.bio || null,
            website: data.website || null,
            coverUrl: data.cover_url || null,
            isVerified: data.business_approved === true,
            gallery: (data.gallery_urls || []).filter(Boolean),
            doctors: doctors,
        };
    }

    async getFavoriteClinicIds(): Promise<string[]> {
        const user = await this.getSessionUser();
        if (!user) return [];
        const { data } = await supabase.from('favorite_clinics').select('clinic_id').eq('user_id', user.id);
        return (data || []).map((r: any) => r.clinic_id);
    }

    async setFavoriteClinic(clinicId: string, favorite: boolean): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Favorilere eklemek için giriş yapmalısın.');
        const { error } = favorite
            ? await supabase.from('favorite_clinics').upsert({ user_id: user.id, clinic_id: clinicId })
            : await supabase.from('favorite_clinics').delete().eq('user_id', user.id).eq('clinic_id', clinicId);
        if (error) throw error;
    }

    async getClinicsByIds(clinicIds: string[]): Promise<any[]> {
        if (clinicIds.length === 0) return [];
        const { data, error } = await supabase
            .from('profile_cards')
            .select('*')
            .in('id', clinicIds)
            .eq('role', 'business')
            .eq('business_approved', true);
        if (error || !data) return [];
        return this.mapClinicProfiles(data, null, null);
    }

    async getReminderPrefs(): Promise<{ h24: boolean; h2: boolean; day: boolean }> {
        const user = await this.getSessionUser();
        const fallback = { h24: true, h2: true, day: true };
        if (!user) return fallback;
        const { data } = await supabase.from('profiles').select('reminder_prefs').eq('id', user.id).maybeSingle();
        return { ...fallback, ...(data?.reminder_prefs || {}) };
    }

    async setReminderPrefs(prefs: { h24: boolean; h2: boolean; day: boolean }): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        const { error } = await supabase.from('profiles').update({ reminder_prefs: prefs }).eq('id', user.id);
        if (error) throw error;
    }

    async getBusinessProfile(): Promise<BusinessProfileData | null> {
        const user = await this.getSessionUser();
        if (!user) return null;
        const { data, error } = await supabase
            .from('profiles')
            .select('business_name, bio, phone, website, address, province, district, business_lat, business_lng, avatar_url, cover_url, gallery_urls')
            .eq('id', user.id)
            .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        return {
            businessName: data.business_name || '',
            about: data.bio || '',
            phone: data.phone || '',
            website: data.website || '',
            address: data.address || '',
            province: data.province || '',
            district: data.district || '',
            lat: data.business_lat != null ? Number(data.business_lat) : null,
            lng: data.business_lng != null ? Number(data.business_lng) : null,
            logoUrl: data.avatar_url || null,
            coverUrl: data.cover_url || null,
            gallery: data.gallery_urls || [],
        };
    }

    async updateBusinessProfile(p: BusinessProfileData): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        const { data, error } = await supabase
            .from('profiles')
            .update({
                business_name: p.businessName.trim() || null,
                bio: p.about.trim() || null,
                phone: p.phone.trim() || null,
                website: p.website.trim() || null,
                address: p.address.trim() || null,
                province: p.province || null,
                district: p.district || null,
                business_lat: p.lat,
                business_lng: p.lng,
                avatar_url: p.logoUrl,
                cover_url: p.coverUrl,
                gallery_urls: p.gallery,
            })
            .eq('id', user.id)
            .select('id');
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Profil güncellenemedi.');
    }

    async getMySharedPassports(): Promise<{ id: string; clinicName: string; petName: string; date: string; sharedFields: string[] }[]> {
        const user = await this.getSessionUser();
        if (!user) return [];
        const { data } = await supabase
            .from('appointments')
            .select('id, created_at, clinic_id, shared_passport, pet:pets(name)')
            .eq('user_id', user.id)
            .not('shared_passport', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50);
        const clinicIds = [...new Set((data || []).map((a: any) => a.clinic_id))];
        const { data: clinics } = clinicIds.length
            ? await supabase.from('profile_cards').select('id, business_name, full_name').in('id', clinicIds)
            : { data: [] as any[] };
        const names = new Map((clinics || []).map((c: any) => [c.id, c.business_name || c.full_name || 'İşletme']));
        return (data || []).map((a: any) => {
            const sp = a.shared_passport || {};
            return {
                id: a.id,
                clinicName: names.get(a.clinic_id) || 'İşletme',
                petName: a.pet?.name || 'Evcil hayvan',
                date: new Date(a.created_at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }),
                sharedFields: [
                    sp.basic ? 'Temel bilgiler' : null,
                    sp.vaccines ? 'Aşı geçmişi' : null,
                    sp.healthNotes ? 'Sağlık notları' : null,
                    sp.ownerInfo ? 'İletişim bilgileri' : null
                ].filter(Boolean) as string[]
            };
        }).filter(l => l.sharedFields.length > 0);
    }

    async createAppointment(dto: any): Promise<any> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        // Çakışma kontrolü veritabanındaki appointments_no_overlap kısıtında; durum her zaman 'pending' başlar.
        const { data, error } = await supabase
            .from('appointments')
            .insert({
                user_id: user.id,
                pet_id: dto.petId || null,
                clinic_id: dto.clinicId || null,
                clinic_name: dto.clinicName || '',
                doctor_name: dto.doctorName || '',
                doctor_id: dto.doctorId || null,
                appointment_date: dto.appointmentDate || dto.date,
                reason: dto.notes || dto.reason || '',
                payment_id: dto.paymentId || null,
                payment_amount: dto.paymentAmount || null,
                payment_status: dto.paymentStatus || null,
                shared_passport: dto.sharedPassport || null,
                duration_minutes: dto.duration_minutes || 30
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23P01') {
                throw Object.assign(new Error("Bu saat az önce doldu, lütfen başka bir saat seç."), { code: 'SLOT_TAKEN' });
            }
            throw error;
        }
        return data;
    }

    async getAvailableSlots(clinicId: string, date: string, durationMinutes: number | null, doctorId: string | null): Promise<{ slot_time: string; available: boolean }[]> {
        const { data, error } = await supabase.rpc('get_available_slots', {
            p_clinic_id: clinicId,
            p_date: date,
            p_minutes: durationMinutes,
            p_doctor_id: doctorId
        });
        if (error) throw error;
        return data || [];
    }

    async createBusinessAppointment(input: BusinessAppointmentInput): Promise<string> {
        const { data, error } = await supabase.rpc('create_business_appointment', {
            p_start: input.start,
            p_minutes: input.durationMinutes,
            p_service_name: input.serviceName,
            p_doctor_id: input.doctorId || null,
            p_user_id: input.userId || null,
            p_pet_id: input.petId || null,
            p_guest_name: input.guestName || null,
            p_guest_phone: input.guestPhone || null,
            p_guest_pet_name: input.guestPetName || null,
            p_guest_pet_species: input.guestPetSpecies || null,
            p_notes: input.notes || null,
            p_ignore_hours: input.ignoreHours === true
        });
        if (error) {
            if (error.code === '23P01') throw Object.assign(new Error(error.message), { code: 'SLOT_TAKEN' });
            throw new Error(error.message);
        }
        return data as string;
    }

    async rescheduleAppointment(appointmentId: string, newStart: string, doctorId: string | null, ignoreHours: boolean): Promise<void> {
        const { error } = await supabase.rpc('reschedule_appointment', {
            p_appointment_id: appointmentId,
            p_new_start: newStart,
            p_doctor_id: doctorId,
            p_ignore_hours: ignoreHours
        });
        if (error) {
            if (error.code === '23P01') throw Object.assign(new Error(error.message), { code: 'SLOT_TAKEN' });
            throw new Error(error.message);
        }
    }

    async requestReschedule(appointmentId: string, newStart: string): Promise<void> {
        const { error } = await supabase.rpc('request_reschedule', { p_appointment_id: appointmentId, p_new_start: newStart });
        if (error) {
            if (error.code === '23P01') throw Object.assign(new Error(error.message), { code: 'SLOT_TAKEN' });
            throw new Error(error.message);
        }
    }

    async respondReschedule(appointmentId: string, accept: boolean): Promise<void> {
        const { error } = await supabase.rpc('respond_reschedule', { p_appointment_id: appointmentId, p_accept: accept });
        if (error) throw new Error(error.message);
    }

    async getVisitSummary(appointmentId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('medical_records')
            .select('id, vet_name, diagnosis, critical_notes, weight_kg, temperature_c, medications, cost, created_at')
            .eq('appointment_id', appointmentId)
            .maybeSingle();
        if (error) {
            console.error("Error fetching visit summary:", error);
            return null;
        }
        return data;
    }

    async getCancellationNoticeHours(clinicId: string): Promise<number> {
        const { data } = await supabase.from('profile_cards').select('cancellation_notice_hours').eq('id', clinicId).maybeSingle();
        return data?.cancellation_notice_hours || 0;
    }

    async getClinicClients(): Promise<ClinicClient[]> {
        const { data, error } = await supabase.rpc('get_clinic_clients');
        if (error) {
            console.error("Error fetching clinic clients:", error);
            return [];
        }
        return data || [];
    }

    async saveClientNote(clinicId: string, clientKey: string, note: string): Promise<void> {
        const { error } = await supabase
            .from('clinic_client_notes')
            .upsert({ clinic_id: clinicId, client_key: clientKey, note, updated_at: new Date().toISOString() });
        if (error) throw error;
    }

    async getClinicCalendar(clinicId: string, fromDate: string, days: number): Promise<{ day: string; is_open: boolean }[]> {
        const { data, error } = await supabase.rpc('get_clinic_calendar', {
            p_clinic_id: clinicId,
            p_from: fromDate,
            p_days: days
        });
        if (error) throw error;
        return data || [];
    }

    async getAppointments(userId: string): Promise<any[]> {
        const user = await this.getSessionUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                pet:pets(*),
                doctor:doctors(name)
            `)
            .eq('user_id', user.id)
            .order('appointment_date', { ascending: true });

        if (error) {
            console.error("Error in getAppointments:", error);
            return [];
        }
        // Klinik bilgisi herkese açık işletme kartından (profiles artık sadece sahibine açık).
        const clinicIds = Array.from(new Set((data || []).map((a: any) => a.clinic_id).filter(Boolean)));
        const clinics: Record<string, any> = {};
        if (clinicIds.length > 0) {
            const { data: cards } = await supabase.from('profile_cards')
                .select('id, business_name, avatar_url, address, phone').in('id', clinicIds);
            (cards || []).forEach((c: any) => { clinics[c.id] = c; });
        }
        return (data || []).map((a: any) => ({
            ...a,
            clinic: clinics[a.clinic_id]
                ? { business_name: clinics[a.clinic_id].business_name, avatar_url: clinics[a.clinic_id].avatar_url, address: clinics[a.clinic_id].address, phone: clinics[a.clinic_id].phone }
                : null,
        }));
    }

    async cancelAppointment(appointmentId: string): Promise<void> {
        // Durum geçişi ve karşı tarafa bildirim sunucudaki transition_appointment içinde.
        const { error } = await supabase.rpc('transition_appointment', {
            p_appointment_id: appointmentId,
            p_status: 'cancelled'
        });
        if (error) throw error;
    }

    async getClinicAppointments(clinicId: string): Promise<any[]> {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clinicId);
        
        let query = supabase
            .from('appointments')
            .select(`
                *,
                pet:pets(*),
                user:profiles!appointments_user_id_fkey(full_name, username, avatar_url, phone),
                doctor:doctors(name)
            `);
            
        if (isUuid) {
            query = query.eq('clinic_id', clinicId);
        }
        
        const { data, error } = await query.order('appointment_date', { ascending: false });

        if (error) {
            console.error("Error in getClinicAppointments:", error);
            return [];
        }
        if (!data) return [];

        return data;
    }

    async getClinicServices(clinicId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('clinic_services')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching clinic services:", error);
            return [];
        }
        return data || [];
    }

    async getClinicDoctors(clinicId: string): Promise<Doctor[]> {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('clinic_id', clinicId)
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching clinic doctors:", error);
            return [];
        }
        return data || [];
    }

    async getAllClinicDoctors(clinicId: string): Promise<Doctor[]> {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching all clinic doctors:", error);
            return [];
        }
        return data || [];
    }

    async createDoctor(dto: { clinicId: string; name: string; title?: string; photoUrl?: string }): Promise<Doctor> {
        const { data, error } = await supabase
            .from('doctors')
            .insert({
                clinic_id: dto.clinicId,
                name: dto.name,
                title: dto.title || null,
                photo_url: dto.photoUrl || null,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating doctor:", error);
            throw error;
        }
        return data;
    }

    async updateDoctor(id: string, dto: { name?: string; title?: string; photoUrl?: string; isActive?: boolean }): Promise<Doctor> {
        const updateData: any = {};
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.title !== undefined) updateData.title = dto.title;
        if (dto.photoUrl !== undefined) updateData.photo_url = dto.photoUrl;
        if (dto.isActive !== undefined) updateData.is_active = dto.isActive;

        const { data, error } = await supabase
            .from('doctors')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Error updating doctor:", error);
            throw error;
        }
        return data;
    }

    async getClinicDashboardStats(clinicId: string): Promise<any> {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clinicId);
        if (!isUuid) return { totalBalance: 0, totalPatients: 0, recentPatients: [] };

        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*, user:profiles!appointments_user_id_fkey(id, full_name, username, avatar_url, phone)')
            .eq('clinic_id', clinicId)
            .order('appointment_date', { ascending: false });

        if (error || !appointments) {
            return { totalBalance: 0, totalPatients: 0, recentPatients: [] };
        }

        // Bakiye (Balance) calculation
        const totalBalance = appointments
            .filter((a: any) => a.status === 'confirmed' || a.status === 'completed')
            .reduce((sum: number, a: any) => sum + (a.payment_amount || 0), 0);

        // Unique Patients
        const uniquePatientIds = new Set();
        const recentPatients: any[] = [];
        appointments.forEach((a: any) => {
            if (a.user_id && !uniquePatientIds.has(a.user_id)) {
                uniquePatientIds.add(a.user_id);
                if (a.user && recentPatients.length < 5) {
                    recentPatients.push(a.user);
                }
            }
        });

        const completedCount = appointments.filter((a: any) => a.status === 'completed').length;

        // Faz 1 (işletme türü mimarisi) — Dashboard'daki uydurma "Toplam Gösterim"/
        // "Sayfa Tıklaması" (randevu sayısının rastgele katı) yerine gerçek bir
        // ortalama puan gösterebilmek için gerçek clinic_reviews verisi.
        const { data: reviews } = await supabase
            .from('clinic_reviews')
            .select('rating')
            .eq('clinic_id', clinicId);
        const reviewCount = reviews?.length || 0;
        const averageRating = reviewCount > 0
            ? reviews!.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewCount
            : 0;

        return {
            totalBalance,
            totalPatients: uniquePatientIds.size,
            recentPatients,
            appointmentsCount: appointments.length,
            completedCount,
            averageRating,
            reviewCount
        };
    }

    // İzinli geçişler ve karşı tarafa bildirim sunucudaki transition_appointment içinde tanımlı.
    async updateAppointmentStatus(appointmentId: string, status: string, reason?: string): Promise<void> {
        const { error } = await supabase.rpc('transition_appointment', {
            p_appointment_id: appointmentId,
            p_status: status,
            p_reason: reason || null
        });
        if (error) throw error;
    }

    async updateAttendanceStatus(appointmentId: string, attendanceStatus: 'attended' | 'no_show' | null): Promise<void> {
        const { error } = await supabase.rpc('set_appointment_attendance', {
            p_appointment_id: appointmentId,
            p_attendance: attendanceStatus
        });
        if (error) throw error;
    }

    // Bir müşterinin toplam 'gelmedi' (no_show) sayısını döndürür (Faz 9)
    async getNoShowCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('attendance_status', 'no_show');

        if (error) {
            console.error("Error fetching no-show count:", error);
            return 0;
        }
        return count || 0;
    }

    async getClinicSettings(clinicId: string): Promise<any> {
        const [settingsRes, profileRes] = await Promise.all([
            supabase.from('clinic_settings').select('*').eq('clinic_id', clinicId).maybeSingle(),
            supabase.from('profile_cards').select('working_hours').eq('id', clinicId).maybeSingle()
        ]);

        if (settingsRes.error) {
            console.error("Error fetching clinic settings:", settingsRes.error);
            return null;
        }

        const data = settingsRes.data;
        if (!data) return null;

        return {
            workingDays: data.working_days,
            startTime: data.start_time,
            endTime: data.end_time,
            lunchStart: data.lunch_start,
            lunchEnd: data.lunch_end,
            slotDuration: data.slot_duration,
            working_hours: profileRes.data?.working_hours
        };
    }

    async getClinicExceptions(clinicId: string, startDate?: string, endDate?: string): Promise<any[]> {
        let query = supabase.from('clinic_schedule_exceptions').select('*').eq('clinic_id', clinicId);
        
        if (startDate) {
            query = query.gte('exception_date', startDate);
        }
        if (endDate) {
            query = query.lte('exception_date', endDate);
        }
        
        const { data, error } = await query.order('exception_date', { ascending: true });
        
        if (error) {
            console.error("Error fetching clinic exceptions:", error);
            return [];
        }
        return data || [];
    }

    async upsertClinicException(clinicId: string, date: string, isClosed: boolean, openTime: string | null = null, closeTime: string | null = null, note: string = ""): Promise<boolean> {
        const { error } = await supabase.from('clinic_schedule_exceptions').upsert({
            clinic_id: clinicId,
            exception_date: date,
            is_closed: isClosed,
            open_time: openTime,
            close_time: closeTime,
            note: note
        }, {
            onConflict: 'clinic_id, exception_date'
        });

        if (error) {
            console.error("Error upserting clinic exception:", error);
            return false;
        }
        return true;
    }

    async deleteClinicException(clinicId: string, date: string): Promise<boolean> {
        const { error } = await supabase.from('clinic_schedule_exceptions')
            .delete()
            .eq('clinic_id', clinicId)
            .eq('exception_date', date);

        if (error) {
            console.error("Error deleting clinic exception:", error);
            return false;
        }
        return true;
    }

    // --- FAZ 7: CLINIC REVIEWS ---
    async getClinicReviews(clinicId: string): Promise<{ reviews: any[], averageRating: number }> {
        const { data, error } = await supabase
            .from('clinic_reviews')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching clinic reviews:", error);
            return { reviews: [], averageRating: 0 };
        }

        const reviews = data || [];
        
        // Fetch user profiles manually to avoid PostgREST relationship ambiguity
        const userIds = [...new Set(reviews.map((r: any) => r.user_id))];
        let profilesMap: Record<string, any> = {};
        if (userIds.length > 0) {
            const { data: profiles } = await supabase.from('profile_cards').select('id, full_name, username, avatar_url').in('id', userIds);
            if (profiles) {
                profiles.forEach((p: any) => { profilesMap[p.id] = p; });
            }
        }

        const averageRating = reviews.length > 0 
            ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
            : 0;

        return { 
            reviews: reviews.map((r: any) => ({
                id: r.id,
                clinic_id: r.clinic_id,
                user_id: r.user_id,
                appointment_id: r.appointment_id,
                rating: r.rating,
                comment: r.comment,
                clinic_reply: r.clinic_reply,
                clinic_replied_at: r.clinic_replied_at,
                created_at: r.created_at,
                user: {
                    name: profilesMap[r.user_id]?.full_name || profilesMap[r.user_id]?.username || 'Gizli Kullanıcı',
                    avatar: profilesMap[r.user_id]?.avatar_url || null
                }
            })), 
            averageRating 
        };
    }

    async submitReview(clinicId: string, appointmentId: string, rating: number, comment?: string): Promise<boolean> {
        const user = await this.getSessionUser();
        if (!user) return false;

        const { error } = await supabase
            .from('clinic_reviews')
            .insert({
                clinic_id: clinicId,
                user_id: user.id,
                appointment_id: appointmentId,
                rating,
                comment
            });

        if (error) {
            console.error("Error submitting review:", error);
            return false;
        }
        return true;
    }

    async getReviewableAppointments(userId: string): Promise<any[]> {
        // Fetch confirmed appointments in the past
        const { data: appointments, error: aptError } = await supabase
            .from('appointments')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['confirmed', 'completed'])
            .lt('appointment_date', new Date().toISOString())
            .order('appointment_date', { ascending: false });

        if (aptError) {
            console.error("Error fetching reviewable appointments:", aptError);
            return [];
        }
        
        if (!appointments || appointments.length === 0) return [];

        // Fetch their reviews
        const aptIds = appointments.map((a: any) => a.id);
        const { data: reviews } = await supabase.from('clinic_reviews').select('appointment_id').in('appointment_id', aptIds);
        const reviewedAptIds = new Set((reviews || []).map((r: any) => r.appointment_id));

        // Filter out reviewed ones
        const reviewable = appointments.filter((a: any) => !reviewedAptIds.has(a.id));
        
        if (reviewable.length === 0) return [];
        
        // Enrich with clinic info
        const clinicIds = [...new Set(reviewable.map((a: any) => a.clinic_id))];
        const { data: clinics } = await supabase.from('profile_cards').select('id, business_name, full_name, avatar_url').in('id', clinicIds);
        const clinicMap: Record<string, any> = {};
        if (clinics) {
            clinics.forEach((c: any) => { clinicMap[c.id] = c; });
        }
        
        return reviewable.map((a: any) => ({
            ...a,
            clinic: clinicMap[a.clinic_id] ? { 
                name: clinicMap[a.clinic_id].business_name || clinicMap[a.clinic_id].full_name || 'Klinik', 
                avatar_url: clinicMap[a.clinic_id].avatar_url 
            } : { name: 'Klinik' }
        }));
    }

    async replyToReview(reviewId: string, clinicId: string, replyText: string): Promise<boolean> {
        const { error } = await supabase
            .from('clinic_reviews')
            .update({
                clinic_reply: replyText,
                clinic_replied_at: new Date().toISOString()
            })
            .eq('id', reviewId)
            .eq('clinic_id', clinicId);

        if (error) {
            console.error("Error replying to review:", error);
            return false;
        }
        return true;
    }


    async saveClinicSettings(clinicId: string, settings: any): Promise<void> {
        const { error } = await supabase
            .from('clinic_settings')
            .upsert({
                clinic_id: clinicId,
                working_days: settings.workingDays,
                start_time: settings.startTime,
                end_time: settings.endTime,
                lunch_start: settings.lunchStart,
                lunch_end: settings.lunchEnd,
                slot_duration: settings.slotDuration,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    }

    // --- BESLENME PLANLARI ---
    async getNutritionPlan(petId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('nutrition_plans')
            .select('*')
            .eq('pet_id', petId)
            .single();

        if (error || !data) return null;
        return {
            petId: data.pet_id,
            dailyCalories: data.daily_calories,
            foodType: data.food_type,
            feedingTimes: data.feeding_times || [],
            notes: data.notes,
            vetApproved: data.vet_approved
        };
    }

    async updateNutritionPlan(petId: string, plan: any): Promise<void> {
        const { error } = await supabase
            .from('nutrition_plans')
            .upsert({
                pet_id: petId,
                daily_calories: plan.dailyCalories,
                food_type: plan.foodType,
                feeding_times: plan.feedingTimes || [],
                notes: plan.notes,
                vet_approved: plan.vetApproved || false,
                updated_at: new Date().toISOString()
            }, { onConflict: 'pet_id' });

        if (error) throw error;
    }

    // --- YÜRÜYÜŞ TAKİBİ ---
    // NOT: walk_sessions tablosunun gerçek kolonları — id, user_id, pet_id, start_time, end_time,
    // path_coordinates (jsonb), distance_meters, status. Kod önceden var olmayan kolon adları
    // (route, ended_at, started_at, duration_seconds, calories_burned, steps) kullanıyordu,
    // bu yüzden her yürüyüş kaydı sessizce (try/catch içinde yutularak) başarısız oluyordu —
    // hiçbir yürüyüş gerçekten veritabanına kaydedilmiyordu. Süre/kalori/adım gibi türetilmiş
    // değerler artık ayrı kolonlarda TUTULMUYOR, gerçek verilerden (mesafe, başlangıç/bitiş
    // zamanı) okuma anında hesaplanıyor — şema değişikliği gerekmiyor.
    async startWalk(userId: string, petId: string): Promise<any> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        // End any active walks first
        await supabase
            .from('walk_sessions')
            .update({ status: 'completed', end_time: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('status', 'active');

        const { data, error } = await supabase
            .from('walk_sessions')
            .insert({
                user_id: user.id,
                pet_id: petId || null,
                status: 'active',
                path_coordinates: []
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateWalkLocation(sessionId: string, lat: number, lng: number): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) return;

        // Fetch current route and append
        const { data: session } = await supabase
            .from('walk_sessions')
            .select('path_coordinates, distance_meters')
            .eq('id', sessionId)
            .single();

        const route: any[] = session?.path_coordinates || [];
        const lastPoint = route[route.length - 1];

        let additionalDistance = 0;
        if (lastPoint) {
            const dLat = (lat - lastPoint.lat) * (Math.PI / 180);
            const dLng = (lng - lastPoint.lng) * (Math.PI / 180);
            const a = Math.sin(dLat/2)**2 + Math.cos(lastPoint.lat * Math.PI/180) * Math.cos(lat * Math.PI/180) * Math.sin(dLng/2)**2;
            additionalDistance = Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
        }

        route.push({ lat, lng, timestamp: new Date().toISOString() });

        await supabase
            .from('walk_sessions')
            .update({
                path_coordinates: route,
                distance_meters: (session?.distance_meters || 0) + additionalDistance
            })
            .eq('id', sessionId);
    }

    // Piyasa araştırması #6: yürüyüş sırasında/sonrasında gerçek fotoğraf ekleme
    // (Walkies/MyDoggy gibi köpek-yürüyüşü uygulamalarının ana özelliği).
    // `walk-photos` bucket'ına kullanıcının KENDİ klasörüne (RLS policy'si bunu
    // zorunlu kılıyor) yükleyip, dönen public URL'i walk_sessions.photo_urls
    // dizisine ekliyor — anında commit ediliyor (yürüyüş bitmeden uygulama
    // kapansa bile fotoğraf kaybolmaz, updateWalkLocation ile aynı dayanıklılık
    // deseni).
    async uploadWalkPhoto(sessionId: string, file: File): Promise<string> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${sessionId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from('walk-photos')
            .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('walk-photos').getPublicUrl(path);
        const url = publicUrlData.publicUrl;

        const { data: session } = await supabase
            .from('walk_sessions')
            .select('photo_urls')
            .eq('id', sessionId)
            .single();
        const existing: string[] = session?.photo_urls || [];

        const { error: updateError } = await supabase
            .from('walk_sessions')
            .update({ photo_urls: [...existing, url] })
            .eq('id', sessionId);
        if (updateError) throw updateError;

        return url;
    }

    // Piyasa araştırması #4: Strava Beacon tarzı canlı konum paylaşımı. `walk_beacons`
    // BİLEREK `walk_sessions`'tan ayrı, minimal bir tablo (bkz. migration notu) —
    // genele SADECE tek nokta anlık konum açılıyor, GPS geçmişi/rotası değil.
    async startBeacon(sessionId: string, petName: string, lat: number, lng: number): Promise<string> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        const { data, error } = await supabase
            .from('walk_beacons')
            .insert({ session_id: sessionId, user_id: user.id, pet_name: petName, lat, lng })
            .select('id')
            .single();
        if (error) throw error;
        return data.id;
    }

    async updateBeaconLocation(beaconId: string, lat: number, lng: number): Promise<void> {
        await supabase.from('walk_beacons').update({ lat, lng, updated_at: new Date().toISOString() }).eq('id', beaconId);
    }

    async stopBeacon(beaconId: string): Promise<void> {
        await supabase.from('walk_beacons').delete().eq('id', beaconId);
    }

    // Herkese açık — anon anahtarla, oturum gerektirmeden çağrılır (bkz. /beacon/[id]).
    async getBeacon(beaconId: string): Promise<{ lat: number; lng: number; petName: string | null; updatedAt: string; expiresAt: string } | null> {
        const { data, error } = await supabase
            .from('walk_beacons')
            .select('lat, lng, pet_name, updated_at, expires_at')
            .eq('id', beaconId)
            .single();
        if (error || !data) return null;
        return { lat: data.lat, lng: data.lng, petName: data.pet_name, updatedAt: data.updated_at, expiresAt: data.expires_at };
    }

    async endWalk(sessionId: string, data: any): Promise<any> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        const endedAt = new Date().toISOString();

        const { data: session } = await supabase
            .from('walk_sessions')
            .select('start_time, distance_meters')
            .eq('id', sessionId)
            .single();

        const startedAt = session?.start_time ? new Date(session.start_time) : new Date();
        const durationSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
        const distanceMeters = session?.distance_meters || 0;
        const caloriesBurned = Math.round(distanceMeters * 0.06); // ~60 cal/km
        // Baran'ın telefonda bulduğu kritik hata: adım sayısı SADECE GPS mesafesinden
        // türetiliyordu, hiçbir zaman DB'ye kalıcı olarak yazılmıyordu. Artık
        // ActivityContext'teki gerçek ivmeölçer tabanlı sayaç (`realSteps`) buraya
        // geliyor ve `walk_sessions.steps` kolonuna gerçekten kaydediliyor — geçmiş
        // yürüyüşler artık gerçek adım verisi gösterebiliyor. Gerçek sayaç 0/eksikse
        // (ör. çok eski bir çağrı ya da sensör izni reddedildiyse) dürüst bir mesafe
        // tahminine düşülüyor, sahte bir sıfır değil.
        const steps = typeof data?.steps === 'number' && data.steps > 0 ? data.steps : Math.round(distanceMeters * 1.3);

        const { data: updated, error } = await supabase
            .from('walk_sessions')
            .update({
                status: 'completed',
                end_time: endedAt,
                steps,
            })
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;
        // duration/kalori DB'de saklanmıyor — burada hesaplanıp döndürülüyor (ör. bitiş özeti için)
        return { ...updated, ended_at: updated.end_time, started_at: updated.start_time, duration_seconds: durationSeconds, calories_burned: caloriesBurned, steps };
    }

    async getWalkHistory(userId: string, limit: number = 10): Promise<any[]> {
        const user = await this.getSessionUser();
        if (!user) return [];

        // Faz 10 kontrolü: `pet:pets(...)` embed'i kaldırıldı — walk_sessions.pet_id
        // text tipinde, pets tablosuna FK constraint'i hiç yok. Bu embed olduğu sürece
        // PostgREST TÜM sorguyu PGRST200 ile reddediyordu, yani bu fonksiyon her zaman
        // boş dizi döndürüyordu — yürüyüş geçmişi hiçbir zaman gerçek veri göstermemişti.
        const { data, error } = await supabase
            .from('walk_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .order('end_time', { ascending: false })
            .limit(limit);

        if (error) {
            console.error("getWalkHistory error:", error);
            return [];
        }
        return (data || []).map((w: any) => {
            const distanceMeters = w.distance_meters || 0;
            const durationSeconds = (w.start_time && w.end_time)
                ? Math.max(0, Math.floor((new Date(w.end_time).getTime() - new Date(w.start_time).getTime()) / 1000))
                : 0;
            return {
                ...w,
                ended_at: w.end_time,
                started_at: w.start_time,
                duration_minutes: Math.round(durationSeconds / 60),
                calories_burned: Math.round(distanceMeters * 0.06),
                steps: Math.round(distanceMeters * 1.3),
            };
        });
    }

    async getWalkStats(userId: string): Promise<any> {
        const user = await this.getSessionUser();
        if (!user) return {};

        const { data, error } = await supabase
            .from('walk_sessions')
            .select('distance_meters, start_time, end_time')
            .eq('user_id', user.id)
            .eq('status', 'completed');

        if (error || !data) return {};

        // Faz 8: seri kalkanıyla "affedilmiş" günler de yürüyüş yapılmış gibi sayılır
        const { data: shieldRows } = await supabase
            .from('streak_shield_uses')
            .select('covered_date')
            .eq('user_id', user.id);
        const shieldedDates = new Set((shieldRows || []).map(r => r.covered_date));

        const totalDistance = data.reduce((s, w) => s + (w.distance_meters || 0), 0);
        const totalDuration = data.reduce((s, w) => {
            if (!w.start_time || !w.end_time) return s;
            return s + Math.max(0, Math.floor((new Date(w.end_time).getTime() - new Date(w.start_time).getTime()) / 1000));
        }, 0);
        const totalCalories = Math.round(totalDistance * 0.06);
        const totalSteps = Math.round(totalDistance * 1.3);

        // Faz 8 düzeltmesi: tarih karşılaştırması artık kullanıcının YEREL takvim
        // gününe göre yapılıyor (öncesinde end_time'ın UTC ISO string'i doğrudan
        // startsWith ile karşılaştırılıyordu — gece yarısına yakın yürüyüşlerde
        // UTC/yerel gün kayması yüzünden seri hatalı kırılabiliyordu).
        const toLocalDateStr = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };
        const walkedDates = new Set(
            data.filter(w => w.end_time).map(w => toLocalDateStr(new Date(w.end_time)))
        );
        for (const sd of shieldedDates) walkedDates.add(sd);

        // Faz 8 düzeltmesi: en iyi seri artık ilk boşlukta durup bırakmıyor,
        // son 365 günün tamamını tarayıp gerçek en uzun aralığı buluyor.
        let currentStreak = 0;
        let bestStreak = 0;
        let runningStreak = 0;
        let streakBroken = false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let d = 0; d < 365; d++) {
            const checkDate = new Date(today.getTime() - d * 86400000);
            const hasWalk = walkedDates.has(toLocalDateStr(checkDate));

            if (hasWalk) {
                runningStreak++;
                bestStreak = Math.max(bestStreak, runningStreak);
                if (!streakBroken) currentStreak = runningStreak;
            } else {
                runningStreak = 0;
                if (d === 0) {
                    // Bugün henüz yürünmemiş olabilir, bu seriyi kırmaz — sadece bugünü sayma
                    continue;
                }
                streakBroken = true;
            }
        }

        // Faz 9: /walk sayfası bunu okuyordu ama hiç hesaplanmıyordu (her zaman
        // 0.0 km gösteriyordu, ?? 0 fallback'i sessizce yanlış değeri gizliyordu)
        const longestWalkKm = data.length ? Math.max(...data.map(w => w.distance_meters || 0)) / 1000 : 0;

        return {
            totalWalks: data.length,
            totalDistanceKm: Math.round(totalDistance / 100) / 10,
            totalDurationMinutes: Math.round(totalDuration / 60),
            totalCalories,
            totalSteps,
            avgDistanceKm: data.length ? Math.round(totalDistance / data.length / 100) / 10 : 0,
            longestWalkKm: Math.round(longestWalkKm * 10) / 10,
            currentStreak,
            bestStreak
        };
    }

    // Faz 8: gerçek seri kalkanı durumu (haftalık otomatik yenileme dahil, salt-okunur)
    async getStreakShieldStatus(): Promise<{ available: boolean }> {
        const user = await this.getSessionUser();
        if (!user) return { available: false };
        const { data, error } = await supabase
            .from('profiles')
            .select('streak_shield_available, streak_shield_week_start')
            .eq('id', user.id)
            .single();
        if (error || !data) return { available: false };

        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        const y = monday.getFullYear(), m = String(monday.getMonth() + 1).padStart(2, '0'), d = String(monday.getDate()).padStart(2, '0');
        const currentWeekStart = `${y}-${m}-${d}`;

        if (data.streak_shield_week_start !== currentWeekStart) return { available: true };
        return { available: !!data.streak_shield_available };
    }

    // Faz 8: seri kalkanını gerçekten kullan — sunucu tarafında doğrulanıyor
    // (o gün gerçekten yürüyüş yoksa VE kalkan gerçekten müsaitse kaydediliyor)
    async useStreakShield(coveredDate: string): Promise<boolean> {
        const { data, error } = await supabase.rpc('use_streak_shield', { p_covered_date: coveredDate });
        if (error) throw error;
        return !!data;
    }

    async getWalkById(id: string): Promise<any> {
        // Faz 10 kontrolü: `pet:pets(...)` embed'i kaldırıldı — walk_sessions.pet_id
        // text tipinde ve pets tablosuna gerçek bir FK constraint'i hiç yok (aynı kök
        // neden getVetAdvices()'teki PGRST200 hatasıyla — bkz. CLAUDE.md Bölüm 9).
        // Bu sorgu embed olmadan tek başına çalışır; pet bilgisi çağıran taraf
        // (usePet() context'i) üzerinden zaten elde ediliyor.
        const user = await this.getSessionUser();
        if (!user) return {};
        const { data, error } = await supabase
            .from('walk_sessions')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error || !data) return {};
        return { ...data, ended_at: data.end_time, started_at: data.start_time };
    }

    async getVetAdvices(): Promise<any[]> {
        // vet_advices.clinic_id'nin profiles'a yabancı anahtarı yok; eskiden bağlı sorgu (embed) her
        // yüklemede PGRST200 veriyordu. Klinik adı herkese açık işletme kartından ayrı okunur.
        const { data, error } = await supabase
            .from('vet_advices')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching vet advices:", error);
            return [];
        }
        const ids = Array.from(new Set((data || []).map((a: any) => a.clinic_id).filter((v: string) => /^[0-9a-f-]{36}$/i.test(v || ''))));
        const cards: Record<string, any> = {};
        if (ids.length > 0) {
            const { data: rows } = await supabase.from('profile_cards').select('id, full_name, business_name, avatar_url').in('id', ids);
            (rows || []).forEach((r: any) => { cards[r.id] = r; });
        }
        return (data || []).map((a: any) => ({
            ...a,
            profiles: cards[a.clinic_id] ? { full_name: cards[a.clinic_id].full_name, business_name: cards[a.clinic_id].business_name, avatar_url: cards[a.clinic_id].avatar_url } : null,
        }));
    }

    // --- FINANCE / TRANSACTIONS ---

    async getClinicTransactions(clinicId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('date', { ascending: false });

        if (error) {
            console.error("Error fetching transactions:", error);
            return [];
        }
        return data || [];
    }

    async createTransaction(transaction: {
        clinic_id: string;
        type: string;
        amount: number;
        status: string;
        description?: string;
        reference_id?: string;
    }): Promise<void> {
        const { error } = await supabase.from('transactions').insert([transaction]);
        if (error) throw error;
    }




















    async getFollowers(userId: string): Promise<UserProfile[]> {
        const { data: followsData, error: followsError } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', userId);

        if (followsError || !followsData || followsData.length === 0) return [];

        const followerIds = followsData.map(f => f.follower_id);

        const { data: profilesData, error: profilesError } = await supabase
            .from('profile_cards')
            .select('*')
            .in('id', followerIds);

        if (profilesError || !profilesData) return [];

        return profilesData.map(data => ({
            id: data.id,
            name: data.full_name || 'Moffi Kullanıcısı',
            username: data.username || data.full_name || 'moffi_user',
            avatar: data.avatar_url || undefined,
            cover_photo: data.aura_settings?.cover_photo || undefined,
            petName: data.pet_name,
            role: data.role || 'user',
            bio: data.bio
        })) as any[];
    }

    async getFollowing(userId: string): Promise<UserProfile[]> {
        const { data: followsData, error: followsError } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId);

        if (followsError || !followsData || followsData.length === 0) return [];

        const followingIds = followsData.map(f => f.following_id);

        const { data: profilesData, error: profilesError } = await supabase
            .from('profile_cards')
            .select('*')
            .in('id', followingIds);

        if (profilesError || !profilesData) return [];

        return profilesData.map(data => ({
            id: data.id,
            name: data.full_name || 'Moffi Kullanıcısı',
            username: data.username || data.full_name || 'moffi_user',
            avatar: data.avatar_url || undefined,
            cover_photo: data.aura_settings?.cover_photo || undefined,
            petName: data.pet_name,
            role: data.role || 'user',
            bio: data.bio
        })) as any[];
    }
    // --- CHAT & MESSAGING (Real-time Supabase) ---
    // --- Mesajlaşma -------------------------------------------------------------------------------------------------
    // Aynı iki kişi arasında geçmişte birden fazla sohbet kaydı açılmış olabilir (ör. kayıp ilanından gelen sohbet ile
    // normal sohbet). Okurken hepsi tek konuşma olarak birleştirilir, yazarken en güncel kayda yazılır.

    /** Karşı tarafla aradaki sohbet kayıtları, en güncel önce. */
    async chatConversationIds(otherUserId: string, scope: 'inbox' | 'clinic' = 'inbox'): Promise<string[]> {
        const user = await this.getSessionUser();
        if (!user) return [];
        let q = supabase
            .from('conversations')
            .select('id, last_message_at')
            .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
            .order('last_message_at', { ascending: false, nullsFirst: false });
        q = scope === 'clinic' ? q.eq('context_type', 'clinic') : q.neq('context_type', 'clinic');
        const { data } = await q;
        return (data || []).map((c: any) => c.id);
    }

    /** Sohbet başlığı için karşı tarafın görünen adı ve fotoğrafı (daha önce hiç yazışılmamış olsa da). */
    async getChatPartner(userId: string): Promise<{ userId: string; partnerName: string; avatar: string | null; isBusiness: boolean } | null> {
        const { data } = await supabase.from('profile_cards').select('id, username, full_name, business_name, role, avatar_url').eq('id', userId).maybeSingle();
        if (!data) return null;
        return { userId, partnerName: chatDisplayName(data), avatar: data.avatar_url || null, isBusiness: data.role === 'business' };
    }

    async getChatConversations(scope: 'inbox' | 'clinic' = 'inbox'): Promise<any[]> {
        const user = await this.getSessionUser();
        if (!user) return [];

        let query = supabase
            .from('conversations')
            .select('id, last_message, last_message_at, participant_1, participant_2')
            .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
            .order('last_message_at', { ascending: false, nullsFirst: false });
        query = scope === 'clinic' ? query.eq('context_type', 'clinic') : query.neq('context_type', 'clinic');
        const { data, error } = await query;
        if (error || !data) { if (error) console.error('getChatConversations error:', error); return []; }

        // Kişi başına tek satır (en güncel sohbet kaydı), aynı kişinin diğer kayıtları birleştirilir.
        const byPartner = new Map<string, { ids: string[]; conv: any }>();
        for (const conv of data) {
            const other = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
            if (!other) continue;
            const entry = byPartner.get(other);
            if (entry) entry.ids.push(conv.id); else byPartner.set(other, { ids: [conv.id], conv });
        }
        const partnerIds = Array.from(byPartner.keys());
        const allIds = Array.from(byPartner.values()).flatMap(e => e.ids);
        if (!partnerIds.length) return [];

        // Tek sorguda profiller, tek sorguda okunmamışlar ve son mesajlar (her kayıt için ayrı sorgu yok).
        const [{ data: profiles }, { data: unreadRows }, { data: lastRows }] = await Promise.all([
            supabase.from('profile_cards').select('id, username, full_name, business_name, role, avatar_url').in('id', partnerIds),
            supabase.from('messages').select('conversation_id').in('conversation_id', allIds).eq('is_read', false).neq('sender_id', user.id).limit(1000),
            supabase.from('messages').select('conversation_id, sender_id, content, attachment_url, is_deleted, created_at').in('conversation_id', allIds)
                .order('created_at', { ascending: false }).limit(Math.min(1000, allIds.length * 3)),
        ]);
        const profileById = new Map((profiles || []).map((p: any) => [p.id, p]));
        const unreadByConv = new Map<string, number>();
        (unreadRows || []).forEach((r: any) => unreadByConv.set(r.conversation_id, (unreadByConv.get(r.conversation_id) || 0) + 1));
        const lastByConv = new Map<string, any>();
        (lastRows || []).forEach((r: any) => { if (!lastByConv.has(r.conversation_id)) lastByConv.set(r.conversation_id, r); });

        const rows = partnerIds.map(other => {
            const { ids, conv } = byPartner.get(other)!;
            const p = profileById.get(other);
            const last = ids.map(i => lastByConv.get(i)).filter(Boolean).sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))[0];
            const unreadCount = ids.reduce((n, i) => n + (unreadByConv.get(i) || 0), 0);
            const preview = last
                ? (last.is_deleted ? 'Mesaj geri alındı' : last.content || (last.attachment_url ? '📷 Fotoğraf' : ''))
                : (conv.last_message || '');
            const at = last?.created_at || conv.last_message_at;
            return {
                userId: other,
                partnerName: chatDisplayName(p),
                avatar: p?.avatar_url || null,
                isBusiness: p?.role === 'business',
                latestMessage: preview,
                latestAt: at,
                latestTime: this.formatTimeAgo(at),
                sentByMe: last ? last.sender_id === user.id : false,
                unread: unreadCount > 0,
                unreadCount,
                online: false,
                messages: [],
                conversationId: conv.id,
                conversationIds: ids,
            };
        });
        return rows.sort((a, b) => (b.latestAt || '').localeCompare(a.latestAt || ''));
    }

    /** Sohbetin son mesajları (en eski önce). `before` verilirse o andan önceki sayfa. */
    async getChatMessages(otherUserId: string, scope: 'inbox' | 'clinic' = 'inbox', before?: string | null, limit = 50): Promise<any[]> {
        const user = await this.getSessionUser();
        if (!user) return [];
        const ids = await this.chatConversationIds(otherUserId, scope);
        if (!ids.length) return [];
        let q = supabase.from('messages').select('*').in('conversation_id', ids).order('created_at', { ascending: false }).limit(limit);
        if (before) q = q.lt('created_at', before);
        const { data, error } = await q;
        if (error || !data) { if (error) console.error('getChatMessages error:', error); return []; }
        return data.reverse().map((msg: any) => mapChatMessage(msg, user.id, this.formatTimeAgo(msg.created_at)));
    }

    async sendChatMessage(otherUserId: string, content: string, scope: 'inbox' | 'clinic' = 'inbox', associatedAdId?: string, attachmentUrl?: string): Promise<{ id: string; createdAt: string } | void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");
        if (otherUserId === user.id) throw new Error('Kendine mesaj gönderemezsin.');

        let conversationId: string | undefined = (await this.chatConversationIds(otherUserId, scope))[0];

        if (conversationId) {
            if (associatedAdId) {
                await supabase.from('conversations').update({ associated_ad_id: associatedAdId }).eq('id', conversationId).is('associated_ad_id', null);
            }
        } else {
            const newContextType = scope === 'clinic' ? 'clinic' : associatedAdId ? 'lost_pet' : 'general';
            const { data: newConv, error: convErr } = await supabase
                .from('conversations')
                .insert({ participant_1: user.id, participant_2: otherUserId, associated_ad_id: associatedAdId || null, context_type: newContextType })
                .select('id')
                .single();
            if (convErr || !newConv) throw convErr || new Error('Sohbet başlatılamadı.');
            conversationId = newConv.id;
        }

        const { data: inserted, error: msgErr } = await supabase
            .from('messages')
            .insert({ conversation_id: conversationId, sender_id: user.id, receiver_id: otherUserId, content, attachment_url: attachmentUrl || null })
            .select('id, created_at')
            .single();
        if (msgErr) throw msgErr;

        // Gelen kutusu önizlemesi. (Kalıcı çözüm: bunu sunucu tetikleyicisi yazmalı — bkz. YAPILACAKLAR.)
        await supabase
            .from('conversations')
            .update({ last_message: content || (attachmentUrl ? '📷 Fotoğraf' : ''), last_message_at: inserted?.created_at || new Date().toISOString() })
            .eq('id', conversationId);

        return inserted ? { id: inserted.id, createdAt: inserted.created_at } : undefined;
    }

    async markChatAsRead(otherUserId: string, scope: 'inbox' | 'clinic' = 'inbox'): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) return;
        const ids = await this.chatConversationIds(otherUserId, scope);
        if (!ids.length) return;
        await supabase
            .from('messages')
            .update({ is_read: true })
            .in('conversation_id', ids)
            .eq('is_read', false)
            .neq('sender_id', user.id);
    }

    async deleteChatMessage(messageId: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");

        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId)
            .eq('sender_id', user.id);

        if (error) {
            console.error('Delete message error:', error);
            throw error;
        }
    }

    // Mesajı tamamen silmez, "geri alındı" olarak işaretler (WhatsApp tarzı).
    // Karşı taraf da geri alındığını görür, ama kayıt veritabanında kalır.
    async recallChatMessage(messageId: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");

        const { error } = await supabase
            .from('messages')
            .update({ is_deleted: true })
            .eq('id', messageId)
            .eq('sender_id', user.id);

        if (error) {
            console.error('Recall message error:', error);
            throw error;
        }
    }

    async uploadMedia(file: File, bucket: 'posts' | 'stories' | 'avatars' | 'sounds' = 'posts', onProgress?: (percent: number) => void): Promise<string> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;

        // Simulated Progress since standard Supabase upload is a single fetch
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 92) {
                clearInterval(progressInterval);
            } else if (onProgress) {
                onProgress(Math.floor(progress));
            }
        }, 200);

        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(path, file, { cacheControl: '3600', upsert: false });

            clearInterval(progressInterval);
            if (onProgress) onProgress(100);

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            return urlData.publicUrl;
        } catch (err) {
            clearInterval(progressInterval);
            throw err;
        }
    }

    async globalSearch(query: string): Promise<any> {
        if (!query || query.length < 2) return { profiles: [], posts: [], pets: [] };

        const [profilesRes, postsRes, petsRes] = await Promise.all([
            supabase.from('profile_cards').select('*').or(`username.ilike.%${query}%,full_name.ilike.%${query}%`).limit(10),
            supabase.from('posts').select('*').ilike('content', `%${query}%`).limit(10),
            // Sadece herkese açık kart alanları (pet_cards); eskiden var olmayan pet_id kolonu yüzünden hep boş dönüyordu.
            supabase.from('pet_cards').select('id, name, type, breed, avatar_url, owner_id').ilike('name', `%${query}%`).limit(10)
        ]);

        return {
            profiles: (profilesRes.data || []).map(p => ({
                id: p.id,
                name: p.full_name || p.username,
                username: p.username,
                avatar: p.avatar_url,
                type: 'user'
            })),
            posts: (postsRes.data || []).map(p => ({
                id: p.id,
                desc: p.content,
                media: p.media_url,
                type: 'post'
            })),
            pets: (petsRes.data || []).map(p => ({
                id: p.id,
                name: p.name,
                breed: p.breed,
                owner_id: p.owner_id,
                image: p.avatar_url,
                type: 'pet'
            }))
        };
    }

    async saveData<T>(key: string, data: T): Promise<void> {
        return this.mockApi.saveData(key, data);
    }
    async loadData<T>(key: string): Promise<T | null> {
        return this.mockApi.loadData<T>(key);
    }

    async addProduct(product: Partial<ShopProduct>): Promise<ShopProduct> {
        const { data, error } = await supabase
            .from('products')
            .insert({
                name: product.name,
                description: product.description || '',
                price: product.price,
                old_price: product.oldPrice || null,
                image_url: product.image || '🦴',
                category: product.category || 'food',
                is_prime_only: product.isPrimeOnly || false,
                stock: product.stockCount || 10,
                is_vet_approved: product.isVetApproved || false,
                tag: product.tag || null,
                owner_id: product.ownerId || null
            })
            .select()
            .single();

        if (error) throw error;
        
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            price: Number(data.price),
            oldPrice: data.old_price ? Number(data.old_price) : undefined,
            image: data.image_url,
            category: data.category as ShopCategory,
            
            inStock: data.stock > 0,
            stockCount: data.stock,
            rating: Number(data.rating) || 5.0,
            reviews: Number(data.review_count) || 0,
            isVetApproved: data.is_vet_approved || false,
            tag: data.tag || undefined,
            ownerId: data.owner_id || undefined
        };
    }

    async updateProduct(id: string, product: Partial<ShopProduct>): Promise<ShopProduct> {
        const updatePayload: any = {};
        if (product.name !== undefined) updatePayload.name = product.name;
        if (product.description !== undefined) updatePayload.description = product.description;
        if (product.price !== undefined) updatePayload.price = product.price;
        if (product.oldPrice !== undefined) updatePayload.old_price = product.oldPrice;
        if (product.image !== undefined) updatePayload.image_url = product.image;
        if (product.category !== undefined) updatePayload.category = product.category;
        if (product.isPrimeOnly !== undefined) updatePayload.is_prime_only = product.isPrimeOnly;
        if (product.stockCount !== undefined) updatePayload.stock = product.stockCount;
        if (product.isVetApproved !== undefined) updatePayload.is_vet_approved = product.isVetApproved;
        if (product.tag !== undefined) updatePayload.tag = product.tag;
        if (product.ownerId !== undefined) updatePayload.owner_id = product.ownerId;

        const { data, error } = await supabase
            .from('products')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            price: Number(data.price),
            oldPrice: data.old_price ? Number(data.old_price) : undefined,
            image: data.image_url,
            category: data.category as ShopCategory,
            
            inStock: data.stock > 0,
            stockCount: data.stock,
            rating: Number(data.rating) || 5.0,
            reviews: Number(data.review_count) || 0,
            isVetApproved: data.is_vet_approved || false,
            tag: data.tag || undefined,
            ownerId: data.owner_id || undefined
        };
    }

    async deleteProduct(id: string): Promise<void> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    async updateOrderTracking(orderId: string, trackingNumber: string, carrier: string): Promise<void> {
        const { error } = await supabase.rpc('set_order_tracking', {
            p_order_id: orderId,
            p_tracking_number: trackingNumber,
            p_carrier: carrier
        });
        if (error) throw error;
    }

    async updateOrderStatus(orderId: string, status: any): Promise<void> {
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId);
        if (error) throw error;
    }

    async getAllOrders(): Promise<ShopOrder[]> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(
                    quantity,
                    price_at_purchase,
                    product:products(*)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) return [];

        return data.map((o: any) => ({
            id: o.id,
            userId: o.user_id,
            totalPrice: Number(o.total_amount),
            status: o.status,
            createdAt: o.created_at,
            updatedAt: o.updated_at || o.created_at,
            shippingAddress: o.shipping_address,
            items: (o.items || []).map((item: any) => ({
                quantity: item.quantity,
                product: item.product ? {
                    id: item.product.id,
                    name: item.product.name,
                    price: Number(item.price_at_purchase),
                    image: item.product.image_url,
                    category: item.product.category,
                    
                    inStock: item.product.stock > 0
                } : {
                    id: '',
                    name: 'Silinmiş Ürün',
                    price: Number(item.price_at_purchase),
                    image: '❓',
                    category: 'food',
                    
                    inStock: false
                }
            }))
        }));
    }

    async getPetDailyStats(petId: string, date: string): Promise<any | null> {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(petId);
        if (!isUuid) return null;

        try {
            const { data, error } = await supabase
                .from('pet_daily_stats')
                .select('*')
                .eq('pet_id', petId)
                .eq('date', date)
                .maybeSingle();

            if (error) {
                console.error("Error fetching pet daily stats:", error);
                return null;
            }
            if (!data) return null;

            return {
                waterIntake: data.water_intake,
                waterTarget: data.water_target,
                caloriesIntake: data.calories_intake,
                caloriesTarget: data.calories_target,
                foodLog: data.food_log || []
            };
        } catch (e) {
            console.error("Failed to get daily stats:", e);
            return null;
        }
    }

    async savePetDailyStats(petId: string, date: string, stats: any): Promise<void> {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(petId);
        if (!isUuid) return;

        try {
            const payload: any = {
                pet_id: petId,
                date: date,
                updated_at: new Date().toISOString()
            };

            if (stats.waterIntake !== undefined) payload.water_intake = stats.waterIntake;
            if (stats.waterTarget !== undefined) payload.water_target = stats.waterTarget;
            if (stats.caloriesIntake !== undefined) payload.calories_intake = stats.caloriesIntake;
            if (stats.caloriesTarget !== undefined) payload.calories_target = stats.caloriesTarget;
            if (stats.foodLog !== undefined) payload.food_log = stats.foodLog;

            const { error } = await supabase
                .from('pet_daily_stats')
                .upsert(payload, { onConflict: 'pet_id,date' });

            if (error) throw error;
        } catch (e) {
            console.error("Failed to save daily stats in Supabase:", e);
            throw e;
        }
    }

    private formatTimeAgo(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return 'Şimdi';
        if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} saat`;
        return `${Math.floor(diff / 86400)} gün`;
    }

    async getAnnouncements(): Promise<SystemAnnouncement[]> {
        try {
            const { data, error } = await supabase
                .from('system_announcements')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            return (data || []).map((o: any) => ({
                id: String(o.id),
                title: o.title,
                description: o.description,
                media_url: o.media_url,
                badge: o.badge,
                cta_text: o.cta_text,
                cta_type: o.cta_type,
                cta_value: o.cta_value,
                expires_at: o.expires_at,
                created_at: o.created_at
            }));
        } catch (err) {
            console.warn("Supabase system_announcements query failed, falling back to mockApi:", err);
            return this.mockApi.getAnnouncements();
        }
    }

    async addAnnouncement(announcement: Partial<SystemAnnouncement>): Promise<SystemAnnouncement> {
        try {
            const payload = {
                title: announcement.title,
                description: announcement.description,
                media_url: announcement.media_url,
                badge: announcement.badge,
                cta_text: announcement.cta_text,
                cta_type: announcement.cta_type,
                cta_value: announcement.cta_value,
                expires_at: announcement.expires_at,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('system_announcements')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;

            return {
                id: String(data.id),
                title: data.title,
                description: data.description,
                media_url: data.media_url,
                badge: data.badge,
                cta_text: data.cta_text,
                cta_type: data.cta_type,
                cta_value: data.cta_value,
                expires_at: data.expires_at,
                created_at: data.created_at
            };
        } catch (err) {
            console.warn("Supabase system_announcements insert failed, falling back to mockApi:", err);
            return this.mockApi.addAnnouncement(announcement);
        }
    }

    async deleteAnnouncement(id: string): Promise<void> {
        try {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            if (!isUuid) {
                return this.mockApi.deleteAnnouncement(id);
            }
            const { error } = await supabase
                .from('system_announcements')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.warn("Supabase system_announcements delete failed, falling back to mockApi:", err);
            return this.mockApi.deleteAnnouncement(id);
        }
    }

    // Daily Star Pet (Yıldız Patiler) Supabase Implementations
    async getAllPetsAdmin(): Promise<Pet[]> {
        try {
            const { data, error } = await supabase
                .from('pets')
                .select('*, profiles(full_name, username)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                name: item.name,
                type: item.type || 'dog',
                breed: item.breed,
                age: item.age,
                gender: item.gender,
                image: item.avatar_url || '',
                avatar: item.avatar_url,
                cover_photo: item.cover_url,
                is_neutered: item.is_neutered,
                neutered: item.is_neutered,
                size: item.size,
                microchip_id: item.microchip_no,
                microchip: item.microchip_no,
                personality: item.character,
                is_lost: item.is_lost,
                sos_settings: item.sos_settings,
                birthday: item.birth_date || '',
                profiles: item.profiles
            }));
        } catch (err) {
            console.warn("Supabase getAllPetsAdmin failed, falling back to mockApi:", err);
            return this.mockApi.getAllPetsAdmin();
        }
    }

    async getDailyStarCandidates(): Promise<any[]> {
        try {
            // 1. Fetch all pets with their profile details
            const allPets = (await this.getPublicPetCards()).map((p: any) => ({
                ...p, image: p.avatar_url || '', avatar: p.avatar_url, personality: p.character,
            }));
            if (allPets.length === 0) return [];

            // 2. Fetch completed walk sessions (steps kolonu yok, mesafeden hesaplanıyor)
            const { data: sessions, error } = await supabase
                .from('walk_sessions')
                .select('pet_id, distance_meters')
                .eq('status', 'completed');

            // 3. Aggregate activity counts per pet_id
            const activityMap: Record<string, { steps: number; distance: number }> = {};
            if (!error && sessions) {
                sessions.forEach((s: any) => {
                    if (!s.pet_id) return;
                    if (!activityMap[s.pet_id]) {
                        activityMap[s.pet_id] = { steps: 0, distance: 0 };
                    }
                    activityMap[s.pet_id].steps += Math.round((s.distance_meters || 0) * 1.3);
                    activityMap[s.pet_id].distance += s.distance_meters || 0;
                });
            }

            // 4. Sort all registered pets by their activity (steps, then distance)
            const sortedPets = [...allPets].sort((a, b) => {
                const actA = activityMap[a.id] || { steps: 0, distance: 0 };
                const actB = activityMap[b.id] || { steps: 0, distance: 0 };
                if (actB.steps !== actA.steps) {
                    return actB.steps - actA.steps;
                }
                return actB.distance - actA.distance;
            });

            const badges = ["Günün Şampiyonu 👑", "Halkın Seçimi 🌸", "Stil İkonu ✨", "Aktif Pati ⚡", "Yükselen Yıldız 🚀"];

            // 5. Build Candidates list (maximum 5) using actual pet data
            return sortedPets.slice(0, 5).map((pet, idx) => {
                const activity = activityMap[pet.id] || { steps: 0, distance: 0 };
                // Calculate Aura points: actual steps / 10, or custom hash fallback if zero
                let auraPoints = Math.round(activity.steps / 10);
                if (auraPoints === 0) {
                    const seed = pet.id.replace(/-/g, '').slice(0, 6);
                    const numericSeed = parseInt(seed, 16) || 12345;
                    auraPoints = (numericSeed % 1500) + 1000;
                }

                return {
                    id: pet.id,
                    name: pet.name,
                    breed: pet.breed || 'Karışık',
                    image: pet.image || pet.avatar || '/images/moffi_pet_trio.png',
                    auraPoints: auraPoints,
                    badge: badges[idx] || "Aktif Pati ⚡",
                    ownerName: (pet as any).profiles?.username || (pet as any).profiles?.full_name || 'Moffi Üyesi',
                    activitySummary: activity.steps > 0 
                        ? `Toplam ${activity.steps} adım atarak ${auraPoints} Aura kazandı!` 
                        : `Toplam ${auraPoints} Aura kazanarak topluluğa katkı sağladı.`
                };
            });
        } catch (err) {
            console.warn("Supabase getDailyStarCandidates failed, falling back to mockApi:", err);
            return this.mockApi.getDailyStarCandidates();
        }
    }

    async getDailyStars(dateString: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('daily_stars')
                .select('*')
                .eq('date', dateString);

            if (error) throw error;

            // Hayvan bilgisi herkese açık kartlardan (pets tablosu sadece sahibine açık).
            const starPetIds = Array.from(new Set((data || []).map((d: any) => d.pet_id).filter(Boolean)));
            const cards = starPetIds.length > 0 ? await this.getPublicPetCards({ ids: starPetIds }) : [];
            const cardOf = (id: string) => cards.find((c: any) => c.id === id);

            const results: any[] = [];
            // Günün yıldızlarını sadece yönetici seçip kaydedebilir (daily_stars yazma kuralı). Diğer
            // kullanıcılar sadece kayıtlı seçimi görür; seçim yoksa tarayıcıda uydurma şampiyon üretilmez.
            const { data: myRole } = await supabase.rpc('get_my_role');
            const candidates = myRole === 'admin' ? await this.getDailyStarCandidates() : [];

            for (let r = 1; r <= 5; r++) {
                const found = (data || []).find((item: any) => item.rank === r);
                if (found) {
                    results.push({
                        id: found.id,
                        pet_id: found.pet_id,
                        date: found.date,
                        rank: found.rank,
                        title: found.title,
                        description: found.description,
                        badge: found.badge,
                        media_url: found.media_url,
                        status: found.status,
                        created_at: found.created_at,
                        pet: cardOf(found.pet_id) ? {
                            name: cardOf(found.pet_id).name,
                            image: cardOf(found.pet_id).avatar_url,
                            breed: cardOf(found.pet_id).breed
                        } : null
                    });
                } else {
                    // Fallback: automatic candidate calculation for this rank position
                    const candidate = candidates[r - 1] || candidates[0];
                    if (candidate) {
                        const payload = {
                            pet_id: candidate.id,
                            date: dateString,
                            rank: r,
                            title: `Günün Şampiyonu: ${candidate.name} 🐕`,
                            description: `${candidate.name} bugün ${candidate.auraPoints} Aura toplayarak günün en aktif patilerinden biri oldu!`,
                            badge: candidate.badge,
                            media_url: candidate.image,
                            status: 'auto',
                            created_at: new Date().toISOString()
                        };

                        const { data: insertedData, error: insertError } = await supabase
                            .from('daily_stars')
                            .insert(payload)
                            .select('*')
                            .single();

                        if (!insertError && insertedData) {
                            results.push({
                                id: insertedData.id,
                                pet_id: insertedData.pet_id,
                                date: insertedData.date,
                                rank: insertedData.rank,
                                title: insertedData.title,
                                description: insertedData.description,
                                badge: insertedData.badge,
                                media_url: insertedData.media_url,
                                status: insertedData.status,
                                created_at: insertedData.created_at,
                                pet: { name: candidate.name, image: candidate.image, breed: candidate.breed }
                            });
                        }
                    }
                }
            }

            return results.sort((a, b) => a.rank - b.rank);
        } catch (err) {
            console.warn("Supabase getDailyStars failed, falling back to mockApi:", err);
            return this.mockApi.getDailyStars(dateString);
        }
    }

    async setDailyStar(dateString: string, rank: number, petId: string, details: any): Promise<void> {
        try {
            const payload = {
                pet_id: petId,
                date: dateString,
                rank: rank,
                title: details.title,
                description: details.description,
                badge: details.badge,
                media_url: details.media_url,
                status: 'published',
                created_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('daily_stars')
                .upsert(payload, { onConflict: 'date,rank' });

            if (error) throw error;
        } catch (err) {
            console.warn("Supabase setDailyStar failed, falling back to mockApi:", err);
            return this.mockApi.setDailyStar(dateString, rank, petId, details);
        }
    }

    async removeDailyStar(dateString: string, rank: number): Promise<void> {
        try {
            const { error } = await supabase
                .from('daily_stars')
                .delete()
                .eq('date', dateString)
                .eq('rank', rank);

            if (error) throw error;
        } catch (err) {
            console.warn("Supabase removeDailyStar failed, falling back to mockApi:", err);
            return this.mockApi.removeDailyStar(dateString, rank);
        }
    }

    // Vet Advices (Vet Tavsiyeleri) Supabase Implementations

    async saveClinicAdvice(clinicId: string, content: string, badge: string): Promise<void> {
        try {
            // Overwrite: Delete previous advices for this clinic first
            await supabase
                .from('vet_advices')
                .delete()
                .eq('clinic_id', clinicId);

            // Insert new advice
            const { error } = await supabase
                .from('vet_advices')
                .insert({
                    clinic_id: clinicId,
                    content: content,
                    badge: badge,
                    media_url: '/images/moffi_pet_trio.png'
                });

            if (error) throw error;
        } catch (err) {
            console.warn("Supabase saveClinicAdvice failed, falling back to mockApi:", err);
            return this.mockApi.saveClinicAdvice(clinicId, content, badge);
        }
    }

    async addAdminAdvice(content: string, badge: string, mediaUrl?: string): Promise<any> {
        try {
            const { data, error } = await supabase
                .from('vet_advices')
                .insert({
                    clinic_id: null,
                    content: content,
                    badge: badge,
                    media_url: mediaUrl || '/images/moffi_pet_trio.png'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.warn("Supabase addAdminAdvice failed, falling back to mockApi:", err);
            return this.mockApi.addAdminAdvice(content, badge, mediaUrl);
        }
    }

    async deleteAdvice(id: string): Promise<void> {
        try {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            if (!isUuid) {
                return this.mockApi.deleteAdvice(id);
            }

            const { error } = await supabase
                .from('vet_advices')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.warn("Supabase deleteAdvice failed, falling back to mockApi:", err);
            return this.mockApi.deleteAdvice(id);
        }
    }

    // --- LEADERBOARD & GAME INTEGRATION ---
    /** Herkese açık hayvan kartları (pet_cards) + sahiplerinin adı; pets tablosu sadece sahibine açık. */
    private async getPublicPetCards(opts: { orderByXp?: boolean; limit?: number; ids?: string[] } = {}): Promise<any[]> {
        let q = supabase.from('pet_cards').select('id, owner_id, name, type, breed, gender, age, size, character, avatar_url, cover_url, is_lost, xp, level, created_at');
        if (opts.ids) q = q.in('id', opts.ids);
        q = opts.orderByXp ? q.order('xp', { ascending: false, nullsFirst: false }) : q.order('created_at', { ascending: false });
        if (opts.limit) q = q.limit(opts.limit);
        const { data, error } = await q;
        if (error) throw error;
        const ownerIds = Array.from(new Set((data || []).map((p: any) => p.owner_id).filter(Boolean)));
        const owners: Record<string, any> = {};
        if (ownerIds.length > 0) {
            const { data: profs } = await supabase.from('profile_cards').select('id, full_name, username').in('id', ownerIds);
            (profs || []).forEach((o: any) => { owners[o.id] = o; });
        }
        return (data || []).map((p: any) => ({ ...p, profiles: owners[p.owner_id] || null }));
    }

    async getPublicPetsByOwner(ownerId: string): Promise<{ id: string; name: string; type: string | null; breed: string | null; gender: string | null; image: string }[]> {
        const { data, error } = await supabase.from('pet_cards').select('id, name, type, breed, gender, avatar_url')
            .eq('owner_id', ownerId).order('created_at', { ascending: true });
        if (error) { console.error('getPublicPetsByOwner:', error); return []; }
        return (data || []).map((p: any) => ({ id: p.id, name: p.name, type: p.type, breed: p.breed, gender: p.gender, image: p.avatar_url || '' }));
    }

    async getPetLeaderboard(limit: number = 50): Promise<any[]> {
        try {
            const data = await this.getPublicPetCards({ orderByXp: true, limit });
            return data.map((p: any) => ({
                id: p.id,
                name: p.name || 'Gizli Pet',
                ownerName: p.profiles?.full_name || p.profiles?.username || 'Gizli Kullanıcı',
                avatar: p.avatar_url,
                score: p.xp || 0,
                level: p.level || 1,
                country: 'TR',
            }));
        } catch (err) {
            console.error("Supabase getPetLeaderboard failed:", err);
            return [];
        }
    }

    async addPetScore(petId: string, xpEarned: number, coinsEarned: number): Promise<boolean> {
        try {
            // Call the secure RPC function
            const { data, error } = await supabase.rpc('add_game_reward', {
                p_pet_id: petId,
                p_xp_earned: xpEarned,
                p_coins_earned: coinsEarned
            });

            if (error) throw error;
            return true;
        } catch (err) {
            console.error("Supabase addPetScore failed:", err);
            return false;
        }
    }

    async getGameModules(): Promise<any[]> {
        const fallbackModules = [
            { id: '1', game_key: 'food-catch', title: 'Mama Yakala', description: 'Zehirli mantarlardan kaç, mamaları kap!', icon_name: 'Utensils', color_gradient: 'from-orange-500 to-red-600', difficulty: 1, is_active: true },
            { id: '2', game_key: 'memory', title: 'Pet Memory', description: 'Kartları eşleştir, hafızanı test et.', icon_name: 'Brain', color_gradient: 'from-blue-500 to-indigo-600', difficulty: 2, is_active: true },
            { id: '3', game_key: 'jump', title: 'Moffi Jump', description: 'Sonsuzlukta en yükseğe zıpla!', icon_name: 'Zap', color_gradient: 'from-fuchsia-500 to-pink-600', difficulty: 3, is_active: true },
            { id: '4', game_key: 'moffi-run', title: 'Moffi Run', description: 'Engelleri aş, paraları topla.', icon_name: 'Gamepad2', color_gradient: 'from-amber-400 to-orange-500', difficulty: 2, is_active: true }
        ];
        
        try {
            const { data, error } = await supabase
                .from('game_modules')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: true });
                
            if (error) throw error;
            return (data && data.length > 0) ? data : fallbackModules;
        } catch (err) {
            console.error("Supabase getGameModules failed:", err);
            return fallbackModules;
        }
    }

    // --- LEADERBOARD ---
    // Faz 13: 'business' sekmesi hâlâ basit (lig'siz) PawCoin sıralaması kullanıyor -
    // işletmelerin yürüyüş modülüyle bağlantılı bir aktivite metriği yok. 'user' rolü
    // için artık bu fonksiyon KULLANILMIYOR - referans UI'ye göre gerçek "Sıralamalar"
    // ekranı mesafe (km) bazlı, bkz. getDistanceLeaderboard() ve CLAUDE.md 8.8.
    async getLeaderboard(role: 'user' | 'business', limit: number = 50): Promise<any[]> {
        try {
            // Bakiyeler profiles'ta gizli; sıralama sunucu fonksiyonundan (sadece ad, fotoğraf, puan).
            const { data, error } = await supabase.rpc('get_coin_leaderboard', { p_role: role, p_limit: limit });
            if (error) throw error;

            return (data || []).map((p: any) => ({
                id: p.id,
                name: p.full_name || 'Gizli Kullanıcı',
                avatar: p.avatar_url,
                score: Number(p.coin_balance) || 0,
                country: 'TR',
                pet: p.pet_name || (role === 'business' ? 'İşletme' : 'Moffi'),
                change: 0
            }));
        } catch (err) {
            console.error("Supabase getLeaderboard failed:", err);
            return [];
        }
    }

    async getUserRank(_userId: string): Promise<number> {
        // Sadece giriş yapan kişinin kendi sırası (başkasının bakiyesi okunamaz).
        try {
            const { data, error } = await supabase.rpc('get_my_coin_rank');
            if (error) throw error;
            return Number(data) || 0;
        } catch (err) {
            console.error("Supabase getUserRank failed:", err);
            return 0;
        }
    }

    // Faz 13 (referans UI'ye göre düzeltme, bkz. CLAUDE.md 8.8): gerçek mesafe (km)
    // bazlı sıralama, zaman aralığı filtreli. walk_sessions RLS'i sadece kendi
    // satırlarını okumaya izin veriyor (Faz 10'da bilinçli sıkılaştırıldı), bu yüzden
    // kullanıcılar-arası toplam mesafe SECURITY DEFINER bir RPC (get_distance_leaderboard)
    // üzerinden alınıyor - sadece toplam mesafe/yürüyüş sayısı döner, hiçbir GPS
    // rotası dışarı sızmıyor. userIds verilirse (Arkadaşlarım/Aynı Şehir filtreleri
    // için) sadece o kullanıcılar arasında sıralanır, null ise herkes dahil edilir.
    async getDistanceLeaderboard(period: 'week' | 'month' | 'all', userIds: string[] | null = null, limit: number = 100): Promise<{ userId: string; totalMeters: number; walkCount: number }[]> {
        try {
            const { data, error } = await supabase.rpc('get_distance_leaderboard', {
                p_period: period,
                p_user_ids: userIds,
                p_limit: limit,
            });
            if (error) throw error;
            return (data || []).map((row: any) => ({
                userId: row.user_id,
                totalMeters: Number(row.total_meters) || 0,
                walkCount: row.walk_count || 0,
            }));
        } catch (err) {
            console.error("Supabase getDistanceLeaderboard failed:", err);
            return [];
        }
    }

    async getProfilesByIds(ids: string[]): Promise<{ id: string; name: string; avatar?: string; pet: string }[]> {
        if (ids.length === 0) return [];
        try {
            const { data, error } = await supabase
                .from('profile_cards')
                .select('id, full_name, avatar_url, pet_name')
                .in('id', ids);
            if (error) throw error;
            return (data || []).map(p => ({
                id: p.id,
                name: p.full_name || 'Gizli Kullanıcı',
                avatar: p.avatar_url,
                pet: p.pet_name || 'Moffi',
            }));
        } catch (err) {
            console.error("Supabase getProfilesByIds failed:", err);
            return [];
        }
    }

    // Faz 14: Ödül Marketi kataloğu (gerçek reward_products tablosu).
    async getRewardProducts(): Promise<{ id: string; name: string; description: string | null; category: 'product' | 'experience' | 'coupon'; pricePp: number; icon: string }[]> {
        try {
            const { data, error } = await supabase
                .from('reward_products')
                .select('id, name, description, category, price_pp, icon')
                .eq('is_active', true)
                .order('price_pp', { ascending: true });
            if (error) throw error;
            return (data || []).map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                category: p.category,
                pricePp: p.price_pp,
                icon: p.icon,
            }));
        } catch (err) {
            console.error("Supabase getRewardProducts failed:", err);
            return [];
        }
    }

    // Ödül satın alma - mevcut award_pati_puan() RPC'si negatif miktarla çağrılıyor,
    // yeni bir para birimi/RPC icat edilmedi. Sunucu tarafında bakiye kontrolü zaten
    // award_pati_puan içinde var (yetersiz bakiye varsa exception fırlatır).
    async redeemReward(productId: string, name: string, pricePp: number): Promise<number> {
        return this.awardPatiPuan(-pricePp, `Ödül: ${name}`, 'redemption', productId);
    }

    // Faz 22: Ödül Marketi fiziksel eşya yerine gerçek dijital gardırop —
    // src/integrations-pending/kombinle prototipinin PP-ekonomisine bağlanmış hali.
    async getCosmeticItems(): Promise<{ id: string; slot: 'body' | 'head' | 'eyes' | 'hands' | 'feet'; itemKey: string; name: string; icon: string; pricePp: number; rarity: 'common' | 'rare' | 'epic' | 'legendary'; isStarter: boolean }[]> {
        try {
            const { data, error } = await supabase
                .from('cosmetic_items')
                .select('id, slot, item_key, name, icon, price_pp, rarity, is_starter')
                .eq('is_active', true)
                .order('price_pp', { ascending: true });
            if (error) throw error;
            return (data || []).map(i => ({
                id: i.id,
                slot: i.slot,
                itemKey: i.item_key,
                name: i.name,
                icon: i.icon,
                pricePp: i.price_pp,
                rarity: i.rarity,
                isStarter: i.is_starter,
            }));
        } catch (err) {
            console.error("Supabase getCosmeticItems failed:", err);
            return [];
        }
    }

    async getOwnedCosmeticItemIds(userId: string): Promise<string[]> {
        try {
            const { data, error } = await supabase
                .from('user_cosmetic_items')
                .select('item_id')
                .eq('user_id', userId);
            if (error) throw error;
            return (data || []).map(r => r.item_id);
        } catch (err) {
            console.error("Supabase getOwnedCosmeticItemIds failed:", err);
            return [];
        }
    }

    // Satın alma atomik: redeem_cosmetic_item RPC'si PP'yi düşürüp aynı transaction'da
    // sahiplik satırını ekliyor (bkz. migration add_cosmetic_wardrobe_system).
    async redeemCosmeticItem(itemId: string, _name: string, _pricePp: number): Promise<number> {
        const { data, error } = await supabase.rpc('redeem_cosmetic_item', { p_item_id: itemId });
        if (error) throw error;
        return data as number;
    }

    async getPetLook(petId: string): Promise<{ equippedApparel: Record<string, string | null>; avatarBodyColor: string; avatarBackground: string | null }> {
        try {
            const { data, error } = await supabase
                .from('pets')
                .select('equipped_apparel, avatar_body_color, avatar_background')
                .eq('id', petId)
                .single();
            if (error) throw error;
            return {
                equippedApparel: (data?.equipped_apparel as Record<string, string | null>) || {},
                avatarBodyColor: data?.avatar_body_color || '#8b5cf6',
                avatarBackground: data?.avatar_background || null,
            };
        } catch (err) {
            console.error("Supabase getPetLook failed:", err);
            return { equippedApparel: {}, avatarBodyColor: '#8b5cf6', avatarBackground: null };
        }
    }

    async updatePetLook(petId: string, look: { equippedApparel: Record<string, string | null>; avatarBodyColor: string; avatarBackground: string | null }): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('pets')
                .update({
                    equipped_apparel: look.equippedApparel,
                    avatar_body_color: look.avatarBodyColor,
                    avatar_background: look.avatarBackground,
                })
                .eq('id', petId);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error("Supabase updatePetLook failed:", err);
            return false;
        }
    }

    // Faz 23: VIP Merkezi — gerçek Prime özelliklerinin (şu an sadece profil
    // çerçeveleri) PP karşılığında geçici tadımı.
    async getVipPerks(): Promise<{ id: string; perkKey: string; name: string; description: string; icon: string; pricePp: number; durationHours: number; rarity: 'common' | 'rare' | 'epic' | 'legendary' }[]> {
        try {
            const { data, error } = await supabase
                .from('vip_perks')
                .select('id, perk_key, name, description, icon, price_pp, duration_hours, rarity')
                .eq('is_active', true)
                .order('price_pp', { ascending: true });
            if (error) throw error;
            return (data || []).map(p => ({
                id: p.id, perkKey: p.perk_key, name: p.name, description: p.description,
                icon: p.icon, pricePp: p.price_pp, durationHours: p.duration_hours, rarity: p.rarity,
            }));
        } catch (err) {
            console.error("Supabase getVipPerks failed:", err);
            return [];
        }
    }

    // Sadece gerçekten hâlâ aktif (expires_at > now) satırları döndürür —
    // süresi dolmuş bir perk'i "aktif" gibi göstermemek için filtre burada.
    async getActivePerks(userId: string): Promise<Record<string, string>> {
        try {
            const { data, error } = await supabase
                .from('user_active_perks')
                .select('perk_key, expires_at')
                .eq('user_id', userId)
                .gt('expires_at', new Date().toISOString());
            if (error) throw error;
            const map: Record<string, string> = {};
            (data || []).forEach(r => { map[r.perk_key] = r.expires_at; });
            return map;
        } catch (err) {
            console.error("Supabase getActivePerks failed:", err);
            return {};
        }
    }

    async redeemVipPerk(perkId: string, _name: string, _pricePp: number): Promise<string> {
        const { data, error } = await supabase.rpc('redeem_vip_perk', { p_perk_id: perkId });
        if (error) throw error;
        return data as string;
    }

    // Faz 24: Sosyal Meydan Okumalar — sadece GERÇEK karşılıklı takip (iki
    // yönlü follows satırı) listeleniyor, "insan seçici" rastgele/tek yönlü
    // takip edilen birini önermiyor.
    async getMutualFollows(userId: string): Promise<{ id: string; name: string; avatar?: string }[]> {
        try {
            const { data: following, error: e1 } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
            if (e1) throw e1;
            const followingIds = (following || []).map(f => f.following_id);
            if (followingIds.length === 0) return [];

            const { data: mutualRows, error: e2 } = await supabase
                .from('follows')
                .select('follower_id')
                .eq('following_id', userId)
                .in('follower_id', followingIds);
            if (e2) throw e2;
            const mutualIds = (mutualRows || []).map(r => r.follower_id);
            if (mutualIds.length === 0) return [];

            const { data: profiles, error: e3 } = await supabase.from('profile_cards').select('id, full_name, username, avatar_url').in('id', mutualIds);
            if (e3) throw e3;
            return (profiles || []).map(p => ({ id: p.id, name: p.full_name || p.username || 'Moffi Kullanıcısı', avatar: p.avatar_url || undefined }));
        } catch (err) {
            console.error("Supabase getMutualFollows failed:", err);
            return [];
        }
    }

    async createSocialChallenge(partnerId: string, mode: 'duel' | 'team', durationDays: number, targetKm?: number): Promise<string> {
        const { data, error } = await supabase.rpc('create_social_challenge', {
            p_partner_id: partnerId, p_mode: mode, p_duration_days: durationDays, p_target_km: targetKm ?? null,
        });
        if (error) throw error;
        return data as string;
    }

    async respondSocialChallenge(challengeId: string, accept: boolean): Promise<void> {
        const { error } = await supabase.rpc('respond_social_challenge', { p_challenge_id: challengeId, p_accept: accept });
        if (error) throw error;
    }

    async getSocialChallenges(userId: string): Promise<SocialChallenge[]> {
        try {
            const { data, error } = await supabase
                .from('social_challenges')
                .select('*')
                .or(`creator_id.eq.${userId},partner_id.eq.${userId}`)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []).map(c => ({
                id: c.id, mode: c.mode, creatorId: c.creator_id, partnerId: c.partner_id, status: c.status,
                targetKm: c.target_km, durationDays: c.duration_days, startsAt: c.starts_at, endsAt: c.ends_at,
                winnerId: c.winner_id, rewardPp: c.reward_pp, createdAt: c.created_at,
            }));
        } catch (err) {
            console.error("Supabase getSocialChallenges failed:", err);
            return [];
        }
    }

    async getSocialChallengeProgress(challengeId: string): Promise<{ creatorKm: number; partnerKm: number }> {
        const { data, error } = await supabase.rpc('get_social_challenge_progress', { p_challenge_id: challengeId });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        return { creatorKm: row?.creator_km ?? 0, partnerKm: row?.partner_km ?? 0 };
    }

    async finalizeSocialChallengeIfDue(challengeId: string): Promise<void> {
        const { error } = await supabase.rpc('finalize_social_challenge', { p_challenge_id: challengeId });
        if (error) throw error;
    }

    // "Aynı Şehir" filtresi: profiles.address alanı (serbest metin) tam eşleşen
    // diğer kullanıcılar. Gerçek bir yapılandırılmış "şehir" kolonu yok - şu an
    // hiçbir gerçek kullanıcı address girmediği için bu genelde boş dönecek,
    // sahte veri üretmek yerine dürüstçe boş liste dönüyor.
    async getSameCityUserIds(_userId: string): Promise<string[]> {
        // Adresler gizli; eşleştirme sunucuda yapılır, sadece kullanıcı kimlikleri döner.
        try {
            const { data, error } = await supabase.rpc('get_same_city_user_ids');
            if (error) throw error;
            return (data || []).map((r: any) => (typeof r === 'string' ? r : r.get_same_city_user_ids ?? r.id)).filter(Boolean);
        } catch (err) {
            console.error("Supabase getSameCityUserIds failed:", err);
            return [];
        }
    }

    async getFeedbacks(): Promise<SystemFeedback[]> {
        try {
            const { data, error } = await supabase
                .from('system_feedbacks')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                // Fallback if table doesn't exist yet
                console.warn("Supabase getFeedbacks failed, returning mock:", error.message);
                return [
                    { id: 'f1', user_id: 'u1', username: 'Ali Veli', content: 'Uygulama çok yavaş açılıyor.', severity: 'medium', status: 'new', created_at: new Date().toISOString() },
                    { id: 'f2', user_id: 'u2', username: 'Ayşe Yılmaz', content: 'Harika bir sistem, teşekkürler.', severity: 'low', status: 'reviewed', created_at: new Date().toISOString() },
                    { id: 'f3', user_id: 'u3', username: 'Moffi Kliniği', content: 'KYB onayım hala bekliyor, yardım edin.', severity: 'high', status: 'new', created_at: new Date().toISOString() }
                ];
            }
            return data as SystemFeedback[];
        } catch (err) {
            console.error("Supabase getFeedbacks exception:", err);
            return [];
        }
    }

    // --- UNCLAIMED PATIENTS MIGRATION ---
    async insertUnclaimedPatient(data: {
        rawName: string; rawPhone: string; petName?: string;
        petSpecies?: string; petBreed?: string; legacyNotes?: string;
    }): Promise<string> {
        const { data: id, error } = await supabase.rpc('insert_unclaimed_patient', {
            p_raw_name: data.rawName,
            p_raw_phone: data.rawPhone,
            p_pet_name: data.petName || null,
            p_pet_species: data.petSpecies || null,
            p_pet_breed: data.petBreed || null,
            p_legacy_notes: data.legacyNotes || null,
        });
        if (error) throw error;
        return id;
    }

    async getMyUnclaimedPatients(): Promise<any[]> {
        const { data, error } = await supabase.rpc('get_my_unclaimed_patients');
        if (error) { console.error(error); return []; }
        return data || [];
    }

    async getMySmsStatus(): Promise<{provider: string, sender_id: string, is_active: boolean} | null> {
        const { data, error } = await supabase.rpc('get_my_sms_status');
        if (error || !data || data.length === 0) return null;
        return data[0];
    }

    async setClinicSmsSettings(provider: string, apiUsername: string, apiKey: string, senderId: string): Promise<boolean> {
        const { error } = await supabase.rpc('set_clinic_sms_settings', {
            p_provider: provider,
            p_api_username: apiUsername,
            p_api_key: apiKey,
            p_sender_id: senderId
        });
        if (error) { console.error(error); throw error; }
        return true;
    }

    async sendClaimSms(unclaimedPatientId: string): Promise<{mode: string, sent: boolean}> {
        const { data, error } = await supabase.functions.invoke('send-claim-sms', {
            body: { unclaimedPatientId }
        });
        if (error) { console.error(error); throw error; }
        return data;
    }

    async checkUnclaimedMatches(phone: string): Promise<any[]> {
        const { data, error } = await supabase.rpc('check_unclaimed_matches', {
            p_phone: phone
        });
        if (error) { console.error(error); throw error; }
        return data || [];
    }

    async verifyAndClaim(unclaimedId: string, code: string): Promise<string> {
        const { data, error } = await supabase.rpc('verify_and_claim', {
            p_unclaimed_id: unclaimedId,
            p_claim_code: code
        });
        if (error) { console.error(error); throw error; }
        return data;
    }

    async requestManualClaim(unclaimedId: string): Promise<boolean> {
        const { error } = await supabase.rpc('request_manual_claim', {
            p_unclaimed_id: unclaimedId
        });
        if (error) { console.error(error); throw error; }
        return true;
    }

    async approveManualClaim(unclaimedId: string): Promise<string> {
        const { data, error } = await supabase.rpc('approve_manual_claim', {
            p_unclaimed_id: unclaimedId
        });
        if (error) { console.error(error); throw error; }
        return data;
    }


    // --- CLINIC SPECIFIC BUSINESS METHODS ---

    async getClinicProducts(clinicId: string): Promise<ShopProduct[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('owner_id', clinicId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching clinic products:", error);
            return [];
        }
        return data || [];
    }

    async getClinicOrders(clinicId: string): Promise<ShopOrder[]> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items!inner(
                    id, quantity, price_at_purchase, status,
                    product:products!inner(*)
                ),
                user:profiles!orders_user_id_fkey(full_name, phone, email)
            `)
            .eq('items.product.owner_id', clinicId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching clinic orders:", error);
            return [];
        }

        return (data || []).map((o: any) => ({
            id: o.id,
            total_amount: o.total_amount,
            status: o.status,
            date: o.created_at,
            shipping_address: o.shipping_address,
            user_id: o.user_id,
            user: o.user,
            items: o.items.map((i: any) => ({
                quantity: i.quantity,
                price: i.price_at_purchase,
                product: i.product,
                status: i.status
            }))
        }));
    }
    // --- CLINIC MESSAGES (FAZ 8) ---






    // --- CAMPAIGNS (FAZ 8) ---
    async getClinicCampaigns(clinicId: string): Promise<ClinicCampaign[]> {

        // Aktif kampanyalar: ends_at geçmemiş ya da null
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('clinic_campaigns')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching campaigns:", error);
            return [];
        }
        return data as ClinicCampaign[];
    }

    async createCampaign(clinicId: string, title: string, description: string, startsAt: string, endsAt: string | null): Promise<boolean> {

        const { error } = await supabase
            .from('clinic_campaigns')
            .insert({
                clinic_id: clinicId,
                title,
                description,
                starts_at: startsAt,
                ends_at: endsAt
            });

        if (error) {
            console.error("Error creating campaign:", error);
            return false;
        }
        return true;
    }

    async addClinicCampaign(data: any): Promise<boolean> {
        const payload: any = {
            clinic_id: data.clinic_id,
            title: data.title,
            media_url: data.media_url,
            discount_value: data.discount_value,
            coupon_code: data.coupon_code,
            target_pet_type: data.target_pet_type || 'all',
            expires_at: data.expires_at,
            status: data.status || 'active'
        };
        
        if (data.description !== undefined) {
            payload.description = data.description;
        }
        if (data.max_uses !== undefined && data.max_uses !== null) {
            payload.max_uses = data.max_uses;
        }
        
        // Also map expires_at to ends_at for compatibility with any older queries
        if (data.expires_at) {
            payload.ends_at = data.expires_at;
        }

        const { data: insertedData, error } = await supabase
            .from('clinic_campaigns')
            .insert(payload)
            .select();

        if (error) {
            console.error("Error in addClinicCampaign:", error.message, error.details, error.hint);
            return false;
        }
        
        console.log("Successfully inserted campaign:", insertedData);
        return true;
    }

    async deleteCampaign(campaignId: string, clinicId: string): Promise<boolean> {

        const { error } = await supabase
            .from('clinic_campaigns')
            .delete()
            .eq('id', campaignId)
            .eq('clinic_id', clinicId);

        if (error) {
            console.error("Error deleting campaign:", error);
            return false;
        }
        return true;
    }

    // --- QUESTS ---
    async getClinicQuests(clinicId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('quests')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false });
        if (error) { console.error("Error fetching quests:", error); return []; }
        return data || [];
    }

    async addClinicQuest(quest: any): Promise<void> {
        const { error } = await supabase.from('quests').insert(quest);
        if (error) { console.error("Error adding quest:", error); throw error; }
    }

    async deleteClinicQuest(id: string): Promise<void> {
        const { error } = await supabase.from('quests').delete().eq('id', id);
        if (error) { console.error("Error deleting quest:", error); throw error; }
    }

    // --- APPOINTMENT NOTIFICATIONS (FAZ 9) ---
    async getUnreadNotifications(recipientId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('id, entity_id, title, content, created_at')
            .eq('user_id', recipientId)
            .eq('type', 'appointment')
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching unread notifications:", error);
            return [];
        }
        return (data || []).map(n => ({
            id: n.id,
            appointment_id: n.entity_id,
            message: n.content ? `${n.title}: ${n.content}` : n.title,
            created_at: n.created_at
        }));
    }

    async markNotificationRead(notificationId: string): Promise<boolean> {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            console.error("Error marking notification as read:", error);
            return false;
        }
        return true;
    }
}
