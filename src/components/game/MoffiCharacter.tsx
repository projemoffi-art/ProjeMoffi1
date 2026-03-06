"use client";

/**
 * MoffiCharacter — SSR-safe Mixamo FBX character
 * • Moffi renkleri Three.js içinde uygulanır (Blender gerekmez)
 * • Kedi kulakları Three.js cone ile eklenir
 * • AnimationMixer ile smooth blend
 */

import { useEffect, useRef } from 'react';
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

// ---- MOFFI PALETTE ----
const M = {
    FUR: new THREE.Color(0x7B4F9E),  // Mor kürk
    HOODIE: new THREE.Color(0xF97316),  // Turuncu hoodie
    SHORTS: new THREE.Color(0x1E3A5F),  // Koyu mavi şort
    SHOE: new THREE.Color(0x111111),  // Siyah ayakkabı
    EAR: new THREE.Color(0x5B2D8E),  // Koyu mor kulak
    INNER: new THREE.Color(0xFF8FAB),  // İç kulak pembe
};

// Mixamo material adına göre renk seç
function moffiColor(matName: string): THREE.Color {
    const n = matName.toLowerCase();
    if (/shoe|boot|foot|sole/.test(n)) return M.SHOE;
    if (/pant|jean|short|lower|leg/.test(n)) return M.SHORTS;
    if (/shirt|jacket|hoodie|top|upper|torso/.test(n)) return M.HOODIE;
    return M.FUR; // default: kürk
}

// Tüm mesh'lere Moffi renkleri uygula
function applyMoffiColors(root: THREE.Group) {
    root.traverse(child => {
        if (!(child as THREE.Mesh).isMesh) return;
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

        mats.forEach((mat, i) => {
            const std = mat as THREE.MeshStandardMaterial;
            const color = moffiColor(mat.name || mesh.name);
            std.color = color;
            std.roughness = 0.75;
            std.metalness = 0.0;
            std.needsUpdate = true;
        });

        mesh.castShadow = true;
        mesh.receiveShadow = true;
    });
}

// Kedi kulaklarını baş kemiğine ekle
function addCatEars(root: THREE.Group) {
    let headBone: THREE.Bone | null = null;
    root.traverse(child => {
        if ((child as THREE.Bone).isBone && /head/i.test(child.name)) {
            headBone = child as THREE.Bone;
        }
    });

    const target = headBone ?? root;

    for (const [side, xOffset] of [['L', 0.09], ['R', -0.09]] as [string, number][]) {
        // Dış kulak
        const outerGeo = new THREE.ConeGeometry(0.035, 0.09, 8);
        const outerMat = new THREE.MeshStandardMaterial({ color: M.EAR, roughness: 0.8 });
        const outer = new THREE.Mesh(outerGeo, outerMat);
        outer.name = `Ear_${side}`;
        outer.position.set(xOffset, 0.13, -0.01);
        outer.castShadow = true;
        target.add(outer);

        // İç kulak (pembe leke)
        const innerGeo = new THREE.ConeGeometry(0.018, 0.055, 8);
        const innerMat = new THREE.MeshStandardMaterial({ color: M.INNER, roughness: 0.9 });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        inner.position.set(0, 0.005, 0.005);
        outer.add(inner);
    }
}

// Animasyon action'larını yönet
const ONE_SHOTS = new Set(['JUMP', 'SLIDE', 'HIT']);

export function MoffiCharacter({ state, laneTargetX, speed }: MoffiCharacterProps) {
    const groupRef = useRef<THREE.Group>(null!);
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
    const currentRef = useRef<string>('');
    const loadedRef = useRef(false);

    // ---- LOAD ----
    useEffect(() => {
        if (loadedRef.current || !groupRef.current) return;
        loadedRef.current = true;

        const CLIPS: Record<string, string> = {
            RUN: '/models/run.fbx',
            JUMP: '/models/jump.fbx',
            SLIDE: '/models/slide.fbx',
            IDLE: '/models/idle.fbx',
            SIDESTEP: '/models/sidestep.fbx',
            HIT: '/models/hit.fbx',
        };

        let mixer: THREE.AnimationMixer;

        (async () => {
            const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
            const loader = new FBXLoader();

            // Base model
            const base = await new Promise<THREE.Group>(
                (res, rej) => loader.load(CLIPS.RUN, res, undefined, rej)
            );
            base.scale.setScalar(0.012);
            base.rotation.y = Math.PI;

            applyMoffiColors(base);
            addCatEars(base);

            groupRef.current.add(base);

            mixer = new THREE.AnimationMixer(base);
            mixerRef.current = mixer;

            // Clip'leri yükle
            for (const [name, path] of Object.entries(CLIPS)) {
                try {
                    const fbx = await new Promise<THREE.Group>(
                        (res, rej) => loader.load(path, res, undefined, rej)
                    );
                    if (fbx.animations.length > 0) {
                        const clip = fbx.animations[0];
                        clip.name = name;
                        actionsRef.current[name] = mixer.clipAction(clip);
                    }
                } catch {
                    // Sessizce geç
                }
            }

            // IDLE ile başla
            const start = actionsRef.current['IDLE'] ?? actionsRef.current['RUN'];
            if (start) {
                start.setLoop(THREE.LoopRepeat, Infinity).play();
                currentRef.current = start === actionsRef.current['IDLE'] ? 'IDLE' : 'RUN';
            }
        })().catch(console.error);

        return () => { mixer?.stopAllAction(); };
    }, []);

    // ---- STATE MACHINE ----
    useEffect(() => {
        const actions = actionsRef.current;
        if (!mixerRef.current || Object.keys(actions).length === 0) return;

        let clip: string;
        if (state === 'JUMP') clip = 'JUMP';
        else if (state === 'SLIDE') clip = 'SLIDE';
        else if (state === 'HIT') clip = 'HIT';
        else if (state === 'SIDESTEP_LEFT' || state === 'SIDESTEP_RIGHT') clip = 'SIDESTEP';
        else if (state === 'RUN') clip = 'RUN';
        else clip = 'IDLE';

        if (currentRef.current === clip) return;

        const FADE = 0.15;
        const prev = actions[currentRef.current];
        const next = actions[clip];
        if (!next) return;

        if (ONE_SHOTS.has(clip)) {
            next.setLoop(THREE.LoopOnce, 1);
            next.clampWhenFinished = true;
        } else {
            next.setLoop(THREE.LoopRepeat, Infinity);
        }

        prev?.fadeOut(FADE);
        next.reset().fadeIn(FADE).play();
        currentRef.current = clip;
    }, [state]);

    // ---- FRAME ----
    useFrame((_, delta) => {
        if (!mixerRef.current || !groupRef.current) return;

        mixerRef.current.timeScale = THREE.MathUtils.mapLinear(speed, 12, 52, 1.0, 1.9);
        mixerRef.current.update(delta);

        // One-shot bitti mi? → RUN'a dön
        if (ONE_SHOTS.has(currentRef.current)) {
            const a = actionsRef.current[currentRef.current];
            if (a && !a.isRunning()) {
                const fallback = actionsRef.current['RUN'] ?? actionsRef.current['IDLE'];
                if (fallback) {
                    a.fadeOut(0.12);
                    fallback.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.12).play();
                    currentRef.current = 'RUN';
                }
            }
        }

        // Vücut lean (şerit geçişi)
        const dx = laneTargetX - groupRef.current.position.x;
        groupRef.current.rotation.z = THREE.MathUtils.lerp(
            groupRef.current.rotation.z,
            THREE.MathUtils.clamp(-dx * 0.18, -0.38, 0.38),
            10 * delta
        );
        // Baş dönüşü (lean yönünde küçük döndürme, Math.PI base modelde zaten var)
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            THREE.MathUtils.clamp(dx * 0.12, -0.28, 0.28),
            7 * delta
        );
    });

    return <group ref={groupRef} />;
}
