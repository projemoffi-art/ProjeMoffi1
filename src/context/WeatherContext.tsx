'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Open-Meteo WMO weather code mapping
function getWeatherInfo(code: number, temp: number): {
    condition: string;
    icon: string;
    emoji: string;
    walkScore: number; // 0-100, yürüyüş için uygunluk puanı
    walkLabel: string;
    badgeColor: string;
} {
    let condition = 'Güneşli';
    let icon = '☀️';
    let emoji = '☀️';
    let walkScore = 100;

    if (code === 0) {
        condition = 'Açık Gökyüzü';
        icon = '☀️'; emoji = '☀️'; walkScore = 100;
    } else if (code >= 1 && code <= 3) {
        condition = 'Parçalı Bulutlu';
        icon = '⛅'; emoji = '⛅'; walkScore = 90;
    } else if (code >= 45 && code <= 48) {
        condition = 'Sisli';
        icon = '🌫️'; emoji = '🌫️'; walkScore = 60;
    } else if (code >= 51 && code <= 57) {
        condition = 'Çiseleyen';
        icon = '🌦️'; emoji = '🌦️'; walkScore = 50;
    } else if (code >= 61 && code <= 67) {
        condition = 'Yağmurlu';
        icon = '🌧️'; emoji = '🌧️'; walkScore = 30;
    } else if (code >= 71 && code <= 77) {
        condition = 'Karlı';
        icon = '❄️'; emoji = '❄️'; walkScore = 20;
    } else if (code >= 80 && code <= 82) {
        condition = 'Sağanak';
        icon = '⛈️'; emoji = '⛈️'; walkScore = 15;
    } else if (code >= 95) {
        condition = 'Fırtınalı';
        icon = '🌩️'; emoji = '🌩️'; walkScore = 5;
    }

    // Sıcaklık bazlı puanlama
    if (temp > 35) walkScore = Math.min(walkScore, 30);
    else if (temp > 30) walkScore = Math.min(walkScore, 55);
    else if (temp < 0) walkScore = Math.min(walkScore, 25);
    else if (temp < 5) walkScore = Math.min(walkScore, 45);
    else if (temp >= 15 && temp <= 25) walkScore = Math.min(walkScore + 10, 100); // İdeal sıcaklık

    const walkLabel = walkScore >= 80
        ? 'Mükemmel'
        : walkScore >= 60
        ? 'Uygun'
        : walkScore >= 40
        ? 'Dikkatli Ol'
        : 'Önerilmez';

    const badgeColor = walkScore >= 80
        ? 'emerald'
        : walkScore >= 60
        ? 'yellow'
        : walkScore >= 40
        ? 'orange'
        : 'red';

    return { condition, icon, emoji, walkScore, walkLabel, badgeColor };
}

export interface WeatherData {
    temp: number;
    feelsLike: number;
    condition: string;
    icon: string;
    emoji: string;
    humidity: number;
    windSpeed: number;
    walkScore: number;
    walkLabel: string;
    badgeColor: string;
    city: string;
    lat: number;
    lon: number;
    lastUpdated: Date;
}

interface WeatherContextType {
    weather: WeatherData | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 dakika

async function reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=tr`,
            { headers: { 'User-Agent': 'MoffiApp/1.0' } }
        );
        const data = await res.json();
        // Şehir adı için farklı field'leri dene
        return (
            data?.address?.neighbourhood ||
            data?.address?.suburb ||
            data?.address?.quarter ||
            data?.address?.city_district ||
            data?.address?.district ||
            data?.address?.city ||
            data?.address?.town ||
            'Konumunuz'
        );
    } catch {
        return 'Konumunuz';
    }
}

async function fetchWeather(lat: number, lon: number): Promise<{ temp: number; feelsLike: number; code: number; humidity: number; windSpeed: number }> {
    const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,weathercode,windspeed_10m,relativehumidity_2m&timezone=auto`
    );
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();
    const cur = data.current;
    return {
        temp: Math.round(cur.temperature_2m),
        feelsLike: Math.round(cur.apparent_temperature),
        code: cur.weathercode,
        humidity: Math.round(cur.relativehumidity_2m),
        windSpeed: Math.round(cur.windspeed_10m),
    };
}

export function WeatherProvider({ children }: { children: React.ReactNode }) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            let lat = 40.9877; // default Istanbul
            let lon = 29.0215;
            let city = 'İstanbul';
            let locationSource = 'default';

            // 1. Try browser Geolocation first
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    if (!navigator.geolocation) {
                        reject(new Error('Geolocation not supported'));
                        return;
                    }
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 3000, // short timeout so it doesn't hang the loading state
                        maximumAge: 5 * 60 * 1000,
                    });
                });
                lat = pos.coords.latitude;
                lon = pos.coords.longitude;
                locationSource = 'gps';
            } catch (gpsErr) {
                console.warn('GPS geolocation failed/denied, trying IP geolocation...', gpsErr);
                
                // 2. Fallback to IP Geolocation
                try {
                    const ipRes = await fetch('https://ipapi.co/json/');
                    if (ipRes.ok) {
                        const ipData = await ipRes.json();
                        if (ipData && ipData.latitude && ipData.longitude) {
                            lat = ipData.latitude;
                            lon = ipData.longitude;
                            city = ipData.city || ipData.region || 'İstanbul';
                            locationSource = 'ip';
                        }
                    }
                } catch (ipErr) {
                    console.warn('IP geolocation failed, using default Istanbul coordinates:', ipErr);
                }
            }

            // 3. Fetch real weather for coordinates from Open-Meteo
            const wData = await fetchWeather(lat, lon);
            
            // 4. Reverse geocode city name if GPS was used to get detailed neighborhood name
            if (locationSource === 'gps') {
                try {
                    const gpsCity = await reverseGeocode(lat, lon);
                    if (gpsCity) city = gpsCity;
                } catch (err) {
                    console.warn('Reverse geocoding failed:', err);
                }
            }

            const info = getWeatherInfo(wData.code, wData.temp);

            setWeather({
                temp: wData.temp,
                feelsLike: wData.feelsLike,
                condition: info.condition,
                icon: info.icon,
                emoji: info.emoji,
                humidity: wData.humidity,
                windSpeed: wData.windSpeed,
                walkScore: info.walkScore,
                walkLabel: info.walkLabel,
                badgeColor: info.badgeColor,
                city,
                lat,
                lon,
                lastUpdated: new Date(),
            });
        } catch (err: any) {
            console.error('All weather and location lookups failed, using default:', err);
            setError('Hava durumu alınamadı');
            
            // Safe fallback if open-meteo is down
            try {
                const defaultLat = 40.9877;
                const defaultLon = 29.0215;
                const wData = await fetchWeather(defaultLat, defaultLon);
                const info = getWeatherInfo(wData.code, wData.temp);
                setWeather({
                    temp: wData.temp,
                    feelsLike: wData.feelsLike,
                    condition: info.condition,
                    icon: info.icon,
                    emoji: info.emoji,
                    humidity: wData.humidity,
                    windSpeed: wData.windSpeed,
                    walkScore: info.walkScore,
                    walkLabel: info.walkLabel,
                    badgeColor: info.badgeColor,
                    city: 'İstanbul',
                    lat: defaultLat,
                    lon: defaultLon,
                    lastUpdated: new Date(),
                });
            } catch {
                setWeather({
                    temp: 21,
                    feelsLike: 20,
                    condition: 'Parçalı Bulutlu',
                    icon: '⛅',
                    emoji: '⛅',
                    humidity: 60,
                    windSpeed: 10,
                    walkScore: 85,
                    walkLabel: 'Uygun',
                    badgeColor: 'emerald',
                    city: 'Caddebostan',
                    lat: 40.9877,
                    lon: 29.0215,
                    lastUpdated: new Date(),
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [load]);

    return (
        <WeatherContext.Provider value={{ weather, isLoading, error, refresh: load }}>
            {children}
        </WeatherContext.Provider>
    );
}

export function useWeather() {
    const ctx = useContext(WeatherContext);
    if (!ctx) throw new Error('useWeather must be used within a WeatherProvider');
    return ctx;
}
