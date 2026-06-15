"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Utensils, Sparkles, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MealLoggerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddMeal: (kcal: number, type: string) => void;
}

export function MealLoggerModal({ isOpen, onClose, onAddMeal }: MealLoggerModalProps) {
    const [customKcal, setCustomKcal] = useState("");
    const [customType, setCustomType] = useState("");
    const [selectedQuickId, setSelectedQuickId] = useState<number | null>(null);

    const quickMeals = [
        { id: 1, label: "Kuru Mama (ProPlan Somonlu)", amount: "150 gr", calories: 540, type: "Sabah/Akşam Öğünü" },
        { id: 2, label: "Yaş Konserve Mama", amount: "100 gr", calories: 300, type: "Öğle Öğünü" },
        { id: 3, label: "Ödül Bisküvisi / Dental Stick", amount: "1 adet", calories: 80, type: "Ödül" },
        { id: 4, label: "Ev Yapımı Tavuk & Pilav", amount: "120 gr", calories: 450, type: "Özel Menü" }
    ];

    const handleQuickAdd = (meal: typeof quickMeals[0]) => {
        onAddMeal(meal.calories, meal.label);
        onClose();
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const kcalNum = Number(customKcal);
        if (!kcalNum || kcalNum <= 0) return;
        
        onAddMeal(kcalNum, customType || "Manuel Giriş");
        setCustomKcal("");
        setCustomType("");
        onClose();
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
                    />

                    {/* Modal */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 m-auto w-[90%] max-w-md h-fit max-h-[90vh] overflow-y-auto no-scrollbar bg-background border border-card-border rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] z-[9999] text-foreground p-6"
                    >
                        <button 
                            onClick={onClose}
                            className="absolute top-5 right-5 w-8 h-8 bg-foreground/5 rounded-full flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-colors z-20"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col items-center text-center mt-2 mb-6">
                            <div className="w-14 h-14 rounded-[1.5rem] bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-3.5 shadow-sm">
                                <Utensils className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black tracking-tight">Öğün / Yemek Ekle</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Önerilen Öğünler veya Manuel Giriş</p>
                        </div>

                        {/* Quick Add List */}
                        <div className="space-y-3 mb-6">
                            <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider block mb-1">Hızlı Seçenekler</span>
                            {quickMeals.map((meal) => (
                                <button
                                    key={meal.id}
                                    onClick={() => handleQuickAdd(meal)}
                                    className="w-full text-left p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-orange-200 dark:hover:border-orange-900/30 hover:bg-orange-500/[0.02] active:scale-[0.99] transition-all flex justify-between items-center cursor-pointer group"
                                >
                                    <div>
                                        <h4 className="text-xs font-black text-gray-800 dark:text-white/95 group-hover:text-orange-600 transition-colors">{meal.label}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">{meal.type} • {meal.amount}</p>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-black px-3 py-1.5 rounded-xl">
                                        +{meal.calories} kcal
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Custom Input Form */}
                        <form onSubmit={handleCustomSubmit} className="pt-4 border-t border-gray-100 dark:border-white/5">
                            <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider block mb-3.5">Özel Kalori Ekle</span>
                            <div className="space-y-3.5">
                                <div>
                                    <input 
                                        type="text" 
                                        placeholder="Yemek / Atıştırmalık Adı (örn. Yaş Mama)" 
                                        value={customType}
                                        onChange={(e) => setCustomType(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3.5 rounded-2xl text-xs font-bold outline-none placeholder:text-gray-400 text-gray-800 dark:text-white focus:border-orange-500 transition-colors"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <input 
                                        type="number" 
                                        placeholder="Kalori Miktarı (kcal)" 
                                        value={customKcal}
                                        onChange={(e) => setCustomKcal(e.target.value)}
                                        required
                                        className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3.5 rounded-2xl text-xs font-bold outline-none placeholder:text-gray-400 text-gray-800 dark:text-white focus:border-orange-500 transition-colors"
                                    />
                                    <button 
                                        type="submit"
                                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-black px-6 rounded-2xl flex items-center justify-center gap-1 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
                                    >
                                        <Plus className="w-4 h-4" /> Ekle
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
