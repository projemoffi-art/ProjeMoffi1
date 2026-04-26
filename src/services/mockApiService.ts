import { IApiService } from './apiService';
import { 
    Pet, Post, UserProfile, LostPet, AdoptionPet,
    ShopCategory, ShopProduct, ShopCartItem, ShopOrder
} from './types';
import { 
    MOCK_PETS, MOCK_LOST_PETS, MOCK_ADOPTIONS, 
    MOCK_NOTIFICATIONS, MOCK_POSTS 
} from '../lib/mockData';

const STORAGE_PREFIX = 'moffi_local_';

export class MockApiService implements IApiService {
    
    // Auth & Profile
    async getCurrentUser(): Promise<UserProfile | null> {
        const saved = await this.loadData<UserProfile>('current_user');
        if (saved) return saved;
        
        // Initial setup for mock
        const newUser: UserProfile = {
            id: 'user-moffi-official',
            name: 'Moffi Official',
            username: 'MoffiOfficial',
            avatar: "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?q=80&w=400",
            is_verified: true,
            subscription_status: 'pro',
            wallet_balance: 1450,
            moffi_coins: 250
        };
        await this.saveData('current_user', newUser);
        return newUser;
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

    // Community
    async getFeedContent(): Promise<Post[]> {
        const saved = await this.loadData<Post[]>('feed_posts');
        
        // Ensure our mandatory test posts are always in the feed for routing verification
        const mandatoryIds = MOCK_POSTS.map(p => String(p.id));
        const existingPosts = saved || [];
        
        // Filter out any older versions of mandatory posts to avoid duplicates
        const userPosts = existingPosts.filter(p => !mandatoryIds.includes(String(p.id)));
        
        // Combine: Mandatory Test Posts + User's locally added posts
        const finalPosts = [...MOCK_POSTS, ...existingPosts];
        
        await this.saveData('feed_posts', finalPosts);
        return finalPosts as any;
    }

    async getLostPets(): Promise<LostPet[]> {
        const saved = await this.loadData<LostPet[]>('lost_pets');
        // If we have saved data (even empty), use it; otherwise fallback to mocks
        if (saved !== null) return saved;
        return (MOCK_LOST_PETS as any);
    }

    async getAdoptions(): Promise<AdoptionPet[]> {
        const saved = await this.loadData<AdoptionPet[]>('adoptions');
        return saved || (MOCK_ADOPTIONS as any);
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
            id: Math.random().toString(36).substr(2, 9),
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
    }

    async updatePost(postId: string | number, updates: Partial<Post>): Promise<void> {
        const posts = await this.getFeedContent();
        const index = posts.findIndex(p => String(p.id) === String(postId));
        if (index !== -1) {
            posts[index] = { ...posts[index], ...updates };
            await this.saveData('feed_posts', posts);
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

    // Health Extension (Mock)
    async getPetMedications(petId: string): Promise<any[]> {
        const saved = await this.loadData<any[]>(`meds_${petId}`);
        if (saved) return saved;
        
        const initial = [
            {
                id: 'm-1',
                petId,
                name: 'VetLife Vitamin Complex',
                dosage: '1 tablet',
                frequency: 'Günde 1 kez',
                instructions: 'Sabah tok karnına',
                startDate: new Date().toISOString(),
                endDate: null,
                isActive: true,
                lastLog: null
            }
        ];
        await this.saveData(`meds_${petId}`, initial);
        return initial;
    }

    async recordMedicationDose(medId: string): Promise<void> {
        const activePet = await this.getActivePet();
        if (!activePet) return;
        
        const meds = await this.getPetMedications(activePet.id);
        const medIndex = meds.findIndex(m => m.id === medId);
        if (medIndex > -1) {
            meds[medIndex].lastLog = new Date().toISOString();
            await this.saveData(`meds_${activePet.id}`, meds);
            
            // Log to medication_logs for history if needed
            const logs = await this.loadData<any[]>(`med_logs_${medId}`) || [];
            logs.push({ id: Date.now(), medicationId: medId, loggedAt: new Date().toISOString() });
            await this.saveData(`med_logs_${medId}`, logs);
        }
    }

    async getNutritionPlan(petId: string): Promise<any | null> {
        const saved = await this.loadData<any>(`nutrition_${petId}`);
        if (saved) return saved;
        
        const initial = {
            id: 'n-1',
            petId,
            foodName: 'Royal Canin Adult',
            amountGrams: 150,
            mealsPerDay: 2,
            targetWeight: 4.5,
            notes: 'Tahılsız mama kullanımı tavsiye edilir.',
            isActive: true
        };
        await this.saveData(`nutrition_${petId}`, initial);
        return initial;
    }

    async updateNutritionPlan(petId: string, plan: any): Promise<void> {
        await this.saveData(`nutrition_${petId}`, { ...plan, petId });
    }

    // Walk & Tracking
    async startWalk(userId: string, petId: string): Promise<any> { return {}; }
    async updateWalkLocation(sessionId: string, lat: number, lng: number): Promise<void> { }
    async endWalk(sessionId: string, data: any): Promise<any> { return {}; }
    async getWalkHistory(userId: string, limit?: number): Promise<any[]> { return []; }
    async getWalkStats(userId: string): Promise<any> { return {}; }
    async getWalkById(id: string): Promise<any> { return {}; }

    async getPostComments(postId: string): Promise<any[]> { return []; }
    
    // User Discovery & Social Interactions
    async followUser(targetId: string): Promise<void> {
        const follows = await this.loadData<string[]>('my_follows') || [];
        if (!follows.includes(targetId)) {
            await this.saveData('my_follows', [...follows, targetId]);
            
            // Mock Notification
            await this.addInboxMessage({
                user_id: targetId,
                title: '🎉 Yeni Takipçi',
                content: 'Bir kullanıcı sizi takip etmeye başladı!',
                type: 'social',
                avatar: '',
                user: 'Moffi User',
                text: 'Sizi takip etmeye başladı.',
                time: 'Şimdi'
            });
        }
    }

    async unfollowUser(targetId: string): Promise<void> {
        const follows = await this.loadData<string[]>('my_follows') || [];
        await this.saveData('my_follows', follows.filter(id => id !== targetId));
    }

    async isFollowing(targetId: string): Promise<boolean> {
        const follows = await this.loadData<string[]>('my_follows') || [];
        return follows.includes(targetId);
    }

    async blockUser(targetId: string): Promise<void> {
        const blocks = await this.loadData<string[]>('my_blocks') || [];
        if (!blocks.includes(targetId)) {
            await this.saveData('my_blocks', [...blocks, targetId]);
        }
        await this.unfollowUser(targetId);
    }

    async reportUser(targetId: string, reason: string): Promise<void> {
        const reports = await this.loadData<any[]>('my_reports') || [];
        reports.push({ targetId, reason, time: new Date().toISOString() });
        await this.saveData('my_reports', reports);
    }
    
    // Direct Messaging (Chat)
    async getChatConversations(): Promise<any[]> {
        const saved = await this.loadData<any[]>('conversations');
        if (saved) return saved;

        const initial = [
            {
                id: 'conv-1',
                userId: 'user-milo',
                userName: 'Milo (Moffi Pro)',
                userAvatar: 'https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=200',
                latestMessage: 'Merhaba! Tanıştığımıza memnun oldum. 🐾',
                latestTime: '2s',
                unread: true,
                messages: [
                    { id: 'm1', text: 'Merhaba! Tanıştığımıza memnun oldum. 🐾', sentByMe: false, time: '2s' }
                ]
            }
        ];
        await this.saveData('conversations', initial);
        return initial;
    }

    async getChatMessages(conversationId: string): Promise<any[]> {
        const convs = await this.getChatConversations();
        const conv = convs.find(c => c.id === conversationId);
        return conv ? conv.messages : [];
    }

    async sendChatMessage(receiverId: string, content: string): Promise<any> {
        const convs = await this.getChatConversations();
        let conv = convs.find(c => c.userId === receiverId);
        
        if (!conv) {
            conv = {
                id: `conv-${Date.now()}`,
                userId: receiverId,
                userName: 'Moffi User',
                userAvatar: '',
                messages: []
            };
            convs.push(conv);
        }

        const newMessage = {
            id: `m-${Date.now()}`,
            text: content,
            sentByMe: true,
            time: 'Şimdi'
        };

        conv.messages.push(newMessage);
        conv.latestMessage = content;
        conv.latestTime = 'Şimdi';
        conv.unread = false;

        await this.saveData('conversations', convs);
        return newMessage;
    }

    async markChatAsRead(conversationId: string): Promise<void> {
        const convs = await this.getChatConversations();
        const conv = convs.find(c => c.id === conversationId);
        if (conv) {
            conv.unread = false;
            await this.saveData('conversations', convs);
        }
    }

    async reactToPost(postId: string | number, reaction: string): Promise<void> {
        const posts = await this.getFeedContent();
        const post = posts.find(p => String(p.id) === String(postId));
        if (post) {
            post.likes = (post.likes || 0) + 1;
            post.is_liked = true;
            await this.saveData('feed_posts', posts);
        }
    }

    async addComment(postId: string | number, text: string): Promise<void> {
        const posts = await this.getFeedContent();
        const post = posts.find(p => String(p.id) === String(postId));
        if (post) {
            post.comments = (post.comments || 0) + 1;
            // In a real mock, we'd store the comments array too
            await this.saveData('feed_posts', posts);
        }
    }

    async updateAuraSettings(settings: any): Promise<void> {
        await this.updateProfile({ aura_settings: settings });
    }

    // Media & Storage
    async uploadMedia(file: File, bucket: 'posts' | 'stories' | 'avatars'): Promise<string> { 
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

        // Simulation Fallback: Use a guaranteed high-quality pet image for mock persistence
        return "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800";
    }

    // Persistence Utility (LocalStorage)
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
}
// Singleton instance for components that haven't migrated to the central services/apiService.ts yet
export const apiService = new MockApiService();
