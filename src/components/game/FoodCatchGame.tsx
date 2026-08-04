"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, AlertTriangle, Coins, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameProps {
    onGameOver: (score: number) => void;
    onClose: () => void;
}

type ItemType = 'coin' | 'energy' | 'bomb';
interface GameItem {
    id: number;
    x: number;
    y: number;
    type: ItemType;
    speedMod: number;
    el?: HTMLDivElement; // Store raw DOM element
}
interface FloatingText {
    id: number;
    x: number;
    y: number;
    text: string;
    color: string;
}

const STAGES = [
    { level: 1, duration: 15, name: "BAŞLANGIÇ", spawnRate: 900, baseSpeed: 0.5, bombChance: 0.1 },
    { level: 2, duration: 20, name: "HIZLANIYORUZ", spawnRate: 750, baseSpeed: 0.7, bombChance: 0.15 },
    { level: 3, duration: 20, name: "KAOS", spawnRate: 600, baseSpeed: 0.9, bombChance: 0.25 },
    { level: 4, duration: 25, name: "REFLEKS TESTİ", spawnRate: 500, baseSpeed: 1.1, bombChance: 0.35 },
    { level: 5, duration: 999, name: "BOSS MODU", spawnRate: 400, baseSpeed: 1.3, bombChance: 0.45 },
];

// SVG Strings for pure DOM elements
const SVG_BOMB = `<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)]"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>`;
const SVG_ENERGY = `<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.9)]"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
const SVG_COIN = `<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.9)]"><circle cx="8" cy="8" r="6"></circle><path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path><path d="M7 6h1v4"></path><path d="m16.71 13.88.7.71-2.82 2.82"></path></svg>`;

export default function FoodCatchGame({ onGameOver, onClose }: GameProps) {
    const playerXRef = useRef(50);
    const scoreRef = useRef(0);
    const comboRef = useRef(0);
    const stageIdxRef = useRef(0);
    const itemsRef = useRef<GameItem[]>([]);
    const lastSpawnTimeRef = useRef(0);
    const timeInStageRef = useRef(0);
    const lastTimeRef = useRef(performance.now());
    
    const rAFRef = useRef<number>();
    const containerRef = useRef<HTMLDivElement>(null);
    const itemsContainerRef = useRef<HTMLDivElement>(null);
    const playerDOMRef = useRef<HTMLDivElement>(null);

    const [uiScore, setUiScore] = useState(0);
    const [uiCombo, setUiCombo] = useState(0);
    const [uiStage, setUiStage] = useState(STAGES[0]);
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [screenShake, setScreenShake] = useState(false);
    const [stageAnnounce, setStageAnnounce] = useState<string | null>("AŞAMA 1 - BAŞLANGIÇ");
    const [gameOverScreen, setGameOverScreen] = useState(false);

    const addFloatingText = (x: number, y: number, text: string, color: string) => {
        const id = Date.now() + Math.random();
        setFloatingTexts(prev => [...prev, { id, x, y, text, color }]);
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
        }, 800);
    };

    const triggerShake = () => {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 300);
    };

    const spawnItem = (currentTime: number, currentStage: typeof STAGES[0]) => {
        if (currentTime - lastSpawnTimeRef.current > currentStage.spawnRate) {
            const rand = Math.random();
            let type: ItemType = 'coin';
            if (rand < currentStage.bombChance) {
                type = 'bomb';
            } else if (rand > 0.85) {
                type = 'energy';
            }

            const x = Math.random() * 80 + 10;
            const y = -10;
            
            // PURE DOM CREATION (No React mapping = 100% smooth)
            const el = document.createElement('div');
            el.className = "absolute top-0 left-0 w-12 h-12 flex items-center justify-center pointer-events-none will-change-transform";
            el.innerHTML = type === 'bomb' ? SVG_BOMB : (type === 'energy' ? SVG_ENERGY : SVG_COIN);
            el.style.transform = `translate3d(calc(${x}vw - 50%), calc(${y}vh - 50%), 0)`;
            
            if (itemsContainerRef.current) {
                itemsContainerRef.current.appendChild(el);
            }

            itemsRef.current.push({
                id: Date.now() + Math.random(),
                x, y, type,
                speedMod: 0.8 + Math.random() * 0.4,
                el
            });
            
            lastSpawnTimeRef.current = currentTime;
        }
    };

    const endGame = () => {
        if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
        setGameOverScreen(true);
    };

    const gameLoop = useCallback((timestamp: number) => {
        if (gameOverScreen) return; 
        
        let deltaTime = timestamp - lastTimeRef.current;
        if (deltaTime > 64) deltaTime = 16; // Prevent massive jumps if tab inactive
        lastTimeRef.current = timestamp;
        
        timeInStageRef.current += deltaTime;

        const currentStage = STAGES[stageIdxRef.current];
        if (timeInStageRef.current > currentStage.duration * 1000 && stageIdxRef.current < STAGES.length - 1) {
            stageIdxRef.current += 1;
            timeInStageRef.current = 0;
            const newStage = STAGES[stageIdxRef.current];
            setUiStage(newStage);
            setStageAnnounce(`AŞAMA ${newStage.level} - ${newStage.name}`);
            setTimeout(() => setStageAnnounce(null), 2000);
        }

        spawnItem(timestamp, currentStage);

        const playerXHit = playerXRef.current;
        
        const remainingItems: GameItem[] = [];
        let scoreChanged = false;

        for (const item of itemsRef.current) {
            item.y += (currentStage.baseSpeed * item.speedMod * deltaTime) / 16; 
            
            let caught = false;
            
            if (item.type === 'bomb') {
                if (item.y > 84 && item.y < 86 && Math.abs(item.x - playerXHit) < 6) {
                    caught = true;
                    triggerShake();
                    comboRef.current = 0;
                    const penalty = 50;
                    scoreRef.current = Math.max(0, scoreRef.current - penalty);
                    addFloatingText(item.x, item.y, `-${penalty}`, 'text-red-500');
                    scoreChanged = true;
                }
            } else {
                if (item.y > 75 && item.y < 90 && Math.abs(item.x - playerXHit) < 14) {
                    caught = true;
                    comboRef.current += 1;
                    const multi = 1 + Math.floor(comboRef.current / 5);
                    const basePts = item.type === 'energy' ? 20 : 10;
                    const earned = basePts * multi;
                    scoreRef.current += earned;
                    
                    let color = 'text-amber-400';
                    if (multi > 1) color = 'text-fuchsia-400';
                    if (item.type === 'energy') color = 'text-cyan-400';
                    
                    addFloatingText(item.x, item.y, `+${earned}${multi > 1 ? ` (x${multi})` : ''}`, color);
                    scoreChanged = true;
                }
            }

            if (item.y > 100 && !caught && item.type !== 'bomb') {
                if (comboRef.current > 0) {
                    addFloatingText(item.x, 95, 'Miss!', 'text-gray-400');
                    comboRef.current = 0;
                    scoreChanged = true;
                }
            }

            if (!caught && item.y < 110) {
                remainingItems.push(item);
                if (item.el) {
                    item.el.style.transform = `translate3d(calc(${item.x}vw - 50%), calc(${item.y}vh - 50%), 0)`;
                }
            } else {
                if (item.el) {
                    item.el.remove();
                }
            }
        }

        itemsRef.current = remainingItems;

        if (playerDOMRef.current) {
            playerDOMRef.current.style.transform = `translate3d(calc(${playerXRef.current}vw - 50%), 0, 0)`;
        }

        if (scoreChanged) {
            setUiScore(scoreRef.current);
            setUiCombo(comboRef.current);
        }

        if (stageIdxRef.current === 4 && timeInStageRef.current > 45000) {
            endGame();
            return;
        }

        rAFRef.current = requestAnimationFrame(gameLoop);
    }, [gameOverScreen]);

    useEffect(() => {
        setTimeout(() => setStageAnnounce(null), 2000);
        rAFRef.current = requestAnimationFrame(gameLoop);
        
        return () => {
            if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
            // Cleanup pure DOM elements
            itemsRef.current.forEach(item => {
                if(item.el) item.el.remove();
            });
        };
    }, [gameLoop]);

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (gameOverScreen) return;
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const percent = ((clientX - rect.left) / rect.width) * 100;
            playerXRef.current = Math.min(Math.max(percent, 10), 90);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
        };
    }, [gameOverScreen]);

    return (
        <div ref={containerRef} className={cn("fixed inset-0 z-[100] bg-[#050505] overflow-hidden font-sans select-none touch-none", screenShake && "animate-[shake_0.2s_ease-in-out]")}>
            
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" style={{ perspective: '500px' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-900/30 via-transparent to-transparent transform-gpu rotate-x-60 scale-150 origin-bottom" />
            </div>
            
            <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-900/30 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-20%] w-[60vw] h-[60vw] bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Pure DOM Items Container */}
            <div ref={itemsContainerRef} className="absolute inset-0 pointer-events-none z-10" />

            {!gameOverScreen && (
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-30 pointer-events-none">
                    <div className="flex flex-col gap-2">
                        <div className="bg-black/40 backdrop-blur-md rounded-2xl px-5 py-2.5 flex items-center gap-3 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <Trophy className="w-7 h-7 text-amber-400 drop-shadow-md" />
                            <span className="text-3xl font-black text-white font-mono tracking-tighter">{uiScore}</span>
                        </div>
                        <AnimatePresence>
                            {uiCombo > 2 && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.5 }} className="bg-fuchsia-500/20 border border-fuchsia-500/30 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                                    <Flame className="w-4 h-4 text-fuchsia-400" />
                                    <span className="text-xs font-black text-fuchsia-400 uppercase tracking-widest">Kombo x{1 + Math.floor(uiCombo/5)}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <button onClick={endGame} className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shadow-lg pointer-events-auto active:scale-90 transition-transform hover:bg-white/10">
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                        
                        <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full animate-pulse", uiStage.level >= 4 ? "bg-red-500" : "bg-cyan-400")} />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">AŞAMA {uiStage.level}</span>
                        </div>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {stageAnnounce && !gameOverScreen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5, y: 50 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }}
                        className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
                    >
                        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-600 drop-shadow-[0_0_30px_rgba(217,70,239,0.8)] uppercase tracking-tighter text-center">
                            {stageAnnounce}
                        </h1>
                    </motion.div>
                )}
            </AnimatePresence>

            {!gameOverScreen && floatingTexts.map(ft => (
                <motion.div
                    key={ft.id}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.8 }}
                    className={cn("absolute font-black text-xl md:text-2xl pointer-events-none z-50 drop-shadow-lg", ft.color)}
                    style={{ left: `${ft.x}%`, top: `${ft.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                    {ft.text}
                </motion.div>
            ))}

            {!gameOverScreen && (
                <div
                    ref={playerDOMRef}
                    className="absolute bottom-[15%] left-0 w-[134px] h-[134px] pointer-events-none will-change-transform z-20"
                    style={{ transform: `translate3d(calc(${playerXRef.current}vw - 50%), 0, 0)` }}
                >
                    <div className="relative w-full h-full flex flex-col items-center justify-end">
                        <div className="absolute bottom-[-10px] w-[134px] h-6 bg-cyan-500/30 rounded-full blur-md" />
                        <div className="absolute bottom-[-5px] w-24 h-2 bg-cyan-400/70 rounded-full shadow-[0_0_20px_rgba(34,211,238,1)]" />
                        
                        {/* %40 Büyütülmüş karakter (w-[134px] = w-32 den %40 daha büyük - w-24 96px idi. 96 * 1.4 = 134.4px) */}
                        <div className="w-full h-full relative flex items-center justify-center -mb-2">
                            <img
                                src="/images/robot_moffi.jpg"
                                className="w-full h-full object-cover mix-blend-screen scale-[1.15]"
                                style={{ maskImage: 'radial-gradient(circle at center, black 40%, transparent 68%)', WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 68%)' }}
                                alt="Player"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-gradient-to-t from-fuchsia-900/40 to-transparent pointer-events-none border-t border-fuchsia-500/30">
                <div className="absolute top-0 left-0 right-0 h-1 bg-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,1)]" />
            </div>

            <AnimatePresence>
                {gameOverScreen && (
                    <motion.div 
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
                        className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-sm bg-[#111116] border border-white/10 rounded-[2rem] p-8 shadow-[0_0_60px_rgba(217,70,239,0.3)] relative overflow-hidden flex flex-col items-center text-center"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-600" />
                            
                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 uppercase tracking-tighter mb-2">
                                OYUN BİTTİ
                            </h2>
                            <p className="text-gray-400 text-sm font-medium mb-8">
                                Harika mücadele ettin! Ulaştığın son aşama: <span className="text-white font-bold">{uiStage.name}</span>
                            </p>

                            <div className="w-full bg-black/40 rounded-2xl p-6 border border-white/5 mb-8">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Kazanılan Moffi Puanı</span>
                                <div className="flex items-center justify-center gap-3">
                                    <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                                    <span className="text-5xl font-black text-white font-mono">{uiScore}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => onGameOver(uiScore)}
                                className="w-full py-4 bg-white text-black font-black rounded-xl text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            >
                                Ödülü Al ve Çık <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
