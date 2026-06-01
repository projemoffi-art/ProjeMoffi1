"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X, Play } from "lucide-react";

interface GameProps {
    onGameOver: (score: number) => void;
    onClose: () => void;
}

export default function MoffiJumpGame({ onGameOver, onClose }: GameProps) {
    // CONSTANTS
    const GRAVITY = 0.6;
    const JUMP_FORCE = -8;
    const OBSTACLE_SPEED = 3;
    const OBSTACLE_GAP = 200;
    const OBSTACLE_WIDTH = 60;

    // STATE
    const [gameState, setGameState] = useState<'start' | 'ready' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // REFS
    const birdY = useRef(300);
    const birdVelocity = useRef(0);
    const obstacles = useRef<{ id: number, x: number, topHeight: number, passed: boolean }[]>([]);
    const stickers = useRef<{ id: number, x: number, y: number, collected: boolean }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>();

    // INIT
    const prepareGame = () => {
        setGameState('ready');
        setScore(0);
        // Center bird based on container if possible, or safe default
        const height = containerRef.current?.clientHeight || 600;
        birdY.current = height / 2 - 20;
        birdVelocity.current = 0;
        obstacles.current = [];
        stickers.current = [];
    };

    const startGame = () => {
        setGameState('playing');
        jump();
    };

    const jump = () => {
        if (gameState === 'ready') startGame();
        if (gameState !== 'playing') return;
        birdVelocity.current = JUMP_FORCE;
    };

    const spawnObstacle = (xOffset: number, containerHeight: number) => {
        const minHeight = 50;
        // Ensure gap fits: Container - Gap - BottomMargin
        const availableSpace = containerHeight - OBSTACLE_GAP - 100; // 100 margin
        const maxHeight = Math.max(minHeight + 50, availableSpace);

        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

        obstacles.current.push({
            id: Date.now() + Math.random(),
            x: xOffset,
            topHeight,
            passed: false
        });

        if (Math.random() > 0.4) {
            stickers.current.push({
                id: Date.now() + Math.random(),
                x: xOffset + 20,
                y: topHeight + OBSTACLE_GAP / 2 - 15,
                collected: false
            });
        }
    };

    const handleGameOver = () => {
        setGameState('gameover');
        if (score > highScore) setHighScore(score);
        cancelAnimationFrame(requestRef.current!);
    };

    // GAME LOOP
    useEffect(() => {
        if (gameState !== 'playing' && gameState !== 'ready') return;

        const loop = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            // HOVER ONLY IN READY MODE
            if (gameState === 'ready') {
                // Simple sine wave hover
                const time = Date.now() / 300;
                birdY.current = (height / 2 - 20) + Math.sin(time) * 10;
                updateDOM();
                requestRef.current = requestAnimationFrame(loop);
                return;
            }

            // --- PHYSICS (PLAYING) ---

            // 1. Spawning Logic (First run or continuous)
            if (obstacles.current.length === 0) {
                spawnObstacle(width + 100, height);
            } else if (obstacles.current[obstacles.current.length - 1].x < width - 250) {
                spawnObstacle(width, height);
            }

            // 2. Update Bird
            birdVelocity.current += GRAVITY;
            birdY.current += birdVelocity.current;

            // Floor/Ceiling
            if (birdY.current > height - 40 || birdY.current < 0) {
                handleGameOver();
                return; // Stop loop
            }

            // 3. Move Objects & Collision
            const birdRect = {
                l: 55, r: 85, // Shrink hitbox horizontally slightly (visual is 50-90)
                t: birdY.current + 12, b: birdY.current + 28 // Shrink vertical
            };

            // Move Obstacles
            obstacles.current.forEach(obs => {
                obs.x -= OBSTACLE_SPEED;

                // Collision
                const obsL = obs.x;
                const obsR = obs.x + OBSTACLE_WIDTH;

                // Check Horizontal Overlap
                if (birdRect.r > obsL && birdRect.l < obsR) {
                    // Check Vertical Overlap (Hit Top Pipe OR Hit Bottom Pipe)
                    if (birdRect.t < obs.topHeight || birdRect.b > obs.topHeight + OBSTACLE_GAP) {
                        handleGameOver();
                    }
                }

                // Score Pass
                if (!obs.passed && birdRect.l > obsR) {
                    obs.passed = true;
                    // Optional: Add score for passing pipe? We rely on stickers though.
                }
            });

            // Move Stickers
            stickers.current.forEach(s => {
                s.x -= OBSTACLE_SPEED;
                if (!s.collected) {
                    const dx = (s.x + 15) - (70); // 70 is bird center X approx
                    const dy = (s.y + 15) - (birdY.current + 20);
                    if (dx * dx + dy * dy < 900) { // 30px radius sq
                        s.collected = true;
                        setScore(prev => prev + 1);
                    }
                }
            });

            // Cleanup
            if (obstacles.current.length > 0 && obstacles.current[0].x < -100) obstacles.current.shift();
            if (stickers.current.length > 0 && stickers.current[0].x < -100) stickers.current.shift();

            updateDOM();
            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [gameState]);

    // DOM UPDATES (Direct manipulation for performance, React state for Score/Gameover)
    // We only force re-render for Score updates (handled by setScore) or GameState.
    // We DO NOT force render per frame for position anymore (Optimization).
    // Instead we render the arrays. But React won't see ref changes.
    // COMPROMISE: We need `setTick` IF we map over obstacles in JSX. 
    // Optimization: Use `setTick` but maybe throttle it? Or just trust modern JS engines. 
    // Let's stick to setTick for simplicity but remove instant-death logic.

    // Actually, to fix "Instant Death", the 'ready' state is key.
    // Also, we need to make sure we 'render' the obstacles.
    // If I don't setTick, the obstacles won't move on screen (just in memory).
    const [, setTick] = useState(0);
    const updateDOM = () => {
        setTick(t => t + 1);
    };

    // Initial setup for 'ready' state when component mounts or game restarts
    useEffect(() => {
        if (gameState === 'start') {
            prepareGame();
        }
    }, [gameState]);


    return (
        <div ref={containerRef} className="fixed inset-0 z-50 bg-[#4EC0CA] overflow-hidden font-sans select-none touch-none" onClick={jump}>

            {/* BACKGROUND DECOR */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-[#DED895] border-t-4 border-[#543847]" />
            <div className="absolute bottom-20 left-10 w-20 h-20 bg-white/20 rounded-full blur-xl" />
            <div className="absolute top-20 right-10 w-32 h-32 bg-white/20 rounded-full blur-xl" />

            {/* HUD */}
            <div className="absolute top-6 left-6 z-20 flex gap-4">
                <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="bg-card rounded-full p-2 shadow-lg">
                    <X className="w-6 h-6 text-foreground" />
                </button>
                <div className="bg-white/90 rounded-full px-6 py-2 shadow-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-black text-2xl text-foreground">{score}</span>
                </div>
            </div>

            {/* GAME ELEMENTS */}
            {(gameState === 'playing' || gameState === 'ready') && (
                <>
                    {/* Obstacles */}
                    {obstacles.current.map((obs) => (
                        <div key={obs.id}>
                            {/* Top Pipe */}
                            <div
                                className="absolute bg-[#73BF2E] border-2 border-[#558C22]"
                                style={{
                                    left: obs.x, top: 0, height: obs.topHeight, width: OBSTACLE_WIDTH,
                                    borderBottomLeftRadius: 10, borderBottomRightRadius: 10
                                }}
                            />
                            {/* Bottom Pipe */}
                            <div
                                className="absolute bg-[#73BF2E] border-2 border-[#558C22]"
                                style={{
                                    left: obs.x, top: obs.topHeight + OBSTACLE_GAP, bottom: 0, width: OBSTACLE_WIDTH,
                                    borderTopLeftRadius: 10, borderTopRightRadius: 10
                                }}
                            />
                        </div>
                    ))}

                    {/* Stickers */}
                    {stickers.current.map((sticker) => !sticker.collected && (
                        <div
                            key={sticker.id}
                            className="absolute w-8 h-8 flex items-center justify-center animate-pulse"
                            style={{ left: sticker.x, top: sticker.y }}
                        >
                            <span className="text-2xl filter drop-shadow-lg">⭐</span>
                        </div>
                    ))}

                    {/* Bird */}
                    <div
                        id="bird"
                        className="absolute left-[50px] w-10 h-10 transition-transform duration-75"
                        style={{ transform: `translateY(${birdY.current}px) rotate(${gameState === 'ready' ? 0 : Math.min(birdVelocity.current * 3, 30)}deg)` }}
                    >
                        <img src="https://cdn-icons-png.flaticon.com/512/10476/10476140.png" className="w-full h-full object-contain drop-shadow-lg" />
                    </div>

                    {/* TAP TO START OVERLAY */}
                    {gameState === 'ready' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none fade-in">
                            <div className="bg-black/50 text-white px-6 py-3 rounded-full animate-bounce font-bold text-xl backdrop-blur-sm">
                                👆 Başlamak İçin Dokun
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* START SCREEN */}
            {gameState === 'start' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-30">
                    <div className="bg-card p-8 rounded-3xl shadow-2xl text-center max-w-sm mx-4 transform transition-all hover:scale-105">
                        <img src="https://cdn-icons-png.flaticon.com/512/10476/10476140.png" className="w-20 h-20 mx-auto mb-4 animate-bounce" />
                        <h2 className="text-3xl font-black text-[#5B4D9D] mb-2">Moffi Jump</h2>
                        <p className="text-gray-500 mb-6 font-medium">Zıplamak için ekrana dokun. Engelleri aş ve stickerları topla!</p>
                        <button
                            onClick={(e) => { e.stopPropagation(); prepareGame(); }}
                            className="w-full bg-[#5B4D9D] text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-[#4a3f82] transition flex items-center justify-center gap-2"
                        >
                            <Play className="w-6 h-6 fill-current" /> Oyna
                        </button>
                    </div>
                </div>
            )}

            {/* GAMEOVER SCREEN */}
            {gameState === 'gameover' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30">
                    <div className="bg-card p-8 rounded-3xl shadow-2xl text-center max-w-sm mx-4 animate-in fade-in zoom-in duration-300">
                        <div className="text-gray-400 font-bold mb-2 uppercase tracking-widest text-xs">Oyun Bitti</div>
                        <h2 className="text-5xl font-black text-[#5B4D9D] mb-6">{score}</h2>

                        <div className="grid grid-cols-2 gap-4 mb-8 w-full">
                            <div className="bg-gray-50 p-3 rounded-xl border border-card-border">
                                <div className="text-xs text-gray-400 font-bold uppercase">Skor</div>
                                <div className="text-xl font-black text-foreground">{score}</div>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                                <div className="text-xs text-yellow-600 font-bold uppercase">En Yüksek</div>
                                <div className="text-xl font-black text-yellow-500">{Math.max(score, highScore)}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={(e) => { e.stopPropagation(); onGameOver(score); }}
                                className="w-full bg-[#5B4D9D] text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-[#4a3f82] transition"
                            >
                                Puanları Topla
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); prepareGame(); }}
                                className="w-full bg-card text-gray-600 border-2 border-card-border py-3.5 rounded-xl font-bold hover:bg-gray-50 transition"
                            >
                                Tekrar Dene
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
