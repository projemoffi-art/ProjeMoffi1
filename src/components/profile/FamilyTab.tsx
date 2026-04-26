"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Plus, Clock, Footprints, Utensils,
    Activity, Heart, Bell, X, QrCode, Share2, 
    ShieldCheck, ChevronRight, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFamily } from "@/hooks/useFamily";
import { FamilyLog } from "@/types/domain";
import { QRCodeSVG } from "qrcode.react";

// Helper to map string icon types to components
const getIcon = (type: FamilyLog['iconType']) => {
    switch (type) {
        case 'Footprints': return Footprints;
        case 'Utensils': return Utensils;
        case 'Activity': return Activity;
        case 'Heart': return Heart;
        default: return Activity;
    }
};

export function FamilyTab() {
    const { members, logs, notification, isLoading } = useFamily();
    const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm font-bold text-gray-500 animate-pulse">Aile Verileri Yükleniyor...</p>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-8 pb-32"
        >
            {/* IN-APP NOTIFICATION TOAST */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] bg-white/10 backdrop-blur-2xl text-white px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center gap-3 border border-white/10"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-white fill-current" />
                        </div>
                        <span className="text-sm font-black tracking-tight">{notification}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER SECTION */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 sm:gap-3">
                        Moffi Ailesi <span className="text-blue-400 text-base sm:text-lg opacity-50">· {members.length}</span>
                    </h2>
                    <p className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mt-1">Dostumuzun Ortak Bakım Çemberi</p>
                </div>
                <button 
                    onClick={() => setIsInviteSheetOpen(true)}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 active:scale-90 transition-transform shadow-lg shadow-blue-500/5"
                >
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
            </div>

            {/* MEMBERS GRID - Apple Bento Style */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {members.map((member) => (
                    <motion.div
                        layout
                        key={member.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/5 backdrop-blur-md p-4 sm:p-5 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 relative overflow-hidden group transition-all"
                    >
                        <div className="absolute top-3 right-4 sm:top-4 sm:right-5">
                            <div className={cn("w-2 h-2 rounded-full", 
                                member.status === 'online' ? "bg-green-500" : (member.status === 'busy' ? "bg-orange-500 animate-pulse" : "bg-white/20")
                            )} />
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-3">
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <img src={member.avatar} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[1.5rem] object-cover border-2 sm:border-4 border-white/5 relative z-10 shadow-2xl" />
                            </div>
                            
                            <h4 className="font-black text-white text-sm sm:text-base leading-tight">{member.name}</h4>
                            <span className="text-[9px] sm:text-[10px] text-blue-400 font-black uppercase tracking-[0.15em] mt-1">{member.role}</span>

                            <div className="mt-3 sm:mt-4 w-full bg-white/5 rounded-xl sm:rounded-2xl p-2 border border-white/5">
                                <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 line-clamp-1">{member.statusText}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Add Member Card */}
                <button 
                    onClick={() => setIsInviteSheetOpen(true)}
                    className="bg-dashed border-2 border-white/10 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center p-4 sm:p-5 group hover:border-blue-500/40 hover:bg-blue-500/5 transition-all gap-2 text-gray-500 hover:text-blue-400 h-full min-h-[140px] sm:min-h-[160px]"
                >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Üye Ekle</span>
                </button>
            </div>

            {/* ACTIVITY LOG - Modern Timeline */}
            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-8 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[80px] pointer-events-none" />
                
                <h3 className="font-black text-white text-lg sm:text-xl mb-6 sm:mb-8 flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-500/20 flex items-center justify-center">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    Günlük Aktivite
                </h3>

                <div className="space-y-0 relative">
                    <div className="absolute left-[17px] sm:left-[19px] top-6 bottom-6 w-[2px] bg-white/5" />

                    <AnimatePresence initial={false}>
                        {logs.slice(0, 5).map((log) => {
                            const Icon = getIcon(log.iconType);
                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-4 sm:gap-6 relative z-10 pb-8 sm:pb-10 last:pb-2"
                                >
                                    <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10 shadow-lg z-20 bg-[#0A0A0E] group-hover:scale-110 transition-transform", log.color.replace('bg-', 'bg-opacity-20 bg-'))}>
                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="flex-1 pt-0.5 sm:pt-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-sm sm:text-[15px] text-white tracking-tight">{log.user}</span>
                                            <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider">{log.time}</span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1 leading-relaxed opacity-80">{log.action}</p>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-white/10 mt-2" />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* APPLE STYLE INVITE BOTTOM SHEET */}
            <AnimatePresence>
                {isInviteSheetOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex flex-col justify-end"
                    >
                        <motion.div 
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setIsInviteSheetOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative bg-[#12121A] rounded-t-[3rem] p-8 pb-32 border-t border-white/10 z-10 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
                        >
                            {/* Grab Handle */}
                            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8 shrink-0" />
                            
                            {/* Secondary Close Button (Top Right) */}
                            <button 
                                onClick={() => setIsInviteSheetOpen(false)}
                                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 active:scale-90 transition-transform z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-blue-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-10 h-10 text-blue-500" />
                                </div>
                                <h3 className="text-2xl font-black text-white">Aileye Davet Et</h3>
                                <p className="text-gray-500 text-sm mt-2 font-medium">Birlikte bakmak, sevgi paylaşmaktır.</p>
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center mb-8">
                                <div className="bg-white p-4 rounded-3xl shadow-2xl mb-6 relative group cursor-pointer active:scale-95 transition-transform">
                                    <QRCodeSVG 
                                        value="moffi://invite/family/123456" 
                                        size={160}
                                        bgColor="#FFFFFF"
                                        fgColor="#000000"
                                        level="H"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/90 transition-opacity rounded-3xl">
                                        <QrCode className="w-10 h-10 text-black" />
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[0.2em]">Moffi Kimliği Tara</p>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full py-4 rounded-full bg-blue-500 text-white font-black text-sm shadow-[0_10px_30px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-transform">
                                    <Share2 className="w-5 h-5" /> Davet Linki Paylaş
                                </button>
                                <button className="w-full py-4 rounded-full bg-white/5 text-gray-400 font-bold text-sm border border-white/5 flex items-center justify-center gap-3 active:scale-95 transition-transform">
                                    <ShieldCheck className="w-5 h-5" /> Rehberden Bul
                                </button>
                            </div>

                            <button 
                                onClick={() => setIsInviteSheetOpen(false)}
                                className="w-full mt-6 py-4 text-gray-600 font-black text-xs uppercase tracking-[0.3em] hover:text-white transition-colors"
                            >
                                Paneli Kapat
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
