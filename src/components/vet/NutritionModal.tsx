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

interface NutritionModalProps {
    isOpen: boolean;
    onClose: () => void;
    petId: string;
}

export function NutritionModal({ isOpen, onClose, petId }: NutritionModalProps) {
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
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />
                    
                    <motion.div 
                        initial={{ y: "100%" }} 
                        animate={{ y: 0 }} 
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="w-full max-w-xl bg-[#0F0F16] sm:rounded-[3rem] rounded-t-[3rem] border border-white/5 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
                    >
                        {/* HEADER */}
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-emerald-500/[0.03] to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                                    <Utensils className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Beslenme Planı</h2>
                                    <p className="text-[10px] text-emerald-400/40 font-bold uppercase tracking-[0.2em]">Kişiselleştirilmiş Diyet</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10">
                                <X className="w-5 h-5 text-white/40" />
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                            
                            {successMessage && (
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3"
                                >
                                    <Sparkles className="w-5 h-5 text-emerald-400" />
                                    <span className="text-sm font-black text-emerald-100 uppercase italic">{successMessage}</span>
                                </motion.div>
                            )}

                            {loading ? (
                                <div className="py-20 text-center opacity-20 font-black text-white uppercase italic tracking-widest">Yükleniyor...</div>
                            ) : !plan && !isEditing ? (
                                <div className="py-16 text-center flex flex-col items-center gap-6 opacity-30">
                                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                                        <Apple className="w-8 h-8" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest leading-loose max-w-[200px]">Beslenme planı henüz tanımlanmamış</p>
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="mt-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 py-3 px-6 rounded-full border border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10 transition-all"
                                    >
                                        <Plus className="w-4 h-4" /> PLAN OLUŞTUR
                                    </button>
                                </div>
                            ) : isEditing ? (
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Mama / Yiyecek Adı</label>
                                            <input 
                                                required
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500/50 transition-all"
                                                value={formData.foodName}
                                                onChange={e => setFormData({...formData, foodName: e.target.value})}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Günlük Miktar (Gr)</label>
                                                <input 
                                                    type="number"
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500/50 transition-all"
                                                    value={formData.amountGrams}
                                                    onChange={e => setFormData({...formData, amountGrams: parseInt(e.target.value)})}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Öğün Sayısı</label>
                                                <input 
                                                    type="number"
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500/50 transition-all"
                                                    value={formData.mealsPerDay}
                                                    onChange={e => setFormData({...formData, mealsPerDay: parseInt(e.target.value)})}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Hedef Kilo (Kg)</label>
                                            <div className="relative">
                                                <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                <input 
                                                    type="number"
                                                    step="0.1"
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500/50 transition-all"
                                                    value={formData.targetWeight}
                                                    onChange={e => setFormData({...formData, targetWeight: parseFloat(e.target.value)})}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Notlar & Alerjiler</label>
                                            <textarea 
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500/50 transition-all resize-none h-24"
                                                value={formData.notes}
                                                onChange={e => setFormData({...formData, notes: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsEditing(false)}
                                            className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                                        >
                                            İPTAL
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="flex-[2] py-4 rounded-2xl bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
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
                                                <h3 className="text-3xl font-black text-white tracking-tighter italic uppercase leading-none mb-3">{plan?.foodName}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">Günlük Diyet</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setIsEditing(true)}
                                                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-black/20 backdrop-blur-md p-6 rounded-[2rem] border border-white/5">
                                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-2">Porsiyon</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-white tracking-tighter">{plan?.amountGrams}</span>
                                                    <span className="text-xs font-bold text-white/40 uppercase">gr</span>
                                                </div>
                                            </div>
                                            <div className="bg-black/20 backdrop-blur-md p-6 rounded-[2rem] border border-white/5">
                                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-2">Öğün</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-white tracking-tighter">{plan?.mealsPerDay}</span>
                                                    <span className="text-xs font-bold text-white/40 uppercase">X</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-4">
                                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                    <Scale className="w-5 h-5 text-orange-400" />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block">HEDEF KİLO</span>
                                                    <span className="text-sm font-black text-white tracking-tight">{plan?.targetWeight} KG</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                    <Activity className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block">AKTİVİTE</span>
                                                    <span className="text-sm font-black text-white tracking-tight">DENGELİ</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes Section */}
                                    {plan?.notes && (
                                        <div className="p-6 bg-yellow-500/[0.03] border border-yellow-500/10 rounded-[2.2rem] flex items-start gap-4">
                                            <Info className="w-5 h-5 text-yellow-500/50 shrink-0 mt-0.5" />
                                            <p className="text-[11px] font-bold text-white/60 leading-relaxed italic">"{plan.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* FOOTER TIPS */}
                        <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Metabolizma Analizi: Normal</span>
                            </div>
                            <button className="text-[10px] font-black text-emerald-400 flex items-center gap-1.5 hover:translate-x-1 transition-transform uppercase tracking-widest">DİYETİSYENE SOR <ChevronRight className="w-3 h-3" /></button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
