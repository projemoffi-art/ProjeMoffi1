'use client';

// Hava durumu detayı: bulunulan bölgenin saatlik (24 saat) ve 7 günlük tahmini, yürüyüş için en iyi saatler ve
// pati güvenliği. Uygulamanın her yerinden açılır: window.dispatchEvent(new CustomEvent('open-weather-detail')).
// Veri WeatherContext'ten (tek kaynak); tahmin pencere açılınca çekilir. Open-Meteo atfı (CC BY 4.0) altta gösterilir.

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cloud, CloudLightning, CloudRain, CloudSun, Droplets, LocateFixed, MapPin, Snowflake, Sun, Sunrise, Sunset, ThermometerSun, Umbrella, Wind, X } from 'lucide-react';
import { useWeather, fetchForecast, isHotForPaws, type Forecast, type WeatherIconKey } from '@/context/WeatherContext';
import { haptics } from '@/native';
import { cn } from '@/lib/utils';

const ICON: Record<WeatherIconKey, typeof Sun> = { Sun, CloudSun, Cloud, CloudRain, Snowflake, CloudLightning };
const hm = (d: Date) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
const dayName = (d: Date, i: number) => (i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : d.toLocaleDateString('tr-TR', { weekday: 'long' }));

function uvLabel(uv: number) {
    if (uv >= 8) return 'Çok yüksek';
    if (uv >= 6) return 'Yüksek';
    if (uv >= 3) return 'Orta';
    return 'Düşük';
}

export function WeatherDetailSheet() {
    const { weather, isLoading, permissionDenied, requestPrecise } = useWeather();
    const [open, setOpen] = useState(false);
    const [forecast, setForecast] = useState<Forecast | null>(null);
    const [loadingForecast, setLoadingForecast] = useState(false);

    useEffect(() => {
        const handler = () => { haptics.tap(); setOpen(true); };
        window.addEventListener('open-weather-detail', handler);
        return () => window.removeEventListener('open-weather-detail', handler);
    }, []);

    useEffect(() => {
        if (!open) return;
        window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: false }));
        return () => { window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: true })); };
    }, [open]);

    useEffect(() => {
        if (!open || !weather) return;
        let alive = true;
        setLoadingForecast(true);
        fetchForecast(weather.lat, weather.lon).then(f => { if (alive) { setForecast(f); setLoadingForecast(false); } });
        return () => { alive = false; };
    }, [open, weather?.lat, weather?.lon]); // eslint-disable-line react-hooks/exhaustive-deps

    const hours24 = forecast?.hours.slice(0, 24) || [];
    const nowHour = hours24[0];

    // Önümüzdeki 18 saatte, gündüz ve en yüksek yürüyüş puanlı iki ayrı saat.
    const bestHours = useMemo(() => {
        const candidates = (forecast?.hours.slice(0, 18) || []).filter(h => h.isDay);
        const sorted = [...candidates].sort((a, b) => b.walkScore - a.walkScore || a.time.getTime() - b.time.getTime());
        const picked: typeof candidates = [];
        for (const h of sorted) {
            if (picked.every(p => Math.abs(p.time.getTime() - h.time.getTime()) >= 3 * 3_600_000)) picked.push(h);
            if (picked.length === 2) break;
        }
        return picked.sort((a, b) => a.time.getTime() - b.time.getTime());
    }, [forecast]);

    const weekMin = Math.min(...(forecast?.days.map(d => d.min) || [0]));
    const weekMax = Math.max(...(forecast?.days.map(d => d.max) || [1]));
    const hot = isHotForPaws(weather) || (nowHour?.uv ?? 0) >= 7;
    const CurrentIcon = weather ? ICON[weather.iconKey] : Sun;

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-[7400] bg-black/40" />
                    <motion.div
                        role="dialog"
                        aria-label="Hava durumu"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.4 }}
                        onDragEnd={(_, info) => { if (info.offset.y > 110) setOpen(false); }}
                        className="theme-vet fixed bottom-0 inset-x-0 z-[7401] mx-auto max-w-md max-h-[92vh] flex flex-col rounded-t-[30px] bg-background text-foreground shadow-[0_-20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
                    >
                        <div className="pt-2.5 pb-1 flex justify-center shrink-0"><span className="w-10 h-1.5 rounded-full bg-foreground/15" /></div>
                        <div className="flex items-start justify-between px-5 pb-2 shrink-0">
                            <div className="min-w-0">
                                <h2 className="text-[20px] font-extrabold">Hava durumu</h2>
                                {weather && (
                                    <p className="text-[12.5px] font-semibold text-secondary flex items-center gap-1 truncate">
                                        <MapPin className="w-3.5 h-3.5 shrink-0" /> {weather.city}{weather.source === 'ip' ? ' · yaklaşık konum' : ''}
                                    </p>
                                )}
                            </div>
                            <button type="button" onClick={() => setOpen(false)} aria-label="Kapat" className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-foreground/5">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] space-y-4">
                            {!weather ? (
                                <div className="card-premium rounded-[24px] p-5 text-center">
                                    <p className="text-[15px] font-extrabold">{isLoading ? 'Hava durumu alınıyor…' : 'Hava durumu alınamadı'}</p>
                                    {!isLoading && !permissionDenied && (
                                        <button type="button" onClick={() => requestPrecise()} className="mt-3 h-11 px-4 rounded-2xl bg-accent text-white text-[14px] font-extrabold">Konumumu kullan</button>
                                    )}
                                    {permissionDenied && <p className="text-[13px] font-semibold text-secondary mt-2">Konum izni kapalı; telefon ayarlarından açabilirsin.</p>}
                                </div>
                            ) : (
                                <>
                                    {weather.source === 'ip' && !permissionDenied && (
                                        <button type="button" onClick={() => requestPrecise()} className="w-full rounded-2xl bg-accent/10 text-accent px-4 py-2.5 text-[13px] font-bold flex items-center gap-2">
                                            <LocateFixed className="w-4 h-4" /> Bulunduğun yerin tam hava durumu için konumunu kullan
                                        </button>
                                    )}

                                    {/* Şu an */}
                                    <div
                                        className="rounded-[26px] p-5 text-white relative overflow-hidden"
                                        style={{ background: hot ? 'linear-gradient(150deg,#F7A35C,#E0623F 60%,#B8402A)' : 'linear-gradient(150deg,#F2B45E,#E58A3E 55%,#C76A35)' }}
                                    >
                                        <div className="absolute -right-6 -top-6 w-40 h-40 rounded-full bg-white/15 blur-2xl" />
                                        <div className="relative flex items-center justify-between">
                                            <div>
                                                <div className="text-[56px] leading-none font-extrabold">{weather.temp}°</div>
                                                <div className="text-[16px] font-bold mt-1">{weather.condition}</div>
                                                <div className="text-[13px] font-semibold text-white/85">Hissedilen {weather.feelsLike}°</div>
                                            </div>
                                            <CurrentIcon className="w-20 h-20 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)]" strokeWidth={1.6} />
                                        </div>
                                        <div className="relative mt-4 grid grid-cols-3 gap-2">
                                            {[
                                                { Icon: Droplets, label: 'Nem', value: `%${weather.humidity}` },
                                                { Icon: Wind, label: 'Rüzgâr', value: `${weather.windSpeed} km/sa` },
                                                { Icon: Sun, label: 'UV', value: nowHour ? `${Math.round(nowHour.uv)} · ${uvLabel(nowHour.uv)}` : '—' },
                                            ].map(m => (
                                                <div key={m.label} className="glass-photo rounded-2xl px-2.5 py-2">
                                                    <div className="flex items-center gap-1 text-[11px] font-bold text-white/80"><m.Icon className="w-3.5 h-3.5" /> {m.label}</div>
                                                    <div className="text-[13.5px] font-extrabold mt-0.5 truncate">{m.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pati güvenliği */}
                                    <div className={cn('rounded-[22px] p-4 flex items-start gap-3', hot ? 'bg-emergency/10 border border-emergency/25' : 'card-premium')}>
                                        <span className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', hot ? 'bg-emergency text-white' : 'bg-[#8FD14F]/25 text-[#4E8A23]')}>
                                            <ThermometerSun className="w-5 h-5" />
                                        </span>
                                        <div>
                                            <p className="text-[14.5px] font-extrabold">{hot ? 'Patilere dikkat' : 'Pati güvenliği'}</p>
                                            <p className="text-[13px] font-semibold text-secondary leading-snug mt-0.5">
                                                {weather.advice}{hot ? ' Elinin tersini 7 saniye asfalta koy; tutamıyorsan patiler için de sıcaktır.' : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* En iyi saatler */}
                                    {bestHours.length > 0 && (
                                        <div>
                                            <h3 className="text-[15px] font-extrabold mb-2">Yürüyüş için en iyi saatler</h3>
                                            <div className="grid grid-cols-2 gap-2.5">
                                                {bestHours.map((h, i) => {
                                                    const Icon = ICON[h.iconKey];
                                                    return (
                                                        <div key={h.time.toISOString()} className="card-premium rounded-[20px] p-3.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[17px] font-extrabold">{hm(h.time)}</span>
                                                                <Icon className="w-6 h-6 text-[#E8A33D]" />
                                                            </div>
                                                            <p className="text-[12.5px] font-semibold text-secondary mt-0.5">{h.temp}° · yağış %{h.precipProb}</p>
                                                            {i === 0 && bestHours[0].walkScore >= bestHours[bestHours.length - 1].walkScore && (
                                                                <span className="inline-block mt-1.5 rounded-full bg-[#8FD14F]/25 text-[#4E8A23] text-[11px] font-extrabold px-2 py-0.5">En uygun</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Saatlik */}
                                    <div>
                                        <h3 className="text-[15px] font-extrabold mb-2">Saatlik</h3>
                                        {loadingForecast && !forecast ? (
                                            <div className="h-[104px] rounded-[22px] bg-foreground/[0.05] animate-pulse" />
                                        ) : forecast ? (
                                            <div className="card-premium rounded-[22px] py-3 flex overflow-x-auto no-scrollbar">
                                                {hours24.map((h, i) => {
                                                    const Icon = ICON[h.iconKey];
                                                    return (
                                                        <div key={h.time.toISOString()} className="shrink-0 w-[58px] flex flex-col items-center gap-1.5">
                                                            <span className="text-[12px] font-bold text-secondary">{i === 0 ? 'Şimdi' : h.time.toLocaleTimeString('tr-TR', { hour: '2-digit' })}</span>
                                                            <Icon className={cn('w-6 h-6', h.isDay ? 'text-[#E8A33D]' : 'text-secondary')} />
                                                            <span className="text-[14px] font-extrabold">{h.temp}°</span>
                                                            <span className={cn('text-[11px] font-bold', h.precipProb >= 30 ? 'text-[#4A8FC2]' : 'text-transparent')}>%{h.precipProb}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-[13px] font-semibold text-secondary">Tahmin şu an alınamadı.</p>
                                        )}
                                    </div>

                                    {/* 7 gün */}
                                    {forecast && (
                                        <div>
                                            <h3 className="text-[15px] font-extrabold mb-2">7 günlük</h3>
                                            <div className="card-premium rounded-[22px] divide-y divide-card-border">
                                                {forecast.days.map((d, i) => {
                                                    const Icon = ICON[d.iconKey];
                                                    const span = Math.max(1, weekMax - weekMin);
                                                    return (
                                                        <div key={d.date.toISOString()} className="flex items-center gap-3 px-4 py-2.5">
                                                            <span className="w-[74px] text-[13.5px] font-bold capitalize">{dayName(d.date, i)}</span>
                                                            <Icon className="w-5 h-5 text-[#E8A33D] shrink-0" />
                                                            <span className={cn('w-10 text-[11.5px] font-bold flex items-center gap-0.5', d.precipProb >= 30 ? 'text-[#4A8FC2]' : 'text-transparent')}>
                                                                <Umbrella className="w-3 h-3" />%{d.precipProb}
                                                            </span>
                                                            <span className="w-8 text-right text-[13px] font-bold text-secondary">{d.min}°</span>
                                                            <span className="flex-1 h-1.5 rounded-full bg-foreground/10 relative">
                                                                <span
                                                                    className="absolute h-full rounded-full"
                                                                    style={{ left: `${((d.min - weekMin) / span) * 100}%`, right: `${100 - ((d.max - weekMin) / span) * 100}%`, background: 'linear-gradient(90deg,#F2C46B,#E0623F)' }}
                                                                />
                                                            </span>
                                                            <span className="w-8 text-[13px] font-extrabold">{d.max}°</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="mt-2.5 flex items-center justify-center gap-5 text-[12px] font-semibold text-secondary">
                                                <span className="flex items-center gap-1"><Sunrise className="w-4 h-4" /> {hm(forecast.days[0].sunrise)}</span>
                                                <span className="flex items-center gap-1"><Sunset className="w-4 h-4" /> {hm(forecast.days[0].sunset)}</span>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-center text-[11px] font-medium text-secondary/80 pt-1">
                                        Hava verisi: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline">Open-Meteo</a> (CC BY 4.0)
                                    </p>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
