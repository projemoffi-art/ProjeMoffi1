'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, X, ShieldAlert, PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImmersivePostCard } from './ImmersivePostCard';
import { ExploreGrid } from './ExploreGrid';

interface FeedTabProps {
    user: any;
    activePet: any;
    isSosAlertDismissed: boolean;
    setIsSosAlertDismissed: (val: boolean) => void;
    setSosActivePet: (pet: any) => void;
    setIsSOSCommandCenterOpen: (val: boolean) => void;
    
    posts: any[];
    storyGroups: any[];
    isLoading: boolean;
    viewMode: 'list' | 'grid';
    
    // Callbacks
    onLike: (id: any) => void;
    onShare: (post: any) => void;
    onAddComment: (postId: any, text: string) => void;
    onToggleCommentLike: (postId: any, commentId: number) => void;
    onReplyComment: (postId: any, commentId: number, text: string) => void;
    onDeleteComment: (postId: any, commentId: number) => void;
    onEditComment: (postId: any, commentId: number, text: string) => void;
    onReportComment: (postId: any, commentId: number) => void;
    onDeletePost: (postId: any) => void;
    onEditPost: (post: any) => void;
    
    onStoryClick: (index: number) => void;
    onAddStoryClick: () => void;
    onPostClickFromGrid: (post: any) => void;
    isCommentsDisabled?: boolean;
}

export function FeedTab({
    user,
    activePet,
    isSosAlertDismissed,
    setIsSosAlertDismissed,
    setSosActivePet,
    setIsSOSCommandCenterOpen,
    
    posts,
    storyGroups,
    isLoading,
    viewMode,
    
    onLike,
    onShare,
    onAddComment,
    onToggleCommentLike,
    onReplyComment,
    onDeleteComment,
    onEditComment,
    onReportComment,
    onDeletePost,
    onEditPost,
    
    onStoryClick,
    onAddStoryClick,
    onPostClickFromGrid,
    isCommentsDisabled = false
}: FeedTabProps) {
    return (
        <motion.div
            key="feed"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.3 }}
            className="w-full pb-32 flex flex-col gap-4"
        >
            {/* STORIES BAR */}
            <div className="w-full flex gap-4 px-4 py-4 overflow-x-auto no-scrollbar snap-start shrink-0">
                {/* Current User Add Story */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 group">
                    <div 
                        onClick={onAddStoryClick}
                        className="relative w-16 h-16 flex items-center justify-center cursor-pointer"
                    >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 border-2 border-dashed border-white/20 group-hover:border-cyan-400/50 group-hover:bg-white/5 transition-all duration-500" />
                        
                        <div className="relative z-10 w-12 h-12 rounded-full bg-[var(--card-bg)] backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-110 group-active:scale-95 transition-all duration-300">
                            <div className="absolute inset-0 bg-cyan-400/5 blur-md group-hover:bg-cyan-400/20 transition-all" />
                            <Plus className="w-6 h-6 text-[var(--foreground)] group-hover:text-cyan-400" strokeWidth={2.5} />
                        </div>
                    </div>
                    <span className="text-[9px] text-[var(--secondary-text)] font-black uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">Hikaye</span>
                </div>

                {/* Real Database Stories */}
                {storyGroups.map((group, index) => (
                    <div 
                        key={group.user_id} 
                        className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" 
                        onClick={() => onStoryClick(index)}
                    >
                        <div className={cn(
                            "w-16 h-16 rounded-full p-[2.5px] transition-transform group-hover:scale-105",
                            group.hasUnseen ? "bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600" : "bg-white/10"
                        )}>
                            <div className="w-full h-full bg-[var(--background)] rounded-full border-2 border-[var(--background)] overflow-hidden relative">
                                <img 
                                    src={(group.user_id === user?.id ? (user?.avatar || group.author_avatar) : group.author_avatar) || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"} 
                                    className="w-full h-full object-cover transition-opacity duration-500"
                                    onLoad={(e) => (e.target as HTMLImageElement).style.opacity = '1'}
                                    style={{ opacity: 0 }}
                                    alt={group.author_name}
                                />
                            </div>
                        </div>
                        <span className={cn("text-[10px] tracking-wide", group.hasUnseen ? "font-bold text-[var(--foreground)]" : "font-medium text-[var(--secondary-text)] truncate w-16 text-center")}>
                            {user?.id === group.user_id ? "Sen" : group.author_name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Feed SOS Alerts */}
            {activePet?.is_lost && !isSosAlertDismissed && activePet.sos_settings?.auto_post_sos !== false && (
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="px-4 -mt-2 mb-4 snap-start animate-in fade-in duration-300"
                >
                    <div className="bg-red-500/[0.04] dark:bg-red-950/20 border border-red-500/20 rounded-2xl p-2.5 px-3 backdrop-blur-xl relative overflow-hidden group shadow-lg shadow-red-950/10">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
                        <div className="absolute -inset-10 bg-red-500/5 blur-2xl rounded-full pointer-events-none" />
                        
                        <div className="flex items-center justify-between relative z-10 gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="relative shrink-0">
                                    <div className="w-8 h-8 rounded-full border border-red-500/30 p-[1.5px] bg-red-500/10 flex items-center justify-center overflow-hidden">
                                        {activePet.avatar ? (
                                            <img 
                                                src={activePet.avatar} 
                                                alt={activePet.name} 
                                                className="w-full h-full object-cover rounded-full" 
                                            />
                                        ) : (
                                            <ShieldAlert className="w-4 h-4 text-red-400" />
                                        )}
                                    </div>
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 border border-[var(--background)] rounded-full" />
                                </div>
                                
                                <div className="flex flex-col text-left">
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="text-[11px] font-black text-white uppercase tracking-wide leading-none">
                                            {activePet.name}
                                        </h3>
                                        <span className="text-[7.5px] font-black text-red-500 dark:text-red-400 bg-red-500/15 border border-red-500/25 px-1 py-[1.5px] rounded uppercase tracking-wider leading-none">
                                            KAYIP
                                        </span>
                                    </div>
                                    <p className="text-[8.5px] font-bold text-red-200/50 uppercase tracking-wider mt-1 leading-none">
                                        Arama Kurtarma Sinyali Aktif
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                                <button 
                                    onClick={() => {
                                        setSosActivePet(activePet);
                                        setIsSOSCommandCenterOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all duration-200 shadow-md shadow-red-500/20 cursor-pointer"
                                >
                                    YÖNET
                                </button>
                                <button 
                                    onClick={() => setIsSosAlertDismissed(true)}
                                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-white/30 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                                    title="Alarm Kartını Kapat (Kayıp modu aktif kalır)"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                    <div key={i} className="w-full relative flex flex-col items-center justify-center px-4 shrink-0" style={{ height: "calc(100vh - 180px)" }}>
                        <div className="relative w-full h-full max-w-lg mx-auto rounded-[3rem] overflow-hidden bg-[var(--card-bg)] border border-white/10 shadow-2xl animate-pulse">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute inset-0 bg-[var(--card-bg)] overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                            </div>
                            <div className="absolute bottom-8 left-8 right-8 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-white/10" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-white/10 rounded-full" />
                                        <div className="h-3 w-16 bg-white/10 rounded-full" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-white/10 rounded-full" />
                                    <div className="h-3 w-4/5 bg-white/10 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            ) : viewMode === 'grid' ? (
                <ExploreGrid 
                    posts={posts} 
                    onPostClick={onPostClickFromGrid} 
                    isLoading={isLoading} 
                />
            ) : (
                posts.map((post, feedIdx) => (
                    <div key={post.id} id={`post-${post.id}`} className="w-full relative flex flex-col items-center justify-center px-0 mb-8">
                        <ImmersivePostCard
                            post={post}
                            currentUser={user}
                            onLike={() => onLike(post.id)}
                            onShare={() => onShare(post)}
                            onAddComment={(text) => onAddComment(post.id, text)}
                            onToggleCommentLike={(commentId) => onToggleCommentLike(post.id, Number(commentId))}
                            onReplyComment={(commentId, text) => onReplyComment(post.id, Number(commentId), text)}
                            onDeleteComment={(commentId) => onDeleteComment(post.id, Number(commentId))}
                            onEditComment={(commentId, text) => onEditComment(post.id, Number(commentId), text)}
                            onReportComment={(commentId) => onReportComment(post.id, Number(commentId))}
                            onDeletePost={() => onDeletePost(post.id)}
                            onEditPost={() => onEditPost(post)}
                            priority={feedIdx === 0}
                            isCommentsDisabled={isCommentsDisabled}
                        />
                    </div>
                ))
            )}

            {/* Space for bottom nav */}
            <div className="h-12 w-full shrink-0" />
        </motion.div>
    );
}
