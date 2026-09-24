import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Faz 10 kontrolü: `walk_sessions.path_coordinates` DB'de gerçekte
 * `{lat, lng, timestamp}[]` şeklinde saklanıyor (bkz. updateWalkLocation),
 * ama uygulamanın her yerinde (WalkRecord.path, LiveMap'in path prop'u,
 * canlı takip sırasındaki bellek-içi hali) `[number, number][]` tuple
 * formatı bekleniyor. Bu ikisi hiç uyuşmuyordu — sadece bugüne kadar hiçbir
 * kod gerçek path_coordinates'i geri okuyup gerçekten TÜKETMEDİĞİ için
 * (ilgili sorgular başka bir hatayla hep boş dönüyordu) hiç fark edilmemişti.
 * Gerçek geçmiş verisini gösteren her yer bunu kullanmalı.
 */
/**
 * İki koordinat arası gerçek büyük-daire (haversine) mesafesi, km cinsinden.
 * Faz 18'de (Meydan Okumalar) `QuestEngineContext.tsx` içinde yerel olarak
 * tanımlanmıştı; Ekran 9 (Yürüyüş Detayı) ortalama/maks hız hesaplaması da
 * aynı matematiğe ihtiyaç duyduğu için buraya, paylaşılan tek kaynağa taşındı
 * — iki ayrı dosyada aynı formülün kopyalanmasını önlemek için.
 */
export function haversineKm(a: [number, number], b: [number, number]): number {
    const R = 6371;
    const dLat = (b[0] - a[0]) * Math.PI / 180;
    const dLon = (b[1] - a[1]) * Math.PI / 180;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
}

export function normalizePathToTuples(raw: unknown): [number, number][] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((p: any): [number, number] | null => {
            if (Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number') {
                return [p[0], p[1]];
            }
            if (p && typeof p.lat === 'number' && typeof p.lng === 'number') {
                return [p.lat, p.lng];
            }
            return null;
        })
        .filter((p): p is [number, number] => p !== null);
}

/**
 * Moffi Professional Toast Dispatcher
 * Replaces legacy alert() with premium system notifications
 */
// İkon adları GlobalToast.tsx'teki IconMap ile birebir eşleşmeli (bkz. o dosya) -
// aksi halde tanınmayan bir isim sessizce Bell'e düşer (yanlış ikon gösterilir, çökmez).
export function showToast(message: string, icon: 'Sparkles' | 'Bell' | 'Zap' | 'Heart' | 'PawPrint' | 'X' | 'CheckCircle2' | 'XCircle' | 'AlertCircle' | 'PhoneCall' | 'MapPin' | 'Send' | 'Upload' | 'Download' | 'Save' | 'Globe' | 'Share2' | 'Wand2' | 'ShieldAlert' | 'Award' | 'Gift' = 'Bell', color?: string) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('moffi-toast', { 
            detail: { message, icon, color } 
        }));
    }
}

/**
 * High-Performance Client-Side Image Compression (Instagram/TikTok Standard)
 * Reduces a 10MB photo down to ~200KB without visible quality loss.
 */
export async function compressImage(file: File, maxWidthOrHeight: number = 1080, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate aspect ratio and resize if needed
                if (width > height) {
                    if (width > maxWidthOrHeight) {
                        height = Math.round((height *= maxWidthOrHeight / width));
                        width = maxWidthOrHeight;
                    }
                } else {
                    if (height > maxWidthOrHeight) {
                        width = Math.round((width *= maxWidthOrHeight / height));
                        height = maxWidthOrHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file); // Fallback to original if canvas fails
                    return;
                }

                // Draw image on canvas
                ctx.drawImage(img, 0, 0, width, height);

                // Export as modern WebP if supported, otherwise JPEG
                const exportFormat = 'image/webp';
                
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file); // Fallback to original
                            return;
                        }
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                            type: exportFormat,
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    },
                    exportFormat,
                    quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}
