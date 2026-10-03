// Yüklemeden önce telefonda küçültme (Supabase depolama ve trafik maliyeti; CLAUDE.md 8.65).
// Fotoğraf: uzun kenar en fazla 1600 px, WebP (tarayıcı WebP üretemiyorsa JPEG), yön bilgisi uygulanır.
// Önizleme: uzun kenar 400 px; albüm ızgarası yalnızca bunu indirir. Video: süre/boyut okunur, ilk kareden önizleme çıkarılır.

export interface EncodedImage { blob: Blob; mime: 'image/webp' | 'image/jpeg'; width: number; height: number }

const PASSTHROUGH = new Set(['image/gif', 'image/svg+xml']);

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
    if (typeof createImageBitmap === 'function') {
        try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* aşağıdaki yol */ }
    }
    const url = URL.createObjectURL(file);
    try {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
        await img.decode();
        return img;
    } catch {
        throw new Error('Bu fotoğraf biçimi açılamadı. JPEG ya da PNG dene.');
    } finally {
        URL.revokeObjectURL(url);
    }
}

function sizeOf(src: ImageBitmap | HTMLImageElement) {
    return 'naturalWidth' in src ? { w: src.naturalWidth, h: src.naturalHeight } : { w: src.width, h: src.height };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
    return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

async function encode(src: ImageBitmap | HTMLImageElement, maxSide: number, quality: number): Promise<EncodedImage> {
    const { w, h } = sizeOf(src);
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const width = Math.max(1, Math.round(w * scale));
    const height = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Fotoğraf işlenemedi.');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, width, height);
    const webp = await toBlob(canvas, 'image/webp', quality);
    if (webp && webp.type === 'image/webp') return { blob: webp, mime: 'image/webp', width, height };
    const jpeg = await toBlob(canvas, 'image/jpeg', quality);
    if (!jpeg) throw new Error('Fotoğraf işlenemedi.');
    return { blob: jpeg, mime: 'image/jpeg', width, height };
}

/** Albüm fotoğrafı: büyük hâl + önizleme. */
export async function encodeAlbumPhoto(file: Blob): Promise<{ full: EncodedImage; thumb: EncodedImage }> {
    const src = await decode(file);
    try {
        const full = await encode(src, 1600, 0.82);
        // Aynı tarayıcı aynı biçimi üretir; sunucu önizleme yolunu büyük hâlin biçimine göre ayırır.
        const thumb = await encode(src, 400, 0.72);
        return { full, thumb };
    } finally {
        if ('close' in src) src.close();
    }
}

/**
 * Genel yüklemeler (gönderi, profil, ilan, işletme): görseli küçültür; GIF/SVG ve görsel olmayan dosyaları olduğu gibi bırakır.
 * Küçültülmüş hâl asıldan büyük çıkarsa (zaten küçük, iyi sıkıştırılmış dosya) asıl dosya kullanılır.
 */
export async function shrinkForUpload(file: File, maxSide = 1600): Promise<File> {
    if (!file.type.startsWith('image/') || PASSTHROUGH.has(file.type)) return file;
    let src: ImageBitmap | HTMLImageElement;
    try { src = await decode(file); } catch { return file; }
    try {
        const out = await encode(src, maxSide, 0.82);
        if (out.blob.size >= file.size) return file;
        const base = file.name.replace(/\.[^.]+$/, '') || 'foto';
        return new File([out.blob], `${base}.${out.mime === 'image/webp' ? 'webp' : 'jpg'}`, { type: out.mime });
    } catch {
        return file;
    } finally {
        if ('close' in src) src.close();
    }
}

export interface VideoInfo { duration: number; width: number; height: number; poster: EncodedImage }

/** Videonun süresi, boyutu ve ilk anlamlı karesinden önizleme (albüm ızgarası için). */
export function readVideo(file: Blob): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        const done = (fn: () => void) => { fn(); URL.revokeObjectURL(url); video.removeAttribute('src'); video.load(); };
        video.onerror = () => done(() => reject(new Error('Bu video açılamadı. MP4 ya da MOV dene.')));
        video.onloadedmetadata = () => { video.currentTime = Math.min(0.5, (video.duration || 1) / 2); };
        video.onseeked = async () => {
            try {
                const canvas = document.createElement('canvas');
                const scale = Math.min(1, 400 / Math.max(video.videoWidth, video.videoHeight));
                canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
                canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
                canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
                const webp = await toBlob(canvas, 'image/webp', 0.72);
                const blob = webp && webp.type === 'image/webp' ? webp : await toBlob(canvas, 'image/jpeg', 0.72);
                if (!blob) throw new Error('poster');
                const poster: EncodedImage = { blob, mime: blob.type === 'image/webp' ? 'image/webp' : 'image/jpeg', width: canvas.width, height: canvas.height };
                const info = { duration: video.duration, width: video.videoWidth, height: video.videoHeight, poster };
                done(() => resolve(info));
            } catch {
                done(() => reject(new Error('Video önizlemesi çıkarılamadı.')));
            }
        };
        video.src = url;
    });
}
