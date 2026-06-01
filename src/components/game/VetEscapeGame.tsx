"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
    PerspectiveCamera,
    OrbitControls,
    Html,
    Stars,
    Float,
    useTexture,
    Text
} from "@react-three/drei";
import { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Joystick as NippleJoystick } from 'react-joystick-component';
import { Footprints, AlertTriangle, Pause, Lock, Key, Volume2, Ghost, Search, Video, ShieldCheck, Dog } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
type GameState = 'intro' | 'playing' | 'caught' | 'level_complete' | 'paused';
type LayoutType = 'center' | 'sides' | 'scattered';
type CameraMode = 'follow' | 'free';

// --- CONFIG ---
const EXIT_POS = new THREE.Vector3(0, 0, -9.5);
// Ensure keys are safely away from start (0,0,8)
const POSSIBLE_KEY_SPOTS = [
    new THREE.Vector3(-8, 0.5, -8),
    new THREE.Vector3(8, 0.5, -8),
    new THREE.Vector3(-8, 0.5, 5),
    new THREE.Vector3(8, 0.5, 5),
    new THREE.Vector3(0, 0.5, -5),
];

// --- STATES (GLOBAL REFS FOR PERFORMANCE) ---
const movementRef = { x: 0, y: 0, active: false };

// --- 3D COMPONENTS ---

function Player({ positionRef, onMove, isMovingRef }: any) {
    const groupRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (!groupRef.current || !positionRef.current) return;

        // 1. MOVEMENT LOGIC
        if (movementRef.active) {
            const speed = 5.0 * delta;
            const moveX = movementRef.x * speed;
            const moveZ = -movementRef.y * speed;

            const currentPos = positionRef.current;
            const nextX = currentPos.x + moveX;
            const nextZ = currentPos.z + moveZ;

            if (nextX > -9.5 && nextX < 9.5) currentPos.x = nextX;
            if (nextZ > -10 && nextZ < 9.5) currentPos.z = nextZ;

            const angle = Math.atan2(movementRef.x, -movementRef.y);
            if (movementRef.x !== 0 || movementRef.y !== 0) {
                groupRef.current.rotation.y = angle;
            }

            isMovingRef.current = true;
        } else {
            isMovingRef.current = false;
        }

        groupRef.current.position.set(positionRef.current.x, positionRef.current.y, positionRef.current.z);

        if (bodyRef.current && isMovingRef.current) {
            bodyRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 15) * 0.1;
            bodyRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 15) * 0.05;
        }

        onMove(positionRef.current);
    });

    return (
        <group ref={groupRef} position={[0, 0, 8]}>
            <spotLight position={[0, 4, 0]} intensity={0.5} castShadow angle={0.5} penumbra={1} />

            {/* NAME TAG */}
            <Html position={[0, 1.2, 0]} center transform sprite>
                <div className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full font-bold backdrop-blur-sm border border-card-border">MOFFI</div>
            </Html>

            <mesh ref={bodyRef} position={[0, 0.5, 0]} castShadow>
                {/* Visuals: Dark Brown / Chocolate Dog to contrast with Yellow Key */}
                <boxGeometry args={[0.4, 0.45, 0.7]} />
                <meshStandardMaterial color="#78350f" /> {/* Dark Brown */}

                <group position={[0, 0.3, 0.3]} rotation={[-0.2, 0, 0]}>
                    <mesh><boxGeometry args={[0.35, 0.35, 0.35]} /><meshStandardMaterial color="#92400e" /></mesh>
                    <mesh position={[0.15, 0.2, -0.05]} rotation={[0.5, 0.2, 0]}><boxGeometry args={[0.1, 0.25, 0.1]} /><meshStandardMaterial color="#78350f" /></mesh>
                    <mesh position={[-0.15, 0.2, -0.05]} rotation={[0.5, -0.2, 0]}><boxGeometry args={[0.1, 0.25, 0.1]} /><meshStandardMaterial color="#78350f" /></mesh>
                    <mesh position={[0.1, 0.05, 0.18]}><sphereGeometry args={[0.04]} /><meshStandardMaterial color="white" /></mesh>
                    <mesh position={[-0.1, 0.05, 0.18]}><sphereGeometry args={[0.04]} /><meshStandardMaterial color="white" /></mesh>
                    <mesh position={[0, -0.08, 0.18]}><boxGeometry args={[0.1, 0.08, 0.05]} /><meshStandardMaterial color="#000" /></mesh>
                    <mesh position={[0, 0.05, 0.2]}><sphereGeometry args={[0.03]} /><meshStandardMaterial color="#000" /></mesh>
                </group>
                <group position={[0, 0.1, -0.35]} rotation={[0.2, 0, 0]}>
                    <mesh><boxGeometry args={[0.08, 0.08, 0.3]} /><meshStandardMaterial color="#78350f" /></mesh>
                </group>
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <circleGeometry args={[0.4, 16]} />
                <meshBasicMaterial color="#000" opacity={0.3} transparent />
            </mesh>
        </group>
    );
}

function Enemy({ route, playerPosRef, onCaught, distractedPos }: any) {
    const ref = useRef<THREE.Group>(null);
    const [currentPoint, setCurrentPoint] = useState(0);
    const speed = 2.4;

    useFrame((state, delta) => {
        if (!ref.current || !playerPosRef.current) return;
        let target = new THREE.Vector3();
        if (distractedPos) target.copy(distractedPos);
        else target.set(route[currentPoint].x, 0, route[currentPoint].z);

        const currentPos = ref.current.position;
        const direction = new THREE.Vector3().subVectors(target, currentPos);

        if (direction.length() < 0.2 && !distractedPos) {
            setCurrentPoint((prev) => (prev + 1) % route.length);
        } else {
            direction.normalize();
            currentPos.add(direction.multiplyScalar(speed * delta));
            ref.current.lookAt(target);
        }

        if (currentPos.distanceTo(playerPosRef.current) < 5) {
            const enemyDir = new THREE.Vector3(0, 0, 1).applyQuaternion(ref.current.quaternion);
            const toPlayer = new THREE.Vector3().subVectors(playerPosRef.current, currentPos).normalize();
            if (enemyDir.angleTo(toPlayer) < (60 * Math.PI) / 360) {
                onCaught();
            }
        }
    });

    return (
        <group ref={ref} position={[route[0].x, 0, route[0].z]}>
            <spotLight position={[0, 1.5, 0.5]} target={ref.current} angle={0.6} penumbra={0.5} intensity={5} distance={7} color="#fef08a" castShadow />
            <group position={[0, 0, 0]}>
                <mesh position={[0, 0.9, 0]} castShadow><capsuleGeometry args={[0.25, 1.8]} /><meshStandardMaterial color="#f1f5f9" /></mesh>
                <mesh position={[0, 1.65, 0.15]}><boxGeometry args={[0.25, 0.08, 0.1]} /><meshStandardMaterial color="#1e293b" /></mesh>
                <mesh position={[0, 0.9, 0]}><boxGeometry args={[0.55, 1.2, 0.2]} /><meshStandardMaterial color="#e2e8f0" transparent opacity={0.8} /></mesh>
            </group>
        </group>
    );
}

function LevelMap({ layout, hasKey, keyPos, doorOpen }: any) {
    const obstacles = useMemo(() => {
        const prefabs = {
            'center': [
                { pos: [0, 0.6, 0], size: [4, 1.2, 4], color: '#475569' },
                { pos: [-6, 0.5, 6], size: [2, 1, 2], color: '#0ea5e9' },
                { pos: [6, 0.5, 6], size: [2, 1, 2], color: '#0ea5e9' },
                { pos: [-8, 1, -8], size: [1, 2, 1], color: '#22c55e' },
            ],
            'sides': [
                { pos: [-5, 0.6, -2], size: [2, 1.2, 6], color: '#475569' },
                { pos: [5, 0.6, -2], size: [2, 1.2, 6], color: '#475569' },
                { pos: [0, 0.5, 3], size: [2, 1, 2], color: '#0ea5e9' },
                { pos: [0, 1, -8], size: [1, 2, 1], color: '#22c55e' },
            ],
            'scattered': [
                { pos: [-4, 0.5, -4], size: [2, 1, 2], color: '#0ea5e9' },
                { pos: [4, 0.5, -4], size: [2, 1, 2], color: '#0ea5e9' },
                { pos: [-6, 0.5, 4], size: [2, 1, 2], color: '#0ea5e9' },
                { pos: [6, 0.5, 4], size: [2, 1, 2], color: '#0ea5e9' },
                { pos: [0, 0.6, 0], size: [2, 1.2, 2], color: '#475569' },
            ]
        };
        return prefabs[layout as LayoutType] || prefabs['center'];
    }, [layout]);

    return (
        <group>
            {/* Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[22, 22]} />
                <meshStandardMaterial color="#f3f4f6" />
            </mesh>
            <gridHelper args={[22, 11, 0x000000, 0x000000]} position={[0, 0.01, 0]} />

            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

            {/* Walls */}
            <Wall position={[0, 2, -10.5]} args={[21, 4, 1]} />
            <Wall position={[0, 2, 10.5]} args={[21, 4, 1]} />
            <Wall position={[-10.5, 2, 0]} args={[1, 4, 21]} />
            <Wall position={[10.5, 2, 0]} args={[1, 4, 21]} />

            {/* Obstacles */}
            {obstacles.map((obs: any, idx: number) => (
                <Wall key={idx} position={obs.pos} args={obs.size} color={obs.color} />
            ))}

            {/* Exit */}
            <group position={[0, 0, -10]}>
                {!doorOpen ? (
                    <mesh position={[0, 1.5, 0]}>
                        <boxGeometry args={[3, 3, 0.5]} />
                        <meshStandardMaterial color="#ef4444" />
                        <Html position={[0, 0, 0.5]} center transform ><div className="bg-red-600 p-2 rounded-lg shadow-xl"><Lock className="text-white w-8 h-8" /></div></Html>
                    </mesh>
                ) : (
                    <mesh position={[0, 1.5, 0]}>
                        <boxGeometry args={[3, 3, 0.5]} />
                        <meshStandardMaterial color="#22c55e" opacity={0.2} transparent />
                    </mesh>
                )}
            </group>

            {/* Key */}
            {!hasKey && (
                <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                    <group position={[keyPos.x, 0.8, keyPos.z]}>
                        <mesh castShadow>
                            <dodecahedronGeometry args={[0.3]} />
                            <meshStandardMaterial color="#fbbf24" metalness={0.8} />
                        </mesh>
                        <pointLight intensity={2} color="orange" distance={3} />
                        <Html position={[0, 0.5, 0]} center><Key className="text-yellow-400 w-6 h-6 animate-bounce" /></Html>
                    </group>
                </Float>
            )}
        </group>
    );
}

function Wall({ position, args, color = "#94a3b8" }: any) {
    return (
        <mesh position={new THREE.Vector3(...position)} castShadow receiveShadow>
            <boxGeometry args={args} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
}

// --- LOGIC HELPERS ---
function GameController({ cameraMode, playerPosRef }: { cameraMode: CameraMode, playerPosRef: any }) {
    useFrame((state) => {
        if (cameraMode !== 'follow') return;
        const target = playerPosRef.current;
        const camPos = new THREE.Vector3(target.x, 20, target.z + 12);
        state.camera.position.lerp(camPos, 0.1);
        state.camera.lookAt(target.x, 0, target.z);
    });
    return null;
}

// --- MAIN COMPONENT ---
export default function VetEscapeGame({ onClose, onGameOver }: any) {
    const [levelData, setLevelData] = useState<any>(null);
    const [gameState, setGameState] = useState<GameState>('intro');

    const playerPosRef = useRef(new THREE.Vector3(0, 0, 8));
    const isMovingRef = useRef(false);

    const [hasKey, setHasKey] = useState(false);
    const [doorOpen, setDoorOpen] = useState(false);
    const [distraction, setDistraction] = useState<THREE.Vector3 | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [cameraMode, setCameraMode] = useState<CameraMode>('follow');

    useEffect(() => {
        const layouts: LayoutType[] = ['center', 'sides', 'scattered'];
        const chosenLayout = layouts[Math.floor(Math.random() * layouts.length)];
        const chosenKeyPos = POSSIBLE_KEY_SPOTS[Math.floor(Math.random() * POSSIBLE_KEY_SPOTS.length)];

        let route = [];
        if (chosenLayout === 'center') route = [new THREE.Vector3(-7, 0, -7), new THREE.Vector3(7, 0, -7), new THREE.Vector3(7, 0, 7), new THREE.Vector3(-7, 0, 7)];
        else if (chosenLayout === 'sides') route = [new THREE.Vector3(0, 0, -6), new THREE.Vector3(0, 0, 6), new THREE.Vector3(-6, 0, 0), new THREE.Vector3(6, 0, 0)];
        else route = [new THREE.Vector3(-6, 0, -6), new THREE.Vector3(6, 0, 6), new THREE.Vector3(-6, 0, 6), new THREE.Vector3(6, 0, -6)];

        setLevelData({ layout: chosenLayout, keyPos: chosenKeyPos, enemyRoute: route });

        movementRef.x = 0;
        movementRef.y = 0;
        movementRef.active = false;
    }, []);

    const handleMove = (evt: any) => {
        if (gameState !== 'playing') return;
        movementRef.x = evt.x || 0;
        movementRef.y = evt.y || 0;
        movementRef.active = true;
    };

    const handleStop = () => {
        movementRef.active = false;
        movementRef.x = 0;
        movementRef.y = 0;
    };

    const onPlayerMove = (pos: THREE.Vector3) => {
        if (!levelData) return;
        if (!hasKey && pos.distanceTo(levelData.keyPos) < 1.0) {
            setHasKey(true);
            flashMessage("ANAHTAR BULUNDU! 🔑");
        }
        if (pos.distanceTo(EXIT_POS) < 2.0) {
            if (hasKey && !doorOpen) {
                setDoorOpen(true);
                flashMessage("KAPI AÇILDI! KOŞ! 🏃‍♂️");
            }
            if (doorOpen && pos.z < -8.5 && gameState !== 'level_complete') {
                setGameState('level_complete');
                onGameOver(250);
            }
        }
    };

    const flashMessage = (msg: string) => {
        setMessages([msg]);
        setTimeout(() => setMessages([]), 2500);
    };

    const toggleCamera = () => {
        setCameraMode(prev => prev === 'follow' ? 'free' : 'follow');
        flashMessage(cameraMode === 'follow' ? "KAMERA: SERBEST MOD" : "KAMERA: TAKİP MODU");
    };

    if (!levelData) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black font-sans text-white select-none overflow-hidden touch-none">

            <div className="absolute inset-0 z-10">
                <Canvas shadows dpr={[1, 1.5]}>
                    <PerspectiveCamera makeDefault position={[0, 18, 14]} fov={45} />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 20, 5]} intensity={1} castShadow />

                    {/* Camera Controllers */}
                    <GameController cameraMode={cameraMode} playerPosRef={playerPosRef} />

                    {/* Free Camera Controls - Full Freedom */}
                    <OrbitControls
                        enabled={cameraMode === 'free'}
                        makeDefault={cameraMode === 'free'}
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={5}
                        maxDistance={50}
                        maxPolarAngle={Math.PI / 2.1} // Prevent going under the floor
                    />

                    <group>
                        <Player positionRef={playerPosRef} onMove={onPlayerMove} isMovingRef={isMovingRef} />
                        <LevelMap layout={levelData.layout} hasKey={hasKey} keyPos={levelData.keyPos} doorOpen={doorOpen} />
                        {gameState === 'playing' && (
                            <Enemy route={levelData.enemyRoute} playerPosRef={playerPosRef} distractedPos={distraction} onCaught={() => setGameState('caught')} />
                        )}
                    </group>
                </Canvas>
            </div>

            {/* UI LAYER (z-20) */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none z-20">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-card-border flex items-center gap-3">
                    <div className="bg-purple-500/20 p-1.5 rounded-full"><Footprints className="text-purple-400 w-4 h-4" /></div>
                    <div className="flex flex-col"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">GÖREV</span><span className="font-bold text-sm">{hasKey ? "ÇIKIŞA GİT" : "ANAHTARI BUL"}</span></div>
                </div>
                <div className="flex gap-2">
                    <button onClick={toggleCamera} className="pointer-events-auto flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700 px-4 py-2 rounded-full transition border border-card-border backdrop-blur-md">
                        {cameraMode === 'follow' ? (
                            <>
                                <Video className="w-5 h-5 text-green-400" />
                                <span className="text-xs font-bold text-white hidden sm:block">TAKİP MODU</span>
                            </>
                        ) : (
                            <>
                                <Search className="w-5 h-5 text-blue-400" />
                                <span className="text-xs font-bold text-blue-200 hidden sm:block">SERBEST MOD</span>
                            </>
                        )}
                    </button>
                    <button onClick={onClose} className="pointer-events-auto bg-red-500/80 hover:bg-red-600 p-2 rounded-full transition"><Pause className="w-5 h-5" /></button>
                </div>
            </div>

            {/* MESSAGES */}
            <AnimatePresence>
                {messages.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-24 left-0 right-0 flex justify-center pointer-events-none z-20">
                        <div className="bg-black/80 text-white px-6 py-2 rounded-xl font-bold border border-card-border shadow-2xl backdrop-blur">{messages[0]}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CONTROLS LAYER (z-30) */}
            {gameState === 'playing' && cameraMode === 'follow' && (
                <>
                    {/* CUSTOM JOYSTICK WITH CUTE DOG STICK */}
                    <div className="absolute bottom-12 left-12 z-50 rounded-full bg-white/5 backdrop-blur-sm shadow-xl border border-card-border">
                        <div className="relative">
                            <NippleJoystick
                                size={120}
                                sticky={false}
                                baseColor="transparent"
                                stickColor="transparent"
                                move={handleMove}
                                stop={handleStop}
                                stickImage="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Dog%20Face.png"
                            />
                        </div>
                    </div>

                    <div className="absolute bottom-12 right-12 z-50 pointer-events-auto">
                        <button onClick={() => {
                            setDistraction(playerPosRef.current.clone());
                            flashMessage("HAVLADIN! 📣");
                            setTimeout(() => setDistraction(null), 4000);
                        }} className="w-20 h-20 bg-pink-600 rounded-full border-4 border-pink-400 shadow-xl active:scale-90 transition-transform flex items-center justify-center group text-white">
                            <Volume2 className="w-8 h-8 group-hover:scale-110 transition" />
                        </button>
                    </div>
                </>
            )}

            {/* FREE CAM HINT */}
            {gameState === 'playing' && cameraMode === 'free' && (
                <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none z-40">
                    <span className="bg-blue-600/80 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg animate-pulse">
                        👆 Ekrana dokun ve gez : Haritayı Keşfet!
                    </span>
                </div>
            )}

            <AnimatePresence>
                {(gameState === 'intro' || gameState === 'caught' || gameState === 'level_complete') && (
                    <div className="absolute inset-0 z-[60] bg-black/90 flex items-center justify-center p-6">
                        {gameState === 'intro' && (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center w-full max-w-sm">
                                <Ghost className="w-20 h-20 text-purple-400 mx-auto mb-6" />
                                <h1 className="text-4xl font-black mb-4">GİZLİ GÖREV</h1>
                                <p className="text-slate-400 mb-8">Yakalanmadan anahtarı bul ve kaç!</p>
                                <button onClick={() => setGameState('playing')} className="w-full py-4 bg-purple-600 rounded-xl font-bold text-xl hover:scale-105 transition">BAŞLA</button>
                            </motion.div>
                        )}
                        {gameState === 'caught' && (
                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center">
                                <AlertTriangle className="w-24 h-24 text-red-500 mx-auto mb-4 animate-bounce" />
                                <h2 className="text-5xl font-black mb-8 text-white">YAKALANDIN</h2>
                                <button onClick={onClose} className="px-10 py-4 bg-card text-red-900 rounded-full font-bold hover:scale-105 transition">ANA MENÜ</button>
                            </motion.div>
                        )}
                        {gameState === 'level_complete' && (
                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center">
                                <ShieldCheck className="w-24 h-24 text-green-400 mx-auto mb-4" />
                                <h2 className="text-4xl font-black mb-8 text-white">GÖREV TAMAM!</h2>
                                <button onClick={onClose} className="px-10 py-4 bg-card text-green-900 rounded-full font-bold hover:scale-105 transition">DEVAM ET</button>
                            </motion.div>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
