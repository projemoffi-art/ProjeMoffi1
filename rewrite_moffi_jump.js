const fs = require('fs');

const code = `"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X, Play, Coins, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameProps {
    onGameOver: (score: number) => void;
    onClose: () => void;
    userCoins?: number;
    onSpendCoins?: (amount: number) => boolean;
}

type PlatformType = 'normal' | 'moving' | 'fragile' | 'spring';

export default function MoffiJumpGame({ onGameOver, onClose, userCoins = 0, onSpendCoins }: GameProps) {
    // ------------------------------------------------------------------------
    // CONSTANTS & REFS
    // ------------------------------------------------------------------------
    const GRAVITY = 0.4;
    const JUMP_FORCE = -10;
    const SPRING_FORCE = -22;
    const PLATFORM_WIDTH = 65;
    const PLATFORM_HEIGHT = 15;
    const PLAYER_SIZE = 40;

    const [gameState, setGameState] = useState<'start' | 'playing' | 'second_chance' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [level, setLevel] = useState(1);

    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>();
    
    // Virtual World State
    const player = useRef({ x: 0, y: 0, vy: 0, vx: 0 });
    const platforms = useRef<{ id: number, x: number, y: number, type: PlatformType, dx: number, isBroken: boolean }[]>([]);
    const cameraY = useRef(0);
    const keys = useRef({ left: false, right: false });

    // ------------------------------------------------------------------------
    // GAME LOGIC
    // ------------------------------------------------------------------------
    const initGame = (isRevive = false) => {
        const height = containerRef.current?.clientHeight || 600;
        const width = containerRef.current?.clientWidth || 400;

        if (!isRevive) {
            setScore(0);
            setLevel(1);
            cameraY.current = 0;
            platforms.current = [];
            
            // Generate initial floor platform
            platforms.current.push({
                id: Date.now(), x: width / 2 - PLATFORM_WIDTH / 2, y: height - 50, type: 'normal', dx: 0, isBroken: false
            });

            // Pre-fill screen with platforms
            let currentY = height - 150;
            while (currentY > -height) {
                spawnPlatform(currentY, width, 1);
                currentY -= (Math.random() * 80 + 70); // Gap between 70 and 150
            }

            player.current = { x: width / 2 - PLAYER_SIZE / 2, y: height - 200, vy: 0, vx: 0 };
            
        } else {
            // Revive Mode (Second Chance)
            // Put a giant safe platform right beneath the player and clear nearby hazards
            const currentY = height / 2;
            player.current = { x: width / 2 - PLAYER_SIZE / 2, y: currentY - 100, vy: JUMP_FORCE, vx: 0 };
            
            // Remove platforms that are on screen to prevent unfair deaths
            platforms.current = platforms.current.filter(p => p.y < 0);
            
            // Add a safety net platform
            platforms.current.push({
                id: Date.now(), x: width / 2 - PLATFORM_WIDTH, y: currentY, type: 'normal', dx: 0, isBroken: false
            });
            // Extend its width visually by spawning two side by side
            platforms.current.push({
                id: Date.now()+1, x: width / 2, y: currentY, type: 'normal', dx: 0, isBroken: false
            });
        }

        setGameState('playing');
    };

    const spawnPlatform = (y: number, screenWidth: number, currentLevel: number) => {
        let type: PlatformType = 'normal';
        let dx = 0;

        const rand = Math.random();
        
        // Level probabilities
        if (currentLevel >= 2 && rand < 0.2) {
            type = 'moving';
            dx = (Math.random() > 0.5 ? 2 : -2) * (1 + currentLevel * 0.2);
        } else if (currentLevel >= 3 && rand > 0.8) {
            type = 'fragile';
        } else if (currentLevel >= 4 && rand > 0.4 && rand < 0.5) {
            type = 'spring';
        }

        // Increase chaos in level 5
        if (currentLevel === 5) {
            if (rand < 0.4) type = 'moving';
            else if (rand < 0.7) type = 'fragile';
            else if (rand < 0.8) type = 'spring';
            else type = 'normal';
        }

        const x = Math.random() * (screenWidth - PLATFORM_WIDTH);
        
        platforms.current.push({
            id: Date.now() + Math.random(),
            x, y, type, dx, isBroken: false
        });
    };

    const gameOver = () => {
        setGameState('second_chance');
        cancelAnimationFrame(requestRef.current!);
        if (score > highScore) setHighScore(Math.floor(score));
    };

    // ------------------------------------------------------------------------
    // PHYSICS LOOP (requestAnimationFrame)
    // ------------------------------------------------------------------------
    useEffect(() => {
        if (gameState !== 'playing') return;

        const loop = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            // 1. Player X Movement (Keyboard / Touch / Tilt)
            if (keys.current.left) player.current.vx = -6;
            else if (keys.current.right) player.current.vx = 6;
            else player.current.vx *= 0.8; // friction

            player.current.x += player.current.vx;

            // Screen Wrap
            if (player.current.x > width) player.current.x = -PLAYER_SIZE;
            if (player.current.x < -PLAYER_SIZE) player.current.x = width;

            // 2. Player Y Movement & Gravity
            player.current.vy += GRAVITY;
            player.current.y += player.current.vy;

            // 3. Collision Detection (Only when falling)
            if (player.current.vy > 0) {
                for (let i = 0; i < platforms.current.length; i++) {
                    const p = platforms.current[i];
                    if (p.isBroken) continue;

                    const isXOverlap = (player.current.x + PLAYER_SIZE - 10 > p.x) && (player.current.x + 10 < p.x + PLATFORM_WIDTH);
                    const isYOverlap = (player.current.y + PLAYER_SIZE > p.y) && (player.current.y + PLAYER_SIZE < p.y + PLATFORM_HEIGHT + player.current.vy);

                    if (isXOverlap && isYOverlap) {
                        // HIT!
                        if (p.type === 'fragile') {
                            p.isBroken = true; // Breaks instantly, no jump
                            continue;
                        }

                        if (p.type === 'spring') {
                            player.current.vy = SPRING_FORCE;
                        } else {
                            player.current.vy = JUMP_FORCE;
                        }
                        
                        // Small bounce effect on character (visual only via DOM)
                        const pEl = document.getElementById(\`platform-\${p.id}\`);
                        if (pEl) {
                            pEl.style.transform = \`translate3d(\${p.x}px, \${p.y + 10}px, 0)\`;
                            setTimeout(() => {
                                if (pEl) pEl.style.transform = \`translate3d(\${p.x}px, \${p.y}px, 0)\`;
                            }, 100);
                        }
                        break;
                    }
                }
            }

            // 4. Camera Follow & Score
            if (player.current.y < height / 2) {
                const diff = (height / 2) - player.current.y;
                player.current.y += diff;
                
                const currentScore = score + diff;
                setScore(currentScore);
                
                // Level Progression
                const newLevel = Math.min(5, Math.floor(currentScore / 2000) + 1);
                if (newLevel !== level) setLevel(newLevel);

                // Move platforms down
                platforms.current.forEach(p => {
                    p.y += diff;
                });

                // Spawn new platforms at the top
                const highestPlatform = platforms.current.reduce((min, p) => p.y < min ? p.y : min, height);
                if (highestPlatform > 0) {
                    // We need a platform above the screen
                    spawnPlatform(highestPlatform - (Math.random() * (80 + newLevel*10) + 50), width, newLevel);
                }
            }

            // 5. Update Platforms (Moving)
            platforms.current.forEach(p => {
                if (p.type === 'moving' && !p.isBroken) {
                    p.x += p.dx;
                    if (p.x < 0 || p.x + PLATFORM_WIDTH > width) {
                        p.dx *= -1; // Bounce off walls
                    }
                }
            });

            // 6. Cleanup invisible platforms
            platforms.current = platforms.current.filter(p => p.y < height + 50 && !p.isBroken);

            // 7. Death Check
            if (player.current.y > height) {
                gameOver();
                return;
            }

            // 8. PURE DOM RENDER
            const playerEl = document.getElementById('player-avatar');
            if (playerEl) {
                playerEl.style.transform = \`translate3d(\${player.current.x}px, \${player.current.y}px, 0)\`;
            }

            platforms.current.forEach(p => {
                const pEl = document.getElementById(\`platform-\${p.id}\`);
                if (pEl) {
                    pEl.style.transform = \`translate3d(\${p.x}px, \${p.y}px, 0)\`;
                }
            });

            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [gameState, score, level]);

    // ------------------------------------------------------------------------
    // CONTROLS
    // ------------------------------------------------------------------------
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = false;
        };

        // Device Tilt (Gyroscope)
        const handleOrientation = (e: DeviceOrientationEvent) => {
            const gamma = e.gamma; // left-to-right tilt in degrees
            if (gamma !== null) {
                player.current.vx = gamma / 4; // Sensitivity tweak
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('deviceorientation', handleOrientation);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);

    // Touch Controls
    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent, dir: 'left' | 'right') => {
        if (dir === 'left') keys.current.left = true;
        if (dir === 'right') keys.current.right = true;
    };
    const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent, dir: 'left' | 'right') => {
        if (dir === 'left') keys.current.left = false;
        if (dir === 'right') keys.current.right = false;
    };

    return (
        <div ref={containerRef} className="fixed inset-0 z-50 bg-[#0a0a0f] overflow-hidden font-sans select-none touch-none">
            
            {/* DYNAMIC BACKGROUND */}
            <div className="absolute inset-0 pointer-events-none transition-colors duration-1000" style={{
                background: level === 1 ? 'linear-gradient(to top, #1e1b4b, #000000)' :
                            level === 2 ? 'linear-gradient(to top, #312e81, #000000)' :
                            level === 3 ? 'linear-gradient(to top, #4c1d95, #000000)' :
                            level === 4 ? 'linear-gradient(to top, #831843, #000000)' :
                            'linear-gradient(to top, #020617, #000000)',
            }}>
                <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                <div className="absolute top-0 inset-x-0 h-[50vh] bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none perspective-1000 rotate-x-60 scale-150 origin-top" />
            </div>

            {/* HUD */}
            <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start pointer-events-none">
                <div className="flex gap-4 items-center">
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl w-12 h-12 flex items-center justify-center shadow-lg pointer-events-auto active:scale-95">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-2 shadow-lg flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <span className="font-black text-2xl text-white font-mono">{Math.floor(score)}</span>
                    </div>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Aşama {level}/5</span>
                </div>
            </div>

            {/* GAME ENTITIES (PURE DOM) */}
            {gameState === 'playing' && (
                <>
                    {/* Platforms */}
                    {platforms.current.map(p => (
                        <div
                            key={p.id}
                            id={\`platform-\${p.id}\`}
                            className="absolute rounded-full shadow-lg"
                            style={{
                                width: PLATFORM_WIDTH,
                                height: PLATFORM_HEIGHT,
                                top: 0, left: 0,
                                background: p.type === 'normal' ? 'linear-gradient(90deg, #22d3ee, #0ea5e9)' :
                                            p.type === 'moving' ? 'linear-gradient(90deg, #4ade80, #16a34a)' :
                                            p.type === 'fragile' ? 'linear-gradient(90deg, #ef4444, #b91c1c)' :
                                            'linear-gradient(90deg, #facc15, #ca8a04)', // spring
                                boxShadow: p.type === 'spring' ? '0 0 15px rgba(250,204,21,0.5)' : 
                                           p.type === 'fragile' ? '0 0 15px rgba(239,68,68,0.5)' : 'none',
                                willChange: 'transform'
                            }}
                        >
                            {p.type === 'spring' && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-3 bg-yellow-300 rounded-t-full opacity-80" />
                            )}
                        </div>
                    ))}

                    {/* Player */}
                    <div
                        id="player-avatar"
                        className="absolute will-change-transform z-10"
                        style={{ width: PLAYER_SIZE, height: PLAYER_SIZE, top: 0, left: 0 }}
                    >
                        <div className="w-full h-full rounded-[1rem] bg-black overflow-hidden border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                            <img src="/images/robot_moffi.jpg" className="w-full h-full object-cover scale-150 mix-blend-screen" />
                        </div>
                    </div>

                    {/* Touch Controls for Mobile */}
                    <div className="absolute bottom-10 left-10 right-10 flex justify-between z-30 sm:hidden">
                        <button 
                            className="w-20 h-20 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 active:bg-white/20"
                            onTouchStart={(e) => handleTouchStart(e, 'left')}
                            onTouchEnd={(e) => handleTouchEnd(e, 'left')}
                            onMouseDown={(e) => handleTouchStart(e, 'left')}
                            onMouseUp={(e) => handleTouchEnd(e, 'left')}
                        >
                            <span className="text-3xl text-white opacity-50">←</span>
                        </button>
                        <button 
                            className="w-20 h-20 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 active:bg-white/20"
                            onTouchStart={(e) => handleTouchStart(e, 'right')}
                            onTouchEnd={(e) => handleTouchEnd(e, 'right')}
                            onMouseDown={(e) => handleTouchStart(e, 'right')}
                            onMouseUp={(e) => handleTouchEnd(e, 'right')}
                        >
                            <span className="text-3xl text-white opacity-50">→</span>
                        </button>
                    </div>
                </>
            )}

            {/* START SCREEN */}
            <AnimatePresence>
                {gameState === 'start' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-40">
                        <div className="bg-[#111116] p-8 rounded-[2rem] shadow-[0_0_60px_rgba(34,211,238,0.2)] border border-white/10 text-center max-w-sm mx-4 transform transition-all">
                            <div className="w-24 h-24 rounded-[1rem] bg-black overflow-hidden mx-auto mb-6 border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.4)] relative">
                                <img src="/images/robot_moffi.jpg" className="w-full h-full object-cover scale-150 mix-blend-screen" />
                            </div>
                            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-2 uppercase tracking-tighter">Moffi Jump Pro</h2>
                            <p className="text-gray-400 mb-8 font-medium text-sm">Zıplayarak en tepeye ulaş! Cihazını sağa sola yatır veya ekrandaki butonları kullan.</p>
                            
                            <div className="grid grid-cols-2 gap-2 mb-8 text-left">
                                <div className="bg-white/5 p-2 rounded-lg flex items-center gap-2"><div className="w-4 h-2 bg-cyan-400 rounded-full"/> <span className="text-[10px] font-bold text-gray-300">Sabit Zemin</span></div>
                                <div className="bg-white/5 p-2 rounded-lg flex items-center gap-2"><div className="w-4 h-2 bg-green-500 rounded-full"/> <span className="text-[10px] font-bold text-gray-300">Hareketli</span></div>
                                <div className="bg-white/5 p-2 rounded-lg flex items-center gap-2"><div className="w-4 h-2 bg-red-500 rounded-full"/> <span className="text-[10px] font-bold text-gray-300">Kırılan</span></div>
                                <div className="bg-white/5 p-2 rounded-lg flex items-center gap-2"><div className="w-4 h-2 bg-yellow-400 rounded-full"/> <span className="text-[10px] font-bold text-gray-300">Mega Yay</span></div>
                            </div>

                            <button
                                onClick={() => initGame(false)}
                                className="w-full bg-white text-black py-4 rounded-xl font-black text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2"
                            >
                                <Play className="w-5 h-5 fill-black" /> Yükselişi Başlat
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SECOND CHANCE (MOFFI COIN) */}
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
                            
                            <h2 className="text-2xl font-black text-orange-400 uppercase tracking-tighter mb-2 mt-4">SİNYAL KAYBEDİLDİ!</h2>
                            <p className="text-gray-400 text-sm font-medium mb-6">
                                Boşluğa düştün. Ama <strong className="text-white">50 Moffi Coin</strong> karşılığında kurtarma dronu seni düştüğün yere geri bırakabilir!
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
                                            initGame(true); // revive
                                        }
                                    }}
                                    disabled={userCoins < 50}
                                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black rounded-xl text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                >
                                    50 Coin Öde & Kurtar <Zap className="w-5 h-5 fill-white" />
                                </button>
                                <button 
                                    onClick={() => setGameState('gameover')} 
                                    className="w-full py-4 bg-white/5 text-gray-400 font-bold rounded-xl text-sm hover:bg-white/10 transition-colors"
                                >
                                    Düşüşü Kabul Et (Çıkış)
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* GAMEOVER SCREEN */}
            <AnimatePresence>
                {gameState === 'gameover' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl z-50">
                        <div className="bg-[#111116] p-8 rounded-[2.5rem] shadow-[0_0_60px_rgba(239,68,68,0.2)] border border-red-500/20 text-center max-w-sm mx-4 transform transition-all w-full relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 to-orange-500" />
                            
                            <div className="text-gray-500 font-black mb-2 uppercase tracking-widest text-xs">SİSTEM ÇÖKTÜ</div>
                            <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 mb-6 drop-shadow-lg font-mono tracking-tighter">{Math.floor(score)}</h2>

                            <div className="grid grid-cols-2 gap-4 mb-8 w-full">
                                <div className="bg-black/50 p-4 rounded-2xl border border-white/5">
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Erişilen Aşama</div>
                                    <div className="text-2xl font-black text-cyan-400">{level}</div>
                                </div>
                                <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                                    <div className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mb-1">En Yüksek</div>
                                    <div className="text-2xl font-black text-amber-500">{Math.floor(Math.max(score, highScore))}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => onGameOver(Math.floor(score))}
                                    className="w-full bg-white text-black py-4 rounded-xl font-black shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition"
                                >
                                    Puanları Topla & Çık
                                </button>
                                <button
                                    onClick={() => initGame(false)}
                                    className="w-full bg-white/5 text-gray-400 py-4 rounded-xl font-bold hover:bg-white/10 transition"
                                >
                                    Sıfırdan Başla
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
`;

fs.writeFileSync('src/components/game/MoffiJumpGame.tsx', code, 'utf8');
console.log('Successfully overhauled MoffiJumpGame into a Doodle Jump style cyberpunk platformer!');
