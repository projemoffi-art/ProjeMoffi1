import { 
    Pet, Post, UserProfile, LostPet, AdoptionPet,
    ShopCategory, ShopProduct, ShopCartItem, ShopOrder, IApiService
} from './types';
import { supabase } from '@/lib/supabase';
import { MockApiService } from './mockApiService';

export class SupabaseApiService implements IApiService {
    // Cache the entire session to avoid repeated network calls (5 min TTL)
    private cachedUser: any = null;
    private lastUserFetch: number = 0;
    private userFetchPromise: Promise<any> | null = null;
    private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    // Call this when user logs out to clear stale cache
    invalidateCache() {
        this.cachedUser = null;
        this.lastUserFetch = 0;
        this.userFetchPromise = null;
    }

    private async getSessionUser() {
        const now = Date.now();
        // Return cached user if still fresh (5 min TTL)
        if (this.cachedUser && (now - this.lastUserFetch < SupabaseApiService.CACHE_TTL)) {
            return this.cachedUser;
        }

        // Return existing promise to avoid simultaneous lock requests
        if (this.userFetchPromise) return this.userFetchPromise;

        this.userFetchPromise = (async () => {
            try {
                // Use getSession() - much faster and less prone to locks than getUser()
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    // Lock errors or network issues - don't cache, just return null
                    console.error("Supabase auth error:", error);
                    return null;
                }

                const user = session?.user || null;
                this.cachedUser = user;
                this.lastUserFetch = Date.now();
                return user;
            } catch (err) {
                console.error("Critical Auth Error:", err);
                return null;
            } finally {
                // Keep promise for a short duration to debounce rapid-fire calls
                setTimeout(() => { this.userFetchPromise = null; }, 500);
            }
        })();

        return this.userFetchPromise;
    }


    // --- AUTH & PROFILE ---
    async getCurrentUser(): Promise<UserProfile | null> {
        const user = await this.getSessionUser();
        if (!user) return null;
        return this.getUserProfile(user.id);
    }

    async getUserProfile(id: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.warn('Profile not found:', error);
            return null;
        }

        return {
            id: data.id,
            name: data.full_name || 'Moffi Kullanıcısı',
            username: data.username || data.full_name || 'moffi_user',
            avatar: data.avatar_url || 'https://i.pravatar.cc/150?u=' + data.id,
            cover_photo: data.cover_url || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1200",
            petName: data.pet_name,
            bio: data.bio,
            stats: {
                walks: 0,
                pets: 1,
                friends: 0
            }
        } as any;
    }

    async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Unauthorized');

        const { data, error } = await supabase
            .from('profiles')
            .update({
                full_name: updates.name,
                avatar_url: updates.avatar,
                pet_name: updates.petName,
                bio: updates.bio,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...updates,
            id: data.id,
            name: data.full_name,
            avatar: data.avatar_url,
            petName: data.pet_name,
            bio: data.bio
        } as UserProfile;
    }

    // --- COMMUNITY & FEED ---
    async getFeedContent(): Promise<any[]> {
        const { data, error } = await supabase
            .from('feed_view')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching feed:', error);
            return []; // Never fall back to mock data in production
        }

        return data.map(item => ({
            id: item.id,
            user_id: item.user_id,
            author: item.user_name || 'Moffi Kullanıcısı',
            avatar: item.user_avatar || 'https://i.pravatar.cc/150?u=' + item.user_id,
            image: item.media_url,
            desc: item.content,
            likes: item.likes_count || 0,
            comments: item.comments_count || 0,
            time: this.formatTimeAgo(item.created_at),
            isLiked: false,
            isSaved: false,
            mood: null
        }));
    }

    async addPost(post: any): Promise<any> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş yapmalısın kral!");

        // Build minimal insert payload - only include guaranteed columns
        const payload: any = {
            user_id: user.id,
            content: post.caption || post.desc || '',
            media_url: post.media || post.image || null,
        };

        // Optionally include these if they might exist in schema
        if (post.type) payload.post_type = post.type;
        if (post.mood) payload.mood = post.mood;
        if (post.is_video !== undefined) payload.is_video = post.is_video;

        const { data, error } = await supabase
            .from('feed_posts')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('addPost error:', error);
            throw new Error(error.message);
        }

        return {
            id: data.id,
            user_id: data.user_id,
            author: user.email?.split('@')[0] || 'Moffi Kullanıcısı',
            avatar: '',
            image: data.media_url,
            desc: data.content,
            likes: 0,
            comments: 0,
            time: 'Şimdi',
            isLiked: false,
            isSaved: false
        };
    }


    async reactToPost(postId: string | number, reaction: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) return;

        const { data: existing } = await supabase
            .from('likes')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();

        if (existing) {
            await supabase.from('likes').delete().eq('id', existing.id);
        } else {
            await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
        }
    }

    async addComment(postId: string | number, text: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) return;

        await supabase.from('comments').insert({
            post_id: postId,
            user_id: user.id,
            content: text
        });
    }

    async getPostComments(postId: string | number): Promise<any[]> {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles:user_id (full_name, avatar_url)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) return [];

        return data.map(c => ({
            id: c.id,
            user: (c.profiles as any)?.full_name || 'Moffi Kullanıcısı',
            avatar: (c.profiles as any)?.avatar_url || '',
            text: c.content,
            time: this.formatTimeAgo(c.created_at)
        }));
    }

    // --- MAP & RADAR (Community) ---
    async getLostPets(): Promise<LostPet[]> {
        const { data, error } = await supabase
            .from('lost_pets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching lost pets:', error);
            return this.mockApi.getLostPets();
        }

        return data.map(item => ({
            id: item.id,
            pet_id: undefined, // Not enforced right now
            name: item.pet_name,
            img: item.img_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400",
            image_url: item.img_url,
            location: item.location_text || 'Moffi Radar',
            last_seen_location: item.location_text,
            reward_enabled: item.reward_enabled,
            dist: '0 km', // Distance calc requires user location, doing dummy for now
            time: this.formatTimeAgo(item.created_at),
            description: item.description || '',
            type: item.pet_type || 'dog'
        }));
    }

    async addLostPet(data: Partial<LostPet>): Promise<LostPet> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");

        const { data: inserted, error } = await supabase
            .from('lost_pets')
            .insert({
                user_id: user.id,
                pet_name: data.name,
                img_url: data.img,
                location_text: data.location,
                description: data.description,
                pet_type: data.type
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: inserted.id,
            name: inserted.pet_name,
            img: inserted.img_url,
            location: inserted.location_text,
            description: inserted.description,
            type: inserted.pet_type,
            dist: '0 km',
            time: 'Şimdi'
        } as LostPet;
    }

    async getAdoptions(): Promise<AdoptionPet[]> {
        const { data, error } = await supabase
            .from('adoption_pets')
            .select('*')
            .eq('status', 'available')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching adoptions:', error);
            return this.mockApi.getAdoptions();
        }

        return data.map(item => ({
            id: item.id,
            name: item.pet_name,
            img: item.img_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400",
            image_url: item.img_url,
            location: item.location_text || 'Moffi Radar',
            dist: '0 km',
            time: this.formatTimeAgo(item.created_at),
            description: item.description || '',
            type: item.pet_type || 'cat',
            owner: item.owner_name || 'Moffi Üyesi',
            phone: item.phone || ''
        }));
    }

    async addAdoption(data: Partial<AdoptionPet>): Promise<AdoptionPet> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");

        const { data: inserted, error } = await supabase
            .from('adoption_pets')
            .insert({
                user_id: user.id,
                pet_name: data.name,
                img_url: data.img,
                description: data.description,
                pet_type: data.type || 'cat',
                pet_breed: data.description?.split(',')[0], // Extract breed if possible
                owner_name: data.owner
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: inserted.id,
            name: inserted.pet_name,
            img: inserted.img_url,
            description: inserted.description,
            type: inserted.pet_type,
            dist: '0 km',
            time: 'Şimdi',
            owner: inserted.owner_name,
            phone: ''
        } as AdoptionPet;
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
            image: item.avatar_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400",
            avatar: item.avatar_url,
            cover_photo: item.cover_url,
            is_neutered: item.is_neutered,
            size: item.size,
            microchip_id: item.microchip_no,
            health_notes: item.health_notes,
            personality: item.character,
            is_lost: item.is_lost,
            sos_settings: item.sos_settings
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

        const { data, error } = await supabase
            .from('pets')
            .insert({
                owner_id: user.id,
                name: pet.name,
                type: pet.type,
                breed: pet.breed,
                age: pet.age,
                gender: pet.gender,
                avatar_url: pet.image || pet.avatar,
                is_neutered: pet.is_neutered || false,
                size: pet.size,
                health_notes: pet.health_notes,
                character: pet.personality,
                microchip_no: pet.microchip_id
            })
            .select()
            .single();

        if (error) throw error;
        
        // Auto-set as active if it's the first pet
        const pets = await this.getPets();
        if (pets.length === 1) {
            await this.setActivePet(data.id);
        }

        return {
            id: data.id,
            name: data.name,
            type: data.type,
            breed: data.breed,
            age: data.age,
            gender: data.gender,
            image: data.avatar_url
        } as Pet;
    }

    async updatePet(id: string, updates: Partial<Pet>): Promise<Pet> {
        const dbUpdates: any = {
            name: updates.name,
            type: updates.type,
            breed: updates.breed,
            age: updates.age,
            gender: updates.gender,
            avatar_url: updates.image || updates.avatar,
            cover_url: updates.cover_photo,
            is_neutered: updates.is_neutered,
            size: updates.size,
            microchip_no: updates.microchip_id,
            health_notes: updates.health_notes,
            character: updates.personality,
            is_lost: updates.is_lost,
            sos_settings: updates.sos_settings
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

    // --- TEMPORARY MOCK FALLBACKS (Until next phases) ---
    private mockApi = new MockApiService();

    getInboxMessages = () => this.mockApi.getInboxMessages();
    addInboxMessage = (m: any) => this.mockApi.addInboxMessage(m);
    async deletePost(postId: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        await supabase.from('feed_posts').delete().eq('id', postId).eq('user_id', user.id);
    }

    async updatePost(postId: string, updates: any): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        await supabase.from('feed_posts').update(updates).eq('id', postId).eq('user_id', user.id);
    }
    // --- MARKETPLACE & COMMERCE ---
    async getProducts(category?: ShopCategory): Promise<ShopProduct[]> {
        let query = supabase.from('products').select('*');
        if (category && category !== 'Hepsi') {
            query = query.eq('category', category.toLowerCase());
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return [];

        return data.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: Number(p.price),
            image: p.image_url,
            category: p.category as ShopCategory,
            isPrimeOnly: p.is_prime_only,
            inStock: p.stock > 0,
            stockCount: p.stock,
            rating: Number(p.rating) || 4.5,
            reviews: Number(p.review_count) || 0
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

    async createOrder(orderData: Partial<ShopOrder>): Promise<ShopOrder> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");

        const cart = await this.getCart();
        if (cart.length === 0) throw new Error("Sepet boş");

        const allProducts = await this.getProducts();
        const cartWithProducts = cart.map(item => {
            const product = allProducts.find(p => p.id === item.productId);
            return { product: product!, quantity: item.quantity };
        });

        const totalAmount = cartWithProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        // 1. Create Order
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                total_amount: totalAmount,
                shipping_address: orderData.shippingAddress || 'Dijital Teslimat',
                status: 'pending'
            })
            .select()
            .single();

        if (orderErr) throw orderErr;

        // 2. Create Order Items
        const orderItems = cartWithProducts.map(item => ({
            order_id: order.id,
            product_id: item.product.id,
            quantity: item.quantity,
            price_at_purchase: item.product.price
        }));

        const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
        if (itemsErr) throw itemsErr;

        // 3. Clear Cart
        await this.clearCart();

        return {
            id: order.id,
            userId: order.user_id,
            items: cartWithProducts,
            totalPrice: Number(order.total_amount),
            status: order.status as any,
            createdAt: order.created_at,
            updatedAt: order.updated_at || order.created_at,
            shippingAddress: order.shipping_address
        };
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
            shippingAddress: o.shipping_address,
            items: o.items.map((item: any) => ({
                quantity: item.quantity,
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    price: Number(item.price_at_purchase),
                    image: item.product.image_url,
                    category: item.product.category,
                    isPrimeOnly: item.product.is_prime_only
                }
            }))
        }));
    }

    async subscribeToProduct(productId: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");

        const { error } = await supabase
            .from('user_subscriptions')
            .upsert({
                user_id: user.id,
                plan_type: 'prime',
                status: 'active',
                end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw error;
    }

    async getSubscriptions(): Promise<ShopProduct[]> {
        const user = await this.getSessionUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('user_subscriptions')
            .select(`
                *,
                product:products(*)
            `)
            .eq('user_id', user.id);

        if (error) return [];
        
        return data.map((s: any) => ({
            id: s.id,
            name: 'Moffi Prime',
            description: 'Aktif Abonelik',
            price: 0,
            image: '',
            category: 'subscription' as ShopCategory,
            isPrimeOnly: true,
            inStock: true
        }));
    }

    async togglePetSosStatus(petId: string, status: 'safe' | 'lost'): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        const { error } = await supabase
            .from('pets')
            .update({ sos_status: status })
            .eq('id', petId)
            .eq('owner_id', user.id);
        if (error) throw error;
    }

    async updatePetSosSettings(petId: string, settings: any): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        const { error } = await supabase
            .from('pets')
            .update({ sos_settings: settings })
            .eq('id', petId)
            .eq('owner_id', user.id);
        if (error) throw error;
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
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        // Increment wallet_balance in profiles
        const field = type === 'coin' ? 'coin_balance' : 'wallet_balance';
        const { data: profile } = await supabase
            .from('profiles')
            .select(`${field}`)
            .eq('id', user.id)
            .single();
        const current = (profile as any)?.[field] || 0;
        await supabase
            .from('profiles')
            .update({ [field]: current + amount })
            .eq('id', user.id);
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

    // --- DIGITAL PASSPORT (Health & Vaccines) ---
    async getVaccineDefinitions(): Promise<any[]> {
        const { RULES_TR } = await import('./mock/VaccineMockService').then(m => {
            const TR_VACCINES = [
                { id: 'mixed', name: 'Karma Aşı (DHPPi)', is_core: true, frequency_months: 12, min_age_weeks: 8 },
                { id: 'rabies', name: 'Kuduz (Rabies)', is_core: true, frequency_months: 12, min_age_weeks: 12 },
                { id: 'kc', name: 'Bronşin (Kennel Cough)', is_core: false, frequency_months: 12, min_age_weeks: 8 },
                { id: 'internal', name: 'İç Parazit', is_core: true, frequency_months: 3, min_age_weeks: 4 },
                { id: 'external', name: 'Dış Parazit', is_core: true, frequency_months: 2, min_age_weeks: 6 },
            ];
            return { RULES_TR: TR_VACCINES };
        }).catch(() => {
            return { RULES_TR: [
                { id: 'mixed', name: 'Karma Aşı (DHPPi)', is_core: true, frequency_months: 12, min_age_weeks: 8 },
                { id: 'rabies', name: 'Kuduz (Rabies)', is_core: true, frequency_months: 12, min_age_weeks: 12 }
            ]};
        });

        return RULES_TR;
    }

    async getPetVaccines(petId: string): Promise<UserVaccineRecord[]> {
        // Validate UUID to avoid Supabase 400 error
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(petId)) {
            console.warn(`Invalid UUID for petId: ${petId}. Falling back to mock data.`);
            return this.mockApi.getPetVaccines(petId);
        }

        const { data, error } = await supabase
            .from('vaccines')
            .select('*')
            .eq('pet_id', petId)
            .order('next_due_date', { ascending: true });

        if (error) {
            console.error('Error fetching vaccines:', error);
            return [];
        }

        // Auto-generate default schedule if pet has NO vaccines yet (Magic UX)
        if (data.length === 0) {
            const defs = await this.getVaccineDefinitions();
            const defaultRecords = defs.map((d: any, i: number) => {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + (i * 15)); // Stagger due dates
                return {
                    pet_id: petId,
                    name: d.id, // Using id as name to link with definition in UI
                    status: 'pending',
                    next_due_date: dueDate.toISOString(),
                };
            });

            // Insert defaults into Supabase
            const { data: inserted, error: insErr } = await supabase.from('vaccines').insert(defaultRecords).select();

            if (!insErr && inserted) {
                return inserted.map((item: any) => ({
                    id: item.id,
                    vaccineId: item.name,
                    status: item.status,
                    dueDate: item.next_due_date,
                    dateAdministered: item.date_administered,
                    vetName: item.vet_name,
                    batchNumber: 'TR-' + Math.random().toString(36).substring(2, 8).toUpperCase()
                }));
            }
        }

        return data.map(item => ({
            id: item.id,
            vaccineId: item.name, // the db name column holds the definition ID
            status: item.status,
            dueDate: item.next_due_date,
            dateAdministered: item.date_administered,
            vetName: item.vet_name,
            batchNumber: 'TR-' + Math.random().toString(36).substring(2, 8).toUpperCase()
        }));
    }

    async markVaccineAsCompleted(recordId: string, date: string, vetName: string): Promise<void> {
        const { error } = await supabase
            .from('vaccines')
            .update({
                status: 'completed',
                date_administered: date,
                vet_name: vetName
            })
            .eq('id', recordId);

        if (error) throw error;
    }

    async checkHealthNotifications(petId: string): Promise<void> {
        // Client-side health check: computes overdue/upcoming vaccines
        try {
            const vaccines = await this.getPetVaccines(petId);
            const now = new Date();
            const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead

            const overdue = vaccines.filter((v: any) => v.status === 'pending' && new Date(v.dueDate) < now);
            const upcoming = vaccines.filter((v: any) => v.status === 'pending' && new Date(v.dueDate) >= now && new Date(v.dueDate) <= soon);

            if (overdue.length > 0) {
                console.warn(`⚠️ [Sağlık] ${overdue.length} aşı gecikmiş! Pet ID: ${petId}`);
            }
            if (upcoming.length > 0) {
                console.info(`ℹ️ [Sağlık] ${upcoming.length} aşı 7 gün içinde! Pet ID: ${petId}`);
            }
        } catch (err) {
            console.error('Health notification check failed:', err);
        }
    }

    
    // --- MEDICATIONS ---
    async getPetMedications(petId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('medications')
            .select('*')
            .eq('pet_id', petId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) return [];

        return data.map(m => ({
            id: m.id,
            petId: m.pet_id,
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            instructions: m.instructions,
            startDate: m.start_date,
            lastLog: m.last_log,
            isActive: m.is_active
        }));
    }

    async addPetMedication(med: any): Promise<any> {
        const { data, error } = await supabase
            .from('medications')
            .insert({
                pet_id: med.petId,
                name: med.name,
                dosage: med.dosage,
                frequency: med.frequency,
                instructions: med.instructions,
                start_date: med.startDate
            })
            .select()
            .single();
            
        if (error) throw error;
        return {
            id: data.id,
            petId: data.pet_id,
            name: data.name,
            dosage: data.dosage,
            frequency: data.frequency,
            instructions: data.instructions,
            startDate: data.start_date,
            lastLog: data.last_log,
            isActive: data.is_active
        };
    }

    async recordMedicationDose(medId: string): Promise<void> {
        const { error } = await supabase
            .from('medications')
            .update({ last_log: new Date().toISOString() })
            .eq('id', medId);
            
        if (error) throw error;
    }

    // --- VETERİNER & KLİNİKLER ---
    async getNearbyClinics(lat: number, lng: number, radiusKm: number = 10): Promise<any[]> {
        // Fetch from DB; PostGIS-style distance filter via JS for now (can be upgraded to RPC)
        const { data, error } = await supabase
            .from('clinics')
            .select('*')
            .order('rating', { ascending: false });

        if (error || !data) return this.mockApi.getNearbyClinics(lat, lng, radiusKm);

        // Client-side distance filter (Haversine approximation)
        return data.filter(clinic => {
            if (!clinic.lat || !clinic.lng) return true;
            const dLat = (clinic.lat - lat) * (Math.PI / 180);
            const dLng = (clinic.lng - lng) * (Math.PI / 180);
            const a = Math.sin(dLat/2)**2 + Math.cos(lat * Math.PI/180) * Math.cos(clinic.lat * Math.PI/180) * Math.sin(dLng/2)**2;
            const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return distKm <= radiusKm;
        }).map(c => ({
            id: c.id,
            name: c.name,
            imageUrl: c.image_url,
            rating: c.rating,
            reviewCount: c.review_count,
            address: c.address,
            location: { lat: c.lat, lng: c.lng },
            is_premium: c.is_premium,
            isOpenNow: c.is_open_now,
            features: c.features || [],
            phone: c.phone
        }));
    }

    async getClinicDetails(clinicId: string): Promise<any> {
        const { data, error } = await supabase
            .from('clinics')
            .select('*')
            .eq('id', clinicId)
            .single();

        if (error || !data) return this.mockApi.getClinicDetails(clinicId);

        return {
            id: data.id,
            name: data.name,
            imageUrl: data.image_url,
            rating: data.rating,
            reviewCount: data.review_count,
            address: data.address,
            location: { lat: data.lat, lng: data.lng },
            is_premium: data.is_premium,
            isOpenNow: data.is_open_now,
            features: data.features || [],
            phone: data.phone,
            doctors: [], // Future: doctors table
            reviews: []  // Future: clinic_reviews table
        };
    }

    async createAppointment(dto: any): Promise<any> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        const { data, error } = await supabase
            .from('appointments')
            .insert({
                user_id: user.id,
                pet_id: dto.petId || null,
                clinic_id: dto.clinicId || null,
                clinic_name: dto.clinicName || '',
                doctor_name: dto.doctorName || '',
                appointment_date: dto.date,
                reason: dto.reason || '',
                status: 'scheduled'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getAppointments(userId: string): Promise<any[]> {
        const user = await this.getSessionUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                clinic:clinics(name, image_url, address, phone),
                pet:pets(name, species, photo_url)
            `)
            .eq('user_id', user.id)
            .order('appointment_date', { ascending: true });

        if (error) return [];
        return data;
    }

    async cancelAppointment(appointmentId: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        const { error } = await supabase
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('id', appointmentId)
            .eq('user_id', user.id);

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
    async startWalk(userId: string, petId: string): Promise<any> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        // End any active walks first
        await supabase
            .from('walk_sessions')
            .update({ status: 'completed', ended_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('status', 'active');

        const { data, error } = await supabase
            .from('walk_sessions')
            .insert({
                user_id: user.id,
                pet_id: petId || null,
                status: 'active',
                route: []
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
            .select('route, distance_meters')
            .eq('id', sessionId)
            .single();

        const route: any[] = session?.route || [];
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
                route,
                distance_meters: (session?.distance_meters || 0) + additionalDistance
            })
            .eq('id', sessionId);
    }

    async endWalk(sessionId: string, data: any): Promise<any> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        const endedAt = new Date().toISOString();

        const { data: session } = await supabase
            .from('walk_sessions')
            .select('started_at, distance_meters')
            .eq('id', sessionId)
            .single();

        const startedAt = session?.started_at ? new Date(session.started_at) : new Date();
        const durationSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
        const distanceMeters = session?.distance_meters || 0;
        const caloriesBurned = Math.round(distanceMeters * 0.06); // ~60 cal/km
        const steps = Math.round(distanceMeters * 1.3); // ~1300 steps/km

        const { data: updated, error } = await supabase
            .from('walk_sessions')
            .update({
                status: 'completed',
                ended_at: endedAt,
                duration_seconds: durationSeconds,
                calories_burned: caloriesBurned,
                steps
            })
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;
        return updated;
    }

    async getWalkHistory(userId: string, limit: number = 10): Promise<any[]> {
        const user = await this.getSessionUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('walk_sessions')
            .select(`
                *,
                pet:pets(name, species, photo_url)
            `)
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .order('ended_at', { ascending: false })
            .limit(limit);

        if (error) return [];
        return data;
    }

    async getWalkStats(userId: string): Promise<any> {
        const user = await this.getSessionUser();
        if (!user) return {};

        const { data, error } = await supabase
            .from('walk_sessions')
            .select('distance_meters, duration_seconds, calories_burned, steps, ended_at')
            .eq('user_id', user.id)
            .eq('status', 'completed');

        if (error || !data) return {};

        const totalDistance = data.reduce((s, w) => s + (w.distance_meters || 0), 0);
        const totalDuration = data.reduce((s, w) => s + (w.duration_seconds || 0), 0);
        const totalCalories = data.reduce((s, w) => s + (w.calories_burned || 0), 0);
        const totalSteps = data.reduce((s, w) => s + (w.steps || 0), 0);

        return {
            totalWalks: data.length,
            totalDistanceKm: Math.round(totalDistance / 100) / 10,
            totalDurationMinutes: Math.round(totalDuration / 60),
            totalCalories: Math.round(totalCalories),
            totalSteps,
            avgDistanceKm: data.length ? Math.round(totalDistance / data.length / 100) / 10 : 0
        };
    }

    async getWalkById(id: string): Promise<any> {
        const { data, error } = await supabase
            .from('walk_sessions')
            .select(`*, pet:pets(name, species, photo_url)`)
            .eq('id', id)
            .single();

        if (error || !data) return {};
        return data;
    }

    // --- HİKAYELER (Stories) ---
    async getStories(): Promise<any[]> {
        const { data, error } = await supabase
            .from('stories')
            .select(`
                *,
                user:profiles(id, username, avatar_url)
            `)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(50);

        if (error || !data) return [];

        return data.map(s => ({
            id: s.id,
            userId: s.user_id,
            userName: s.user?.username || 'Kullanıcı',
            userAvatar: s.user?.avatar_url || '',
            imageUrl: s.image_url,
            caption: s.caption,
            viewCount: s.view_count,
            expiresAt: s.expires_at
        }));
    }

    async addStory(storyData: any): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        const { error } = await supabase
            .from('stories')
            .insert({
                user_id: user.id,
                image_url: storyData.mediaUrl || storyData.imageUrl || storyData.image_url,
                caption: storyData.caption || '',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h default
            });

        if (error) throw error;
    }

    getPostReactions = (id: any) => this.mockApi.getPostReactions(id);

    // --- SOSYAL AKSİYONLAR ---
    async followUser(targetId: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        const { error } = await supabase
            .from('follows')
            .upsert({ follower_id: user.id, following_id: targetId }, { onConflict: 'follower_id,following_id' });

        if (error) throw error;

        // Update follower counts in profiles (fire-and-forget, no crash if RPC missing)
        supabase.rpc('increment_followers', { target_user_id: targetId }).then(() => {}).catch(() => {});

    }

    async unfollowUser(targetId: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) return;

        await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', targetId);
    }

    async isFollowing(targetId: string): Promise<boolean> {
        const user = await this.getSessionUser();
        if (!user) return false;

        const { data } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', targetId)
            .single();

        return !!data;
    }

    async blockUser(targetId: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        await supabase
            .from('blocks')
            .upsert({ blocker_id: user.id, blocked_id: targetId }, { onConflict: 'blocker_id,blocked_id' });

        // Also unfollow
        await this.unfollowUser(targetId);
    }

    async reportUser(targetId: string, reason: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        await supabase
            .from('reports')
            .insert({ reporter_id: user.id, target_id: targetId, target_type: 'user', reason });
    }
    // --- CHAT & MESSAGING (Real-time Supabase) ---
    async getChatConversations(): Promise<any[]> {
        const user = await this.getSessionUser();
        if (!user) return [];

        // Fetch conversations where the user is either participant_1 or participant_2
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                id,
                last_message,
                last_message_at,
                participant_1,
                participant_2
            `)
            .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
            .order('last_message_at', { ascending: false });

        if (error || !data) return [];

        // For each conversation, fetch the OTHER user's profile
        const results = await Promise.all(data.map(async (conv) => {
            const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;

            const { data: profile } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .eq('id', otherUserId)
                .single();

            // Count unread messages
            const { count } = await supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .eq('is_read', false)
                .neq('sender_id', user.id);

            return {
                userId: otherUserId,
                partnerName: profile?.username || 'Moffi Kullanıcı',
                avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`,
                latestMessage: conv.last_message || '',
                latestTime: this.formatTimeAgo(conv.last_message_at),
                unread: (count || 0) > 0,
                online: false,
                messages: [],
                conversationId: conv.id
            };
        }));

        return results;
    }

    async getChatMessages(otherUserId: string): Promise<any[]> {
        const user = await this.getSessionUser();
        if (!user) return [];

        // Find the conversation
        const { data: conv } = await supabase
            .from('conversations')
            .select('id')
            .or(
                `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
            )
            .single();

        if (!conv) return [];

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true });

        if (error || !data) return [];

        return data.map(msg => ({
            id: msg.id,
            text: msg.content,
            sentByMe: msg.sender_id === user.id,
            time: this.formatTimeAgo(msg.created_at),
            read: msg.is_read
        }));
    }

    async sendChatMessage(otherUserId: string, content: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");

        // Find or create conversation
        let conversationId: string;

        const { data: existing } = await supabase
            .from('conversations')
            .select('id')
            .or(
                `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
            )
            .single();

        if (existing) {
            conversationId = existing.id;
        } else {
            // Create new conversation
            const { data: newConv, error: convErr } = await supabase
                .from('conversations')
                .insert({
                    participant_1: user.id,
                    participant_2: otherUserId
                })
                .select('id')
                .single();

            if (convErr || !newConv) throw convErr;
            conversationId = newConv.id;
        }

        // Insert message
        const { error: msgErr } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: content
            });

        if (msgErr) throw msgErr;

        // Update conversation's last message (for preview in inbox)
        await supabase
            .from('conversations')
            .update({
                last_message: content,
                last_message_at: new Date().toISOString()
            })
            .eq('id', conversationId);
    }

    async markChatAsRead(otherUserId: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) return;

        const { data: conv } = await supabase
            .from('conversations')
            .select('id')
            .or(
                `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
            )
            .single();

        if (!conv) return;

        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id);
    }

    async uploadMedia(file: File, bucket: string = 'moffi-media'): Promise<string> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');

        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, { cacheControl: '3600', upsert: false });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return urlData.publicUrl;
    }

    saveData = (k: any, d: any) => this.mockApi.saveData(k, d);
    loadData = (k: any) => this.mockApi.loadData(k);

    private formatTimeAgo(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return 'Şimdi';
        if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}sa`;
        return `${Math.floor(diff / 86400)}g`;
    }
}
