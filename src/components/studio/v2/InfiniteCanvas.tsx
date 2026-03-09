"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useStudio } from './StudioEngine';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { RotateCw, LayoutGrid, Check } from 'lucide-react';

export function InfiniteCanvas() {
    const { state, dispatch, actions } = useStudio();
    const canvasRef = useRef<HTMLDivElement>(null);

    // Interaction State
    const [interaction, setInteraction] = useState<{
        mode: 'MOVE' | 'ROTATE' | 'SCALE' | null;
        startMouse: { x: number, y: number };
        initialVal: any; // { x, y } for MOVE, rotation for ROTATE, { scale, startDist } for SCALE
    }>({ mode: null, startMouse: { x: 0, y: 0 }, initialVal: null });

    // Handle Pointer Move Global
    useEffect(() => {
        const handleMove = (e: PointerEvent) => {
            if (!interaction.mode || !state.activeLayerId || !canvasRef.current) return;

            const rect = canvasRef.current.getBoundingClientRect();
            const layer = state.layers.find(l => l.id === state.activeLayerId);
            if (!layer) return;

            if (interaction.mode === 'MOVE') {
                const deltaX = e.clientX - interaction.startMouse.x;
                const deltaY = e.clientY - interaction.startMouse.y;
                const deltaXPercent = (deltaX / rect.width) * 100;
                const deltaYPercent = (deltaY / rect.height) * 100;

                actions.updateActiveLayer(state.activeLayerId, {
                    x: interaction.initialVal.x + deltaXPercent,
                    y: interaction.initialVal.y + deltaYPercent
                });
            }
            else if (interaction.mode === 'ROTATE') {
                const centerX = rect.left + (layer.x / 100) * rect.width;
                const centerY = rect.top + (layer.y / 100) * rect.height;
                const dx = e.clientX - centerX;
                const dy = e.clientY - centerY;
                let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

                actions.updateActiveLayer(state.activeLayerId, { rotation: angle });
            }
            else if (interaction.mode === 'SCALE') {
                const centerX = rect.left + (layer.x / 100) * rect.width;
                const centerY = rect.top + (layer.y / 100) * rect.height;
                const currentDist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
                const newScale = interaction.initialVal.scale * (currentDist / interaction.initialVal.startDist);

                actions.updateActiveLayer(state.activeLayerId, { scale: Math.max(0.1, newScale) });
            }
        };

        const handleUp = () => {
            setInteraction({ mode: null, startMouse: { x: 0, y: 0 }, initialVal: null });
        };

        if (interaction.mode) {
            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp);
        }

        return () => window.removeEventListener('pointermove', handleMove);
    }, [interaction, state.activeLayerId, actions, state.layers]);


    return (
        <div className="w-full h-full bg-[#f2f2f5] dark:bg-[#000] relative overflow-hidden flex items-center justify-center touch-none select-none">
            {/* Grid Pattern */}
            <div className={cn("absolute inset-0 pointer-events-none transition-opacity duration-500", state.gridVisible ? "opacity-[0.15] dark:opacity-[0.2]" : "opacity-0")}
                style={{
                    backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            {/* ARTBOARD */}
            <div
                onPointerDown={() => dispatch({ type: 'SELECT_LAYER', payload: null })}
                className="relative w-[80%] max-w-[500px] aspect-[3/4] bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/5 transition-all"
            >
                {/* Fallback Text */}
                {state.layers.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none">
                        <span className="text-9xl font-bold opacity-10">TSHIRT</span>
                    </div>
                )}

                {/* LAYER RENDERER CONTAINER */}
                <div ref={canvasRef} className="absolute inset-0 z-10 overflow-hidden isolate">
                    {state.layers.map(layer => {
                        const isActive = state.activeLayerId === layer.id;

                        // Filters & Transform
                        const filters = [
                            layer.shadowColor ? `drop-shadow(${layer.shadowOffsetX || 0}px ${layer.shadowOffsetY || 10}px ${layer.shadowBlur || 20}px ${layer.shadowColor})` : '',
                            `brightness(${layer.filterBrightness || 100}%)`,
                            `contrast(${layer.filterContrast || 100}%)`,
                            `grayscale(${layer.filterGrayscale || 0}%)`,
                            `blur(${layer.filterBlur || 0}px)`,
                            `hue-rotate(${layer.filterHue || 0}deg)`,
                            `saturate(${layer.filterSaturation ?? 100}%)`
                        ].filter(Boolean).join(' ');

                        // Build consistent content transform for image and mask
                        const contentTransform = {
                            transform: `translate(${layer.imageX || 0}%, ${layer.imageY || 0}%) scale(${layer.imageScale || 1}) scaleX(${layer.flipX ? -1 : 1}) scaleY(${layer.flipY ? -1 : 1})`,
                            transformOrigin: 'center center',
                        };

                        return (
                            <motion.div
                                key={layer.id}
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    dispatch({ type: 'SELECT_LAYER', payload: layer.id });
                                    setInteraction({
                                        mode: 'MOVE',
                                        startMouse: { x: e.clientX, y: e.clientY },
                                        initialVal: { x: layer.x, y: layer.y }
                                    });
                                }}
                                className={cn(
                                    "absolute cursor-move hover:ring-1 hover:ring-blue-400 border border-transparent select-none touch-none group",
                                    isActive ? "ring-2 ring-blue-500 z-50" : "z-10"
                                )}
                                animate={{ rotate: layer.rotation, scale: layer.scale }}
                                style={{
                                    top: `${layer.y}%`,
                                    left: `${layer.x}%`,
                                    transform: 'translate(-50%, -50%)',
                                    width: layer.type === 'text' ? 'auto' : (layer.isProduct ? '100%' : '120px'),
                                    opacity: layer.opacity / 100,
                                }}
                            >
                                {/* CONTENT */}
                                {layer.type === 'text' && (
                                    <span
                                        className="whitespace-nowrap font-bold text-4xl leading-none px-2 block"
                                        style={{
                                            color: layer.color,
                                            fontFamily: layer.fontFamily,
                                            filter: filters,
                                            mixBlendMode: layer.blendMode as any,
                                            transform: `scaleX(${layer.flipX ? -1 : 1}) scaleY(${layer.flipY ? -1 : 1})`,
                                        }}
                                    >
                                        {layer.content}
                                    </span>
                                )}
                                {(layer.type === 'sticker' || layer.type === 'image') && (
                                    <div className="w-full h-full relative" style={{ clipPath: layer.mask || 'none' }}>
                                        {/* TINT OVERLAY (MASKED) - Professional Approach */}
                                        {layer.backgroundColor && (
                                            <div
                                                className="absolute inset-0 z-20 pointer-events-none"
                                                style={{
                                                    backgroundColor: layer.backgroundColor,
                                                    mixBlendMode: 'multiply',
                                                    // CSS MASKING: Cut the color to the EXACT shape of the image
                                                    maskImage: `url(${layer.content})`,
                                                    WebkitMaskImage: `url(${layer.content})`,
                                                    maskSize: '100% 100%', // Since img is object-contain 100%, we match that
                                                    WebkitMaskSize: '100% 100%',
                                                    maskPosition: 'center',
                                                    WebkitMaskPosition: 'center',
                                                    maskRepeat: 'no-repeat',
                                                    WebkitMaskRepeat: 'no-repeat',
                                                    // Apply same transforms so mask aligns with moving image
                                                    ...contentTransform
                                                }}
                                            />
                                        )}
                                        <img
                                            src={layer.content}
                                            className="w-full h-full object-contain pointer-events-none block"
                                            style={{
                                                filter: filters,
                                                ...contentTransform,
                                                WebkitBoxReflect: layer.reflection ? 'below 0px linear-gradient(transparent, transparent 60%, rgba(255,255,255,0.4))' : undefined,
                                            }}
                                        />
                                    </div>
                                )}
                                {/* CONTROLS (Render on top of content) */}
                                {isActive && (
                                    <>
                                        {/* Scale Handles (Simplified) */}
                                        {['nw', 'ne', 'sw', 'se'].map((pos) => (
                                            <div
                                                key={pos}
                                                className="absolute w-3 h-3 bg-white border border-blue-500 rounded-full shadow-sm z-50 -ml-1.5 -mt-1.5"
                                                style={{ left: pos.includes('e') ? '100%' : '0%', top: pos.includes('s') ? '100%' : '0%' }}
                                                onPointerDown={(e) => {
                                                    e.stopPropagation();
                                                    const rect = canvasRef.current?.getBoundingClientRect();
                                                    if (!rect) return;
                                                    const layer = state.layers.find(l => l.id === state.activeLayerId);
                                                    if (!layer) return;
                                                    const centerX = rect.left + (layer.x / 100) * rect.width;
                                                    const centerY = rect.top + (layer.y / 100) * rect.height;
                                                    const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
                                                    setInteraction({ mode: 'SCALE', startMouse: { x: e.clientX, y: e.clientY }, initialVal: { scale: layer.scale, startDist: dist } });
                                                }}
                                            />
                                        ))}
                                        {/* Rotate Handle */}
                                        <div
                                            className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow border cursor-grab active:cursor-grabbing z-50"
                                            onPointerDown={(e) => {
                                                e.stopPropagation();
                                                setInteraction({ mode: 'ROTATE', startMouse: { x: e.clientX, y: e.clientY }, initialVal: layer.rotation });
                                            }}
                                        >
                                            <RotateCw className="w-4 h-4 text-blue-500" />
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="absolute inset-0 -z-10" onClick={() => dispatch({ type: 'SELECT_LAYER', payload: null })} />

            {/* VIEW CONTROLS (Bottom Left) */}
            <div className="absolute bottom-6 left-6 z-40 flex gap-2">
                <button
                    onClick={() => dispatch({ type: 'TOGGLE_GRID' })}
                    className={cn(
                        "p-3 rounded-xl shadow-lg border transition-all hover:scale-105 active:scale-95",
                        state.gridVisible ? "bg-blue-500 border-blue-500 text-white" : "bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-white/10 text-gray-500"
                    )}
                    title="Gridi Aç/Kapat"
                >
                    <LayoutGrid className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
