import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wind, Droplets, Thermometer, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WeatherData } from '@/context/WeatherContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    weather: WeatherData | null;
}

export function WeatherDetailSheet({ isOpen, onClose, weather }: Props) {
    if (!weather) return null;

    const getAdvice = () => {
        const temp = weather.temp;
        const cond = weather.condition || '';
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour >= 20;

        if (cond.includes('Yağmur') || cond.includes('Sağanak') || cond.includes('Çiseleyen')) {
            return `Dışarısı yağışlı (${temp}°C)! 🌧️ Yürüyüşe çıkmadan önce dostuna yağmurluk giydirmeyi düşünebilirsin. Kapıda bir havlu bulundurmak çok iyi olacaktır!`;
        }
        if (cond.includes('Kar')) {
            return `Dışarıda kar yağıyor (${temp}°C)! ❄️ Pati koruyucu balm sürmek faydalı olacaktır. Yürüyüşü kısa tutup hareketli kalın!`;
        }
        if (temp > 28) {
            return `Hava çok sıcak (${temp}°C)! ☀️ Kızgın asfalt patileri yakabilir, toprak veya çim alanları tercih edin. Bolca su molası verin.`;
        }
        if (temp < 6) {
            return `Hava oldukça soğuk (${temp}°C)! ❄️ Kısa tüylü dostlarımız hızlı ısı kaybeder. Tempolu yürüyün ve titreme başlarsa hemen dönün.`;
        }
        if (isNight) {
            return `Gece yürüyüşü (${temp}°C)! 🌙 Fosforlu yelek veya LED ışıklı tasma takmanızı hararetle öneririz. Fenerinizi unutmayın!`;
        }
        return `Hava yürüyüş için son derece mükemmel (${temp}°C, %${weather.walkScore} uygun)! 🍃 Dostunun enerjisini atması için harika bir gün.`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[4000] bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="fixed bottom-4 left-4 right-4 z-[4001] rounded-[2.5rem] bg-white/75 backdrop-blur-2xl shadow-[0_-20px_80px_rgba(0,0,0,0.15)] border border-white/60 overflow-hidden flex flex-col"
                    >
                        {/* Dynamic Gradient Background Glow */}
                        <div className={cn(
                            "absolute top-0 left-0 right-0 h-40 blur-3xl opacity-30 -z-10",
                            weather.badgeColor === 'emerald' ? 'bg-emerald-500' :
                            weather.badgeColor === 'yellow' ? 'bg-yellow-500' :
                            weather.badgeColor === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                        )} />

                        {/* Grab handle */}
                        <div className="w-full flex justify-center pt-4 pb-2">
                            <div className="w-12 h-1.5 bg-slate-300/50 rounded-full" />
                        </div>

                        {/* Content */}
                        <div className="px-6 pb-8 pt-2">
                            {/* Header / Main Value */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{weather.city}</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-black text-slate-800 tracking-tighter leading-none">{weather.temp}°</span>
                                        <span className="text-4xl filter drop-shadow-md">{weather.emoji}</span>
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-600 mt-1 capitalize">{weather.condition}</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 bg-slate-100/80 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Main Metrics Grid */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-white/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-white">
                                    <Thermometer className="w-5 h-5 text-rose-400 mb-1.5" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Hissedilen</span>
                                    <span className="text-base font-black text-slate-700">{weather.feelsLike}°C</span>
                                </div>
                                <div className="bg-white/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-white">
                                    <Wind className="w-5 h-5 text-sky-400 mb-1.5" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Rüzgar</span>
                                    <span className="text-base font-black text-slate-700">{weather.windSpeed} km/s</span>
                                </div>
                                <div className="bg-white/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-white">
                                    <Droplets className="w-5 h-5 text-indigo-400 mb-1.5" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nem</span>
                                    <span className="text-base font-black text-slate-700">%{weather.humidity}</span>
                                </div>
                            </div>

                            {/* Walk Score & Advice */}
                            <div className="bg-white/80 rounded-3xl p-5 shadow-sm border border-white">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Yürüyüşe Uygunluk</span>
                                    <span className={cn(
                                        "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider",
                                        weather.badgeColor === 'emerald' ? 'text-emerald-700 bg-emerald-100' :
                                        weather.badgeColor === 'yellow' ? 'text-yellow-700 bg-yellow-100' :
                                        weather.badgeColor === 'orange' ? 'text-orange-700 bg-orange-100' : 'text-red-700 bg-red-100'
                                    )}>
                                        %{weather.walkScore} - {weather.walkLabel}
                                    </span>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${weather.walkScore}%` }}
                                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                                        className={cn(
                                            "h-full rounded-full",
                                            weather.badgeColor === 'emerald' ? 'bg-emerald-500' :
                                            weather.badgeColor === 'yellow' ? 'bg-yellow-400' :
                                            weather.badgeColor === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                                        )}
                                    />
                                </div>

                                <div className="flex gap-3 items-start bg-slate-50/50 p-3.5 rounded-2xl">
                                    <span className="text-xl shrink-0 mt-0.5">💡</span>
                                    <p className="text-[10.5px] text-slate-600 font-semibold leading-relaxed">
                                        {getAdvice()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
