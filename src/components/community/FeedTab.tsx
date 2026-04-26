'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImmersivePostCard } from './ImmersivePostCard';
import { PostSkeleton, Skeleton } from '../common/Skeleton';
import Image from 'next/image';

interface FeedTabProps {
    user: any;
    posts: any[];
    storyGroups: any[];
    isLoading: boolean;
    onLike: (id: number) => void;
    onComment: (postId: number) => void;
    onShare: (post: any) => void;
    onStoryClick: (index: number) => void;
}

export function FeedTab({
    user,
    posts,
    storyGroups,
    isLoading,
    onLike,
    onComment,
    onShare,
    onStoryClick
}: FeedTabProps) {
    return (
        <motion.div
            key="feed"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
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
            className="h-full w-full overflow-y-scroll no-scrollbar pb-32 flex flex-col gap-4"
        >
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
            ) : (
                posts.map((post) => (
                    <div key={post.id} className="w-full relative flex flex-col items-center justify-center py-2">
                        <ImmersivePostCard
                            post={post}
                            currentUser={user}
                            onLike={() => onLike(post.id)}
                            onAddComment={() => onComment(post.id)}
                            onShare={() => onShare(post)}
                        />
                    </div>
                ))
            )}
        </motion.div>
    );
}
