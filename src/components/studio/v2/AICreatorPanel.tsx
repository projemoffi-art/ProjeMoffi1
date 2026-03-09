"use client";

import React, { useState } from 'react';
import { Sparkles, Wand2, X, Image as ImageIcon, Search } from 'lucide-react';
import { useStudio } from './StudioEngine';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Mock AI Scenes
const SCENES = [
    { id: 'cozy', label: 'Cozy Home', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&q=80' },
    { id: 'studio', label: 'Pro Studio', img: 'https://images.unsplash.com/photo-1542382218-c2b3221b764b?w=300&q=80' },
    { id: 'nature', label: 'Doğa', img: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300&q=80' },
    { id: 'cyber', label: 'Cyberpunk', img: 'https://images.unsplash.com/photo-1515630278258-407f66498911?w=300&q=80' },
];

export function AICreatorPanel() {
    const { state, actions, dispatch } = useStudio();
    const [prompt, setPrompt] = useState('');
    const [selectedScene, setSelectedScene] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Only visible in CREATION mode
    if (state.activeMode !== 'CREATION') return null;

    const handleClose = () => {
        dispatch({ type: 'SET_MODE', payload: 'PLACEMENT' });
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            // Mock Success
            alert(`Moffi AI: "${prompt || selectedScene}" sahnesi oluşturuldu! (Mock)`);

            // Add a mock image layer
            const resultImg = SCENES.find(s => s.id === selectedScene)?.img || 'https://source.unsplash.com/random/800x800';
            actions.addLayer('image', resultImg, { scale: 0.8 });

            // Switch back to Placement or Staging to edit it
            dispatch({ type: 'SET_MODE', payload: 'PLACEMENT' });
        }, 2000);
    };

    return (
        <AnimatePresence>
            <motion.aside
                initial={{ x: 350, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 350, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-6 top-24 bottom-24 w-[350px] bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] shadow-2xl z-50 flex flex-col overflow-hidden"
            >
                {/* HEADER */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-violet-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                        </span>
                        <div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white block">AI Sahne Oluşturucu</span>
                            <span className="text-[10px] text-violet-500 font-medium">Moffi Intelligence</span>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 transition"
                    >
                        <X className="w-4 h-4 text-gray-500 dark:text-white" />
                    </button>
                </div>

                {/* SCROLL AREA */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* SCENE SELECTION */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Sahne Seçimi</label>
                        <div className="grid grid-cols-2 gap-3">
                            {SCENES.map(scene => (
                                <button
                                    key={scene.id}
                                    onClick={() => setSelectedScene(scene.id)}
                                    className={cn(
                                        "relative group overflow-hidden rounded-xl border-2 transition-all aspect-[4/3]",
                                        selectedScene === scene.id ? "border-violet-500 ring-2 ring-violet-500/20" : "border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                    )}
                                >
                                    <img src={scene.img} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                                        <span className={cn("text-xs font-bold text-white transition-colors", selectedScene === scene.id ? "text-violet-200" : "")}>{scene.label}</span>
                                    </div>
                                    {selectedScene === scene.id && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center shadow-lg">
                                            <Sparkles className="w-2 h-2 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PROMPT INPUT */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Detaylar (Prompt)</label>
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Örn: Karlı bir kış günü, şömine başında..."
                                className="w-full h-24 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm font-medium focus:ring-2 ring-violet-500 outline-none resize-none dark:text-white placeholder:text-gray-400"
                            />
                            <div className="absolute bottom-2 right-2 flex gap-1">
                                <button className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition" title="Rastgele">
                                    <Wand2 className="w-3 h-3 text-violet-500" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* GENERATE BUTTON */}
                    <button
                        onClick={handleGenerate}
                        disabled={!selectedScene && !prompt || isGenerating}
                        className="w-full py-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-[length:200%_auto] hover:bg-[100%_0] transition-all duration-500 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-sm shadow-xl shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                        {isGenerating ? (
                            <>
                                <Wand2 className="w-4 h-4 animate-spin-reverse" />
                                Sihir Yapılıyor...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 group-hover:scale-125 transition-transform" />
                                Sahneyi Oluştur
                            </>
                        )}
                    </button>

                    {/* TIPS */}
                    <div className="bg-violet-50 dark:bg-violet-900/10 rounded-xl p-4 flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/20 flex-shrink-0 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-1">Moffi İpucu</h4>
                            <p className="text-[10px] text-violet-600/80 dark:text-violet-400/80 leading-relaxed">
                                Fotoğrafını sahneye koymak için önce bir sahne oluştur, sonra "Yerleştir" modunda fotoğrafını ekle.
                            </p>
                        </div>
                    </div>

                </div>
            </motion.aside>
        </AnimatePresence>
    );
}
