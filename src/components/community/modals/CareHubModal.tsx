"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Trophy, Navigation, Droplets, Flame, Plus, RotateCcw, 
    Calendar, ChevronRight, Activity, Scale, Sparkles, PhoneCall, 
    MapPin, Heart, ShieldCheck, CheckCircle2, Trash2, Edit2, AlertCircle, Syringe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePet } from '@/context/PetContext';
import { useVaccineSchedule } from '@/hooks/useVaccineSchedule';
import { useRouter } from 'next/navigation';
import { PetSwitcher } from '@/components/common/PetSwitcher';
import confetti from 'canvas-confetti';

interface CareHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTab?: 'nutrition' | 'health' | 'vet';
    petName: string;
    activityPercent: number;
    activityCurrent: number;
    activityTarget: number;
    waterPercent: number;
    waterCurrent: number;
    waterTarget: number;
    foodPercent: number;
    foodCurrent: number;
    foodTarget: number;
}

export function CareHubModal({
    isOpen,
    onClose,
    defaultTab = 'nutrition',
    petName,
    activityPercent,
    activityCurrent,
    activityTarget,
    waterPercent: initialWaterPercent,
    waterCurrent: initialWaterCurrent,
    waterTarget: initialWaterTarget,
    foodPercent: initialFoodPercent,
    foodCurrent: initialFoodCurrent,
    foodTarget: initialFoodTarget,
}: CareHubModalProps) {
    const router = useRouter();
    const { activePet, updatePet } = usePet();
    const petId = activePet?.id || 'default-pet';
    const todayStr = new Date().toISOString().split('T')[0];

    // Local states to allow instant interactive updates inside the Modal
    const [activeTab, setActiveTab] = useState<'nutrition' | 'health' | 'vet'>(defaultTab);
    const [water, setWater] = useState(initialWaterCurrent);
    const [calories, setCalories] = useState(initialFoodCurrent);
    
    // Weight update states
    const [isEditingWeight, setIsEditingWeight] = useState(false);
    const [weightInput, setWeightInput] = useState("");

    // Food logging list (stored locally for instant feed rendering)
    const [foodLog, setFoodLog] = useState<{ id: string; name: string; kcal: number; time: string }[]>([]);

    // Load vaccine schedule
    const { schedule, ruleset, isLoading: isVaccinesLoading, markAsDone } = useVaccineSchedule(petId);

    // Sync default tab when it changes externally
    useEffect(() => {
        if (isOpen) {
            setActiveTab(defaultTab);
        }
    }, [defaultTab, isOpen]);

    // Load initial calories & water from localStorage
    useEffect(() => {
        if (isOpen && typeof window !== 'undefined') {
            const savedWater = localStorage.getItem(`moffi_water_${petId}_${todayStr}`);
            setWater(savedWater !== null ? Number(savedWater) : 0);

            const savedCal = localStorage.getItem(`moffi_calories_${petId}_${todayStr}`);
            setCalories(savedCal !== null ? Number(savedCal) : 0);

            // Load food log list
            const savedLog = localStorage.getItem(`moffi_food_log_${petId}_${todayStr}`);
            setFoodLog(savedLog ? JSON.parse(savedLog) : []);

            setIsEditingWeight(false);
            setWeightInput("");
        }
    }, [isOpen, petId, todayStr]);

    // Derived variables for water
    const targetWater = activePet && typeof activePet.water_target === 'number'
        ? activePet.water_target
        : (activePet?.sos_settings?.water_target ?? 1200);

    const waterPercent = targetWater > 0 ? Math.min(100, Math.round((water / targetWater) * 100)) : 0;

    // Derived variables for food
    const targetFood = activePet && typeof activePet.food_target === 'number'
        ? activePet.food_target
        : (activePet?.sos_settings?.food_target ?? 800);

    const foodPercent = targetFood > 0 ? Math.min(100, Math.round((calories / targetFood) * 100)) : 0;

    // Derived overall success percentage
    const averageProgress = Math.round((activityPercent + waterPercent + foodPercent) / 3);

    // REWARD & CONFETTI TRIGGER LOGIC
    const checkReward = (type: 'water' | 'food', currentVal: number, targetVal: number) => {
        if (!petId || targetVal <= 0) return;
        if (currentVal >= targetVal) {
            const rewardKey = `moffi_reward_${type}_${petId}_${todayStr}`;
            const alreadyRewarded = localStorage.getItem(rewardKey) === 'true';
            if (!alreadyRewarded) {
                localStorage.setItem(rewardKey, 'true');
                
                // Trigger canvas-confetti
                try {
                    confetti({
                        particleCount: 120,
                        spread: 80,
                        origin: { y: 0.55 }
                    });
                } catch (e) {
                    console.error("Confetti trigger failed:", e);
                }

                // Add +10 PatiPuan (Moffi Coins)
                const coinsKey = `moffi_coins_${petId}`;
                const currentCoins = Number(localStorage.getItem(coinsKey) || '0');
                const nextCoins = currentCoins + 10;
                localStorage.setItem(coinsKey, String(nextCoins));

                // Add to transactions
                const txKey = `moffi_transactions_${petId}`;
                const savedTxStr = localStorage.getItem(txKey);
                const savedTx = savedTxStr ? JSON.parse(savedTxStr) : [];
                const newTx = {
                    id: Date.now(),
                    type: 'gelir',
                    title: type === 'water' ? 'Günlük Su Hedefi Başarısı 💧' : 'Günlük Kalori Hedefi Başarısı 🍖',
                    amount: '+10 PATI',
                    date: new Date().toLocaleDateString('tr-TR')
                };
                localStorage.setItem(txKey, JSON.stringify([newTx, ...savedTx]));

                // Dispatch event to sync home page
                window.dispatchEvent(new CustomEvent('moffi-daily-goals-update'));
                
                // Trigger toast notification
                window.dispatchEvent(new CustomEvent('moffi-toast', {
                    detail: {
                        message: `Harika! Hedef Tamamlandı. +10 PatiPuan Kazanıldı! 🎉`,
                        icon: 'Trophy'
                    }
                }));
            }
        }
    };

    // WATER LOGGING HANDLERS
    const handleAddWater = (amount: number) => {
        const next = water + amount;
        setWater(next);
        localStorage.setItem(`moffi_water_${petId}_${todayStr}`, String(next));
        window.dispatchEvent(new CustomEvent('moffi-daily-goals-update'));
        checkReward('water', next, targetWater);
    };

    const handleResetWater = () => {
        if (confirm("Bugünkü su tüketim verisini sıfırlamak istiyor musunuz?")) {
            setWater(0);
            localStorage.setItem(`moffi_water_${petId}_${todayStr}`, '0');
            localStorage.removeItem(`moffi_reward_water_${petId}_${todayStr}`);
            window.dispatchEvent(new CustomEvent('moffi-daily-goals-update'));
        }
    };

    // NUTRITION LOGGING HANDLERS
    const handleAddMeal = (kcal: number, mealName: string) => {
        const next = calories + kcal;
        setCalories(next);
        localStorage.setItem(`moffi_calories_${petId}_${todayStr}`, String(next));

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newLog = [{ id: Math.random().toString(), name: mealName, kcal, time }, ...foodLog];
        setFoodLog(newLog);
        localStorage.setItem(`moffi_food_log_${petId}_${todayStr}`, JSON.stringify(newLog));

        window.dispatchEvent(new CustomEvent('moffi-daily-goals-update'));
        checkReward('food', next, targetFood);
    };

    const handleDeleteMeal = (id: string, kcal: number) => {
        if (confirm("Bu yemek kaydını silmek istediğinizden emin misiniz?")) {
            const nextCalories = Math.max(0, calories - kcal);
            setCalories(nextCalories);
            localStorage.setItem(`moffi_calories_${petId}_${todayStr}`, String(nextCalories));

            const nextLog = foodLog.filter(item => item.id !== id);
            setFoodLog(nextLog);
            localStorage.setItem(`moffi_food_log_${petId}_${todayStr}`, JSON.stringify(nextLog));

            // Reset reward if calorie falls below target
            if (nextCalories < targetFood) {
                localStorage.removeItem(`moffi_reward_food_${petId}_${todayStr}`);
            }

            window.dispatchEvent(new CustomEvent('moffi-daily-goals-update'));
        }
    };

    const handleClearMealLog = () => {
        if (confirm("Tüm yemek kayıtlarını sıfırlamak istiyor musunuz?")) {
            setCalories(0);
            localStorage.setItem(`moffi_calories_${petId}_${todayStr}`, '0');
            setFoodLog([]);
            localStorage.removeItem(`moffi_food_log_${petId}_${todayStr}`);
            window.dispatchEvent(new CustomEvent('moffi-daily-goals-update'));
        }
    };

    // WEIGHT UPDATE HANDLER
    const handleUpdateWeight = () => {
        const nextVal = parseFloat(weightInput);
        if (!isNaN(nextVal) && nextVal > 0) {
            updatePet(petId, { weight: `${nextVal} kg` });
            setIsEditingWeight(false);
        } else {
            alert("Lütfen geçerli bir ağırlık değeri girin.");
        }
    };

    const currentWeight = activePet?.weight?.toString().replace(/[^0-9.]/g, '') || "12.4";

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
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]"
                    />

                    {/* Modal */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 m-auto w-[92%] max-w-[500px] h-[85vh] bg-[#0d0d0f] border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-[9999] text-white flex flex-col overflow-hidden"
                    >
                        {/* HEADER */}
                        <div className="p-6 pb-4 border-b border-white/5 relative bg-[#121215]/80 backdrop-blur-xl">
                            {/* Pet Switcher in Header */}
                            <div className="absolute top-3.5 right-16 z-20 scale-[0.8] origin-right">
                                <PetSwitcher />
                            </div>

                            <button 
                                onClick={onClose}
                                data-testid="close-care-hub"
                                className="absolute top-5 right-5 w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mt-1">
                                {activePet?.image ? (
                                    <div className="w-12 h-12 rounded-2xl border-2 border-cyan-500/30 overflow-hidden shadow-lg shadow-cyan-500/10">
                                        <img src={activePet.image} alt={activePet?.name || petName} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-700 flex items-center justify-center text-white text-xl font-bold">
                                        🐾
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-black tracking-tight">{activePet?.name || petName} Bakım Merkezi</h3>
                                    <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em] mt-0.5">Premium Evcil Hayvan Asistanı</p>
                                </div>
                            </div>

                            {/* TABS */}
                            <div className="flex bg-white/5 border border-white/5 p-1 rounded-2xl mt-4">
                                {[
                                    { id: 'nutrition', label: 'Beslenme & Su', icon: Droplets },
                                    { id: 'health', label: 'Sağlık & Aşılar', icon: Activity },
                                    { id: 'vet', label: 'Klinik & Randevu', icon: Calendar }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        data-testid={`care-hub-tab-${tab.id}`}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                                            activeTab === tab.id 
                                                ? "bg-white text-black shadow-md" 
                                                : "text-white/40 hover:text-white/60"
                                        )}
                                    >
                                        <tab.icon className="w-3.5 h-3.5" />
                                        <span>{tab.label.split(' ')[0]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* SCROLLABLE BODY */}
                        <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-6">
                            
                            {/* TAB 1: NUTRITION */}
                            {activeTab === 'nutrition' && (
                                <div className="space-y-6">
                                    {/* Summary Stats Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Water Ring Card */}
                                        <div className="bg-[#121215] border border-white/5 p-4 rounded-3xl flex flex-col items-center relative overflow-hidden">
                                            {/* Fill wave representation in card */}
                                            <div 
                                                className="absolute inset-x-0 bottom-0 bg-blue-500/20 transition-all duration-500 overflow-hidden" 
                                                style={{ height: `${waterPercent}%` }} 
                                            >
                                                {/* Liquid waves */}
                                                <div 
                                                    className="absolute left-[-50%] bottom-[85%] w-[200%] aspect-square bg-[#121215] rounded-[38%] animate-[care-hub-wave_8s_infinite_linear]" 
                                                    style={{ transformOrigin: 'center center' }}
                                                />
                                                <div 
                                                    className="absolute left-[-45%] bottom-[80%] w-[200%] aspect-square bg-[#121215]/50 rounded-[35%] animate-[care-hub-wave_11s_infinite_linear]" 
                                                    style={{ transformOrigin: 'center center' }}
                                                />
                                            </div>
                                            <div className="w-16 h-16 rounded-full border-4 border-blue-500/10 flex items-center justify-center relative bg-[#0d0d0f] shadow-inner mb-3">
                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(59, 130, 246, 0.05)" strokeWidth="3" />
                                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${waterPercent}, 100`} />
                                                </svg>
                                                <div className="absolute flex flex-col items-center">
                                                    <Droplets className="w-5 h-5 text-blue-500" />
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Günlük Su</span>
                                            <h4 className="text-xl font-black mt-0.5">{water} <span className="text-[10px] font-bold text-gray-400">ML</span></h4>
                                            <span className="text-[9px] font-bold text-blue-400 mt-1">Hedef: {targetWater} ml</span>
                                        </div>

                                        {/* Food Ring Card */}
                                        <div className="bg-[#121215] border border-white/5 p-4 rounded-3xl flex flex-col items-center relative overflow-hidden">
                                            <div 
                                                className="absolute inset-x-0 bottom-0 bg-orange-500/5 transition-all duration-500" 
                                                style={{ height: `${foodPercent}%` }} 
                                            />
                                            <div className="w-16 h-16 rounded-full border-4 border-orange-500/10 flex items-center justify-center relative bg-[#0d0d0f] shadow-inner mb-3">
                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(249, 115, 22, 0.05)" strokeWidth="3" />
                                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${foodPercent}, 100`} />
                                                </svg>
                                                <div className="absolute flex flex-col items-center">
                                                    <Flame className="w-5 h-5 text-orange-500" />
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Günlük Kalori</span>
                                            <h4 className="text-xl font-black mt-0.5">{calories} <span className="text-[10px] font-bold text-gray-400">KCAL</span></h4>
                                            <span className="text-[9px] font-bold text-orange-400 mt-1">Hedef: {targetFood} kcal</span>
                                        </div>
                                    </div>

                                    {/* Interactive Water Logger */}
                                    <div className="bg-[#121215] border border-white/5 p-5 rounded-3xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                    <Droplets className="w-4 h-4" />
                                                </div>
                                                <h4 className="text-xs font-black uppercase tracking-wider">Hızlı Su Ekle</h4>
                                            </div>
                                            {water > 0 && (
                                                <button onClick={handleResetWater} className="text-[9px] font-black text-gray-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-1 transition-colors">
                                                    <RotateCcw className="w-3 h-3" /> Sıfırla
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { label: "150 ml", amount: 150 },
                                                { label: "250 ml", amount: 250 },
                                                { label: "500 ml", amount: 500 }
                                            ].map((btn, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleAddWater(btn.amount)}
                                                    data-testid={`water-add-${btn.amount}`}
                                                    className="bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-blue-400 font-black cursor-pointer group"
                                                >
                                                    <Plus className="w-4 h-4 text-blue-400/80 group-hover:scale-125 transition-transform" />
                                                    <span className="text-xs">{btn.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Interactive Meal Logger */}
                                    <div className="bg-[#121215] border border-white/5 p-5 rounded-3xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                                                    <Flame className="w-4 h-4" />
                                                </div>
                                                <h4 className="text-xs font-black uppercase tracking-wider">Hızlı Öğün Ekle</h4>
                                            </div>
                                            {calories > 0 && (
                                                <button onClick={handleClearMealLog} className="text-[9px] font-black text-gray-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-1 transition-colors">
                                                    <Trash2 className="w-3 h-3" /> Temizle
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {[
                                                { label: "Kuru Mama (ProPlan Somon)", kcal: 540, sub: "150 gr Porsiyon" },
                                                { label: "Yaş Konserve Mama", kcal: 300, sub: "100 gr Porsiyon" },
                                                { label: "Ödül Bisküvisi / Dental Stick", kcal: 80, sub: "1 adet" }
                                            ].map((meal, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleAddMeal(meal.kcal, meal.label)}
                                                    className="bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/10 p-3 rounded-2xl flex justify-between items-center text-left active:scale-[0.99] transition-all cursor-pointer group"
                                                >
                                                    <div>
                                                        <h5 className="text-xs font-black text-white group-hover:text-orange-400 transition-colors">{meal.label}</h5>
                                                        <span className="text-[9px] text-gray-500 font-bold mt-0.5 block">{meal.sub}</span>
                                                    </div>
                                                    <div className="bg-orange-500/15 text-orange-400 font-black text-[10px] px-2.5 py-1 rounded-xl">
                                                        +{meal.kcal} kcal
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Today's Log Feed */}
                                    {foodLog.length > 0 && (
                                        <div className="space-y-3">
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Bugünün Kayıtları</span>
                                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                                {foodLog.map((log) => (
                                                    <div key={log.id} className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                                                        <div className="text-left">
                                                            <p className="text-xs font-bold text-white/90">{log.name}</p>
                                                            <span className="text-[9px] text-gray-500 font-bold">{log.time}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-black text-orange-400">+{log.kcal} kcal</span>
                                                            <button 
                                                                onClick={() => handleDeleteMeal(log.id, log.kcal)}
                                                                data-testid={`delete-meal-${log.id}`}
                                                                className="text-white/30 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                                                                title="Kaydı Sil"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Link to advanced food and diet plans */}
                                    <button 
                                        onClick={() => { onClose(); router.push('/food'); }}
                                        className="w-full bg-[#121215] hover:bg-white/5 border border-white/5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-1.5 transition-all active:scale-98 mt-2"
                                    >
                                        <span>Gelişmiş Diyet Planı & Makroları Aç</span> <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}

                            {/* TAB 2: HEALTH & VACCINES */}
                            {activeTab === 'health' && (
                                <div className="space-y-6">
                                    {/* Pet Vital Statistics */}
                                    <div className="bg-[#121215] border border-white/5 p-5 rounded-3xl">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                                <Heart className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-wider">Hayati Değerler</h4>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            {/* Weight Widget */}
                                            <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center relative">
                                                <Scale className="text-cyan-400 mb-1" size={16} />
                                                
                                                {isEditingWeight ? (
                                                    <div className="flex flex-col items-center gap-1.5 mt-1 w-full">
                                                        <input 
                                                            type="text" 
                                                            placeholder={currentWeight}
                                                            value={weightInput}
                                                            onChange={(e) => setWeightInput(e.target.value)}
                                                            className="w-16 bg-[#1a1a1f] border border-white/10 text-center text-xs font-bold py-0.5 rounded-md outline-none text-white focus:border-cyan-500"
                                                        />
                                                        <div className="flex gap-1">
                                                            <button onClick={handleUpdateWeight} className="bg-cyan-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded">Kaydet</button>
                                                            <button onClick={() => setIsEditingWeight(false)} className="bg-white/5 text-[8px] font-bold px-1.5 py-0.5 rounded">İptal</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-sm font-black text-white italic">{currentWeight} <small className="text-[9px] not-italic opacity-55">kg</small></span>
                                                        <button 
                                                            onClick={() => { setWeightInput(currentWeight); setIsEditingWeight(true); }}
                                                            className="text-[8px] text-gray-500 hover:text-cyan-400 font-bold uppercase mt-1 flex items-center gap-0.5"
                                                        >
                                                            <Edit2 size={8} /> GÜNCELLE
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {/* Pulse Widget */}
                                            <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center">
                                                <Activity className="text-red-400 mb-1" size={16} />
                                                <span className="text-sm font-black text-white italic">82 <small className="text-[9px] not-italic opacity-55">bpm</small></span>
                                                <span className="text-[8px] text-gray-500 font-bold uppercase mt-1">Nabız</span>
                                            </div>

                                            {/* Age Widget */}
                                            <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center">
                                                <Sparkles className="text-yellow-400 mb-1" size={16} />
                                                <span className="text-sm font-black text-white italic">2.1 <small className="text-[9px] not-italic opacity-55">yıl</small></span>
                                                <span className="text-[8px] text-gray-500 font-bold uppercase mt-1">Yaş</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vaccine Timeline */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Aşı Takvimi</h4>
                                            <span className="text-[8px] font-black text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-full">TR Standart</span>
                                        </div>

                                        {isVaccinesLoading ? (
                                            <div className="flex justify-center py-8">
                                                <div className="animate-spin w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full" />
                                            </div>
                                        ) : schedule.length === 0 ? (
                                            <p className="text-xs text-gray-500 text-center py-4 uppercase font-bold">Kayıtlı aşı bulunamadı.</p>
                                        ) : (
                                            <div className="relative pl-6 space-y-6">
                                                {/* Line */}
                                                <div className="absolute left-[3px] top-2 bottom-2 w-[1px] bg-white/10" />

                                                {schedule.slice(0, 4).map((item) => {
                                                    const isCompleted = item.status === 'completed';
                                                    const daysLeft = Math.ceil((new Date(item.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                                                    const isOverdue = !isCompleted && daysLeft < 0;

                                                    return (
                                                        <div key={item.id} className="relative text-left">
                                                            {/* Timeline dot */}
                                                            <div className={cn(
                                                                "absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2",
                                                                isCompleted ? "bg-emerald-500 border-emerald-950" :
                                                                isOverdue ? "bg-red-500 border-red-950" : "bg-cyan-500 border-cyan-950 animate-pulse"
                                                            )} />

                                                            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex justify-between items-start gap-4">
                                                                <div>
                                                                    <h5 className="text-xs font-black text-white uppercase tracking-tight italic">{item.definition.name}</h5>
                                                                    <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase">
                                                                        {isCompleted ? `Uygulandı: ${item.dateAdministered}` : `Planlanan: ${item.dueDate}`}
                                                                    </p>
                                                                    {isCompleted && item.vetName && (
                                                                        <span className="text-[8px] text-emerald-400 font-bold mt-1 block uppercase">✓ Doğrulandı: {item.vetName}</span>
                                                                    )}
                                                                </div>

                                                                {isCompleted ? (
                                                                    <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Yapıldı</span>
                                                                ) : isOverdue ? (
                                                                    <div className="flex flex-col items-end gap-1.5">
                                                                        <span className="text-[8px] font-black text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Gecikti</span>
                                                                        <button 
                                                                            onClick={() => { markAsDone(item.id, todayStr, "Moffi Vet"); }}
                                                                            className="text-[7.5px] font-black bg-white text-black px-2 py-0.5 rounded hover:bg-white/80 active:scale-95 transition-all"
                                                                        >
                                                                            Tamamla
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[8px] font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">{daysLeft} gün kaldı</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <button 
                                            onClick={() => { onClose(); router.push('/vet'); }}
                                            className="w-full bg-[#121215] hover:bg-white/5 border border-white/5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-1.5 transition-all active:scale-98"
                                        >
                                            <span>Tüm Aşı Takvimini Aç</span> <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: VET & APPOINTMENTS */}
                            {activeTab === 'vet' && (
                                <div className="space-y-6 text-left">
                                    {/* Appointment list */}
                                    <div className="bg-[#121215] border border-white/5 p-5 rounded-3xl space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-wider">Randevularım</h4>
                                        </div>

                                        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                                            <div>
                                                <h5 className="text-xs font-black text-white uppercase italic">Yıllık Genel Kontrol</h5>
                                                <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase">Moda Veteriner Polikliniği</p>
                                                <p className="text-[9px] text-indigo-400 font-black mt-0.5 uppercase tracking-wide">19 Haziran 2026 • Cuma, 14:30</p>
                                            </div>
                                            <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Onaylandı</span>
                                        </div>
                                    </div>

                                    {/* Near Vet Clinics */}
                                    <div className="bg-[#121215] border border-white/5 p-5 rounded-3xl space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-wider">Yakın Klinikler</h4>
                                        </div>

                                        <div className="space-y-2">
                                            {[
                                                { name: "Pati Hayat 7/24 Klinik", dist: "450m", status: "Açık • Acil Servis" },
                                                { name: "Moda Vet Polikliniği", dist: "1.2km", status: "Açık • Uzman Ekip" }
                                            ].map((clinic, i) => (
                                                <div key={i} className="bg-white/[0.01] border border-white/5 p-3.5 rounded-2xl flex justify-between items-center">
                                                    <div>
                                                        <h5 className="text-xs font-black text-white/90 uppercase">{clinic.name}</h5>
                                                        <span className="text-[8.5px] text-emerald-400 font-black block mt-0.5 uppercase">{clinic.status}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-white italic">{clinic.dist}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Vetline call support */}
                                    <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-800/5 border border-indigo-500/20 p-5 rounded-3xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                                                <PhoneCall className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-black text-white uppercase italic leading-none">Vet-Line 7/24</h5>
                                                <p className="text-[8.5px] text-indigo-300 font-bold uppercase tracking-widest mt-1.5">Acil Görüntülü Destek</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => alert("Canlı destek başlatılıyor...")}
                                            className="bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl active:scale-95 transition-all cursor-pointer"
                                        >
                                            Bağlan
                                        </button>
                                    </div>

                                    {/* Link to clinic appointment page */}
                                    <button 
                                        onClick={() => { onClose(); router.push('/vet'); }}
                                        className="w-full bg-[#121215] hover:bg-white/5 border border-white/5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-1.5 transition-all active:scale-98 mt-2"
                                    >
                                        <span>Yeni Randevu Al & Yönet</span> <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}

                        </div>

                        {/* BOTTOM BANNER (AVERAGE PROGRESS INDICATOR) */}
                        <div className="p-4 bg-[#121215] border-t border-white/5 flex items-center justify-between text-left">
                            <div>
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Ortalama Günlük Durum</span>
                                <span className="text-sm font-black text-white italic uppercase mt-0.5 block">%{averageProgress} Tamamlandı</span>
                            </div>
                            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
                                {averageProgress === 100 ? "Harika Gün! 🎉" : "Devam Et! 🔥"}
                            </span>
                        </div>
                        <style>{`
                            @keyframes care-hub-wave {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
