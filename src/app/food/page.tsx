"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, Settings, Plus, Utensils,
    Flame, Droplets, ScanBarcode, Share2, Award, Zap, ArrowRight
} from "lucide-react";
import { NutritionRing } from "@/components/food/NutritionRing";
import { WaterTracker } from "@/components/food/WaterTracker";
import { MealLoggerModal } from "@/components/food/MealLoggerModal";
import { DietSetupWizard, NutritionPlan } from "@/components/food/DietSetupWizard";
import { MacroChart } from "@/components/food/MacroChart";
import { MoffiPantry } from "@/components/food/MoffiPantry";
import { FoodGradeCard } from "@/components/food/FoodGradeCard";
import { SmartMealCard, SmartMealProps } from "@/components/food/SmartMealCard"; // NEW
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PetSwitcher } from "@/components/common/PetSwitcher";

export default function FoodPage() {
    const router = useRouter();

    // CONTEXT (MOCK)
    const dailyActivity = { distance: 6.2, goal: 5.0 }; // km
    const isHighActivity = dailyActivity.distance > dailyActivity.goal;

    // STATE
    const [plan, setPlan] = useState<NutritionPlan | null>(null);
    const [showWizard, setShowWizard] = useState(false); // Default false, wait for check
    const [isLoading, setIsLoading] = useState(true); // Loading state for persistence check

    // SMART MEALS STATE
    const [smartMeals, setSmartMeals] = useState<SmartMealProps[]>([
        {
            id: 'm1', type: 'Sabah', status: 'done',
            suggestion: { foodName: "ProPlan Somon", amount: 150, calories: 540 },
            onComplete: () => { },
            onSkip: () => { }
        },
        {
            id: 'm2', type: 'Akşam', status: 'pending',
            suggestion: {
                foodName: "ProPlan Somon",
                amount: isHighActivity ? 180 : 150,
                calories: isHighActivity ? 650 : 540,
                reason: isHighActivity ? "Bugün çok koştu, ekstra protein! ⚡" : undefined
            },
            onComplete: () => { },
            onSkip: () => { }
        },
        {
            id: 'm3', type: 'Ödül', status: 'pending',
            suggestion: {
                foodName: "Dental Stick",
                amount: 1,
                calories: 80,
                reason: "Diş sağlığı için önerilen"
            },
            onComplete: () => { },
            onSkip: () => { }
        }
    ]);

    const [calories, setCalories] = useState(540);

    // PERSISTENCE CHECK
    useEffect(() => {
        const savedPlan = localStorage.getItem('moffi_nutrition_plan');
        if (savedPlan) {
            setPlan(JSON.parse(savedPlan));
            setShowWizard(false);
        } else {
            setShowWizard(true); // Show wizard if no plan found
        }
        setIsLoading(false);
    }, []);

    const handlePlanComplete = (newPlan: NutritionPlan) => {
        setPlan(newPlan);
        localStorage.setItem('moffi_nutrition_plan', JSON.stringify(newPlan)); // SAVE TO STORAGE
        setShowWizard(false);
    };

    const handleMealAction = (id: string, action: 'complete' | 'skip') => {
        setSmartMeals(prev => prev.map(m => {
            if (m.id === id) {
                if (action === 'complete') {
                    if (m.status !== 'done') {
                        setCalories(c => c + m.suggestion.calories);
                    }
                    return { ...m, status: 'done' };
                }
                return { ...m, status: 'skipped' };
            }
            return m;
        }));
    };

    const handleManualAdd = (kcal: number, type: string) => {
        setCalories(prev => prev + kcal);
    };
    const [isMealModalOpen, setIsMealModalOpen] = useState(false);

    // LOADING SCREEN
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F8F9FC] dark:bg-black flex items-center justify-center">
                <div className="animate-pulse text-green-500 font-bold">Moffi Nutrition Loading...</div>
            </div>
        );
    }

    // WIZARD
    if (showWizard) {
        return <DietSetupWizard onComplete={handlePlanComplete} />;
    }

    // MAIN DASHBOARD
    return (
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-black pb-32 font-sans">



            {/* HEADER */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => router.push('/community')} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200"><ChevronLeft className="w-6 h-6" /></button>
                    <div className="text-center">
                        <h1 className="text-xl font-black text-gray-900 dark:text-white">Beslenme Koçu</h1>
                        <p className="text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full inline-block">SMART PLAN</p>
                    </div>
                    {/* Replaced Settings with PetSwitcher for better context */}
                    <div className="scale-90 origin-right">
                        <PetSwitcher mode="compact" />
                    </div>
                </div>
            </header>

            <main className="px-6 py-6 space-y-8">

                {/* 1. NUTRITION RING (HERO) */}
                <section className="flex flex-col items-center justify-center relative">
                    <div className="absolute top-0 right-0">
                        <Award className="w-8 h-8 text-amber-400 drop-shadow-lg" />
                    </div>
                    <NutritionRing
                        calories={calories}
                        target={isHighActivity ? (plan?.dailyTarget || 1200) + 110 : (plan?.dailyTarget || 1200)}
                        burned={450}
                    />

                    {/* CONTEXT BANNER */}
                    {isHighActivity && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mt-6 w-full bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl flex items-center gap-3 border border-indigo-100 dark:border-indigo-500/30 shadow-sm"
                        >
                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/30">
                                <Zap className="w-5 h-5 fill-current" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-100">Yüksek Aktivite Bonusu</h4>
                                <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">
                                    Bugün hedefi aştınız ({dailyActivity.distance}km). Akşam öğünü güçlendirildi! (+110 kcal)
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* MANUAL ADD BUTTONS */}
                    <div className="flex gap-4 mt-6 w-full opacity-60 hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setIsMealModalOpen(true)}
                            className="flex-1 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 text-gray-600 dark:text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Manuel Ekle
                        </button>
                    </div>
                </section>

                {/* 2. SMART MEAL FEED (Replacing old list) */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Mochi'nin Menüsü</h3>
                        <div className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                            <Utensils className="w-3 h-3" /> Bugün
                        </div>
                    </div>

                    <div className="space-y-4">
                        {smartMeals.map(meal => (
                            <SmartMealCard
                                key={meal.id}
                                {...meal}
                                onComplete={(id) => handleMealAction(id, 'complete')}
                                onSkip={(id) => handleMealAction(id, 'skip')}
                            />
                        ))}
                    </div>
                </section>

                {/* 3. FOOD HUB */}
                <section className="grid grid-cols-1 gap-6">
                    <MoffiPantry />
                    <FoodGradeCard />
                </section>

                {/* 4. METRICS */}
                <section>
                    <MacroChart macros={plan?.macros || { protein: 30, fat: 20, carbs: 50 }} />
                </section>

                <section>
                    <WaterTracker />
                </section>
            </main>

            <MealLoggerModal
                isOpen={isMealModalOpen}
                onClose={() => setIsMealModalOpen(false)}
                onAddMeal={handleManualAdd}
            />

        </div>
    );
}
