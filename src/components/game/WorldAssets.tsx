import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// --- NEON CYBERPUNK COLORS ---
const C_ROAD = '#0f172a';
const C_GRID_1 = '#06b6d4'; // Cyan
const C_GRID_2 = '#f43f5e'; // Rose/Pink
const C_GLASS = '#1e1b4b';
const C_NEON_BLUE = '#00f6ff';
const C_NEON_PINK = '#ff00aa';
const C_NEON_YELLOW = '#ffea00';
const C_DARK = '#020617';

// =====================================================
// ROAD SEGMENT (Cyber Grid)
// =====================================================
export function RoadSegment({ length = 100, zPos = 0, level = 1 }: { length: number, zPos: number, level?: number }) {
    const gridColor = level % 2 === 0 ? C_GRID_2 : C_GRID_1;
    return (
        <group position={[0, 0, zPos]}>
            {/* Main Road Surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[10, length]} />
                <meshStandardMaterial color={C_ROAD} roughness={0.1} metalness={0.8} />
            </mesh>
            
            {/* Holographic Lane Dividers */}
            {[-1.25, 1.25].map((x, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.05, 0]}>
                    <planeGeometry args={[0.1, length]} />
                    <meshBasicMaterial color={gridColor} transparent opacity={0.6} />
                </mesh>
            ))}
            
            {/* Side Glowing Rails */}
            {[-4.2, 4.2].map((x, i) => (
                <mesh key={i} position={[x, 0.2, 0]} castShadow>
                    <boxGeometry args={[0.4, 0.4, length]} />
                    <meshStandardMaterial color={C_DARK} emissive={gridColor} emissiveIntensity={0.5} />
                </mesh>
            ))}

            {/* Void ground for outer edges */}
            {[-24, 24].map((x, i) => (
                <mesh key={i} position={[x, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[40, length]} />
                    <meshStandardMaterial color={C_DARK} roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
}

// =====================================================
// OBSTACLES (Sci-Fi / Cyberpunk)
// =====================================================

/** LASER BEAM — Jump Over (BARRIER_LOW) */
export function BarrierLow({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Side pillars */}
            {[-1.2, 1.2].map((x, i) => (
                <mesh key={i} position={[x, 0.5, 0]} castShadow>
                    <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
                    <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
                </mesh>
            ))}
            {/* Glowing Laser */}
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 2.4, 8]} />
                <meshBasicMaterial color={C_NEON_PINK} />
            </mesh>
            {/* Laser core */}
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 2.5, 8]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
        </group>
    );
}

/** FLYING DRONE / OVERHANG — Slide Under (BARRIER_HIGH) */
export function BarrierHigh({ position }: { position: [number, number, number] }) {
    const droneRef = useRef<THREE.Group>(null!);
    useFrame(({ clock }) => {
        if (droneRef.current) {
            droneRef.current.position.y = Math.sin(clock.elapsedTime * 3) * 0.15;
        }
    });

    return (
        <group position={position}>
            {/* Main Floating Structure */}
            <group ref={droneRef} position={[0, 1.8, 0]}>
                <mesh castShadow>
                    <boxGeometry args={[2.8, 0.6, 0.8]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.8} />
                </mesh>
                {/* Engine exhausts */}
                {[-1.2, 1.2].map((x, i) => (
                    <mesh key={i} position={[x, -0.3, 0]} rotation={[Math.PI, 0, 0]}>
                        <coneGeometry args={[0.25, 0.4, 8]} />
                        <meshBasicMaterial color={C_NEON_BLUE} />
                    </mesh>
                ))}
                {/* Neon Warning Strip */}
                <mesh position={[0, 0, 0.41]}>
                    <planeGeometry args={[2.6, 0.1]} />
                    <meshBasicMaterial color={C_NEON_YELLOW} />
                </mesh>
            </group>
            {/* Warning holograms on ground */}
            <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[2.8, 1]} />
                <meshBasicMaterial color={C_NEON_YELLOW} transparent opacity={0.2} />
            </mesh>
        </group>
    );
}

/** SERVER RACK / CRYSTAL — Dodge (BUSH) */
export function Bush({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.6, 0]} castShadow>
                <boxGeometry args={[0.8, 1.2, 0.8]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Blinking Data Lights */}
            {[0.2, 0.5, 0.8].map((y, i) => (
                <mesh key={i} position={[0, y, 0.41]}>
                    <planeGeometry args={[0.6, 0.05]} />
                    <meshBasicMaterial color={C_NEON_BLUE} />
                </mesh>
            ))}
        </group>
    );
}

/** PLASMA BARREL — Dodge (TRAFFIC_CONE) */
export function TrafficCone({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.5, 0]} castShadow>
                <cylinderGeometry args={[0.3, 0.4, 1, 12]} />
                <meshStandardMaterial color="#334155" metalness={1} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.5, 0]} scale={[1.05, 0.4, 1.05]}>
                <cylinderGeometry args={[0.3, 0.3, 1, 12]} />
                <meshBasicMaterial color={C_NEON_YELLOW} transparent opacity={0.8} />
            </mesh>
        </group>
    );
}

/** SECURITY GATE — 2 lane blocker (DOUBLE_LANE) — only center escape */
export function DoubleLaneBarrier({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Left Block */}
            <group position={[-2.5, 0, 0]}>
                <mesh position={[0, 1.5, 0]} castShadow>
                    <boxGeometry args={[2.4, 3, 0.8]} />
                    <meshStandardMaterial color="#020617" metalness={0.8} />
                </mesh>
                <mesh position={[0, 1.5, 0.41]}>
                    <planeGeometry args={[2, 0.1]} />
                    <meshBasicMaterial color={C_NEON_PINK} />
                </mesh>
            </group>
            {/* Right Block */}
            <group position={[2.5, 0, 0]}>
                <mesh position={[0, 1.5, 0]} castShadow>
                    <boxGeometry args={[2.4, 3, 0.8]} />
                    <meshStandardMaterial color="#020617" metalness={0.8} />
                </mesh>
                <mesh position={[0, 1.5, 0.41]}>
                    <planeGeometry args={[2, 0.1]} />
                    <meshBasicMaterial color={C_NEON_PINK} />
                </mesh>
            </group>
        </group>
    );
}

// =====================================================
// POWER-UP VISUALS
// =====================================================

export function PowerUpOrb({ position, color, emissive }: { position: [number, number, number], color: string, emissive: string }) {
    const orbRef = useRef<THREE.Group>(null!);
    useFrame(({ clock }) => {
        if (orbRef.current) {
            orbRef.current.rotation.y = clock.elapsedTime * 2;
            orbRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 4) * 0.15;
        }
    });

    return (
        <group ref={orbRef} position={position}>
            <mesh castShadow>
                <octahedronGeometry args={[0.5]} />
                <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1.5} wireframe />
            </mesh>
            <mesh>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshBasicMaterial color={emissive} />
            </mesh>
        </group>
    );
}

export const POWERUP_COLORS: Record<string, { color: string; emissive: string }> = {
    MAGNET: { color: C_NEON_PINK, emissive: C_NEON_PINK },
    ROCKET: { color: '#ff3300', emissive: '#ff3300' },
    SNAIL: { color: C_NEON_BLUE, emissive: C_NEON_BLUE },
    SHIELD: { color: '#ffffff', emissive: '#a855f7' },
    MULTIPLIER: { color: C_NEON_YELLOW, emissive: C_NEON_YELLOW },
};

// =====================================================
// SCENERY (Cyberpunk Buildings)
// =====================================================

export function TreeSimple({ position }: { position: [number, number, number] }) {
    const scale = 2 + Math.random() * 4;
    const isNeon = Math.random() > 0.7;
    const color = Math.random() > 0.5 ? C_NEON_BLUE : C_NEON_PINK;

    return (
        <group position={position}>
            <mesh position={[0, scale / 2, 0]} castShadow>
                <boxGeometry args={[1.5, scale, 1.5]} />
                <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Windows / Neon Accents */}
            {isNeon && (
                <mesh position={[0, scale / 2, 0.76]}>
                    <planeGeometry args={[1, scale * 0.8]} />
                    <meshBasicMaterial color={color} transparent opacity={0.3} wireframe />
                </mesh>
            )}
        </group>
    );
}
