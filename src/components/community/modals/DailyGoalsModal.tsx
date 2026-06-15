"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Navigation, Droplets, Flame, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyGoalsModalProps {
    isOpen: boolean;
    onClose: () => void;
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
    onNavigateToFood: () => void;
}

export function DailyGoalsModal({
    isOpen,
    onClose,
    petName,
    activityPercent,
    activityCurrent,
    activityTarget,
    waterPercent,
    waterCurrent,
    waterTarget,
    foodPercent,
    foodCurrent,
    foodTarget,
    onNavigateToFood
}: DailyGoalsModalProps) {

    const handleStartWalk = () => {
        onClose();
        // Dispatch global event to open walk tracker drawer
        window.dispatchEvent(new CustomEvent('open-walk-panel'));
    };

    const handleGoToFoodPage = () => {
        onClose();
        onNavigateToFood();
    };

    const goals = [
        {
            title: "Günlük Gezi (Mesafe)",
            current: `${activityCurrent.toFixed(2)} KM`,
            target: `${activityTarget.toFixed(1)} KM`,
            percent: activityPercent,
            color: "bg-green-500",
            textColor: "text-green-600 dark:text-green-400",
            bgColor: "bg-green-50 dark:bg-green-950/20",
            borderColor: "border-green-100 dark:border-green-900/30",
            icon: Navigation,
            iconColor: "text-green-600 dark:text-green-400",
            actionLabel: "Yürüyüşü Başlat",
            actionClick: handleStartWalk
        },
        {
            title: "Günlük Su Tüketimi",
            current: `${waterCurrent} ML`,
            target: `${waterTarget} ML`,
            percent: waterPercent,
            color: "bg-blue-500",
            textColor: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-50 dark:bg-blue-950/20",
            borderColor: "border-blue-100 dark:border-blue-900/30",
            icon: Droplets,
            iconColor: "text-blue-600 dark:text-blue-400",
            actionLabel: "Su Ekle & Detaylar",
            actionClick: handleGoToFoodPage
        },
        {
            title: "Günlük Kalori Tüketimi",
            current: `${foodCurrent} KCAL`,
            target: `${foodTarget} KCAL`,
            percent: foodPercent,
            color: "bg-orange-500",
            textColor: "text-orange-600 dark:text-orange-400",
            bgColor: "bg-orange-50 dark:bg-orange-950/20",
            borderColor: "border-orange-100 dark:border-orange-900/30",
            icon: Flame,
            iconColor: "text-orange-600 dark:text-orange-400",
            actionLabel: "Beslenme Koçu",
            actionClick: handleGoToFoodPage
        }
    ];

    // Calculate overall average progress
    const averageProgress = Math.round((activityPercent + waterPercent + foodPercent) / 3);

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

                    {/* Modal Container */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 m-auto w-[90%] max-w-md h-fit max-h-[90vh] overflow-y-auto no-scrollbar bg-background border border-card-border rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] z-[9999] text-foreground p-6"
                    >
                        {/* Close button */}
                        <button 
                            onClick={onClose}
                            className="absolute top-5 right-5 w-8 h-8 bg-foreground/5 rounded-full flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-colors z-20"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col items-center text-center mt-2">
                            {/* Icon decoration */}
                            <div className="w-16 h-16 rounded-[1.8rem] bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 mb-4">
                                <Trophy className="w-8 h-8 text-white" />
                            </div>

                            <h3 className="text-xl font-black tracking-tight">{petName}'in Günlük Hedefleri</h3>
                            <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Bugünün Özet Durumu</p>

                            {/* Overall progress ring representation or bar */}
                            <div className="w-full mt-6 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-between">
                                <div className="text-left">
                                    <span className="text-xs font-black text-gray-400 block uppercase tracking-wider">Toplam Başarı</span>
                                    <span className="text-2xl font-black text-gray-800 dark:text-white mt-1 block">%{averageProgress} Tamamlandı</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2.5 py-1 rounded-full">
                                        {averageProgress === 100 ? "Harika Gün! 🎉" : "Harika Gidiyorsun! 🔥"}
                                    </span>
                                </div>
                            </div>

                            {/* Individual Goal Bars */}
                            <div className="w-full space-y-4.5 mt-6">
                                {goals.map((goal, idx) => {
                                    const Icon = goal.icon;
                                    return (
                                        <div 
                                            key={idx} 
                                            className={cn(
                                                "p-4 rounded-2xl border text-left flex flex-col gap-3 transition-colors",
                                                goal.bgColor,
                                                goal.borderColor
                                            )}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-black/40 flex items-center justify-center shadow-sm">
                                                        <Icon className={cn("w-4.5 h-4.5", goal.iconColor)} />
                                                    </div>
                                                    <span className="text-[11.5px] font-black text-gray-700 dark:text-white/80">{goal.title}</span>
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-400">
                                                    <strong className="text-gray-700 dark:text-white">{goal.current}</strong> / {goal.target}
                                                </span>
                                            </div>

                                            {/* Progress track */}
                                            <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${goal.percent}%` }}
                                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                                    className={cn("h-full rounded-full", goal.color)}
                                                />
                                            </div>

                                            {/* Action Button inside row */}
                                            <div className="flex justify-between items-center mt-1">
                                                <span className={cn("text-[10px] font-bold", goal.textColor)}>
                                                    %{goal.percent} Tamamlandı
                                                </span>
                                                <button 
                                                    onClick={goal.actionClick}
                                                    className="flex items-center gap-1 text-[9.5px] font-black text-gray-800 dark:text-white bg-white dark:bg-white/10 px-3 py-1.5 rounded-xl shadow-sm hover:bg-gray-100 hover:shadow transition-all border border-gray-100 dark:border-transparent active:scale-95 cursor-pointer"
                                                >
                                                    <span>{goal.actionLabel}</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-[9.5px] text-gray-400 mt-6 font-bold uppercase tracking-wider">
                                Hedefler biyolojik ve sağlık verilerine dayanmaktadır.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
