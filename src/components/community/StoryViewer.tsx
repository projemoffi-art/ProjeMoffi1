'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface StoryViewerProps {
    groupIndex: number | null;
    storyIndex: number;
    storyGroups: any[];
    progress: number;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    formatTimeAgo: (date?: string) => string;
}

export function StoryViewer({
    groupIndex,
    storyIndex,
    storyGroups,
    progress,
    onClose,
    onNext,
    onPrev,
    formatTimeAgo
}: StoryViewerProps) {
    if (groupIndex === null) return null;

    const group = storyGroups[groupIndex];
    if (!group) return null;
    
    const story = group.stories[storyIndex];
    if (!story) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-[1000] bg-black flex items-center justify-center"
            >
                <div className="relative w-full h-full max-w-lg overflow-hidden md:rounded-3xl">
                    {/* Media Content */}
                    <img src={story.url} className="w-full h-full object-cover" />

                    {/* Left/Right Click Areas for Navigation */}
                    <div className="absolute inset-0 flex">
                        <div className="w-1/3 h-full" onClick={onPrev} />
                        <div className="w-2/3 h-full" onClick={onNext} />
                    </div>

                    {/* Progress Bars */}
                    <div className="absolute top-4 inset-x-4 flex gap-1 z-20">
                        {group.stories.map((_: any, idx: number) => (
                            <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ 
                                        width: idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%' 
                                    }}
                                    transition={{ 
                                        duration: idx === storyIndex ? 5 : 0, 
                                        ease: "linear" 
                                    }}
                                    className="h-full bg-white"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Header Info */}
                    <div className="absolute top-8 inset-x-4 flex items-center justify-between z-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border-2 border-white p-0.5">
                                <img src={group.avatar} className="w-full h-full rounded-full object-cover" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm drop-shadow-md">{group.user}</h4>
                                <p className="text-white/60 text-[10px] font-medium">{formatTimeAgo(story.time)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="text-white"><MoreHorizontal className="w-6 h-6" /></button>
                            <button onClick={onClose} className="text-white"><X className="w-7 h-7" /></button>
                        </div>
                    </div>

                    {/* Reply Bar */}
                    <div className="absolute bottom-10 inset-x-6 flex items-center gap-4 z-20">
                        <div className="flex-1 bg-transparent border border-white/50 rounded-full px-5 py-3 backdrop-blur-md">
                            <input
                                type="text"
                                placeholder="Mesaj gönder..."
                                className="bg-transparent border-none outline-none w-full text-white placeholder:text-white/70 text-sm"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <button className="text-white">
                            <ChevronRight className="w-8 h-8" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
