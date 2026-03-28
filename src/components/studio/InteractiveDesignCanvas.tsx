"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shirt, Image as LucideImage, Type, Layers, Layout,
    Undo2, Redo2, Eye, Settings2, ArrowLeft, ChevronDown,
    Save, RotateCcw, Upload, Lock, Unlock, EyeOff,
    Trash2, Copy, ArrowUp, ArrowDown, Sparkles, X,
    Palette, Box, Wand2, Plus, CheckCircle2, Eraser,
    Maximize, Zap, Bold, Italic, Underline,
    FlipHorizontal, FlipVertical, RotateCw,
    ZoomIn, ZoomOut, Move, Download, Share2, Grid3X3,
    EyeOff as EyeOffIcon, GripVertical
} from "lucide-react";
import { MagicPromptInput } from "@/components/studio/ai/MagicPromptInput";
import { generateImageAction } from "@/app/actions/ai";
import { cn } from "@/lib/utils";
import { STICKERS, STICKER_CATEGORIES, FONTS, COLORS, GRADIENTS } from "@/constants/studio-assets";

// --- TYPES ---
interface DesignOneProps {
    productImage: string;
    productName?: string;
    initialLayers?: DesignLayer[];
    onLayersChange?: (layers: DesignLayer[]) => void;
    onSave: (state: any) => void;
}

interface DesignLayer {
    id: number;
    type: 'text' | 'image';
    name: string;
    x: number; y: number;
    scale: number; rotation: number; opacity: number;
    visible: boolean; locked: boolean;
    // Text
    content?: string; font?: string; color?: string;
    bold?: boolean; italic?: boolean; underline?: boolean;
    fontSize?: number; letterSpacing?: number;
    shadow?: { x: number; y: number; blur: number; color: string };
    stroke?: { width: number; color: string };
    // Image
    src?: string;
    filter?: { brightness: number; contrast: number; saturation: number; blur: number; hueRotate: number };
    flipX?: boolean; flipY?: boolean;
    borderRadius?: number;
}

const PRODUCTS = [
    { id: 'tshirt', name: 'T-Shirt', src: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1780&auto=format&fit=crop' },
    { id: 'hoodie', name: 'Hoodie', src: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2070&auto=format&fit=crop' },
    { id: 'mug', name: 'Kupa', src: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2070&auto=format&fit=crop' },
    { id: 'tote', name: 'Çanta', src: 'https://images.unsplash.com/photo-1597484662317-c9253d3d0984?q=80&w=1974&auto=format&fit=crop' },
];

export function InteractiveDesignCanvas({ productImage, productName, initialLayers, onLayersChange, onSave }: DesignOneProps) {
    const router = useRouter();
    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mounted, setMounted] = useState(false);

    // Core State
    const [layers, setLayers] = useState<DesignLayer[]>(initialLayers || []);
    const [activeLayerId, setActiveLayerId] = useState<number | null>(null);
    const [draggingId, setDraggingId] = useState<number | null>(null);

    // UI State
    const [activeTool, setActiveTool] = useState<'product' | 'assets' | 'text' | 'layers' | 'ai' | null>(null);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [stickerCategory, setStickerCategory] = useState('moffi');

    // AI State
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    // Transform
    const [transformMode, setTransformMode] = useState<'drag' | 'rotate' | 'scale' | null>(null);
    const [initialTransform, setInitialTransform] = useState<any>(null);
    const [bgTransform, setBgTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isDraggingBg, setIsDraggingBg] = useState(false);
    const [bgDragStart, setBgDragStart] = useState({ x: 0, y: 0 });

    // Selections
    const [currentProduct, setCurrentProduct] = useState(PRODUCTS[0]);
    const [textInput, setTextInput] = useState("METİN");
    const [selectedFont, setSelectedFont] = useState(FONTS[0]);
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [textFontSize, setTextFontSize] = useState(36);

    // History
    const [history, setHistory] = useState<DesignLayer[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Snap guides
    const [snapLines, setSnapLines] = useState<{ type: 'h' | 'v'; pos: number }[]>([]);

    useEffect(() => { setMounted(true); }, []);

    // --- HISTORY ---
    const addToHistory = useCallback((newLayers: DesignLayer[]) => {
        setHistory(prev => {
            const sliced = prev.slice(0, historyIndex + 1);
            sliced.push(newLayers);
            return sliced;
        });
        setHistoryIndex(prev => prev + 1);
        if (onLayersChange) onLayersChange(newLayers);
    }, [historyIndex, onLayersChange]);

    const undo = () => { if (historyIndex > 0) { setHistoryIndex(p => p - 1); setLayers(history[historyIndex - 1]); } };
    const redo = () => { if (historyIndex < history.length - 1) { setHistoryIndex(p => p + 1); setLayers(history[historyIndex + 1]); } };

    // --- LAYER ACTIONS ---
    const addLayer = (layer: DesignLayer) => {
        const newLayers = [...layers, layer];
        setLayers(newLayers);
        addToHistory(newLayers);
        setActiveLayerId(layer.id);
        setIsInspectorOpen(true);
    };

    const updateActiveLayer = (key: string, value: any) => {
        if (!activeLayerId) return;
        setLayers(prev => {
            const next = prev.map(l => l.id === activeLayerId ? { ...l, [key]: value } : l);
            if (onLayersChange) onLayersChange(next);
            return next;
        });
    };

    const deleteActiveLayer = () => {
        if (activeLayerId) {
            const newLayers = layers.filter(l => l.id !== activeLayerId);
            setLayers(newLayers); addToHistory(newLayers);
            setActiveLayerId(null); setIsInspectorOpen(false);
        }
    };

    const duplicateActiveLayer = () => {
        const src = layers.find(l => l.id === activeLayerId);
        if (src) {
            const dup = { ...src, id: Date.now(), name: src.name + ' Kopya', x: src.x + 5, y: src.y + 5 };
            const newLayers = [...layers, dup];
            setLayers(newLayers); addToHistory(newLayers);
            setActiveLayerId(dup.id);
        }
    };

    const moveLayer = (dir: 'up' | 'down') => {
        const idx = layers.findIndex(l => l.id === activeLayerId);
        if (idx < 0) return;
        const newLayers = [...layers];
        const target = dir === 'up' ? idx + 1 : idx - 1;
        if (target < 0 || target >= newLayers.length) return;
        [newLayers[idx], newLayers[target]] = [newLayers[target], newLayers[idx]];
        setLayers(newLayers); addToHistory(newLayers);
    };

    const addTextLayer = () => {
        addLayer({
            id: Date.now(), type: 'text', name: `Metin ${layers.filter(l => l.type === 'text').length + 1}`,
            content: textInput, font: selectedFont.class, color: selectedColor,
            x: 50, y: 50, scale: 1, rotation: 0, opacity: 100, visible: true, locked: false,
            bold: false, italic: false, underline: false, fontSize: textFontSize, letterSpacing: 0,
            shadow: undefined, stroke: undefined,
        });
    };

    // File Upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            addLayer({
                id: Date.now(), type: 'image', name: file.name.slice(0, 20),
                src: dataUrl, x: 50, y: 50, scale: 1, rotation: 0, opacity: 100,
                visible: true, locked: false,
                filter: { brightness: 100, contrast: 100, saturation: 100, blur: 0, hueRotate: 0 },
            });
            setActiveTool(null);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // Zoom
    const zoomIn = () => setBgTransform(p => ({ ...p, scale: Math.min(p.scale + 0.15, 3) }));
    const zoomOut = () => setBgTransform(p => ({ ...p, scale: Math.max(p.scale - 0.15, 0.3) }));
    const resetZoom = () => setBgTransform({ x: 0, y: 0, scale: 1 });

    const activeLayer = layers.find(l => l.id === activeLayerId);

    // --- SNAP LOGIC ---
    const checkSnap = (x: number, y: number) => {
        const threshold = 2;
        const guides: { type: 'h' | 'v'; pos: number }[] = [];
        if (Math.abs(x - 50) < threshold) guides.push({ type: 'v', pos: 50 });
        if (Math.abs(y - 50) < threshold) guides.push({ type: 'h', pos: 50 });
        if (Math.abs(x - 25) < threshold) guides.push({ type: 'v', pos: 25 });
        if (Math.abs(x - 75) < threshold) guides.push({ type: 'v', pos: 75 });
        if (Math.abs(y - 25) < threshold) guides.push({ type: 'h', pos: 25 });
        if (Math.abs(y - 75) < threshold) guides.push({ type: 'h', pos: 75 });
        setSnapLines(guides);
        return {
            x: guides.find(g => g.type === 'v')?.pos ?? x,
            y: guides.find(g => g.type === 'h')?.pos ?? y,
        };
    };

    // --- POINTER EVENTS ---
    const handleCanvasPointerDown = (e: React.PointerEvent) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).id === 'canvas-bg') {
            setActiveLayerId(null); setIsInspectorOpen(false);
            e.preventDefault();
            setIsDraggingBg(true);
            setBgDragStart({ x: e.clientX - bgTransform.x, y: e.clientY - bgTransform.y });
        }
    };

    const handleLayerPointerDown = (e: React.PointerEvent, id: number, mode: 'drag' | 'rotate' | 'scale') => {
        const layer = layers.find(l => l.id === id);
        if (layer?.locked) return;
        e.stopPropagation(); e.preventDefault();
        setActiveLayerId(id); setDraggingId(id); setTransformMode(mode); setIsInspectorOpen(true);
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            if (layer) {
                const cx = rect.left + (layer.x / 100) * rect.width;
                const cy = rect.top + (layer.y / 100) * rect.height;
                setInitialTransform({
                    x: e.clientX, y: e.clientY,
                    angle: Math.atan2(e.clientY - cy, e.clientX - cx),
                    dist: Math.hypot(e.clientX - cx, e.clientY - cy),
                    scale: layer.scale, rotation: layer.rotation
                });
            }
        }
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isDraggingBg) {
            setBgTransform(prev => ({ ...prev, x: e.clientX - bgDragStart.x, y: e.clientY - bgDragStart.y }));
            return;
        }
        if (!draggingId || !canvasRef.current) return;
        const layer = layers.find(l => l.id === draggingId);
        if (!layer) return;
        const rect = canvasRef.current.getBoundingClientRect();

        if (transformMode === 'drag') {
            let x = ((e.clientX - rect.left) / rect.width) * 100;
            let y = ((e.clientY - rect.top) / rect.height) * 100;
            const snapped = checkSnap(x, y);
            x = snapped.x; y = snapped.y;
            const nextLayers = layers.map(l => l.id === draggingId ? { ...l, x, y } : l);
            setLayers(nextLayers);
            if (onLayersChange) onLayersChange(nextLayers);
        } else if (transformMode === 'rotate' && initialTransform) {
            const cx = rect.left + (layer.x / 100) * rect.width;
            const cy = rect.top + (layer.y / 100) * rect.height;
            const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
            const delta = angle - initialTransform.angle;
            const nextLayers = layers.map(l => l.id === draggingId ? { ...l, rotation: initialTransform.rotation + (delta * (180 / Math.PI)) } : l);
            setLayers(nextLayers);
            if (onLayersChange) onLayersChange(nextLayers);
        } else if (transformMode === 'scale' && initialTransform) {
            const cx = rect.left + (layer.x / 100) * rect.width;
            const cy = rect.top + (layer.y / 100) * rect.height;
            const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
            const scale = Math.max(0.2, initialTransform.scale * (dist / initialTransform.dist));
            const nextLayers = layers.map(l => l.id === draggingId ? { ...l, scale } : l);
            setLayers(nextLayers);
            if (onLayersChange) onLayersChange(nextLayers);
        }
    };

    const handlePointerUp = () => {
        setDraggingId(null); setIsDraggingBg(false); setTransformMode(null); setSnapLines([]);
        if (draggingId) addToHistory(layers);
    };

    // Keyboard
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && activeLayerId) deleteActiveLayer();
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
            if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
            if (e.ctrlKey && e.key === 'd') { e.preventDefault(); duplicateActiveLayer(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [activeLayerId, layers, historyIndex]);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 w-full h-full bg-[#f2f2f7] dark:bg-[#000] overflow-hidden select-none touch-none font-sans"
            onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

            {/* --- CANVAS --- */}
            <div ref={canvasRef} className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden z-0 cursor-grab active:cursor-grabbing"
                onPointerDown={handleCanvasPointerDown}>
                <motion.div className="relative w-[350px] md:w-[500px] aspect-[3/4] shadow-2xl bg-white rounded-none md:rounded-lg overflow-hidden will-change-transform"
                    style={{ x: bgTransform.x, y: bgTransform.y, scale: bgTransform.scale }}>
                    <img src={currentProduct.src} className="w-full h-full object-cover pointer-events-none" />
                    <div className="absolute inset-0 bg-black/5 pointer-events-none mix-blend-multiply" />

                    {/* Grid Overlay */}
                    {showGrid && (
                        <div className="absolute inset-0 pointer-events-none z-10">
                            <div className="absolute left-1/4 top-0 bottom-0 w-px bg-cyan-400/30" />
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/50" />
                            <div className="absolute left-3/4 top-0 bottom-0 w-px bg-cyan-400/30" />
                            <div className="absolute top-1/4 left-0 right-0 h-px bg-cyan-400/30" />
                            <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/50" />
                            <div className="absolute top-3/4 left-0 right-0 h-px bg-cyan-400/30" />
                        </div>
                    )}

                    {/* Snap Lines */}
                    {snapLines.map((s, i) => (
                        <div key={i} className={cn("absolute bg-pink-500 z-30 pointer-events-none",
                            s.type === 'v' ? "w-px top-0 bottom-0" : "h-px left-0 right-0"
                        )} style={s.type === 'v' ? { left: `${s.pos}%` } : { top: `${s.pos}%` }} />
                    ))}

                    {/* Layers */}
                    {layers.map(layer => (
                        layer.visible && (
                            <div key={layer.id} className={cn("absolute touch-none select-none", activeLayerId === layer.id && "z-50")}
                                style={{ left: `${layer.x}%`, top: `${layer.y}%`, transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})` }}
                                onPointerDown={(e) => handleLayerPointerDown(e, layer.id, 'drag')}>
                                <div className={cn("relative group transition-all duration-200",
                                    activeLayerId === layer.id ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent" : "hover:ring-1 hover:ring-white/50",
                                    layer.locked && "opacity-70"
                                )}>
                                    {layer.type === 'text' ? (
                                        <p style={{
                                            fontFamily: layer.font, color: layer.color, fontSize: `${layer.fontSize || 36}px`,
                                            opacity: layer.opacity / 100, letterSpacing: `${layer.letterSpacing || 0}em`,
                                            fontWeight: layer.bold ? 'bold' : 'normal',
                                            fontStyle: layer.italic ? 'italic' : 'normal',
                                            textDecoration: layer.underline ? 'underline' : 'none',
                                            textShadow: layer.shadow ? `${layer.shadow.x}px ${layer.shadow.y}px ${layer.shadow.blur}px ${layer.shadow.color}` : 'none',
                                            WebkitTextStroke: layer.stroke ? `${layer.stroke.width}px ${layer.stroke.color}` : 'none'
                                        }} className="whitespace-nowrap px-2 py-1">{layer.content}</p>
                                    ) : (
                                        <img src={layer.src} className="w-32 h-32 object-contain pointer-events-none" style={{
                                            filter: `brightness(${layer.filter?.brightness ?? 100}%) contrast(${layer.filter?.contrast ?? 100}%) saturate(${layer.filter?.saturation ?? 100}%) blur(${layer.filter?.blur ?? 0}px) hue-rotate(${layer.filter?.hueRotate ?? 0}deg)`,
                                            borderRadius: layer.borderRadius, opacity: layer.opacity / 100,
                                            transform: `scaleX(${layer.flipX ? -1 : 1}) scaleY(${layer.flipY ? -1 : 1})`,
                                        }} />
                                    )}

                                    {/* Handles */}
                                    {activeLayerId === layer.id && !isPreviewMode && !layer.locked && (<>
                                        <button onPointerDown={(e) => handleLayerPointerDown(e, layer.id, 'rotate')} className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full text-black shadow-md flex items-center justify-center cursor-ew-resize"><RotateCw className="w-3 h-3" /></button>
                                        <button onPointerDown={(e) => handleLayerPointerDown(e, layer.id, 'scale')} className="absolute -bottom-4 -right-4 w-6 h-6 bg-purple-500 rounded-full text-white shadow-md flex items-center justify-center cursor-se-resize"><Maximize className="w-3 h-3" /></button>
                                        <button onPointerDown={(e) => { e.stopPropagation(); deleteActiveLayer(); }} className="absolute -top-4 -right-4 w-6 h-6 bg-red-500 rounded-full text-white shadow-md flex items-center justify-center hover:scale-110 transition"><X className="w-3 h-3" /></button>
                                    </>)}
                                </div>
                            </div>
                        )
                    ))}
                </motion.div>
            </div>

            {/* --- TOP BAR --- */}
            {!isPreviewMode && (
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none z-50">
                    <div className="flex gap-2 pointer-events-auto">
                        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-xl border border-white/20 shadow-lg flex items-center justify-center hover:scale-105 transition"><ArrowLeft className="w-5 h-5 dark:text-white" /></button>
                        <div className="bg-white/80 dark:bg-black/50 backdrop-blur-xl border border-white/20 shadow-lg rounded-full px-4 flex items-center gap-2 h-10">
                            <span className="text-xs font-bold dark:text-white">{currentProduct.name}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 pointer-events-auto">
                        {/* Zoom Controls */}
                        <div className="flex bg-white/80 dark:bg-black/50 backdrop-blur-xl border border-white/20 rounded-full p-1 shadow-lg h-10 items-center">
                            <button onClick={zoomOut} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ZoomOut className="w-4 h-4 dark:text-white" /></button>
                            <button onClick={resetZoom} className="px-2 text-[10px] font-bold dark:text-white">{Math.round(bgTransform.scale * 100)}%</button>
                            <button onClick={zoomIn} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ZoomIn className="w-4 h-4 dark:text-white" /></button>
                        </div>
                        {/* Grid Toggle */}
                        <button onClick={() => setShowGrid(!showGrid)} className={cn("w-10 h-10 rounded-full backdrop-blur-xl border border-white/20 shadow-lg flex items-center justify-center transition", showGrid ? "bg-cyan-500 text-white" : "bg-white/80 dark:bg-black/50")}><Grid3X3 className="w-4 h-4 dark:text-white" /></button>
                        {/* Undo/Redo */}
                        <div className="flex bg-white/80 dark:bg-black/50 backdrop-blur-xl border border-white/20 rounded-full p-1 shadow-lg h-10 items-center">
                            <button onClick={undo} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"><Undo2 className="w-4 h-4 dark:text-white" /></button>
                            <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />
                            <button onClick={redo} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"><Redo2 className="w-4 h-4 dark:text-white" /></button>
                        </div>
                        {/* Preview */}
                        <button onClick={() => setIsPreviewMode(true)} className="h-10 px-4 bg-white/80 dark:bg-black/50 backdrop-blur-xl border border-white/20 rounded-full shadow-lg flex items-center justify-center gap-2 text-xs font-bold dark:text-white hover:bg-white dark:hover:bg-black transition"><Eye className="w-4 h-4" /> Önizle</button>
                        {/* Export */}
                        <button onClick={() => onSave({ layers, product: currentProduct })} className="h-10 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg flex items-center justify-center gap-2 text-xs font-bold hover:scale-105 transition"><Download className="w-4 h-4" /> Kaydet</button>
                    </div>
                </div>
            )}

            {/* Preview close */}
            {isPreviewMode && (
                <button onClick={() => setIsPreviewMode(false)} className="absolute top-6 right-6 z-50 px-6 py-2 bg-black text-white rounded-full font-bold shadow-xl hover:scale-105 transition">Düzenlemeye Dön</button>
            )}

            {/* --- TOOL PANELS --- */}
            <AnimatePresence>
                {activeTool && !isPreviewMode && (
                    <motion.div initial={{ y: 100, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        className="absolute bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[520px] bg-white/90 dark:bg-[#111]/90 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl p-4 z-40 max-h-[50vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg dark:text-white capitalize flex items-center gap-2">
                                {activeTool === 'product' && <><Shirt className="w-5 h-5 text-purple-500" /> Ürün Seçimi</>}
                                {activeTool === 'assets' && <><LucideImage className="w-5 h-5 text-blue-500" /> Varlıklar</>}
                                {activeTool === 'text' && <><Type className="w-5 h-5 text-green-500" /> Metin Ekle</>}
                                {activeTool === 'layers' && <><Layers className="w-5 h-5 text-orange-500" /> Katmanlar</>}
                                {activeTool === 'ai' && <><Sparkles className="w-5 h-5 text-pink-500" /> AI Stüdyo</>}
                            </h3>
                            <button onClick={() => setActiveTool(null)} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><X className="w-5 h-5 dark:text-white" /></button>
                        </div>

                        {/* PRODUCT PANEL */}
                        {activeTool === 'product' && (
                            <div className="grid grid-cols-2 gap-3">
                                {PRODUCTS.map(p => (
                                    <button key={p.id} onClick={() => { setCurrentProduct(p); setActiveTool(null); }} className={cn("aspect-square rounded-xl overflow-hidden border-2 relative", currentProduct.id === p.id ? "border-purple-500" : "border-transparent")}>
                                        <img src={p.src} className="w-full h-full object-cover" />
                                        <span className="absolute bottom-2 left-2 text-white font-bold text-xs drop-shadow-md">{p.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ASSETS PANEL */}
                        {activeTool === 'assets' && (
                            <div className="space-y-3">
                                {/* Upload + Categories */}
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold flex items-center gap-1 whitespace-nowrap"><Upload className="w-3 h-3" /> Yükle</button>
                                    {STICKER_CATEGORIES.map(c => (
                                        <button key={c.id} onClick={() => setStickerCategory(c.id)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap", stickerCategory === c.id ? "bg-black text-white" : "bg-gray-100 text-gray-600")}>{c.name}</button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {STICKERS.filter(s => s.category === stickerCategory).map(s => (
                                        <button key={s.id} onClick={() => { addLayer({ id: Date.now(), type: 'image', name: s.label, src: s.src, x: 50, y: 50, scale: 1, rotation: 0, opacity: 100, visible: true, locked: false, filter: { brightness: 100, contrast: 100, saturation: 100, blur: 0, hueRotate: 0 } }); setActiveTool(null); }} className="aspect-square bg-gray-50 dark:bg-white/5 rounded-xl p-2 hover:scale-105 transition">
                                            <img src={s.src} className="w-full h-full object-contain" />
                                            <span className="text-[8px] font-bold text-gray-400 block mt-1 truncate">{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TEXT PANEL */}
                        {activeTool === 'text' && (
                            <div className="space-y-4">
                                <input value={textInput} onChange={e => setTextInput(e.target.value)} className="w-full bg-gray-100 dark:bg-white/10 p-3 rounded-xl font-bold text-center outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
                                {/* Font size */}
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase w-16">Boyut</span>
                                    <input type="range" min={12} max={72} value={textFontSize} onChange={e => setTextFontSize(Number(e.target.value))} className="flex-1 accent-purple-600" />
                                    <span className="text-xs font-bold dark:text-white w-8 text-right">{textFontSize}</span>
                                </div>
                                {/* Fonts */}
                                <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto">
                                    {FONTS.map(f => (<button key={f.id} onClick={() => setSelectedFont(f)} className={cn("p-2 border rounded-lg text-xs truncate", selectedFont.id === f.id ? "bg-black text-white dark:bg-white dark:text-black" : "bg-white dark:bg-white/5 dark:text-white")} style={{ fontFamily: f.class }}>{f.name}</button>))}
                                </div>
                                {/* Colors */}
                                <div className="flex gap-1 flex-wrap">{COLORS.map(c => <button key={c} onClick={() => setSelectedColor(c)} className={cn("w-7 h-7 rounded-full border-2 shrink-0", selectedColor === c ? "border-purple-500 scale-110" : "border-transparent")} style={{ backgroundColor: c }} />)}</div>
                                <button onClick={() => { addTextLayer(); setActiveTool(null); }} className="w-full bg-black dark:bg-white dark:text-black text-white py-3 rounded-xl font-bold">Ekle</button>
                            </div>
                        )}

                        {/* LAYERS PANEL */}
                        {activeTool === 'layers' && (
                            <div className="space-y-2">
                                {layers.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-6">Henüz katman yok.</p>
                                ) : (
                                    [...layers].reverse().map(l => (
                                        <div key={l.id} onClick={() => { setActiveLayerId(l.id); setIsInspectorOpen(true); }}
                                            className={cn("flex items-center gap-3 p-3 rounded-xl cursor-pointer transition",
                                                activeLayerId === l.id ? "bg-purple-50 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30" : "bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10")}>
                                            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
                                                {l.type === 'text' ? <Type className="w-4 h-4" /> : <LucideImage className="w-4 h-4" />}
                                            </div>
                                            <span className="text-sm font-medium dark:text-white flex-1 truncate">{l.name}</span>
                                            <button onClick={(e) => { e.stopPropagation(); setLayers(prev => prev.map(p => p.id === l.id ? { ...p, visible: !p.visible } : p)); }} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10">
                                                {l.visible ? <Eye className="w-3.5 h-3.5 text-gray-400" /> : <EyeOffIcon className="w-3.5 h-3.5 text-red-400" />}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setLayers(prev => prev.map(p => p.id === l.id ? { ...p, locked: !p.locked } : p)); }} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10">
                                                {l.locked ? <Lock className="w-3.5 h-3.5 text-red-400" /> : <Unlock className="w-3.5 h-3.5 text-gray-400" />}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* AI PANEL */}
                        {activeTool === 'ai' && (
                            <div className="space-y-4">
                                <MagicPromptInput onPromptGenerated={(prompt) => {
                                    setAiPrompt(prompt);
                                    const gen = async () => {
                                        setIsGenerating(true);
                                        try { const res = await generateImageAction(prompt); if (res.success && res.url) setGeneratedImage(res.url); else alert(res.error); } catch (e) { console.error(e); } finally { setIsGenerating(false); }
                                    };
                                    gen();
                                }} isGenerating={isGenerating} />
                                {generatedImage && (
                                    <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-xl">
                                        <img src={generatedImage} className="w-full rounded-lg mb-2" />
                                        <button onClick={() => { addLayer({ id: Date.now(), type: 'image', name: 'AI Görsel', src: generatedImage, x: 50, y: 50, scale: 1, rotation: 0, opacity: 100, visible: true, locked: false }); setActiveTool(null); }} className="w-full bg-purple-600 text-white py-2 rounded-lg font-bold">Tuvale Ekle</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- DOCK --- */}
            {!isPreviewMode && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-end gap-3">
                    <div className="bg-white/80 dark:bg-black/80 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-full px-4 py-3 flex items-center gap-2 md:gap-4 transition-all hover:scale-105">
                        <DockItem icon={Shirt} label="Ürün" active={activeTool === 'product'} onClick={() => setActiveTool(activeTool === 'product' ? null : 'product')} />
                        <div className="w-px h-8 bg-gray-300 dark:bg-white/20" />
                        <DockItem icon={Type} label="Yazı" active={activeTool === 'text'} onClick={() => setActiveTool(activeTool === 'text' ? null : 'text')} />
                        <DockItem icon={LucideImage} label="Varlık" active={activeTool === 'assets'} onClick={() => setActiveTool(activeTool === 'assets' ? null : 'assets')} />
                        <DockItem icon={Layers} label="Katmanlar" active={activeTool === 'layers'} onClick={() => setActiveTool(activeTool === 'layers' ? null : 'layers')} />
                        <div className="w-px h-8 bg-gray-300 dark:bg-white/20" />
                        <DockItem icon={Sparkles} label="Yapay Zeka" active={activeTool === 'ai'} onClick={() => setActiveTool(activeTool === 'ai' ? null : 'ai')} highlight />
                    </div>

                    <AnimatePresence>
                        {activeLayerId && (
                            <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                                onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                                className={cn("w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all border-4",
                                    isInspectorOpen ? "bg-white text-black border-purple-500" : "bg-purple-600 text-white border-white/20")}>
                                <Settings2 className="w-6 h-6" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* --- INSPECTOR --- */}
            <AnimatePresence>
                {isInspectorOpen && activeLayer && !isPreviewMode && (
                    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
                        className="absolute bottom-24 right-4 md:right-6 md:top-24 md:bottom-auto w-[90%] md:w-80 bg-white/95 dark:bg-[#111]/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-5 z-50 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-dashed border-gray-200 dark:border-white/10">
                            <h4 className="font-black text-xs uppercase dark:text-white">Katman Özellikleri</h4>
                            <div className="flex gap-1">
                                <button onClick={duplicateActiveLayer} className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-blue-600" title="Çoğalt"><Copy className="w-3.5 h-3.5" /></button>
                                <button onClick={() => moveLayer('up')} className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-blue-600" title="Üste"><ArrowUp className="w-3.5 h-3.5" /></button>
                                <button onClick={() => moveLayer('down')} className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-blue-600" title="Alta"><ArrowDown className="w-3.5 h-3.5" /></button>
                                <button onClick={() => updateActiveLayer('locked', !activeLayer.locked)} className={cn("p-1.5 rounded-lg", activeLayer.locked ? "bg-red-100 text-red-500" : "bg-gray-100 dark:bg-white/10 text-gray-500")}><Lock className="w-3.5 h-3.5" /></button>
                                <button onClick={deleteActiveLayer} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><Trash2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setIsInspectorOpen(false)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"><X className="w-3.5 h-3.5 dark:text-white" /></button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Opacity */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Görünürlük ({activeLayer.opacity}%)</span>
                                <input type="range" min="0" max="100" value={activeLayer.opacity} onChange={(e) => updateActiveLayer('opacity', parseInt(e.target.value))} className="w-full h-1.5 accent-purple-600 bg-gray-200 rounded-lg" />
                            </div>

                            {/* IMAGE SPECIFIC */}
                            {activeLayer.type === 'image' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => updateActiveLayer('flipX', !activeLayer.flipX)} className={cn("py-2 rounded-lg text-xs font-bold border", activeLayer.flipX ? "bg-purple-100 border-purple-500 text-purple-700" : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 dark:text-white")}>Yatay Çevir</button>
                                        <button onClick={() => updateActiveLayer('flipY', !activeLayer.flipY)} className={cn("py-2 rounded-lg text-xs font-bold border", activeLayer.flipY ? "bg-purple-100 border-purple-500 text-purple-700" : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 dark:text-white")}>Dikey Çevir</button>
                                    </div>
                                    {[
                                        { key: 'brightness', label: 'Parlaklık', max: 200 },
                                        { key: 'contrast', label: 'Kontrast', max: 200 },
                                        { key: 'saturation', label: 'Doygunluk', max: 200 },
                                        { key: 'hueRotate', label: 'Renk Tonu', max: 360 },
                                        { key: 'blur', label: 'Bulanıklık', max: 10 },
                                    ].map(f => (
                                        <div key={f.key} className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{f.label}</span>
                                            <input type="range" min="0" max={f.max} value={(activeLayer.filter as any)?.[f.key] ?? (f.key === 'hueRotate' || f.key === 'blur' ? 0 : 100)} onChange={e => updateActiveLayer('filter', { ...activeLayer.filter, [f.key]: parseInt(e.target.value) })} className="w-full h-1.5 accent-blue-500 bg-gray-200 rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* TEXT SPECIFIC */}
                            {activeLayer.type === 'text' && (
                                <div className="space-y-3">
                                    <input value={activeLayer.content} onChange={e => updateActiveLayer('content', e.target.value)} className="w-full bg-gray-100 dark:bg-white/10 p-2 rounded-lg text-sm font-bold dark:text-white outline-none" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-400 w-10">Boyut</span>
                                        <input type="range" min={12} max={72} value={activeLayer.fontSize || 36} onChange={e => updateActiveLayer('fontSize', Number(e.target.value))} className="flex-1 accent-purple-600" />
                                        <span className="text-xs font-bold dark:text-white w-6">{activeLayer.fontSize || 36}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => updateActiveLayer('bold', !activeLayer.bold)} className={cn("p-2 rounded-lg flex-1 border", activeLayer.bold ? "bg-black text-white dark:bg-white dark:text-black" : "bg-gray-50 dark:bg-white/5 dark:text-white")}><Bold className="w-4 h-4 mx-auto" /></button>
                                        <button onClick={() => updateActiveLayer('italic', !activeLayer.italic)} className={cn("p-2 rounded-lg flex-1 border", activeLayer.italic ? "bg-black text-white dark:bg-white dark:text-black" : "bg-gray-50 dark:bg-white/5 dark:text-white")}><Italic className="w-4 h-4 mx-auto" /></button>
                                        <button onClick={() => updateActiveLayer('underline', !activeLayer.underline)} className={cn("p-2 rounded-lg flex-1 border", activeLayer.underline ? "bg-black text-white dark:bg-white dark:text-black" : "bg-gray-50 dark:bg-white/5 dark:text-white")}><Underline className="w-4 h-4 mx-auto" /></button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">{COLORS.map(c => <button key={c} onClick={() => updateActiveLayer('color', c)} className={cn("w-6 h-6 rounded-full border-2", activeLayer.color === c ? "border-purple-600 scale-110" : "border-white dark:border-gray-700")} style={{ backgroundColor: c }} />)}</div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Harf Aralığı</span>
                                        <input type="range" min={-5} max={20} step={1} value={(activeLayer.letterSpacing || 0) * 100} onChange={e => updateActiveLayer('letterSpacing', Number(e.target.value) / 100)} className="w-full h-1.5 accent-purple-600 bg-gray-200 rounded-lg" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- DOCK ITEM ---
function DockItem({ icon: Icon, label, active, onClick, highlight }: { icon: any, label: string, active: boolean, onClick: () => void, highlight?: boolean }) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-1 group relative pb-1">
            <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm",
                active ? "bg-black text-white dark:bg-white dark:text-black -translate-y-4 scale-110 shadow-xl" : "bg-gray-100 dark:bg-white/10 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/20 hover:-translate-y-1",
                highlight && !active && "bg-gradient-to-tr from-purple-500 to-pink-500 text-white"
            )}>
                <Icon className="w-6 h-6" strokeWidth={2} />
            </div>
            {active && <span className="absolute -bottom-2 w-1 h-1 bg-black dark:bg-white rounded-full" />}
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition absolute -top-8 bg-white dark:bg-black px-2 py-0.5 rounded-md shadow-sm pointer-events-none whitespace-nowrap">{label}</span>
        </button>
    );
}
