import { 
    Pet, Post, UserProfile, LostPet, AdoptionPet, LostPetSighting,
    ShopCategory, ShopProduct, ShopCartItem, ShopOrder, IApiService,
    SystemAnnouncement
} from './types';
import { 
    MOCK_PETS, MOCK_LOST_PETS, MOCK_ADOPTIONS, 
    MOCK_NOTIFICATIONS, MOCK_POSTS 
} from '../lib/mockData';

const STORAGE_PREFIX = 'moffi_local_';

export class MockApiService implements IApiService {
    
    // Auth & Profile
    private getUserStats(userId: string, baseStats?: any): { followers: number; following: number; posts: number } {
        if (typeof window === 'undefined') return { followers: 0, following: 0, posts: 0 };
        
        let followingCount = 0;
        let followersCount = 0;
        
        try {
            const followsRaw = localStorage.getItem('moffi_local_follows');
            const follows: Record<string, string[]> = followsRaw ? JSON.parse(followsRaw) : {};
            
            followingCount = follows[userId]?.length || 0;
            for (const followerId in follows) {
                if (follows[followerId]?.includes(userId)) {
                    followersCount++;
                }
            }
        } catch (e) {
            console.error("Error parsing moffi_local_follows:", e);
        }

        if (baseStats) {
            followingCount += (baseStats.following_count || baseStats.following || 0);
            followersCount += (baseStats.followers_count || baseStats.followers || baseStats.pack || 0);
        }

        return {
            followers: followersCount,
            following: followingCount,
            posts: baseStats?.posts_count || baseStats?.posts || 0
        };
    }

    async getCurrentUser(): Promise<UserProfile | null> {
        let saved: any = null;
        if (typeof window !== 'undefined') {
            const rawMock = localStorage.getItem('moffi_mock_user');
            if (rawMock) {
                try { saved = JSON.parse(rawMock); } catch {}
            }
        }
        if (!saved) {
            saved = await this.loadData<UserProfile>('current_user');
        }

        if (saved) {
            if (saved.avatar && saved.avatar.includes('unsplash.com')) {
                saved.avatar = undefined;
                if (typeof window !== 'undefined') {
                    localStorage.setItem('moffi_mock_user', JSON.stringify(saved));
                }
                await this.saveData('current_user', saved);
            }
            saved.stats = this.getUserStats(saved.id, saved.stats);
            return saved;
        }
        
        const newUser: UserProfile = {
            id: `user-mock-${Date.now()}`,
            name: 'Moffi Guest',
            username: 'moffi_guest',
            avatar: undefined,
            is_verified: false,
            subscription_status: 'free',
            wallet_balance: 0,
            moffi_coins: 0,
            stats: { followers: 0, following: 0, posts: 0 }
        } as any;
        
        if (typeof window !== 'undefined') {
            localStorage.setItem('moffi_mock_user', JSON.stringify(newUser));
        }
        await this.saveData('current_user', newUser);
        return newUser;
    }

    async getUserProfile(id: string): Promise<UserProfile | null> {
        const current = await this.getCurrentUser();
        if (current && current.id === id) {
            return current;
        }

        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('moffi_mock_users_list');
            if (stored) {
                try {
                    const list = JSON.parse(stored);
                    const matched = list.find((u: any) => u.id === id);
                    if (matched) {
                        return {
                            id: matched.id,
                            name: matched.name || matched.display_name || 'Moffi Kullanıcısı',
                            username: matched.username,
                            avatar: matched.avatar || undefined,
                            cover_photo: matched.cover_photo || undefined,
                            bio: matched.bio,
                            is_verified: matched.is_verified || false,
                            subscription_status: matched.subscription_status || 'free',
                            stats: this.getUserStats(matched.id, matched.stats)
                        } as any;
                    }
                } catch (e) {
                    console.error("Error loading mock users list:", e);
                }
            }
        }

        const { MOCK_PROFILES } = await import('../lib/mockData');
        const matched = MOCK_PROFILES.find(p => p.id === id);
        if (matched) {
            return {
                id: matched.id,
                name: matched.full_name || matched.name,
                username: matched.username,
                bio: matched.bio,
                avatar: matched.avatar_url,
                cover_photo: matched.cover_url,
                is_verified: matched.is_premium,
                subscription_status: matched.is_premium ? 'pro' : 'free',
                stats: this.getUserStats(matched.id, {
                    followers_count: matched.followers_count,
                    following_count: matched.following_count,
                    posts_count: matched.posts_count
                })
            } as any;
        }

        return null;
    }

    async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
        const current = await this.getCurrentUser();
        
        // --- USERNAME UNIQUENESS CHECK ---
        if (updates.username && updates.username !== current?.username) {
            const { MOCK_PROFILES } = await import('../lib/mockData');
            const isTaken = MOCK_PROFILES.some(p => 
                p.username.toLowerCase() === updates.username?.toLowerCase() && 
                p.id !== current?.id
            );
            
            if (isTaken) {
                throw new Error("Bu kullanıcı adı zaten alınmış! Lütfen başka bir tane dene. 🐾");
            }
        }

        const updated = { ...current!, ...updates };
        await this.saveData('current_user', updated);
        return updated;
    }

    async isUsernameAvailable(username: string): Promise<boolean> {
        if (!username) return false;
        const { MOCK_PROFILES } = await import('../lib/mockData');
        const isTaken = MOCK_PROFILES.some(p => p.username.toLowerCase() === username.toLowerCase());
        return !isTaken;
    }

    // Pets
    async getPets(): Promise<Pet[]> {
        const saved = await this.loadData<Pet[]>('pets');
        if (saved) return saved;
        
        await this.saveData('pets', MOCK_PETS as any);
        return MOCK_PETS as any;
    }

    async getActivePet(): Promise<Pet | null> {
        const activeId = await this.loadData<string>('active_pet_id');
        const pets = await this.getPets();
        return pets.find(p => p.id === activeId) || pets[0] || null;
    }

    async setActivePet(id: string): Promise<void> {
        await this.saveData('active_pet_id', id);
    }

    async addPet(pet: Partial<Pet>): Promise<Pet> {
        const pets = await this.getPets();
        const newPet = { 
            id: `pet-${Date.now()}`,
            ...pet
        } as Pet;
        await this.saveData('pets', [...pets, newPet]);
        return newPet;
    }

    async updatePet(id: string, updates: Partial<Pet>): Promise<Pet> {
        const pets = await this.getPets();
        const index = pets.findIndex(p => p.id === id);
        if (index === -1) throw new Error("Pet not found");
        
        const updated = { ...pets[index], ...updates };
        pets[index] = updated;
        await this.saveData('pets', pets);
        return updated;
    }

    async deletePet(id: string): Promise<void> {
        const pets = await this.getPets();
        const filtered = pets.filter(p => p.id !== id);
        await this.saveData('pets', filtered);
    }

    // Community
    async getFeedContent(): Promise<Post[]> {
        const saved = await this.loadData<Post[]>('feed_posts');
        
        const mandatoryIds = MOCK_POSTS.map(p => String(p.id));
        const existingPosts = saved || [];
        const userPosts = existingPosts.filter(p => !mandatoryIds.includes(String(p.id)));
        const combinedPosts = [...userPosts, ...MOCK_POSTS];
        
        const now = new Date();
        const filteredPosts = combinedPosts.filter(p => {
            if (p.status === 'scheduled') {
                if (!p.scheduled_at) return false;
                return new Date(p.scheduled_at) <= now;
            }
            return true;
        });

        let globalPostLikesCache: Record<string, any> = {};
        if (typeof window !== 'undefined') {
            try {
                globalPostLikesCache = JSON.parse(localStorage.getItem('moffi_global_post_likes') || '{}');
            } catch {}
        }
        const currentUser = await this.getCurrentUser();
        const currentUserIdOrName = currentUser?.id || currentUser?.username || 'local-user';

        const finalPosts = filteredPosts.map(p => {
            const pIdStr = String(p.id);
            const cacheInfo = globalPostLikesCache[pIdStr];
            if (cacheInfo) {
                return {
                    ...p,
                    likes: cacheInfo.likes,
                    is_liked: (cacheInfo.usersLiked || []).includes(currentUserIdOrName),
                    isLiked: (cacheInfo.usersLiked || []).includes(currentUserIdOrName)
                };
            }
            return {
                ...p,
                isLiked: p.is_liked || p.isLiked || false
            };
        });
        
        await this.saveData('feed_posts', finalPosts);
        return finalPosts as any;
    }

    async getLostPets(): Promise<LostPet[]> {
        const data = await this.loadData<any[]>('lost_pets') || MOCK_LOST_PETS;
        const current = await this.getCurrentUser();
        return data.map(item => {
            const hasReward = item.reward_enabled || false;
            return {
                id: item.id,
                pet_id: item.pet_id,
                name: item.name || item.pet_name,
                img: item.img || (item.photos && item.photos[0]) || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400",
                location: item.location || item.last_seen_location || 'Moffi Radar',
                last_seen_location: item.last_seen_location || item.location,
                reward_enabled: hasReward,
                reward: item.reward || (hasReward ? "500 TL" : undefined),
                dist: item.dist || '0 km',
                time: item.time || 'Şimdi',
                type: item.type || 'dog',
                description: item.description || 'Lütfen görünce acil dönüş yapın.',
                user_id: item.user_id || (item.id === '1' || item.id === '2' ? 'system' : current?.id),
                latitude: item.latitude,
                longitude: item.longitude,
                author_name: item.user_id === 'system' ? 'Moffi Ekibi' : (current?.username || 'Moffi Kullanıcısı'),
                author_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id || 'system'}`,
                breed: item.breed || (item.type === 'dog' ? 'Golden Retriever' : 'Tekir'),
                age: '2 Yaşında',
                gender: 'Erkek',
                size: 'medium',
                health_notes: 'Kritik bir durum yok.',
                personality: 'Uysal ve sevecen.',
                critical_health_note: 'Herhangi bir alerji veya kronik rahatsızlığı yoktur.'
            } as any;
        });
    }

    async addLostPet(data: Partial<LostPet>): Promise<LostPet> {
        const current = await this.getCurrentUser();
        const pets = await this.getLostPets();
        const newPet = { 
            id: `lost-${Date.now()}`, 
            user_id: current?.id,
            ...data 
        } as LostPet;
        await this.saveData('lost_pets', [...pets, newPet]);
        return newPet;
    }

    async deleteLostPet(id: string | number): Promise<void> {
        const pets = await this.getLostPets();
        const filtered = pets.filter(p => String(p.id) !== String(id));
        await this.saveData('lost_pets', filtered);
    }

    async addLostPetSighting(data: { lost_pet_id: string; description: string; latitude: number; longitude: number; img_url?: string }): Promise<LostPetSighting> {
        const current = await this.getCurrentUser();
        const sightings = await this.loadData<any[]>('lost_pet_sightings') || [];
        const newSighting: LostPetSighting = {
            id: `sighting-${Date.now()}`,
            lost_pet_id: data.lost_pet_id,
            reporter_id: current?.id || 'anonymous',
            reporter_name: current?.username || 'Moffi Kullanıcısı',
            reporter_avatar: current?.avatar || 'https://i.pravatar.cc/150?u=anonymous',
            description: data.description,
            latitude: data.latitude,
            longitude: data.longitude,
            img_url: data.img_url,
            created_at: new Date().toISOString()
        };
        await this.saveData('lost_pet_sightings', [...sightings, newSighting]);
        return newSighting;
    }

    async getLostPetSightings(lostPetId: string): Promise<LostPetSighting[]> {
        const sightings = await this.loadData<any[]>('lost_pet_sightings') || [];
        return sightings
            .filter(s => String(s.lost_pet_id) === String(lostPetId))
            .map(s => ({
                ...s,
                created_at: 'Şimdi'
            }));
    }

    async getAdoptions(): Promise<AdoptionPet[]> {
        const data = await this.loadData<any[]>('adoptions') || MOCK_ADOPTIONS;
        const current = await this.getCurrentUser();
        return data.map(item => ({
            id: item.id,
            name: item.name || item.pet_name,
            img: item.img || item.image_url || (item.photos && item.photos[0]) || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400",
            image_url: item.img || item.image_url || (item.photos && item.photos[0]),
            location: item.location || 'Moffi Radar',
            reward_enabled: item.reward_enabled || false,
            dist: item.dist || '0 km',
            time: item.time || 'Şimdi',
            type: item.type || 'cat',
            description: item.description || '',
            owner: item.owner || item.owner_name || 'Moffi Üyesi',
            phone: item.phone || '',
            user_id: item.user_id || (item.id === '1' || item.id === '2' ? 'system' : current?.id)
        }));
    }

    async addAdoption(data: Partial<AdoptionPet>): Promise<AdoptionPet> {
        const current = await this.getCurrentUser();
        const pets = await this.getAdoptions();
        const newPet = { 
            id: `adopt-${Date.now()}`, 
            user_id: current?.id,
            ...data 
        } as AdoptionPet;
        await this.saveData('adoptions', [...pets, newPet]);
        return newPet;
    }

    async deleteAdoption(id: string | number): Promise<void> {
        const pets = await this.getAdoptions();
        const filtered = pets.filter(p => String(p.id) !== String(id));
        await this.saveData('adoptions', filtered);
    }

    async getInboxMessages(): Promise<any[]> {
        const saved = await this.loadData<any[]>('inbox_messages');
        return saved || (MOCK_NOTIFICATIONS as any);
    }

    async addInboxMessage(message: any): Promise<void> {
        const messages = await this.getInboxMessages();
        const newMessage = {
            id: Date.now(),
            time: 'Şimdi',
            read: false,
            ...message
        };
        await this.saveData('inbox_messages', [newMessage, ...messages]);
    }
    
    async addPost(post: Partial<Post>): Promise<Post> {
        const posts = await this.getFeedContent();
        const currentUser = await this.getCurrentUser();
        
        const newPost: Post = {
            id: Date.now().toString(), // Timestamp bazlı ID (Sıralama için kritik)
            user_id: currentUser?.id || 'unknown',
            user: {
                name: currentUser?.username || 'Moffi User', 
                avatar: currentUser?.avatar || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400",
                is_premium: (currentUser as any)?.is_premium || false
            },
            likes: 0,
            comments: 0,
            time: 'Şimdi',
            ...post
        } as Post;
        
        await this.saveData('feed_posts', [newPost, ...posts]);
        return newPost;
    }

    async deletePost(postId: string | number): Promise<void> {
        const posts = await this.getFeedContent();
        const filtered = posts.filter(p => String(p.id) !== String(postId));
        await this.saveData('feed_posts', filtered);

        if (typeof window !== 'undefined') {
            try {
                const cache = JSON.parse(localStorage.getItem('moffi_global_post_likes') || '{}');
                const pIdStr = String(postId);
                const current = cache[pIdStr] || {};
                cache[pIdStr] = { ...current, isDeleted: true };
                localStorage.setItem('moffi_global_post_likes', JSON.stringify(cache));
                window.dispatchEvent(new Event('moffi_posts_changed'));
            } catch {}
        }
    }

    async updatePost(postId: string | number, updates: Partial<Post>): Promise<void> {
        const posts = await this.getFeedContent();
        const index = posts.findIndex(p => String(p.id) === String(postId));
        if (index !== -1) {
            posts[index] = { ...posts[index], ...updates };
            await this.saveData('feed_posts', posts);
        }

        if (typeof window !== 'undefined') {
            try {
                const cache = JSON.parse(localStorage.getItem('moffi_global_post_likes') || '{}');
                const pIdStr = String(postId);
                const current = cache[pIdStr] || {};
                cache[pIdStr] = {
                    ...current,
                    ...(updates.desc !== undefined && { desc: updates.desc }),
                    ...(updates.caption !== undefined && { desc: updates.caption }),
                    ...(updates.mood !== undefined && { mood: updates.mood })
                };
                localStorage.setItem('moffi_global_post_likes', JSON.stringify(cache));
                window.dispatchEvent(new Event('moffi_posts_changed'));
            } catch {}
        }
    }

    // --- SHOP ---
    async getProducts(category?: ShopCategory): Promise<ShopProduct[]> {
        // In a real mock, we could load these from a separate JSON or file
        const products: ShopProduct[] = [
            { id: 'ps-1', name: 'Pro Plan Adult Kedi Maması', brand: 'Purina', price: 649, rating: 4.8, reviews: 1243, image: '🐱', category: 'food', tag: 'Çok Satan', inStock: true },
            { id: 'ps-2', name: 'Royal Canin Indoor', brand: 'Royal Canin', price: 879, rating: 4.9, reviews: 892, image: '🏠', category: 'food', tag: 'Premium', inStock: true },
            { id: 'ps-8', name: 'Lazer Pointer Kedi Oyuncağı', brand: 'PetFun', price: 129, rating: 4.7, reviews: 892, image: '🔴', category: 'toy', tag: 'Popüler', inStock: true },
            { id: 'ps-11', name: 'Furminator Tüy Bakım Fırçası', brand: 'Furminator', price: 399, rating: 4.9, reviews: 1890, image: '✨', category: 'care', tag: 'Çok Satan', inStock: true, isVetApproved: true },
        ];
        if (!category) return products;
        return products.filter(p => p.category === category);
    }

    async getCart(): Promise<ShopCartItem[]> {
        return await this.loadData<ShopCartItem[]>('cart') || [];
    }

    async addToCart(productId: string, quantity: number): Promise<void> {
        const cart = await this.getCart();
        const existing = cart.find(i => i.productId === productId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({ productId, quantity, addedAt: new Date().toISOString() });
        }
        await this.saveData('cart', cart);
    }

    async updateCartItem(productId: string, quantity: number): Promise<void> {
        const cart = await this.getCart();
        const existing = cart.find(i => i.productId === productId);
        if (existing) {
            existing.quantity = quantity;
            await this.saveData('cart', cart);
        }
    }

    async removeFromCart(productId: string): Promise<void> {
        const cart = await this.getCart();
        const filtered = cart.filter(i => i.productId !== productId);
        await this.saveData('cart', filtered);
    }

    async clearCart(): Promise<void> {
        await this.saveData('cart', []);
    }

    async createOrder(order: Partial<ShopOrder>): Promise<ShopOrder> {
        const orders = await this.getOrders();
        const newOrder: ShopOrder = {
            id: `order-${Date.now()}`,
            userId: 'user-milo',
            items: order.items || [],
            totalPrice: order.totalPrice || 0,
            shippingAddress: order.shippingAddress || '',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...order
        };
        await this.saveData('orders', [newOrder, ...orders]);
        await this.clearCart();
        return newOrder;
    }

    async getOrders(): Promise<ShopOrder[]> {
        return await this.loadData<ShopOrder[]>('orders') || [];
    }

    async subscribeToProduct(productId: string): Promise<void> {
        const subs = await this.getSubscriptions();
        if (!subs.find(p => p.id === productId)) {
            const products = await this.getProducts();
            const product = products.find(p => p.id === productId);
            if (product) {
                await this.saveData('product_subscriptions', [...subs, product]);
            }
        }
    }

    async getSubscriptions(): Promise<ShopProduct[]> {
        return await this.loadData<ShopProduct[]>('product_subscriptions') || [];
    }

    async togglePetSosStatus(petId: string, status: 'safe' | 'lost'): Promise<void> {
        const pets = await this.getPets();
        const pet = pets.find(p => p.id === petId);
        
        if (pet) {
            pet.is_lost = status === 'lost';
            await this.saveData('pets', pets);

            // Synchronize with Community Lost Pet Alerts (The Island Bridge)
            const lostPets = await this.getLostPets();
            const shouldPost = pet.sos_settings?.auto_post_sos ?? true;

            if (status === 'lost' && shouldPost) {
                const existingIndex = lostPets.findIndex(p => p.pet_id === petId);
                const newAlert: LostPet = {
                    id: Date.now(),
                    pet_id: petId,
                    name: pet.name,
                    img: pet.image || pet.avatar || '',
                    location: 'Moffi Güvenli Bölge',
                    last_seen_location: pet.sos_settings?.last_seen_location,
                    reward_enabled: pet.sos_settings?.reward_enabled,
                    dist: '0.1 km',
                    time: 'Şimdi',
                    description: pet.sos_settings?.finder_message || 'Moffi SOS Sistemi tarafından otomatik oluşturulmuş acil durum ilanı.',
                    type: pet.type?.includes('🐶') ? 'dog' : 'cat'
                };

                if (existingIndex > -1) {
                    lostPets[existingIndex] = { ...lostPets[existingIndex], ...newAlert };
                } else {
                    lostPets.unshift(newAlert);
                }
            } else {
                // If marked safe OR auto_post is disabled, remove from community alerts
                const filteredLost = lostPets.filter(p => p.pet_id !== petId);
                await this.saveData('lost_pets', filteredLost);
                return;
            }
            await this.saveData('lost_pets', lostPets);

            // FEED POST SYNC: Create/Delete automated community announcement
            const posts = await this.getFeedContent();
            const sosPostId = `sos-post-${petId}`;

            if (status === 'lost' && shouldPost) {
                const newPost: Partial<Post> = {
                    id: sosPostId,
                    type: 'lost' as any,
                    media: pet.image || pet.avatar || '',
                    caption: `🚨 ACİL DURUM: ${pet.name} KAYIP! \n\n${pet.sos_settings?.finder_message || 'Dostumuzu arıyoruz, lütfen paylaşın.'}`,
                    likes: 0,
                    comments: 0,
                    time: 'ACİL',
                    user: { 
                        name: 'Moffi Güvenlik', 
                        avatar: 'https://cdn-icons-png.flaticon.com/512/1067/1067555.png',
                        is_verified: true 
                    }
                };
                await this.addPost(newPost);
            } else {
                await this.deletePost(sosPostId);
            }
        }
    }

    async updatePetSosSettings(petId: string, settings: any): Promise<void> {
        const pets = await this.getPets();
        const pet = pets.find(p => p.id === petId);
        if (pet) {
            pet.sos_settings = { ...pet.sos_settings, ...settings };
            await this.saveData('pets', pets);

            // Synchronize alert presence if pet is lost
            if (pet.is_lost) {
                const lostPets = await this.getLostPets();
                const shouldPost = pet.sos_settings?.auto_post_sos !== false; // Explicitly check against false
                const existingIndex = lostPets.findIndex(p => p.pet_id === petId);

                if (shouldPost) {
                    const newAlert: LostPet = {
                        id: Date.now(),
                        pet_id: petId,
                        name: pet.name,
                        img: pet.image || pet.avatar || '',
                        location: 'Moffi Güvenli Bölge',
                        last_seen_location: pet.sos_settings?.last_seen_location,
                        reward_enabled: pet.sos_settings?.reward_enabled,
                        dist: '0.1 km',
                        time: 'Şimdi',
                        description: pet.sos_settings?.finder_message || 'Moffi SOS Sistemi tarafından otomatik oluşturulmuş acil durum ilanı.',
                        type: pet.type?.includes('🐶') ? 'dog' : 'cat'
                    };
                    
                    if (existingIndex > -1) {
                        lostPets[existingIndex] = { ...lostPets[existingIndex], ...newAlert };
                    } else {
                        lostPets.unshift(newAlert);
                    }
                } else if (existingIndex > -1) {
                    // Remove if autoPost turned off while lost
                    lostPets.splice(existingIndex, 1);
                }
                await this.saveData('lost_pets', lostPets);
            }
        }
    }

    async upgradeSubscription(status: 'free' | 'plus' | 'pro'): Promise<void> {
        await this.updateProfile({ subscription_status: status });
    }

    async addBalance(amount: number, type: 'fiat' | 'coin'): Promise<void> {
        const current = await this.getCurrentUser();
        if (current) {
            const updates: Partial<UserProfile> = {};
            if (type === 'fiat') updates.wallet_balance = (current.wallet_balance || 0) + amount;
            else updates.moffi_coins = (current.moffi_coins || 0) + amount;
            await this.updateProfile(updates);
        }
    }

    // Health & Veterinary
    async getVaccineDefinitions(): Promise<any[]> { return []; }
    async getPetVaccines(petId: string): Promise<any[]> { return []; }
    async markVaccineAsCompleted(recordId: string, date: string, vetName: string): Promise<void> { }
    async checkHealthNotifications(petId: string): Promise<void> { }
    
    async getNearbyClinics(lat: number, lng: number, radiusKm: number = 10): Promise<any[]> {
        const clinics = [
            {
                id: 'vet-1',
                name: 'Moda Veteriner Polikliniği',
                imageUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=400',
                rating: 4.9,
                reviewCount: 128,
                address: 'Moda, Caferağa Mah. No:12, Kadıköy',
                location: { lat: lat + 0.005, lng: lng + 0.003 },
                is_premium: true,
                isOpenNow: true,
                features: ['Acil Servis', 'Laboratuvar', 'Cerrahi'],
                phone: '02163334455'
            },
            {
                id: 'vet-2',
                name: 'Pati Dostu Hayvan Hastanesi',
                imageUrl: 'https://images.unsplash.com/photo-1583337130417-13104dec14a4?q=80&w=400',
                rating: 4.7,
                reviewCount: 456,
                address: 'Suadiye, Bağdat Cad. No:156, Kadıköy',
                location: { lat: lat - 0.012, lng: lng + 0.015 },
                is_premium: false,
                isOpenNow: true,
                features: ['Görüntüleme', 'Pansiyon', 'Bakım'],
                phone: '02164445566'
            },
            {
                id: 'vet-3',
                name: 'Moffi Health Acil Vet',
                imageUrl: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?q=80&w=400',
                rating: 5.0,
                reviewCount: 89,
                address: 'Ataşehir, Varyap Meridian No:4',
                location: { lat: lat + 0.025, lng: lng - 0.010 },
                is_premium: true,
                isOpenNow: true,
                features: ['7/24 Acil', 'Ambulans', 'Eczane'],
                phone: '02165556677'
            }
        ];
        return clinics;
    }

    async getClinicDetails(clinicId: string): Promise<any> {
        // Find in our simulated list or return a default specific one
        const clinics = await this.getNearbyClinics(40.9850, 29.0300);
        const clinic = clinics.find(c => c.id === clinicId) || clinics[0];
        
        return {
            ...clinic,
            doctors: [
                { id: 'dr-1', name: 'Dr. Selin Demir', specialization: 'Cerrahi Uzmanı', workingHours: '09:00 - 18:00', bio: '15 yıllık cerrahi tecrübe.', imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200' },
                { id: 'dr-2', name: 'Dr. Caner Yıldız', specialization: 'Dahiliye', workingHours: '10:00 - 20:00', bio: 'Kedi hastalıkları konusunda uzmanlaşmış dahiliye hekimi.', imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200' }
            ],
            reviews: [
                { id: 'rev-1', userName: 'Hakan T.', rating: 5, comment: 'Çok ilgililerdi, Milo hemen iyileşti!', createdAt: '2024-03-10T10:00:00Z', userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' },
                { id: 'rev-2', userName: 'Ece S.', rating: 4, comment: 'Temiz bir klinik, doktorlar bilgili.', createdAt: '2024-03-05T14:45:00Z', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }
            ]
        };
    }
    async createAppointment(dto: any): Promise<any> { return {}; }
    async getAppointments(userId: string): Promise<any[]> { return []; }
    async cancelAppointment(id: string): Promise<void> { }
    async getClinicAppointments(clinicId: string): Promise<any[]> { return []; }
    async updateAppointmentStatus(appointmentId: string, status: string): Promise<void> { }
    async getClinicSettings(clinicId: string): Promise<any> { return null; }
    async saveClinicSettings(clinicId: string, settings: any): Promise<void> { }

    // Health Extension
    async getPetMedications(petId: string): Promise<any[]> {
        return await this.loadData<any[]>(`medications_${petId}`) || [];
    }

    async addPetMedication(petIdOrMed: any, med?: any): Promise<any> {
        const finalMed = med ? { ...med, petId: petIdOrMed } : petIdOrMed;
        const petId = finalMed.petId || finalMed.pet_id || 'pet-1';
        const meds = await this.getPetMedications(petId);
        const newMed = { id: `med-${Date.now()}`, ...finalMed, pet_id: petId };
        await this.saveData(`medications_${petId}`, [...meds, newMed]);
        return newMed;
    }

    async addPetVaccine(petIdOrRecord: any, record?: any): Promise<any> {
        const finalRecord = record ? { ...record, petId: petIdOrRecord } : petIdOrRecord;
        const petId = finalRecord.petId || finalRecord.pet_id || 'pet-1';
        const newRecord = {
            id: `vac-${Date.now()}`,
            vaccineId: finalRecord.name || finalRecord.vaccineId || 'PUPPY-1',
            status: finalRecord.status || 'completed',
            dueDate: finalRecord.dueDate || finalRecord.next_due_date || new Date().toISOString(),
            dateAdministered: finalRecord.dateAdministered || finalRecord.date_administered || new Date().toISOString(),
            vetName: finalRecord.vetName || finalRecord.vet_name || 'Uzman Hekim',
            batchNumber: 'TR-' + Math.random().toString(36).substring(2, 8).toUpperCase()
        };
        return newRecord;
    }

    async recordMedicationDose(medId: string): Promise<void> {}

    async getNutritionPlan(petId: string): Promise<any | null> {
        return await this.loadData(`nutrition_${petId}`);
    }

    async updateNutritionPlan(petId: string, plan: any): Promise<void> {
        await this.saveData(`nutrition_${petId}`, plan);
    }

    async getPetDailyStats(petId: string, date: string): Promise<any | null> {
        return await this.loadData(`daily_stats_${petId}_${date}`);
    }

    async savePetDailyStats(petId: string, date: string, stats: any): Promise<void> {
        await this.saveData(`daily_stats_${petId}_${date}`, stats);
    }

    // Walk & Tracking
    async startWalk(userId: string, petId: string): Promise<any> { return {}; }
    async updateWalkLocation(sessionId: string, lat: number, lng: number): Promise<void> { }
    async endWalk(sessionId: string, data: any): Promise<any> { return {}; }
    async getWalkHistory(userId: string, limit?: number): Promise<any[]> { return []; }
    async getWalkStats(userId: string): Promise<any> {
        return {
            totalWalks: 18,
            totalDistanceKm: 32.4,
            totalDurationMinutes: 412,
            totalCalories: 1944,
            totalSteps: 45360,
            averageDistanceKm: 1.8,
            longestWalkKm: 4.2,
            currentStreak: 4,
            bestStreak: 7
        };
    }
    async getWalkById(id: string): Promise<any> { return {}; }

    // Social Media
    async getStories(): Promise<any[]> { return []; }
    async addStory(story: any): Promise<any> { return story; }
    async getPostReactions(postId: string): Promise<any[]> { return []; }
    
    // User Discovery & Social Interactions
    async followUser(targetId: string): Promise<void> {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) throw new Error("Giriş gerekli");

        if (typeof window !== 'undefined') {
            try {
                const followsRaw = localStorage.getItem('moffi_local_follows');
                const follows: Record<string, string[]> = followsRaw ? JSON.parse(followsRaw) : {};
                
                if (!follows[currentUser.id]) {
                    follows[currentUser.id] = [];
                }
                if (!follows[currentUser.id].includes(targetId)) {
                    follows[currentUser.id].push(targetId);
                    localStorage.setItem('moffi_local_follows', JSON.stringify(follows));

                    // Add mock notification to inbox
                    const senderName = currentUser.username || currentUser.name || 'Bir kullanıcı';
                    await this.addInboxMessage({
                        type: 'follow',
                        user: `@${senderName}`,
                        avatar: currentUser.avatar || '',
                        text: 'seni takip etmeye başladı! 🐾',
                        time: 'Şimdi',
                        read: false,
                        meta: {
                            sender_id: currentUser.id,
                            sender_name: currentUser.name || senderName,
                            sender_avatar: currentUser.avatar || null
                        }
                    });
                }
            } catch (e) {
                console.error("Error saving followUser:", e);
            }
        }
    }

    async unfollowUser(targetId: string): Promise<void> {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) return;

        if (typeof window !== 'undefined') {
            try {
                const followsRaw = localStorage.getItem('moffi_local_follows');
                const follows: Record<string, string[]> = followsRaw ? JSON.parse(followsRaw) : {};
                
                if (follows[currentUser.id]) {
                    follows[currentUser.id] = follows[currentUser.id].filter(id => id !== targetId);
                    localStorage.setItem('moffi_local_follows', JSON.stringify(follows));
                }
            } catch (e) {
                console.error("Error saving unfollowUser:", e);
            }
        }
    }

    async isFollowing(targetId: string): Promise<boolean> {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) return false;

        if (typeof window !== 'undefined') {
            try {
                const followsRaw = localStorage.getItem('moffi_local_follows');
                const follows: Record<string, string[]> = followsRaw ? JSON.parse(followsRaw) : {};
                return follows[currentUser.id]?.includes(targetId) || false;
            } catch (e) {
                console.error("Error reading isFollowing:", e);
            }
        }
        return false;
    }

    async blockUser(targetId: string): Promise<void> {
        await this.unfollowUser(targetId);
    }

    async reportUser(targetId: string, reason: string): Promise<void> {}

    async getFollowers(userId: string): Promise<UserProfile[]> {
        if (typeof window === 'undefined') return [];
        try {
            const followsRaw = localStorage.getItem('moffi_local_follows');
            const follows: Record<string, string[]> = followsRaw ? JSON.parse(followsRaw) : {};
            
            const followerIds: string[] = [];
            for (const followerId in follows) {
                if (follows[followerId]?.includes(userId)) {
                    followerIds.push(followerId);
                }
            }

            const profiles = await Promise.all(followerIds.map(id => this.getUserProfile(id)));
            return profiles.filter(Boolean) as UserProfile[];
        } catch (e) {
            console.error("Error getFollowers in mock:", e);
            return [];
        }
    }

    async getFollowing(userId: string): Promise<UserProfile[]> {
        if (typeof window === 'undefined') return [];
        try {
            const followsRaw = localStorage.getItem('moffi_local_follows');
            const follows: Record<string, string[]> = followsRaw ? JSON.parse(followsRaw) : {};
            
            const followingIds = follows[userId] || [];
            const profiles = await Promise.all(followingIds.map(id => this.getUserProfile(id)));
            return profiles.filter(Boolean) as UserProfile[];
        } catch (e) {
            console.error("Error getFollowing in mock:", e);
            return [];
        }
    }
    
    // Direct Messaging (Chat)
    async getChatConversations(): Promise<any[]> { return []; }
    async getChatMessages(conversationId: string): Promise<any[]> { return []; }
    async sendChatMessage(receiverId: string, content: string, associatedAdId?: string): Promise<any> { return { id: Date.now(), content }; }
    async markChatAsRead(conversationId: string): Promise<void> {}
    async deleteChatMessage(messageId: string): Promise<void> {}

    async reactToPost(postId: string | number, reaction: string): Promise<void> {
        const currentUser = await this.getCurrentUser();
        const currentUserIdOrName = currentUser?.id || currentUser?.username || 'local-user';

        if (typeof window !== 'undefined') {
            let cache: Record<string, any> = {};
            try {
                cache = JSON.parse(localStorage.getItem('moffi_global_post_likes') || '{}');
            } catch {}

            const pIdStr = String(postId);
            if (!cache[pIdStr]) {
                try {
                    const allPosts = await this.getFeedContent();
                    const matched = allPosts.find(p => String(p.id) === String(postId));
                    cache[pIdStr] = { 
                        likes: matched?.likes || 0, 
                        usersLiked: matched?.is_liked || (matched as any)?.isLiked ? [currentUserIdOrName] : [] 
                    };
                } catch {
                    cache[pIdStr] = { likes: 0, usersLiked: [] };
                }
            }

            const usersLiked: string[] = cache[pIdStr].usersLiked || [];
            const hasLiked = usersLiked.includes(currentUserIdOrName);

            let nextLikes = cache[pIdStr].likes || 0;
            let nextUsersLiked = [...usersLiked];

            if (hasLiked) {
                nextUsersLiked = nextUsersLiked.filter(u => u !== currentUserIdOrName);
                nextLikes = Math.max(0, nextLikes - 1);
            } else {
                nextUsersLiked.push(currentUserIdOrName);
                nextLikes = nextLikes + 1;
            }

            cache[pIdStr] = {
                likes: nextLikes,
                usersLiked: nextUsersLiked
            };

            localStorage.setItem('moffi_global_post_likes', JSON.stringify(cache));
            window.dispatchEvent(new Event('moffi_posts_changed'));
        }

        const posts = await this.getFeedContent();
        await this.saveData('feed_posts', posts);
    }

    async addComment(postId: string | number, text: string, parentCommentId?: string | number): Promise<void> {
        const posts = await this.getFeedContent();
        const post = posts.find(p => String(p.id) === String(postId));
        if (post) {
            post.comments = (post.comments || 0) + 1;
            await this.saveData('feed_posts', posts);
        }
        
        const cached = await this.loadData<any[]>(`comments_${postId}`) || [];
        const currentUser = await this.getCurrentUser();
        const newComment = {
            id: Date.now(),
            post_id: postId,
            user: currentUser?.name || currentUser?.username || 'Moffi Kullanıcısı',
            avatar: currentUser?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300",
            text: text,
            time: 'Şimdi',
            user_id: currentUser?.id || 'unknown',
            likes: 0,
            status: 'approved',
            isLiked: false,
            parent_id: parentCommentId
        };
        await this.saveData(`comments_${postId}`, [...cached, newComment]);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('moffi_comments_changed'));
        }
    }

    async getPostComments(postId: string | number): Promise<any[]> { 
        const cached = await this.loadData<any[]>(`comments_${postId}`) || [];
        
        let list = [...cached];
        if (list.length === 0) {
            list = [
                {
                    id: 1,
                    post_id: postId,
                    user: 'Milo & Luna',
                    avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400',
                    text: 'Harika bir paylaşım! 🐾 Bize de bekleriz.',
                    time: '2 saat önce',
                    user_id: 'user-milo',
                    likes: 12,
                    status: 'approved',
                    isLiked: false
                }
            ];
            await this.saveData(`comments_${postId}`, list);
        }

        let overrides: Record<string, any> = {};
        if (typeof window !== 'undefined') {
            try { overrides = JSON.parse(localStorage.getItem('moffi_global_comment_state') || '{}'); } catch {}
        }
        const currentUser = await this.getCurrentUser();
        const currentUserOrName = currentUser?.id || currentUser?.username || 'local-user';

        const finalComments: any[] = [];
        list.forEach(c => {
            const cidStr = String(c.id);
            const ov = overrides[cidStr];
            if (ov?.isDeleted) return;

            const isLiked = ov?.usersLiked ? ov.usersLiked.includes(currentUserOrName) : (c.isLiked || false);
            const likes = ov?.likes !== undefined ? ov.likes : (c.likes || 0);
            const text = ov?.text !== undefined ? ov.text : c.text;
            const status = ov?.status !== undefined ? ov.status : (c.status || 'approved');

            finalComments.push({
                ...c,
                isLiked,
                likes,
                text,
                status,
                replies: []
            });
        });

        const commentMap = new Map<string, any>();
        const topLevelComments: any[] = [];

        finalComments.forEach(c => {
            commentMap.set(String(c.id), c);
        });

        finalComments.forEach(c => {
            const mapped = commentMap.get(String(c.id));
            if (c.parent_id && commentMap.has(String(c.parent_id))) {
                commentMap.get(String(c.parent_id)).replies.push(mapped);
            } else {
                topLevelComments.push(mapped);
            }
        });

        return topLevelComments;
    }

    async editComment(commentId: string | number, content: string): Promise<void> {
        if (typeof window === 'undefined') return;
        try {
            const overrides = JSON.parse(localStorage.getItem('moffi_global_comment_state') || '{}');
            const cidStr = String(commentId);
            overrides[cidStr] = { ...(overrides[cidStr] || {}), text: content };
            localStorage.setItem('moffi_global_comment_state', JSON.stringify(overrides));
            window.dispatchEvent(new Event('moffi_comments_changed'));
        } catch {}

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('moffi_local_comments_')) {
                try {
                    const items = JSON.parse(localStorage.getItem(key) || '[]');
                    let updated = false;
                    const nextItems = items.map((c: any) => {
                        if (String(c.id) === String(commentId)) {
                            updated = true;
                            return { ...c, text: content };
                        }
                        return c;
                    });
                    if (updated) {
                        localStorage.setItem(key, JSON.stringify(nextItems));
                        break;
                    }
                } catch {}
            }
        }
    }

    async deleteComment(commentId: string | number): Promise<void> {
        if (typeof window === 'undefined') return;
        try {
            const overrides = JSON.parse(localStorage.getItem('moffi_global_comment_state') || '{}');
            const cidStr = String(commentId);
            overrides[cidStr] = { ...(overrides[cidStr] || {}), isDeleted: true };
            localStorage.setItem('moffi_global_comment_state', JSON.stringify(overrides));
            window.dispatchEvent(new Event('moffi_comments_changed'));
        } catch {}

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('moffi_local_comments_')) {
                try {
                    const items = JSON.parse(localStorage.getItem(key) || '[]');
                    const filtered = items.filter((c: any) => String(c.id) !== String(commentId) && String(c.parent_id) !== String(commentId));
                    if (filtered.length !== items.length) {
                        localStorage.setItem(key, JSON.stringify(filtered));
                        break;
                    }
                } catch {}
            }
        }
    }

    async toggleCommentLike(commentId: string | number): Promise<void> {
        if (typeof window === 'undefined') return;
        try {
            const overrides = JSON.parse(localStorage.getItem('moffi_global_comment_state') || '{}');
            const cidStr = String(commentId);
            const currentOverride = overrides[cidStr] || {};
            
            let currentUserOrName = 'local-user';
            try {
                const saved = JSON.parse(localStorage.getItem('moffi_local_current_user') || 'null');
                if (saved) currentUserOrName = saved.id || saved.username || 'local-user';
            } catch {}

            const usersLiked: string[] = currentOverride.usersLiked || [];
            const hasLiked = usersLiked.includes(currentUserOrName);

            let nextLikes = currentOverride.likes;
            if (nextLikes === undefined) {
                let baseLikes = 0;
                if (cidStr === '1' || cidStr.includes('init-')) baseLikes = 12;
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k?.startsWith('moffi_local_comments_')) {
                        try {
                            const items = JSON.parse(localStorage.getItem(k) || '[]');
                            const matched = items.find((c: any) => String(c.id) === cidStr);
                            if (matched && matched.likes !== undefined) {
                                baseLikes = Number(matched.likes);
                                break;
                            }
                        } catch {}
                    }
                }
                nextLikes = baseLikes;
            }

            let nextUsersLiked = [...usersLiked];
            if (hasLiked) {
                nextUsersLiked = nextUsersLiked.filter(u => u !== currentUserOrName);
                nextLikes = Math.max(0, nextLikes - 1);
            } else {
                nextUsersLiked.push(currentUserOrName);
                nextLikes = nextLikes + 1;
            }

            overrides[cidStr] = {
                ...currentOverride,
                usersLiked: nextUsersLiked,
                likes: nextLikes
            };
            localStorage.setItem('moffi_global_comment_state', JSON.stringify(overrides));
            window.dispatchEvent(new Event('moffi_comments_changed'));
        } catch {}
    }


    async getUserPosts(userId: string): Promise<any[]> {
        // In mock mode, filter local feed posts by userId
        const posts = await this.getFeedContent();
        return posts.filter(p => String(p.user_id) === String(userId));
    }


    async updateAuraSettings(settings: any): Promise<void> {
        await this.updateProfile({ aura_settings: settings });
    }

    // Media & Storage
    async uploadMedia(file: File, bucket: 'posts' | 'stories' | 'avatars' | 'sounds'): Promise<string> { 
        // 1. Check if Supabase is available
        const { supabase } = await import('../lib/supabase');
        const isEnabled = process.env.NEXT_PUBLIC_DATA_SOURCE === 'supabase' || true; // Force cloud storage for media if available

        if (supabase && isEnabled) {
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { data, error } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, file);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(filePath);

                return publicUrl;
            } catch (err) {
                console.error('Supabase upload error, falling back to local blob:', err);
            }
        }

        // Simulation Fallback: Use a local Object URL if window is available, otherwise default image
        if (typeof window !== 'undefined' && file) {
            try {
                return URL.createObjectURL(file);
            } catch (e) {
                console.error("Failed to create object URL for local preview:", e);
            }
        }
        return "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800";
    }

    // Persistence Utility (LocalStorage)
    async globalSearch(query: string): Promise<any> {
        // Mock search implementation if needed, for now returning empty arrays
        return { profiles: [], posts: [], pets: [] };
    }

    async saveData<T>(key: string, data: T): Promise<void> {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    }

    async loadData<T>(key: string): Promise<T | null> {
        if (typeof window === 'undefined') return null;
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    async addProduct(product: Partial<ShopProduct>): Promise<ShopProduct> {
        const products = await this.getProducts();
        const newProduct: ShopProduct = {
            id: `prod-${Date.now()}`,
            name: product.name || 'Yeni Ürün',
            description: product.description || '',
            price: product.price || 0,
            oldPrice: product.oldPrice,
            image: product.image || '🦴',
            category: product.category || 'food',
            isPrimeOnly: product.isPrimeOnly || false,
            inStock: (product.stockCount || 10) > 0,
            stockCount: product.stockCount || 10,
            rating: 5.0,
            reviews: 0,
            isVetApproved: product.isVetApproved || false,
            tag: product.tag
        };
        await this.saveData('products', [...products, newProduct]);
        return newProduct;
    }

    async updateProduct(id: string, product: Partial<ShopProduct>): Promise<ShopProduct> {
        const products = await this.getProducts();
        let updated: ShopProduct | null = null;
        const next = products.map(p => {
            if (p.id === id) {
                updated = {
                    ...p,
                    ...product,
                    price: product.price !== undefined ? product.price : p.price,
                    oldPrice: product.oldPrice !== undefined ? product.oldPrice : p.oldPrice,
                    stockCount: product.stockCount !== undefined ? product.stockCount : p.stockCount,
                    inStock: (product.stockCount !== undefined ? product.stockCount : (p.stockCount || 0)) > 0
                };
                return updated;
            }
            return p;
        });
        if (!updated) throw new Error("Product not found");
        await this.saveData('products', next);
        return updated;
    }

    async deleteProduct(id: string): Promise<void> {
        const products = await this.getProducts();
        const next = products.filter(p => p.id !== id);
        await this.saveData('products', next);
    }

    async updateOrderStatus(orderId: string, status: any): Promise<void> {
        const orders = await this.getOrders();
        const next = orders.map(o => o.id === orderId ? { ...o, status } : o);
        await this.saveData('orders', next);
    }

    async getAllOrders(): Promise<ShopOrder[]> {
        return this.getOrders();
    }

    async getAnnouncements(): Promise<SystemAnnouncement[]> {
        const data = await this.loadData<SystemAnnouncement[]>('announcements');
        if (!data) {
            const initial: SystemAnnouncement[] = [
                {
                    id: 'ann_1',
                    media_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=600',
                    created_at: new Date().toISOString(),
                    title: 'Kadıköy Patimaratonu!',
                    description: '24 Mayıs Pazar günü Caddebostan Sahili\'nde buluşuyoruz. Tüm patili dostlarımız ve sahipleri davetlidir.',
                    badge: 'Etkinlik',
                    cta_text: 'Ücretsiz Kaydol 🎟️',
                    cta_type: 'toast',
                    cta_value: 'Patimaraton katılım biletiniz Moffi cüzdanınıza eklendi!',
                    expires_at: new Date(Date.now() + 86400000 * 7).toISOString()
                },
                {
                    id: 'ann_2',
                    media_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600',
                    created_at: new Date(Date.now() - 7200000).toISOString(),
                    title: 'Akıllı Tasma V2 Çıktı!',
                    description: 'Tasma yazılımı için yeni geofence optimizasyonları ve pil tasarruf modu yayınlandı. Ayarlar sekmesinden güncelleyebilirsiniz.',
                    badge: 'Sistem Güncellemesi',
                    cta_text: 'Hemen Güncelle ⚡',
                    cta_type: 'toast',
                    cta_value: 'Akıllı Tasma V2 güncellemesi tasmanıza kablosuz (OTA) olarak yükleniyor...',
                    expires_at: new Date(Date.now() + 86400000 * 30).toISOString()
                }
            ];
            await this.saveData('announcements', initial);
            return initial;
        }
        return data;
    }

    async addAnnouncement(announcement: Partial<SystemAnnouncement>): Promise<SystemAnnouncement> {
        const list = await this.getAnnouncements();
        const newAnn: SystemAnnouncement = {
            id: `ann-${Date.now()}`,
            title: announcement.title || 'Duyuru',
            description: announcement.description || '',
            media_url: announcement.media_url || 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?q=80&w=600',
            badge: announcement.badge || 'Duyuru',
            cta_text: announcement.cta_text || 'İncele',
            cta_type: announcement.cta_type || 'toast',
            cta_value: announcement.cta_value || '',
            expires_at: announcement.expires_at || new Date(Date.now() + 86400000 * 7).toISOString(),
            created_at: new Date().toISOString()
        };
        await this.saveData('announcements', [newAnn, ...list]);
        return newAnn;
    }

    async deleteAnnouncement(id: string): Promise<void> {
        const list = await this.getAnnouncements();
        const next = list.filter(item => item.id !== id);
        await this.saveData('announcements', next);
    }

    // Daily Star Pet (Yıldız Patiler) Mock Implementations
    async getAllPetsAdmin(): Promise<Pet[]> {
        const customPets = await this.loadData<Pet[]>('pets') || [];
        const allPets = [...customPets];
        MOCK_PETS.forEach((mp: any) => {
            if (!allPets.some(p => p.id === mp.id)) {
                allPets.push(mp);
            }
        });
        return allPets;
    }

    async getDailyStarCandidates(): Promise<any[]> {
        const pets = await this.getAllPetsAdmin();
        const candidateScores = [4200, 3850, 3100, 2900, 2450];
        const badges = ["Günün Şampiyonu 👑", "Halkın Seçimi 🌸", "Stil İkonu ✨", "Aktif Pati ⚡", "Yükselen Yıldız 🚀"];
        
        return pets.slice(0, 5).map((pet, idx) => ({
            id: pet.id,
            name: pet.name,
            breed: pet.breed,
            image: pet.image || pet.avatar || '/images/moffi_pet_trio.png',
            auraPoints: candidateScores[idx] || 1500,
            badge: badges[idx] || "Aktif Pati ⚡",
            ownerName: 'Moffi Üyesi',
            activitySummary: `Bugün toplam ${candidateScores[idx] || 1500} Aura puanı kazandı ve yürüyüş hedeflerini tamamladı.`
        }));
    }

    async getDailyStars(dateString: string): Promise<any[]> {
        const list = await this.loadData<any[]>('daily_stars') || [];
        const candidates = await this.getDailyStarCandidates();
        const results: any[] = [];

        for (let r = 1; r <= 5; r++) {
            const found = list.find(item => item.date === dateString && item.rank === r);
            if (found) {
                results.push(found);
            } else {
                // Fallback: Automatic candidate for this rank
                const candidate = candidates[r - 1] || candidates[0];
                if (candidate) {
                    results.push({
                        id: `star-${dateString}-${r}-auto`,
                        pet_id: candidate.id,
                        date: dateString,
                        rank: r,
                        title: `Günün Şampiyonu: ${candidate.name} 🐕`,
                        description: `${candidate.name} bugün ${candidate.auraPoints} Aura toplayarak günün en aktif patilerinden biri oldu!`,
                        badge: candidate.badge,
                        media_url: candidate.image,
                        status: 'auto',
                        created_at: new Date().toISOString(),
                        pet: {
                            name: candidate.name,
                            image: candidate.image,
                            breed: candidate.breed
                        }
                    });
                }
            }
        }
        return results;
    }

    async setDailyStar(dateString: string, rank: number, petId: string, details: any): Promise<void> {
        const list = await this.loadData<any[]>('daily_stars') || [];
        const pets = await this.getAllPetsAdmin();
        const selectedPet = pets.find(p => p.id === petId);
        
        const newStar = {
            id: `star-${dateString}-${rank}-published`,
            pet_id: petId,
            date: dateString,
            rank: rank,
            title: details.title || `Günün Yıldızı: ${selectedPet?.name || 'Pati'}`,
            description: details.description || '',
            badge: details.badge || 'Günün Yıldızı 🌟',
            media_url: details.media_url || selectedPet?.image || selectedPet?.avatar || '/images/moffi_pet_trio.png',
            status: 'published',
            created_at: new Date().toISOString(),
            pet: selectedPet ? {
                name: selectedPet.name,
                image: selectedPet.image || selectedPet.avatar,
                breed: selectedPet.breed
            } : null
        };

        const updatedList = [newStar, ...list.filter(item => !(item.date === dateString && item.rank === rank))];
        await this.saveData('daily_stars', updatedList);
    }

    async removeDailyStar(dateString: string, rank: number): Promise<void> {
        const list = await this.loadData<any[]>('daily_stars') || [];
        const updatedList = list.filter(item => !(item.date === dateString && item.rank === rank));
        await this.saveData('daily_stars', updatedList);
    }

    // Vet Advices (Vet Tavsiyeleri) Mock Implementations
    async getVetAdvices(): Promise<any[]> {
        const list = await this.loadData<any[]>('vet_advices') || [];
        
        // 2 default admin fallbacks if there are no global tips yet
        const defaultAdminAdvices = [
            {
                id: 'vet-default-1',
                clinic_id: null,
                content: 'Yaz aylarında asfalt sıcaklığı hava sıcaklığının iki katına çıkabilir. Patileri yakmamak için yürüyüşleri sabah veya akşam yapın.',
                badge: 'Yaz Bakımı ☀️',
                media_url: '/images/moffi_pet_trio.png',
                created_at: new Date().toISOString()
            },
            {
                id: 'vet-default-2',
                clinic_id: null,
                content: 'İlkbahar ve yaz aylarında dış parazit aşılarını aksatmayın. Çimlerde yürüyüş sonrası pati aralarını mutlaka kontrol edin.',
                badge: 'Sağlık Uyarısı 🩺',
                media_url: '/images/moffi_pet_trio.png',
                created_at: new Date().toISOString()
            }
        ];

        // Merge saved list with defaults (only if no admin advices exist in the saved list)
        const adminAdvicesInList = list.filter(item => !item.clinic_id);
        const compiledList = [...list];
        if (adminAdvicesInList.length === 0) {
            compiledList.push(...defaultAdminAdvices);
        }

        // Attach clinic details for presentation
        return compiledList.map(item => {
            if (item.clinic_id) {
                // Mock clinic details for mock testing
                return {
                    ...item,
                    clinic: {
                        name: item.clinic_id === 'biz_vet1' ? 'Moffi Vet Polikliniği' : 'Pet Clinic Ataşehir',
                        imageUrl: '/images/moffi_pet_trio.png'
                    }
                };
            }
            return item;
        });
    }

    async saveClinicAdvice(clinicId: string, content: string, badge: string): Promise<void> {
        const list = await this.loadData<any[]>('vet_advices') || [];
        // Keep one active tip per clinic for simplicity in mock
        const filtered = list.filter(item => item.clinic_id !== clinicId);
        
        const newAdvice = {
            id: `advice-${Date.now()}`,
            clinic_id: clinicId,
            content,
            badge,
            media_url: '/images/moffi_pet_trio.png',
            created_at: new Date().toISOString()
        };

        await this.saveData('vet_advices', [newAdvice, ...filtered]);
    }

    async addAdminAdvice(content: string, badge: string, mediaUrl?: string): Promise<any> {
        const list = await this.loadData<any[]>('vet_advices') || [];
        const newAdvice = {
            id: `advice-${Date.now()}`,
            clinic_id: null,
            content,
            badge,
            media_url: mediaUrl || '/images/moffi_pet_trio.png',
            created_at: new Date().toISOString()
        };

        await this.saveData('vet_advices', [newAdvice, ...list]);
        return newAdvice;
    }

    async deleteAdvice(id: string): Promise<void> {
        const list = await this.loadData<any[]>('vet_advices') || [];
        const filtered = list.filter(item => item.id !== id);
        await this.saveData('vet_advices', filtered);
    }
}
// Singleton instance for components that haven't migrated to the central services/apiService.ts yet
export const apiService = new MockApiService();
