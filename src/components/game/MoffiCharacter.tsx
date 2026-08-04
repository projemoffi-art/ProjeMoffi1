"use client";

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type CharacterState =
    | 'IDLE' | 'RUN' | 'JUMP' | 'SLIDE'
    | 'HIT' | 'SIDESTEP_LEFT' | 'SIDESTEP_RIGHT';

interface MoffiCharacterProps {
    state: CharacterState;
    laneTargetX: number;
    speed: number;
}

// Moffi Colors
const C_FUR = '#7B4F9E';
const C_HOODIE = '#F97316';
const C_SHORTS = '#1E3A5F';
const C_SHOE = '#111111';
const C_EAR = '#5B2D8E';
const C_INNER = '#FF8FAB';

export function MoffiCharacter({ state, laneTargetX, speed }: MoffiCharacterProps) {
    const groupRef = useRef<THREE.Group>(null!);
    
    // Body parts refs for procedural animation
    const bodyRef = useRef<THREE.Group>(null!);
    const headRef = useRef<THREE.Group>(null!);
    const armLRef = useRef<THREE.Mesh>(null!);
    const armRRef = useRef<THREE.Mesh>(null!);
    const legLRef = useRef<THREE.Mesh>(null!);
    const legRRef = useRef<THREE.Mesh>(null!);

    useFrame((stateParams, delta) => {
        if (!groupRef.current) return;
        const time = stateParams.clock.elapsedTime;

        // 1. Lane Transition Lean
        const dx = laneTargetX - groupRef.current.position.x;
        // Snappier lean
        groupRef.current.rotation.z = THREE.MathUtils.lerp(
            groupRef.current.rotation.z,
            THREE.MathUtils.clamp(-dx * 0.4, -0.4, 0.4),
            15 * delta
        );

        // 2. Procedural Animation based on State
        const runCycle = time * speed * 0.8;
        
        if (state === 'RUN' || state === 'SIDESTEP_LEFT' || state === 'SIDESTEP_RIGHT') {
            // Bobbing body
            bodyRef.current.position.y = 0.5 + Math.abs(Math.sin(runCycle)) * 0.15;
            
            // Swing arms
            armLRef.current.rotation.x = Math.sin(runCycle) * 0.8;
            armRRef.current.rotation.x = -Math.sin(runCycle) * 0.8;
            
            // Swing legs
            legLRef.current.rotation.x = -Math.sin(runCycle) * 1.2;
            legRRef.current.rotation.x = Math.sin(runCycle) * 1.2;
            
            // Reset rotations
            bodyRef.current.rotation.x = 0.2; // slight forward lean
            
        } else if (state === 'JUMP') {
            bodyRef.current.position.y = 0.8; // High up
            bodyRef.current.rotation.x = -0.2; // Look up slightly
            
            armLRef.current.rotation.x = -Math.PI; // Arms up
            armRRef.current.rotation.x = -Math.PI;
            
            legLRef.current.rotation.x = 0.5; // Legs tucked
            legRRef.current.rotation.x = 0.5;
            
        } else if (state === 'SLIDE') {
            bodyRef.current.position.y = 0.2; // Low
            bodyRef.current.rotation.x = Math.PI / 2; // Flat on belly/sliding
            
            armLRef.current.rotation.x = Math.PI;
            armRRef.current.rotation.x = Math.PI;
            
            legLRef.current.rotation.x = 0;
            legRRef.current.rotation.x = 0;
        } else {
            // IDLE
            bodyRef.current.position.y = 0.5 + Math.sin(time * 2) * 0.05;
            bodyRef.current.rotation.x = 0;
            armLRef.current.rotation.x = 0;
            armRRef.current.rotation.x = 0;
            legLRef.current.rotation.x = 0;
            legRRef.current.rotation.x = 0;
        }
    });

    return (
        <group ref={groupRef}>
            <group ref={bodyRef} position={[0, 0.5, 0]}>
                {/* Torso (Hoodie) */}
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[0.5, 0.6, 0.4]} />
                    <meshStandardMaterial color={C_HOODIE} roughness={0.8} />
                </mesh>
                
                {/* Shorts */}
                <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.52, 0.25, 0.42]} />
                    <meshStandardMaterial color={C_SHORTS} />
                </mesh>

                {/* Head */}
                <group ref={headRef} position={[0, 0.55, 0]}>
                    <mesh castShadow>
                        <boxGeometry args={[0.55, 0.55, 0.55]} />
                        <meshStandardMaterial color={C_FUR} roughness={0.9} />
                    </mesh>
                    
                    {/* Face (Simple eyes) */}
                    <mesh position={[-0.12, 0.05, 0.28]}>
                        <planeGeometry args={[0.08, 0.08]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <mesh position={[0.12, 0.05, 0.28]}>
                        <planeGeometry args={[0.08, 0.08]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>

                    {/* Ears */}
                    <mesh position={[-0.2, 0.35, 0]} castShadow>
                        <coneGeometry args={[0.15, 0.3, 4]} />
                        <meshStandardMaterial color={C_EAR} />
                    </mesh>
                    <mesh position={[0.2, 0.35, 0]} castShadow>
                        <coneGeometry args={[0.15, 0.3, 4]} />
                        <meshStandardMaterial color={C_EAR} />
                    </mesh>
                </group>

                {/* Arms */}
                <group position={[-0.35, 0.2, 0]}>
                    <mesh ref={armLRef} position={[0, -0.25, 0]} castShadow>
                        <boxGeometry args={[0.15, 0.5, 0.15]} />
                        <meshStandardMaterial color={C_HOODIE} />
                    </mesh>
                </group>
                <group position={[0.35, 0.2, 0]}>
                    <mesh ref={armRRef} position={[0, -0.25, 0]} castShadow>
                        <boxGeometry args={[0.15, 0.5, 0.15]} />
                        <meshStandardMaterial color={C_HOODIE} />
                    </mesh>
                </group>

                {/* Legs */}
                <group position={[-0.15, -0.5, 0]}>
                    <mesh ref={legLRef} position={[0, -0.25, 0]} castShadow>
                        <boxGeometry args={[0.18, 0.5, 0.18]} />
                        <meshStandardMaterial color={C_FUR} />
                        {/* Shoe */}
                        <mesh position={[0, -0.28, 0.05]}>
                            <boxGeometry args={[0.2, 0.15, 0.25]} />
                            <meshStandardMaterial color={C_SHOE} />
                        </mesh>
                    </mesh>
                </group>
                <group position={[0.15, -0.5, 0]}>
                    <mesh ref={legRRef} position={[0, -0.25, 0]} castShadow>
                        <boxGeometry args={[0.18, 0.5, 0.18]} />
                        <meshStandardMaterial color={C_FUR} />
                        {/* Shoe */}
                        <mesh position={[0, -0.28, 0.05]}>
                            <boxGeometry args={[0.2, 0.15, 0.25]} />
                            <meshStandardMaterial color={C_SHOE} />
                        </mesh>
                    </mesh>
                </group>
            </group>
        </group>
    );
}
