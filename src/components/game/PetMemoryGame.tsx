"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Timer, X, ArrowRight, Flame, Coins, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameProps {
    onGameOver: (score: number) => void;
    onClose: () => void;
    userCoins?: number;
    onSpendCoins?: (amount: number) => boolean;
}



// ==============================
// 1. OYUN YAPILANDIRMASI (5 AŞAMA - Destansı)
// ==============================
const LEVELS = [
    { level: 1, cols: 4, pairs: 4, time: 30, name: "SİBER ACEMİ" },      // 8 Cards
    { level: 2, cols: 4, pairs: 6, time: 40, name: "MATRİX'E GİRİŞ" },   // 12 Cards
    { level: 3, cols: 4, pairs: 8, time: 50, name: "SİNİR AĞI" },        // 16 Cards
    { level: 4, cols: 5, pairs: 10, time: 60, name: "ZİHİN HACKER'I" },  // 20 Cards
    { level: 5, cols: 6, pairs: 12, time: 70, name: "SİBER EFSANE" },     // 24 Cards
    { level: 6, cols: 6, pairs: 15, time: 80, name: "BİLİNÇ ÖTESİ" },    // 30 Cards
];





// ==============================
// 2. PET-TEMALI NEON EMOJİLER (Siberpunk Hayvan Evreni)
// ==============================
const ICONS = [
    { emoji: "🐾", glow: "drop-shadow-[0_0_20px_rgba(249,115,22,1)]" },   // Pati
    { emoji: "🦴", glow: "drop-shadow-[0_0_20px_rgba(34,211,238,1)]" },   // Kemik
    { emoji: "🍖", glow: "drop-shadow-[0_0_20px_rgba(250,204,21,1)]" },   // Et
    { emoji: "🐟", glow: "drop-shadow-[0_0_20px_rgba(239,68,68,1)]" },    // Balık
    { emoji: "🪶", glow: "drop-shadow-[0_0_20px_rgba(192,132,252,1)]" },  // Tüy
    { emoji: "💩", glow: "drop-shadow-[0_0_20px_rgba(168,162,158,1)]" },  // Kaka
    { emoji: "🏠", glow: "drop-shadow-[0_0_20px_rgba(74,222,128,1)]" },   // Kulübe
    { emoji: "🛏️", glow: "drop-shadow-[0_0_20px_rgba(236,72,153,1)]" },   // Yastık
    { emoji: "🥣", glow: "drop-shadow-[0_0_20px_rgba(96,165,250,1)]" },   // Mama Kabı
    { emoji: "🧶", glow: "drop-shadow-[0_0_20px_rgba(245,158,11,1)]" },   // Yumak
    { emoji: "🐁", glow: "drop-shadow-[0_0_20px_rgba(209,213,219,1)]" },  // Oyuncak Fare
    { emoji: "🔔", glow: "drop-shadow-[0_0_20px_rgba(250,204,21,1)]" },   // Çıngırak/Tasma
    { emoji: "🥎", glow: "drop-shadow-[0_0_20px_rgba(163,230,53,1)]" },   // Tenis Topu
    { emoji: "🛸", glow: "drop-shadow-[0_0_20px_rgba(167,139,250,1)]" },   // Frizbi (Uçan Daire)
    { emoji: "🏆", glow: "drop-shadow-[0_0_20px_rgba(251,191,36,1)]" },   // Ödül Kupası
];



export default function PetMemoryGame({ onGameOver, onClose, userCoins = 0, onSpendCoins }: GameProps) {
    const [currentLevel, setCurrentLevel] = useState(1);
    const [cards, setCards] = useState<any[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    
    // Skor ve Kombo
    const [matches, setMatches] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [combo, setCombo] = useState(0);
    
    // Oyun Durumu
    const [gameState, setGameState] = useState<'playing' | 'level_complete' | 'game_complete' | 'gameover' | 'second_chance'>('playing');
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
                    setGameState('second_chance');
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

            if (card1.iconData.emoji === card2.iconData.emoji) {
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
                    
                    addFloatingText(`+${points} ${comboMulti > 1 ? `(x${comboMulti})` : ''}`, 'text-cyan-400', e);

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
            addFloatingText(`SÜRE BONUSU +${timeBonus}`, 'text-fuchsia-400');
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
                    style={{ left: `${ft.x}%`, top: `${ft.y}%`, transform: 'translate(-50%, -50%)' }}
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
                    className="grid gap-2 md:gap-3 w-full h-full max-h-[70vh] place-content-center"
                    style={{ gridTemplateColumns: `repeat(${LEVELS[currentLevel - 1].cols}, minmax(0, 1fr))` }}
                >
                    {cards.map((card, index) => {
                        const emoji = card.iconData?.emoji;
                        return (
                            <div key={`${currentLevel}-${card.id}`} className={cn("relative perspective-1000 w-full mx-auto", currentLevel >= 6 ? "aspect-square max-w-[60px] md:max-w-[80px]" : currentLevel >= 4 ? "aspect-square max-w-[70px] md:max-w-[100px]" : "aspect-[3/4] max-w-[90px] md:max-w-[120px]")} onClick={(e) => handleCardClick(index, e)}>
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
                                        {emoji && (
                                            <span className={cn("text-3xl md:text-5xl", card.iconData.glow)}>{emoji}</span>
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

            
            {/* İKİNCİ HAK (SECOND CHANCE) EKRANI */}
            <AnimatePresence>
                {gameState === 'second_chance' && (
                    <motion.div 
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
                        className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-[#111116] border border-orange-500/30 rounded-[2rem] p-8 text-center max-w-sm w-full shadow-[0_0_60px_rgba(249,115,22,0.2)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400" />

                            <div className="w-24 h-24 rounded-[1rem] bg-black overflow-hidden mx-auto mb-6 border-2 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.4)] relative flex items-center justify-center">
                                <Timer className="w-12 h-12 text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,1)] animate-pulse" />
                            </div>

                            <h2 className="text-2xl font-black text-orange-400 uppercase tracking-tighter mb-2">BAĞLANTI KOPUYOR!</h2>
                            <p className="text-gray-400 text-sm font-medium mb-6">
                                Süren doldu ama verileri kurtarabiliriz. <strong className="text-white">50 Moffi Coin</strong> karşılığında sisteme ek <strong className="text-cyan-400">30 saniye</strong> enjekte et ve kaldığın yerden devam et!
                            </p>

                            <div className="w-full bg-black/40 rounded-2xl p-4 border border-white/5 mb-6 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mevcut Bakiye</span>
                                <div className="flex items-center gap-1.5">
                                    <Coins className="w-4 h-4 text-amber-400" />
                                    <span className={cn("text-lg font-black font-mono", userCoins < 50 ? "text-red-500" : "text-white")}>{userCoins}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => {
                                        if (onSpendCoins && onSpendCoins(50)) {
                                            setTimeLeft(30);
                                            setGameState('playing');
                                            addFloatingText('SÜRE UZATILDI!', 'text-cyan-400');
                                        }
                                    }}
                                    disabled={userCoins < 50}
                                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black rounded-xl text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                >
                                    50 Coin Öde & Devam Et <Zap className="w-5 h-5 fill-white" />
                                </button>
                                <button 
                                    onClick={() => setGameState('gameover')} 
                                    className="w-full py-4 bg-white/5 text-gray-400 font-bold rounded-xl text-sm hover:bg-white/10 transition-colors"
                                >
                                    Vazgeç ve Çık
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* OYUN BİTTİ (GAME OVER / KAZANDIN) EKRANI */}
            <AnimatePresence>
                {(gameState === 'game_complete' || gameState === 'gameover') && (
                    <motion.div 
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(30px)' }}
                        className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80"
                    >
                        {/* MATRIX KAPANIS EFEKTi (Fütüristik Parçacıklar) */}
                        {gameState === 'game_complete' && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                {[...Array(30)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: "100vh", x: Math.random() * window.innerWidth, opacity: 0 }}
                                        animate={{ y: "-100vh", opacity: [0, 1, 0] }}
                                        transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
                                        className="absolute w-1 h-12 bg-cyan-500/50 rounded-full blur-[2px]"
                                    />
                                ))}
                            </div>
                        )}

                        <motion.div 
                            initial={{ scale: 0.5, y: 100, rotateX: 45 }} 
                            animate={{ scale: 1, y: 0, rotateX: 0 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className={cn(
                                "bg-[#111116]/80 backdrop-blur-2xl border-2 rounded-[2rem] p-8 text-center max-w-sm w-full relative overflow-hidden",
                                gameState === 'game_complete' ? "border-cyan-500/50 shadow-[0_0_100px_rgba(34,211,238,0.4)] animate-[pulse_3s_ease-in-out_Infinity]" : "border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.2)]"
                            )}
                        >
                            <div className={cn("absolute top-0 inset-x-0 h-2 bg-gradient-to-r", gameState === 'game_complete' ? "from-cyan-400 via-fuchsia-500 to-cyan-400" : "from-red-600 to-orange-600")} />

                            <div className={cn(
                                "w-32 h-32 rounded-[2rem] bg-black overflow-hidden mx-auto mb-8 border-4 relative flex items-center justify-center transition-transform", 
                                gameState === 'game_complete' ? "border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.6)] scale-110" : "border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)] grayscale"
                            )}>
                                <img src="/images/robot_moffi.jpg" className="w-full h-full object-cover scale-125 mix-blend-screen" />
                            </div>

                            <h2 className={cn(
                                "text-4xl font-black uppercase tracking-tighter mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]",
                                gameState === 'game_complete' ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-fuchsia-400" : "text-red-500"
                            )}>
                                {gameState === 'game_complete' ? 'SİBER EFSANE!' : 'SİSTEM ÇÖKTÜ'}
                            </h2>
                            <p className="text-gray-400 text-sm font-medium mb-8">
                                {gameState === 'game_complete' ? 'BİLİNCİN MATRİX İLE TAMAMEN BÜTÜNLEŞTİ. Yakında çok daha zorlu yeni modüller eklenecek, kendini geliştirmeye devam et!' : 'Bağlantı koptu. Daha hızlı olmalısın.'}
                            </p>

                            <div className="w-full bg-black/60 rounded-2xl p-6 border border-white/10 mb-8 shadow-inner relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2 block">Toplanan Moffi Kredisi</span>
                                <div className="flex items-center justify-center gap-3">
                                    <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                                    <span className="text-6xl font-black text-white font-mono tracking-tighter drop-shadow-lg">{totalScore}</span>
                                </div>
                            </div>

                            <button onClick={() => onGameOver(totalScore)} className="w-full py-4 bg-white text-black font-black rounded-xl text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                                Ağa Geri Dön <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
