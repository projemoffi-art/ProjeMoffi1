"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, CheckCircle2, AlertCircle, Save, Loader2, Activity, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_SERVICES = [
    { name: "Genel Muayene", duration: 20, icon: "🩺" },
    { name: "Aşı", duration: 15, icon: "💉" },
    { name: "Diş Bakımı/Temizliği", duration: 30, icon: "🦷" },
    { name: "Kontrol/Takip", duration: 15, icon: "📅" },
    { name: "Acil Müdahale", duration: 45, icon: "🚨" },
    { name: "Kuaför/Bakım", duration: 40, icon: "✂️" },
    { name: "Ameliyat/Operasyon", duration: 90, icon: "⚕️" },
    { name: "Laboratuvar/Tahlil", duration: 20, icon: "🧪" },
    { name: "Kısırlaştırma", duration: 60, icon: "🩺" },
    { name: "Ultrason/Görüntüleme", duration: 25, icon: "🖥️" },
];

export default function BusinessServicesPage() {
    const { user } = useAuth();
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const [customName, setCustomName] = useState("");
    const [customDuration, setCustomDuration] = useState("30");

    useEffect(() => {
        if (user?.id) {
            fetchServices();
        }
    }, [user?.id]);

    const fetchServices = async () => {
        try {
            const { data, error } = await supabase
                .from('clinic_services')
                .select('*')
                .eq('clinic_id', user!.id);
            
            if (error) throw error;
            setServices(data || []);
        } catch (err: any) {
            console.error("Hizmetler çekilirken hata:", err);
            setError("Hizmetleriniz yüklenemedi.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleDefault = (defService: typeof DEFAULT_SERVICES[0]) => {
        const exists = services.find(s => s.service_name === defService.name && !s.is_custom);
        if (exists) {
            setServices(services.filter(s => s.id !== exists.id));
        } else {
            if (services.length >= 10) {
                setError("En fazla 10 hizmet ekleyebilirsiniz.");
                setTimeout(() => setError(null), 3000);
                return;
            }
            setServices([...services, {
                id: `temp-${Date.now()}`,
                clinic_id: user!.id,
                service_name: defService.name,
                duration_minutes: defService.duration,
                is_custom: false
            }]);
        }
    };

    const handleAddCustom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customName.trim()) return;
        if (services.length >= 10) {
            setError("En fazla 10 hizmet ekleyebilirsiniz.");
            setTimeout(() => setError(null), 3000);
            return;
        }

        setServices([...services, {
            id: `temp-${Date.now()}`,
            clinic_id: user!.id,
            service_name: customName.trim(),
            duration_minutes: parseInt(customDuration) || 30,
            is_custom: true
        }]);
        setCustomName("");
        setCustomDuration("30");
    };

    const handleRemove = (id: string) => {
        setServices(services.filter(s => s.id !== id));
    };

    const handleSave = async () => {
        if (!user?.id) return;
        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const { error: delError } = await supabase
                .from('clinic_services')
                .delete()
                .eq('clinic_id', user.id);
            
            if (delError) throw delError;

            if (services.length > 0) {
                const toInsert = services.map(s => ({
                    clinic_id: user.id,
                    service_name: s.service_name,
                    duration_minutes: s.duration_minutes,
                    is_custom: s.is_custom
                }));

                const { error: insError } = await supabase
                    .from('clinic_services')
                    .insert(toInsert);
                
                if (insError) throw insError;
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            await fetchServices(); 

        } catch (err: any) {
            console.error("Kaydetme hatası:", err);
            setError("Hizmetler kaydedilirken bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 font-sans w-full max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-black text-foreground dark:text-white tracking-tight flex items-center gap-2">
                    <Activity className="w-6 h-6 text-indigo-500" />
                    Klinik Hizmet Kataloğu
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
                    Müşterilerinize sunduğunuz hizmetleri buradan yönetebilirsiniz. <strong className="text-indigo-500 dark:text-indigo-400">En fazla 10 hizmet</strong> ekleyebilirsiniz. Seçtiğiniz hizmetler müşterilerinize randevu ekranında gösterilecektir.
                </p>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-bold">{error}</span>
                    </motion.div>
                )}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-bold">Hizmet kataloğunuz başarıyla güncellendi!</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-card dark:bg-[#121212] border border-card-border dark:border-[#27272a] rounded-[2rem] p-6 shadow-sm">
                        <h2 className="text-lg font-black text-foreground dark:text-white mb-4">Standart Hizmetler</h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {DEFAULT_SERVICES.map(def => {
                                const isSelected = services.some(s => s.service_name === def.name && !s.is_custom);
                                const isLimitReached = services.length >= 10 && !isSelected;
                                return (
                                    <button
                                        key={def.name}
                                        disabled={isLimitReached}
                                        onClick={() => handleToggleDefault(def)}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${isSelected ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-md shadow-indigo-500/10' : 'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'} ${isLimitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="text-xl">{def.icon}</span>
                                        <div>
                                            <div className="font-bold text-sm leading-none mb-1">{def.name}</div>
                                            <div className="text-xs opacity-70 font-medium">~{def.duration} dk</div>
                                        </div>
                                        {isSelected && <CheckCircle2 className="w-5 h-5 ml-auto text-indigo-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-card dark:bg-[#121212] border border-card-border dark:border-[#27272a] rounded-[2rem] p-6 shadow-sm">
                        <h2 className="text-lg font-black text-foreground dark:text-white mb-4">Özel Hizmet Ekle</h2>
                        <form onSubmit={handleAddCustom} className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Hizmet Adı</label>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={e => setCustomName(e.target.value)}
                                    placeholder="Örn: Evde Bakım"
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold focus:border-indigo-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                            <div className="w-24">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Süre (Dk)</label>
                                <input
                                    type="number"
                                    value={customDuration}
                                    onChange={e => setCustomDuration(e.target.value)}
                                    min="1"
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold focus:border-indigo-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!customName.trim() || services.length >= 10}
                                className="h-11 px-5 bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Ekle</span>
                            </button>
                        </form>
                    </div>
                </div>

                <div>
                    <div className="sticky top-6 bg-card dark:bg-[#121212] border border-card-border dark:border-[#27272a] rounded-[2rem] p-6 shadow-xl shadow-indigo-500/5">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-foreground dark:text-white">Seçili Hizmetler</h2>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${services.length >= 10 ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'}`}>
                                {services.length} / 10
                            </span>
                        </div>

                        <div className="space-y-3 min-h-[200px]">
                            {services.length === 0 ? (
                                <div className="text-center py-10 opacity-50 flex flex-col items-center gap-2">
                                    <Store className="w-8 h-8 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-500">Henüz hizmet seçmediniz.</span>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {services.map((svc) => (
                                        <motion.div
                                            key={svc.id}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50"
                                        >
                                            <div>
                                                <div className="font-bold text-sm text-foreground dark:text-white">{svc.service_name}</div>
                                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{svc.duration_minutes} Dk {svc.is_custom && " • Özel"}</div>
                                            </div>
                                            <button onClick={() => handleRemove(svc.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full mt-6 py-4 bg-foreground dark:bg-white text-background dark:text-black rounded-xl font-black text-sm uppercase tracking-wider hover:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
