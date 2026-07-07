import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Image as ImageIcon, Heart, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExploreGridProps {
    posts: any[];
    onPostClick: (post: any) => void;
    isLoading?: boolean;
}

export function ExploreGrid({ posts, onPostClick, isLoading }: ExploreGridProps) {
    const [previewPost, setPreviewPost] = useState<any>(null);
    const holdTimer = useRef<any>(null);
    const hasHeld = useRef(false);
    const lastHoldEnd = useRef<number>(0);

    const handleStartHold = (post: any) => {
        hasHeld.current = false;
        holdTimer.current = setTimeout(() => {
            setPreviewPost(post);
            hasHeld.current = true;
            if (window.navigator.vibrate) window.navigator.vibrate(50);
        }, 300); // 300ms hold for Peek
    };

    const handleEndHold = () => {
        if (holdTimer.current) {
            clearTimeout(holdTimer.current);
            holdTimer.current = null;
        }
    };

    // Close preview on mouse up anywhere
    useEffect(() => {
        const handleGlobalUp = () => {
            if (hasHeld.current) {
                lastHoldEnd.current = Date.now();
            }
            setPreviewPost(null);
            handleEndHold();
            setTimeout(() => {
                hasHeld.current = false;
            }, 400);
        };
        window.addEventListener('mouseup', handleGlobalUp);
        window.addEventListener('touchend', handleGlobalUp);
        return () => {
            window.removeEventListener('mouseup', handleGlobalUp);
            window.removeEventListener('touchend', handleGlobalUp);
        };
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-3 gap-0.5 px-0.5 w-full">
                {Array(12).fill(0).map((_, i) => (
                    <div 
                        key={i} 
                        className="aspect-square bg-white/5 animate-pulse relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="grid grid-cols-3 gap-0.5 px-0.5 w-full pb-32">
                {posts.map((post, index) => {
                    const isVideo = post.media_url?.includes('.mp4') || post.media_url?.includes('.mov') || post.media_url?.includes('.webm');
                    
                    return (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.01 }}
                            onMouseDown={() => handleStartHold(post)}
                            onTouchStart={() => handleStartHold(post)}
                            onClick={(e) => {
                                const timeSinceHold = Date.now() - lastHoldEnd.current;
                                if (hasHeld.current || timeSinceHold < 400) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    hasHeld.current = false;
                                } else {
                                    onPostClick(post);
                                }
                            }}
                            className="relative aspect-square cursor-pointer group overflow-hidden bg-zinc-900"
                        >
                            {/* Media Preview */}
                            <img 
                                src={post.image || post.media_url} 
                                alt={post.desc}
                                onError={(e) => {
                                    e.currentTarget.src = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800";
                                }}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />

                            {/* Overlays */}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />
                            
                            {/* Icons (Video/Multiple) */}
                            <div className="absolute top-2 right-2 flex gap-1">
                                {isVideo && (
                                    <div className="p-1 bg-black/40 backdrop-blur-md rounded-md border border-card-border">
                                        <Play className="w-2.5 h-2.5 text-white fill-white" />
                                    </div>
                                )}
                            </div>

                            {/* Hover Stats (Instagram Style) */}
                            <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-1.5">
                                    <Heart className="w-3.5 h-3.5 text-white fill-white" />
                                    <span className="text-white text-xs font-black">{post.likes || 0}</span>
                                </div>
                            </div>

                            {/* Subtle Shimmer */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                        </motion.div>
                    );
                })}
            </div>

            {/* APPLE STYLE PEEK OVERLAY */}
            <AnimatePresence>
                {previewPost && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-sm aspect-[4/5] bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-card-border"
                        >
                            {/* Header Info */}
                            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 border border-card-border overflow-hidden">
                                    <img src={previewPost.avatar} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{previewPost.author}</span>
                                    <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest">{previewPost.time}</span>
                                </div>
                            </div>

                            {/* Main Content */}
                            <img 
                                src={previewPost.image || previewPost.media_url} 
                                className="w-full h-full object-cover"
                                alt=""
                            />

                            {/* Footer Quick Info */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-white fill-white" />
                                        <span className="text-xs font-black text-white">{previewPost.likes || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MessageCircle className="w-4 h-4 text-white" />
                                        <span className="text-xs font-black text-white">{previewPost.comments || 0}</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-white/80 mt-3 line-clamp-2 leading-relaxed italic">
                                    {previewPost.desc}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
