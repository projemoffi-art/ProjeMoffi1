'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X
} from 'lucide-react';
import { ImmersivePostCard } from '../community/ImmersivePostCard';
import { useAuth } from '@/context/AuthContext';

interface PostViewerOverlayProps {
    posts: any[];
    initialIndex: number;
    onClose: () => void;
}

export function PostViewerOverlay({ posts, initialIndex, onClose }: PostViewerOverlayProps) {
    const { user: currentUser } = useAuth();
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Handle Browser Back Button to close overlay
    useEffect(() => {
        window.history.pushState({ overlayOpen: true }, '');
        
        const handlePopState = () => {
            onClose();
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [onClose]);

    // Initial Scroll to target post
    useEffect(() => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const targetScrollTop = initialIndex * container.clientHeight;
            container.scrollTo({ top: targetScrollTop, behavior: 'auto' });
        }
    }, [initialIndex]);

    if (!posts || posts.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="fixed inset-0 z-[2000] bg-black flex flex-col"
            >
                {/* Immersive Header - Ultra Minimal */}
                <div className="absolute top-0 inset-x-0 z-[2100] p-6 flex items-center justify-between pointer-events-none">
                    <div className="flex flex-col">
                         <span className="text-white font-black text-[10px] uppercase tracking-[0.3em] drop-shadow-md">Kullanıcı Gönderileri</span>
                         <div className="h-0.5 w-8 bg-cyan-500 rounded-full mt-1 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all backdrop-blur-xl border border-white/10 active:scale-90 pointer-events-auto shadow-2xl"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* SCROLLABLE FEED CONTAINER */}
                <div 
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-scroll no-scrollbar snap-y snap-mandatory scroll-smooth bg-black"
                >
                    {posts.map((post, index) => (
                        <div 
                            key={post.id} 
                            className="w-full h-full snap-start snap-always flex items-center justify-center relative overflow-hidden"
                            style={{ height: '100dvh' }}
                        >
                            {/* We use the SAME component as the Explore Feed for perfect consistency */}
                            <ImmersivePostCard 
                                post={post}
                                currentUser={currentUser}
                                onLike={() => console.log('Liked', post.id)}
                                onAddComment={() => console.log('Comment on', post.id)}
                                onShare={() => console.log('Sharing', post)}
                            />
                            
                            {/* Index Indicator */}
                            <div className="absolute bottom-10 left-6 z-[2100] pointer-events-none opacity-40">
                                <span className="text-white font-black text-[12px] tracking-widest uppercase">
                                    {index + 1} / {posts.length}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
