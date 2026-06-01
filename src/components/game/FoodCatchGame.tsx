"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Timer, X, Trophy } from "lucide-react";

interface GameProps {
    onGameOver: (score: number) => void;
    onClose: () => void;
}

export default function FoodCatchGame({ onGameOver, onClose }: GameProps) {
    // GAME CONSTANTS
    const GAME_DURATION = 30; // seconds
    const SPAWN_RATE = 800; // ms

    // STATE
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [isPlaying, setIsPlaying] = useState(false);
    const [items, setItems] = useState<{ id: number; x: number; y: number; type: 'food' | 'poison' | 'bonus' }[]>([]);
    const [playerX, setPlayerX] = useState(50); // % position

    const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
    const spawnRef = useRef<NodeJS.Timeout | null>(null);
    const playerRef = useRef<HTMLDivElement>(null);

    // START GAME
    useEffect(() => {
        setIsPlaying(true);

        // Timer
        const timerInterval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Spawner
        spawnRef.current = setInterval(spawnItem, SPAWN_RATE);

        // Physics Loop (60 FPSish)
        gameLoopRef.current = setInterval(updatePhysics, 16);

        return () => {
            clearInterval(timerInterval);
            if (spawnRef.current) clearInterval(spawnRef.current);
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, []);

    // CONTROLS (Mouse/Touch)
    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const screenWidth = window.innerWidth;
            const percent = (clientX / screenWidth) * 100;
            setPlayerX(Math.min(Math.max(percent, 10), 90)); // Clamp 10-90%
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
        };
    }, []);

    // LOGIC
    const spawnItem = () => {
        const rand = Math.random();
        const type = rand > 0.8 ? 'poison' : rand > 0.95 ? 'bonus' : 'food';

        setItems(prev => [...prev, {
            id: Date.now(),
            x: Math.random() * 80 + 10, // 10-90%
            y: -10,
            type
        }]);
    };

    const updatePhysics = () => {
        setItems(prev => {
            const nextItems: typeof items = [];
            prev.forEach(item => {
                // Move down
                const speed = item.type === 'poison' ? 0.8 : 0.6; // Speed factor
                item.y += speed;

                // Collision Detection
                // Simple Hitbox: if item is close to standard player Y (approx 85%) and X is close
                const playerY = 85;
                const hitboxX = 15; // Width %
                const hitboxY = 10; // Height %

                const hitPlayer =
                    item.y > playerY - hitboxY &&
                    item.y < playerY + hitboxY &&
                    Math.abs(item.x - playerX) < hitboxX;

                if (hitPlayer) {
                    // Score logic
                    if (item.type === 'food') setScore(s => s + 10);
                    else if (item.type === 'bonus') setScore(s => s + 50);
                    else if (item.type === 'poison') setScore(s => Math.max(0, s - 30));
                    // Consumed
                    return;
                }

                if (item.y < 110) {
                    nextItems.push(item);
                }
            });
            return nextItems;
        });
    };

    const endGame = () => {
        setIsPlaying(false);
        if (spawnRef.current) clearInterval(spawnRef.current);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        onGameOver(score);
    };

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-sky-300 to-sky-100 overflow-hidden font-sans select-none touch-none">

            {/* UI HUD */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                <div className="bg-white/80 backdrop-blur rounded-2xl px-4 py-2 flex items-center gap-2 font-black text-xl shadow-lg border border-white/40">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <span className="text-foreground">{score}</span>
                </div>

                <div className="bg-white/80 backdrop-blur rounded-2xl px-4 py-2 flex items-center gap-2 font-black text-xl shadow-lg border border-white/40">
                    <Timer className="w-6 h-6 text-blue-500" />
                    <span className={timeLeft < 10 ? "text-red-500" : "text-foreground"}>{timeLeft}s</span>
                </div>

                <button
                    onClick={onClose}
                    className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition"
                >
                    <X className="w-6 h-6 text-gray-500" />
                </button>
            </div>

            {/* FALLING ITEMS */}
            {items.map(item => (
                <div
                    key={item.id}
                    className="absolute w-12 h-12 flex items-center justify-center transition-transform"
                    style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <span className="text-4xl drop-shadow-md">
                        {item.type === 'food' && '🍗'}
                        {item.type === 'poison' && '🍄'}
                        {item.type === 'bonus' && '🧁'}
                    </span>
                </div>
            ))}

            {/* PLAYER */}
            <div
                ref={playerRef}
                className="absolute bottom-[10%] w-24 h-24 transition-transform duration-75 ease-linear will-change-transform"
                style={{
                    left: `${playerX}%`,
                    transform: 'translateX(-50%)'
                }}
            >
                <div className="relative w-full h-full">
                    {/* Shadow */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/20 blur-md rounded-full" />
                    {/* Moffi */}
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/10476/10476140.png"
                        className="w-full h-full object-contain drop-shadow-xl"
                        alt="Player"
                    />
                </div>
            </div>

            {/* GROUND */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-emerald-500 border-t-8 border-emerald-600/50" />

        </div>
    );
}
