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
    unreadCount: number;
}

export function NotificationsDrawer({
    isOpen,
    onClose,
    notifications,
    onMarkAllRead,
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
                                notifications.map((notif: any) => (
                                    <div key={notif.id} className={cn(
                                        "px-6 py-4 flex items-start gap-3 transition-colors active:bg-white/5 cursor-pointer relative",
                                        !notif.read && (notif.type === 'health' ? "bg-red-500/5" : "bg-cyan-500/5")
                                    )}>
                                        {!notif.read && (
                                            <div className={cn(
                                                "absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                                                notif.type === 'health' ? "bg-red-500" : "bg-cyan-500"
                                            )} />
                                        )}
                                        <div className={cn(
                                            "w-12 h-12 rounded-full border shrink-0 overflow-hidden flex items-center justify-center bg-white/5",
                                            notif.type === 'health' ? "border-red-500/30" : "border-white/10"
                                        )}>
                                            {notif.avatar && !notif.avatar.includes('cdn-icons') ? (
                                                <img src={notif.avatar} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-xl">🩺</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white leading-snug">
                                                <span className={cn(
                                                    "font-bold",
                                                    notif.type === 'health' ? "text-red-400" : "text-cyan-400"
                                                )}>{notif.user}</span> {notif.text}
                                            </p>
                                            <p className="text-[11px] text-gray-500 font-medium mt-1">{notif.time}</p>
                                        </div>
                                        <button className="text-gray-600 hover:text-white transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 border-t border-white/5 mb-safe-bottom">
                            <button
                                onClick={onMarkAllRead}
                                className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
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
