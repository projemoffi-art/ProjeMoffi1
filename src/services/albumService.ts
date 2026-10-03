// Hayvan albümü (ana sayfa üst kartı "Albüm" sekmesi + /album). Migration 20261004101100 + 20261004101200.
// Fotoğraflar dört kaynaktan TEK listede, dosya kopyası olmadan: albüme yüklenenler (özel 'pet-album' deposu, imzalı adres),
// yürüyüş fotoğrafları (walk_sessions.photo_urls), hayvanın etiketlendiği kendi gönderileri, profil/kurulum fotoğrafları.
// Anılar: elle eklenenler (pet_memories) + mevcut veriden hesaplanan otomatik anılar (depolama harcamaz).
// Yükleme: reserve_pet_media (kota ve yol sunucuda) → dosyalar → confirm_pet_media (gerçek boyutu depodan doğrular).

import { supabase } from '@/lib/supabase';
import { encodeAlbumPhoto, readVideo } from '@/lib/media/compress';

const BUCKET = 'pet-album';
const SIGNED_SECONDS = 60 * 60;

export type PhotoSource = 'album' | 'walk' | 'post' | 'profile';

export interface AlbumPhoto {
    key: string;
    source: PhotoSource;
    kind: 'photo' | 'video';
    thumbUrl: string;
    /** Albüm dosyalarında büyük hâl açılırken imzalanır (fullUrlOf). */
    fullUrl: string | null;
    date: string;
    mediaId?: string;
    path?: string;
    thumbPath?: string;
    memoryId?: string | null;
    durationSeconds?: number | null;
    /** Kaynağın kendi ekranı (yürüyüş ayrıntısı, gönderi). */
    href?: string;
}

export interface AlbumLimits {
    prime: boolean;
    photosPerPet: number;
    memoriesPerPet: number | null;
    video: boolean;
    videoMaxSeconds: number;
    videoMaxBytes: number;
}

export interface AlbumStatus { limits: AlbumLimits; mediaCount: number; memoryCount: number }

export type MemoryIcon = 'heart' | 'join' | 'walk' | 'birthday' | 'milestone' | 'post';

export interface Memory {
    key: string;
    kind: 'manual' | 'auto';
    id?: string;
    title: string;
    note: string | null;
    date: string;
    icon: MemoryIcon;
    cover: AlbumPhoto | null;
    media: AlbumPhoto[];
    href?: string;
}

export interface AlbumData {
    photos: AlbumPhoto[];
    memories: Memory[];
    status: AlbumStatus;
}

/** Kota/Prime gibi kullanıcıya özel yönlendirme gereken hatalar. */
export class AlbumLimitError extends Error {
    constructor(message: string, readonly reason: 'quota' | 'prime' | 'size') { super(message); }
}

export interface AlbumPet {
    id: string;
    name: string;
    avatar?: string | null;
    cover?: string | null;
    birthday?: string | null;
    createdAt?: string | null;
}

interface RpcError { message?: string; hint?: string }

function raise(error: RpcError | null, fallback: string): never {
    const hint = error?.hint;
    if (hint === 'quota' || hint === 'prime' || hint === 'size') throw new AlbumLimitError(error?.message || fallback, hint);
    throw new Error(error?.message || fallback);
}

const VIDEO_RE = /\.(mp4|mov|webm|m4v)(\?|$)/i;
const dayKey = (iso: string) => new Date(iso).toLocaleDateString('sv-SE');

interface MediaRow {
    id: string; kind: 'photo' | 'video'; path: string; thumb_path: string; memory_id: string | null;
    duration_seconds: number | null; taken_at: string | null; created_at: string;
}
interface MemoryRow { id: string; title: string; note: string | null; memory_date: string; created_at: string }
interface WalkRow { id: string; start_time: string; distance_meters: number | null; photo_urls: string[] | null }
interface PostRow { id: string; media_urls: string[] | null; media_url: string | null; created_at: string }

async function signMany(paths: string[]): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    for (let i = 0; i < paths.length; i += 200) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths.slice(i, i + 200), SIGNED_SECONDS);
        for (const row of data || []) if (row.signedUrl && row.path) out.set(row.path, row.signedUrl);
    }
    return out;
}

function mapLimits(raw: Record<string, unknown>): AlbumLimits {
    return {
        prime: !!raw.prime,
        photosPerPet: Number(raw.photos_per_pet) || 0,
        memoriesPerPet: raw.memories_per_pet == null ? null : Number(raw.memories_per_pet),
        video: !!raw.video,
        videoMaxSeconds: Number(raw.video_max_seconds) || 0,
        videoMaxBytes: Number(raw.video_max_bytes) || 0,
    };
}

const MILESTONES_KM = [10, 50, 100, 250, 500, 1000, 2500, 5000];

/** Mevcut kayıtlardan hesaplanan anılar: Moffi'ye katılış, doğum günleri, ilk yürüyüş, toplam km eşikleri, ilk gönderi. */
function autoMemories(pet: AlbumPet, walks: WalkRow[], posts: PostRow[], walkPhotos: Map<string, AlbumPhoto>, postPhotos: Map<string, AlbumPhoto>, today: string): Memory[] {
    const out: Memory[] = [];
    const profilePhoto: AlbumPhoto | null = pet.cover || pet.avatar
        ? { key: 'profile-cover', source: 'profile', kind: 'photo', thumbUrl: (pet.cover || pet.avatar)!, fullUrl: (pet.cover || pet.avatar)!, date: today }
        : null;

    if (pet.createdAt) {
        out.push({ key: 'auto-join', kind: 'auto', title: `${pet.name} Moffi ailesine katıldı`, note: null, date: dayKey(pet.createdAt),
            icon: 'join', cover: profilePhoto, media: [], href: '/pasaport' });
    }
    if (pet.birthday && /^\d{4}-\d{2}-\d{2}/.test(pet.birthday)) {
        const [by, bm, bd] = pet.birthday.slice(0, 10).split('-').map(Number);
        const ty = Number(today.slice(0, 4));
        for (let y = by + 1; y <= ty; y++) {
            const key = `${y}-${String(bm).padStart(2, '0')}-${String(bd).padStart(2, '0')}`;
            if (key > today) break;
            out.push({ key: `auto-bday-${y}`, kind: 'auto', title: `${y - by}. yaş günü`, note: null, date: key, icon: 'birthday', cover: profilePhoto, media: [] });
        }
    }
    const ordered = [...walks].sort((a, b) => a.start_time.localeCompare(b.start_time));
    if (ordered[0]) {
        const w = ordered[0];
        out.push({ key: 'auto-first-walk', kind: 'auto', title: 'İlk yürüyüş', note: null, date: dayKey(w.start_time), icon: 'walk',
            cover: walkPhotos.get(w.id) || profilePhoto, media: [], href: `/walk/history/${w.id}` });
    }
    let total = 0;
    let next = 0;
    for (const w of ordered) {
        total += (w.distance_meters || 0) / 1000;
        while (next < MILESTONES_KM.length && total >= MILESTONES_KM[next]) {
            out.push({ key: `auto-km-${MILESTONES_KM[next]}`, kind: 'auto', title: `Birlikte ${MILESTONES_KM[next].toLocaleString('tr-TR')} km`, note: null,
                date: dayKey(w.start_time), icon: 'milestone', cover: walkPhotos.get(w.id) || profilePhoto, media: [], href: `/walk/history/${w.id}` });
            next++;
        }
    }
    const firstPost = [...posts].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
    if (firstPost) {
        out.push({ key: 'auto-first-post', kind: 'auto', title: 'Keşfet\'teki ilk paylaşımı', note: null, date: dayKey(firstPost.created_at), icon: 'post',
            cover: postPhotos.get(firstPost.id) || profilePhoto, media: [], href: `/post/${firstPost.id}` });
    }
    return out;
}

export const albumService = {
    async status(petId: string): Promise<AlbumStatus> {
        const { data, error } = await supabase.rpc('album_status', { p_pet: petId });
        if (error) raise(error, 'Albüm bilgisi okunamadı.');
        const raw = data as { limits: Record<string, unknown>; media_count: number; memory_count: number };
        return { limits: mapLimits(raw.limits), mediaCount: Number(raw.media_count) || 0, memoryCount: Number(raw.memory_count) || 0 };
    },

    /** Albümün tamamı: fotoğraflar (yeniden eskiye), anılar (yeniden eskiye) ve kota durumu. */
    async load(pet: AlbumPet, userId: string): Promise<AlbumData> {
        const [mediaRes, memoryRes, walkRes, postRes, galleryRes, status] = await Promise.all([
            supabase.from('pet_media').select('id, kind, path, thumb_path, memory_id, duration_seconds, taken_at, created_at')
                .eq('pet_id', pet.id).eq('status', 'ready').order('created_at', { ascending: false }).limit(1000),
            supabase.from('pet_memories').select('id, title, note, memory_date, created_at').eq('pet_id', pet.id)
                .order('memory_date', { ascending: false }).limit(500),
            supabase.from('walk_sessions').select('id, start_time, distance_meters, photo_urls')
                .eq('user_id', userId).eq('pet_id', pet.id).eq('status', 'completed').order('start_time', { ascending: false }).limit(2000),
            supabase.from('posts').select('id, media_urls, media_url, created_at')
                .eq('user_id', userId).eq('status', 'published').contains('tagged_pet_ids', [pet.id]).order('created_at', { ascending: false }).limit(300),
            supabase.from('pets').select('gallery_urls').eq('id', pet.id).maybeSingle(),
            albumService.status(pet.id),
        ]);
        if (mediaRes.error || memoryRes.error) raise(mediaRes.error || memoryRes.error, 'Albüm okunamadı.');

        const media = (mediaRes.data || []) as MediaRow[];
        const signed = await signMany(media.map(m => m.thumb_path));
        const albumPhotos: AlbumPhoto[] = media
            .filter(m => signed.has(m.thumb_path))
            .map(m => ({
                key: `album-${m.id}`, source: 'album', kind: m.kind, thumbUrl: signed.get(m.thumb_path)!, fullUrl: null,
                date: m.taken_at || m.created_at, mediaId: m.id, path: m.path, thumbPath: m.thumb_path, memoryId: m.memory_id,
                durationSeconds: m.duration_seconds,
            }));

        const seen = new Set<string>();
        const external = (url: string, p: Omit<AlbumPhoto, 'thumbUrl' | 'fullUrl' | 'kind'>): AlbumPhoto | null => {
            if (!url || seen.has(url)) return null;
            seen.add(url);
            return { ...p, kind: VIDEO_RE.test(url) ? 'video' : 'photo', thumbUrl: url, fullUrl: url };
        };

        const walks = (walkRes.data || []) as WalkRow[];
        const walkPhotos: AlbumPhoto[] = [];
        const walkCover = new Map<string, AlbumPhoto>();
        for (const w of walks) {
            (w.photo_urls || []).forEach((url, i) => {
                const p = external(url, { key: `walk-${w.id}-${i}`, source: 'walk', date: w.start_time, href: `/walk/history/${w.id}` });
                if (p) { walkPhotos.push(p); if (!walkCover.has(w.id)) walkCover.set(w.id, p); }
            });
        }

        const posts = (postRes.data || []) as PostRow[];
        const postPhotos: AlbumPhoto[] = [];
        const postCover = new Map<string, AlbumPhoto>();
        for (const post of posts) {
            const urls = post.media_urls?.length ? post.media_urls : post.media_url ? [post.media_url] : [];
            urls.forEach((url, i) => {
                const p = external(url, { key: `post-${post.id}-${i}`, source: 'post', date: post.created_at, href: `/post/${post.id}` });
                if (p) { postPhotos.push(p); if (!postCover.has(post.id) && p.kind === 'photo') postCover.set(post.id, p); }
            });
        }

        // Kapak listede yok: kartın kendisinde görünür ve albümden yapılmışsa aynı fotoğrafın kopyasıdır.
        const profileUrls = [pet.avatar, ...(((galleryRes.data as { gallery_urls?: string[] } | null)?.gallery_urls) || [])];
        const profilePhotos = profileUrls
            .map((url, i) => url ? external(url, { key: `profile-${i}`, source: 'profile', date: pet.createdAt || new Date(0).toISOString(), href: '/pasaport/kimlik' }) : null)
            .filter((p): p is AlbumPhoto => !!p);

        const photos = [...albumPhotos, ...walkPhotos, ...postPhotos, ...profilePhotos]
            .sort((a, b) => b.date.localeCompare(a.date));

        const byMemory = new Map<string, AlbumPhoto[]>();
        for (const p of albumPhotos) {
            if (!p.memoryId) continue;
            const list = byMemory.get(p.memoryId) || [];
            list.push(p);
            byMemory.set(p.memoryId, list);
        }
        const manual: Memory[] = ((memoryRes.data || []) as MemoryRow[]).map(m => {
            const list = (byMemory.get(m.id) || []).sort((a, b) => a.date.localeCompare(b.date));
            return { key: `memory-${m.id}`, kind: 'manual', id: m.id, title: m.title, note: m.note, date: m.memory_date, icon: 'heart', cover: list[0] || null, media: list };
        });

        const today = new Date().toLocaleDateString('sv-SE');
        const memories = [...manual, ...autoMemories(pet, walks, posts, walkCover, postCover, today)]
            .sort((a, b) => b.date.localeCompare(a.date) || (a.kind === 'manual' ? -1 : 1));

        return { photos, memories, status };
    },

    /** Albüm dosyasının büyük hâli (video ya da fotoğraf) için kısa ömürlü adres. */
    async fullUrlOf(photo: AlbumPhoto): Promise<string> {
        if (photo.fullUrl) return photo.fullUrl;
        if (!photo.path) throw new Error('Dosya bulunamadı.');
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(photo.path, SIGNED_SECONDS);
        if (error || !data?.signedUrl) throw new Error('Dosya açılamadı.');
        return data.signedUrl;
    },

    /** Fotoğrafı küçültüp (videoyu olduğu gibi) albüme yükler. Kota ve Prime denetimi sunucuda. */
    async upload(petId: string, file: File, memoryId: string | null = null): Promise<void> {
        const isVideo = file.type.startsWith('video/');
        let main: Blob, mainType: string, thumb: Blob, thumbType: string;
        let args: Record<string, unknown>;
        if (isVideo) {
            const info = await readVideo(file);
            main = file; mainType = file.type;
            thumb = info.poster.blob; thumbType = info.poster.mime;
            args = { p_pet: petId, p_kind: 'video', p_mime: file.type, p_bytes: file.size, p_width: info.width, p_height: info.height,
                p_duration: Math.round(info.duration * 10) / 10, p_memory: memoryId, p_taken_at: file.lastModified ? new Date(file.lastModified).toISOString() : null };
        } else {
            const { full, thumb: small } = await encodeAlbumPhoto(file);
            main = full.blob; mainType = full.mime;
            thumb = small.blob; thumbType = small.mime;
            args = { p_pet: petId, p_kind: 'photo', p_mime: full.mime, p_bytes: full.blob.size, p_width: full.width, p_height: full.height,
                p_memory: memoryId, p_taken_at: file.lastModified ? new Date(file.lastModified).toISOString() : null };
        }

        const { data, error } = await supabase.rpc('reserve_pet_media', args);
        if (error) raise(error, 'Yüklenemedi.');
        const slot = data as { id: string; path: string; thumb_path: string };

        try {
            const up1 = await supabase.storage.from(BUCKET).upload(slot.path, main, { contentType: mainType, upsert: false, cacheControl: '31536000' });
            if (up1.error) throw new Error('Dosya yüklenemedi, bağlantını kontrol et.');
            const up2 = await supabase.storage.from(BUCKET).upload(slot.thumb_path, thumb, { contentType: thumbType, upsert: false, cacheControl: '31536000' });
            if (up2.error) throw new Error('Dosya yüklenemedi, bağlantını kontrol et.');
            const { error: confirmError } = await supabase.rpc('confirm_pet_media', { p_id: slot.id });
            if (confirmError) raise(confirmError, 'Yükleme doğrulanamadı.');
        } catch (err) {
            // Yarım kalan yükleme kotayı ve depoyu tutmasın.
            await supabase.storage.from(BUCKET).remove([slot.path, slot.thumb_path]);
            await supabase.rpc('remove_pet_media', { p_id: slot.id });
            throw err;
        }
    },

    async remove(photo: AlbumPhoto): Promise<void> {
        if (photo.source !== 'album' || !photo.mediaId || !photo.path || !photo.thumbPath) throw new Error('Bu fotoğraf kendi ekranından silinir.');
        const { error: storageError } = await supabase.storage.from(BUCKET).remove([photo.path, photo.thumbPath]);
        if (storageError) throw new Error('Silinemedi, tekrar dene.');
        const { error } = await supabase.rpc('remove_pet_media', { p_id: photo.mediaId });
        if (error) raise(error, 'Silinemedi.');
    },

    /** Albümü açarken: bir günden eski yarım yüklemeleri temizler (sessiz). */
    async cleanupStale(): Promise<void> {
        const { data } = await supabase.rpc('remove_stale_pet_media');
        const paths = (data as string[] | null) || [];
        if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    },

    async saveMemory(input: { id?: string | null; petId: string; title: string; note: string; date: string }): Promise<string> {
        const { data, error } = await supabase.rpc('save_pet_memory', {
            p_id: input.id ?? null, p_pet: input.petId, p_title: input.title, p_note: input.note || null, p_date: input.date,
        });
        if (error) raise(error, 'Anı kaydedilemedi.');
        return data as string;
    },

    async removeMemory(id: string): Promise<void> {
        const { error } = await supabase.rpc('remove_pet_memory', { p_id: id });
        if (error) raise(error, 'Anı silinemedi.');
    },

    async setMediaMemory(mediaId: string, memoryId: string | null): Promise<void> {
        const { error } = await supabase.rpc('set_pet_media_memory', { p_media: mediaId, p_memory: memoryId });
        if (error) raise(error, 'Güncellenemedi.');
    },

    /** Hayvan silinmeden önce albüm dosyaları depodan kaldırılır (satırlar hayvanla birlikte gider). */
    async removePetFiles(userId: string, petId: string): Promise<void> {
        const { data } = await supabase.storage.from(BUCKET).list(`${userId}/${petId}`, { limit: 1000 });
        const paths = (data || []).filter(f => f.id).map(f => `${userId}/${petId}/${f.name}`);
        for (let i = 0; i < paths.length; i += 100) await supabase.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    },
};
