"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart, Zap, Utensils, Moon, Gamepad2, Trophy, Sparkles, Coins, Plus,
    Flame, Timer, Brain, Award, ChevronRight, Lock, Star,
    ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import FoodCatchGame from "@/components/game/FoodCatchGame";
import MoffiJumpGame from "@/components/game/MoffiJumpGame";
import PetMemoryGame from "@/components/game/PetMemoryGame";
import VetEscapeGame from "@/components/game/VetEscapeGame";
import MoffiRunGame from "@/components/game/MoffiRunGame";

// --- TYPES ---
interface PetStats {
    hunger: number;
    happiness: number;
    energy: number;
    xp: number;
    level: number;
}

interface GameState {
    dailyPoints: number;
    bgStreak: number;
    lastPlayed: number;
}

// --- CONSTANTS ---
const DAILY_POINT_CAP = 100;

export default function GamePage() {
    const router = useRouter();
    // PET STATE
    const [stats, setStats] = useState<PetStats>({
        hunger: 80, happiness: 90, energy: 100, xp: 1250, level: 5
    });
    const [petState, setPetState] = useState<'idle' | 'eating' | 'happy' | 'sleeping'>('idle');
    const [feedback, setFeedback] = useState<{ type: string, value: string } | null>(null);

    // ECONOMY & ARENA STATE
    const [coins, setCoins] = useState(2450);
    const [gameState, setGameState] = useState<GameState>({
        dailyPoints: 20, // Mock initial
        bgStreak: 5,
        lastPlayed: Date.now()
    });

    // NEW PRE-GAME / IN-GAME STATE
    const [activeMiniGame, setActiveMiniGame] = useState<'food-catch' | 'memory' | 'jump' | 'moffi-run' | null>(null);

    // UI STATE
    const [activeTab, setActiveTab] = useState<'home' | 'arena'>('arena'); // Default to Arena for demo

    // --- LOGIC: PERSISTENCE & OFFLINE ---
    useEffect(() => {
        const savedData = localStorage.getItem('moffi_pet_state');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            setStats(parsed.stats || stats);
            setCoins(parsed.coins || coins);
            if (parsed.gameState) {
                // Check if new day for daily limit reset
                const lastPlayed = new Date(parsed.gameState.lastPlayed);
                const today = new Date();
                if (lastPlayed.getDate() !== today.getDate()) {
                    setGameState({ ...parsed.gameState, dailyPoints: 0, lastPlayed: Date.now() });
                } else {
                    setGameState(parsed.gameState);
                }
            }
        }
    }, []);

    // Save on change
    useEffect(() => {
        localStorage.setItem('moffi_pet_state', JSON.stringify({
            stats, coins, gameState, lastSeen: Date.now()
        }));
    }, [stats, coins, gameState]);

    // --- ACTIONS ---
    const showFeedback = (text: string, emoji: string) => {
        setFeedback({ type: text, value: emoji });
        setTimeout(() => setFeedback(null), 1500);
    };

    const handleGameOver = (score: number) => {
        // Simple point calculation logic based on game type could be added here
        // For now, raw score / 10 is the base
        const earnedPoints = Math.floor(score / 10);

        // Cap logic
        const remainingCap = DAILY_POINT_CAP - gameState.dailyPoints;
        const actualPoints = Math.min(earnedPoints, remainingCap);

        if (actualPoints > 0) {
            setGameState(prev => ({
                ...prev,
                dailyPoints: prev.dailyPoints + actualPoints
            }));
            setCoins(prev => prev + actualPoints);

            // Add XP to Pet (Plan: "Oyun > XP > Pet level sistemi")
            setStats(prev => ({
                ...prev,
                xp: prev.xp + (actualPoints * 5)
            }));

            showFeedback(`+ ${actualPoints} Puan & +${actualPoints * 5} XP!`, '🏆');
        } else {
            showFeedback(`Günlük Limit Doldu`, '🔒');
        }

        setTimeout(() => setActiveMiniGame(null), 1500); // Small delay to show feedback
    };

    // --- COMPONENTS ---

    // 1. ARENA HEADER (New Plan: Avatar + Daily Limit)
    const ArenaHeader = () => (
        <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2D2D2D] p-6 rounded-[2rem] shadow-xl relative overflow-hidden mb-8 text-white">
            <div className="relative z-10 flex items-center justify-between">
                {/* Pet Avatar & Status */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-[#5B4D9D] overflow-hidden bg-white">
                            <img src="/images/game_mascot.jpg" alt="Pet" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-[#2D2D2D]" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">Moffi</h2>
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span>Seviye {stats.level}</span>
                        </div>
                    </div>
                </div>

                {/* Daily Limit - The Core Focus */}
                <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Bugün Oynayabilirsin</div>
                    <div className="text-3xl font-black text-white flex items-center justify-end gap-2">
                        {DAILY_POINT_CAP - gameState.dailyPoints}
                        <span className="text-sm font-bold text-[#5B4D9D]">Puan</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="h-1.5 w-24 bg-white/10 rounded-full ml-auto mt-2 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                            style={{ width: `${((DAILY_POINT_CAP - gameState.dailyPoints) / DAILY_POINT_CAP) * 100}% ` }}
                        />
                    </div>
                </div>
            </div>

            {/* Decor */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#5B4D9D] rounded-full blur-[80px] opacity-20 -mr-10 -mt-10 pointer-events-none" />
        </div>
    );

    // 2. GAME CARD (New Plan: Big Icon, Quick Desc, Difficulty, Reward)
    const GameCard = ({ title, desc, icon: Icon, color, difficulty, onClick }: any) => (
        <div
            onClick={onClick}
            className="group relative bg-white dark:bg-[#1A1A1A] p-5 rounded-[2rem] shadow-lg border border-gray-100 dark:border-white/5 overflow-hidden active:scale-[0.98] transition-all cursor-pointer hover:border-[#5B4D9D]/30"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200/50", color)}>
                    <Icon className="w-7 h-7" />
                </div>
                <div className="flex flex-col items-end">
                    <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 font-bold text-xs rounded-lg mb-1 flex items-center gap-1">
                        +10 <span className="text-[9px]">PUAN</span>
                    </span>
                    <div className="flex gap-0.5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i <= difficulty ? "bg-[#5B4D9D]" : "bg-gray-200")} />
                        ))}
                    </div>
                </div>
            </div>

            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">{desc}</p>

            {/* Hover Effect */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100 group-hover:bg-[#5B4D9D] transition-colors" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-black font-sans pb-32">

            {/* BACK BUTTON */}
            <button 
                onClick={() => {
                    if (window.history.length > 2) {
                        router.back();
                    } else {
                        router.push('/community');
                    }
                }} 
                className="fixed top-6 left-6 z-[60] w-12 h-12 bg-white/20 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
                <ChevronLeft className="w-6 h-6 text-gray-800 dark:text-white" />
            </button>

            {/* GAME MODALS */}
            <AnimatePresence>
                {activeMiniGame && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100]"
                    >
                        {activeMiniGame === 'food-catch' && (
                            <FoodCatchGame onGameOver={handleGameOver} onClose={() => setActiveMiniGame(null)} />
                        )}
                        {activeMiniGame === 'memory' && (
                            <PetMemoryGame onGameOver={handleGameOver} onClose={() => setActiveMiniGame(null)} />
                        )}
                        {activeMiniGame === 'jump' && (
                            <MoffiJumpGame onGameOver={handleGameOver} onClose={() => setActiveMiniGame(null)} />
                        )}
                        {activeMiniGame === 'moffi-run' && (
                            <MoffiRunGame
                                onClose={() => setActiveMiniGame(null)}
                                onGameEnd={(result) => {
                                    // 1. UPDATE COINS
                                    setCoins(prev => prev + result.coins);

                                    // 2. UPDATE XP & HAPPINESS
                                    const xpGain = Math.floor(result.score / 2) + (result.missionsCompleted * 50);
                                    setStats(prev => ({
                                        ...prev,
                                        xp: prev.xp + xpGain,
                                        happiness: Math.min(100, prev.happiness + 5),
                                        energy: Math.max(0, prev.energy - 10) // Running tires you out
                                    }));

                                    // 3. AI DIARY TRIGGER (Simulated)
                                    if (result.score > 500) {
                                        setTimeout(() => {
                                            showFeedback("Moffi'nin Günlüğüne Eklendi: 'Bugün harika koştum!'", "📝");
                                        }, 2000);
                                    }

                                    showFeedback(`+${result.coins} Altın, +${xpGain} XP`, "🏆");
                                }}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FEEDBACK TOAST */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
                        className="fixed top-0 left-1/2 -translate-x-1/2 z-[110] bg-black text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3"
                    >
                        <span className="text-2xl">{feedback.value}</span>
                        <span className="font-bold">{feedback.type}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TOP NAVIGATION TOGGLE */}
            <div className="sticky top-0 z-30 bg-[#F8F9FC]/80 dark:bg-black/80 backdrop-blur-xl p-4 flex justify-center border-b border-gray-200/50 dark:border-white/5">
                <div className="bg-white dark:bg-[#1A1A1A] p-1 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 flex p-1">
                    <button onClick={() => setActiveTab('home')} className={cn("px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2", activeTab === 'home' ? "bg-black dark:bg-white text-white dark:text-black shadow-lg" : "text-gray-500")}>
                        <Heart className="w-3.5 h-3.5" /> Evim
                    </button>
                    <button onClick={() => setActiveTab('arena')} className={cn("px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2", activeTab === 'arena' ? "bg-black dark:bg-white text-white dark:text-black shadow-lg" : "text-gray-500")}>
                        <Gamepad2 className="w-3.5 h-3.5" /> Arena
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="p-6 max-w-md mx-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'home' ? (
                        <motion.div key="home" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="text-center py-20">
                            <div className="w-48 h-48 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-6">
                                <span className="text-4xl">🐶</span>
                            </div>
                            <h2 className="text-2xl font-black mb-2">Moffi Evde</h2>
                            <p className="text-gray-500 mb-8">Tamagotchi modülü ile petinle ilgilen.</p>
                            <button onClick={() => setActiveTab('arena')} className="px-8 py-3 bg-[#5B4D9D] text-white rounded-xl font-bold">Oyunlara Git</button>
                        </motion.div>
                    ) : (
                        <motion.div key="arena" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <ArenaHeader />

                            <div className="grid grid-cols-1 gap-4 mb-8">
                                <GameCard
                                    onClick={() => setActiveMiniGame('food-catch')}
                                    title="Mama Yakala"
                                    desc="Reflekslerini konuştur! 30 saniye içinde zehirli mantarlara dokunmadan sağlıklı mamaları topla."
                                    icon={Utensils}
                                    color="bg-gradient-to-br from-orange-400 to-red-500"
                                    difficulty={1}
                                />
                                <GameCard
                                    onClick={() => setActiveMiniGame('memory')}
                                    title="Pet Memory"
                                    desc="Hafızanı zorla! 60 saniye içinde kartları eşleştir ve bonus puanları kap."
                                    icon={Brain}
                                    color="bg-gradient-to-br from-blue-400 to-indigo-500"
                                    difficulty={2}
                                />
                                <GameCard
                                    onClick={() => setActiveMiniGame('jump')}
                                    title="Moffi Jump"
                                    desc="Zıpla ve kazan! Engellere takılmadan en yükseğe çık ve stickerları topla."
                                    icon={Zap}
                                    color="bg-gradient-to-br from-purple-400 to-pink-500"
                                    difficulty={3}
                                />
                                <GameCard
                                    onClick={() => setActiveMiniGame('moffi-run')}
                                    title="Moffi Run"
                                    desc="Koşmaya başla! Engellerden kaç, PawCoin'leri topla ve en yüksek skoru yap."
                                    icon={Gamepad2}
                                    color="bg-gradient-to-br from-yellow-400 to-orange-500"
                                    difficulty={2}
                                />
                            </div>

                            {/* LEADERBOARD */}
                            <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-yellow-500" />
                                        Haftalık Liderler
                                    </h3>
                                    <button className="text-xs font-bold text-[#5B4D9D]">Tümünü Gör</button>
                                </div>
                                <div className="space-y-4">
                                    {/* Mock Residents */}
                                    {[
                                        { name: 'MoffiOfficial', score: 2450, img: '🐶' },
                                        { name: 'ZeytinTheCat', score: 2100, img: '🐱' },
                                        { name: 'Boncuk123', score: 1850, img: '🦜' },
                                        { name: 'Mars', score: 1640, img: '🐕' },
                                        { name: 'Luna', score: 1420, img: '🐈' },
                                    ].map((user, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="font-black text-gray-300 w-4 text-center">{i + 1}</div>
                                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-lg shadow-sm border border-gray-100">
                                                {user.img}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{user.name}</h4>
                                                {i < 3 && <span className="text-[10px] text-gray-500 font-bold bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 px-2 py-0.5 rounded">Pro Oyuncu</span>}
                                            </div>
                                            <div className="font-black text-gray-900 dark:text-white">{user.score}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
