"use client";

import React, { useState, useEffect } from 'react';
import { Type, Image as ImageIcon, Sticker, Trash2, AlignCenter, AlignLeft, AlignRight, Bold, Italic, SlidersHorizontal, X, ChevronDown, Wand2, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, FlipHorizontal, FlipVertical, Sun, Contrast, CloudFog, Copy, Lock, Unlock, Palette, Waves, Droplet } from 'lucide-react';
import { useStudio } from './StudioEngine';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function RightPanel() {
    const { state, actions, dispatch } = useStudio();
    const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
    const [isOpen, setIsOpen] = useState(false);
    const [isShapesOpen, setIsShapesOpen] = useState(false);

    // Auto-open removed per user request. 
    // Panel will only open when the floating button is clicked.
    useEffect(() => {
        if (!activeLayer) {
            setIsOpen(false);
        }
    }, [activeLayer?.id]);

    if (!activeLayer || state.activeMode === 'CREATION') return null; // Or show a small "Page Settings" button if needed

    return (
        <>
            {/* FLOATING TRIGGER BUTTON (Bottom Right or Right Center) */}
            <AnimatePresence>
                {!isOpen && activeLayer && (
                    <motion.button
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed right-6 top-1/2 -translate-y-1/2 z-50 w-14 h-14 bg-white dark:bg-black rounded-full shadow-xl flex items-center justify-center border border-gray-100 dark:border-white/10 hover:scale-110 transition-transform"
                    >
                        <SlidersHorizontal className="w-6 h-6 text-gray-900 dark:text-white" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* EXPANDABLE PANEL (Drawer) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ x: 350, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 350, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-6 top-24 bottom-24 w-[300px] bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] shadow-2xl z-50 flex flex-col overflow-hidden"
                    >
                        {/* HEADER */}
                        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center text-gray-500">
                                    {activeLayer.type === 'text' && <Type className="w-4 h-4" />}
                                    {activeLayer.type === 'sticker' && <Sticker className="w-4 h-4" />}
                                    {activeLayer.type === 'image' && <ImageIcon className="w-4 h-4" />}
                                </span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">Düzenle</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={actions.deleteActiveLayer}
                                    className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 transition"
                                >
                                    <X className="w-4 h-4 text-gray-500 dark:text-white" />
                                </button>
                            </div>
                        </div>

                        {/* CONTROLS SCROLL AREA */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* TEXT SPECIFIC */}
                            {/* TEXT SPECIFIC */}
                            {state.activeMode === 'PLACEMENT' && activeLayer.type === 'text' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">İçerik</label>
                                        <input
                                            value={activeLayer.content}
                                            onChange={(e) => actions.updateActiveLayer({ content: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 ring-blue-500 outline-none transition-all dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Stil</label>
                                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-1 flex border border-gray-100 dark:border-white/5">
                                            <button className="flex-1 h-8 rounded-lg hover:bg-white dark:hover:bg-white/10 shadow-sm flex items-center justify-center"><Bold className="w-4 h-4" /></button>
                                            <button className="flex-1 h-8 rounded-lg hover:bg-white dark:hover:bg-white/10 shadow-sm flex items-center justify-center"><Italic className="w-4 h-4" /></button>
                                            <div className="w-px bg-gray-200 dark:bg-white/10 mx-1" />
                                            <button className="flex-1 h-8 rounded-lg hover:bg-white dark:hover:bg-white/10 shadow-sm flex items-center justify-center"><AlignLeft className="w-4 h-4" /></button>
                                            <button className="flex-1 h-8 rounded-lg hover:bg-white dark:hover:bg-white/10 shadow-sm flex items-center justify-center"><AlignCenter className="w-4 h-4" /></button>
                                            <button className="flex-1 h-8 rounded-lg hover:bg-white dark:hover:bg-white/10 shadow-sm flex items-center justify-center"><AlignRight className="w-4 h-4" /></button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Renk</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['#000000', '#FFFFFF', '#FF3B30', '#FF9500', '#34C759', '#007AFF', '#5856D6', '#AF52DE'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => actions.updateActiveLayer({ color: c })}
                                                    className={cn(
                                                        "w-6 h-6 rounded-full border border-gray-200 dark:border-white/10 shadow-sm transition-transform hover:scale-110",
                                                        activeLayer.color === c && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-black"
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* IMAGE SHAPES (MASKING) */}
                            {/* IMAGE SHAPES (MASKING) */}
                            {state.activeMode === 'PLACEMENT' && (activeLayer.type === 'image' || activeLayer.type === 'sticker') && (
                                <div className="space-y-2 border-b border-gray-100 dark:border-white/5 pb-6">
                                    <button
                                        onClick={() => setIsShapesOpen(!isShapesOpen)}
                                        className="w-full flex justify-between items-center group"
                                    >
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer group-hover:text-blue-500 transition-colors">Şekil & Maskeleme</label>
                                        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-300", isShapesOpen ? "rotate-180 text-blue-500" : "")} />
                                    </button>

                                    <AnimatePresence>
                                        {isShapesOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="grid grid-cols-4 gap-2 overflow-hidden pt-2"
                                            >
                                                {[
                                                    { id: 'none', label: 'Yok', val: undefined },
                                                    { id: 'squircle', label: 'Kare (Yumuşak)', val: 'inset(0% round 20%)' },
                                                    { id: 'circle', label: 'Daire', val: 'circle(50% at 50% 50%)' },
                                                    { id: 'pill', label: 'Hap', val: 'inset(0% round 100px)' },

                                                    { id: 'arch', label: 'Kemer', val: 'inset(0% 0% 0% 0% round 50% 50% 0% 0%)' },
                                                    { id: 'leaf', label: 'Yaprak', val: 'inset(0% 0% 0% 0% round 0% 50% 0% 50%)' },
                                                    { id: 'pebble', label: 'Çakıl', val: 'inset(0% 0% 0% 0% round 10% 50% 30% 60%)' },
                                                    { id: 'ticket', label: 'Bilet', val: 'polygon(0% 0%, 30% 0%, 30% 10%, 70% 10%, 70% 0%, 100% 0%, 100% 100%, 70% 100%, 70% 90%, 30% 90%, 30% 100%, 0% 100%)' }, /* CSS Polygon ticket stub might be complex, simplified: */
                                                    // Valid ticket approximation:
                                                    // polygon(...) is hard for rounded cutouts. Stick to simpler.

                                                    { id: 'triangle', label: 'Üçgen', val: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
                                                    { id: 'diamond', label: 'Elmas', val: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
                                                    { id: 'hexagon', label: 'Altıgen', val: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
                                                    { id: 'octagon', label: 'Sekizgen', val: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' },

                                                    { id: 'star', label: 'Yıldız', val: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
                                                    { id: 'sparkle', label: 'Işıltı', val: 'polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)' },
                                                    { id: 'burst', label: 'Patlama', val: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }, // Octagon repeat? Let's do a 12-point burst if possible, but polygon is verbose.
                                                    // Revert burst to 'Message':
                                                    { id: 'message', label: 'Mesaj', val: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)' },
                                                ].map((shape) => (
                                                    <button
                                                        key={shape.id}
                                                        onClick={() => actions.updateActiveLayer({ mask: shape.val })}
                                                        title={shape.label}
                                                        className={cn(
                                                            "w-full aspect-square border-2 rounded-xl flex flex-col gap-1 items-center justify-center bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm",
                                                            shape.val === activeLayer.mask || (!shape.val && !activeLayer.mask) ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-transparent"
                                                        )}
                                                    >
                                                        <div
                                                            className={cn("w-8 h-8 bg-gray-600 dark:bg-white/80 transition-all", !shape.val && "rounded-sm")}
                                                            style={{ clipPath: shape.val }}
                                                        />
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{shape.label}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* BACKGROUND ACTIONS */}
                            {/* BACKGROUND ACTIONS */}
                            {state.activeMode === 'STAGING' && (activeLayer.type === 'image' || activeLayer.type === 'sticker') && (
                                <div className="space-y-6 border-t border-gray-100 dark:border-white/5 pt-6">
                                    {/* Magic Remove */}
                                    {/* Magic Remove */}
                                    <div className="space-y-1.5">
                                        <button
                                            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-xs shadow-xl shadow-indigo-500/30 hover:scale-105 transition-transform active:scale-95 group relative overflow-hidden"
                                            onClick={() => {
                                                // Mock AI Removal Effect for now
                                                // Ideally calls StudioAI.removeBackground(activeLayer.content)
                                                alert("Arka plan temizleme servisi bağlanıyor...");
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                            <Wand2 className="w-4 h-4" />
                                            Sahneyi Temizle (AI)
                                        </button>
                                        <p className="text-[10px] text-center text-gray-400 font-medium">✨ Moffi, nesneni öne çıkarır.</p>
                                    </div>

                                    {/* Fill Color */}
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Dolgu Rengi</label>
                                        <div className="flex flex-wrap gap-2">
                                            {/* Transparent / Reset */}
                                            <button
                                                onClick={() => actions.updateActiveLayer({ backgroundColor: undefined })}
                                                className={cn("w-7 h-7 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center bg-gray-50 dark:bg-white/5", !activeLayer.backgroundColor && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-black")}
                                                title="Şeffaf"
                                            >
                                                <div className="w-full h-px bg-red-400 rotate-45" />
                                            </button>

                                            {/* Colors */}
                                            {['#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#5AC8FA'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => actions.updateActiveLayer({ backgroundColor: c })}
                                                    className={cn(
                                                        "w-7 h-7 rounded-full border border-gray-200 dark:border-white/10 shadow-sm transition-transform hover:scale-110",
                                                        activeLayer.backgroundColor === c && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-black"
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>



                                    {/* PRO EFFECTS */}
                                    <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-4">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Atmosfer & Gölge</label>

                                        {/* SHADOW */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-500 w-16">Gölge</span>
                                                <div className="flex-1 flex gap-2">
                                                    <button
                                                        onClick={() => actions.updateActiveLayer({ shadowColor: undefined })}
                                                        className={cn("px-2 py-1 rounded text-[10px] font-bold border", !activeLayer.shadowColor ? "bg-black text-white dark:bg-white dark:text-black border-transparent" : "border-gray-200 dark:border-white/10")}
                                                    >
                                                        Kapalı
                                                    </button>
                                                    <button
                                                        onClick={() => actions.updateActiveLayer({ shadowColor: '#00000060', shadowBlur: 20, shadowOffsetY: 10 })}
                                                        className={cn("px-2 py-1 rounded text-[10px] font-bold border", activeLayer.shadowColor ? "bg-black text-white dark:bg-white dark:text-black border-transparent" : "border-gray-200 dark:border-white/10")}
                                                    >
                                                        Açık
                                                    </button>
                                                </div>
                                            </div>

                                            {activeLayer.shadowColor && (
                                                <div className="pl-16 space-y-2">
                                                    <input
                                                        type="range" min="0" max="50"
                                                        value={activeLayer.shadowBlur || 20}
                                                        onChange={(e) => actions.updateActiveLayer({ shadowBlur: parseInt(e.target.value) })}
                                                        className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-full appearance-none accent-black dark:accent-white"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* OUTLINE */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-500 w-16">Kontür</span>
                                                <div className="flex-1 flex gap-1">
                                                    {[0, 2, 4, 8].map(w => (
                                                        <button
                                                            key={w}
                                                            onClick={() => actions.updateActiveLayer({ outlineWidth: w, outlineColor: activeLayer.outlineColor || '#FFFFFF' })}
                                                            className={cn("h-6 flex-1 rounded text-[10px] font-bold border flex items-center justify-center transition-all", (activeLayer.outlineWidth === w || (!activeLayer.outlineWidth && w === 0)) ? "bg-blue-500 text-white border-blue-500" : "bg-transparent border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5")}
                                                        >
                                                            {w === 0 ? 'Yok' : w}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {(activeLayer.outlineWidth || 0) > 0 && (
                                                <div className="pl-16 flex flex-wrap gap-2">
                                                    {['#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#34C759', '#007AFF'].map(c => (
                                                        <button key={c} onClick={() => actions.updateActiveLayer({ outlineColor: c })} className={cn("w-5 h-5 rounded-full border border-gray-200 dark:border-white/10 shadow-sm", activeLayer.outlineColor === c && "ring-2 ring-blue-500")} style={{ background: c }} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TRANSFORM CONTROLS */}
                            {/* LAYOUT & ARRANGE */}
                            {state.activeMode === 'PLACEMENT' && (
                                <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-white/5">

                                    {/* Quick Actions */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={actions.duplicateActiveLayer} className="py-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 flex flex-col items-center justify-center gap-1 hover:bg-white dark:hover:bg-white/10 transition-colors group">
                                            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold text-gray-500">Çoğalt</span>
                                        </button>
                                        <button onClick={() => actions.updateActiveLayer({ isLocked: !activeLayer.isLocked })} className="py-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 flex flex-col items-center justify-center gap-1 hover:bg-white dark:hover:bg-white/10 transition-colors group">
                                            {activeLayer.isLocked ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform" />}
                                            <span className="text-[10px] font-bold text-gray-500">{activeLayer.isLocked ? 'Kilitli' : 'Kilitle'}</span>
                                        </button>
                                    </div>

                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Düzen</label>

                                    {/* Opacity */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Opaklık</span>
                                            <span>{Math.round(activeLayer.opacity)}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="100"
                                            value={activeLayer.opacity}
                                            onChange={(e) => actions.updateActiveLayer({ opacity: parseInt(e.target.value) })}
                                            className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-full appearance-none accent-black dark:accent-white"
                                        />
                                    </div>

                                    {/* Arrange & Flip */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <span className="text-[10px] text-gray-400 font-bold">Sıralama</span>
                                            <div className="flex gap-1">
                                                <button onClick={() => actions.reorderActiveLayer('backward')} className="flex-1 h-8 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 flex items-center justify-center"><ArrowDown className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" /></button>
                                                <button onClick={() => actions.reorderActiveLayer('forward')} className="flex-1 h-8 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 flex items-center justify-center"><ArrowUp className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" /></button>
                                                <button onClick={() => actions.reorderActiveLayer('back')} className="flex-1 h-8 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 flex items-center justify-center"><ChevronsDown className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" /></button>
                                                <button onClick={() => actions.reorderActiveLayer('front')} className="flex-1 h-8 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 flex items-center justify-center"><ChevronsUp className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] text-gray-400 font-bold">Çevir</span>
                                            <div className="flex gap-1">
                                                <button onClick={() => actions.updateActiveLayer({ flipX: !activeLayer.flipX })} className={cn("flex-1 h-8 rounded-lg border border-gray-100 dark:border-white/10 flex items-center justify-center transition-colors", activeLayer.flipX ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-gray-50 dark:bg-white/5 hover:bg-white")}>
                                                    <FlipHorizontal className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => actions.updateActiveLayer({ flipY: !activeLayer.flipY })} className={cn("flex-1 h-8 rounded-lg border border-gray-100 dark:border-white/10 flex items-center justify-center transition-colors", activeLayer.flipY ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-gray-50 dark:bg-white/5 hover:bg-white")}>
                                                    <FlipVertical className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* BLEND & FILTERS (Images/Stickers) */}
                                    {(activeLayer.type === 'image' || activeLayer.type === 'sticker') && (
                                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Efektler (Pro)</label>
                                                <span className="text-[10px] font-bold bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">MOFFI AI</span>
                                            </div>

                                            {/* Reflection Toggle */}
                                            <div className="flex items-center justify-between py-1">
                                                <div className="flex items-center gap-2">
                                                    <Waves className={cn("w-4 h-4 transition-colors", activeLayer.reflection ? "text-blue-500" : "text-gray-400")} />
                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Yansıma</span>
                                                </div>
                                                <button
                                                    onClick={() => actions.updateActiveLayer({ reflection: !activeLayer.reflection })}
                                                    className={cn("w-10 h-6 rounded-full relative transition-colors duration-300", activeLayer.reflection ? "bg-blue-500" : "bg-gray-200 dark:bg-white/10")}
                                                >
                                                    <div className={cn("absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300", activeLayer.reflection ? "translate-x-4" : "")} />
                                                </button>
                                            </div>

                                            {/* Blend Mode */}               <div className="space-y-2">
                                                <span className="text-xs text-gray-500 font-medium">Karışım Modu</span>
                                                <div className="relative">
                                                    <select
                                                        value={activeLayer.blendMode || 'normal'}
                                                        onChange={(e) => actions.updateActiveLayer({ blendMode: e.target.value as any })}
                                                        className="w-full h-10 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold px-3 appearance-none outline-none focus:border-blue-500 dark:text-white"
                                                    >
                                                        <option value="normal">Normal</option>
                                                        <option value="multiply">Multiply (Koyulaştır)</option>
                                                        <option value="screen">Screen (Açıklaştır)</option>
                                                        <option value="overlay">Overlay (Kaplama)</option>
                                                        <option value="soft-light">Soft Light (Yumuşak)</option>
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <ChevronDown className="w-3 h-3 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sliders */}
                                            <div className="space-y-3 pt-2">
                                                {[
                                                    { label: 'Parlaklık', key: 'filterBrightness', min: 0, max: 200, def: 100, icon: Sun },
                                                    { label: 'Kontrast', key: 'filterContrast', min: 0, max: 200, def: 100, icon: Contrast },
                                                    { label: 'Doygunluk', key: 'filterSaturation', min: 0, max: 200, def: 100, icon: Droplet }, // Changed icon to Droplet for Saturation
                                                    { label: 'Bulanıklık', key: 'filterBlur', min: 0, max: 20, def: 0, icon: CloudFog },
                                                ].map(f => (
                                                    <div key={f.key} className="flex items-center gap-3 group">
                                                        <div className="w-6 flex justify-center"><f.icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" /></div>
                                                        <input
                                                            type="range" min={f.min} max={f.max}
                                                            value={(activeLayer[f.key as keyof typeof activeLayer] as number) ?? f.def}
                                                            onChange={(e) => actions.updateActiveLayer({ [f.key]: parseInt(e.target.value) })}
                                                            className="flex-1 h-1 bg-gray-200 dark:bg-white/10 rounded-full appearance-none accent-black dark:accent-white"
                                                        />
                                                    </div>
                                                ))}

                                                {/* Grayscale & Hue */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] text-gray-400 font-bold block">Siyah/Beyaz</span>
                                                        <input
                                                            type="range" min="0" max="100"
                                                            value={activeLayer.filterGrayscale ?? 0}
                                                            onChange={(e) => actions.updateActiveLayer({ filterGrayscale: parseInt(e.target.value) })}
                                                            className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-full appearance-none accent-black dark:accent-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] text-gray-400 font-bold block">Renk Tonu</span>
                                                        <input
                                                            type="range" min="0" max="360"
                                                            value={activeLayer.filterHue ?? 0}
                                                            onChange={(e) => actions.updateActiveLayer({ filterHue: parseInt(e.target.value) })}
                                                            className="w-full h-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-full appearance-none thumb-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
}
