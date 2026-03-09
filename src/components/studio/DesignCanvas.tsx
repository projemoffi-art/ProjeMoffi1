
import { useState, useRef, useEffect } from "react";
import { Camera, Type, Sticker, Wand2, Eraser, ZoomIn, RotateCw, Box, ShoppingBag, X, Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { STICKERS, FONTS, COLORS } from "@/constants/studio-assets";




export function DesignCanvas({ product, onSave }: { product: any, onSave: (state: any) => void }) {
    // --- STATE ---
    const [layers, setLayers] = useState<any[]>([]);
    const [activeLayerId, setActiveLayerId] = useState<number | null>(null);
    const [draggingId, setDraggingId] = useState<number | null>(null);

    // Tools UI State
    const [activeTool, setActiveTool] = useState<'text' | 'sticker' | null>(null);
    const [textInput, setTextInput] = useState("METİN");
    const [selectedFont, setSelectedFont] = useState(FONTS[0]);
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    // Canvas Refs for Coordinate Calculation
    const canvasRef = useRef<HTMLDivElement>(null);

    // --- LOGIC: ADD LAYERS ---
    const addTextLayer = () => {
        const newLayer = {
            id: Date.now(),
            type: 'text',
            content: textInput,
            x: 50, y: 50,
            rotation: 0,
            scale: 1,
            color: selectedColor,
            font: selectedFont.class
        };
        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
        setActiveTool(null); // Close drawer
        setTextInput("METİN"); // Reset
    };

    const addStickerLayer = (src: string) => {
        const newLayer = {
            id: Date.now(),
            type: 'image',
            src: src,
            x: 50, y: 50,
            rotation: 0,
            scale: 1
        };
        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
        setActiveTool(null);
    };

    const deleteActiveLayer = () => {
        if (activeLayerId) {
            setLayers(prev => prev.filter(l => l.id !== activeLayerId));
            setActiveLayerId(null);
        }
    };

    // --- LOGIC: DRAG & DROP ---
    const handlePointerDown = (e: React.PointerEvent, id: number) => {
        e.stopPropagation();
        setActiveLayerId(id);
        setDraggingId(id);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!draggingId || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        // Calculate percentage position relative to canvas container
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Clamp to 0-100
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));

        setLayers(prev => prev.map(l => l.id === draggingId ? { ...l, x: clampedX, y: clampedY } : l));
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setDraggingId(null);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    // --- LOGIC: SLIDERS ---
    const updateActiveLayer = (key: string, value: any) => {
        if (!activeLayerId) return;
        setLayers(prev => prev.map(l => l.id === activeLayerId ? { ...l, [key]: value } : l));
    };

    const activeLayer = layers.find(l => l.id === activeLayerId);


    return (
        <div className="h-full flex flex-col bg-[#F0F0F5] dark:bg-[#111] relative overflow-hidden animate-in fade-in duration-500 font-sans">

            {/* --- CANVAS AREA (INTERACTIVE) --- */}
            <div
                className="absolute inset-0 flex items-center justify-center z-0 pt-10 pb-32"
                onPointerUp={() => setDraggingId(null)} // Click outside to deselect could go here too, but dragging safety first
                onClick={(e) => { if (e.target === e.currentTarget) setActiveLayerId(null); }}
            >
                <div className="relative w-[340px] h-[450px]">
                    {/* Product Base Image */}
                    <img
                        src={product.img}
                        className="w-full h-full object-contain drop-shadow-2xl pointer-events-none select-none"
                        alt="Product Base"
                    />

                    {/* Printable Area Container */}
                    <div
                        ref={canvasRef}
                        className="absolute top-[20%] left-[20%] right-[20%] bottom-[25%] border-2 border-dashed border-gray-300/30 rounded-xl overflow-hidden touch-none"
                        onPointerMove={handlePointerMove}
                    >
                        {/* DRAGGABLE LAYERS */}
                        {layers.map(layer => (
                            <div
                                key={layer.id}
                                onPointerDown={(e) => handlePointerDown(e, layer.id)}
                                onPointerUp={handlePointerUp}
                                className={cn(
                                    "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none select-none transition-shadow",
                                    activeLayerId === layer.id ? "z-20 ring-2 ring-[#5B4D9D]" : "z-10"
                                )}
                                style={{
                                    left: `${layer.x}%`,
                                    top: `${layer.y}%`,
                                    transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
                                    maxWidth: '100%'
                                }}
                            >
                                {layer.type === 'image' ? (
                                    <img src={layer.src} className="w-24 h-24 object-contain pointer-events-none" />
                                ) : (
                                    <span
                                        className={cn("font-black text-center whitespace-nowrap text-2xl uppercase pointer-events-none", layer.font)}
                                        style={{ color: layer.color, textShadow: '0px 2px 4px rgba(0,0,0,0.1)' }}
                                    >
                                        {layer.content}
                                    </span>
                                )}
                            </div>
                        ))}

                        {layers.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-400/50 pointer-events-none select-none uppercase tracking-widest">
                                Buraya Ekle
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- LEFT TOOLBAR --- */}
            <div className="absolute left-4 top-24 flex flex-col gap-3 z-30">
                <button
                    onClick={() => setActiveTool(null)}
                    className="w-12 h-12 bg-white dark:bg-black/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-800 hover:scale-105 active:scale-95 transition-all text-blue-500"
                >
                    <Camera className="w-5 h-5" />
                </button>

                <button
                    onClick={() => setActiveTool('text')}
                    className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border transition-all",
                        activeTool === 'text' ? "bg-[#5B4D9D] text-white border-[#5B4D9D]" : "bg-white dark:bg-black/80 backdrop-blur-md text-purple-500 border-gray-100 dark:border-gray-800"
                    )}
                >
                    <Type className="w-5 h-5" />
                </button>

                <button
                    onClick={() => setActiveTool('sticker')}
                    className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border transition-all",
                        activeTool === 'sticker' ? "bg-orange-500 text-white border-orange-500" : "bg-white dark:bg-black/80 backdrop-blur-md text-orange-500 border-gray-100 dark:border-gray-800"
                    )}
                >
                    <Sticker className="w-5 h-5" />
                </button>

                <button className="w-12 h-12 bg-white dark:bg-black/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-800 text-pink-500 opacity-50 cursor-not-allowed">
                    <Wand2 className="w-5 h-5" />
                </button>

                {activeLayerId && (
                    <button
                        onClick={deleteActiveLayer}
                        className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg border border-red-600 hover:bg-red-600 active:scale-95 transition-all animate-in zoom-in"
                    >
                        <Eraser className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* --- RIGHT SLIDERS (Functional) --- */}
            <div className="absolute right-4 top-24 bottom-40 w-12 flex flex-col items-center gap-6 z-30 py-4 bg-white/50 dark:bg-black/50 backdrop-blur-xl rounded-full border border-white/20">

                {/* Scale Control */}
                <div className="flex flex-col items-center gap-2 w-full">
                    <ZoomIn className="w-4 h-4 text-gray-500" />
                    <input
                        type="range" min="0.5" max="2" step="0.1"
                        value={activeLayer?.scale || 1}
                        onChange={(e) => updateActiveLayer('scale', parseFloat(e.target.value))}
                        className="h-24 -rotate-90 w-2 appearance-none bg-gray-300 rounded-full accent-[#5B4D9D] cursor-pointer"
                        disabled={!activeLayerId}
                    />
                </div>

                <div className="w-full h-px bg-gray-300" />

                {/* Rotation Control */}
                <div className="flex flex-col items-center gap-2 w-full">
                    <RotateCw className="w-4 h-4 text-gray-500" />
                    <input
                        type="range" min="-180" max="180" step="5"
                        value={activeLayer?.rotation || 0}
                        onChange={(e) => updateActiveLayer('rotation', parseInt(e.target.value))}
                        className="h-24 -rotate-90 w-2 appearance-none bg-gray-300 rounded-full accent-[#5B4D9D] cursor-pointer"
                        disabled={!activeLayerId}
                    />
                </div>
            </div>

            {/* --- TOOL DRAWERS (Overlays) --- */}

            {/* 1. Text Editor Drawer */}
            {activeTool === 'text' && (
                <div className="absolute bottom-32 left-4 right-4 bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 shadow-2xl z-50 animate-in slide-in-from-bottom-10 border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-gray-400">Yazı Ekle</span>
                        <button onClick={() => setActiveTool(null)}><X className="w-5 h-5 text-gray-400" /></button>
                    </div>

                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value.toUpperCase())}
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 font-bold text-center text-lg mb-4 focus:ring-2 focus:ring-[#5B4D9D] outline-none text-black dark:text-white"
                        placeholder="METİN YAZIN..."
                    />

                    {/* Fonts */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                        {FONTS.map(font => (
                            <button
                                key={font.id}
                                onClick={() => setSelectedFont(font)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap",
                                    selectedFont.id === font.id ? "bg-black text-white dark:bg-white dark:text-black border-transparent" : "border-gray-200 text-gray-500"
                                )}
                            >
                                {font.name}
                            </button>
                        ))}
                    </div>

                    {/* Colors */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
                        {COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={cn(
                                    "w-8 h-8 rounded-full border-2 flex-shrink-0",
                                    selectedColor === color ? "border-black dark:border-white scale-110" : "border-transparent"
                                )}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>

                    <button onClick={addTextLayer} className="w-full bg-[#5B4D9D] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                        <Check className="w-4 h-4" /> Ekle
                    </button>
                </div>
            )}

            {/* 2. Sticker Drawer */}
            {activeTool === 'sticker' && (
                <div className="absolute bottom-32 left-4 right-4 bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 shadow-2xl z-50 animate-in slide-in-from-bottom-10 border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-gray-400">Sticker Ekle</span>
                        <button onClick={() => setActiveTool(null)}><X className="w-5 h-5 text-gray-400" /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {STICKERS.map(sticker => (
                            <button
                                key={sticker.id}
                                onClick={() => addStickerLayer(sticker.src)}
                                className="aspect-square bg-gray-50 dark:bg-black rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition p-2"
                            >
                                <img src={sticker.src} className="w-full h-full object-contain" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* --- BOTTOM PANEL (Contextual) --- */}
            <div className="absolute bottom-0 w-full z-40">
                <div className="bg-white dark:bg-[#1A1A1A] w-full pb-8 pt-6 px-6 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Box className="w-4 h-4" /> Koleksiyon
                        </h3>
                        {/* Only show 'Change Product' logic if not editing a layer specifically */}
                        <div className="text-xs font-bold text-[#5B4D9D] cursor-pointer" onClick={() => window.location.reload()}>Sıfırla</div>
                    </div>

                    <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {[
                            { name: "Sweatshirt", icon: "🧥", active: true },
                            { name: "Bandana", icon: "🧣", active: false },
                            { name: "Mama Kabı", icon: "🥣", active: false }
                        ].map((p, i) => (
                            <button
                                key={i}
                                className={cn(
                                    "min-w-[80px] h-[90px] rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all",
                                    p.active ? "bg-[#F5F5FA] border-[#5B4D9D] ring-1 ring-[#5B4D9D]" : "bg-gray-50 dark:bg-gray-800 border-transparent opacity-60"
                                )}
                            >
                                <span className="text-2xl drop-shadow-sm">{p.icon}</span>
                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{p.name}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => onSave(layers)}
                        className="w-full mt-2 bg-[#1f2937] text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] active:scale-95 transition-all"
                    >
                        <ShoppingBag className="w-5 h-5" /> Tasarımı Tamamla ({layers.length})
                    </button>
                </div>
            </div>

        </div>
    );
}
