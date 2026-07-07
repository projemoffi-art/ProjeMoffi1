import { 
    Pet, Post, UserProfile, LostPet, AdoptionPet, LostPetSighting,
    ShopCategory, ShopProduct, ShopCartItem, ShopOrder, IApiService,
    SystemAnnouncement
} from './types';
import { supabase } from '@/lib/supabase';
import { MockApiService } from './mockApiService';
import { UserVaccineRecord } from '@/types/domain';

export class SupabaseApiService implements IApiService {
    // Session is managed internally by Supabase client very efficiently.
    // Custom aggressive caching causes cross-account validation bugs.
    
    private pendingActionLocks = new Set<string>();
    private mockApi = new MockApiService();

    invalidateCache() {
        // No-op for backwards compatibility
    }

    private async getSessionUser() {
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
    }


    // --- AUTH & PROFILE ---
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
        const [profileRes, followersRes, followingRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', id).single(),
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
            account_status: data.account_status || 'active'
        } as UserProfile;
    }

    async isUsernameAvailable(username: string): Promise<boolean> {
        if (!username) return false;
        const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username.toLowerCase())
            .single();

        // PGRST116 means no row found, which is what we want
        if (error && error.code === 'PGRST116') return true;
        return !data;
    }

    // --- COMMUNITY & FEED ---
    async getFeedContent(): Promise<any[]> {
        // Doğrudan ana posts tablosundan çekiyoruz (view ve eksik sütun bağımlılıklarını kökünden çözer)
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        const now = new Date();
        const validData = (data || []).filter(p => {
            if (p.status === 'scheduled') {
                if (!p.scheduled_at) return false;
                return new Date(p.scheduled_at) <= now;
            }
            return true;
        });

        const user = await this.getSessionUser();
        const currentUserIdOrName = user?.id || user?.user_metadata?.full_name || user?.user_metadata?.username || 'local-user';

        let globalPostLikesCache: Record<string, any> = {};
        if (typeof window !== 'undefined') {
            try {
                globalPostLikesCache = JSON.parse(localStorage.getItem('moffi_global_post_likes') || '{}');
            } catch {}
        }
        
        let userLikes: any[] = [];
        if (user) {
            const { data: likes } = await supabase
                .from('likes')
                .select('post_id')
                .eq('user_id', user.id);
            userLikes = likes || [];
        }

        const likedPostIds = new Set(userLikes.map(l => String(l.post_id)));

        if (error || validData.length === 0) {
            if (error) console.error('Error fetching live posts:', error);
            return [];
        }

        const userIds = Array.from(new Set(validData.map(p => p.user_id).filter(Boolean)));
        let profileMap: Record<string, any> = {};
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('*')
                .in('id', userIds);
            
            (profiles || []).forEach(pr => {
                profileMap[pr.id] = pr;
            });
        }

        const postIds = validData.map(p => p.id);
        const [likesRes, commentsRes] = await Promise.all([
            supabase.from('likes').select('post_id').in('post_id', postIds),
            supabase.from('comments').select('post_id').in('post_id', postIds)
        ]);

        const likeCountMap: Record<string, number> = {};
        const commentCountMap: Record<string, number> = {};

        (likesRes.data || []).forEach((l: any) => {
            likeCountMap[String(l.post_id)] = (likeCountMap[String(l.post_id)] || 0) + 1;
        });
        (commentsRes.data || []).forEach((c: any) => {
            commentCountMap[String(c.post_id)] = (commentCountMap[String(c.post_id)] || 0) + 1;
        });

        return validData.map(item => {
            const authorProfile = profileMap[item.user_id];

            const isLiked = likedPostIds.has(String(item.id));
            const likesCount = Math.max(item.likes_count || 0, likeCountMap[String(item.id)] || 0);

            return {
                id: item.id,
                user_id: item.user_id,
                author: authorProfile?.full_name || authorProfile?.username || 'Moffi Kullanıcısı',
                avatar: authorProfile?.avatar_url || undefined,
                image: item.media_url,
                media: item.media_url,
                media_url: item.media_url,
                desc: item.content,
                likes: likesCount,
                comments: item.comments_count || commentCountMap[String(item.id)] || 0,
                time: this.formatTimeAgo(item.created_at),
                isLiked: isLiked,
                isSaved: false,
                mood: item.mood,
                audio_url: item.audio_url,
                aura_settings: authorProfile?.aura_settings,
                allow_comments: item.allow_comments ?? true,
                comment_privacy: item.comment_privacy || 'everyone',
                trim_start: item.trim_start,
                trim_end: item.trim_end,
                is_video: item.is_video,
                account_status: authorProfile?.account_status || 'active'
            };
        }).filter(item => item.account_status !== 'deactivated');
    }

    // --- KULLANICININ KENDİ GÖNDERİLERİ (Profil Grid) ---
    async getUserPosts(userId: string): Promise<any[]> {
        // Simple query - no join, avoids FK naming issues
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
            if (error) console.error('getUserPosts error:', error);
            return [];
        }

        // Get like & comment counts in bulk
        const postIds = data.map(p => p.id);

        const [likesRes, commentsRes] = await Promise.all([
            supabase.from('likes').select('post_id').in('post_id', postIds),
            supabase.from('comments').select('post_id').in('post_id', postIds)
        ]);

        const likeMap: Record<string, number> = {};
        const commentMap: Record<string, number> = {};

        (likesRes.data || []).forEach((l: any) => {
            likeMap[l.post_id] = (likeMap[l.post_id] || 0) + 1;
        });
        (commentsRes.data || []).forEach((c: any) => {
            commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1;
        });

        return data.map(p => ({
            id: p.id,
            user_id: p.user_id,
            media: p.media_url,
            media_url: p.media_url,
            image: p.media_url,
            desc: p.content,
            caption: p.content,
            likes: likeMap[p.id] || 0,
            comments: commentMap[p.id] || 0,
            time: this.formatTimeAgo(p.created_at),
            created_at: p.created_at,
            isLiked: false,
            isSaved: false,
            mood: p.mood,
            audio_url: p.audio_url,
            trim_start: p.trim_start,
            trim_end: p.trim_end,
            is_video: p.is_video,
            type: (p.media_url?.includes('.mp4') || p.media_url?.includes('.mov') || p.media_url?.includes('.webm'))
                ? 'video' : 'image'
        }));
    }

    async addPost(post: any): Promise<any> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş yapmalısın kral!");

        // Fetch the user's profile for defaults and author info
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // Build insert payload including scheduled_at and status
        const payload: any = {
            user_id: user.id,
            content: post.caption || post.desc || '',
            media_url: post.media || post.image || null,
            audio_url: post.audio_url || post.audioUrl || null,
            allow_comments: post.allow_comments !== undefined ? post.allow_comments : (profile?.default_allow_comments ?? true),
            comment_privacy: post.comment_privacy || profile?.default_comment_privacy || 'everyone',
            trim_start: post.trim_start,
            trim_end: post.trim_end,
            is_video: post.is_video,
            mood: post.mood || null,
            scheduled_at: post.scheduled_at || null,
            status: post.status || 'published'
        };

        const { data, error } = await supabase
            .from('posts')
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
            author: profile?.full_name || profile?.username || user.email?.split('@')[0] || 'Moffi Kullanıcısı',
            avatar: profile?.avatar_url || '',
            image: data.media_url,        // For ImmersivePostCard
            media: data.media_url,        // Fallback field
            media_url: data.media_url,    // Another fallback
            desc: data.content,
            caption: data.content,
            likes: 0,
            comments: 0,
            time: 'Şimdi',
            isLiked: false,
            isSaved: false,
            allow_comments: data.allow_comments ?? true,
            comment_privacy: data.comment_privacy || 'everyone',
            trim_start: data.trim_start,
            trim_end: data.trim_end,
            is_video: data.is_video,
            mood: data.mood || null,
            audio_url: data.audio_url || null,
            scheduled_at: data.scheduled_at,
            status: data.status
        };
    }


    async reactToPost(postId: string | number, reaction: string): Promise<void> {
        const lockKey = `like-post-${postId}`;
        if (this.pendingActionLocks.has(lockKey)) return;
        this.pendingActionLocks.add(lockKey);

        try {
            const user = await this.getSessionUser();
            const currentUserIdOrName = user?.id || user?.user_metadata?.full_name || user?.user_metadata?.username || 'local-user';

            if (user) {
                try {
                    const { data: existings, error: selectError } = await supabase
                        .from('likes')
                        .select('id')
                        .eq('post_id', postId)
                        .eq('user_id', user.id);

                    if (selectError) {
                        console.error("Supabase likes select error:", selectError);
                        // RLS or schema issue prevents reading. We cannot safely toggle.
                        return;
                    }

                    if (existings && existings.length > 0) {
                        const { error: deleteError } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
                        if (!deleteError) {
                            const { data: pData } = await supabase.from('posts').select('likes_count').eq('id', postId).maybeSingle();
                            if (pData) {
                                await supabase.from('posts').update({ likes_count: Math.max(0, (pData.likes_count || 0) - existings.length) }).eq('id', postId);
                            }
                        }
                    } else {
                        const { error: insertError } = await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
                        if (!insertError) {
                            const { data: pData } = await supabase.from('posts').select('likes_count').eq('id', postId).maybeSingle();
                            if (pData) {
                                await supabase.from('posts').update({ likes_count: (pData.likes_count || 0) + 1 }).eq('id', postId);
                            }
                        } else {
                            console.error("Supabase likes insert error:", insertError);
                        }
                    }
                } catch (err) {
                    console.warn("Supabase live like interaction skipped for offline/mock ID:", err);
                }
            }

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('moffi_posts_changed'));
            }
        } finally {
            setTimeout(() => this.pendingActionLocks.delete(lockKey), 1000);
        }
    }

    async addComment(postId: string | number, text: string, parentCommentId?: string | number): Promise<void> {
        const lockKey = `comment-post-${postId}-${text}`;
        if (this.pendingActionLocks.has(lockKey)) return;
        this.pendingActionLocks.add(lockKey);

        try {
            const user = await this.getSessionUser();
            
            if (user) {
                try {
                    await supabase.from('comments').insert({
                        post_id: postId,
                        user_id: user.id,
                        content: text
                    });
                } catch (err) {
                    console.warn("Supabase comment insert failed, using fallback persistent cache:", err);
                }
            }

            if (typeof window !== 'undefined') {
                const cacheKey = `moffi_local_comments_${postId}`;
                const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');
                const newComment = {
                    id: `loc-${Date.now()}`,
                    post_id: postId,
                    user: user?.user_metadata?.full_name || user?.user_metadata?.username || 'Sen (Canlı)',
                    avatar: user?.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300",
                    text: text,
                    time: 'Şimdi',
                    user_id: user?.id || 'local-user',
                    likes: 0,
                    status: 'approved',
                    isLiked: false,
                    parent_id: parentCommentId
                };
                localStorage.setItem(cacheKey, JSON.stringify([...cached, newComment]));
                window.dispatchEvent(new Event('moffi_comments_changed'));
            }
        } finally {
            setTimeout(() => this.pendingActionLocks.delete(lockKey), 2000);
        }
    }

    async getPostComments(postId: string | number): Promise<any[]> {
        const user = await this.getSessionUser();
        
        let dbComments: any[] = [];
        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    profiles:user_id (full_name, avatar_url, username)
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                const likedCommentIds = new Set<string>();
                if (user && data.length > 0) {
                    const commentIds = data.map(c => c.id);
                    const { data: likesData } = await supabase
                        .from('comment_likes')
                        .select('comment_id')
                        .in('comment_id', commentIds)
                        .eq('user_id', user.id);
                        
                    if (likesData) {
                        likesData.forEach(l => likedCommentIds.add(l.comment_id));
                    }
                }

                dbComments = data.map(c => ({
                    id: c.id,
                    user: (c.profiles as any)?.full_name || (c.profiles as any)?.username || 'Moffi Kullanıcısı',
                    avatar: (c.profiles as any)?.avatar_url || '',
                    text: c.content,
                    time: this.formatTimeAgo(c.created_at),
                    user_id: c.user_id,
                    likes: c.likes_count || 0,
                    status: c.status || 'approved',
                    isLiked: likedCommentIds.has(c.id),
                    parent_id: null
                }));
            }
        } catch (err) {
            console.warn("Supabase fetch comments error:", err);
        }

        let localComments: any[] = [];
        if (typeof window !== 'undefined') {
            const cacheKey = `moffi_local_comments_${postId}`;
            localComments = JSON.parse(localStorage.getItem(cacheKey) || '[]');
        }

        const combinedMap = new Map<string | number, any>();
        
        dbComments.forEach(c => combinedMap.set(String(c.id), { ...c, replies: [] }));
        
        localComments.forEach(c => {
            if (!combinedMap.has(String(c.id))) {
                combinedMap.set(String(c.id), { ...c, replies: [] });
            }
        });

        const allComments = Array.from(combinedMap.values());

        if (allComments.length === 0) {
            const initialMock = {
                id: `init-${postId}`,
                user: 'Milo & Luna',
                avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400',
                text: 'Harika bir paylaşım! 🐾 İlk yorumu biz bırakalım.',
                time: '2 saat önce',
                user_id: 'user-milo',
                likes: 5,
                status: 'approved',
                isLiked: false,
                replies: []
            };
            allComments.push(initialMock);
            if (typeof window !== 'undefined') {
                localStorage.setItem(`moffi_local_comments_${postId}`, JSON.stringify([initialMock]));
            }
        }

        const finalComments = allComments.map(c => ({
            ...c,
            replies: []
        }));

        const treeMap = new Map<string, any>();
        finalComments.forEach(c => treeMap.set(String(c.id), c));

        const topLevel: any[] = [];
        finalComments.forEach(c => {
            const node = treeMap.get(String(c.id));
            if (c.parent_id && treeMap.has(String(c.parent_id))) {
                treeMap.get(String(c.parent_id)).replies.push(node);
            } else {
                topLevel.push(node);
            }
        });

        return topLevel;
    }

    async editComment(commentId: string | number, content: string): Promise<void> {
        try {
            await supabase.from('comments').update({ content }).eq('id', commentId);
        } catch {}

        if (typeof window !== 'undefined') {
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
                        let modified = false;
                        const nextItems = items.map((c: any) => {
                            if (String(c.id) === String(commentId)) {
                                modified = true;
                                return { ...c, text: content };
                            }
                            return c;
                        });
                        if (modified) {
                            localStorage.setItem(key, JSON.stringify(nextItems));
                            break;
                        }
                    } catch {}
                }
            }
        }
    }

    async deleteComment(commentId: string | number): Promise<void> {
        try {
            await supabase.from('comments').delete().eq('id', commentId);
        } catch {}

        if (typeof window !== 'undefined') {
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
    }

    async toggleCommentLike(commentId: string | number): Promise<void> {
        const lockKey = `like-comment-${commentId}`;
        if (this.pendingActionLocks.has(lockKey)) return;
        this.pendingActionLocks.add(lockKey);

        try {
            const user = await this.getSessionUser();
            if (user) {
                try {
                    const { data: existings, error: selectError } = await supabase
                        .from('comment_likes')
                        .select('id')
                        .eq('comment_id', commentId)
                        .eq('user_id', user.id);

                    if (selectError) {
                        console.error("Supabase comment_likes select error:", selectError);
                        return;
                    }

                    if (existings && existings.length > 0) {
                        const { error: deleteError } = await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
                        if (!deleteError) {
                            const { data } = await supabase.from('comments').select('likes_count').eq('id', commentId).maybeSingle();
                            await supabase.from('comments').update({ likes_count: Math.max(0, (data?.likes_count || 0) - existings.length) }).eq('id', commentId);
                        }
                    } else {
                        const { error: insertError } = await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
                        if (!insertError) {
                            const { data } = await supabase.from('comments').select('likes_count').eq('id', commentId).maybeSingle();
                            await supabase.from('comments').update({ likes_count: (data?.likes_count || 0) + 1 }).eq('id', commentId);
                        } else {
                            console.error("Supabase comment_likes insert error:", insertError);
                        }
                    }
                } catch {}
            }

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('moffi_comments_changed'));
            }
        } finally {
            setTimeout(() => this.pendingActionLocks.delete(lockKey), 1000);
        }
    }

    // --- MAP & RADAR (Community) ---
    async getLostPets(): Promise<LostPet[]> {
        const { data, error } = await supabase
            .from('lost_pets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching lost pets:', error);
            return [];
        }

        // Get unique user IDs and pet IDs
        const userIds = Array.from(new Set(data.map(item => item.user_id).filter(Boolean)));
        const petIds = Array.from(new Set(data.map(item => item.pet_id).filter(Boolean)));

        let profilesMap: Record<string, any> = {};
        let petsMap: Record<string, any> = {};

        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .in('id', userIds);
            if (profiles) {
                profiles.forEach(p => {
                    profilesMap[p.id] = p;
                });
            }
        }

        if (petIds.length > 0) {
            const { data: pets } = await supabase
                .from('pets')
                .select('id, breed, age, gender, size, health_notes, character, sos_settings')
                .in('id', petIds);
            if (pets) {
                pets.forEach(p => {
                    petsMap[p.id] = p;
                });
            }
        }

        return data.map(item => {
            const petInfo = item.pet_id ? petsMap[item.pet_id] : null;
            const profileInfo = item.user_id ? profilesMap[item.user_id] : null;
            
            // Extract reward info
            const hasReward = item.reward_enabled || petInfo?.sos_settings?.reward_enabled || false;
            let rewardText = undefined;
            if (hasReward) {
                const amount = item.reward_amount || petInfo?.sos_settings?.reward_amount;
                if (amount) {
                    rewardText = `${amount} TL`;
                }
            }

            return {
                id: item.id,
                pet_id: item.pet_id || undefined,
                name: item.pet_name,
                img: item.img_url || petInfo?.avatar_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400",
                image_url: item.img_url || petInfo?.avatar_url,
                location: item.location_text || 'Moffi Radar',
                last_seen_location: item.location_text,
                reward_enabled: hasReward,
                reward: rewardText,
                dist: '0 km',
                time: this.formatTimeAgo(item.created_at),
                description: item.description || petInfo?.sos_settings?.finder_message || '',
                type: item.pet_type || petInfo?.type || 'dog',
                user_id: item.user_id,
                latitude: item.latitude,
                longitude: item.longitude,
                author_name: profileInfo?.username || 'Moffi Kullanıcısı',
                author_avatar: profileInfo?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id || 'system'}`,
                breed: petInfo?.breed || item.pet_type || 'dog',
                age: petInfo?.age,
                gender: petInfo?.gender,
                size: petInfo?.size,
                health_notes: petInfo?.health_notes,
                personality: petInfo?.character,
                critical_health_note: petInfo?.sos_settings?.critical_health_note || petInfo?.health_notes || ''
            } as any;
        });
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
                pet_type: data.type,
                latitude: data.latitude,
                longitude: data.longitude,
                pet_id: data.pet_id || null
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
            time: 'Şimdi',
            user_id: inserted.user_id,
            latitude: inserted.latitude,
            longitude: inserted.longitude
        } as LostPet;
    }

    async addLostPetSighting(data: { lost_pet_id: string; description: string; latitude: number; longitude: number; img_url?: string }): Promise<LostPetSighting> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");

        const { data: inserted, error } = await supabase
            .from('pet_sightings')
            .insert({
                lost_pet_id: data.lost_pet_id,
                reporter_id: user.id,
                description: data.description,
                latitude: data.latitude,
                longitude: data.longitude,
                img_url: data.img_url
            })
            .select()
            .single();

        if (error) throw error;

        // Fetch user profile info to attach to output
        const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user.id)
            .single();

        return {
            id: inserted.id,
            lost_pet_id: inserted.lost_pet_id,
            reporter_id: inserted.reporter_id,
            reporter_name: profile?.username || 'Moffi Kullanıcısı',
            reporter_avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
            description: inserted.description,
            latitude: inserted.latitude,
            longitude: inserted.longitude,
            img_url: inserted.img_url,
            created_at: inserted.created_at
        };
    }

    async getLostPetSightings(lostPetId: string): Promise<LostPetSighting[]> {
        const { data, error } = await supabase
            .from('pet_sightings')
            .select('*')
            .eq('lost_pet_id', lostPetId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching sightings:', error);
            return [];
        }

        // Fetch profiles for the reporters in parallel
        const results = await Promise.all(data.map(async (item) => {
            let username = 'Moffi Kullanıcısı';
            let avatarUrl = '';

            if (item.reporter_id) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username, avatar_url')
                    .eq('id', item.reporter_id)
                    .single();
                if (profile) {
                    username = profile.username || username;
                    avatarUrl = profile.avatar_url || avatarUrl;
                }
            }

            return {
                id: item.id,
                lost_pet_id: item.lost_pet_id,
                reporter_id: item.reporter_id,
                reporter_name: username,
                reporter_avatar: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.reporter_id || item.id}`,
                description: item.description,
                latitude: item.latitude,
                longitude: item.longitude,
                img_url: item.img_url,
                created_at: this.formatTimeAgo(item.created_at)
            } as LostPetSighting;
        }));

        return results;
    }

    async deleteLostPet(id: string | number): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");
        
        // 1. Delete associated conversations (will cascade-delete messages in DB)
        await supabase
            .from('conversations')
            .delete()
            .eq('associated_ad_id', id);

        // 2. Delete the lost pet record itself
        const { error } = await supabase
            .from('lost_pets')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
            
        if (error) throw error;
    }

    async getAdoptions(): Promise<AdoptionPet[]> {
        const { data, error } = await supabase
            .from('adoption_pets')
            .select('*')
            .eq('status', 'available')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching adoptions:', error);
            return [];
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
            phone: item.phone || '',
            user_id: item.user_id
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
            phone: '',
            user_id: inserted.user_id
        } as AdoptionPet;
    }

    async deleteAdoption(id: string | number): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");
        
        const { error } = await supabase
            .from('adoption_pets')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
            
        if (error) throw error;
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
            health_notes: item.health_notes,
            personality: item.character,
            is_lost: item.is_lost,
            sos_settings: item.sos_settings,
            // Birthday & color — direkt DB kolonu yoksa sos_settings'ten oku
            birthday: item.birth_date || item.sos_settings?.birthday || '',
            color: item.color || item.sos_settings?.color || '',
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
            breed: pet.breed,
            age: pet.age,
            gender: pet.gender,
            avatar_url: pet.image || pet.avatar,
            is_neutered: (pet as any).is_neutered || false,
            size: (pet as any).size,
            health_notes: (pet as any).health_notes,
            character: (pet as any).character || (pet as any).personality,
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
            health_notes: (updates as any).health_notes || (updates as any).healthNotes,
            character: (updates as any).character || (updates as any).personality,
            is_lost: updates.is_lost,
            sos_settings: updates.sos_settings,
            weight: numericWeight,
            // target alanları — camelCase formdan snake_case'e normalize et
            activity_target: (updates as any).activity_target ?? (updates as any).activityTarget,
            water_target: (updates as any).water_target ?? (updates as any).waterTarget,
            food_target: (updates as any).food_target ?? (updates as any).foodTarget,
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

    getNotifications = async () => {
        const user = await this.getSessionUser();
        if (!user) return [];
        
        // Fetch notifications
        const { data: notifs } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);
            
        if (!notifs || notifs.length === 0) return [];

        // Extract unique actor IDs
        const actorIds = [...new Set(notifs.map(n => n.actor_id).filter(Boolean))];
        
        // Fetch profiles for those actors
        let profilesMap: Record<string, any> = {};
        if (actorIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url')
                .in('id', actorIds);
                
            if (profiles) {
                profiles.forEach(p => {
                    profilesMap[p.id] = p;
                });
            }
        }
            
        return notifs.map((n: any) => {
            const actor = profilesMap[n.actor_id] || null;
            const fallbackUser = n.title ? n.title.split(' ')[0] : 'Biri';
            const userName = actor?.full_name || actor?.username || fallbackUser;
            
            let displayUser = userName;
            let displayText = n.content || n.title || 'Sizinle etkileşime geçti.';
            
            // If n.title was used for fallbackUser, it likely already contains the name.
            // NotificationsDrawer handles cleaning the name from the text.
            
            return {
                id: n.id,
                user: displayUser,
                avatar: actor?.avatar_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300",
                text: displayText,
                time: this.formatTimeAgo(n.created_at),
                read: n.is_read || n.read,
                type: n.type
            };
        });
    };

    addInboxMessage = async (m: any) => {
        await supabase.from('messages').insert(m);
    };

    async deletePost(postId: string): Promise<void> {
        const user = await this.getSessionUser();
        if (user) {
            try {
                await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
            } catch {}
        }

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

    async updatePost(postId: string, updates: any): Promise<void> {
        const user = await this.getSessionUser();
        if (user) {
            try {
                await supabase.from('posts').update(updates).eq('id', postId).eq('user_id', user.id);
            } catch {}
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
            isPrimeOnly: p.is_prime_only,
            inStock: p.stock > 0,
            stockCount: p.stock,
            rating: Number(p.rating) || 4.5,
            reviews: Number(p.review_count) || 0,
            isVetApproved: p.is_vet_approved || false,
            tag: p.tag || undefined
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

        const saved = typeof window !== 'undefined' ? localStorage.getItem('moffi_product_subscriptions') : null;
        let localIds: string[] = [];
        if (saved) {
            try { localIds = JSON.parse(saved); } catch (e) {}
        }

        const totalAmount = orderData.totalPrice !== undefined 
            ? orderData.totalPrice 
            : cartWithProducts.reduce((sum, item) => {
                const isSubscribed = localIds.includes(item.product.id);
                const price = isSubscribed ? item.product.price * 0.90 : item.product.price;
                return sum + (price * item.quantity);
            }, 0);

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
        const orderItems = cartWithProducts.map(item => {
            const isSubscribed = localIds.includes(item.product.id);
            const price = isSubscribed ? item.product.price * 0.90 : item.product.price;
            return {
                order_id: order.id,
                product_id: item.product.id,
                quantity: item.quantity,
                price_at_purchase: price
            };
        });

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
                    isPrimeOnly: item.product.is_prime_only,
                    inStock: true,
                    rating: Number(item.product.rating) || 4.5,
                    reviews: Number(item.product.review_count) || 0
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
            inStock: true,
            rating: 5.0,
            reviews: 0
        }));
    }

    async togglePetSosStatus(petId: string, status: 'safe' | 'lost'): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        
        // 1. Update pets table status
        const { error } = await supabase
            .from('pets')
            .update({ is_lost: status === 'lost' })
            .eq('id', petId)
            .eq('owner_id', user.id);
        if (error) throw error;

        // 2. Synchronize with lost_pets table (Community Alerts)
        if (status === 'lost') {
            const { data: pet, error: petError } = await supabase
                .from('pets')
                .select('*')
                .eq('id', petId)
                .single();
            
            if (petError || !pet) return;

            const shouldPost = pet.sos_settings?.auto_post_sos ?? true;
            if (shouldPost) {
                const { data: existing } = await supabase
                    .from('lost_pets')
                    .select('id')
                    .eq('pet_id', petId)
                    .maybeSingle();

                const payload = {
                    user_id: user.id,
                    pet_id: petId,
                    pet_name: pet.name,
                    img_url: pet.avatar_url || '',
                    location_text: pet.sos_settings?.last_seen_location || 'Moffi Güvenli Bölge',
                    description: pet.sos_settings?.finder_message || 'Moffi SOS Sistemi tarafından otomatik oluşturulmuş acil durum ilanı.',
                    pet_type: pet.type?.includes('🐶') || pet.type?.toLowerCase().includes('dog') || pet.type?.toLowerCase().includes('köpek') ? 'dog' : 'cat',
                    reward_enabled: pet.sos_settings?.reward_enabled || false,
                    reward_amount: pet.sos_settings?.reward_amount ? String(pet.sos_settings.reward_amount) : null,
                    status: 'lost',
                    latitude: pet.sos_settings?.latitude || 40.9850,
                    longitude: pet.sos_settings?.longitude || 29.0300
                };

                if (existing) {
                    await supabase
                        .from('lost_pets')
                        .update(payload)
                        .eq('id', existing.id);
                } else {
                    await supabase
                        .from('lost_pets')
                        .insert(payload);
                }
            }
        } else {
            // Delete from lost_pets table if marked safe, and clean up temporary conversations
            const { data: existingLostPet } = await supabase
                .from('lost_pets')
                .select('id')
                .eq('pet_id', petId)
                .maybeSingle();

            if (existingLostPet) {
                // Delete associated conversations (will cascade-delete messages in DB)
                await supabase
                    .from('conversations')
                    .delete()
                    .eq('associated_ad_id', existingLostPet.id);
            }

            await supabase
                .from('lost_pets')
                .delete()
                .eq('pet_id', petId);
        }
    }

    async updatePetSosSettings(petId: string, settings: any): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error('Giriş gerekli');
        
        // 1. Update pets table settings
        const { error } = await supabase
            .from('pets')
            .update({ sos_settings: settings })
            .eq('id', petId)
            .eq('owner_id', user.id);
        if (error) throw error;

        // 2. Sync with lost_pets if pet is currently marked as lost
        const { data: pet } = await supabase
            .from('pets')
            .select('is_lost, name, avatar_url, type')
            .eq('id', petId)
            .single();

        if (pet && pet.is_lost) {
            const { data: existing } = await supabase
                .from('lost_pets')
                .select('id')
                .eq('pet_id', petId)
                .maybeSingle();

            const payload = {
                user_id: user.id,
                pet_id: petId,
                pet_name: pet.name,
                img_url: pet.avatar_url || '',
                location_text: settings.last_seen_location || 'Moffi Güvenli Bölge',
                description: settings.finder_message || 'Moffi SOS Sistemi tarafından otomatik oluşturulmuş acil durum ilanı.',
                pet_type: pet.type?.includes('🐶') || pet.type?.toLowerCase().includes('dog') || pet.type?.toLowerCase().includes('köpek') ? 'dog' : 'cat',
                reward_enabled: settings.reward_enabled || false,
                reward_amount: settings.reward_amount ? String(settings.reward_amount) : null,
                status: 'lost',
                latitude: settings.latitude || 40.9850,
                longitude: settings.longitude || 29.0300
            };

            if (existing) {
                await supabase
                    .from('lost_pets')
                    .update(payload)
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('lost_pets')
                    .insert(payload);
            }
        }
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

    async addPetMedication(petIdOrMed: any, med?: any): Promise<any> {
        const finalMed = med ? { ...med, petId: petIdOrMed } : petIdOrMed;
        const { data, error } = await supabase
            .from('medications')
            .insert({
                pet_id: finalMed.petId || finalMed.pet_id,
                name: finalMed.name,
                dosage: finalMed.dosage,
                frequency: finalMed.frequency,
                instructions: finalMed.instructions,
                start_date: finalMed.startDate || finalMed.start_date || new Date().toISOString()
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

    async addPetVaccine(petIdOrRecord: any, record?: any): Promise<any> {
        const finalRecord = record ? { ...record, petId: petIdOrRecord } : petIdOrRecord;
        const dbPayload = {
            pet_id: finalRecord.petId || finalRecord.pet_id,
            name: finalRecord.name || finalRecord.vaccineId || finalRecord.vaccine_id,
            status: finalRecord.status || 'completed',
            next_due_date: finalRecord.dueDate || finalRecord.next_due_date || finalRecord.nextDueDate || new Date().toISOString(),
            date_administered: finalRecord.dateAdministered || finalRecord.date_administered || new Date().toISOString(),
            vet_name: finalRecord.vetName || finalRecord.vet_name || ''
        };

        const { data, error } = await supabase
            .from('vaccines')
            .insert(dbPayload)
            .select()
            .single();

        if (error) throw error;
        
        return {
            id: data.id,
            petId: data.pet_id,
            vaccineId: data.name,
            status: data.status,
            dueDate: data.next_due_date,
            dateAdministered: data.date_administered,
            vetName: data.vet_name,
            batchNumber: 'TR-' + Math.random().toString(36).substring(2, 8).toUpperCase()
        };
    }

    async recordMedicationDose(medId: string): Promise<void> {
        const { error } = await supabase
            .from('medications')
            .update({ last_log: new Date().toISOString() })
            .eq('id', medId);
            
        if (error) throw error;
    }

    async getNearbyClinics(lat: number, lng: number, radiusKm: number = 10): Promise<any[]> {
        // 1. Try to fetch optimized results via database-side Haversine RPC
        try {
            const { data: rpcData, error: rpcError } = await supabase
                .rpc('get_nearby_clinics', {
                    user_lat: lat,
                    user_lng: lng,
                    radius_km: radiusKm
                });

            if (!rpcError && rpcData && rpcData.length > 0) {
                return rpcData.map((c: any) => ({
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
                    phone: c.phone,
                    distance: c.distance_km ? `${c.distance_km.toFixed(1)} km` : '1.0 km'
                }));
            }
            if (rpcError) {
                console.warn('get_nearby_clinics RPC not found or failed, falling back to client-side filter:', rpcError);
            }
        } catch (e) {
            console.warn('Failed to execute clinic distance RPC, using client fallback:', e);
        }

        // 2. Client-side fallback: Fetch all clinics and filter using Haversine approximation
        const { data, error } = await supabase
            .from('clinics')
            .select('*')
            .order('rating', { ascending: false });

        if (error || !data) return this.mockApi.getNearbyClinics(lat, lng, radiusKm);

        return data.map(clinic => {
            if (!clinic.lat || !clinic.lng) return { ...clinic, calculated_distance: 1.0 };
            const dLat = (clinic.lat - lat) * (Math.PI / 180);
            const dLng = (clinic.lng - lng) * (Math.PI / 180);
            const a = Math.sin(dLat/2)**2 + Math.cos(lat * Math.PI/180) * Math.cos(clinic.lat * Math.PI/180) * Math.sin(dLng/2)**2;
            const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return { ...clinic, calculated_distance: distKm };
        }).filter(c => c.calculated_distance <= radiusKm)
        .map(c => ({
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
            phone: c.phone,
            distance: `${c.calculated_distance.toFixed(1)} km`
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
                appointment_date: dto.appointmentDate || dto.date,
                reason: dto.notes || dto.reason || '',
                status: dto.status || 'pending',
                payment_id: dto.paymentId || null,
                payment_amount: dto.paymentAmount || null,
                payment_status: dto.paymentStatus || null,
                shared_passport: dto.sharedPassport || null
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
                pet:pets(*)
            `)
            .eq('user_id', user.id)
            .order('appointment_date', { ascending: true });

        if (error) {
            console.error("Error in getAppointments:", error);
            return [];
        }
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

    async getClinicAppointments(clinicId: string): Promise<any[]> {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clinicId);
        
        let query = supabase
            .from('appointments')
            .select(`
                *,
                pet:pets(*),
                user:profiles(full_name, username, avatar_url, phone)
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

    async updateAppointmentStatus(appointmentId: string, status: string): Promise<void> {
        const { error } = await supabase
            .from('appointments')
            .update({ status: status })
            .eq('id', appointmentId);

        if (error) throw error;
    }

    async getClinicSettings(clinicId: string): Promise<any> {
        const { data, error } = await supabase
            .from('clinic_settings')
            .select('*')
            .eq('clinic_id', clinicId)
            .maybeSingle();

        if (error) {
            console.error("Error fetching clinic settings:", error);
            return null;
        }
        if (!data) return null;

        return {
            workingDays: data.working_days,
            startTime: data.start_time,
            endTime: data.end_time,
            lunchStart: data.lunch_start,
            lunchEnd: data.lunch_end,
            slotDuration: data.slot_duration
        };
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

        // Calculate streak (consecutive days) from completed walk sessions
        let currentStreak = 0;
        let bestStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let d = 0; d < 365; d++) {
            const checkDate = new Date(today.getTime() - d * 86400000);
            const year = checkDate.getFullYear();
            const month = String(checkDate.getMonth() + 1).padStart(2, '0');
            const day = String(checkDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const hasWalk = data.some(w => w.ended_at && w.ended_at.startsWith(dateStr));

            if (hasWalk) {
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else if (d > 0) {
                break; // Streak broken
            }
        }

        return {
            totalWalks: data.length,
            totalDistanceKm: Math.round(totalDistance / 100) / 10,
            totalDurationMinutes: Math.round(totalDuration / 60),
            totalCalories: Math.round(totalCalories),
            totalSteps,
            avgDistanceKm: data.length ? Math.round(totalDistance / data.length / 100) / 10 : 0,
            currentStreak,
            bestStreak
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

        supabase.rpc('increment_followers', { target_user_id: targetId }).then(() => {}, () => {});

        // Dynamic Notification creation
        try {
            const senderProfile = await this.getUserProfile(user.id);
            const senderName = senderProfile?.username || user.email?.split('@')[0] || 'Bir kullanıcı';
            await supabase.from('notifications').insert({
                user_id: targetId,
                type: 'follow',
                title: 'Yeni Takipçi 🐾',
                content: `@${senderName} seni takip etmeye başladı!`,
                is_read: false,
                meta: {
                    sender_id: user.id,
                    sender_name: senderProfile?.name || senderName,
                    sender_avatar: senderProfile?.avatar || null
                }
            });
        } catch (notifErr) {
            console.error("Follow notification error:", notifErr);
        }
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
            .select('follower_id')
            .eq('follower_id', user.id)
            .eq('following_id', targetId)
            .maybeSingle();

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

    async getFollowers(userId: string): Promise<UserProfile[]> {
        const { data: followsData, error: followsError } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', userId);

        if (followsError || !followsData || followsData.length === 0) return [];

        const followerIds = followsData.map(f => f.follower_id);

        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
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
            .from('profiles')
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

    async sendChatMessage(otherUserId: string, content: string, associatedAdId?: string): Promise<void> {
        const user = await this.getSessionUser();
        if (!user) throw new Error("Giriş gerekli");

        // Find or create conversation
        let conversationId: string;

        const { data: existing } = await supabase
            .from('conversations')
            .select('id, associated_ad_id')
            .or(
                `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
            )
            .maybeSingle();

        if (existing) {
            conversationId = existing.id;
            // Update association if not set yet
            if (associatedAdId && !existing.associated_ad_id) {
                await supabase
                    .from('conversations')
                    .update({ associated_ad_id: associatedAdId })
                    .eq('id', conversationId);
            }
        } else {
            // Create new conversation
            const { data: newConv, error: convErr } = await supabase
                .from('conversations')
                .insert({
                    participant_1: user.id,
                    participant_2: otherUserId,
                    associated_ad_id: associatedAdId || null
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
            supabase.from('profiles').select('*').or(`username.ilike.%${query}%,full_name.ilike.%${query}%`).limit(10),
            supabase.from('posts').select('*').ilike('content', `%${query}%`).limit(10),
            supabase.from('pets').select('*').or(`name.ilike.%${query}%,pet_id.ilike.%${query}%`).limit(10)
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
                pet_id: p.pet_id,
                image: p.image_url,
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
                tag: product.tag || null
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
            isPrimeOnly: data.is_prime_only,
            inStock: data.stock > 0,
            stockCount: data.stock,
            rating: Number(data.rating) || 5.0,
            reviews: Number(data.review_count) || 0,
            isVetApproved: data.is_vet_approved || false,
            tag: data.tag || undefined
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
            isPrimeOnly: data.is_prime_only,
            inStock: data.stock > 0,
            stockCount: data.stock,
            rating: Number(data.rating) || 5.0,
            reviews: Number(data.review_count) || 0,
            isVetApproved: data.is_vet_approved || false,
            tag: data.tag || undefined
        };
    }

    async deleteProduct(id: string): Promise<void> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
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
                    isPrimeOnly: item.product.is_prime_only,
                    inStock: item.product.stock > 0
                } : {
                    id: '',
                    name: 'Silinmiş Ürün',
                    price: Number(item.price_at_purchase),
                    image: '❓',
                    category: 'food',
                    isPrimeOnly: false,
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
        if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}sa`;
        return `${Math.floor(diff / 86400)}g`;
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
                health_notes: item.health_notes,
                personality: item.character,
                is_lost: item.is_lost,
                sos_settings: item.sos_settings,
                birthday: item.birth_date || item.sos_settings?.birthday || '',
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
            const allPets = await this.getAllPetsAdmin();
            if (allPets.length === 0) return [];

            // 2. Fetch completed walk sessions
            const { data: sessions, error } = await supabase
                .from('walk_sessions')
                .select('pet_id, steps, distance_meters')
                .eq('status', 'completed');

            // 3. Aggregate activity counts per pet_id
            const activityMap: Record<string, { steps: number; distance: number }> = {};
            if (!error && sessions) {
                sessions.forEach((s: any) => {
                    if (!s.pet_id) return;
                    if (!activityMap[s.pet_id]) {
                        activityMap[s.pet_id] = { steps: 0, distance: 0 };
                    }
                    activityMap[s.pet_id].steps += s.steps || 0;
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
                .select('*, pets(*)')
                .eq('date', dateString);

            if (error) throw error;

            const results: any[] = [];
            const candidates = await this.getDailyStarCandidates();

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
                        pet: found.pets ? {
                            name: found.pets.name,
                            image: found.pets.avatar_url,
                            breed: found.pets.breed
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
                            .select('*, pets(*)')
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
                                pet: insertedData.pets ? {
                                    name: insertedData.pets.name,
                                    image: insertedData.pets.avatar_url,
                                    breed: insertedData.pets.breed
                                } : null
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
    async getVetAdvices(): Promise<any[]> {
        try {
            const { data: advices, error: adviceError } = await supabase
                .from('vet_advices')
                .select('*')
                .order('created_at', { ascending: false });

            if (adviceError) throw adviceError;

            // Fetch all clinics to do a safe client-side join (avoiding text vs uuid type casting join errors)
            const { data: clinics, error: clinicError } = await supabase
                .from('clinics')
                .select('*');

            const clinicsList = clinics || [];

            // Map database rows to expected model
            return (advices || []).map(item => {
                if (item.clinic_id) {
                    const matchedClinic = clinicsList.find(c => String(c.id) === String(item.clinic_id));
                    if (matchedClinic) {
                        return {
                            id: item.id,
                            clinic_id: item.clinic_id,
                            content: item.content,
                            badge: item.badge,
                            media_url: item.media_url,
                            created_at: item.created_at,
                            clinic: {
                                name: matchedClinic.name,
                                imageUrl: matchedClinic.image_url || '/images/moffi_pet_trio.png'
                            }
                        };
                    } else if (item.clinic_id === 'biz_vet1') {
                        return {
                            id: item.id,
                            clinic_id: item.clinic_id,
                            content: item.content,
                            badge: item.badge,
                            media_url: item.media_url,
                            created_at: item.created_at,
                            clinic: {
                                name: 'Moffi Vet Polikliniği',
                                imageUrl: '/images/moffi_pet_trio.png'
                            }
                        };
                    }
                }
                return {
                    id: item.id,
                    clinic_id: null,
                    content: item.content,
                    badge: item.badge,
                    media_url: item.media_url,
                    created_at: item.created_at
                };
            });
        } catch (err) {
            console.warn("Supabase getVetAdvices failed, falling back to mockApi:", err);
            return this.mockApi.getVetAdvices();
        }
    }

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

    // --- LEADERBOARD ---
    async getLeaderboard(role: 'user' | 'business', limit: number = 50): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, coin_balance, role, pet_name')
                .eq('role', role)
                .order('coin_balance', { ascending: false, nullsFirst: false })
                .limit(limit);

            if (error) throw error;

            return (data || []).map(p => ({
                id: p.id,
                name: p.full_name || 'Gizli Kullanıcı',
                avatar: p.avatar_url,
                score: p.coin_balance || 0,
                country: 'TR',
                pet: p.pet_name || (role === 'business' ? 'İşletme' : 'Moffi'),
                change: 0 // Mocking daily change for now
            }));
        } catch (err) {
            console.error("Supabase getLeaderboard failed:", err);
            return [];
        }
    }

    async getUserRank(userId: string): Promise<number> {
        try {
            // Get user's score first
            const { data: userProfile, error: userError } = await supabase
                .from('profiles')
                .select('coin_balance')
                .eq('id', userId)
                .single();

            if (userError || !userProfile) return 0;
            const score = userProfile.coin_balance || 0;

            // Count how many users have a STRICTLY higher score
            const { count, error } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .gt('coin_balance', score);

            if (error) throw error;

            // Their rank is (number of people with higher score) + 1
            return (count || 0) + 1;
        } catch (err) {
            console.error("Supabase getUserRank failed:", err);
            return 0;
        }
    }
}
