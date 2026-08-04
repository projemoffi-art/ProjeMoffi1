const fs = require('fs');

const code = `"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, X, Trophy, Flame, Zap, AlertTriangle, Coins, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameProps {
    onGameOver: (score: number) => void;
    onClose: () => void;
}

// Types
type ItemType = 'coin' | 'energy' | 'bomb';
interface GameItem {
    id: number;
    x: number;
    y: number;
    type: ItemType;
    speedMod: number;
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
    const playerDOMRef = useRef<HTMLDivElement>(null);
    const itemDOMRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const [uiScore, setUiScore] = useState(0);
    const [uiCombo, setUiCombo] = useState(0);
    const [uiStage, setUiStage] = useState(STAGES[0]);
    const [uiTime, setUiTime] = useState(0);
    const [renderItems, setRenderItems] = useState<GameItem[]>([]); 
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

            const newItem: GameItem = {
                id: Date.now() + Math.random(),
                x: Math.random() * 80 + 10,
                y: -10,
                type,
                speedMod: 0.8 + Math.random() * 0.4 
            };
            
            itemsRef.current.push(newItem);
            setRenderItems([...itemsRef.current]);
            lastSpawnTimeRef.current = currentTime;
        }
    };

    const endGame = () => {
        if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
        setGameOverScreen(true);
    };

    const gameLoop = useCallback((timestamp: number) => {
        if (gameOverScreen) return; 
        
        const deltaTime = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;
        timeInStageRef.current += deltaTime;

        const currentStage = STAGES[stageIdxRef.current];
        if (timeInStageRef.current > currentStage.duration * 1000 && stageIdxRef.current < STAGES.length - 1) {
            stageIdxRef.current += 1;
            timeInStageRef.current = 0;
            const newStage = STAGES[stageIdxRef.current];
            setUiStage(newStage);
            setStageAnnounce(\`AŞAMA \${newStage.level} - \${newStage.name}\`);
            setTimeout(() => setStageAnnounce(null), 2000);
        }

        setUiTime(Math.floor(timeInStageRef.current / 1000));

        spawnItem(timestamp, currentStage);

        const playerXHit = playerXRef.current;
        
        const remainingItems: GameItem[] = [];
        let itemsChanged = false;
        let scoreChanged = false;

        for (const item of itemsRef.current) {
            item.y += (currentStage.baseSpeed * item.speedMod * deltaTime) / 16; 
            
            let caught = false;
            
            if (item.type === 'bomb') {
                // SIKI HITBOX: Cezalar sadece karakterin tam ortasına değerse (84-86vh arası) ve X ekseninde çok yakınsa patlar.
                if (item.y > 84 && item.y < 86 && Math.abs(item.x - playerXHit) < 6) {
                    caught = true;
                    itemsChanged = true;
                    triggerShake();
                    comboRef.current = 0;
                    const penalty = 50;
                    scoreRef.current = Math.max(0, scoreRef.current - penalty);
                    addFloatingText(item.x, item.y, \`-\${penalty}\`, 'text-red-500');
                    scoreChanged = true;
                }
            } else {
                // GENİŞ HITBOX: Ödüller karakterin üst hizasına (75vh civarı) değer değmez toplanır.
                if (item.y > 75 && item.y < 90 && Math.abs(item.x - playerXHit) < 14) {
                    caught = true;
                    itemsChanged = true;
                    comboRef.current += 1;
                    const multi = 1 + Math.floor(comboRef.current / 5);
                    const basePts = item.type === 'energy' ? 20 : 10;
                    const earned = basePts * multi;
                    scoreRef.current += earned;
                    
                    let color = 'text-amber-400';
                    if (multi > 1) color = 'text-fuchsia-400';
                    if (item.type === 'energy') color = 'text-cyan-400';
                    
                    addFloatingText(item.x, item.y, \`+\${earned}\${multi > 1 ? \` (x\${multi})\` : ''}\`, color);
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
                
                const domEl = itemDOMRefs.current.get(item.id);
                if (domEl) {
                    domEl.style.transform = \`translate3d(calc(\${item.x}vw - 50%), calc(\${item.y}vh - 50%), 0)\`;
                }
            } else {
                itemsChanged = true;
                itemDOMRefs.current.delete(item.id);
            }
        }

        itemsRef.current = remainingItems;

        if (playerDOMRef.current) {
            playerDOMRef.current.style.transform = \`translate3d(calc(\${playerXRef.current}vw - 50%), 0, 0)\`;
        }

        if (itemsChanged) {
            setRenderItems([...remainingItems]);
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

    const renderItemIcon = (type: ItemType) => {
        if (type === 'bomb') return <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] fill-red-500" />;
        if (type === 'energy') return <Zap className="w-8 h-8 md:w-10 md:h-10 text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.9)] fill-cyan-400" />;
        return <Coins className="w-8 h-8 md:w-10 md:h-10 text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.9)] fill-amber-400" />;
    };

    return (
        <div ref={containerRef} className={cn("fixed inset-0 z-[100] bg-[#050505] overflow-hidden font-sans select-none touch-none", screenShake && "animate-[shake_0.2s_ease-in-out]")}>
            
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" style={{ perspective: '500px' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-900/30 via-transparent to-transparent transform-gpu rotate-x-60 scale-150 origin-bottom" />
            </div>
            
            <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-900/30 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-20%] w-[60vw] h-[60vw] bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none" />

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

            {!gameOverScreen && renderItems.map(item => (
                <div
                    key={item.id}
                    ref={el => {
                        if (el) {
                            itemDOMRefs.current.set(item.id, el);
                            // Takılmaları tamamen önleyen kilit düzeltme: React'in style objesiyle override etmesini engellemek için transform'u ilk mount'ta burada veriyoruz!
                            el.style.transform = \`translate3d(calc(\${item.x}vw - 50%), calc(\${item.y}vh - 50%), 0)\`;
                        }
                        else itemDOMRefs.current.delete(item.id);
                    }}
                    className="absolute top-0 left-0 w-12 h-12 flex items-center justify-center pointer-events-none will-change-transform"
                >
                    {renderItemIcon(item.type)}
                </div>
            ))}

            {!gameOverScreen && floatingTexts.map(ft => (
                <motion.div
                    key={ft.id}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.8 }}
                    className={cn("absolute font-black text-xl md:text-2xl pointer-events-none z-50 drop-shadow-lg", ft.color)}
                    style={{ left: \`\${ft.x}%\`, top: \`\${ft.y}%\`, transform: 'translate(-50%, -50%)' }}
                >
                    {ft.text}
                </motion.div>
            ))}

            {!gameOverScreen && (
                <div
                    ref={playerDOMRef}
                    className="absolute bottom-[15%] left-0 w-24 h-24 pointer-events-none will-change-transform z-20"
                    style={{ transform: \`translate3d(calc(\${playerXRef.current}vw - 50%), 0, 0)\` }}
                >
                    <div className="relative w-full h-full flex flex-col items-center justify-end">
                        <div className="absolute bottom-[-10px] w-24 h-6 bg-cyan-500/30 rounded-full blur-md" />
                        <div className="absolute bottom-[-5px] w-16 h-2 bg-cyan-400/70 rounded-full shadow-[0_0_20px_rgba(34,211,238,1)]" />
                        
                        {/* Küçültülmüş karakter */}
                        <div className="w-24 h-24 relative flex items-center justify-center -mb-2">
                            <img
                                src="/images/robot_moffi.jpg"
                                className="w-full h-full object-cover mix-blend-screen"
                                style={{ maskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)' }}
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
`;

fs.writeFileSync('src/components/game/FoodCatchGame.tsx', code, 'utf8');
console.log('Successfully applied collision boxes and removed react transform bugs.');
