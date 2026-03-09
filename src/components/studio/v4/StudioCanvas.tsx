"use client";

import React, { useRef, useState, useEffect } from "react";
import { useStudioContext } from "./StudioContext";
import { useStudioEngine } from "./useStudioEngine";
import { Layer, TextLayer, ImageLayer, StickerLayer } from "./types";
import {
    ChevronLeft, ShoppingBag, Undo, Redo,
    Camera, Type, LayoutGrid, Palette,
    Home, User, Sliders, CheckCircle2,
    Shirt, icons, Move, X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { STICKERS } from "@/constants/studio-assets";

export function StudioCanvas() {
    const { product, setProduct } = useStudioContext();
    const router = useRouter();
    const engine = useStudioEngine();
    const canvasRef = useRef<HTMLDivElement>(null);

    // -- DRAG LOGIC (Same as before) --
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        engine.setSelectedId(id);
        const layer = engine.layers.find(l => l.id === id);
        if (!layer) return;

        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialPos({ x: layer.x, y: layer.y });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !engine.selectedId) return;
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;

            engine.updateLayer(engine.selectedId, {
                x: initialPos.x + dx,
                y: initialPos.y + dy
            });
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                engine.commitChanges();
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart, initialPos, engine]);

    const productTypes = [
        { id: 'hoodie', name: 'Sweatshirt', icon: '👕' },
        { id: 'bandana', name: 'Bandana', icon: '🧣' },
        { id: 'bowl', name: 'Mama Kabı', icon: '🥣' },
        { id: 'collar', name: 'Tasma', icon: '🐕' },
    ];

    return (
        <div className="h-[calc(100vh-64px)] w-full bg-[#f8f8fa] text-gray-900 font-sans flex flex-col relative overflow-hidden">
            {/* Subtle Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-50 via-white to-blue-50 opacity-60 pointer-events-none" />

            {/* HEADER - Glass */}
            <header className="h-16 px-6 flex items-center justify-between z-50 absolute top-0 w-full">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-white/70 backdrop-blur-md rounded-full shadow-sm flex items-center justify-center border border-white/50 text-gray-700 hover:scale-105 transition-all"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="bg-white/70 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm border border-white/50">
                    <h1 className="text-sm font-bold text-gray-800 tracking-wide">{product?.title || "Tasarım Stüdyosu"}</h1>
                </div>
                <button className="w-10 h-10 bg-white/70 backdrop-blur-md rounded-full shadow-sm flex items-center justify-center border border-white/50 text-gray-700 hover:scale-105 transition-all relative">
                    <ShoppingBag className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
            </header>

            {/* MAIN CANVAS AREA - Maximized Space */}
            <div className="flex-1 relative flex items-center justify-center z-10">

                {/* CANVAS - Transparent & Large */}
                {/* CANVAS - Full Screen / Immersive */}
                <div
                    ref={canvasRef}
                    className="relative w-full h-full flex items-center justify-center overflow-hidden"
                    onClick={() => engine.setSelectedId(null)}
                >
                    {/* Product Image Layer - Full Background */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                        <Shirt className="w-[80%] h-[80%] text-gray-200" strokeWidth={0.5} />
                    </div>

                    {/* DESIGN LAYERS - Full Screen */}
                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                        {engine.layers.map(layer => (
                            <div
                                key={layer.id}
                                onMouseDown={(e) => handleMouseDown(e, layer.id)}
                                style={{
                                    transform: `translate(${layer.x}px, ${layer.y}px) translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
                                    position: 'absolute',
                                    left: 0, top: 0,
                                    cursor: isDragging ? 'grabbing' : 'grab',
                                    opacity: layer.opacity,
                                    transformOrigin: 'center center'
                                }}
                                className={`
                                    transition-shadow
                                    ${engine.selectedId === layer.id ? 'ring-2 ring-blue-500 ring-offset-4 rounded-lg' : ''}
                                `}
                            >
                                {layer.type === 'text' && (
                                    <div className="whitespace-nowrap font-bold text-3xl drop-shadow-sm px-2 cursor-pointer" style={{ color: (layer as TextLayer).color || '#000' }}>
                                        {(layer as TextLayer).text}
                                    </div>
                                )}
                                {layer.type === 'sticker' && (
                                    <div className="text-7xl drop-shadow-md cursor-pointer">{(layer as StickerLayer).stickerId === 'paw' ? '🐾' : '⭐'}</div>
                                )}
                                {layer.type === 'image' && (
                                    <img src={(layer as ImageLayer).src} alt="" className="w-full h-auto rounded-lg shadow-sm cursor-pointer" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* FLOATING TOOLS - Glass Effect */}
                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                    <FloatTool icon={Camera} label="Foto" onClick={() => engine.setTab('images')} />
                    <FloatTool icon={LayoutGrid} label="Sticker" onClick={() => engine.setTab('stickers')} />
                    <FloatTool icon={Type} label="Metin" onClick={() => engine.addText("Yazı")} />

                    <div className="h-px w-8 bg-gray-300/30 mx-auto my-1" />

                    <button onClick={engine.undo} className="w-12 h-12 bg-white/60 backdrop-blur-xl rounded-2xl flex items-center justify-center hover:bg-white/80 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.06)]"><Undo className="w-5 h-5 text-gray-600" /></button>
                </div>

                {/* COLOR PALETTE - Floating Right */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <button className="group relative w-12 h-12 rounded-full overflow-hidden shadow-lg hover:scale-105 transition-transform ring-4 ring-white/50 backdrop-blur">
                        <div className="absolute inset-0 bg-[conic-gradient(at_center,_red,_yellow,_lime,_cyan,_blue,_magenta,_red)] opacity-90 group-hover:opacity-100" />
                        <Palette className="relative z-10 w-5 h-5 text-white mx-auto mt-3.5 drop-shadow-md" />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500 bg-white/80 px-2 py-0.5 rounded-full backdrop-blur">Renk</div>
                </div>

            </div>

            {/* BOTTOM SHEET - Transparent Glass */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/70 backdrop-blur-2xl rounded-[30px] border border-white/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] z-40 p-1 flex flex-col animate-in slide-in-from-bottom-10 duration-500">

                {/* Drag Handle */}
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 opacity-50" />

                <div className="px-5 pt-2 pb-5">
                    {/* Size & Rotate Sliders (Visible if selected) */}
                    <div className={`transition-all duration-300 overflow-hidden ${engine.selectedId ? 'h-24 opacity-100 mb-4' : 'h-0 opacity-0 mb-0'}`}>
                        <div className="flex flex-col gap-4 mt-2">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] uppercase font-bold text-gray-400 w-12 tracking-wide">Boyut</span>
                                <input
                                    type="range" min="0.5" max="2" step="0.1"
                                    onChange={(e) => engine.updateLayer(engine.selectedId!, { scale: parseFloat(e.target.value) })}
                                    className="flex-1 h-1.5 bg-gray-200/50 rounded-full appearance-none accent-black"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] uppercase font-bold text-gray-400 w-12 tracking-wide">Açı</span>
                                <input
                                    type="range" min="-180" max="180" step="5"
                                    onChange={(e) => engine.updateLayer(engine.selectedId!, { rotation: parseFloat(e.target.value) })}
                                    className="flex-1 h-1.5 bg-gray-200/50 rounded-full appearance-none accent-black"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Selector + Buy */}
                    <div className="flex items-center gap-4 justify-between">
                        {/* Product Selector */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                            {productTypes.map(p => (
                                <button key={p.id} className="w-12 h-12 rounded-2xl bg-white/50 border border-white/20 flex items-center justify-center text-xl hover:bg-white hover:scale-110 transition-all shadow-sm">
                                    {p.icon}
                                </button>
                            ))}
                        </div>

                        {/* Buy Button */}
                        <button className="flex-1 h-14 bg-[#111] text-white rounded-[24px] font-bold text-lg shadow-xl shadow-black/10 hover:bg-black transition-all flex items-center justify-between px-6">
                            <span>Sipariş Ver</span>
                            <span className="text-sm font-medium opacity-70">299₺</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden Inputs */}
            {engine.tab === 'images' && (
                <input
                    type="file" multiple accept="image/*"
                    className="hidden"
                    ref={input => input && input.click()}
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            engine.addImageFromFile(e.target.files[0]);
                            engine.setTab(null);
                        }
                    }}
                />
            )}

            {/* STICKER DRAWER - V4 Style */}
            {engine.tab === 'stickers' && (
                <div className="absolute inset-x-0 bottom-0 top-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
                    <div className="w-full bg-white rounded-t-3xl p-6 h-[50vh] animate-in slide-in-from-bottom-full duration-300 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Sticker Seç</h3>
                            <button onClick={() => engine.setTab(null)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-4 gap-4 overflow-y-auto">
                            {STICKERS.map(s => (
                                <button key={s.id} onClick={() => { engine.addSticker(s.src); engine.setTab(null); }} className="aspect-square bg-gray-50 rounded-xl p-2 hover:bg-purple-50 transition border border-transparent hover:border-purple-500">
                                    <img src={s.src} className="w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- SUB COMPONENTS ---

function FloatTool({ icon: Icon, label, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="w-14 h-14 bg-white/60 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center gap-0.5 hover:bg-white/80 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-white/20 group"
        >
            <Icon className="w-6 h-6 text-gray-800 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <span className="text-[9px] font-bold text-gray-500">{label}</span>
        </button>
    );
}
