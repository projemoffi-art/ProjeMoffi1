"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCw, Move, ZoomIn, ZoomOut, Box, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Preview3DProps {
    productType: string;
    productImage: string;
    layers: any[];
    onClose: () => void;
    isEmbedded?: boolean;
}

export function Preview3D({ productType, productImage, layers, onClose, isEmbedded }: Preview3DProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [autoRotate, setAutoRotate] = useState(true);

    // Auto-rotation
    useEffect(() => {
        if (!autoRotate) return;
        const interval = setInterval(() => {
            setRotation(prev => ({ ...prev, y: prev.y + 0.5 }));
        }, 30);
        return () => clearInterval(interval);
    }, [autoRotate]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setAutoRotate(false);
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = (e.clientX - dragStart.x) * 0.5;
        const dy = (e.clientY - dragStart.y) * 0.3;
        setRotation(prev => ({ x: Math.max(-30, Math.min(30, prev.x - dy)), y: prev.y + dx }));
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const getProductStyle = () => {
        switch (productType) {
            case 'mug':
                return {
                    width: '280px', height: '320px',
                    borderRadius: '8px',
                    perspective: '800px',
                };
            case 'tote':
                return {
                    width: '300px', height: '380px',
                    borderRadius: '4px',
                    perspective: '1000px',
                };
            default: // tshirt, hoodie
                return {
                    width: '320px', height: '400px',
                    borderRadius: '12px',
                    perspective: '1200px',
                };
        }
    };

    const style = getProductStyle();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                "z-[100] flex flex-col items-center justify-center transition-all",
                isEmbedded ? "w-full h-full bg-transparent" : "fixed inset-0 bg-black/90 backdrop-blur-xl"
            )}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
        >
            {/* Controls */}
            <div className={cn("absolute flex gap-2 z-50", isEmbedded ? "top-4 right-4" : "top-6 right-6")}>
                <button onClick={() => setAutoRotate(!autoRotate)}
                    className={cn("px-4 py-2 rounded-full text-sm font-bold transition",
                        autoRotate ? "bg-purple-600 text-white" : "bg-white/10 text-white hover:bg-white/20"
                    )}>
                    <RotateCw className="w-4 h-4 inline mr-1" /> {autoRotate ? 'Durdur' : 'Döndür'}
                </button>
                <button onClick={onClose} className="px-4 py-2 bg-white text-black rounded-full text-sm font-bold hover:scale-105 transition">
                    Kapat
                </button>
            </div>

            {/* Title */}
            <div className="absolute top-6 left-6">
                <h2 className="text-white text-xl font-bold">3D Önizleme</h2>
                <p className="text-white/50 text-sm">Fareyle döndürmek için sürükleyin</p>
            </div>

            {/* 3D Scene */}
            <div
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                style={{ perspective: style.perspective }}
            >
                <div
                    className="relative transition-transform duration-100"
                    style={{
                        width: style.width,
                        height: style.height,
                        transformStyle: 'preserve-3d',
                        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                    }}
                >
                    {/* Front Face */}
                    <div className="absolute inset-0 overflow-hidden shadow-2xl"
                        style={{
                            borderRadius: style.borderRadius,
                            backfaceVisibility: 'hidden',
                            transform: 'translateZ(20px)',
                            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                        }}>
                        <img src={productImage} className="w-full h-full object-cover" style={{ opacity: 0.9 }} />
                        {/* Design overlay */}
                        <div className="absolute inset-0">
                            <AnimatePresence>
                                {layers.filter(l => l.visible).map(layer => (
                                    <motion.div 
                                        key={layer.id} 
                                        layout
                                        initial={false}
                                        animate={{
                                            left: `${layer.x}%`, 
                                            top: `${layer.y}%`,
                                            rotate: layer.rotation,
                                            scale: layer.scale,
                                            opacity: layer.opacity / 100
                                        }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className="absolute" 
                                        style={{ transform: 'translate(-50%, -50%)' }}
                                    >
                                        {layer.type === 'text' ? (
                                            <p style={{
                                                fontFamily: layer.font, color: layer.color,
                                                fontSize: `${layer.fontSize || 36}px`,
                                                fontWeight: layer.bold ? 'bold' : 'normal',
                                                fontStyle: layer.italic ? 'italic' : 'normal',
                                            }} className="whitespace-nowrap">{layer.content}</p>
                                        ) : (
                                            <img src={layer.src} className="w-24 h-24 object-contain" />
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        {/* Fabric texture overlay */}
                        <div className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.02) 1px, rgba(255,255,255,0.02) 2px)',
                                mixBlendMode: 'overlay',
                            }} />
                    </div>

                    {/* Back Face */}
                    <div className="absolute inset-0 overflow-hidden shadow-2xl"
                        style={{
                            borderRadius: style.borderRadius,
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg) translateZ(20px)',
                        }}>
                        <img src={productImage} className="w-full h-full object-cover" style={{ opacity: 0.7, filter: 'brightness(0.8)' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white/30 text-sm font-bold">Arka Yüz</span>
                        </div>
                    </div>

                    {/* Side Edge */}
                    <div className="absolute overflow-hidden" style={{
                        width: '40px', height: style.height,
                        right: '-20px', top: 0,
                        background: 'linear-gradient(90deg, #0a0a1a, #0d1128)',
                        transform: 'rotateY(90deg)',
                        transformOrigin: 'left center',
                        borderRadius: '0 4px 4px 0',
                    }} />
                </div>

                {/* Shadow */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-8 bg-purple-500/20 rounded-full blur-xl" />
            </div>

            {/* Floor reflection */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none" />
        </motion.div>
    );
}
