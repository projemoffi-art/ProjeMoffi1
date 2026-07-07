"use client";

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface ApparelState {
    body: 'sweatshirt' | 'singlet' | 'pajamas' | null;
    head: 'crown' | 'pirate_hat' | 'top_hat' | 'beanie' | null;
    eyes: 'sunglasses' | 'glasses' | 'eyepatch' | null;
    hands: 'gloves' | 'boxing' | null;
    feet: 'sneakers' | 'boots' | null;
}

interface Mascot3DCanvasProps {
    selectedApparel: ApparelState;
    activeTool: 'styling' | 'comb' | 'scissors' | 'grow' | 'walk';
    isBlinking?: boolean;
}

// Global interface for fur strand data
interface FurStrand {
    id: number;
    position: [number, number, number];
    normal: [number, number, number];
    initialLength: number;
    currentLength: number;
    rotation: [number, number, number]; // pitch, yaw, roll
    ref: React.RefObject<THREE.Mesh | null>;
}

// Inner Scene Component to access three hooks like useFrame, useThree
function MascotScene({ selectedApparel, activeTool, isBlinking }: Mascot3DCanvasProps) {
    const { camera, raycaster, pointer, scene } = useThree();
    
    // Group and mesh refs for skeletal/joint animation
    const mascotGroupRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Mesh>(null);
    const headRef = useRef<THREE.Mesh>(null);
    const leftArmJointRef = useRef<THREE.Group>(null);
    const rightArmJointRef = useRef<THREE.Group>(null);
    const leftLegJointRef = useRef<THREE.Group>(null);
    const rightLegJointRef = useRef<THREE.Group>(null);
    
    // Mouse dragging state for grooming tools
    const isDragging = useRef(false);
    const prevPointer = useRef({ x: 0, y: 0 });

    // Generate fur strands distributed on the head sphere
    const furStrands = useMemo(() => {
        const strands: FurStrand[] = [];
        const count = 120;
        const radius = 1.05; // Slightly larger than head sphere radius

        // Fibonacci sphere algorithm for uniform point distribution
        for (let i = 0; i < count; i++) {
            const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
            const radiusAtY = Math.sqrt(1 - y * y); // radius at y

            const goldenRatio = Math.PI * (3 - Math.sqrt(5));
            const theta = goldenRatio * i;

            const x = Math.cos(theta) * radiusAtY;
            const z = Math.sin(theta) * radiusAtY;

            // We only want fur on the top/sides/back, not directly on the face/eyes
            // Face is around positive Z (z > 0.4) and center Y
            const isFace = z > 0.5 && y > -0.2 && y < 0.4;
            if (!isFace) {
                const normal: [number, number, number] = [x, y, z];
                strands.push({
                    id: i,
                    position: [x * radius, y * radius, z * radius],
                    normal,
                    initialLength: 0.15 + Math.random() * 0.08,
                    currentLength: 0.18,
                    rotation: [0, 0, 0],
                    ref: React.createRef<THREE.Mesh>()
                });
            }
        }
        return strands;
    }, []);

    // Pointer event listeners to track dragging
    useEffect(() => {
        const handleDown = () => {
            isDragging.current = true;
            prevPointer.current = { x: pointer.x, y: pointer.y };
        };
        const handleUp = () => {
            isDragging.current = false;
        };

        window.addEventListener('mousedown', handleDown);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchstart', handleDown);
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousedown', handleDown);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchstart', handleDown);
            window.removeEventListener('touchend', handleUp);
        };
    }, [pointer]);

    // Handle frame updates (Skeletal Animations + Interactive Grooming physics)
    useFrame((state) => {
        const t = state.clock.getElapsedTime();

        // 1. ANIMATION STATE MACHINE
        if (activeTool === 'walk') {
            // WALK ANIMATION (Kemik Sallantısı)
            if (leftLegJointRef.current) leftLegJointRef.current.rotation.x = Math.sin(t * 8) * 0.4;
            if (rightLegJointRef.current) rightLegJointRef.current.rotation.x = -Math.sin(t * 8) * 0.4;
            
            if (leftArmJointRef.current) {
                leftArmJointRef.current.rotation.x = -Math.sin(t * 8) * 0.3;
                leftArmJointRef.current.rotation.z = -0.2;
            }
            if (rightArmJointRef.current) {
                rightArmJointRef.current.rotation.x = Math.sin(t * 8) * 0.3;
                rightArmJointRef.current.rotation.z = 0.2;
            }

            if (bodyRef.current) {
                bodyRef.current.position.y = Math.abs(Math.sin(t * 16)) * 0.08;
                bodyRef.current.rotation.y = Math.sin(t * 8) * 0.05;
            }
            if (headRef.current) {
                headRef.current.rotation.x = Math.sin(t * 16) * 0.05;
                headRef.current.rotation.y = Math.sin(t * 8) * 0.03;
            }
        } else {
            // IDLE ANIMATION (Nefes Alma ve Hafif Kafa Bobbing)
            if (leftLegJointRef.current) {
                leftLegJointRef.current.rotation.x = 0;
                leftLegJointRef.current.rotation.y = 0.1;
            }
            if (rightLegJointRef.current) {
                rightLegJointRef.current.rotation.x = 0;
                rightLegJointRef.current.rotation.y = -0.1;
            }
            
            // Waving arm if styling
            if (leftArmJointRef.current) {
                leftArmJointRef.current.rotation.x = 0;
                leftArmJointRef.current.rotation.z = -0.2 - Math.sin(t * 2) * 0.05;
            }
            if (rightArmJointRef.current) {
                if (activeTool === 'styling') {
                    // Hello Waving animation
                    rightArmJointRef.current.rotation.z = Math.PI / 1.6 + Math.sin(t * 12) * 0.15;
                    rightArmJointRef.current.rotation.x = Math.sin(t * 6) * 0.1;
                } else {
                    rightArmJointRef.current.rotation.x = 0;
                    rightArmJointRef.current.rotation.z = 0.2 + Math.sin(t * 2) * 0.05;
                }
            }

            if (bodyRef.current) {
                bodyRef.current.position.y = 0;
                // Breathing scale
                const breathe = 1 + Math.sin(t * 2.2) * 0.015;
                bodyRef.current.scale.set(1, breathe, 1);
                bodyRef.current.rotation.y = 0;
            }
            if (headRef.current) {
                headRef.current.rotation.z = Math.sin(t * 1.5) * 0.02;
                headRef.current.rotation.x = 0.05 + Math.sin(t * 1.1) * 0.01;
            }
        }

        // 2. INTERACTIVE GROOMING PHYSICS (Tüy Kesme, Tarama ve Uzatma)
        if (isDragging.current && ['scissors', 'comb', 'grow'].includes(activeTool) && headRef.current) {
            // Raycast mouse pointer to the head sphere
            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObject(headRef.current);

            if (intersects.length > 0) {
                const hitPoint = intersects[0].point;
                const localHit = headRef.current.worldToLocal(hitPoint.clone());

                // Calculate mouse drag velocity/direction
                const dragDirX = pointer.x - prevPointer.current.x;
                const dragDirY = pointer.y - prevPointer.current.y;
                
                // Scan all fur strands
                furStrands.forEach((strand) => {
                    const mesh = strand.ref.current;
                    if (!mesh) return;

                    // Calculate distance from localized hit point
                    const sPos = new THREE.Vector3(...strand.position);
                    const dist = sPos.distanceTo(localHit);

                    if (dist < 0.45) { // Radius of tool effect
                        if (activeTool === 'scissors') {
                            // Cut fur strand (kısalt)
                            strand.currentLength = 0.03; 
                            mesh.scale.set(1, 0.15, 1);
                        } 
                        else if (activeTool === 'comb') {
                            // Align fur angle to drag direction (tara)
                            const dragAngle = Math.atan2(dragDirY, dragDirX);
                            strand.rotation = [0.4, dragAngle, 0];
                            mesh.rotation.set(0.4, dragAngle, 0, 'YXZ');
                        }
                        else if (activeTool === 'grow') {
                            // Regrow fur (uzat/besle)
                            strand.currentLength = strand.initialLength;
                            mesh.scale.set(1, 1, 1);
                            strand.rotation = [0, 0, 0];
                            mesh.rotation.set(0, 0, 0);
                        }
                    }
                });
            }
        }

        prevPointer.current = { x: pointer.x, y: pointer.y };
    });

    return (
        <group ref={mascotGroupRef} position={[0, -0.4, 0]}>
            {/* Skeletal Body Root */}
            <mesh ref={bodyRef}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial color="#8b5cf6" roughness={0.7} bumpScale={0.05} />
                
                {/* Belly peach patch */}
                <mesh position={[0, -0.1, 0.85]} rotation={[-0.15, 0, 0]} scale={[1, 1.25, 0.2]}>
                    <sphereGeometry args={[0.5, 32, 32]} />
                    <meshStandardMaterial color="#fed7aa" roughness={0.8} />
                </mesh>

                {/* 3D APPAREL LAYER: Sweatshirt, Singlet, Pajamas */}
                {selectedApparel.body === 'sweatshirt' && (
                    <group>
                        {/* Orange Torso Sweatshirt */}
                        <mesh position={[0, 0, 0]} scale={[1.05, 1.02, 1.05]}>
                            <cylinderGeometry args={[0.9, 1, 1.1, 24, 1, true]} />
                            <meshStandardMaterial color="#f97316" roughness={0.5} side={THREE.DoubleSide} />
                        </mesh>
                        {/* Belly pocket detail */}
                        <mesh position={[0, -0.2, 1.0]} scale={[0.5, 0.3, 0.1]}>
                            <boxGeometry />
                            <meshStandardMaterial color="#ea580c" roughness={0.6} />
                        </mesh>
                    </group>
                )}

                {selectedApparel.body === 'singlet' && (
                    <group>
                        {/* Blue Atlet/Singlet */}
                        <mesh position={[0, -0.1, 0]} scale={[1.04, 0.9, 1.04]}>
                            <cylinderGeometry args={[0.9, 1, 1, 24, 1, true]} />
                            <meshStandardMaterial color="#0891b2" roughness={0.6} side={THREE.DoubleSide} />
                        </mesh>
                        {/* Straps */}
                        <mesh position={[-0.45, 0.5, 0]} scale={[0.12, 0.2, 1.05]}>
                            <boxGeometry />
                            <meshStandardMaterial color="#0891b2" />
                        </mesh>
                        <mesh position={[0.45, 0.5, 0]} scale={[0.12, 0.2, 1.05]}>
                            <boxGeometry />
                            <meshStandardMaterial color="#0891b2" />
                        </mesh>
                        {/* Star emblem */}
                        <mesh position={[0, 0.15, 1.02]} rotation={[0.1, 0, 0]} scale={[0.15, 0.15, 0.05]}>
                            <boxGeometry />
                            <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.2} />
                        </mesh>
                    </group>
                )}

                {selectedApparel.body === 'pajamas' && (
                    <group>
                        {/* Green Pajamas */}
                        <mesh position={[0, 0, 0]} scale={[1.04, 1.01, 1.04]}>
                            <cylinderGeometry args={[0.92, 1, 1.2, 24, 1, true]} />
                            <meshStandardMaterial color="#10b981" roughness={0.7} side={THREE.DoubleSide} />
                        </mesh>
                        {/* White Stripe Lines */}
                        <mesh position={[0, 0.2, 0]} scale={[1.05, 0.05, 1.05]}>
                            <cylinderGeometry args={[0.92, 0.92, 1, 24, 1, true]} />
                            <meshStandardMaterial color="#a7f3d0" side={THREE.DoubleSide} />
                        </mesh>
                        <mesh position={[0, -0.2, 0]} scale={[1.05, 0.05, 1.05]}>
                            <cylinderGeometry args={[0.98, 0.98, 1, 24, 1, true]} />
                            <meshStandardMaterial color="#a7f3d0" side={THREE.DoubleSide} />
                        </mesh>
                    </group>
                )}

                {/* --- HEAD JOINT --- */}
                <group ref={headRef} position={[0, 0.95, 0.1]}>
                    <mesh>
                        <sphereGeometry args={[0.95, 32, 32]} />
                        <meshStandardMaterial color="#8b5cf6" roughness={0.7} />
                    </mesh>

                    {/* Cute Ears */}
                    <group position={[-0.8, 0.7, -0.2]} rotation={[0, 0, 0.4]}>
                        <mesh>
                            <sphereGeometry args={[0.3, 16, 16]} />
                            <meshStandardMaterial color="#8b5cf6" />
                        </mesh>
                        {/* Inner pink ear */}
                        <mesh position={[0, 0, 0.08]} scale={[0.7, 0.7, 0.7]}>
                            <sphereGeometry args={[0.22, 16, 16]} />
                            <meshStandardMaterial color="#fda4af" />
                        </mesh>
                    </group>

                    <group position={[0.8, 0.7, -0.2]} rotation={[0, 0, -0.4]}>
                        <mesh>
                            <sphereGeometry args={[0.3, 16, 16]} />
                            <meshStandardMaterial color="#8b5cf6" />
                        </mesh>
                        <mesh position={[0, 0, 0.08]} scale={[0.7, 0.7, 0.7]}>
                            <sphereGeometry args={[0.22, 16, 16]} />
                            <meshStandardMaterial color="#fda4af" />
                        </mesh>
                    </group>

                    {/* Snout/Nose */}
                    <mesh position={[0, -0.15, 0.8]} scale={[0.35, 0.25, 0.25]}>
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshStandardMaterial color="#fed7aa" roughness={0.8} />
                    </mesh>
                    {/* Dark Nose Tip */}
                    <mesh position={[0, -0.05, 0.98]} scale={[0.1, 0.08, 0.08]}>
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshStandardMaterial color="#1f2937" roughness={0.4} />
                    </mesh>

                    {/* Big Eyes */}
                    <group position={[-0.32, 0.2, 0.75]}>
                        {/* White Sclera */}
                        <mesh scale={[0.22, 0.25, 0.15]}>
                            <sphereGeometry args={[1, 16, 16]} />
                            <meshStandardMaterial color="#ffffff" roughness={0.3} />
                        </mesh>
                        {/* Purple Iris & Pupil */}
                        <mesh position={[0.02, 0, 0.1]} scale={[0.1, 0.12, 0.08]}>
                            <sphereGeometry args={[1, 16, 16]} />
                            <meshStandardMaterial color="#a855f7" roughness={0.2} />
                        </mesh>
                        <mesh position={[0.02, 0, 0.15]} scale={[0.05, 0.06, 0.05]}>
                            <sphereGeometry args={[1, 16, 16]} />
                            <meshStandardMaterial color="#000000" />
                        </mesh>
                    </group>

                    <group position={[0.32, 0.2, 0.75]}>
                        <mesh scale={[0.22, 0.25, 0.15]}>
                            <sphereGeometry args={[1, 16, 16]} />
                            <meshStandardMaterial color="#ffffff" roughness={0.3} />
                        </mesh>
                        <mesh position={[-0.02, 0, 0.1]} scale={[0.1, 0.12, 0.08]}>
                            <sphereGeometry args={[1, 16, 16]} />
                            <meshStandardMaterial color="#a855f7" roughness={0.2} />
                        </mesh>
                        <mesh position={[-0.02, 0, 0.15]} scale={[0.05, 0.06, 0.05]}>
                            <sphereGeometry args={[1, 16, 16]} />
                            <meshStandardMaterial color="#000000" />
                        </mesh>
                    </group>

                    {/* Blinking Eyelids overlays */}
                    {isBlinking && (
                        <group>
                            <mesh position={[-0.32, 0.22, 0.86]} scale={[0.24, 0.08, 0.06]}>
                                <boxGeometry />
                                <meshStandardMaterial color="#581c87" />
                            </mesh>
                            <mesh position={[0.32, 0.22, 0.86]} scale={[0.24, 0.08, 0.06]}>
                                <boxGeometry />
                                <meshStandardMaterial color="#581c87" />
                            </mesh>
                        </group>
                    )}

                    {/* 3D APPAREL LAYER: Eyes (Glasses, Sunglasses, Eyepatch) */}
                    {selectedApparel.eyes === 'glasses' && (
                        <group position={[0, 0.18, 0.86]}>
                            {/* Left frame */}
                            <mesh position={[-0.32, 0, 0]}>
                                <torusGeometry args={[0.23, 0.03, 8, 24]} />
                                <meshStandardMaterial color="#1f2937" metalness={0.2} roughness={0.5} />
                            </mesh>
                            {/* Right frame */}
                            <mesh position={[0.32, 0, 0]}>
                                <torusGeometry args={[0.23, 0.03, 8, 24]} />
                                <meshStandardMaterial color="#1f2937" metalness={0.2} roughness={0.5} />
                            </mesh>
                            {/* Bridge */}
                            <mesh position={[0, 0, 0]} scale={[0.3, 0.03, 0.03]}>
                                <boxGeometry />
                                <meshStandardMaterial color="#1f2937" />
                            </mesh>
                        </group>
                    )}

                    {selectedApparel.eyes === 'sunglasses' && (
                        <group position={[0, 0.18, 0.86]}>
                            {/* Left Lens */}
                            <mesh position={[-0.32, 0, 0]}>
                                <cylinderGeometry args={[0.24, 0.24, 0.02, 16]} rotation={[Math.PI/2, 0, 0]} />
                                <meshStandardMaterial color="#0f172a" roughness={0.1} transparent opacity={0.92} />
                            </mesh>
                            {/* Right Lens */}
                            <mesh position={[0.32, 0, 0]}>
                                <cylinderGeometry args={[0.24, 0.24, 0.02, 16]} rotation={[Math.PI/2, 0, 0]} />
                                <meshStandardMaterial color="#0f172a" roughness={0.1} transparent opacity={0.92} />
                            </mesh>
                            {/* Bridge */}
                            <mesh position={[0, 0.1, 0.02]} scale={[0.6, 0.04, 0.04]}>
                                <boxGeometry />
                                <meshStandardMaterial color="#1e293b" />
                            </mesh>
                        </group>
                    )}

                    {selectedApparel.eyes === 'eyepatch' && (
                        <group position={[0.22, 0.2, 0.86]} rotation={[0, 0, -0.1]}>
                            {/* Black patch */}
                            <mesh scale={[0.26, 0.22, 0.04]}>
                                <sphereGeometry args={[1, 16, 16]} />
                                <meshStandardMaterial color="#0f172a" roughness={0.7} />
                            </mesh>
                            {/* Band */}
                            <mesh position={[-0.4, 0.1, -0.4]} rotation={[0, -0.4, 0.2]} scale={[1.2, 0.04, 0.02]}>
                                <boxGeometry />
                                <meshStandardMaterial color="#0f172a" />
                            </mesh>
                        </group>
                    )}

                    {/* 3D APPAREL LAYER: Headwear (Crown, Pirate Hat, Top Hat, Beanie) */}
                    {selectedApparel.head === 'crown' && (
                        <mesh position={[0, 0.95, 0.05]} rotation={[-0.1, 0, 0]}>
                            <cylinderGeometry args={[0.55, 0.45, 0.3, 16, 1, false]} />
                            <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} />
                        </mesh>
                    )}

                    {selectedApparel.head === 'pirate_hat' && (
                        <mesh position={[0, 0.98, 0]} rotation={[0, Math.PI/2, 0.08]} scale={[0.8, 0.4, 1.3]}>
                            <sphereGeometry args={[0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI/2]} />
                            <meshStandardMaterial color="#0f172a" roughness={0.8} side={THREE.DoubleSide} />
                        </mesh>
                    )}

                    {selectedApparel.head === 'top_hat' && (
                        <group position={[0, 0.95, 0]} rotation={[-0.05, 0, 0]}>
                            {/* Hat main cylinder */}
                            <mesh>
                                <cylinderGeometry args={[0.42, 0.45, 0.7, 16]} />
                                <meshStandardMaterial color="#1e293b" roughness={0.5} />
                            </mesh>
                            {/* Brim */}
                            <mesh position={[0, -0.32, 0]} scale={[1, 0.03, 1]}>
                                <cylinderGeometry args={[0.68, 0.68, 1, 16]} />
                                <meshStandardMaterial color="#1e293b" roughness={0.5} />
                            </mesh>
                            {/* Red ribbon band */}
                            <mesh position={[0, -0.25, 0]} scale={[1.02, 0.1, 1.02]}>
                                <cylinderGeometry args={[0.44, 0.44, 1, 16]} />
                                <meshStandardMaterial color="#ef4444" />
                            </mesh>
                        </group>
                    )}

                    {selectedApparel.head === 'beanie' && (
                        <mesh position={[0, 0.7, 0]} rotation={[-0.1, 0, 0]} scale={[1.05, 0.8, 1.05]}>
                            <sphereGeometry args={[0.95, 24, 24, 0, Math.PI*2, 0, Math.PI/2]} />
                            <meshStandardMaterial color="#2563eb" roughness={0.9} />
                        </mesh>
                    )}

                    {/* --- FUR STRANDS --- */}
                    {furStrands.map((strand) => (
                        <mesh
                            key={strand.id}
                            ref={strand.ref as any}
                            position={strand.position}
                            rotation={strand.rotation}
                        >
                            <cylinderGeometry args={[0.015, 0.005, strand.initialLength, 4]} />
                            <meshStandardMaterial color="#7c3aed" roughness={0.9} />
                        </mesh>
                    ))}
                </group>

                {/* --- LEFT ARM JOINT --- */}
                <group ref={leftArmJointRef} position={[-1.0, 0.2, 0]}>
                    <mesh position={[-0.4, -0.2, 0]} scale={[0.3, 0.6, 0.3]}>
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshStandardMaterial color="#8b5cf6" roughness={0.7} />
                    </mesh>

                    {/* Gloves or Boxing glove */}
                    {selectedApparel.hands === 'gloves' && (
                        <mesh position={[-0.5, -0.5, 0]} scale={[0.32, 0.32, 0.32]}>
                            <sphereGeometry args={[1, 16, 16]} />
                            <meshStandardMaterial color="#10b981" roughness={0.8} />
                        </mesh>
                    )}
                    {selectedApparel.hands === 'boxing' && (
                        <mesh position={[-0.55, -0.55, 0]} scale={[0.42, 0.42, 0.42]}>
                            <sphereGeometry args={[1, 16, 16]} />
                            <meshStandardMaterial color="#ef4444" roughness={0.4} />
                        </mesh>
                    )}
                </group>

                {/* --- RIGHT ARM JOINT --- */}
                <group ref={rightArmJointRef} position={[1.0, 0.2, 0]}>
                    <mesh position={[0.4, -0.2, 0]} scale={[0.3, 0.6, 0.3]}>
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshStandardMaterial color="#8b5cf6" roughness={0.7} />
                    </mesh>

                    {/* Gloves or Boxing glove */}
                    {selectedApparel.hands === 'gloves' && (
                        <mesh position={[0.5, -0.5, 0]} scale={[0.32, 0.32, 0.32]}>
                            <sphereGeometry args={[1, 16, 16]} />
                            <meshStandardMaterial color="#10b981" roughness={0.8} />
                        </mesh>
                    )}
                    {selectedApparel.hands === 'boxing' && (
                        <mesh position={[0.55, -0.55, 0]} scale={[0.42, 0.42, 0.42]}>
                            <sphereGeometry args={[1, 16, 16]} />
                            <meshStandardMaterial color="#ef4444" roughness={0.4} />
                        </mesh>
                    )}
                </group>

                {/* --- LEFT LEG JOINT --- */}
                <group ref={leftLegJointRef} position={[-0.45, -0.9, 0]}>
                    <mesh position={[0, -0.3, 0]} scale={[0.3, 0.4, 0.3]}>
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshStandardMaterial color="#8b5cf6" roughness={0.7} />
                    </mesh>

                    {/* Sneakers or Boots */}
                    {selectedApparel.feet === 'sneakers' && (
                        <mesh position={[0, -0.5, 0.15]} scale={[0.35, 0.22, 0.45]}>
                            <boxGeometry />
                            <meshStandardMaterial color="#facc15" roughness={0.5} />
                        </mesh>
                    )}
                    {selectedApparel.feet === 'boots' && (
                        <mesh position={[0, -0.45, 0.1]} scale={[0.36, 0.32, 0.44]}>
                            <boxGeometry />
                            <meshStandardMaterial color="#b45309" roughness={0.7} />
                        </mesh>
                    )}
                </group>

                {/* --- RIGHT LEG JOINT --- */}
                <group ref={rightLegJointRef} position={[0.45, -0.9, 0]}>
                    <mesh position={[0, -0.3, 0]} scale={[0.3, 0.4, 0.3]}>
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshStandardMaterial color="#8b5cf6" roughness={0.7} />
                    </mesh>

                    {/* Sneakers or Boots */}
                    {selectedApparel.feet === 'sneakers' && (
                        <mesh position={[0, -0.5, 0.15]} scale={[0.35, 0.22, 0.45]}>
                            <boxGeometry />
                            <meshStandardMaterial color="#facc15" roughness={0.5} />
                        </mesh>
                    )}
                    {selectedApparel.feet === 'boots' && (
                        <mesh position={[0, -0.45, 0.1]} scale={[0.36, 0.32, 0.44]}>
                            <boxGeometry />
                            <meshStandardMaterial color="#b45309" roughness={0.7} />
                        </mesh>
                    )}
                </group>

            </mesh>
        </group>
    );
}

export default function Mascot3DCanvas({ selectedApparel, activeTool, isBlinking = false }: Mascot3DCanvasProps) {
    // Disable orbit controls when user is active with grooming tools to prevent canvas camera rotation interfering with grooming drag
    const enableControls = activeTool === 'styling' || activeTool === 'walk';

    return (
        <div className="w-full h-full relative" style={{ background: 'radial-gradient(circle, #f5f3ff 0%, #ddd6fe 100%)' }}>
            <Canvas
                shadows
                camera={{ position: [0, 0.5, 4], fov: 45 }}
                className="w-full h-full"
            >
                {/* Clean Lighting setup */}
                <ambientLight intensity={1.5} />
                <directionalLight 
                    position={[5, 10, 5]} 
                    intensity={2.2} 
                    castShadow 
                    shadow-mapSize={[1024, 1024]}
                />
                <pointLight position={[-4, 3, -2]} intensity={0.8} color="#d8b4fe" />
                <pointLight position={[0, -2, 3]} intensity={0.6} />

                {/* Rigged Scene */}
                <MascotScene 
                    selectedApparel={selectedApparel} 
                    activeTool={activeTool} 
                    isBlinking={isBlinking} 
                />

                {/* Camera controls */}
                <OrbitControls 
                    enableZoom={true} 
                    enablePan={false}
                    minDistance={2.5}
                    maxDistance={6.0}
                    minPolarAngle={0.4}
                    maxPolarAngle={Math.PI / 1.8}
                    enabled={enableControls}
                />
            </Canvas>
        </div>
    );
}
