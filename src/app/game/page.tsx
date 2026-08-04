"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap, Utensils, Gamepad2, Trophy, Coins, Brain, ChevronLeft, Crown, Sparkles, Star, Crosshair, ChevronDown, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePet } from "@/context/PetContext";
import { useQuestEngine } from "@/context/QuestEngineContext";
import FoodCatchGame from "@/components/game/FoodCatchGame";
import MoffiJumpGame from "@/components/game/MoffiJumpGame";
import PetMemoryGame from "@/components/game/PetMemoryGame";
import MoffiRunGame from "@/components/game/MoffiRunGame";
import { apiService as api } from "@/services/apiService";
import { GameModule } from "@/types/game";

// --- TYPES ---
interface PetStats {
    xp: number;
    level: number;
}
interface GameState {
    dailyPoints: number;
    lastPlayed: number;
}
const DAILY_POINT_CAP = 100;

export default function GamePage() {
    const router = useRouter();
    const { totalPatiPuan } = useQuestEngine(); 
    
    const [localCoins, setLocalCoins] = useState(totalPatiPuan || 2450);
    const [stats, setStats] = useState<PetStats>({ xp: 1250, level: 5 });
    const [feedback, setFeedback] = useState<{ type: string, value: string } | null>(null);
    const [gameState, setGameState] = useState<GameState>({ dailyPoints: 20, lastPlayed: Date.now() });
    const [activeMiniGame, setActiveMiniGame] = useState<'food-catch' | 'memory' | 'jump' | 'moffi-run' | null>(null);
    const { pets, activePet, switchPet } = usePet();
    const [showPetSelector, setShowPetSelector] = useState(false);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [gameModules, setGameModules] = useState<GameModule[]>([]);

    // Sync totalPatiPuan initially
    useEffect(() => {
        setLocalCoins(totalPatiPuan);
    }, [totalPatiPuan]);

    // Fetch dynamic data
    useEffect(() => {
        const loadGameData = async () => {
            const modules = await api.getGameModules();
            setGameModules(modules);

            const lb = await api.getPetLeaderboard(10);
            setLeaderboard(lb);
        };
        loadGameData();
    }, []);

    // Sync active pet stats
    useEffect(() => {
        if (activePet) {
            setStats({
                xp: activePet.xp || 0,
                level: activePet.level || 1
            });
        }
    }, [activePet]);

    const showFeedback = (text: string, emoji: string) => {
        setFeedback({ type: text, value: emoji });
        setTimeout(() => setFeedback(null), 2000);
    };

    const handleGameOver = async (score: number) => {
        const earnedPoints = Math.floor(score / 10);
        const remainingCap = DAILY_POINT_CAP - gameState.dailyPoints;
        const actualPoints = Math.min(earnedPoints, remainingCap);

        if (actualPoints > 0) {
            setGameState(prev => ({ ...prev, dailyPoints: prev.dailyPoints + actualPoints }));
            setLocalCoins(prev => prev + actualPoints);
            const xpEarned = actualPoints * 5;
            setStats(prev => ({ ...prev, xp: prev.xp + xpEarned }));
            showFeedback(`+ ${actualPoints} PT & +${xpEarned} XP!`, '🏆');

            // Send to real Supabase API
            if (activePet?.id) {
                await api.addPetScore(activePet.id, xpEarned, actualPoints);
            }
        } else {
            showFeedback(`Günlük Puan Limiti Doldu`, '🔒');
        }
        setTimeout(() => setActiveMiniGame(null), 1500);
    };

    // --- SUB-COMPONENTS ---
    const ArcadeHeader = () => {
        const xpProgress = (stats.xp % 1000) / 10; // Mock: 1000 XP per level

        return (
            <div className="relative w-full overflow-hidden rounded-[2.5rem] bg-[#111116] border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 mb-8 group">
                {/* Background Glows */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none group-hover:bg-fuchsia-600/30 transition-colors duration-700" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/20 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none group-hover:bg-cyan-600/30 transition-colors duration-700" />
                
                {/* Noise */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />

                <div className="relative z-10 flex flex-col gap-6">
                    {/* Top Row: User / Level */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg shadow-purple-500/20">
                                <div className="w-full h-full rounded-[1.1rem] overflow-hidden bg-black relative">
                                    <img src={activePet?.photos?.[0] || "/images/robot_moffi.jpg"} alt="Player" className="w-full h-full object-cover mix-blend-screen scale-125" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-black border border-white/10 rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
                                    <span className="text-[10px] font-black text-cyan-400">{stats.level}</span>
                                </div>
                            </div>
                            <div className="relative">
                                <div 
                                    className="flex items-center gap-2 cursor-pointer group/selector"
                                    onClick={() => pets?.length > 1 && setShowPetSelector(!showPetSelector)}
                                >
                                    <h2 className="font-black text-xl text-white tracking-tight group-hover/selector:text-cyan-400 transition-colors">{activePet?.name || "Oyuncu Moffi"}</h2>
                                    {pets?.length > 1 && (
                                        <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", showPetSelector && "rotate-180")} />
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="flex gap-0.5">
                                        {[1,2,3].map(i => <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />)}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pro Rank</span>
                                </div>

                                {/* PET SELECTOR DROPDOWN */}
                                <AnimatePresence>
                                    {showPetSelector && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            className="absolute top-8 left-0 bg-[#1a1a24] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 min-w-[200px]"
                                        >
                                            {pets.map((pet: any) => (
                                                <div 
                                                    key={pet.id}
                                                    onClick={() => { switchPet(pet.id); setShowPetSelector(false); }}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                                                        activePet?.id === pet.id ? "bg-cyan-500/10 border border-cyan-500/30" : "hover:bg-white/5 border border-transparent"
                                                    )}
                                                >
                                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-black">
                                                        <img src={pet.photos?.[0] || "/images/robot_moffi.jpg"} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="font-bold text-sm text-white flex-1">{pet.name}</span>
                                                    {activePet?.id === pet.id && <Check className="w-4 h-4 text-cyan-400" />}
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Total Coins Widget */}
                        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3 flex flex-col items-end shadow-inner">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Moffi Cüzdanı</span>
                            <div className="flex items-center gap-1.5">
                                <Coins className="w-5 h-5 text-amber-400 drop-shadow-md" />
                                <span className="text-2xl font-black text-white">{localCoins.toLocaleString('tr-TR')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Energy & Progress */}
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> Enerji Bitiyor
                                </span>
                                <span className="text-sm font-bold text-gray-300">
                                    Kalan Puan: <span className="text-white">{DAILY_POINT_CAP - gameState.dailyPoints}</span>
                                </span>
                            </div>
                            <span className="text-xs font-black text-gray-500">{stats.xp} / {stats.level * 1000} XP</span>
                        </div>
                        {/* Futuristic Progress Bar */}
                        <div className="w-full h-3 bg-black/50 border border-white/5 rounded-full overflow-hidden flex gap-1 p-[1px]">
                            {/* Segmented LED Bar effect */}
                            <div className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-1000" style={{ width: `${xpProgress}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const GamePoster = ({ title, desc, icon: Icon, color, difficulty, onClick }: any) => (
        <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="group relative h-48 md:h-56 rounded-[2rem] bg-[#111116] border border-white/5 overflow-hidden cursor-pointer shadow-lg"
        >
            {/* Poster Background Image / Gradient */}
            <div className={cn("absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 bg-gradient-to-br", color)} />
            
            {/* Cyberpunk grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20" />

            {/* Glowing Accent Line */}
            <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-50 group-hover:opacity-100 transition-opacity", color)} />

            <div className="relative z-10 w-full h-full p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-[1rem] bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-inner">
                        <Icon className="w-6 h-6 text-white drop-shadow-md" />
                    </div>
                    <div className="bg-black/50 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-[10px] font-black text-white">+10</span>
                    </div>
                </div>

                <div>
                    <div className="flex gap-1 mb-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={cn("w-3 h-1 rounded-full", i <= difficulty ? "bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]" : "bg-white/10")} />
                        ))}
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight mb-1 drop-shadow-lg">{title}</h3>
                    <p className="text-[11px] text-gray-400 font-medium line-clamp-2 leading-tight">{desc}</p>
                </div>
            </div>

            {/* Hover Play Icon Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-75 group-hover:scale-100 transition-transform duration-300">
                    <Gamepad2 className="w-6 h-6 ml-1" />
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#060608] text-white font-sans pb-32 overflow-x-hidden selection:bg-cyan-500/30">
            {/* Global Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-900/10 rounded-full blur-[120px]" />
            </div>

            {/* BACK BUTTON */}
            <button 
                onClick={() => window.history.length > 2 ? router.back() : router.push('/home')}
                className="fixed top-6 left-6 z-[60] w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.2rem] flex items-center justify-center hover:bg-white/10 hover:scale-105 active:scale-95 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.5)] group"
            >
                <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
            </button>

            {/* GAME MODALS */}
            <AnimatePresence>
                {activeMiniGame && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3, type: 'spring' }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl"
                    >
                        {activeMiniGame === 'food-catch' && <FoodCatchGame onGameOver={handleGameOver} onClose={() => setActiveMiniGame(null)} />}
                        {activeMiniGame === 'memory' && <PetMemoryGame 
                                onGameOver={handleGameOver} 
                                onClose={() => setActiveMiniGame(null)} 
                                userCoins={localCoins}
                                onSpendCoins={(amount) => {
                                    if (localCoins >= amount) {
                                        setLocalCoins(prev => prev - amount);
                                        return true;
                                    }
                                    return false;
                                }}
                            />}
                        {activeMiniGame === 'jump' && <MoffiJumpGame onGameOver={handleGameOver} onClose={() => setActiveMiniGame(null)} />}
                        {activeMiniGame === 'moffi-run' && (
                            <MoffiRunGame
                                onClose={() => setActiveMiniGame(null)}
                                onGameEnd={async (result) => {
                                    setLocalCoins(prev => prev + result.coins);
                                    setStats(prev => ({ ...prev, xp: prev.xp + result.score, level: prev.level }));
                                    showFeedback(`+${result.coins} Altın`, "🏆");
                                    
                                    if (activePet?.id) {
                                        await api.addPetScore(activePet.id, result.score, result.coins);
                                    }
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
                        initial={{ y: -100, opacity: 0 }} animate={{ y: 30, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
                        className="fixed top-0 left-1/2 -translate-x-1/2 z-[110] bg-gradient-to-r from-cyan-600 to-indigo-600 text-white px-8 py-4 rounded-2xl shadow-[0_20px_40px_rgba(8,145,178,0.4)] flex items-center gap-4 border border-white/20"
                    >
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl drop-shadow-md">
                            {feedback.value}
                        </div>
                        <span className="font-black tracking-wide">{feedback.type}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT */}
            <div className="relative z-10 pt-24 px-6 max-w-md mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    
                    <ArcadeHeader />

                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            <Crosshair className="w-5 h-5 text-cyan-400" /> Aktif Modüller
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        {gameModules.length > 0 ? (
                            gameModules.map(mod => {
                                // Map icon string to component dynamically or fallback
                                const IconComp = mod.icon_name === 'Brain' ? Brain : 
                                                 mod.icon_name === 'Zap' ? Zap : 
                                                 mod.icon_name === 'Gamepad2' ? Gamepad2 : Utensils;
                                                 
                                return (
                                    <GamePoster
                                        key={mod.id}
                                        onClick={() => setActiveMiniGame(mod.game_key as any)}
                                        title={mod.title}
                                        desc={mod.description}
                                        icon={IconComp}
                                        color={mod.color_gradient || "from-fuchsia-500 to-indigo-600"}
                                        difficulty={mod.difficulty}
                                    />
                                );
                            })
                        ) : (
                            <div className="col-span-2 text-center text-sm text-gray-500 py-10">
                                Yükleniyor... Veya hiç modül bulunamadı.
                            </div>
                        )}
                    </div>

                    {/* LEADERBOARD */}
                    <div className="bg-[#111116] border border-white/5 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        {/* Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-amber-500/20 transition-colors" />

                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h3 className="font-black text-xl text-white flex items-center gap-2 drop-shadow-md">
                                <Trophy className="w-6 h-6 text-amber-400" />
                                Top Petler
                            </h3>
                            <button className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full">Bu Hafta</button>
                        </div>
                        
                        <div className="space-y-3 relative z-10">
                            {leaderboard.length > 0 ? (
                                leaderboard.map((user, idx) => (
                                    <div key={user.id} className={cn("flex items-center gap-4 p-3 rounded-2xl border transition-colors", idx === 0 ? 'bg-amber-400/10 border-amber-400/20' : 'border-transparent hover:bg-white/5')}>
                                        <div className={cn("font-black text-lg w-5 text-center", idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-gray-500')}>
                                            {idx + 1}
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-black/50 overflow-hidden flex items-center justify-center text-2xl border border-white/5 shadow-inner relative">
                                            {user.avatar ? (
                                                <img src={user.avatar} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>🐾</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-sm text-white tracking-wide">{user.name}</h4>
                                            <span className="text-[10px] text-gray-400 font-bold tracking-widest flex items-center mt-0.5">Sahibi: {user.ownerName}</span>
                                        </div>
                                        <div className="font-black text-lg text-white font-mono tracking-tighter">
                                            {user.score.toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-sm text-gray-500 py-4">Liderlik tablosu yükleniyor...</div>
                            )}
                        </div>
                    </div>

                </motion.div>
            </div>
        </div>
    );
}
