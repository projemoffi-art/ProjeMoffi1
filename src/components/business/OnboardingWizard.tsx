"use client";

import { useState, useEffect } from "react";
import { useBusinessType, useActiveBusiness } from "@/context/BusinessTypeContext";
import { apiService } from "@/services/apiService";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";

// Faz 4 (işletme türü mimarisi, 2026-09-25) — Housecall Pro/Jobber deseni:
// onay sonrası ilk girişte, seçilen işletme türüne göre varsayılan hizmet
// kataloğu ÖNERİLİR (sahibi işaretleri değiştirebilir/hiç eklemeyebilir),
// hiçbir şey kilitli değil — sonradan "Hizmetlerim" sayfasından serbestçe
// düzenlenebilir. `businesses.onboarding_completed` gerçek bir DB kolonu
// (localStorage DEĞİL — bu projede localStorage-only "tamamlandı" bayrakları
// defalarca gerçek durumdan sapıp yanlış bilgi vermişti, bkz. CLAUDE.md 8.3).
// Hizmet kataloğu kavramı olmayan türlerde (petshop/shelter, defaultServices
// boş) sihirbaz hiç gösterilmez.
export function OnboardingWizard() {
    const { businessId, business, canManage } = useActiveBusiness();
    const typeConfig = useBusinessType();
    const [shouldShow, setShouldShow] = useState(false);
    const [checkedServices, setCheckedServices] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const check = async () => {
            if (!businessId || !business || !canManage || typeConfig.defaultServices.length === 0) return;
            if (business.onboarding_completed !== false) return;

            // Bu migration'dan ÖNCE zaten kurulmuş, gerçek hizmetleri olan bir
            // işletmeyse (bu projede zaten vardı) sihirbazı hiç gösterme —
            // sadece sessizce "tamamlandı" işaretle, aksi halde varsayılan
            // liste TEKRAR eklenip mükerrer satır oluşturabilirdi.
            const { count } = await supabase
                .from('clinic_services')
                .select('id', { count: 'exact', head: true })
                .eq('clinic_id', businessId);

            if (cancelled) return;
            if (count && count > 0) {
                await apiService.updateActiveBusiness({ onboarding_completed: true });
                return;
            }

            setCheckedServices(new Set(typeConfig.defaultServices.map(s => s.name)));
            setShouldShow(true);
        };
        check();
        return () => { cancelled = true; };
    }, [businessId, business, canManage, typeConfig]);

    const toggleService = (name: string) => {
        setCheckedServices(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name); else next.add(name);
            return next;
        });
    };

    const finish = async (withServices: boolean) => {
        if (!businessId) return;
        setIsSaving(true);
        try {
            if (withServices && checkedServices.size > 0) {
                const rows = typeConfig.defaultServices
                    .filter(s => checkedServices.has(s.name))
                    .slice(0, 10)
                    .map(s => ({
                        clinic_id: businessId,
                        service_name: s.name,
                        duration_minutes: s.duration,
                        is_custom: false,
                    }));
                if (rows.length > 0) {
                    await supabase.from('clinic_services').insert(rows);
                }
            }
            await apiService.updateActiveBusiness({ onboarding_completed: true });
        } catch (e) {
            console.error("Onboarding tamamlanırken hata:", e);
        } finally {
            setIsSaving(false);
            setShouldShow(false);
        }
    };

    return (
        <AnimatePresence>
            {shouldShow && (
                <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-lg bg-card border border-card-border rounded-[2rem] p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground dark:text-white">MoffiBusiness'e hoş geldin! 🎉</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{typeConfig.label} olarak kaydoldun.</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 mb-4">
                            Hızlı başlaman için sektöründe sık kullanılan hizmetleri hizmet kataloğuna ekleyelim mi?
                            İstersen hiçbirini seçme — "Hizmetlerim" sayfasından istediğin zaman değiştirebilirsin.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-6">
                            {typeConfig.defaultServices.map(s => {
                                const checked = checkedServices.has(s.name);
                                return (
                                    <button
                                        key={s.name}
                                        onClick={() => toggleService(s.name)}
                                        className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm font-bold transition-all ${checked ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}
                                    >
                                        <span className="text-lg">{s.icon}</span>
                                        <span className="flex-1">{s.name}</span>
                                        {checked && <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => finish(false)}
                                disabled={isSaving}
                                className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-bold text-sm disabled:opacity-50 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                            >
                                Şimdi değil
                            </button>
                            <button
                                onClick={() => finish(true)}
                                disabled={isSaving}
                                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm disabled:opacity-50 transition-colors"
                            >
                                {isSaving ? 'Kaydediliyor...' : 'Başlayalım'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
