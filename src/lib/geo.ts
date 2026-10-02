// Konum yardımcıları (kayıp ilanları, sahiplendirme). Harici API anahtarı gerektirmez.
import { getCurrentOrNull } from '@/native/location';

export type LatLng = { lat: number; lng: number };

export function distanceKm(a: LatLng, b: LatLng): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
}

export function distanceText(km: number | null | undefined): string | null {
    if (km == null || !Number.isFinite(km)) return null;
    if (km < 1) return `${Math.max(100, Math.round(km * 10) * 100)} m`;
    return `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`;
}

/** Cihazın konumu (izin istenir); alınamazsa null. */
export async function currentPosition(timeoutMs = 10000): Promise<LatLng | null> {
    const fix = await getCurrentOrNull({ timeoutMs, maxAgeMs: 5 * 60 * 1000 });
    return fix ? { lat: fix.lat, lng: fix.lng } : null;
}

/** Koordinat → "Moda Caddesi, Kadıköy" gibi kısa adres (OpenStreetMap Nominatim). */
export async function shortAddress(lat: number, lng: number): Promise<string | null> {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17&accept-language=tr`);
        if (!res.ok) return null;
        const d = await res.json();
        const a = d?.address || {};
        const place = a.road || a.neighbourhood || a.suburb || a.quarter || a.village;
        const district = a.town || a.county || a.city_district || a.district || a.city;
        return [place, district].filter(Boolean).join(', ') || d?.display_name?.split(',').slice(0, 2).join(',') || null;
    } catch {
        return null;
    }
}

/** Yaklaşık konum (şehir/ilçe) — konum satırında gösterilir. */
export async function areaName(lat: number, lng: number): Promise<string | null> {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&accept-language=tr`);
        if (!res.ok) return null;
        const a = (await res.json())?.address || {};
        return [a.town || a.county || a.city_district || a.suburb, a.province || a.state || a.city].filter(Boolean).join(', ') || null;
    } catch {
        return null;
    }
}
