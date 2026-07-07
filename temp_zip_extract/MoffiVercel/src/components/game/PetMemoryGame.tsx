"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Timer, X, Star, ArrowRight, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameProps {
    onGameOver: (score: number) => void;
    onClose: () => void;
}

// LEVELS CONFIGURATION
const LEVELS = [
    { level: 1, cols: 3, pairs: 6, time: 60, name: "Kolay Başlangıç" }, // 12 Cards
    { level: 2, cols: 4, pairs: 8, time: 50, name: "Orta Seviye" },    // 16 Cards
    { level: 3, cols: 4, pairs: 10, time: 45, name: "Zorlu Yarış" }     // 20 Cards
];

// ASSETS
const ALL_IMAGES = [
    "/images/memory/pet1.jpg",
    "/images/memory/pet2.jpg",
    "/images/memory/pet3.jpg",
    "/images/memory/pet4.jpg",
    "/images/memory/pet5.jpg",
    // Fallback/Extra for higher levels (User only provided 5, we need 10 for max level)
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1552728089-57bdde30ebd8?w=400&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1585110396000-c9a96db5b156?w=400&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=400&fit=crop&q=80",
];

export default function PetMemoryGame({ onGameOver, onClose }: GameProps) {
    // STATE
    const [currentLevel, setCurrentLevel] = useState(1);
    const [cards, setCards] = useState<{ id: number, pairId: number, content: string, isFlipped: boolean, isMatched: boolean }[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matches, setMatches] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameState, setGameState] = useState<'playing' | 'level_complete' | 'game_complete' | 'gameover'>('playing');
    const [totalScore, setTotalScore] = useState(0);

    // INIT LEVEL
    useEffect(() => {
        initializeLevel(currentLevel);
    }, [currentLevel]);

    // GAME LOOP (Timer)
    useEffect(() => {
        if (gameState !== 'playing') return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setGameState('gameover');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState]);

    const initializeLevel = (level: number) => {
        const config = LEVELS[level - 1];
        // Select random pairs for this level
        const selectedImages = [...ALL_IMAGES].slice(0, config.pairs);
        // Note: If we run out of images in ALL_IMAGES, slice handles it safely, 
        // but let's ensure we have enough. We have 10 images, max pairs is 10. Perfect.

        // Create card deck
        const deck = [...selectedImages, ...selectedImages]
            .sort(() => Math.random() - 0.5)
            .map((img, index) => ({
                id: index,
                pairId: selectedImages.indexOf(img),
                content: img,
                isFlipped: false,
                isMatched: false
            }));

        setCards(deck);
        setFlippedIndices([]);
        setMatches(0);
        setTimeLeft(config.time);
        setGameState('playing');
    };

    const handleCardClick = (index: number) => {
        if (
            gameState !== 'playing' ||
            cards[index].isFlipped ||
            cards[index].isMatched ||
            flippedIndices.length >= 2
        ) return;

        // Flip Logic
        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        // Check Match
        if (newFlipped.length === 2) {
            const [idx1, idx2] = newFlipped;

            if (newCards[idx1].content === newCards[idx2].content) {
                // MATCH
                setTimeout(() => {
                    const matchedCards = [...newCards];
                    matchedCards[idx1].isMatched = true;
                    matchedCards[idx2].isMatched = true;
                    setCards(matchedCards);
                    setFlippedIndices([]);

                    setMatches(m => {
                        const newMatches = m + 1;
                        const config = LEVELS[currentLevel - 1];
                        if (newMatches === config.pairs) {
                            handleLevelComplete();
                        }
                        return newMatches;
                    });
                    setTotalScore(s => s + 10);
                }, 500);
            } else {
                // NO MATCH
                setTimeout(() => {
                    const resetCards = [...newCards];
                    resetCards[idx1].isFlipped = false;
                    resetCards[idx2].isFlipped = false;
                    setCards(resetCards);
                    setFlippedIndices([]);
                }, 1000);
            }
        }
    };

    const handleLevelComplete = () => {
        // Bonus calc
        const timeBonus = timeLeft * 2;
        setTotalScore(s => s + timeBonus);

        if (currentLevel < LEVELS.length) {
            setGameState('level_complete');
        } else {
            setGameState('game_complete');
        }
    };

    const nextLevel = () => {
        setCurrentLevel(prev => prev + 1);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F0F4F8] flex flex-col items-center justify-center font-sans overflow-hidden">

            {/* BACKGROUND */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#e0e7ff,transparent)]" />
            <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-200 rounded-full blur-3xl opacity-40 mix-blend-multiply animate-blob" />
            <div className="absolute top-10 left-10 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-40 mix-blend-multiply animate-blob animation-delay-2000" />

            {/* HEADER */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
                <button onClick={onClose} className="bg-card p-2 rounded-xl shadow-moffi-card hover:bg-gray-50 transition">
                    <X className="w-6 h-6 text-gray-400" />
                </button>

                <div className="flex gap-3">
                    <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-white/50 shadow-sm flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Level</span>
                        <span className="text-xl font-black text-[#5B4D9D]">{currentLevel}</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-white/50 shadow-sm flex items-center gap-2">
                        <Timer className={cn("w-5 h-5", timeLeft < 10 ? "text-red-500 animate-pulse" : "text-blue-500")} />
                        <span className="font-black text-xl text-foreground">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-white/50 shadow-sm flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="font-black text-xl text-foreground">{totalScore}</span>
                    </div>
                </div>
            </div>

            {/* GAME GRID */}
            <div className="relative z-10 w-full max-w-lg px-6 h-[70vh] flex items-center justify-center">
                <div
                    className="grid gap-3 w-full"
                    style={{ gridTemplateColumns: `repeat(${LEVELS[currentLevel - 1].cols}, 1fr)` }}
                >
                    {cards.map((card, index) => (
                        <div key={`${currentLevel}-${card.id}`} className="aspect-square relative perspective-1000" onClick={() => handleCardClick(index)}>
                            <div className={cn(
                                "w-full h-full relative preserve-3d transition-all duration-500 cursor-pointer rounded-2xl shadow-sm",
                                card.isFlipped || card.isMatched ? "rotate-y-180" : "bg-card border-b-4 border-card-border hover:-translate-y-1",
                                card.isMatched && "opacity-0 cursor-default" // Hide container on match
                            )}>
                                {/* FRONT */}
                                <div className="absolute inset-0 backface-hidden bg-card rounded-2xl flex items-center justify-center border-2 border-transparent">
                                    <Brain className="w-8 h-8 text-indigo-100" />
                                </div>
                                {/* BACK */}
                                <div className={cn(
                                    "absolute inset-0 backface-hidden rotate-y-180 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner border-b-4 border-black/5",
                                    card.isMatched && "opacity-0 scale-0 transition-all duration-700 ease-in-out" // MATCH EFFECT: Disappear!
                                )}>
                                    <img
                                        src={card.content}
                                        alt="Pet"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* LEVEL COMPLETE MODAL */}
            {gameState === 'level_complete' && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-card rounded-[2.5rem] p-8 text-center max-w-sm w-full shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-green-50 to-transparent pointer-events-none" />

                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 animate-bounce">
                            <Star className="w-12 h-12 text-green-600 fill-current" />
                        </div>

                        <h2 className="text-3xl font-black text-foreground mb-2 relative z-10">Tebrikler!</h2>
                        <p className="text-gray-500 font-medium mb-8 relative z-10">{LEVELS[currentLevel - 1].name} tamamlandı.</p>

                        <button
                            onClick={nextLevel}
                            className="w-full py-4 bg-[#5B4D9D] text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-[#4a3f82] transition flex items-center justify-center gap-2 group"
                        >
                            Sonraki Seviye <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                        </button>
                    </motion.div>
                </div>
            )}

            {/* GAME COMPLETE / GAME OVER MODAL */}
            {(gameState === 'game_complete' || gameState === 'gameover') && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-card rounded-[2.5rem] p-8 text-center max-w-sm w-full shadow-2xl"
                    >
                        {gameState === 'game_complete' ? (
                            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trophy className="w-12 h-12 text-yellow-600" />
                            </div>
                        ) : (
                            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <X className="w-12 h-12 text-red-600" />
                            </div>
                        )}

                        <h2 className="text-3xl font-black text-foreground mb-2">
                            {gameState === 'game_complete' ? 'Muhteşem Hafıza!' : 'Süre Doldu'}
                        </h2>
                        <p className="text-gray-500 font-medium mb-8">
                            {gameState === 'game_complete' ? 'Tüm seviyeleri başarıyla tamamladın.' : 'Bir dahaki sefere daha hızlı ol.'}
                        </p>

                        <div className="bg-gray-50 rounded-2xl p-5 mb-8">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Toplam Skor</div>
                            <div className="text-4xl font-black text-[#5B4D9D]">{totalScore}</div>
                        </div>

                        <button
                            onClick={() => onGameOver(totalScore)}
                            className="w-full py-4 bg-[#5B4D9D] text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-[#4a3f82] transition"
                        >
                            Ödülü Topla
                        </button>
                    </motion.div>
                </div>
            )}

        </div>
    );
}
