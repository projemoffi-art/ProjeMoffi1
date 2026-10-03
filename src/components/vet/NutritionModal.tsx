'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Utensils, Edit3, CheckCircle2, Clock, Flame, Plus } from 'lucide-react';
import { showToast } from '@/lib/utils';
import { apiService } from '@/services/apiService';

interface NutritionModalProps {
    isOpen: boolean;
    onClose: () => void;
    petId: string;
}

type Plan = NonNullable<Awaited<ReturnType<typeof apiService.getNutritionPlan>>>;
type Form = { foodType: string; dailyCalories: string; feedingTimes: string[]; notes: string };

const toForm = (p: Plan | null): Form => ({
    foodType: p?.foodType || '',
    dailyCalories: p?.dailyCalories ? String(p.dailyCalories) : '',
    feedingTimes: p?.feedingTimes?.length ? p.feedingTimes : ['08:00', '19:00'],
    notes: p?.notes || '',
});

/**
 * Diyet planı (nutrition_plans): mama, günlük kalori, öğün saatleri, not. Sahibi yazar; "veteriner onaylı" işaretini
 * yalnızca sunucu koyabilir (nutrition_plans_guard). Günlük öğün sayacı ayrı: ana sayfa kartı (pets.meals_per_day, 8.65).
 */
export function NutritionModal({ isOpen, onClose, petId }: NutritionModalProps) {
    const [plan, setPlan] = useState<Plan | null>(null);
    const [loaded, setLoaded] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Form>(toForm(null));

    useEffect(() => {
        if (!isOpen || !petId) return;
        let alive = true;
        apiService.getNutritionPlan(petId)
            .then(data => { if (!alive) return; setPlan(data); setForm(toForm(data)); setIsEditing(!data); setLoaded(petId); })
            .catch(err => { console.error('Diyet planı okunamadı:', err); if (alive) setLoaded(petId); });
        return () => { alive = false; };
    }, [isOpen, petId]);

    const loading = loaded !== petId;

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        const kcal = parseInt(form.dailyCalories, 10);
        setSaving(true);
        try {
            await apiService.updateNutritionPlan(petId, {
                foodType: form.foodType.trim() || null,
                dailyCalories: Number.isFinite(kcal) && kcal > 0 ? kcal : null,
                feedingTimes: form.feedingTimes.filter(Boolean).sort(),
                notes: form.notes.trim() || null,
            });
            const fresh = await apiService.getNutritionPlan(petId);
            setPlan(fresh);
            setForm(toForm(fresh));
            setIsEditing(false);
            showToast('Diyet planı kaydedildi.', 'CheckCircle2', 'text-emerald-500');
        } catch (err) {
            console.error('Diyet planı kaydedilemedi:', err);
            showToast('Kaydedilemedi, tekrar dene.', 'AlertCircle', 'text-red-500');
        } finally {
            setSaving(false);
        }
    };

    const setTime = (i: number, v: string) => setForm(f => ({ ...f, feedingTimes: f.feedingTimes.map((t, j) => (j === i ? v : t)) }));
    const input = 'w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-[14px] font-semibold text-zinc-900 dark:text-white outline-none focus:border-amber-500';
    const label = 'block text-[12px] font-black text-zinc-500 dark:text-white/50 mb-1.5';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50" />
                    <motion.div
                        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                        className="relative w-full max-w-md max-h-[88vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-8"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center"><Utensils className="w-5 h-5 text-amber-600" /></span>
                                <div>
                                    <h2 className="text-[18px] font-black text-zinc-900 dark:text-white">Diyet planı</h2>
                                    {plan?.vetApproved && (
                                        <p className="text-[12px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Veteriner onaylı</p>
                                    )}
                                </div>
                            </div>
                            <button onClick={onClose} aria-label="Kapat" className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
                                <X className="w-4 h-4 text-zinc-700 dark:text-white" />
                            </button>
                        </div>

                        {loading ? (
                            <p className="py-10 text-center text-[13px] font-semibold text-zinc-500">Yükleniyor…</p>
                        ) : isEditing ? (
                            <form onSubmit={save} className="space-y-4">
                                <label className="block">
                                    <span className={label}>Mama</span>
                                    <input value={form.foodType} maxLength={80} onChange={e => setForm(f => ({ ...f, foodType: e.target.value }))} placeholder="Örn. yetişkin kuzu etli kuru mama" className={input} />
                                </label>
                                <label className="block">
                                    <span className={label}>Günlük kalori (kcal)</span>
                                    <input inputMode="numeric" value={form.dailyCalories} onChange={e => setForm(f => ({ ...f, dailyCalories: e.target.value.replace(/\D/g, '').slice(0, 5) }))} placeholder="Veterinerinin önerdiği değer" className={input} />
                                </label>
                                <div>
                                    <span className={label}>Öğün saatleri</span>
                                    <div className="flex flex-wrap gap-2">
                                        {form.feedingTimes.map((t, i) => (
                                            <span key={i} className="flex items-center gap-1 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl pl-3 pr-1 py-1">
                                                <input type="time" value={t} onChange={e => setTime(i, e.target.value)} className="bg-transparent text-[14px] font-bold text-zinc-900 dark:text-white outline-none" />
                                                <button type="button" aria-label="Kaldır" onClick={() => setForm(f => ({ ...f, feedingTimes: f.feedingTimes.filter((_, j) => j !== i) }))} className="p-1 text-zinc-400"><X className="w-3.5 h-3.5" /></button>
                                            </span>
                                        ))}
                                        {form.feedingTimes.length < 6 && (
                                            <button type="button" onClick={() => setForm(f => ({ ...f, feedingTimes: [...f.feedingTimes, '12:00'] }))} className="flex items-center gap-1 px-3 py-2 rounded-xl border border-dashed border-zinc-300 dark:border-white/20 text-[13px] font-bold text-zinc-600 dark:text-white/60">
                                                <Plus className="w-3.5 h-3.5" /> Ekle
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <label className="block">
                                    <span className={label}>Not</span>
                                    <textarea value={form.notes} maxLength={500} rows={3} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Alerji, yasaklı yiyecek, ödül maması…" className={input} />
                                </label>
                                <div className="flex gap-2 pt-1">
                                    {plan && (
                                        <button type="button" onClick={() => { setForm(toForm(plan)); setIsEditing(false); }} className="flex-1 py-3.5 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-800 dark:text-white font-black text-[14px]">Vazgeç</button>
                                    )}
                                    <button type="submit" disabled={saving} className="flex-1 py-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-[14px] disabled:opacity-50">
                                        {saving ? 'Kaydediliyor…' : 'Kaydet'}
                                    </button>
                                </div>
                            </form>
                        ) : plan && (
                            <div className="space-y-3">
                                <Row icon={<Utensils className="w-4 h-4" />} label="Mama" value={plan.foodType || 'Belirtilmedi'} />
                                <Row icon={<Flame className="w-4 h-4" />} label="Günlük kalori" value={plan.dailyCalories ? `${plan.dailyCalories.toLocaleString('tr-TR')} kcal` : 'Belirtilmedi'} />
                                <Row icon={<Clock className="w-4 h-4" />} label="Öğün saatleri" value={plan.feedingTimes.length ? plan.feedingTimes.join(' · ') : 'Belirtilmedi'} />
                                {plan.notes && <p className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 text-[13px] font-semibold text-zinc-700 dark:text-white/70 leading-relaxed">{plan.notes}</p>}
                                <button onClick={() => setIsEditing(true)} className="w-full mt-2 py-3.5 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white font-black text-[14px] flex items-center justify-center gap-2">
                                    <Edit3 className="w-4 h-4" /> Düzenle
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-white/5">
            <span className="text-amber-600">{icon}</span>
            <span className="flex-1 text-[13px] font-bold text-zinc-500 dark:text-white/50">{label}</span>
            <span className="text-[14px] font-black text-zinc-900 dark:text-white text-right">{value}</span>
        </div>
    );
}
