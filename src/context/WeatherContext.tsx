'use client';

// Uygulamanın TEK hava durumu kaynağı (Open-Meteo, anahtar gerektirmez). Ana sayfa yürüyüş kartı, yürüyüşe hazırlık,
// takip ekranı, kenar paneli, görevler ve canlı etkinlikler buradan okur.
// Konum: izin zaten verilmişse GPS; verilmemişse konum izni KENDİLİĞİNDEN SORULMAZ, IP'den yaklaşık konum kullanılır
// (source: 'ip'). Kullanıcı kesin konum isterse requestPrecise() izni sorar. Hiçbir yoldan veri alınamazsa
// weather null kalır; uydurma ya da varsayılan şehir verisi gösterilmez.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { geolocation } from "@/native";

export type WeatherIconKey = 'Sun' | 'CloudSun' | 'Cloud' | 'CloudRain' | 'Snowflake' | 'CloudLightning';

// Open-Meteo WMO hava kodları
function getWeatherInfo(code: number, temp: number) {
    let condition = 'Açık';
    let emoji = '☀️';
    let iconKey: WeatherIconKey = 'Sun';
    let walkScore = 100;
    let advice = 'Yürüyüş için güzel bir hava.';

    if (code >= 1 && code <= 3) {
        condition = 'Parçalı bulutlu'; emoji = '⛅'; iconKey = 'CloudSun'; walkScore = 90; advice = 'Yürüyüş için uygun bir hava.';
    } else if (code >= 45 && code <= 48) {
        condition = 'Sisli'; emoji = '🌫️'; iconKey = 'Cloud'; walkScore = 60; advice = 'Görüş düşük; dostunu tasmadan ayırma.';
    } else if (code >= 51 && code <= 57) {
        condition = 'Çiseleyen'; emoji = '🌦️'; iconKey = 'CloudRain'; walkScore = 50; advice = 'Hafif yağış var; dönüşte patileri kurula.';
    } else if (code >= 61 && code <= 67) {
        condition = 'Yağmurlu'; emoji = '🌧️'; iconKey = 'CloudRain'; walkScore = 30; advice = 'Yağmur var; kısa bir tur yeterli olabilir.';
    } else if (code >= 71 && code <= 77) {
        condition = 'Karlı'; emoji = '❄️'; iconKey = 'Snowflake'; walkScore = 20; advice = 'Kar var; patiler üşüyebilir, kısa tur yeterli.';
    } else if (code >= 80 && code <= 82) {
        condition = 'Sağanak'; emoji = '⛈️'; iconKey = 'CloudLightning'; walkScore = 15; advice = 'Kuvvetli yağış var; biraz beklemek daha iyi.';
    } else if (code >= 95) {
        condition = 'Fırtınalı'; emoji = '🌩️'; iconKey = 'CloudLightning'; walkScore = 5; advice = 'Fırtına var; yürüyüşü ertelemek en iyisi.';
    }

    // Sıcaklık: pati güvenliği önce gelir.
    if (temp > 35) walkScore = Math.min(walkScore, 30);
    else if (temp > 30) walkScore = Math.min(walkScore, 55);
    else if (temp < 0) walkScore = Math.min(walkScore, 25);
    else if (temp < 5) walkScore = Math.min(walkScore, 45);
    else if (temp >= 15 && temp <= 25) walkScore = Math.min(walkScore + 10, 100);

    if (temp >= 30) advice = 'Asfalt çok sıcak olabilir; serin saatleri ve çimenlik yolları seç.';
    else if (temp >= 25) advice = 'Sıcak bir gün; yanına su al, gölgeli yolları tercih et.';
    else if (temp < 0) advice = 'Hava dondurucu; kısa tur ve dönüşte patileri kontrol et.';

    const walkLabel = walkScore >= 80 ? 'Mükemmel' : walkScore >= 60 ? 'Uygun' : walkScore >= 40 ? 'Dikkatli Ol' : 'Önerilmez';
    const badgeColor = walkScore >= 80 ? 'emerald' : walkScore >= 60 ? 'yellow' : walkScore >= 40 ? 'orange' : 'red';

    return { condition, icon: emoji, emoji, iconKey, walkScore, walkLabel, badgeColor, advice };
}

export interface WeatherData {
    temp: number;
    feelsLike: number;
    code: number;
    condition: string;
    icon: string;
    emoji: string;
    iconKey: WeatherIconKey;
    /** Yürüyüş ve pati güvenliği önerisi */
    advice: string;
    humidity: number;
    windSpeed: number;
    walkScore: number;
    walkLabel: string;
    badgeColor: string;
    city: string;
    lat: number;
    lon: number;
    /** 'gps' = cihaz konumu, 'ip' = internet bağlantısından yaklaşık konum */
    source: 'gps' | 'ip';
    lastUpdated: Date;
}

export interface HourForecast { time: Date; temp: number; code: number; precipProb: number; uv: number; isDay: boolean; iconKey: WeatherIconKey; walkScore: number }
export interface DayForecast { date: Date; max: number; min: number; code: number; precipProb: number; uvMax: number; sunrise: Date; sunset: Date; iconKey: WeatherIconKey; condition: string }
export interface Forecast { hours: HourForecast[]; days: DayForecast[] }

/** Saatlik (48 saat) ve günlük (7 gün) tahmin; detay penceresi açılınca çekilir. Hata hâlinde null. */
export async function fetchForecast(lat: number, lon: number): Promise<Forecast | null> {
    try {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&hourly=temperature_2m,weathercode,precipitation_probability,uv_index,is_day` +
            `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset` +
            `&forecast_days=7&timezone=auto`
        );
        if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
        const d = await res.json();
        const now = Date.now() - 60 * 60 * 1000;
        const hours: HourForecast[] = (d.hourly.time as string[]).map((t, i) => {
            const temp = Math.round(d.hourly.temperature_2m[i]);
            const code = d.hourly.weathercode[i];
            const info = getWeatherInfo(code, temp);
            const precipProb = d.hourly.precipitation_probability?.[i] ?? 0;
            const isDay = d.hourly.is_day?.[i] === 1;
            // Yağış olasılığı ve karanlık yürüyüş puanını düşürür.
            const walkScore = Math.max(0, info.walkScore - Math.round(precipProb * 0.6) - (isDay ? 0 : 15));
            return { time: new Date(t), temp, code, precipProb, uv: d.hourly.uv_index?.[i] ?? 0, isDay, iconKey: info.iconKey, walkScore };
        }).filter(h => h.time.getTime() >= now).slice(0, 48);
        const days: DayForecast[] = (d.daily.time as string[]).map((t, i) => {
            const max = Math.round(d.daily.temperature_2m_max[i]);
            const info = getWeatherInfo(d.daily.weathercode[i], max);
            return {
                date: new Date(`${t}T12:00:00`),
                max, min: Math.round(d.daily.temperature_2m_min[i]),
                code: d.daily.weathercode[i],
                precipProb: d.daily.precipitation_probability_max?.[i] ?? 0,
                uvMax: d.daily.uv_index_max?.[i] ?? 0,
                sunrise: new Date(d.daily.sunrise[i]), sunset: new Date(d.daily.sunset[i]),
                iconKey: info.iconKey, condition: info.condition,
            };
        });
        return { hours, days };
    } catch (err) {
        console.warn('Hava tahmini alınamadı:', err);
        return null;
    }
}

/** Sıcak zemin uyarısı: 25° ve üstü. */
export function isHotForPaws(w: Pick<WeatherData, 'temp'> | null | undefined) {
    return !!w && w.temp >= 25;
}

interface WeatherContextType {
    weather: WeatherData | null;
    isLoading: boolean;
    error: string | null;
    /** Konum izni verilmemiş (konum yaklaşık ya da hiç yok) */
    needsPermission: boolean;
    permissionDenied: boolean;
    refresh: () => void;
    /** Kullanıcı isteğiyle konum iznini sorar ve kesin konumla yeniler. */
    requestPrecise: () => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=tr`,
            { headers: { 'User-Agent': 'MoffiApp/1.0' } }
        );
        const data = await res.json();
        return data?.address?.neighbourhood || data?.address?.suburb || data?.address?.quarter
            || data?.address?.city_district || data?.address?.district || data?.address?.city || data?.address?.town || null;
    } catch {
        return null;
    }
}

async function ipLocation(): Promise<{ lat: number; lon: number; city: string | null } | null> {
    try {
        const r = await fetch('https://freeipapi.com/api/json');
        if (r.ok) {
            const d = await r.json();
            if (d?.latitude && d?.longitude) return { lat: d.latitude, lon: d.longitude, city: d.cityName || null };
        }
    } catch { /* sıradaki servis */ }
    try {
        const r = await fetch('https://ipapi.co/json/');
        if (r.ok) {
            const d = await r.json();
            if (d?.latitude && d?.longitude) return { lat: d.latitude, lon: d.longitude, city: d.city || d.region || null };
        }
    } catch { /* yok */ }
    return null;
}

async function fetchWeather(lat: number, lon: number) {
    const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,weathercode,windspeed_10m,relativehumidity_2m&timezone=auto`
    );
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const cur = (await res.json()).current;
    return {
        temp: Math.round(cur.temperature_2m),
        feelsLike: Math.round(cur.apparent_temperature),
        code: cur.weathercode as number,
        humidity: Math.round(cur.relativehumidity_2m),
        windSpeed: Math.round(cur.windspeed_10m),
    };
}

export function WeatherProvider({ children }: { children: React.ReactNode }) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

    const load = useCallback(async (askPermission = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const perm = await geolocation.permission();
            setPermission(perm);
            let coords: { lat: number; lon: number; city: string | null; source: 'gps' | 'ip' } | null = null;

            if (perm === 'granted' || askPermission) {
                const fix = await geolocation.getCurrentOrNull({ timeoutMs: askPermission ? 15000 : 6000, maxAgeMs: 10 * 60 * 1000 });
                if (fix) coords = { lat: fix.lat, lon: fix.lng, city: null, source: 'gps' };
                if (askPermission) setPermission(await geolocation.permission());
            }
            if (!coords) {
                const ip = await ipLocation();
                if (ip) coords = { ...ip, source: 'ip' };
            }
            if (!coords) { setWeather(null); setError('Konum belirlenemedi'); return; }

            const w = await fetchWeather(coords.lat, coords.lon);
            const city = coords.source === 'gps' ? await reverseGeocode(coords.lat, coords.lon) : coords.city;
            const info = getWeatherInfo(w.code, w.temp);
            setWeather({
                ...w, ...info,
                city: city || 'Konumun',
                lat: coords.lat, lon: coords.lon,
                source: coords.source,
                lastUpdated: new Date(),
            });
        } catch (err) {
            console.warn('Hava durumu alınamadı:', err);
            setError('Hava durumu alınamadı');
            setWeather(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(() => load(), REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [load]);

    const requestPrecise = useCallback(() => load(true), [load]);

    return (
        <WeatherContext.Provider value={{
            weather, isLoading, error,
            needsPermission: permission !== 'granted',
            permissionDenied: permission === 'denied',
            refresh: () => load(),
            requestPrecise,
        }}>
            {children}
        </WeatherContext.Provider>
    );
}

export function useWeather() {
    const ctx = useContext(WeatherContext);
    if (!ctx) throw new Error('useWeather must be used within a WeatherProvider');
    return ctx;
}
