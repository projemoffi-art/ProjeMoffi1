'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Sparkles, Filter, ChevronRight, PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImmersivePostCard } from './ImmersivePostCard';
import { PostSkeleton, Skeleton } from '../common/Skeleton';
import Image from 'next/image';
import { apiService } from '@/services/apiService';

interface FeedTabProps {
    user: any;
    posts: any[];
    storyGroups: any[];
    isLoading: boolean;
    onLike: (id: number) => void;
    onComment: (postId: number) => void;
    onShare: (post: any) => void;
    onStoryClick: (index: number) => void;
    onCategoryChange?: (category: string) => void;
}

const CATEGORIES = [
    { id: 'all', label: 'Tümü', icon: '🐾' },
    { id: 'vet', label: 'Veteriner', icon: '🩺' },
    { id: 'training', label: 'Eğitim', icon: '🎓' },
    { id: 'food', label: 'Beslenme', icon: '🦴' },
    { id: 'funny', label: 'Eğlence', icon: '😂' },
    { id: 'adoption', label: 'Sahiplenme', icon: '🏠' },
];

export function FeedTab({
    user,
    posts,
    storyGroups,
    isLoading,
    onLike,
    onComment,
    onShare,
    onStoryClick,
    onCategoryChange
}: FeedTabProps) {
    const [activeCategory, setActiveCategory] = React.useState('all');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isSearchFocused, setIsSearchFocused] = React.useState(false);
    return (
        <motion.div
            key="feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onScroll={(e) => {
                const target = e.currentTarget;
                const current = target.scrollTop;
                const last = (target as any)._lastScrollY || 0;
                
                if (current > last && current > 100) {
                    window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: false }));
                } else if (current < last - 5 || current < 50) {
                    window.dispatchEvent(new CustomEvent('moffi-toggle-nav', { detail: true }));
                }
                (target as any)._lastScrollY = current;
            }}
            className="h-full w-full overflow-y-scroll no-scrollbar pb-32 flex flex-col gap-0"
        >
            {/* SEARCH & EXPLORE HEADER */}
            <div className="px-6 pt-6 pb-2 space-y-6 sticky top-0 z-[100] bg-gradient-to-b from-[#05050A] via-[#05050A]/90 to-transparent backdrop-blur-sm">
                <div className="relative group">
                    <motion.div 
                        animate={{ 
                            scale: isSearchFocused ? 1.02 : 1,
                            borderColor: isSearchFocused ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.05)'
                        }}
                        className="relative h-14 bg-white/[0.03] border rounded-2xl flex items-center px-5 transition-all duration-300"
                    >
                        <Search className={cn("w-5 h-5 transition-colors duration-300", isSearchFocused ? "text-cyan-400" : "text-gray-600")} />
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            placeholder="Moffi'de Keşfet..."
                            className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-white placeholder-gray-600 font-medium"
                        />
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-px bg-white/10 mx-2" />
                            <Sparkles className="w-4 h-4 text-purple-400 opacity-50" />
                        </div>
                    </motion.div>
                </div>

                {/* CATEGORY PILLS */}
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setActiveCategory(cat.id);
                                onCategoryChange?.(cat.id);
                            }}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap text-[11px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95",
                                activeCategory === cat.id 
                                    ? "bg-white text-black shadow-[0_10px_20px_rgba(255,255,255,0.1)]" 
                                    : "bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10"
                            )}
                        >
                            <span>{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>
            {/* STORIES BAR */}
            <div className="w-full flex gap-4 px-4 py-4 overflow-x-auto no-scrollbar shrink-0">
                <div className="flex flex-col items-center gap-1.5 shrink-0 px-1">
                    <div className="w-16 h-16 rounded-full p-[2px] bg-white/10 flex items-center justify-center cursor-pointer border-2 border-dashed border-white/20">
                        <Plus className="w-6 h-6 text-white/50" />
                    </div>
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Sen</span>
                </div>
                {storyGroups.map((group, index) => (
                    <div key={index} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer" onClick={() => onStoryClick(index)}>
                        <div className={cn("w-16 h-16 rounded-full p-[2.5px] shrink-0", group.hasUnseen ? "bg-gradient-to-tr from-cyan-400 to-purple-600" : "bg-white/10")}>
                            <div className="w-full h-full bg-[#0A0A0E] rounded-full border-2 border-[#0A0A0E] overflow-hidden relative">
                                <Image src={group.author_avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300"} fill className="object-cover" alt={group.author_name} />
                            </div>
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold truncate w-16 text-center">{group.author_name}</span>
                    </div>
                ))}
            </div>

            {/* FEED */}
            {isLoading ? (
                <div className="space-y-4 px-4 mt-4">
                    <PostSkeleton />
                    <PostSkeleton />
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-10 text-center opacity-40">
                    <PawPrint className="w-12 h-12 mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">Henüz buralar çok ıssız... 🐾</p>
                    <p className="text-[10px] mt-2 font-medium">İlk gönderiyi sen paylaşarak buraları canlandır!</p>
                </div>
            ) : (
                posts.map((post) => (
                    <div key={post.id} className="w-full relative flex flex-col items-center justify-center py-2">
                        <ImmersivePostCard
                            post={post}
                            currentUser={user}
                            onLike={() => onLike(post.id)}
                            onAddComment={() => onComment(post.id)}
                            onShare={() => onShare(post)}
                            onEditComment={async (cid, text) => {
                                try {
                                    await apiService.editComment(cid, text);
                                } catch (err) {
                                    console.error("Yorum düzenleme hatası:", err);
                                }
                            }}
                            onDeleteComment={async (cid) => {
                                try {
                                    await apiService.deleteComment(cid);
                                } catch (err) {
                                    console.error("Yorum silme hatası:", err);
                                }
                            }}
                            onToggleCommentLike={async (cid) => {
                                try {
                                    await apiService.toggleCommentLike(cid);
                                } catch (err) {
                                    console.error("Yorum beğeni hatası:", err);
                                }
                            }}
                            onReportComment={(cid) => {
                                alert("Yorum inceleme ekibimize raporlandı! 🛡️");
                            }}
                        />
                    </div>
                ))
            )}
        </motion.div>
    );
}
