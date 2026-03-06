"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useSwipeable } from 'react-swipeable';
import { Trophy, Coins, AlertTriangle, Zap, ShieldCheck, Star, Snail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoffiCharacter, CharacterState } from './MoffiCharacter';
import { LevelGenerator, LevelObject } from './LevelGenerator';
import {
    RoadSegment, BarrierLow, BarrierHigh, Bush, TrafficCone,
    PowerUpOrb, POWERUP_COLORS, TreeSimple
} from './WorldAssets';

// =====================================================
// CONFIG
// =====================================================
const LANE_WIDTH = 2.5;
const SPEED_INITIAL = 12;
const SPEED_MAX = 52;
const JUMP_VELOCITY = 16;
const SLOW_MOTION_FACTOR = 0.38;
const SLIDE_DURATION = 750;
const COLLISION_W = 0.85;        // Normal hit box width
const COLLISION_GRACE_W = 0.62; // Forgiveness box (last-second-save feel)
const GRACE_WINDOW_MS = 150;    // 150ms grace before real collision

// =====================================================
// TYPES
// =====================================================
type GamePhase = 'menu' | 'playing' | 'gameover';

type PowerUpState = {
    type: 'MAGNET' | 'SHIELD' | 'MULTIPLIER' | 'ROCKET' | 'SNAIL' | null;
    expiresAt: number;
};

type DailyMission = {
    id: string;
    desc: string;
    type: 'coin' | 'slide' | 'powerup' | 'distance';
    target: number;
    progress: number;
    done: boolean;
};

const DAILY_MISSIONS: DailyMission[] = [
    { id: 'm1', desc: '500 Coin Topla', type: 'coin', target: 500, progress: 0, done: false },
    { id: 'm2', desc: '3 Kere Kay', type: 'slide', target: 3, progress: 0, done: false },
    { id: 'm3', desc: '2 PowerUp Kullan', type: 'powerup', target: 2, progress: 0, done: false },
];

// =====================================================
// MAIN COMPONENT
// =====================================================
export default function MoffiRunGame({
    onClose,
    onGameEnd
}: {
    onClose: () => void;
    onGameEnd?: (result: { score: number; coins: number; missionsCompleted: number }) => void;
}) {
    const [phase, setPhase] = useState<GamePhase>('menu');
    const [score, setScore] = useState(0);
    const [coins, setCoins] = useState(0);
    const [powerUp, setPowerUp] = useState<PowerUpState>({ type: null, expiresAt: 0 });
    const [missions, setMissions] = useState<DailyMission[]>(DAILY_MISSIONS);
    const [isClient, setIsClient] = useState(false);
    const scoreRef = useRef(0);
    const coinsRef = useRef(0);

    // Single source of truth — directly accessible inside useFrame
    const gs = useRef({
        started: false,
        distance: 0,
        speed: SPEED_INITIAL,
        lane: 0 as -1 | 0 | 1,
        isJumping: false,
        isSliding: false,
        y: 0,
        vy: 0,
        slideEndTime: 0,
        shieldActive: false,
        magnetActive: false,
        multiplier: 1,
        slowActive: false,
        missionsProgress: { coin: 0, slide: 0, powerup: 0, distance: 0 },
    });

    useEffect(() => { setIsClient(true); }, []);

    // ---- KEYBOARD CONTROLS ----
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!gs.current.started) return;
            const d = gs.current;
            if (e.key === 'ArrowLeft' || e.key === 'a') d.lane = Math.max(-1, d.lane - 1) as any;
            if (e.key === 'ArrowRight' || e.key === 'd') d.lane = Math.min(1, d.lane + 1) as any;
            if ((e.key === 'ArrowUp' || e.key === 'w') && !d.isJumping && !d.isSliding) {
                d.isJumping = true; d.vy = JUMP_VELOCITY;
            }
            if ((e.key === 'ArrowDown' || e.key === 's') && !d.isSliding && !d.isJumping) {
                d.isSliding = true;
                d.missionsProgress.slide++;
                setTimeout(() => { d.isSliding = false; }, SLIDE_DURATION);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // ---- SWIPE CONTROLS ----
    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => { if (!gs.current.started) return; gs.current.lane = Math.max(-1, gs.current.lane - 1) as any; },
        onSwipedRight: () => { if (!gs.current.started) return; gs.current.lane = Math.min(1, gs.current.lane + 1) as any; },
        onSwipedUp: () => {
            const d = gs.current;
            if (!d.started || d.isJumping || d.isSliding) return;
            d.isJumping = true; d.vy = JUMP_VELOCITY;
        },
        onSwipedDown: () => {
            const d = gs.current;
            if (!d.started || d.isSliding || d.isJumping) return;
            d.isSliding = true;
            d.missionsProgress.slide++;
            setTimeout(() => { d.isSliding = false; }, SLIDE_DURATION);
        },
        trackMouse: true,
        preventScrollOnSwipe: true,
    });

    const triggerStart = (e: React.PointerEvent) => {
        e.preventDefault();
        gs.current = {
            started: true,
            distance: 0,
            speed: SPEED_INITIAL,
            lane: 0,
            isJumping: false,
            isSliding: false,
            y: 0,
            vy: 0,
            slideEndTime: 0,
            shieldActive: false,
            magnetActive: false,
            multiplier: 1,
            slowActive: false,
            missionsProgress: { coin: 0, slide: 0, powerup: 0, distance: 0 },
        };
        scoreRef.current = 0;
        coinsRef.current = 0;
        setScore(0);
        setCoins(0);
        setPowerUp({ type: null, expiresAt: 0 });
        setMissions(DAILY_MISSIONS.map(m => ({ ...m, progress: 0, done: false })));
        setPhase('playing');
    };

    const handleCrash = () => {
        const completedCount = missions.filter(m => m.done).length;
        onGameEnd?.({ score: scoreRef.current, coins: coinsRef.current, missionsCompleted: completedCount });
        setPhase('gameover');
        gs.current.started = false;
    };

    const handleCoin = () => {
        coinsRef.current += 1;
        setCoins(c => c + 1);
        gs.current.missionsProgress.coin++;
        setMissions(prev => prev.map(m =>
            m.type === 'coin' ? { ...m, progress: gs.current.missionsProgress.coin, done: gs.current.missionsProgress.coin >= m.target } : m
        ));
    };

    const handlePowerUp = (type: 'MAGNET' | 'SHIELD' | 'MULTIPLIER' | 'ROCKET' | 'SNAIL') => {
        const durations: Record<string, number> = { MAGNET: 8000, SHIELD: 5000, MULTIPLIER: 10000, ROCKET: 6000, SNAIL: 5000 };
        const expiresAt = Date.now() + durations[type];
        setPowerUp({ type, expiresAt });
        gs.current.missionsProgress.powerup++;

        if (type === 'MAGNET') { gs.current.magnetActive = true; setTimeout(() => { gs.current.magnetActive = false; }, durations[type]); }
        if (type === 'SHIELD') { gs.current.shieldActive = true; } // cleared on first hit
        if (type === 'MULTIPLIER') { gs.current.multiplier = 2; setTimeout(() => { gs.current.multiplier = 1; }, durations[type]); }
        if (type === 'SNAIL') { gs.current.slowActive = true; setTimeout(() => { gs.current.slowActive = false; }, durations[type]); }
        if (type === 'ROCKET') {
            gs.current.speed = Math.min(gs.current.speed * 1.5, SPEED_MAX);
            setTimeout(() => { /* speed normalizes naturally */ }, durations[type]);
        }

        setMissions(prev => prev.map(m =>
            m.type === 'powerup' ? { ...m, progress: gs.current.missionsProgress.powerup, done: gs.current.missionsProgress.powerup >= m.target } : m
        ));
    };

    const handleScore = (s: number) => {
        scoreRef.current = s;
        setScore(s);
    };

    if (!isClient) return <div className="fixed inset-0 bg-[#0a1a0a]" />;

    return (
        <div className="fixed inset-0 bg-[#0a1a0a] z-[100] touch-none select-none" {...swipeHandlers}>
            {/* 3D CANVAS */}
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ fov: 60, position: [0, 5, 10], near: 0.1, far: 500 }}
            >
                <color attach="background" args={['#12231a']} />
                <ambientLight intensity={1.0} />
                <directionalLight position={[5, 15, 8]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} />
                <pointLight position={[-5, 8, 5]} intensity={1.2} color="#88ffaa" />
                <fog attach="fog" args={['#12231a', 22, 100]} />
                <Stars radius={150} count={2500} factor={3} />

                <GameScene
                    gs={gs}
                    phase={phase}
                    onCrash={handleCrash}
                    onCoin={handleCoin}
                    onPowerUp={handlePowerUp}
                    onScore={handleScore}
                />
            </Canvas>

            {/* HUD */}
            <AnimatePresence>
                {phase === 'playing' && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-0 left-0 right-0 p-5 flex justify-between items-start pointer-events-none z-[150]"
                    >
                        {/* Left: Score + Coins */}
                        <div className="flex flex-col gap-2">
                            <div className="bg-black/60 backdrop-blur px-5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
                                <Trophy className="text-amber-400 w-5 h-5" />
                                <span className="text-2xl font-black text-white tabular-nums">{score}m</span>
                            </div>
                            <div className="bg-black/60 backdrop-blur px-5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
                                <Coins className="text-yellow-400 w-5 h-5" />
                                <span className="text-2xl font-black text-white tabular-nums">{coins}</span>
                                {gs.current.multiplier > 1 && (
                                    <span className="text-xs font-black text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-full">×{gs.current.multiplier}</span>
                                )}
                            </div>
                        </div>

                        {/* Right: Active Power-Up */}
                        {powerUp.type && (
                            <div className="bg-black/60 backdrop-blur px-5 py-3 rounded-2xl border border-white/20 flex items-center gap-2">
                                {powerUp.type === 'MAGNET' && <span className="text-2xl">🧲</span>}
                                {powerUp.type === 'SHIELD' && <ShieldCheck className="text-blue-400 w-7 h-7" />}
                                {powerUp.type === 'MULTIPLIER' && <Star className="text-amber-400 w-7 h-7" />}
                                {powerUp.type === 'ROCKET' && <Zap className="text-red-400 w-7 h-7" />}
                                {powerUp.type === 'SNAIL' && <Snail className="text-green-400 w-7 h-7" />}
                                <div className="text-xs font-bold text-white/60 uppercase">
                                    {Math.max(0, Math.ceil((powerUp.expiresAt - Date.now()) / 1000))}s
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MENU */}
            <AnimatePresence>
                {phase === 'menu' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-lg z-[200]"
                    >
                        <motion.div
                            initial={{ y: -30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="text-center mb-12"
                        >
                            <h1 className="text-7xl font-black text-white italic tracking-tighter leading-none drop-shadow-2xl">
                                MOFFI<br />
                                <span className="text-orange-400">RUN</span>
                            </h1>
                        </motion.div>

                        {/* Daily Missions Preview */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-8 w-72">
                            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-3">Günlük Görevler</p>
                            {DAILY_MISSIONS.map(m => (
                                <div key={m.id} className="flex justify-between items-center py-1.5">
                                    <span className="text-white/70 text-sm">{m.desc}</span>
                                    <span className="text-white/30 text-xs font-bold">0/{m.target}</span>
                                </div>
                            ))}
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.93 }}
                            onPointerDown={triggerStart}
                            className="w-56 py-6 bg-orange-500 text-white text-3xl font-black rounded-[2rem] shadow-[0_12px_0_rgb(194,65,12)] active:translate-y-2 active:shadow-none transition-all cursor-pointer select-none"
                        >
                            OYNA
                        </motion.button>

                        <button onPointerDown={onClose} className="mt-6 text-white/30 text-xs font-bold hover:text-white/60 transition-colors">
                            KAPAT
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* GAME OVER */}
            <AnimatePresence>
                {phase === 'gameover' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring' }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl z-[210] p-8"
                    >
                        <AlertTriangle className="w-16 h-16 text-orange-500 mb-4" />
                        <h2 className="text-6xl font-black text-white italic mb-10">EYVAH!</h2>

                        <div className="flex gap-12 mb-10">
                            <div className="text-center">
                                <p className="text-white/30 text-xs font-black uppercase tracking-widest mb-1">Mesafe</p>
                                <p className="text-5xl font-black text-white">{score}m</p>
                            </div>
                            <div className="text-center">
                                <p className="text-white/30 text-xs font-black uppercase tracking-widest mb-1">Altın</p>
                                <p className="text-5xl font-black text-yellow-400">{coins}</p>
                            </div>
                        </div>

                        {/* Mission Results */}
                        <div className="w-full max-w-xs mb-8">
                            {missions.map(m => (
                                <div key={m.id} className={`flex justify-between items-center py-2 border-b border-white/5 ${m.done ? 'text-green-400' : 'text-white/40'}`}>
                                    <span className="text-sm font-bold">{m.done ? '✅' : '⬜️'} {m.desc}</span>
                                    <span className="text-xs">{Math.min(m.progress, m.target)}/{m.target}</span>
                                </div>
                            ))}
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onPointerDown={triggerStart}
                            className="w-full max-w-sm py-6 bg-orange-500 text-white font-black text-2xl rounded-[2rem] mb-4 shadow-[0_10px_0_rgb(194,65,12)] active:translate-y-2 active:shadow-none"
                        >
                            TEKRAR DENE
                        </motion.button>
                        <button onPointerDown={onClose} className="text-white/30 text-xs font-bold uppercase tracking-widest hover:text-white/60">
                            Ana Menü
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// =====================================================
// GAME SCENE (Three.js Canvas Inner)
// =====================================================
function GameScene({ gs, phase, onCrash, onCoin, onPowerUp, onScore }: any) {
    const { camera } = useThree();
    const playerRef = useRef<THREE.Group>(null!);
    const [chunks, setChunks] = useState<LevelObject[]>([]);
    const levelGen = useMemo(() => new LevelGenerator(-20), []);
    const nextChunkAt = useRef(-20);
    const graceTimers = useRef<Map<string, number>>(new Map());
    const startTime = useRef<number>(0);

    // Init world
    useEffect(() => {
        levelGen.reset(-20);
        let items: LevelObject[] = [];
        for (let i = 0; i < 20; i++) {
            const c = levelGen.generateNextChunk();
            items = [...items, ...c.objects];
        }
        setChunks(items);
        nextChunkAt.current = -20 - 20 * 30;
    }, []);

    // Static side trees
    const trees = useMemo(() => (
        new Array(80).fill(0).map((_, i) => (
            <TreeSimple key={i} position={[(i % 2 === 0 ? 1 : -1) * (11 + (i % 5) * 1.5), 0, -i * 14]} />
        ))
    ), []);

    useFrame((_, delta) => {
        if (!playerRef.current) return;

        // --- MENU: camera orbits Moffi ---
        if (!gs.current.started) {
            playerRef.current.position.set(0, 0, 0);
            camera.position.set(0, 4, 8);
            camera.lookAt(0, 1.2, 0);
            return;
        }

        const d = gs.current;
        const now = Date.now();

        // Mark start time
        if (startTime.current === 0) startTime.current = now;
        const elapsed = (now - startTime.current) / 1000;

        // --- SPEED CURVE (GDD spec: non-linear) ---
        const slow = d.slowActive ? SLOW_MOTION_FACTOR : 1;
        const targetSpeed = SPEED_INITIAL + Math.pow(elapsed, 1.3) * 0.35;
        d.speed = Math.min(SPEED_MAX * slow, Math.max(d.speed, targetSpeed));
        levelGen.currentSpeed = d.speed;

        const effectiveDelta = delta * slow;
        d.distance += d.speed * effectiveDelta;
        onScore(Math.floor(d.distance));

        // --- JUMP PHYSICS ---
        if (d.isJumping) {
            d.y += d.vy * effectiveDelta;
            d.vy -= 38 * effectiveDelta;
            if (d.y <= 0) { d.y = 0; d.isJumping = false; d.vy = 0; }
        }

        // --- PLAYER POSITION ---
        playerRef.current.position.z = -d.distance;
        playerRef.current.position.x = THREE.MathUtils.lerp(
            playerRef.current.position.x,
            d.lane * LANE_WIDTH,
            18 * effectiveDelta
        );
        playerRef.current.position.y = d.y;

        // --- CAMERA FOLLOW ---
        const speedFOVBoost = d.speed * 0.025;
        camera.position.z = playerRef.current.position.z + 9;
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4.5 + speedFOVBoost, 0.1);
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerRef.current.position.x * 0.35, 0.12);
        camera.lookAt(playerRef.current.position.x * 0.12, 1.3, playerRef.current.position.z - 6);

        // --- MAGNET: attract coins ---
        if (d.magnetActive) {
            chunks.forEach((obj: any) => {
                if (obj.type === 'COIN' && !obj.collected) {
                    const dz2 = Math.abs(playerRef.current.position.z - obj.z);
                    if (dz2 < 12) { obj.collected = true; onCoin(); }
                }
            });
        }

        // --- CHUNK STREAM ---
        if (playerRef.current.position.z < nextChunkAt.current + 200) {
            const c = levelGen.generateNextChunk();
            setChunks(prev => [...prev.filter(o => o.z < playerRef.current.position.z + 60), ...c.objects]);
            nextChunkAt.current -= c.length;
        }

        // --- COLLISION (with grace window) ---
        chunks.forEach((obj: any) => {
            if (obj.collected) return;
            const dz = Math.abs(playerRef.current.position.z - obj.z);
            if (dz > 2.0) return;

            const dx = Math.abs(playerRef.current.position.x - (obj.x * LANE_WIDTH));
            const pType: string = obj.type;

            // POWERUP COLLECTION
            if (['MAGNET', 'SHIELD', 'MULTIPLIER', 'ROCKET', 'SNAIL'].includes(pType)) {
                if (dx < 1.2) {
                    obj.collected = true;
                    onPowerUp(pType as any);
                }
                return;
            }

            // COIN COLLECTION
            if (pType === 'COIN') {
                if (dx < 0.9) { obj.collected = true; onCoin(); }
                return;
            }

            // OBSTACLE COLLISION — with grace window
            const gKey = obj.uniqueId;
            let effectiveW = COLLISION_W;
            if (!graceTimers.current.has(gKey)) {
                graceTimers.current.set(gKey, now);
                effectiveW = COLLISION_GRACE_W; // First frame of contact = forgiveness
            } else {
                const firstContact = graceTimers.current.get(gKey)!;
                effectiveW = (now - firstContact) < GRACE_WINDOW_MS ? COLLISION_GRACE_W : COLLISION_W;
            }

            if (dx < effectiveW) {
                // Jump clears BARRIER_LOW
                if (pType === 'BARRIER_LOW' && d.y > 1.2) return;
                // Slide clears BARRIER_HIGH
                if (pType === 'BARRIER_HIGH' && d.isSliding) return;

                // SHIELD absorbs one hit
                if (d.shieldActive) {
                    d.shieldActive = false;
                    obj.collected = true; // neutralize obstacle
                    return;
                }

                onCrash();
            }
        });
    });

    const laneDelta = (gs.current.lane * LANE_WIDTH) - (playerRef.current?.position.x ?? 0);
    const playerState: CharacterState = gs.current.isJumping ? 'JUMP'
        : gs.current.isSliding ? 'SLIDE'
            : !gs.current.started ? 'IDLE'
                : laneDelta > 0.3 ? 'SIDESTEP_RIGHT'
                    : laneDelta < -0.3 ? 'SIDESTEP_LEFT'
                        : 'RUN';

    return (
        <group>
            {/* World */}
            <RoadSegment length={4000} zPos={-2000} />
            {trees}

            {/* Player — real Mixamo skeletal character */}
            <group ref={playerRef}>
                <React.Suspense fallback={null}>
                    <MoffiCharacter
                        state={playerState}
                        laneTargetX={gs.current.lane * LANE_WIDTH}
                        speed={gs.current.speed}
                    />
                </React.Suspense>
            </group>

            {/* World Objects */}
            {chunks.map((obj: any) => {
                if (obj.collected) return null;
                const pos: [number, number, number] = [obj.x * LANE_WIDTH, obj.y || 0, obj.z];
                const pType: string = obj.type;

                if (pType === 'COIN') return (
                    <Float key={obj.uniqueId} speed={5} rotationIntensity={0.5}>
                        <mesh position={pos} rotation={[Math.PI / 2, 0, 0]} castShadow>
                            <cylinderGeometry args={[0.38, 0.38, 0.1, 16]} />
                            <meshStandardMaterial color="#fcd34d" emissive="#f59e0b" emissiveIntensity={0.7} metalness={0.8} roughness={0.2} />
                        </mesh>
                    </Float>
                );

                if (pType === 'BARRIER_LOW') return <BarrierLow key={obj.uniqueId} position={pos} />;
                if (pType === 'BARRIER_HIGH') return <BarrierHigh key={obj.uniqueId} position={pos} />;
                if (pType === 'BUSH') return <Bush key={obj.uniqueId} position={pos} />;
                if (pType === 'TRAFFIC_CONE') return <TrafficCone key={obj.uniqueId} position={pos} />;

                // Power-ups
                const pColors = POWERUP_COLORS[pType];
                if (pColors) return (
                    <Float key={obj.uniqueId} speed={3} floatIntensity={0.8}>
                        <PowerUpOrb position={pos} color={pColors.color} emissive={pColors.emissive} />
                    </Float>
                );

                return null;
            })}
        </group>
    );
}
