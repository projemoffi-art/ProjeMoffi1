import React from 'react';
import * as THREE from 'three';

// --- COLORS (No external deps) ---
const C_DIRT = '#8B4513';
const C_PATH = '#A0522D';
const C_GRASS = '#228B22';
const C_GLIGHT = '#32CD32';
const C_WOOD = '#5D4037';
const C_LEAF = '#1B5E20';
const C_MUSH = '#E53935';

// =====================================================
// ROAD SEGMENT
// =====================================================
export function RoadSegment({ length = 100, zPos = 0 }: { length: number, zPos: number }) {
    return (
        <group position={[0, 0, zPos]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[8, length]} />
                <meshStandardMaterial color={C_PATH} roughness={1} />
            </mesh>
            {[-4, 4].map((x, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]}>
                    <planeGeometry args={[1, length]} />
                    <meshStandardMaterial color={C_DIRT} />
                </mesh>
            ))}
            {/* Lane guides */}
            {[-1.25, 1.25].map((x, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 0]}>
                    <planeGeometry args={[0.06, length]} />
                    <meshStandardMaterial color={C_GLIGHT} opacity={0.25} transparent />
                </mesh>
            ))}
            {/* Side grass */}
            {[-14, 14].map((x, i) => (
                <mesh key={i} position={[x, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[20, length]} />
                    <meshStandardMaterial color={C_GRASS} />
                </mesh>
            ))}
        </group>
    );
}

// =====================================================
// OBSTACLES
// =====================================================

/** LOG — Jump Over (BARRIER_LOW) */
export function BarrierLow({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.38, 0.38, 2.6, 8]} />
                <meshStandardMaterial color={C_WOOD} roughness={0.9} />
            </mesh>
            {/* Moss patch */}
            <mesh position={[0.4, 0.75, 0.05]} scale={[0.6, 0.12, 0.5]}>
                <sphereGeometry args={[0.5]} />
                <meshStandardMaterial color={C_GLIGHT} />
            </mesh>
        </group>
    );
}

/** HANGING BRANCH — Slide Under (BARRIER_HIGH) */
export function BarrierHigh({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[-1.6, 1.5, 0]} castShadow>
                <boxGeometry args={[0.3, 3, 0.3]} />
                <meshStandardMaterial color={C_WOOD} />
            </mesh>
            <mesh position={[0, 2.0, 0]} castShadow>
                <boxGeometry args={[3.6, 0.35, 0.7]} />
                <meshStandardMaterial color={C_WOOD} />
            </mesh>
            {[-1, 0, 1].map((x, i) => (
                <mesh key={i} position={[x, 1.65, 0.15]} castShadow>
                    <dodecahedronGeometry args={[0.38]} />
                    <meshStandardMaterial color={C_LEAF} />
                </mesh>
            ))}
        </group>
    );
}

/** MUSHROOM — Dodge (BUSH) */
export function Bush({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.28, 0.38, 0.8, 8]} />
                <meshStandardMaterial color="#F5F5DC" />
            </mesh>
            <mesh position={[0, 0.85, 0]} castShadow>
                <sphereGeometry args={[0.82, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={C_MUSH} />
            </mesh>
            {[0.35, -0.35].flatMap((x) => [0.35, -0.35].map((z, j) => (
                <mesh key={`${x}-${j}`} position={[x, 1.25, z]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.13]} />
                    <meshBasicMaterial color="white" />
                </mesh>
            )))}
        </group>
    );
}

/** TREE STUMP — Dodge (TRAFFIC_CONE) */
export function TrafficCone({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.45, 0]} castShadow>
                <cylinderGeometry args={[0.58, 0.7, 0.9, 8]} />
                <meshStandardMaterial color={C_WOOD} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.92, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.52]} />
                <meshStandardMaterial color="#D2B48C" />
            </mesh>
        </group>
    );
}

/** DOUBLE LANE BLOCK — 2 lane blocker (DOUBLE_LANE) — only center escape */
export function DoubleLaneBarrier({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Left obstacle */}
            <group position={[-2.5, 0, 0]}>
                <mesh position={[0, 0.6, 0]} castShadow>
                    <boxGeometry args={[1.2, 1.2, 0.6]} />
                    <meshStandardMaterial color="#4a7c59" />
                </mesh>
            </group>
            {/* Right obstacle */}
            <group position={[2.5, 0, 0]}>
                <mesh position={[0, 0.6, 0]} castShadow>
                    <boxGeometry args={[1.2, 1.2, 0.6]} />
                    <meshStandardMaterial color="#4a7c59" />
                </mesh>
            </group>
        </group>
    );
}

// =====================================================
// POWER-UP VISUALS
// =====================================================

export function PowerUpOrb({ position, color, emissive }: { position: [number, number, number], color: string, emissive: string }) {
    return (
        <group position={position}>
            <mesh castShadow>
                <octahedronGeometry args={[0.55]} />
                <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1.2} />
            </mesh>
            {/* Inner glow core */}
            <mesh>
                <sphereGeometry args={[0.3, 12, 12]} />
                <meshBasicMaterial color={emissive} transparent opacity={0.4} />
            </mesh>
        </group>
    );
}

export const POWERUP_COLORS: Record<string, { color: string; emissive: string }> = {
    MAGNET: { color: '#db2777', emissive: '#db2777' },
    ROCKET: { color: '#ef4444', emissive: '#ef4444' },
    SNAIL: { color: '#10b981', emissive: '#10b981' },
    SHIELD: { color: '#60a5fa', emissive: '#3b82f6' },
    MULTIPLIER: { color: '#f59e0b', emissive: '#d97706' },
};

// =====================================================
// SCENERY
// =====================================================

export function TreeSimple({ position }: { position: [number, number, number] }) {
    const scale = 1.4 + Math.random() * 1.8;
    return (
        <group position={position} scale={scale}>
            <mesh position={[0, 1, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.32, 2, 6]} />
                <meshStandardMaterial color={C_WOOD} />
            </mesh>
            {[1.8, 3.0, 4.0].map((y, i) => (
                <mesh key={i} position={[0, y, 0]} castShadow>
                    <coneGeometry args={[1.4 - i * 0.3, 1.6, 7]} />
                    <meshStandardMaterial color={C_LEAF} roughness={0.8} />
                </mesh>
            ))}
        </group>
    );
}
