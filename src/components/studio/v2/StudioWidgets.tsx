"use client";

import React, { useState, useMemo } from 'react';
import { Sticker, Type, Image as ImageIcon, Sparkles, X, Search, ChevronRight, Hash, Smile, Box, Leaf, Coffee } from 'lucide-react';
import { useStudio } from './StudioEngine';
import { STUDIO_ASSETS, STUDIO_FONTS, AI_STYLES } from './StudioAssets';
import { StudioAI } from '@/services/studio/AIService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const WIDGETS = [
    { id: 'stickers', icon: Sticker, label: 'Sticker', color: 'from-pink-500 to-rose-500' },
    { id: 'text', icon: Type, label: 'Metin', color: 'from-blue-500 to-cyan-500' },
    { id: 'upload', icon: ImageIcon, label: 'Galeri', color: 'from-emerald-500 to-teal-500' },
];

// --- STICKER DATA ---
const STICKER_LIBRARY = [
    {
        id: 'moffi', label: 'Moffi', icon: Sparkles, type: 'sticker', items: [
            '/stickers/moffi/uploaded_image_0_1765807376597.png',
            '/stickers/moffi/uploaded_image_1_1765807376597.png',
            '/stickers/moffi/uploaded_image_2_1765807376597.png',
            '/stickers/moffi/uploaded_image_3_1765807376597.png',
            '/stickers/moffi/uploaded_image_4_1765807376597.jpg'
        ]
    },
    {
        id: 'emoji', label: 'Emoji', icon: Smile, type: 'text', items: [
            // Emotions
            '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️',
            // Animals
            '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔', '🐾', '🐉', '🐲',
            // Nature
            '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎', '🌍', '🌏', '🪐', '💫', '⭐️', '🌟', '✨', '⚡️', '🔥', '💥', '☄️', '☀️', '🌤', '⛅️', '🌥', '☁️', '🌦', '🌧', '⛈', '🌩', '🌨', '❄️', '☃️', '⛄️', '🌬', '💨', '🌪', '🌫', '🌈', '☔️', '☂️', '🌊',
            // Food
            '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕️', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽', '🥣', '🥡', '🥢', '🧂'
        ]
    },
    {
        id: '3d', label: '3D', icon: Box, type: 'sticker', items: [
            'https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=200&q=80',
            'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=200&q=80',
            'https://images.unsplash.com/photo-1614850523054-d0c2c31c1816?w=200&q=80',
            'https://images.unsplash.com/photo-1614851099511-e730129add68?w=200&q=80',
            'https://plus.unsplash.com/premium_photo-1675802521927-44026338b584?w=200&q=80',
            'https://plus.unsplash.com/premium_photo-1675802521591-24b51829286d?w=200&q=80',
            'https://plus.unsplash.com/premium_photo-1673812735749-d3de76d85942?w=200&q=80',
            'https://images.unsplash.com/photo-1628155930542-46a50415893d?w=200&q=80',
            'https://images.unsplash.com/photo-1614131238686-267924c55976?w=200&q=80',
            'https://images.unsplash.com/photo-1614131237736-6701d017a6a4?w=200&q=80'
        ]
    },
    {
        id: 'nature', label: 'Doğa', icon: Leaf, type: 'image', items: [
            'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=200&q=80',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&q=80',
            'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=200&q=80',
            'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=200&q=80',
            'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=200&q=80',
            'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=200&q=80',
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&q=80'
        ]
    },
    {
        id: 'retro', label: 'Retro', icon: Coffee, type: 'image', items: [
            'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=200&q=80',
            'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=200&q=80',
            'https://images.unsplash.com/photo-1505672675380-ea1fa667535b?w=200&q=80',
            'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=200&q=80',
            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&q=80'
        ]
    }
];

export function StudioWidgets() {
    const { actions } = useStudio();
    const [activeWidget, setActiveWidget] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [stickerCategory, setStickerCategory] = useState('moffi');
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Filter Assets (Merged Active Category + Search)
    const displayedStickers = useMemo(() => {
        if (searchQuery.length > 0) {
            // Search all
            // Simple match for URLs is hard, so we just return emojis + all images
            // In a real app we'd have tags.
            // For now, if search, show unfiltered emojis that match? No, impossible without names.
            // Mock Search: Return random mix
            return STICKER_LIBRARY.flatMap(c => c.items).filter(x => true).slice(0, 50);
        }
        return STICKER_LIBRARY.find(c => c.id === stickerCategory)?.items || [];
    }, [searchQuery, stickerCategory]);

    const activeCatType = STICKER_LIBRARY.find(c => c.id === stickerCategory)?.type || 'text';

    // --- AI HANDLER ---
    const handleAIGenerate = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        try {
            const result = await StudioAI.generateSticker(aiPrompt);
            actions.addLayer('sticker', result.url);
            setActiveWidget(null); // Close on success
            setAiPrompt('');
        } catch (e) {
            console.error("AI Gen Failed", e);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- CONTENT RENDERERS ---
    const renderContent = () => {
        switch (activeWidget) {


            case 'stickers':
                return (
                    <div className="p-0 h-full flex flex-col pt-6">
                        <div className="px-6 mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Sticker Kütüphanesi</h3>
                            <div className="bg-gray-100 dark:bg-white/5 h-10 rounded-xl flex items-center px-3 mb-4 border border-transparent focus-within:border-blue-500 transition-colors">
                                <Search className="w-4 h-4 text-gray-400 mr-2" />
                                <input
                                    className="bg-transparent flex-1 outline-none text-xs font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
                                    placeholder="Sticker ara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* CATEGORY TABS */}
                        {!searchQuery && (
                            <div className="flex gap-2 overflow-x-auto px-6 pb-2 scrollbar-hide mb-2">
                                {STICKER_LIBRARY.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setStickerCategory(cat.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors",
                                            stickerCategory === cat.id
                                                ? "bg-gray-900 text-white dark:bg-white dark:text-black"
                                                : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400 hover:bg-gray-200"
                                        )}
                                    >
                                        <cat.icon className="w-3 h-3" />
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* GRID */}
                        <div className="flex-1 overflow-y-auto px-6 pb-20 scrollbar-hide">
                            <div className="grid grid-cols-4 gap-3">
                                {displayedStickers.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (activeCatType === 'text') {
                                                actions.addLayer('text', item, { fontSize: 100 });
                                            } else {
                                                actions.addLayer('sticker', item);
                                            }
                                            // Optional: Close on select? Maybe keep open for multi-select.
                                            // setActiveWidget(null);
                                        }}
                                        className="aspect-square bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-white/10 hover:shadow-md transition-all border border-transparent hover:border-gray-100 dark:hover:border-white/10 text-2xl active:scale-90"
                                    >
                                        {activeCatType === 'text' ? (
                                            <span>{item}</span>
                                        ) : (
                                            <img src={item} className="w-full h-full object-contain rounded-lg" loading="lazy" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Empty State */}
                            {displayedStickers.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Search className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <p className="text-xs">Sonuç bulunamadı</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'text':
                return (
                    <div className="p-6 h-full flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Metin Stilleri</h3>
                        <div className="space-y-3 overflow-y-auto pb-10">
                            {STUDIO_FONTS.map(font => (
                                <button
                                    key={font.name}
                                    onClick={() => {
                                        actions.addLayer('text', 'Metin', { fontFamily: font.family });
                                        setActiveWidget(null);
                                    }}
                                    className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 hover:border-blue-500 transition-colors text-left group"
                                >
                                    <span style={{ fontFamily: font.family }} className="text-xl text-gray-800 dark:text-white block mb-1 group-hover:scale-105 transition-transform origin-left">{font.name}</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">{font.category}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'upload':
                return (
                    <div className="p-6 h-full flex flex-col justify-center items-center text-center">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                            <ImageIcon className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fotoğraf Yükle</h3>
                        <p className="text-sm text-gray-500 mb-8">Cihazınızdan dilediğiniz bir görseli veya logoyu ekleyin.</p>

                        <label className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold text-sm cursor-pointer hover:scale-105 transition-transform flex items-center gap-2 shadow-xl">
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            if (ev.target?.result) {
                                                actions.addLayer('image', ev.target.result as string);
                                                setActiveWidget(null);
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                            Görsel Seç
                        </label>
                    </div>
                );
        }
    };

    return (
        <>
            {/* FLOATING DOCK (Left Center) */}
            <motion.div
                initial={{ x: -100 }} animate={{ x: 0 }}
                className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4"
            >
                <div className="bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-xl p-3 rounded-[2rem] shadow-2xl border border-white/20 flex flex-col gap-4">
                    {WIDGETS.map((widget) => (
                        <button
                            key={widget.id}
                            onClick={() => setActiveWidget(activeWidget === widget.id ? null : widget.id)}
                            className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative group",
                                activeWidget === widget.id
                                    ? `bg-gradient-to-br ${widget.color} text-white shadow-lg scale-110`
                                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
                            )}
                        >
                            <widget.icon className="w-6 h-6" />

                            {/* Tooltip */}
                            <span className="absolute left-full ml-4 px-3 py-1.5 bg-black/80 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap backdrop-blur-md">
                                {widget.label}
                            </span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* EXPANDABLE DRAWER (Widget Content) */}
            <AnimatePresence>
                {activeWidget && (
                    <motion.div
                        initial={{ x: -400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -400, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed left-24 top-24 bottom-24 w-[320px] bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] shadow-2xl z-40 overflow-hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setActiveWidget(null)}
                            className="absolute top-6 right-6 w-8 h-8 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center hover:bg-gray-200 transition z-50"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>

                        {/* Content Area */}
                        {renderContent()}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
