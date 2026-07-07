"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Torus, RoundedBox, Sphere } from "@react-three/drei";
import * as THREE from "three";

// --- TYPES ---
export type AnimState = "IDLE" | "RUN" | "JUMP" | "SLIDE" | "HIT" | "FALL" | "WAVE";

export type RascalProps = {
    state: AnimState;              // from game logic
    laneOffset: number;            // -1, 0, 1
    speed: number;                 // current speed
    grounded: boolean;             // is on ground
    emotion?: 'idle' | 'happy' | 'scared' | 'cool' | 'wink' | 'run' | 'hit' | 'proud'; // Extra visual flair
    onReady?: () => void;
};

// --- NEW MOFFI COLORS (Based on User Images) ---
const COLORS = {
    furBase: '#9370DB',    // Purple Fur
    furLight: '#B19CD9',   // Lighter purple for snout/ears
    clothes: '#FF8C00',    // Vibrant Orange Hoodie
    pants: '#1E90FF',      // Blue Shorts (Dodger Blue)
    logo: '#00BFFF',       // Light Blue "M" Glow
    nose: '#4B0082',       // Darker Purple Nose
    tongue: '#F43F5E',
    eye: '#000000',
    white: '#FFFFFF'
};

// --- COMPONENT ---
export function RascalCharacter({ state, laneOffset, speed, grounded, emotion, onReady }: RascalProps) {
    const group = useRef<THREE.Group>(null!);

    // Refs for Procedural Parts (Rig)
    const spine = useRef<THREE.Group>(null);
    const head = useRef<THREE.Group>(null);
    const jaw = useRef<THREE.Group>(null);
    const earL = useRef<THREE.Group>(null);
    const earR = useRef<THREE.Group>(null);
    const legL = useRef<THREE.Group>(null);
    const legR = useRef<THREE.Group>(null);
    const armL = useRef<THREE.Group>(null);
    const armR = useRef<THREE.Group>(null);
    const tail = useRef<THREE.Group>(null);
    const hood = useRef<THREE.Group>(null);
    const eyelidL = useRef<THREE.Group>(null);
    const eyelidR = useRef<THREE.Group>(null);
    const logoRef = useRef<THREE.Group>(null);

    // Blink State
    const blinkTimer = useRef(0);
    const nextBlink = useRef(2 + Math.random() * 3);

    // Notify ready
    useEffect(() => {
        onReady?.();
    }, [onReady]);

    // --- ANIMATION LOOP ---
    useFrame((stateThree, dt) => {
        if (!group.current) return;
        const time = stateThree.clock.elapsedTime;
        const runFreq = speed * 1.5;

        // 1. STATE MACHINE (Blend Logic via Math)
        let bounce = 0;

        if (state === 'JUMP') {
            spine.current?.position.lerp(new THREE.Vector3(0, 0.2, 0), 0.2);
            spine.current?.rotation.set(-0.5, 0, 0);
            spine.current?.scale.lerp(new THREE.Vector3(1, 1.2, 1), 0.2); // STRETCH

            armL.current?.rotation.set(2.5, 0, 0.5);
            armR.current?.rotation.set(2.5, 0, -0.5);

            legL.current?.rotation.set(1.5, 0, 0);
            legR.current?.rotation.set(1.5, 0, 0);
        }
        else if (state === 'SLIDE') {
            spine.current?.position.lerp(new THREE.Vector3(0, -0.4, 0), 0.2);
            spine.current?.rotation.set(0.4, 0, 0);
            spine.current?.scale.lerp(new THREE.Vector3(1.2, 0.7, 1.2), 0.2); // SQUASH

            armL.current?.rotation.set(0, 0, 1.5); armR.current?.rotation.set(0, 0, -1.5);
            legL.current?.rotation.set(-1.5, 0.5, 0); legR.current?.rotation.set(-1.5, -0.5, 0);
        }
        else if (state === 'RUN') {
            bounce = Math.abs(Math.sin(time * runFreq)) * 0.15;
            spine.current?.position.set(0, bounce, 0);

            const forwardLean = 0.15 + (speed / 45) * 0.3;
            spine.current?.rotation.set(forwardLean, 0, Math.sin(time * runFreq * 0.5) * 0.05);

            const lPhase = Math.sin(time * runFreq);
            const rPhase = Math.sin(time * runFreq + Math.PI);

            armL.current?.rotation.set(lPhase * 1.1, 0, 0.1);
            armR.current?.rotation.set(rPhase * 1.1, 0, -0.1);

            legL.current?.rotation.set(rPhase * 1.3, 0, 0);
            legR.current?.rotation.set(lPhase * 1.3, 0, 0);
        }
        else {
            const breathe = Math.sin(time * 2) * 0.02;
            spine.current?.position.set(0, breathe, 0);
            spine.current?.rotation.set(0, Math.sin(time * 0.5) * 0.1, 0);
            armL.current?.rotation.set(0, 0, 0.1); armR.current?.rotation.set(0, 0, -0.1);
            legL.current?.rotation.set(0, 0, 0); legR.current?.rotation.set(0, 0, 0);
            spine.current?.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        }

        // 2. ADVANCED CONTROL
        const bank = THREE.MathUtils.clamp(-laneOffset * 0.25, -0.3, 0.3);
        group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, bank, 8, dt);

        if (head.current) {
            const lookTurn = -laneOffset * 0.3;
            if (state === 'IDLE') {
                head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, Math.sin(time) * 0.2, 0.05);
            } else {
                head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, lookTurn, 8, dt);
                head.current.rotation.x = (state === 'RUN' ? 0.2 : 0);
            }
        }

        // 3. SECONDARY PHYSICS
        if (earL.current && earR.current) {
            const runDrag = state === 'RUN' ? -0.4 : 0;
            const flap = Math.cos(time * 25) * (state === 'RUN' ? 0.3 : 0.05);
            earL.current.rotation.x = THREE.MathUtils.lerp(earL.current.rotation.x, runDrag, 0.1);
            earL.current.rotation.z = 0.4 + flap;
            earR.current.rotation.x = THREE.MathUtils.lerp(earR.current.rotation.x, runDrag, 0.1);
            earR.current.rotation.z = -0.4 - flap;
        }

        if (tail.current) {
            tail.current.rotation.y = Math.cos(time * 20) * (state === 'RUN' ? 0.8 : 0.2);
            tail.current.rotation.x = -0.4 + (Math.sin(time * 10) * 0.2);
        }

        if (hood.current) {
            hood.current.rotation.x = THREE.MathUtils.lerp(hood.current.rotation.x, 0.4 + bounce * 2, 0.1);
        }

        // M Logo Pulse
        if (logoRef.current) {
            const pulse = 1 + Math.sin(time * 10) * 0.1;
            logoRef.current.scale.set(pulse, pulse, 1);
        }

        // 4. MICRO EXPRESSIONS (Blink)
        blinkTimer.current += dt;
        if (blinkTimer.current > nextBlink.current) {
            if (eyelidL.current) eyelidL.current.scale.y = 0.1;
            if (eyelidR.current) eyelidR.current.scale.y = 0.1;
            if (blinkTimer.current > nextBlink.current + 0.12) {
                if (eyelidL.current) eyelidL.current.scale.y = 1;
                if (eyelidR.current) eyelidR.current.scale.y = 1;
                blinkTimer.current = 0;
                nextBlink.current = 2 + Math.random() * 3;
            }
        }
    });

    return (
        <group ref={group}>
            {/* SPINE CHAIN */}
            <group ref={spine}>
                {/* --- MOFFI ORANGE HOODIE --- */}
                <mesh position={[0, 0.55, 0]} castShadow>
                    <boxGeometry args={[0.55, 0.65, 0.45]} />
                    <meshStandardMaterial color={COLORS.clothes} roughness={0.7} />
                </mesh>

                {/* Hoodie Bottom Trim */}
                <mesh position={[0, 0.25, 0]}>
                    <cylinderGeometry args={[0.28, 0.28, 0.1, 16]} />
                    <meshStandardMaterial color={COLORS.clothes} roughness={0.5} />
                </mesh>

                {/* M LOGO (Pure Geometry - No Network Fetch) */}
                <group ref={logoRef} position={[0, 0.55, 0.23]}>
                    {/* Left leg of M */}
                    <mesh position={[-0.08, 0, 0]}>
                        <boxGeometry args={[0.04, 0.18, 0.02]} />
                        <meshStandardMaterial color={COLORS.logo} emissive={COLORS.logo} emissiveIntensity={1} />
                    </mesh>
                    {/* Left diagonal of M */}
                    <mesh position={[-0.035, 0.02, 0]} rotation={[0, 0, 0.4]}>
                        <boxGeometry args={[0.04, 0.12, 0.02]} />
                        <meshStandardMaterial color={COLORS.logo} emissive={COLORS.logo} emissiveIntensity={1} />
                    </mesh>
                    {/* Right diagonal of M */}
                    <mesh position={[0.035, 0.02, 0]} rotation={[0, 0, -0.4]}>
                        <boxGeometry args={[0.04, 0.12, 0.02]} />
                        <meshStandardMaterial color={COLORS.logo} emissive={COLORS.logo} emissiveIntensity={1} />
                    </mesh>
                    {/* Right leg of M */}
                    <mesh position={[0.08, 0, 0]}>
                        <boxGeometry args={[0.04, 0.18, 0.02]} />
                        <meshStandardMaterial color={COLORS.logo} emissive={COLORS.logo} emissiveIntensity={1} />
                    </mesh>
                    {/* Glow Plane */}
                    <mesh position={[0, 0, -0.01]}>
                        <planeGeometry args={[0.28, 0.22]} />
                        <meshBasicMaterial color={COLORS.logo} transparent opacity={0.25} />
                    </mesh>
                </group>


                {/* --- HOOD --- */}
                <group ref={hood} position={[0, 0.88, -0.1]} rotation={[0.5, 0, 0]}>
                    <mesh>
                        <torusGeometry args={[0.26, 0.12, 12, 24]} />
                        <meshStandardMaterial color={COLORS.clothes} />
                    </mesh>
                    {/* Inner Hood Dark */}
                    <mesh position={[0, 0, -0.05]}>
                        <sphereGeometry args={[0.2, 16, 16]} />
                        <meshStandardMaterial color="#804700" />
                    </mesh>
                </group>

                {/* --- HEAD (Purple Cat) --- */}
                <group ref={head} position={[0, 1.1, 0.1]}>
                    {/* Main Head Rounded */}
                    <RoundedBox args={[0.65, 0.6, 0.6]} radius={0.15} smoothness={4}>
                        <meshStandardMaterial color={COLORS.furBase} />
                    </RoundedBox>

                    {/* Cheek Fluff (Purple) */}
                    <mesh position={[0.3, -0.1, 0.1]} rotation={[0, 0, -0.5]}>
                        <coneGeometry args={[0.15, 0.3, 4]} />
                        <meshStandardMaterial color={COLORS.furBase} />
                    </mesh>
                    <mesh position={[-0.3, -0.1, 0.1]} rotation={[0, 0, 0.5]}>
                        <coneGeometry args={[0.15, 0.3, 4]} />
                        <meshStandardMaterial color={COLORS.furBase} />
                    </mesh>

                    {/* Snout Area (Light Purple/White Wash) */}
                    <mesh position={[0, -0.1, 0.3]} castShadow>
                        <sphereGeometry args={[0.22, 16, 16]} />
                        <meshStandardMaterial color={COLORS.furLight} />
                    </mesh>

                    {/* Nose (Tiny Indigo Heart) */}
                    <mesh position={[0, -0.02, 0.42]}>
                        <sphereGeometry args={[0.06, 8, 8]} />
                        <meshStandardMaterial color={COLORS.nose} />
                    </mesh>

                    {/* EYES (Large & Friendly) */}
                    <group position={[0, 0.1, 0.31]}>
                        {/* Eye Base */}
                        <mesh position={[0.18, 0, 0]}><circleGeometry args={[0.1]} /><meshBasicMaterial color="black" /></mesh>
                        <mesh position={[-0.18, 0, 0]}><circleGeometry args={[0.1]} /><meshBasicMaterial color="black" /></mesh>

                        {/* Shine (Top Right) */}
                        <mesh position={[0.21, 0.04, 0.01]}><circleGeometry args={[0.03]} /><meshBasicMaterial color="white" /></mesh>
                        <mesh position={[-0.15, 0.04, 0.01]}><circleGeometry args={[0.03]} /><meshBasicMaterial color="white" /></mesh>

                        {/* EYELIDS (Purple) */}
                        <group ref={eyelidL} position={[0.18, 0.08, 0.01]}><mesh><planeGeometry args={[0.22, 0.12]} /><meshStandardMaterial color={COLORS.furBase} /></mesh></group>
                        <group ref={eyelidR} position={[-0.18, 0.08, 0.01]}><mesh><planeGeometry args={[0.22, 0.12]} /><meshStandardMaterial color={COLORS.furBase} /></mesh></group>
                    </group>

                    {/* CAT EARS (Pointy & Purple) */}
                    <group ref={earL} position={[0.25, 0.3, 0]}>
                        <mesh rotation={[0.2, 0, 0.3]}>
                            <coneGeometry args={[0.18, 0.4, 4]} />
                            <meshStandardMaterial color={COLORS.furBase} />
                        </mesh>
                        <mesh position={[0, -0.05, 0.02]} rotation={[0.2, 0, 0.3]} scale={[0.8, 0.8, 0.1]}>
                            <coneGeometry args={[0.15, 0.3, 4]} />
                            <meshStandardMaterial color={COLORS.furLight} />
                        </mesh>
                    </group>
                    <group ref={earR} position={[-0.25, 0.3, 0]}>
                        <mesh rotation={[0.2, 0, -0.3]}>
                            <coneGeometry args={[0.18, 0.4, 4]} />
                            <meshStandardMaterial color={COLORS.furBase} />
                        </mesh>
                        <mesh position={[0, -0.05, 0.02]} rotation={[0.2, 0, -0.3]} scale={[0.8, 0.8, 0.1]}>
                            <coneGeometry args={[0.15, 0.3, 4]} />
                            <meshStandardMaterial color={COLORS.furLight} />
                        </mesh>
                    </group>

                    {/* JAW / MOUTH */}
                    <group ref={jaw} position={[0, -0.25, 0.3]}>
                        {emotion === 'happy' && (
                            <mesh rotation={[0.4, 0, 0]}>
                                <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
                                <meshStandardMaterial color={COLORS.tongue} />
                            </mesh>
                        )}
                        {/* Whiskers */}
                        {[-1, 1].map(side => [0.1, 0, -0.1].map((y, i) => (
                            <mesh key={`${side}-${i}`} position={[side * 0.4, y - 0.05, 0]} rotation={[0, 0, side * 0.2]}>
                                <boxGeometry args={[0.3, 0.01, 0.01]} />
                                <meshBasicMaterial color="#000" transparent opacity={0.3} />
                            </mesh>
                        )))}
                    </group>
                </group>

                {/* --- LIMBS --- */}
                {/* Arms (Hoodie Sleeves) */}
                <group ref={armL} position={[0.32, 0.75, 0.05]}>
                    <mesh position={[0.05, -0.2, 0]} rotation={[0, 0, -0.1]}>
                        <capsuleGeometry args={[0.12, 0.4, 4, 8]} />
                        <meshStandardMaterial color={COLORS.clothes} />
                    </mesh>
                    <mesh position={[0.1, -0.45, 0]}>
                        <sphereGeometry args={[0.12, 12, 12]} />
                        <meshStandardMaterial color={COLORS.furBase} />
                    </mesh>
                </group>
                <group ref={armR} position={[-0.32, 0.75, 0.05]}>
                    <mesh position={[-0.05, -0.2, 0]} rotation={[0, 0, 0.1]}>
                        <capsuleGeometry args={[0.12, 0.4, 4, 8]} />
                        <meshStandardMaterial color={COLORS.clothes} />
                    </mesh>
                    <mesh position={[-0.1, -0.45, 0]}>
                        <sphereGeometry args={[0.12, 12, 12]} />
                        <meshStandardMaterial color={COLORS.furBase} />
                    </mesh>
                </group>

                {/* Legs (Blue Shorts + Fur) */}
                <group ref={legL} position={[0.18, 0.2, 0]}>
                    {/* Short Leg */}
                    <mesh position={[0, -0.05, 0]}>
                        <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
                        <meshStandardMaterial color={COLORS.pants} />
                    </mesh>
                    {/* Fur continuation */}
                    <mesh position={[0, -0.3, 0]}>
                        <capsuleGeometry args={[0.11, 0.3, 4, 8]} />
                        <meshStandardMaterial color={COLORS.furBase} />
                    </mesh>
                    {/* Foot */}
                    <mesh position={[0, -0.5, 0.1]} rotation={[0.2, 0, 0]}>
                        <boxGeometry args={[0.22, 0.12, 0.3]} />
                        <meshStandardMaterial color={COLORS.furBase} />
                    </mesh>
                </group>
                <group ref={legR} position={[-0.18, 0.2, 0]}>
                    <mesh position={[0, -0.05, 0]}>
                        <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
                        <meshStandardMaterial color={COLORS.pants} />
                    </mesh>
                    <mesh position={[0, -0.3, 0]}>
                        <capsuleGeometry args={[0.11, 0.3, 4, 8]} />
                        <meshStandardMaterial color={COLORS.furBase} />
                    </mesh>
                    <mesh position={[0, -0.5, 0.1]} rotation={[0.2, 0, 0]}>
                        <boxGeometry args={[0.22, 0.12, 0.3]} />
                        <meshStandardMaterial color={COLORS.furBase} />
                    </mesh>
                </group>

                {/* --- CAT TAIL (Purple & Fluffy) --- */}
                <group ref={tail} position={[0, 0.3, -0.25]}>
                    <mesh position={[0, 0.2, -0.1]} rotation={[0.6, 0, 0]}>
                        <capsuleGeometry args={[0.1, 0.7, 4, 8]} />
                        <meshStandardMaterial color={COLORS.furBase} />
                    </mesh>
                    {/* Tail Tip (Light) */}
                    <mesh position={[0, 0.55, -0.3]}>
                        <sphereGeometry args={[0.12, 8, 8]} />
                        <meshStandardMaterial color={COLORS.furLight} />
                    </mesh>
                </group>
            </group>

            {/* GROUND SHADOW */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.55, 16]} />
                <meshBasicMaterial color="black" opacity={0.3} transparent />
            </mesh>
        </group>
    );
}
