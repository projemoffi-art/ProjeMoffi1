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
    onToggleCommentLike: (postId: any, commentId: any) => void;
    onReplyComment: (postId: any, commentId: any, text: string) => void;
    onDeleteComment: (postId: any, commentId: any) => void;
    onEditComment: (postId: any, commentId: any, text: string) => void;
    onReportComment: (postId: any, commentId: any) => void;
    onDeletePost: (postId: any) => void;
    onEditPost: (post: any) => void;
    
    onStoryClick: (index: number) => void;
    onAddStoryClick: () => void;
    onPostClickFromGrid: (post: any) => void;
    isCommentsDisabled?: boolean;
    headerElement?: React.ReactNode;
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
    isCommentsDisabled = false,
    headerElement
}: FeedTabProps) {
    return (
        <motion.div
            id="feed-tab-container"
            className="w-full h-full relative overflow-y-auto overflow-x-hidden bg-[var(--background)] flex flex-col gap-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Soft Ambient Background for the Feed */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-50 dark:opacity-30">
                <div className="absolute top-0 left-[-20%] w-[70vw] h-[70vw] bg-cyan-400/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] right-[-20%] w-[60vw] h-[60vw] bg-fuchsia-400/10 rounded-full blur-[120px]" />
            </div>

            {/* Header and Stories Combined Snap Block */}
            <div className="w-full flex flex-col relative z-10 mb-2">
                {headerElement}
                {/* STORIES BAR */}
                <div className="w-full px-4 pt-4 pb-4 overflow-hidden mb-2">
                    <div className="w-full flex gap-4 overflow-x-auto no-scrollbar">
                        {/* Current User Story or Add Story */}
                        {(() => {
                            const myGroupIndex = storyGroups.findIndex(g => g.user_id === user?.id);
                            const myGroup = myGroupIndex !== -1 ? storyGroups[myGroupIndex] : null;

                            if (myGroup) {
                                return (
                                    <div className="flex flex-col items-center gap-1.5 shrink-0 group relative">
                                        <div 
                                            onClick={() => onStoryClick(myGroupIndex)}
                                            className={cn(
                                                "w-16 h-16 rounded-full p-[2.5px] transition-transform group-hover:scale-105 cursor-pointer relative",
                                                myGroup.hasUnseen ? "bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600" : "bg-black/10 dark:bg-white/10"
                                            )}
                                        >
                                            <div className="w-full h-full bg-[var(--background)] rounded-full border-2 border-[var(--background)] overflow-hidden relative">
                                                <img 
                                                    src={user?.avatar || myGroup.author_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200"} 
                                                    className="w-full h-full object-cover transition-opacity duration-500"
                                                    onLoad={(e) => (e.target as HTMLImageElement).style.opacity = '1'}
                                                    style={{ opacity: 0 }}
                                                    alt="Sen"
                                                />
                                            </div>
                                        </div>
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); onAddStoryClick(); }}
                                            className="absolute bottom-4 right-0 w-6 h-6 bg-accent rounded-full border-2 border-background flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform z-10"
                                        >
                                            <Plus className="w-4 h-4 text-white" strokeWidth={3} />
                                        </div>
                                        <span className={cn("text-[10px] tracking-wide", myGroup.hasUnseen ? "font-bold text-[var(--foreground)]" : "font-medium text-[var(--secondary-text)] truncate w-16 text-center")}>
                                            Sen
                                        </span>
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="flex flex-col items-center gap-1.5 shrink-0 group">
                                        <div 
                                            onClick={onAddStoryClick}
                                            className="relative w-16 h-16 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm border-2 border-dashed border-accent/50 flex items-center justify-center cursor-pointer transition-transform group-hover:scale-105 shadow-sm"
                                        >
                                            <img 
                                                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200"} 
                                                className="w-[90%] h-[90%] rounded-full object-cover opacity-50"
                                                alt="Hikayen"
                                            />
                                            <div className="absolute inset-0 m-auto w-7 h-7 bg-accent rounded-full border-2 border-background flex items-center justify-center shadow-lg">
                                                <Plus className="w-4 h-4 text-white" strokeWidth={3} />
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-foreground font-semibold tracking-wide">Ekle</span>
                                    </div>
                                );
                            }
                        })()}

                        {/* Real Database Stories (excluding current user) */}
                {storyGroups.filter(g => g.user_id !== user?.id).map((group) => {
                    const originalIndex = storyGroups.findIndex(g => g.user_id === group.user_id);
                    return (
                        <div 
                            key={group.user_id} 
                            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" 
                            onClick={() => onStoryClick(originalIndex)}
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-full p-[2.5px] transition-transform group-hover:scale-105",
                                group.hasUnseen ? "bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600" : "bg-black/10 dark:bg-white/10"
                            )}>
                                <div className="w-full h-full bg-[var(--background)] rounded-full border-2 border-[var(--background)] overflow-hidden relative">
                                    <img 
                                        src={group.author_avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"} 
                                        className="w-full h-full object-cover transition-opacity duration-500"
                                        onLoad={(e) => (e.target as HTMLImageElement).style.opacity = '1'}
                                        style={{ opacity: 0 }}
                                        alt={group.author_name}
                                    />
                                </div>
                            </div>
                            <span className={cn("text-[10px] tracking-wide", group.hasUnseen ? "font-bold text-[var(--foreground)]" : "font-medium text-[var(--secondary-text)] truncate w-16 text-center")}>
                                {group.author_name}
                            </span>
                        </div>
                    );
                })}
                </div>
            </div>
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
                                        window.dispatchEvent(new CustomEvent('open-sos-center', { detail: activePet }));
                                    }}
                                    className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all duration-200 shadow-md shadow-red-500/20 cursor-pointer"
                                >
                                    YÖNET
                                </button>
                                <button 
                                    onClick={() => setIsSosAlertDismissed(true)}
                                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-black/40 dark:text-white/30 hover:text-red-400 transition-colors cursor-pointer shrink-0"
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
                    <div key={i} className="w-full relative flex flex-col items-center justify-center px-4 shrink-0 h-96">
                        <div className="relative w-full h-full max-w-lg mx-auto rounded-[3rem] overflow-hidden bg-[var(--card-bg)] border border-black/10 dark:border-white/10 shadow-2xl animate-pulse">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute inset-0 bg-[var(--card-bg)] overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                            </div>
                            <div className="absolute bottom-8 left-8 right-8 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-black/10 dark:bg-white/10" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-black/10 dark:bg-white/10 rounded-full" />
                                        <div className="h-3 w-16 bg-black/10 dark:bg-white/10 rounded-full" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-black/10 dark:bg-white/10 rounded-full" />
                                    <div className="h-3 w-4/5 bg-black/10 dark:bg-white/10 rounded-full" />
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
                <div className="w-full sm:px-4 pb-4">
                    <div className="w-full max-w-[495px] mx-auto bg-white/90 dark:bg-[#121212]/90 backdrop-blur-3xl sm:rounded-[2rem] border-y sm:border border-black/[0.02] dark:border-white/[0.02] sm:shadow-[0_12px_40px_rgb(0,0,0,0.03)] sm:dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden">
                        {posts.map((post, feedIdx) => (
                            <section key={post.id} id={`post-${post.id}`} className="w-full flex flex-col items-center">
                                <ImmersivePostCard
                                    post={post}
                                    currentUser={user}
                                    onLike={() => onLike(post.id)}
                                    onShare={() => onShare(post)}
                                    onAddComment={(text) => onAddComment(post.id, text)}
                                    onToggleCommentLike={(commentId) => onToggleCommentLike(post.id, commentId)}
                                    onReplyComment={(commentId, text) => onReplyComment(post.id, commentId, text)}
                                    onDeleteComment={(commentId) => onDeleteComment(post.id, commentId)}
                                    onEditComment={(commentId, text) => onEditComment(post.id, commentId, text)}
                                    onReportComment={(commentId) => onReportComment(post.id, commentId)}
                                    onDeletePost={() => onDeletePost(post.id)}
                                    onEditPost={() => onEditPost(post)}
                                    priority={feedIdx === 0}
                                    isCommentsDisabled={isCommentsDisabled}
                                />
                            </section>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
