// Keşfet (sosyal) katmanının tek okuma/yazma yolu (design-reference/community-final/kesfet-reference.jpg).
// Akış, arama ve profil özetleri sunucu fonksiyonlarından; yazma kuralları (etiket, konum yuvarlama, sayaçlar,
// yorum izni, engelleme) veritabanında.

import { supabase } from '@/lib/supabase';
import { apiService } from '@/services/apiService';

export type CommentPrivacy = 'everyone' | 'followers' | 'nobody';
export type PostTopic = 'daily' | 'funny' | 'training' | 'health' | 'other';
export type ExploreFilter = 'all' | 'cat' | 'dog' | 'young' | 'funny' | 'training' | 'nearby' | 'other';

export interface TaggedPet { id: string; name: string; breed: string | null; type: string | null; avatar: string | null }

export interface SocialPost {
    id: string;
    userId: string;
    content: string;
    media: string[];
    isVideo: boolean;
    /** Videoya uygulanan efekt (fotoğrafta efekt dosyaya işlenmiştir). */
    mediaFilter: string | null;
    pets: TaggedPet[];
    locationText: string | null;
    topic: PostTopic | null;
    commentPrivacy: CommentPrivacy;
    likes: number;
    comments: number;
    /** Pati tepkisi (beğeniden ayrı, Moffi'ye özgü). */
    paws: number;
    createdAt: string;
    editedAt: string | null;
    author: { name: string; username: string | null; avatar: string | null; isBusiness: boolean };
    isLiked: boolean;
    isPawed: boolean;
    isSaved: boolean;
    isMine: boolean;
    followsAuthor: boolean;
}

export interface GridPost { id: string; media: string | null; isVideo: boolean; mediaFilter: string | null; mediaCount: number; likes: number; comments: number }

export interface SocialComment {
    id: string;
    postId: string;
    userId: string;
    parentId: string | null;
    content: string;
    status: string;
    likes: number;
    isLiked: boolean;
    createdAt: string;
    editedAt: string | null;
    author: { name: string; username: string | null; avatar: string | null };
    replies: SocialComment[];
}

export interface PersonCard { id: string; name: string; username: string | null; avatar: string | null; isBusiness: boolean }

export interface PostInput {
    content: string;
    media: string[];
    isVideo?: boolean;
    mediaFilter?: string | null;
    taggedPetIds: string[];
    locationText: string | null;
    lat: number | null;
    lng: number | null;
    topic: PostTopic | null;
    showOnProfile: boolean;
    commentPrivacy: CommentPrivacy;
}

/** Haftanın teması: yönetici girer; etiketle ilk paylaşımda sunucu bir kez puan verir. */
export interface WeeklyTheme {
    id: string; hashtag: string; title: string; description: string | null;
    startsOn: string; endsOn: string; rewardPoints: number;
    participantCount?: number; joined?: boolean;
}
export type WeeklyThemeInput = Omit<WeeklyTheme, 'id' | 'participantCount' | 'joined'>;

// --- Sunucudan gelen satırların biçimleri ---
interface ThemeRow { id: string; hashtag: string; title: string; description: string | null; starts_on: string; ends_on: string; reward_points: number | null; participant_count?: number | null; joined?: boolean | null }
interface PostRow {
    id: string; user_id: string; content: string | null; media_urls: string[] | null; is_video: boolean | null; media_filter: string | null;
    tagged_pets: TaggedPet[] | null; location_text: string | null; topic: PostTopic | null; comment_privacy: CommentPrivacy | null;
    likes_count: number | null; comments_count: number | null; created_at: string; edited_at: string | null;
    author_name: string | null; author_username: string | null; author_avatar: string | null; author_is_business: boolean | null;
    is_liked: boolean | null; is_saved: boolean | null; is_mine: boolean | null; follows_author: boolean | null;
}
interface GridRow { id: string; media_url: string | null; is_video: boolean | null; media_filter: string | null; media_count: number | null; likes_count: number | null; comments_count: number | null }
interface PawRow { post_id: string; paws_count: number | null; is_pawed: boolean | null }
interface CardRow { id: string; full_name: string | null; username: string | null; avatar_url: string | null; role: string | null; business_name: string | null }
interface CommentRow { id: string; post_id: string; user_id: string; parent_id: string | null; content: string; status: string; likes_count: number | null; created_at: string; edited_at: string | null }
interface StoryRow { id: string; user_id: string; image_url: string; caption: string | null; created_at: string; view_count: number | null }
/** KVKK veri paketi için kendi gönderilerin. */
export interface PostExportRow {
    id: string; content: string | null; media_urls: string[] | null; tagged_pet_ids: string[] | null; location_text: string | null; topic: string | null;
    comment_privacy: string | null; show_on_profile: boolean | null; likes_count: number | null; comments_count: number | null; created_at: string; edited_at: string | null;
}

const mapTheme = (r: ThemeRow): WeeklyTheme => ({
    id: r.id, hashtag: r.hashtag, title: r.title, description: r.description || null,
    startsOn: r.starts_on, endsOn: r.ends_on, rewardPoints: r.reward_points ?? 0,
    participantCount: r.participant_count ?? undefined, joined: r.joined ?? undefined,
});

export interface UserStory { id: string; mediaUrl: string; caption: string | null; createdAt: string; viewCount: number; isViewed: boolean; isLiked: boolean }
export interface StoryGroup { userId: string; name: string; avatar: string | null; stories: UserStory[]; hasUnseen: boolean }

/** Gönderi ya da beğeni değişince (profil sayacı, akış yenileme) yayılır. */
export const POSTS_CHANGED_EVENT = 'moffi-posts-changed';

function fail(error: { message?: string } | null | undefined, fallback: string): never {
    throw new Error(error?.message || fallback);
}

const emit = (name: string, detail?: unknown) => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name, { detail }));
};

const mapPost = (r: PostRow): SocialPost => ({
    id: r.id, userId: r.user_id, content: r.content || '', media: (r.media_urls || []).filter(Boolean), isVideo: !!r.is_video, mediaFilter: r.media_filter || null,
    pets: Array.isArray(r.tagged_pets) ? r.tagged_pets : [],
    locationText: r.location_text, topic: r.topic, commentPrivacy: r.comment_privacy || 'everyone',
    likes: r.likes_count || 0, comments: r.comments_count || 0, paws: 0, createdAt: r.created_at, editedAt: r.edited_at,
    author: { name: r.author_name || 'Moffi üyesi', username: r.author_username, avatar: r.author_avatar, isBusiness: !!r.author_is_business },
    isLiked: !!r.is_liked, isPawed: false, isSaved: !!r.is_saved, isMine: !!r.is_mine, followsAuthor: !!r.follows_author,
});

const mapGrid = (r: GridRow): GridPost => ({
    id: r.id, media: r.media_url, isVideo: !!r.is_video, mediaFilter: r.media_filter || null, mediaCount: r.media_count || 1, likes: r.likes_count || 0, comments: r.comments_count || 0,
});

/** Pati sayısı ve benim pati bırakıp bırakmadığım tek sorguda eklenir. */
async function withPaws(posts: SocialPost[]): Promise<SocialPost[]> {
    if (!posts.length) return posts;
    const { data } = await supabase.rpc('post_paw_state', { p_ids: posts.map(p => p.id) });
    const byId = new Map<string, PawRow>(((data || []) as PawRow[]).map(r => [r.post_id, r]));
    return posts.map(p => { const r = byId.get(p.id); return r ? { ...p, paws: r.paws_count || 0, isPawed: !!r.is_pawed } : p; });
}

async function me() {
    const { data } = await supabase.auth.getUser();
    return data.user;
}

async function cards(ids: string[]) {
    const byId: Record<string, CardRow> = {};
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (!unique.length) return byId;
    const { data } = await supabase.from('profile_cards').select('id, full_name, username, avatar_url, role, business_name').in('id', unique);
    ((data || []) as CardRow[]).forEach(p => { byId[p.id] = p; });
    return byId;
}

/** Kendi klasöründeki görselleri depodan siler: silinen gönderi/hikâyenin fotoğrafı herkese açık adreste kalmasın. */
async function removeOwnFiles(bucket: 'posts' | 'stories', urls: string[], userId: string) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const paths = urls
        .map(u => (u && u.includes(marker) ? decodeURIComponent(u.split(marker)[1].split('?')[0]) : null))
        .filter((p): p is string => !!p && p.startsWith(`${userId}/`));
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
}

const personName = (p: Pick<CardRow, 'role' | 'business_name' | 'full_name' | 'username'> | null | undefined) => (p?.role === 'business' && p?.business_name) || p?.full_name || p?.username || 'Moffi üyesi';

export const socialService = {
    // --- Akış ve gönderiler ---------------------------------------------------------------------------------
    async feed(mode: 'following' | 'for_you', before?: string | null, limit = 12): Promise<SocialPost[]> {
        const { data, error } = await supabase.rpc('get_social_feed', { p_mode: mode, p_before: before || null, p_limit: limit });
        if (error) fail(error, 'Gönderiler yüklenemedi.');
        return withPaws(((data || []) as PostRow[]).map(mapPost));
    },

    async post(id: string): Promise<SocialPost | null> {
        const { data, error } = await supabase.rpc('social_post_rows', { p_ids: [id] });
        if (error) fail(error, 'Gönderi yüklenemedi.');
        const row = (data as PostRow[] | null)?.[0];
        return row ? (await withPaws([mapPost(row)]))[0] : null;
    },

    async uploadMedia(files: File[]): Promise<string[]> {
        const urls: string[] = [];
        for (const f of files) urls.push(await apiService.uploadMedia(f, 'posts'));
        return urls;
    },

    async create(input: PostInput): Promise<string> {
        const user = await me();
        if (!user) throw new Error('Paylaşmak için giriş yapmalısın.');
        const { data, error } = await supabase.from('posts').insert({
            user_id: user.id, content: input.content.trim(), media_urls: input.media, is_video: !!input.isVideo,
            media_filter: input.isVideo && input.mediaFilter && input.mediaFilter !== 'none' ? input.mediaFilter : null,
            tagged_pet_ids: input.taggedPetIds, location_text: input.locationText, area_lat: input.lat, area_lng: input.lng,
            topic: input.topic, show_on_profile: input.showOnProfile, comment_privacy: input.commentPrivacy,
        }).select('id').single();
        if (error || !data) fail(error, 'Gönderi paylaşılamadı.');
        emit(POSTS_CHANGED_EVENT);
        return data.id;
    },

    async update(id: string, patch: Omit<PostInput, 'media' | 'isVideo'>) {
        const row: Record<string, unknown> = {
            content: patch.content.trim(), tagged_pet_ids: patch.taggedPetIds, location_text: patch.locationText,
            topic: patch.topic, show_on_profile: patch.showOnProfile, comment_privacy: patch.commentPrivacy,
        };
        // Konum aynı kaldıysa (koordinat verilmediyse) kayıtlı yaklaşık konuma dokunulmaz.
        if (patch.locationText === null || patch.lat != null) { row.area_lat = patch.lat; row.area_lng = patch.lng; }
        const { error } = await supabase.from('posts').update(row).eq('id', id);
        if (error) fail(error, 'Gönderi güncellenemedi.');
        emit(POSTS_CHANGED_EVENT);
    },

    async remove(id: string) {
        const user = await me();
        const { data: row } = await supabase.from('posts').select('media_urls').eq('id', id).maybeSingle();
        const { error } = await supabase.from('posts').delete().eq('id', id);
        if (error) fail(error, 'Gönderi silinemedi.');
        if (user && row?.media_urls?.length) await removeOwnFiles('posts', row.media_urls, user.id).catch(() => {});
        emit(POSTS_CHANGED_EVENT);
    },

    async setLike(id: string, on: boolean) {
        const user = await me();
        if (!user) throw new Error('Beğenmek için giriş yapmalısın.');
        const { error } = on
            ? await supabase.from('likes').insert({ post_id: id, user_id: user.id })
            : await supabase.from('likes').delete().eq('post_id', id).eq('user_id', user.id);
        if (error && error.code !== '23505') fail(error, 'Beğeni kaydedilemedi.');
    },

    /** Pati bırakır ya da geri alır; sunucunun güncel sayısını döner. */
    async togglePaw(id: string): Promise<{ pawed: boolean; paws: number }> {
        const { data, error } = await supabase.rpc('toggle_post_paw', { p_post: id });
        if (error) fail(error, 'Pati bırakılamadı.');
        const row = Array.isArray(data) ? data[0] : data;
        return { pawed: !!row?.pawed, paws: row?.paws_count || 0 };
    },

    // --- Haftanın teması ----------------------------------------------------------------------------------
    async currentTheme(): Promise<WeeklyTheme | null> {
        const { data, error } = await supabase.rpc('get_current_theme');
        if (error) return null;
        const row = Array.isArray(data) ? data[0] : data;
        return row ? mapTheme(row as ThemeRow) : null;
    },

    /** Yönetici paneli: tüm temalar, en yeni önce. */
    async listThemes(): Promise<WeeklyTheme[]> {
        const { data, error } = await supabase.from('weekly_themes').select('*').order('starts_on', { ascending: false });
        if (error) fail(error, 'Temalar yüklenemedi.');
        return ((data || []) as ThemeRow[]).map(mapTheme);
    },

    async saveTheme(input: WeeklyThemeInput, id?: string) {
        const row = {
            hashtag: input.hashtag.trim().replace(/^#/, ''), title: input.title.trim(), description: input.description?.trim() || null,
            starts_on: input.startsOn, ends_on: input.endsOn, reward_points: input.rewardPoints,
        };
        const { error } = id ? await supabase.from('weekly_themes').update(row).eq('id', id) : await supabase.from('weekly_themes').insert(row);
        if (error) fail(error, 'Tema kaydedilemedi.');
    },

    async deleteTheme(id: string) {
        const { error } = await supabase.from('weekly_themes').delete().eq('id', id);
        if (error) fail(error, 'Tema silinemedi.');
    },

    async setSave(id: string, on: boolean) {
        const user = await me();
        if (!user) throw new Error('Kaydetmek için giriş yapmalısın.');
        const { error } = on
            ? await supabase.from('post_saves').insert({ post_id: id, user_id: user.id })
            : await supabase.from('post_saves').delete().eq('post_id', id).eq('user_id', user.id);
        if (error && error.code !== '23505') fail(error, 'Kaydedilemedi.');
    },

    async likers(id: string): Promise<(PersonCard & { isFollowing: boolean })[]> {
        const { data, error } = await supabase.from('likes').select('user_id, created_at').eq('post_id', id).order('created_at', { ascending: false }).limit(200);
        if (error) fail(error, 'Beğenenler yüklenemedi.');
        const ids = ((data || []) as { user_id: string }[]).map(l => l.user_id);
        const [byId, user] = await Promise.all([cards(ids), me()]);
        let following = new Set<string>();
        if (user && ids.length) {
            const { data: f } = await supabase.from('follows').select('following_id').eq('follower_id', user.id).in('following_id', ids);
            following = new Set(((f || []) as { following_id: string }[]).map(x => x.following_id));
        }
        return ids.filter(i => byId[i]).map(i => ({
            id: i, name: personName(byId[i]), username: byId[i].username, avatar: byId[i].avatar_url,
            isBusiness: byId[i].role === 'business', isFollowing: following.has(i),
        }));
    },

    // --- Yorumlar (tek seviyeli yanıt) ------------------------------------------------------------------------------
    async comments(postId: string): Promise<SocialComment[]> {
        const { data, error } = await supabase.from('comments').select('id, post_id, user_id, parent_id, content, status, likes_count, created_at, edited_at')
            .eq('post_id', postId).order('created_at', { ascending: true }).limit(500);
        if (error) fail(error, 'Yorumlar yüklenemedi.');
        const rows = (data || []) as CommentRow[];
        const [byId, user] = await Promise.all([cards(rows.map(c => c.user_id)), me()]);
        let liked = new Set<string>();
        if (user && rows.length) {
            const { data: l } = await supabase.from('comment_likes').select('comment_id').eq('user_id', user.id).in('comment_id', rows.map(c => c.id));
            liked = new Set(((l || []) as { comment_id: string }[]).map(x => x.comment_id));
        }
        const all: SocialComment[] = rows.map(c => ({
            id: c.id, postId: c.post_id, userId: c.user_id, parentId: c.parent_id, content: c.content, status: c.status,
            likes: c.likes_count || 0, isLiked: liked.has(c.id), createdAt: c.created_at, editedAt: c.edited_at,
            author: { name: personName(byId[c.user_id]), username: byId[c.user_id]?.username || null, avatar: byId[c.user_id]?.avatar_url || null },
            replies: [],
        }));
        const top = all.filter(c => !c.parentId);
        const byTop: Record<string, SocialComment> = Object.fromEntries(top.map(c => [c.id, c]));
        all.filter(c => c.parentId).forEach(c => { if (byTop[c.parentId!]) byTop[c.parentId!].replies.push(c); else top.push(c); });
        return top;
    },

    async addComment(postId: string, content: string, parentId?: string | null) {
        const user = await me();
        if (!user) throw new Error('Yorum yazmak için giriş yapmalısın.');
        const { data, error } = await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content: content.trim(), parent_id: parentId || null })
            .select('status').single();
        if (error) fail(error, 'Yorum gönderilemedi.');
        return data?.status as string;
    },

    async editComment(id: string, content: string) {
        const { error } = await supabase.from('comments').update({ content: content.trim() }).eq('id', id);
        if (error) fail(error, 'Yorum güncellenemedi.');
    },

    async deleteComment(id: string) {
        const { error } = await supabase.from('comments').delete().eq('id', id);
        if (error) fail(error, 'Yorum silinemedi.');
    },

    async setCommentLike(id: string, on: boolean) {
        const user = await me();
        if (!user) throw new Error('Beğenmek için giriş yapmalısın.');
        const { error } = on
            ? await supabase.from('comment_likes').insert({ comment_id: id, user_id: user.id })
            : await supabase.from('comment_likes').delete().eq('comment_id', id).eq('user_id', user.id);
        if (error && error.code !== '23505') fail(error, 'Beğeni kaydedilemedi.');
    },

    // --- Keşfet araması ---------------------------------------------------------------------------------------------
    async search(query: string, filter: ExploreFilter, area: { lat: number; lng: number } | null, offset = 0, limit = 30): Promise<GridPost[]> {
        const { data, error } = await supabase.rpc('search_social_posts', {
            p_query: query || null, p_filter: filter, p_lat: area?.lat ?? null, p_lng: area?.lng ?? null, p_limit: limit, p_offset: offset,
        });
        if (error) fail(error, 'Arama yapılamadı.');
        return ((data || []) as GridRow[]).map(mapGrid);
    },

    async searchPeople(query: string): Promise<PersonCard[]> {
        const q = query.trim().replace(/[%,()]/g, ' ');
        if (q.length < 2) return [];
        const { data, error } = await supabase.from('profile_cards').select('id, full_name, username, avatar_url, role, business_name')
            .or(`full_name.ilike.%${q}%,username.ilike.%${q}%,business_name.ilike.%${q}%`).neq('account_status', 'deactivated').limit(10);
        if (error) return [];
        return ((data || []) as CardRow[]).map(p => ({ id: p.id, name: personName(p), username: p.username, avatar: p.avatar_url, isBusiness: p.role === 'business' }));
    },

    // --- Profil ------------------------------------------------------------------------------------------------------
    async profileSummary(userId: string): Promise<{ posts: number; followers: number; following: number; isFollowing: boolean; followsMe: boolean; blockedByMe: boolean }> {
        const { data, error } = await supabase.rpc('get_profile_summary', { p_user: userId });
        if (error) fail(error, 'Profil yüklenemedi.');
        const r = Array.isArray(data) ? data[0] : data;
        return { posts: r?.posts || 0, followers: r?.followers || 0, following: r?.following || 0, isFollowing: !!r?.is_following, followsMe: !!r?.follows_me, blockedByMe: !!r?.blocked_by_me };
    },

    async profilePosts(userId: string, saved = false): Promise<GridPost[]> {
        const { data, error } = await supabase.rpc('get_profile_posts', { p_user: userId, p_saved: saved });
        if (error) fail(error, 'Gönderiler yüklenemedi.');
        return ((data || []) as GridRow[]).map(mapGrid);
    },

    async setFollow(userId: string, on: boolean) {
        const user = await me();
        if (!user) throw new Error('Takip etmek için giriş yapmalısın.');
        const { error } = on
            ? await supabase.from('follows').insert({ follower_id: user.id, following_id: userId })
            : await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
        if (error && error.code !== '23505') fail(error, 'Takip işlemi yapılamadı.');
        emit('moffi-follow-change', { userId, isFollowing: on });
    },

    async block(userId: string) {
        const { error } = await supabase.rpc('block_user', { p_target: userId });
        if (error) fail(error, 'Engellenemedi.');
        emit('moffi-follow-change', { userId, isFollowing: false });
        emit(POSTS_CHANGED_EVENT);
    },

    async unblock(userId: string) {
        const { error } = await supabase.rpc('unblock_user', { p_target: userId });
        if (error) fail(error, 'Engel kaldırılamadı.');
        emit(POSTS_CHANGED_EVENT);
    },

    async blockedUsers(): Promise<PersonCard[]> {
        const user = await me();
        if (!user) return [];
        const { data } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id);
        const ids = ((data || []) as { blocked_id: string }[]).map(b => b.blocked_id);
        const byId = await cards(ids);
        return ids.map(i => ({ id: i, name: personName(byId[i]), username: byId[i]?.username || null, avatar: byId[i]?.avatar_url || null, isBusiness: byId[i]?.role === 'business' }));
    },

    /** Paylaşım panelindeki "Moffi'de gönder" listesi: takip ettiklerin (en yeni takip önce). */
    async following(): Promise<PersonCard[]> {
        const user = await me();
        if (!user) return [];
        const { data } = await supabase.from('follows').select('following_id, created_at').eq('follower_id', user.id).order('created_at', { ascending: false }).limit(60);
        const ids = ((data || []) as { following_id: string }[]).map(f => f.following_id);
        const byId = await cards(ids);
        return ids.filter(i => byId[i]).map(i => ({ id: i, name: personName(byId[i]), username: byId[i].username, avatar: byId[i].avatar_url, isBusiness: byId[i].role === 'business' }));
    },

    /** Bağlantıyı seçilen kişilere Moffi mesajı olarak gönderir. Gönderilemeyenlerin sayısını döndürür. */
    async sendInMessages(userIds: string[], text: string): Promise<number> {
        let failed = 0;
        for (const id of userIds) {
            try { await apiService.sendChatMessage(id, text); } catch { failed++; }
        }
        return failed;
    },

    /** Veri dışa aktarma (KVKK): kendi gönderilerinin tamamı. */
    async myPostsForExport(): Promise<PostExportRow[]> {
        const user = await me();
        if (!user) return [];
        const { data } = await supabase.from('posts').select('id, content, media_urls, tagged_pet_ids, location_text, topic, comment_privacy, show_on_profile, likes_count, comments_count, created_at, edited_at')
            .eq('user_id', user.id).order('created_at', { ascending: false });
        return (data || []) as PostExportRow[];
    },

    async countPosts(): Promise<number> {
        const { count } = await supabase.from('posts').select('id', { count: 'exact', head: true });
        return count || 0;
    },

    // --- Hikâyeler (24 saat) -------------------------------------------------------------------------------------------
    async stories(): Promise<StoryGroup[]> {
        const { data, error } = await supabase.from('stories').select('id, user_id, image_url, caption, created_at, view_count, expires_at')
            .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: true }).limit(200);
        if (error) fail(error, 'Hikâyeler yüklenemedi.');
        const rows = (data || []) as StoryRow[];
        const [byId, user] = await Promise.all([cards(rows.map(s => s.user_id)), me()]);
        const views: Record<string, { liked: boolean }> = {};
        if (user && rows.length) {
            const { data: v } = await supabase.from('story_views').select('story_id, is_liked').eq('viewer_id', user.id).in('story_id', rows.map(s => s.id));
            ((v || []) as { story_id: string; is_liked: boolean | null }[]).forEach(x => { views[x.story_id] = { liked: !!x.is_liked }; });
        }
        const groups = new Map<string, StoryGroup>();
        rows.forEach(s => {
            if (!groups.has(s.user_id)) groups.set(s.user_id, { userId: s.user_id, name: personName(byId[s.user_id]), avatar: byId[s.user_id]?.avatar_url || null, stories: [], hasUnseen: false });
            const own = s.user_id === user?.id;
            groups.get(s.user_id)!.stories.push({
                id: s.id, mediaUrl: s.image_url, caption: s.caption, createdAt: s.created_at, viewCount: s.view_count || 0,
                isViewed: own || !!views[s.id], isLiked: !!views[s.id]?.liked,
            });
        });
        const list = Array.from(groups.values()).map(g => ({ ...g, hasUnseen: g.stories.some(s => !s.isViewed) }));
        return list.sort((a, b) => (a.userId === user?.id ? -1 : b.userId === user?.id ? 1 : Number(b.hasUnseen) - Number(a.hasUnseen)));
    },

    async addStory(file: File, caption?: string) {
        const user = await me();
        if (!user) throw new Error('Hikâye paylaşmak için giriş yapmalısın.');
        const url = await apiService.uploadMedia(file, 'stories');
        const { error } = await supabase.from('stories').insert({
            user_id: user.id, image_url: url, caption: caption?.trim() || null,
            expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
        });
        if (error) fail(error, 'Hikâye paylaşılamadı.');
    },

    async deleteStory(id: string) {
        const user = await me();
        const { data: row } = await supabase.from('stories').select('image_url').eq('id', id).maybeSingle();
        const { error } = await supabase.from('stories').delete().eq('id', id);
        if (error) fail(error, 'Hikâye silinemedi.');
        if (user && row?.image_url) await removeOwnFiles('stories', [row.image_url], user.id).catch(() => {});
    },

    async markStoryViewed(id: string) {
        const user = await me();
        if (!user) return;
        await supabase.from('story_views').upsert({ story_id: id, viewer_id: user.id }, { onConflict: 'story_id,viewer_id', ignoreDuplicates: true });
    },

    async setStoryLike(id: string, on: boolean) {
        const user = await me();
        if (!user) throw new Error('Beğenmek için giriş yapmalısın.');
        await supabase.from('story_views').upsert({ story_id: id, viewer_id: user.id }, { onConflict: 'story_id,viewer_id', ignoreDuplicates: true });
        const { error } = await supabase.from('story_views').update({ is_liked: on }).eq('story_id', id).eq('viewer_id', user.id);
        if (error) fail(error, 'Beğeni kaydedilemedi.');
    },

    async storyViewers(id: string): Promise<(PersonCard & { liked: boolean })[]> {
        const { data, error } = await supabase.from('story_views').select('viewer_id, is_liked, viewed_at').eq('story_id', id).order('viewed_at', { ascending: false });
        if (error) return [];
        const views = (data || []) as { viewer_id: string; is_liked: boolean | null }[];
        const byId = await cards(views.map(v => v.viewer_id));
        return views.filter(v => byId[v.viewer_id]).map(v => ({
            id: v.viewer_id, name: personName(byId[v.viewer_id]), username: byId[v.viewer_id].username, avatar: byId[v.viewer_id].avatar_url,
            isBusiness: byId[v.viewer_id].role === 'business', liked: !!v.is_liked,
        }));
    },
};

export const TOPICS: { id: PostTopic; label: string }[] = [
    { id: 'daily', label: 'Günlük' },
    { id: 'funny', label: 'Komik' },
    { id: 'training', label: 'Eğitim' },
    { id: 'health', label: 'Sağlık' },
    { id: 'other', label: 'Diğer' },
];

export const COMMENT_PRIVACY: { id: CommentPrivacy; label: string }[] = [
    { id: 'everyone', label: 'Herkes' },
    { id: 'followers', label: 'Takipçilerim' },
    { id: 'nobody', label: 'Yorumlar kapalı' },
];

export const EXPLORE_FILTERS: { id: ExploreFilter; label: string }[] = [
    { id: 'all', label: 'Tümü' },
    { id: 'cat', label: 'Kediler' },
    { id: 'dog', label: 'Köpekler' },
    { id: 'young', label: 'Yavrular' },
    { id: 'funny', label: 'Komik' },
    { id: 'training', label: 'Eğitim' },
    { id: 'nearby', label: 'Yakınımda' },
    { id: 'other', label: 'Diğer' },
];

export function timeAgo(iso: string) {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'şimdi';
    if (mins < 60) return `${mins} dk önce`;
    const h = Math.round(mins / 60);
    if (h < 24) return `${h} saat önce`;
    const d = Math.round(h / 24);
    if (d < 7) return `${d} gün önce`;
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}
