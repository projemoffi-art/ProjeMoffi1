'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Instagram, MessageCircle, Send, Twitter, 
    Facebook, Mail, Copy, PlusCircle, Bookmark,
    QrCode, Download, Sparkles, ChevronRight, Zap,
    Plus, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocial } from '@/context/SocialContext';

interface ShareSheetProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPost: any;
    onSocialShare: (platform: string) => void;
    onAddToStory: () => void;
    onCopyLink: () => void;
}

export function ShareSheet({
    isOpen,
    onClose,
    selectedPost,
    onSocialShare,
    onAddToStory,
    onCopyLink
}: ShareSheetProps) {
    const [sendingTo, setSendingTo] = React.useState<string | null>(null);
    const [showQR, setShowQR] = React.useState(false);
    const { stories } = useSocial();

    const handleQuickShare = (userName: string) => {
        if (sendingTo) return;
        
        // Haptic Feedback
        if (window.navigator.vibrate) window.navigator.vibrate(15);
        
        setSendingTo(userName);
        
        // Mock API call delay
        setTimeout(() => {
            setSendingTo(null);
            onClose();
            // We could trigger a toast here if a global one was available
        }, 1500);
    };

    const handleAddToStoryLocal = () => {
        onAddToStory();
        onClose();
    };

    const handleCopyLinkLocal = () => {
        onCopyLink();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] pointer-events-auto"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 350, mass: 0.8 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            if (offset.y > 100 || velocity.y > 500) {
                                onClose();
                            }
                        }}
                        className="fixed bottom-0 left-0 right-0 z-[1200] bg-[#0a0a0b]/60 backdrop-blur-[50px] border-t border-white/10 rounded-t-[48px] shadow-[0_-20px_80px_rgba(0,0,0,0.8)] flex flex-col pointer-events-auto overflow-hidden max-h-[92%] w-full max-w-lg mx-auto"
                    >
                        {/* HANDLEBAR */}
                        <div 
                            onClick={onClose}
                            className="w-full flex flex-col items-center pt-5 pb-2 shrink-0 cursor-pointer group/handle"
                        >
                            <div className="w-12 h-1.5 bg-white/20 rounded-full mb-4 group-hover/handle:bg-white/40 transition-colors" />
                            <span className="text-[14px] font-black text-white/40 mt-2 uppercase tracking-widest">Paylaş</span>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 overscroll-contain">
                            {/* POST PREVIEW (Subtle) */}
                            {selectedPost && (
                                <div className="px-6 py-4">
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-[32px] border border-white/10">
                                        <img src={selectedPost.media} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[17px] font-bold text-white truncate">{selectedPost.author}</p>
                                            <p className="text-[13px] text-white/40 line-clamp-1">{selectedPost.desc || 'Harika bir Moffi anısı!'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* RECENT FRIENDS (HORIZONTAL) */}
                            <div className="px-6 py-4">
                                <span className="text-[12px] font-bold text-white/30 uppercase tracking-widest mb-4 block">Hızlı Paylaş</span>
                                <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 overscroll-x-contain">
                                    {(stories || []).map((story: any) => (
                                        <button 
                                            key={story.id}
                                            onClick={() => handleQuickShare(story.userName)}
                                            className="flex flex-col items-center gap-2 shrink-0 group active:scale-95 transition-transform relative"
                                        >
                                            <div className="w-16 h-16 rounded-3xl p-0.5 bg-gradient-to-tr from-cyan-500 to-purple-500 relative">
                                                <div className="w-full h-full rounded-[20px] bg-black p-0.5">
                                                    <img src={story.userImg} className={cn(
                                                        "w-full h-full rounded-[18px] object-cover border border-white/10 transition-all duration-500",
                                                        sendingTo === story.userName ? "blur-md scale-90 opacity-50" : ""
                                                    )} />
                                                </div>

                                                <AnimatePresence>
                                                    {sendingTo === story.userName && (
                                                        <motion.div 
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0.5, opacity: 0 }}
                                                            className="absolute inset-x-2 inset-y-2 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50 z-10"
                                                        >
                                                            <Send className="w-8 h-8 text-white fill-white" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <span className="text-[11px] font-medium text-white/60 truncate w-16 text-center">
                                                {sendingTo === story.userName ? "Gönderildi!" : story.userName}
                                            </span>
                                        </button>
                                    ))}
                                    <button className="flex flex-col items-center gap-2 shrink-0 group active:scale-95 transition-transform">
                                        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:bg-white/10 transition-colors">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <span className="text-[11px] font-medium text-white/30">Daha Fazla</span>
                                    </button>
                                </div>
                            </div>

                            {/* SOCIAL GRID */}
                            <div className="px-6 py-4 grid grid-cols-4 gap-4">
                                <button onClick={() => { onSocialShare('WhatsApp'); onClose(); }} className="flex flex-col items-center gap-2 group">
                                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 active:scale-90 transition-transform shadow-lg shadow-green-500/5">
                                        <Zap className="w-6 h-6 fill-current" />
                                    </div>
                                    <span className="text-[11px] font-medium text-white/60">WhatsApp</span>
                                </button>
                                <button onClick={() => { onSocialShare('Instagram'); onClose(); }} className="flex flex-col items-center gap-2 group">
                                    <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 active:scale-90 transition-transform shadow-lg shadow-pink-500/5">
                                        <Instagram className="w-6 h-6" />
                                    </div>
                                    <span className="text-[11px] font-medium text-white/60">Instagram</span>
                                </button>
                                <button onClick={() => { handleAddToStoryLocal(); }} className="flex flex-col items-center gap-2 group">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 active:scale-90 transition-transform shadow-lg shadow-purple-500/5">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <span className="text-[11px] font-medium text-white/60">Hikayem</span>
                                </button>
                                <button onClick={() => { onSocialShare('Mesajlar'); onClose(); }} className="flex flex-col items-center gap-2 group">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 active:scale-90 transition-transform shadow-lg shadow-blue-500/5">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <span className="text-[11px] font-medium text-white/60">Mesajlar</span>
                                </button>
                            </div>

                            {/* UTILITY ACTIONS */}
                            <div className="px-6 py-4 space-y-3">
                                <div className="flex flex-col bg-white/[0.03] rounded-[32px] border border-white/[0.08] divide-y divide-white/[0.05] overflow-hidden">
                                    <button 
                                        onClick={handleCopyLinkLocal}
                                        className="w-full px-6 py-5 flex items-center justify-between active:bg-white/[0.07] transition-all group"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-white/60">
                                                <Copy className="w-6 h-6" />
                                            </div>
                                            <span className="text-white font-bold text-[17px]">Bağlantıyı Kopyala</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-white/10 group-active:translate-x-1 transition-transform" />
                                    </button>
                                    
                                    <button 
                                        onClick={() => setShowQR(true)}
                                        className="w-full px-6 py-5 flex items-center gap-5 active:bg-white/[0.07] transition-all group"
                                    >
                                        <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-400/20 text-cyan-400">
                                            <QrCode className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-white font-bold text-[17px]">QR-ID Görüntüle</span>
                                            <span className="text-white/30 text-[11px]">Yüz yüze hızı paylaşım yap</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-white/10 ml-auto group-active:translate-x-1 transition-transform" />
                                    </button>

                                    <button 
                                        onClick={() => { alert('Medya galeriye kaydedildi 💾'); onClose(); }}
                                        className="w-full px-6 py-5 flex items-center gap-5 active:bg-white/[0.07] transition-all"
                                    >
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-white/60">
                                            <Download className="w-6 h-6" />
                                        </div>
                                        <span className="text-white/90 font-semibold text-[17px]">Medyayı Kaydet</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CLOSE BUTTON AT BOTTOM */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent pt-12 shrink-0">
                            <button 
                                onClick={onClose}
                                className="w-full py-5 bg-white text-black rounded-[28px] font-black text-[18px] active:scale-[0.97] transition-all shadow-xl"
                            >
                                Kapat
                            </button>
                        </div>
                    </motion.div>

                    {/* QR MODAL (Placeholder) */}
                    <AnimatePresence>
                        {showQR && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="fixed inset-0 z-[1300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                                onClick={() => setShowQR(false)}
                            >
                                <motion.div 
                                    className="bg-[#1C1C1E] p-8 rounded-[40px] border border-white/10 flex flex-col items-center gap-6 max-w-sm w-full shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="w-48 h-48 bg-white p-4 rounded-3xl flex items-center justify-center shadow-inner">
                                        <QrCode className="w-full h-full text-black" />
                                    </div>
                                    <div className="text-center px-4">
                                        <h3 className="text-xl font-bold text-white mb-2">Moffi QR-ID</h3>
                                        <p className="text-sm text-white/40">Bu kodu okutarak ilanı anında paylaşabilirsin.</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowQR(false)}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-[24px] text-white font-bold transition-colors"
                                    >
                                        Vazgeç
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
}
