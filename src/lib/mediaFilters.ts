// Gönderi efektlerinin tek tanımı. Fotoğrafta efekt piksel düzeyinde dosyaya işlenir (ne görülürse o paylaşılır);
// videoda filtre adı saklanır (posts.media_filter) ve oynatılırken aynı tanımın CSS karşılığıyla uygulanır.
// Kimlikler veritabanındaki posts_media_filter_known kısıtıyla aynı olmalı.

export type FilterId = 'none' | 'bright' | 'vivid' | 'warm' | 'cool' | 'faded' | 'cream' | 'pastel' | 'dusty'
    | 'minimal' | 'mono' | 'noir' | 'vintage' | 'nostalgia' | 'cinema';

type Op = ['brightness' | 'contrast' | 'saturate' | 'sepia' | 'grayscale', number] | ['hue-rotate', number];

export const MEDIA_FILTERS: { id: FilterId; label: string; ops: Op[] }[] = [
    { id: 'none', label: 'Orijinal', ops: [] },
    { id: 'bright', label: 'Aydınlık', ops: [['brightness', 1.1], ['contrast', 1.1]] },
    { id: 'vivid', label: 'Canlı', ops: [['contrast', 1.2], ['saturate', 1.3]] },
    { id: 'warm', label: 'Sıcak', ops: [['sepia', 0.3], ['saturate', 1.2], ['contrast', 1.1]] },
    { id: 'cool', label: 'Soğuk', ops: [['saturate', 1.2], ['contrast', 1.1], ['hue-rotate', -10]] },
    { id: 'faded', label: 'Soluk', ops: [['contrast', 0.9], ['brightness', 1.1], ['saturate', 0.8]] },
    { id: 'cream', label: 'Krem', ops: [['sepia', 0.2], ['brightness', 1.05], ['saturate', 0.9]] },
    { id: 'pastel', label: 'Pastel', ops: [['contrast', 0.85], ['brightness', 1.1], ['saturate', 1.1], ['sepia', 0.1]] },
    { id: 'dusty', label: 'Tozlu', ops: [['sepia', 0.4], ['contrast', 0.9], ['brightness', 1.05]] },
    { id: 'minimal', label: 'Minimal', ops: [['contrast', 1.05], ['saturate', 0.7]] },
    { id: 'mono', label: 'Siyah Beyaz', ops: [['grayscale', 1], ['contrast', 1.2]] },
    { id: 'noir', label: 'Sert Siyah', ops: [['grayscale', 1], ['contrast', 1.4], ['brightness', 0.9]] },
    { id: 'vintage', label: 'Vintage', ops: [['sepia', 0.6], ['contrast', 1.1], ['brightness', 0.9], ['saturate', 1.2]] },
    { id: 'nostalgia', label: 'Nostalji', ops: [['sepia', 0.8], ['contrast', 1.2], ['brightness', 0.8]] },
    { id: 'cinema', label: 'Sinematik', ops: [['contrast', 1.3], ['saturate', 0.8], ['sepia', 0.2]] },
];

const BY_ID = Object.fromEntries(MEDIA_FILTERS.map(f => [f.id, f]));

export const filterLabel = (id: FilterId | null | undefined) => BY_ID[id || 'none']?.label || 'Orijinal';

/** Video oynatırken ve canlı önizlemede kullanılan CSS karşılığı. */
export function filterCss(id: FilterId | string | null | undefined): string | undefined {
    const f = BY_ID[id || 'none'];
    if (!f || !f.ops.length) return undefined;
    return f.ops.map(([k, v]) => (k === 'hue-rotate' ? `hue-rotate(${v}deg)` : `${k}(${v})`)).join(' ');
}

/** Fotoğraf ayarları (sadece fotoğrafta, dosyaya işlenir). Değerler -100..100, vinyet 0..100. */
export interface Adjust { brightness: number; contrast: number; saturation: number; warmth: number; vignette: number }
export const DEFAULT_ADJUST: Adjust = { brightness: 0, contrast: 0, saturation: 0, warmth: 0, vignette: 0 };
export const ADJUST_FIELDS: { key: keyof Adjust; label: string; min: number }[] = [
    { key: 'brightness', label: 'Parlaklık', min: -100 },
    { key: 'contrast', label: 'Kontrast', min: -100 },
    { key: 'saturation', label: 'Doygunluk', min: -100 },
    { key: 'warmth', label: 'Sıcaklık', min: -100 },
    { key: 'vignette', label: 'Vinyet', min: 0 },
];
export const isDefaultAdjust = (a: Adjust) => ADJUST_FIELDS.every(f => a[f.key] === 0);

// --- Piksel işlemleri (CSS Filter Effects tanımlarıyla aynı matematik) ----------------------------------------------

type M = number[]; // 3x3 renk matrisi, satır sırasıyla

function matrixFor([k, v]: Op): M | null {
    if (k === 'saturate') {
        const s = v;
        return [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
            0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
            0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s];
    }
    if (k === 'grayscale') {
        const g = 1 - Math.min(1, v);
        return [0.2126 + 0.7874 * g, 0.7152 - 0.7152 * g, 0.0722 - 0.0722 * g,
            0.2126 - 0.2126 * g, 0.7152 + 0.2848 * g, 0.0722 - 0.0722 * g,
            0.2126 - 0.2126 * g, 0.7152 - 0.7152 * g, 0.0722 + 0.9278 * g];
    }
    if (k === 'sepia') {
        const g = 1 - Math.min(1, v);
        return [0.393 + 0.607 * g, 0.769 - 0.769 * g, 0.189 - 0.189 * g,
            0.349 - 0.349 * g, 0.686 + 0.314 * g, 0.168 - 0.168 * g,
            0.272 - 0.272 * g, 0.534 - 0.534 * g, 0.131 + 0.869 * g];
    }
    if (k === 'hue-rotate') {
        const a = (v * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
        return [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
            0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
            0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072];
    }
    return null;
}

const clamp = (x: number) => (x < 0 ? 0 : x > 255 ? 255 : x);

/** Filtre + ayarları görüntü verisine uygular (yerinde). */
export function applyPixels(img: ImageData, filter: FilterId, adjust: Adjust = DEFAULT_ADJUST) {
    const ops: Op[] = [...(BY_ID[filter]?.ops || [])];
    if (adjust.brightness) ops.push(['brightness', 1 + adjust.brightness / 200]);
    if (adjust.contrast) ops.push(['contrast', 1 + adjust.contrast / 200]);
    if (adjust.saturation) ops.push(['saturate', 1 + adjust.saturation / 100]);
    const warm = adjust.warmth / 100;
    const vig = adjust.vignette / 100;
    if (!ops.length && !warm && !vig) return;

    const steps = ops.map(op => ({ op, m: matrixFor(op) }));
    const d = img.data, w = img.width, h = img.height;
    const cx = w / 2, cy = h / 2, maxD2 = cx * cx + cy * cy;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            let r = d[i], g = d[i + 1], b = d[i + 2];
            for (const { op, m } of steps) {
                if (m) {
                    const nr = m[0] * r + m[1] * g + m[2] * b, ng = m[3] * r + m[4] * g + m[5] * b, nb = m[6] * r + m[7] * g + m[8] * b;
                    r = clamp(nr); g = clamp(ng); b = clamp(nb);
                } else if (op[0] === 'brightness') {
                    r = clamp(r * op[1]); g = clamp(g * op[1]); b = clamp(b * op[1]);
                } else {
                    const c = op[1];
                    r = clamp((r - 128) * c + 128); g = clamp((g - 128) * c + 128); b = clamp((b - 128) * c + 128);
                }
            }
            if (warm) { r = clamp(r + warm * 28); b = clamp(b - warm * 28); }
            if (vig) {
                const dx = x - cx, dy = y - cy;
                const f = 1 - vig * 0.75 * Math.pow((dx * dx + dy * dy) / maxD2, 1.4);
                r *= f; g *= f; b *= f;
            }
            d[i] = r; d[i + 1] = g; d[i + 2] = b;
        }
    }
}
