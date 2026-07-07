'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Utensils, Scale, Activity, Edit3, 
    CheckCircle2, AlertCircle, Sparkles, Plus,
    ArrowRight, Info, ChevronRight, Apple
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/apiService';
import { NutritionPlan } from '@/types/domain';
import { useTheme } from '@/context/ThemeContext';

interface NutritionModalProps {
    isOpen: boolean;
    onClose: () => void;
    petId: string;
}

export function NutritionModal({ isOpen, onClose, petId }: NutritionModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [plan, setPlan] = useState<NutritionPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        foodName: '',
        amountGrams: 0,
        mealsPerDay: 2,
        targetWeight: 0,
        notes: ''
    });

    useEffect(() => {
        if (isOpen && petId) {
            fetchPlan();
        }
    }, [isOpen, petId]);

    const fetchPlan = async () => {
        setLoading(true);
        try {
            const data = await apiService.getNutritionPlan(petId);
            setPlan(data);
            if (data) {
                setFormData({
                    foodName: data.foodName,
                    amountGrams: data.amountGrams,
                    mealsPerDay: data.meals_per_day || data.mealsPerDay || 2,
                    targetWeight: data.targetWeight,
                    notes: data.notes
                });
            }
        } catch (err) {
            console.error("Nutrition fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiService.updateNutritionPlan(petId, {
                ...plan,
                ...formData,
                petId
            });
            setSuccessMessage("Beslenme Planı Güncellendi! 🍏");
            setIsEditing(false);
            fetchPlan();
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            console.error("Save nutrition error:", err);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md dark:bg-black/80 dark:backdrop-blur-xl"
                    />
                    
                    <motion.div 
                        initial={{ y: "100%" }} 
                        animate={{ y: 0 }} 
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="w-full max-w-xl bg-white dark:bg-[#0F0F16] sm:rounded-[3rem] rounded-t-[3rem] border border-zinc-200 dark:border-card-border shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
                    >
                        {/* HEADER */}
                        <div className="p-8 border-b border-zinc-200 dark:border-card-border flex justify-between items-center bg-gradient-to-r from-emerald-500/[0.03] to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 dark:border-emerald-500/30 shadow-lg">
                                    <Utensils className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-zinc-850 dark:text-white italic uppercase tracking-tighter">Beslenme Planı</h2>
                                    <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/40 font-bold uppercase tracking-[0.2em]">Kişiselleştirilmiş Diyet</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-all border border-zinc-200 dark:border-card-border cursor-pointer">
                                <X className="w-5 h-5 text-zinc-500 dark:text-white/40" />
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 text-left">
                            
                            {successMessage && (
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3"
                                >
                                    <Sparkles className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                                    <span className="text-sm font-black text-emerald-800 dark:text-emerald-100 uppercase italic">{successMessage}</span>
                                </motion.div>
                            )}

                            {loading ? (
                                <div className="py-20 text-center text-zinc-400 dark:text-white opacity-40 font-black uppercase italic tracking-widest">Yükleniyor...</div>
                            ) : !plan && !isEditing ? (
                                <div className="py-16 text-center flex flex-col items-center gap-6 opacity-40">
                                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-200 dark:border-card-border flex items-center justify-center text-zinc-450 dark:text-white/30">
                                        <Apple className="w-8 h-8" />
                                    </div>
                                    <p className="text-xs font-black text-zinc-555 dark:text-white/40 uppercase tracking-widest leading-loose max-w-[200px] text-center">Beslenme planı henüz tanımlanmamış</p>
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="mt-2 text-emerald-500 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 py-3 px-6 rounded-full border border-emerald-500/35 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4" /> PLAN OLUŞTUR
                                    </button>
                                </div>
                            ) : isEditing ? (
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-zinc-450 dark:text-white/30 uppercase tracking-widest ml-1">Mama / Yiyecek Adı</label>
                                            <input 
                                                required
                                                className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-2xl px-5 py-4 text-sm font-bold text-zinc-800 dark:text-white outline-none focus:border-emerald-500/50 transition-all"
                                                value={formData.foodName}
                                                onChange={e => setFormData({...formData, foodName: e.target.value})}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-zinc-450 dark:text-white/30 uppercase tracking-widest ml-1">Günlük Miktar (Gr)</label>
                                                <input 
                                                    type="number"
                                                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-2xl px-5 py-4 text-sm font-bold text-zinc-800 dark:text-white outline-none focus:border-emerald-500/50 transition-all"
                                                    value={formData.amountGrams}
                                                    onChange={e => setFormData({...formData, amountGrams: parseInt(e.target.value)})}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-zinc-450 dark:text-white/30 uppercase tracking-widest ml-1">Öğün Sayısı</label>
                                                <input 
                                                    type="number"
                                                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-2xl px-5 py-4 text-sm font-bold text-zinc-800 dark:text-white outline-none focus:border-emerald-500/50 transition-all"
                                                    value={formData.mealsPerDay}
                                                    onChange={e => setFormData({...formData, mealsPerDay: parseInt(e.target.value)})}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-zinc-450 dark:text-white/30 uppercase tracking-widest ml-1">Hedef Kilo (Kg)</label>
                                            <div className="relative">
                                                <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-white/20" />
                                                <input 
                                                    type="number"
                                                    step="0.1"
                                                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-zinc-800 dark:text-white outline-none focus:border-emerald-500/50 transition-all"
                                                    value={formData.targetWeight}
                                                    onChange={e => setFormData({...formData, targetWeight: parseFloat(e.target.value)})}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-zinc-450 dark:text-white/30 uppercase tracking-widest ml-1">Notlar & Alerjiler</label>
                                            <textarea 
                                                className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-2xl px-5 py-4 text-sm font-bold text-zinc-800 dark:text-white outline-none focus:border-emerald-500/50 transition-all resize-none h-24"
                                                value={formData.notes}
                                                onChange={e => setFormData({...formData, notes: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsEditing(false)}
                                            className="flex-1 py-4 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-500 hover:bg-zinc-200/50 dark:bg-white/5 dark:border-card-border dark:text-white/40 dark:hover:bg-white/10 transition-all cursor-pointer"
                                        >
                                            İPTAL
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="flex-[2] py-4 rounded-2xl bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                                        >
                                            KAYDET VE GÜNCELLE
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-8">
                                    {/* Main Diet Card */}
                                    <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-8 rounded-[2.8rem] relative overflow-hidden group">
                                        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full" />
                                        
                                        <div className="flex justify-between items-start mb-10">
                                            <div>
                                                <h3 className="text-3xl font-black text-zinc-800 dark:text-white tracking-tighter italic uppercase leading-none mb-3">{plan?.foodName}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">Günlük Diyet</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setIsEditing(true)}
                                                className="w-12 h-12 rounded-2xl bg-white/40 backdrop-blur-md dark:bg-white/5 border border-zinc-200/50 dark:border-card-border flex items-center justify-center text-zinc-550 dark:text-white/40 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-50 dark:bg-black/20 backdrop-blur-md p-6 rounded-[2rem] border border-zinc-200 dark:border-card-border">
                                                <span className="text-[9px] font-black text-zinc-450 dark:text-white/30 uppercase tracking-widest block mb-2">Porsiyon</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-zinc-850 dark:text-white tracking-tighter">{plan?.amountGrams}</span>
                                                    <span className="text-xs font-bold text-zinc-400 dark:text-white/40 uppercase">gr</span>
                                                </div>
                                            </div>
                                            <div className="bg-zinc-50 dark:bg-black/20 backdrop-blur-md p-6 rounded-[2rem] border border-zinc-200 dark:border-card-border">
                                                <span className="text-[9px] font-black text-zinc-450 dark:text-white/30 uppercase tracking-widest block mb-2">Öğün</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-zinc-850 dark:text-white tracking-tighter">{plan?.mealsPerDay}</span>
                                                    <span className="text-xs font-bold text-zinc-400 dark:text-white/40 uppercase">X</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-4">
                                            <div className="p-6 bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-card-border rounded-[2rem] flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                    <Scale className="w-5 h-5 text-orange-400" />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-zinc-400 dark:text-white/20 uppercase tracking-widest block">HEDEF KİLO</span>
                                                    <span className="text-sm font-black text-zinc-800 dark:text-white tracking-tight">{plan?.targetWeight} KG</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <div className="p-6 bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-card-border rounded-[2rem] flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                    <Activity className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-zinc-400 dark:text-white/20 uppercase tracking-widest block">AKTİVİTE</span>
                                                    <span className="text-sm font-black text-zinc-800 dark:text-white tracking-tight">DENGELİ</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes Section */}
                                    {plan?.notes && (
                                        <div className="p-6 bg-yellow-500/[0.03] border border-yellow-500/20 rounded-[2.2rem] flex items-start gap-4">
                                            <Info className="w-5 h-5 text-yellow-500/50 shrink-0 mt-0.5" />
                                            <p className="text-[11px] font-bold text-zinc-650 dark:text-white/60 leading-relaxed italic">"{plan.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* FOOTER TIPS */}
                        <div className="p-8 bg-zinc-50/50 dark:bg-black/40 border-t border-zinc-200 dark:border-card-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-black text-zinc-450 dark:text-white/40 uppercase tracking-widest">Metabolizma Analizi: Normal</span>
                            </div>
                            <button className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5 hover:translate-x-1 transition-transform uppercase tracking-widest cursor-pointer">DİYETİSYENE SOR <ChevronRight className="w-3 h-3" /></button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
