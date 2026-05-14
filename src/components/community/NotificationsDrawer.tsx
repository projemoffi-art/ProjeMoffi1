'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: any[];
    onMarkAllRead: () => void;
    onMarkRead?: (id: string) => void;
    unreadCount: number;
}

export function NotificationsDrawer({
    isOpen,
    onClose,
    notifications,
    onMarkAllRead,
    onMarkRead,
    unreadCount
}: NotificationsDrawerProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
                    />
                    <motion.div
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                        className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-[#0A0A0E] z-[120] border-l border-white/5 shadow-2xl flex flex-col pt-safe"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center relative">
                                    <Bell className="w-5 h-5 text-cyan-400" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-[#0A0A0E]">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-white">Bildirimler</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{unreadCount} yeni mesaj</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                            {notifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center px-10 text-center opacity-40">
                                    <Bell className="w-12 h-12 mb-4" />
                                    <p className="font-bold text-white">Henüz bildirim yok</p>
                                    <p className="text-xs mt-2">Etkileşimlerinizi buradan takip edebilirsiniz.</p>
                                </div>
                            ) : (
                                notifications.map((notif: any) => {
                                    const isUnread = !notif.read;
                                    const isLike = notif.type === 'like' || notif.type === 'comment_like';
                                    const isComment = notif.type === 'comment';
                                    const isFollow = notif.type === 'follow';
                                    
                                    return (
                                        <div 
                                            key={notif.id} 
                                            onClick={() => {
                                                if (isUnread && onMarkRead) onMarkRead(notif.id);
                                            }}
                                            className={cn(
                                                "px-5 py-4 flex items-center gap-3 transition-all duration-500 cursor-pointer relative overflow-hidden border-l-4",
                                                isUnread 
                                                    ? "bg-accent/5 border-accent shadow-[inset_0_0_20px_rgba(255,55,95,0.05)]" 
                                                    : "bg-transparent hover:bg-white/5 border-transparent"
                                            )}
                                        >
                                            <div className="relative shrink-0">
                                                <div className="w-11 h-11 rounded-full overflow-hidden bg-white/5 border border-white/10">
                                                    {notif.avatar && !notif.avatar.includes('cdn-icons') ? (
                                                        <img src={notif.avatar} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xl bg-gray-800">👤</div>
                                                    )}
                                                </div>
                                                {/* Action Mini Badge */}
                                                <div className={cn(
                                                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-xl flex items-center justify-center border-2 border-[#0A0A0E] shadow-xl",
                                                    isLike ? "bg-[#FF2D55]" : isComment ? "bg-cyan-500" : isFollow ? "bg-purple-500" : "bg-blue-500"
                                                )}>
                                                    <span className="text-[10px] scale-90">
                                                        {isLike ? '❤️' : isComment ? '💬' : isFollow ? '👤' : '✨'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <p className={cn(
                                                    "text-[13px] leading-tight break-words transition-colors",
                                                    isUnread ? "text-white font-bold" : "text-white/70"
                                                )}>
                                                    <span className="font-black text-white mr-1">{notif.user}</span> 
                                                    {notif.text?.startsWith(notif.user) 
                                                        ? notif.text.substring(notif.user.length).trim() 
                                                        : (notif.content || notif.text)}
                                                </p>
                                                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                    {notif.time}
                                                    {isUnread && <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />}
                                                </p>
                                            </div>

                                            {/* Unread Dot Indicator (Instagram style) */}
                                            {isUnread && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-accent shrink-0 ml-2 shadow-[0_0_10px_rgba(255,55,95,0.6)]" />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="p-6 border-t border-white/5 mb-safe-bottom">
                            <button
                                onClick={onMarkAllRead}
                                className="w-full py-4 rounded-[2rem] bg-accent/10 border border-accent/20 text-accent text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-accent hover:text-white transition-all shadow-lg active:scale-95"
                            >
                                <Check className="w-4 h-4" /> Tümünü Okundu İşaretle
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
