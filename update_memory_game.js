const fs = require('fs');

const code = `"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Trophy, Timer, X, ArrowRight, Flame, 
    Zap, Star, Rocket, Target, Heart, 
    Crown, Ghost, Gem, Diamond, Cpu, Sword
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GameProps {
    onGameOver: (score: number) => void;
    onClose: () => void;
}

// ==============================
// 1. OYUN YAPILANDIRMASI (5 AŞAMA)
// ==============================
const LEVELS = [
    { level: 1, cols: 4, pairs: 4, time: 30, name: "SİBER ACEMİ" },     // 8 Cards
    { level: 2, cols: 4, pairs: 6, time: 40, name: "MATRİX'E GİRİŞ" },  // 12 Cards
    { level: 3, cols: 4, pairs: 8, time: 50, name: "SİNİR AĞI" },       // 16 Cards
    { level: 4, cols: 4, pairs: 10, time: 60, name: "ZİHİN HACKER'I" }, // 20 Cards
    { level: 5, cols: 4, pairs: 12, time: 70, name: "SİBER TANRI" },    // 24 Cards
];

// ==============================
// 2. NEON İKONLAR (Görsel sorunu çözüldü)
// ==============================
const ICONS = [
    { icon: Flame, color: "text-orange-500", glow: "drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]" },
    { icon: Zap, color: "text-cyan-400", glow: "drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" },
    { icon: Star, color: "text-yellow-400", glow: "drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" },
    { icon: Rocket, color: "text-red-500", glow: "drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" },
    { icon: Target, color: "text-green-400", glow: "drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]" },
    { icon: Heart, color: "text-pink-500", glow: "drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]" },
    { icon: Crown, color: "text-amber-500", glow: "drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" },
    { icon: Ghost, color: "text-purple-400", glow: "drop-shadow-[0_0_15px_rgba(192,132,252,0.8)]" },
    { icon: Gem, color: "text-blue-400", glow: "drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]" },
    { icon: Diamond, color: "text-teal-400", glow: "drop-shadow-[0_0_15px_rgba(45,212,191,0.8)]" },
    { icon: Cpu, color: "text-fuchsia-400", glow: "drop-shadow-[0_0_15px_rgba(232,121,249,0.8)]" },
    { icon: Sword, color: "text-indigo-400", glow: "drop-shadow-[0_0_15px_rgba(129,140,248,0.8)]" },
];

export default function PetMemoryGame({ onGameOver, onClose }: GameProps) {
    const [currentLevel, setCurrentLevel] = useState(1);
    const [cards, setCards] = useState<any[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    
    // Skor ve Kombo
    const [matches, setMatches] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [combo, setCombo] = useState(0);
    
    // Oyun Durumu
    const [gameState, setGameState] = useState<'playing' | 'level_complete' | 'game_complete' | 'gameover'>('playing');
    const [floatingTexts, setFloatingTexts] = useState<{id: number, text: string, color: string, x: number, y: number}[]>([]);
    const [screenShake, setScreenShake] = useState(false);

    // ==============================
    // FLOATING TEXT EFEKTİ
    // ==============================
    const addFloatingText = (text: string, color: string, e?: React.MouseEvent) => {
        let x = 50;
        let y = 50;
        if (e) {
            x = (e.clientX / window.innerWidth) * 100;
            y = (e.clientY / window.innerHeight) * 100;
        }
        const id = Date.now() + Math.random();
        setFloatingTexts(prev => [...prev, { id, text, color, x, y }]);
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
        }, 1000);
    };

    const triggerShake = () => {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 300);
    };

    // ==============================
    // SEVİYE BAŞLATMA
    // ==============================
    useEffect(() => {
        const config = LEVELS[currentLevel - 1];
        
        // Bu seviye için gereken ikonları seç
        const selectedIcons = ICONS.slice(0, config.pairs);
        
        // Desteyi oluştur ve karıştır
        const deck = [...selectedIcons, ...selectedIcons]
            .sort(() => Math.random() - 0.5)
            .map((item, index) => ({
                id: index,
                iconData: item,
                isFlipped: false,
                isMatched: false
            }));

        setCards(deck);
        setFlippedIndices([]);
        setMatches(0);
        setTimeLeft(config.time);
        setCombo(0);
        setGameState('playing');
    }, [currentLevel]);

    // ==============================
    // SAYAÇ (TIMER)
    // ==============================
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

    // ==============================
    // KART TIKLAMA MANTIĞI
    // ==============================
    const handleCardClick = (index: number, e: React.MouseEvent) => {
        if (gameState !== 'playing' || cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2) return;

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        if (newFlipped.length === 2) {
            const [idx1, idx2] = newFlipped;
            const card1 = newCards[idx1];
            const card2 = newCards[idx2];

            if (card1.iconData.icon === card2.iconData.icon) {
                // EŞLEŞTİ (DOĞRU)
                setTimeout(() => {
                    const matchedCards = [...cards];
                    matchedCards[idx1].isMatched = true;
                    matchedCards[idx2].isMatched = true;
                    setCards(matchedCards);
                    setFlippedIndices([]);

                    // KOMBO VE PUAN HESAPLAMA
                    const newCombo = combo + 1;
                    setCombo(newCombo);
                    
                    const comboMulti = 1 + Math.floor(newCombo / 2); // Her 2 doğruda çarpan artar
                    const points = 20 * comboMulti;
                    setTotalScore(s => s + points);
                    
                    addFloatingText(\`+\${points} \${comboMulti > 1 ? \`(x\${comboMulti})\` : ''}\`, 'text-cyan-400', e);

                    // SEVİYE BİTTİ Mİ?
                    setMatches(m => {
                        const newMatches = m + 1;
                        if (newMatches === LEVELS[currentLevel - 1].pairs) {
                            setTimeout(() => handleLevelComplete(), 500);
                        }
                        return newMatches;
                    });
                }, 400);
            } else {
                // EŞLEŞMEDİ (HATA)
                triggerShake();
                setCombo(0); // Hata yapınca kombo sıfırlanır
                
                setTimeout(() => {
                    const resetCards = [...cards];
                    resetCards[idx1].isFlipped = false;
                    resetCards[idx2].isFlipped = false;
                    setCards(resetCards);
                    setFlippedIndices([]);
                }, 800);
            }
        }
    };

    const handleLevelComplete = () => {
        const timeBonus = timeLeft * 5; // Kalan her saniye için 5 puan
        setTotalScore(s => s + timeBonus);
        if (timeBonus > 0) {
            addFloatingText(\`SÜRE BONUSU +\${timeBonus}\`, 'text-fuchsia-400');
        }

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
        <div className={cn("fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center font-sans overflow-hidden select-none touch-none", screenShake && "animate-[shake_0.2s_ease-in-out]")}>
            
            {/* CYBERPUNK BACKGROUND */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" style={{ perspective: '500px' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/30 via-transparent to-transparent transform-gpu rotate-x-60 scale-150 origin-bottom" />
            </div>
            
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-20%] w-[60vw] h-[60vw] bg-fuchsia-900/20 rounded-full blur-[100px] pointer-events-none" />

            {/* FLOATING TEXTS */}
            {floatingTexts.map(ft => (
                <motion.div
                    key={ft.id}
                    initial={{ opacity: 1, y: 0, scale: 1 }}
                    animate={{ opacity: 0, y: -80, scale: 1.5 }}
                    transition={{ duration: 1 }}
                    className={cn("absolute font-black text-2xl md:text-3xl pointer-events-none z-50 drop-shadow-lg", ft.color)}
                    style={{ left: \`\${ft.x}%\`, top: \`\${ft.y}%\`, transform: 'translate(-50%, -50%)' }}
                >
                    {ft.text}
                </motion.div>
            ))}

            {/* HUD (HEADS UP DISPLAY) */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-30 pointer-events-none">
                
                {/* SOL HUD: Skor ve Moffi */}
                <div className="flex gap-4 items-center">
                    {/* Mascot */}
                    <div className="w-16 h-16 rounded-[1rem] bg-black overflow-hidden border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.4)] relative pointer-events-auto">
                        <img
                            src="/images/robot_moffi.jpg"
                            className="w-full h-full object-cover scale-125 mix-blend-screen"
                            alt="Moffi"
                        />
                        {combo > 2 && (
                            <div className="absolute inset-0 bg-fuchsia-500/20 animate-pulse mix-blend-screen" />
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <div className="bg-black/60 backdrop-blur-md rounded-2xl px-5 py-2 flex items-center gap-3 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] pointer-events-auto">
                            <Trophy className="w-6 h-6 text-amber-400 drop-shadow-md" />
                            <span className="text-2xl font-black text-white font-mono tracking-tighter">{totalScore}</span>
                        </div>
                        <AnimatePresence>
                            {combo > 1 && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.5 }} className="bg-fuchsia-500/20 border border-fuchsia-500/30 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                                    <Flame className="w-4 h-4 text-fuchsia-400" />
                                    <span className="text-xs font-black text-fuchsia-400 uppercase tracking-widest">Kombo x{1 + Math.floor(combo/2)}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* SAĞ HUD: Zaman, Seviye, Kapat */}
                <div className="flex flex-col items-end gap-2 pointer-events-auto">
                    <div className="flex gap-2">
                        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
                            <Timer className={cn("w-5 h-5", timeLeft < 10 ? "text-red-500 animate-pulse" : "text-cyan-400")} />
                            <span className={cn("font-black text-xl font-mono", timeLeft < 10 ? "text-red-500" : "text-white")}>
                                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                            </span>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-lg active:scale-90 transition-transform hover:bg-white/10">
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>
                    <div className="bg-cyan-500/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-cyan-500/30 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">AŞAMA {currentLevel}: {LEVELS[currentLevel-1].name}</span>
                    </div>
                </div>
            </div>

            {/* OYUN IZGARASI */}
            <div className="relative z-10 w-full max-w-2xl px-4 mt-20 h-[70vh] flex items-center justify-center">
                <div
                    className="grid gap-3 w-full"
                    style={{ gridTemplateColumns: \`repeat(\${LEVELS[currentLevel - 1].cols}, minmax(0, 1fr))\` }}
                >
                    {cards.map((card, index) => {
                        const IconComponent = card.iconData?.icon;
                        return (
                            <div key={\`\${currentLevel}-\${card.id}\`} className="aspect-[3/4] relative perspective-1000" onClick={(e) => handleCardClick(index, e)}>
                                <div className={cn(
                                    "w-full h-full relative preserve-3d transition-transform duration-500 cursor-pointer",
                                    (card.isFlipped || card.isMatched) ? "rotate-y-180" : "hover:scale-[1.03]",
                                    card.isMatched && "opacity-0 scale-90 pointer-events-none transition-all duration-700 ease-in-out delay-300"
                                )}>
                                    
                                    {/* KARTIN ARKASI (Kapalı Yüz) - Siber Moffi Hologramı */}
                                    <div className="absolute inset-0 backface-hidden bg-[#111116] rounded-xl flex flex-col items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden group">
                                        {/* Cyber grid bg */}
                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px] opacity-20" />
                                        
                                        <img 
                                            src="/images/robot_moffi.jpg" 
                                            className="w-12 h-12 md:w-16 md:h-16 object-cover scale-150 mix-blend-screen opacity-50 group-hover:opacity-100 transition-opacity" 
                                            style={{ maskImage: 'radial-gradient(circle at center, black 30%, transparent 60%)', WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 60%)' }}
                                        />
                                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-500/30 rounded-xl transition-colors" />
                                    </div>
                                    
                                    {/* KARTIN ÖNÜ (Açık Yüz) - Parlayan Neon İkon */}
                                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0a0a0f] rounded-xl flex flex-col items-center justify-center border border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.2)] overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                        {IconComponent && (
                                            <IconComponent className={cn("w-12 h-12 md:w-16 md:h-16", card.iconData.color, card.iconData.glow)} />
                                        )}
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* BÖLÜM GEÇİLDİ EKRANI */}
            <AnimatePresence>
                {gameState === 'level_complete' && (
                    <motion.div 
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
                        className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-[#111116] border border-white/10 rounded-[2rem] p-8 text-center max-w-sm w-full shadow-[0_0_60px_rgba(34,211,238,0.2)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-cyan-400" />

                            <div className="w-24 h-24 rounded-[1rem] bg-black overflow-hidden mx-auto mb-6 border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.4)] relative">
                                <img src="/images/robot_moffi.jpg" className="w-full h-full object-cover scale-125 mix-blend-screen" />
                            </div>

                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 uppercase tracking-tighter mb-2">AŞAMA TAMAM!</h2>
                            <p className="text-gray-400 font-medium mb-8">Zihnin matrix'e uyum sağlıyor.</p>

                            <button onClick={nextLevel} className="w-full py-4 bg-white text-black font-black rounded-xl text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                Sonraki Aşama <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* OYUN BİTTİ (GAME OVER / KAZANDIN) EKRANI */}
            <AnimatePresence>
                {(gameState === 'game_complete' || gameState === 'gameover') && (
                    <motion.div 
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
                        className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-[#111116] border border-white/10 rounded-[2rem] p-8 text-center max-w-sm w-full shadow-[0_0_60px_rgba(217,70,239,0.3)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-600" />

                            <div className={cn("w-24 h-24 rounded-[1rem] bg-black overflow-hidden mx-auto mb-6 border-2 relative flex items-center justify-center", gameState === 'game_complete' ? "border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.4)]" : "border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]")}>
                                {gameState === 'game_complete' ? (
                                    <Trophy className="w-12 h-12 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,1)]" />
                                ) : (
                                    <X className="w-12 h-12 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]" />
                                )}
                            </div>

                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                                {gameState === 'game_complete' ? 'SİBER TANRI!' : 'SİSTEM ÇÖKTÜ'}
                            </h2>
                            <p className="text-gray-400 text-sm font-medium mb-8">
                                {gameState === 'game_complete' ? 'Tüm aşamaları kusursuz tamamladın.' : 'Süre doldu. Daha hızlı olmalısın.'}
                            </p>

                            <div className="w-full bg-black/40 rounded-2xl p-6 border border-white/5 mb-8">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Kazanılan Moffi Puanı</span>
                                <div className="flex items-center justify-center gap-3">
                                    <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                                    <span className="text-5xl font-black text-white font-mono">{totalScore}</span>
                                </div>
                            </div>

                            <button onClick={() => onGameOver(totalScore)} className="w-full py-4 bg-white text-black font-black rounded-xl text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                Ödülü Al ve Çık <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
`;

fs.writeFileSync('src/components/game/PetMemoryGame.tsx', code, 'utf8');
console.log('Successfully applied advanced cyberpunk overhaul to PetMemoryGame.');
