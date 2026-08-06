'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Instagram, MessageSquare, Send, Copy,
    QrCode, Download, Sparkles, CheckCircle2, Share2
} from 'lucide-react';
import { cn, showToast } from '@/lib/utils';
import { useStories } from '@/hooks/useStories';
import { QRCodeSVG } from 'qrcode.react';
import { PLATFORMS, getShareUrl, generatePostDeepLink, copyToClipboard } from '@/lib/shareUtils';

interface ShareSheetProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPost: any;
    onSocialShare?: (platform: string) => void;
    onAddToStory?: () => void;
    onCopyLink?: () => void;
}

export function ShareSheet({
    isOpen,
    onClose,
    selectedPost,
    onSocialShare,
    onAddToStory,
    onCopyLink
}: ShareSheetProps) {
    const { storyGroups: stories } = useStories();
    const [sendingTo, setSendingTo] = useState<string | null>(null);
    const [showQR, setShowQR] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    if (!selectedPost) return null;

    const postUrl = generatePostDeepLink(selectedPost.id);
    const postText = `Moffi'de harika bir paylaşım gördüm! 🐾 ${selectedPost.author}: "${selectedPost.desc || ''}"`;

    const handlePlatformShare = (platform: string) => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(10);

        const url = getShareUrl(platform, postUrl, postText);
        if (url) {
            window.location.href = url;
            onSocialShare?.(platform);
            onClose();
        } else if (platform === PLATFORMS.INSTAGRAM) {
            copyToClipboard(postUrl);
            showToast("Bağlantı Kopyalandı", "Bell", "cyan");
            showToast("Instagram'da paylaşmak için yapıştırın!", "Instagram", "purple");
            onSocialShare?.(platform);
            onClose();
        } else if (platform === PLATFORMS.MESSAGES) {
             const smsUrl = getShareUrl(PLATFORMS.MESSAGES, postUrl, postText);
             if (smsUrl) window.location.href = smsUrl;
             onSocialShare?.(platform);
             onClose();
        }
    };

    const handleQuickShare = (userName: string) => {
        if (sendingTo) return;
        if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(15);
        
        setSendingTo(userName);
        setTimeout(() => {
            setSendingTo(null);
            showToast(`${userName} kullanıcısına gönderildi! 🚀`, "Zap", "cyan");
            onClose();
        }, 1200);
    };

    const handleCopy = async () => {
        setIsCopying(true);
        const success = await copyToClipboard(postUrl);
        if (success) {
            showToast("Bağlantı panoya mühürlendi! 🔗", "Zap", "cyan");
            onCopyLink?.();
        }
        setTimeout(() => {
            setIsCopying(false);
            onClose();
        }, 1500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* BACKDROP */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[1100]"
                        onClick={onClose}
                    />

                    {/* BOTTOM SHEET */}
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[1200] max-h-[85vh] flex flex-col bg-white/90 dark:bg-[#111]/90 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/20 dark:border-white/10"
                    >
                        {/* DRAG HANDLE */}
                        <div className="w-full flex justify-center pt-4 pb-2" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full" />
                        </div>

                        {/* CONTENT AREA */}
                        <div className="flex-1 overflow-y-auto px-6 pb-safe">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-[18px] text-gray-900 dark:text-white">Paylaş</h3>
                                <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-600 dark:text-white/60 active:scale-95 transition-transform">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* QUICK SHARE - HORIZONTAL */}
                            <div className="mb-6">
                                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                                    

                                    {stories?.map((group) => (
                                        <button 
                                            key={group.id} 
                                            onClick={() => handleQuickShare(group.author_name)}
                                            className="flex flex-col items-center gap-2 shrink-0 group relative"
                                        >
                                            <div className="relative w-[56px] h-[56px]">
                                                <div className="absolute inset-0 rounded-[20px] bg-gradient-to-tr from-cyan-400 to-blue-500 p-[2px]">
                                                    <div className="w-full h-full rounded-[18px] bg-white dark:bg-black p-[2px]">
                                                        <img 
                                                            src={group.author_avatar || 'https://via.placeholder.com/150'} 
                                                            alt={group.author_name} 
                                                            className={cn(
                                                                "w-full h-full rounded-[14px] object-cover transition-all duration-300",
                                                                sendingTo === group.author_name ? "blur-sm scale-95 opacity-70" : ""
                                                            )} 
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <AnimatePresence>
                                                    {sendingTo === group.author_name && (
                                                        <motion.div 
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0.5, opacity: 0 }}
                                                            className="absolute inset-0 bg-cyan-500 rounded-[20px] flex items-center justify-center shadow-lg shadow-cyan-500/50 z-10"
                                                        >
                                                            <Send className="w-6 h-6 text-white fill-white" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <span className="text-[11px] font-semibold text-gray-600 dark:text-white/70 truncate w-16 text-center">
                                                {sendingTo === group.author_name ? "İletildi" : group.author_name.split(' ')[0]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* MAIN SOCIAL ACTIONS */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <button onClick={() => handlePlatformShare(PLATFORMS.WHATSAPP)} className="flex flex-col items-center justify-center py-4 rounded-3xl bg-[#25D366]/10 border border-[#25D366]/20 group active:scale-95 transition-all">
                                    <div className="w-12 h-12 bg-white dark:bg-black rounded-2xl flex items-center justify-center mb-2 shadow-sm">
                                        <svg className="w-6 h-6 fill-[#25D366]" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                                    </div>
                                    <span className="text-[12px] font-bold text-[#25D366]">WhatsApp</span>
                                </button>
                                
                                <button onClick={() => handlePlatformShare(PLATFORMS.INSTAGRAM)} className="flex flex-col items-center justify-center py-4 rounded-3xl bg-[#E1306C]/10 border border-[#E1306C]/20 group active:scale-95 transition-all">
                                    <div className="w-12 h-12 bg-white dark:bg-black rounded-2xl flex items-center justify-center mb-2 shadow-sm">
                                        <Instagram strokeWidth={1.5} className="w-6 h-6 text-[#E1306C]" />
                                    </div>
                                    <span className="text-[12px] font-bold text-[#E1306C]">Instagram</span>
                                </button>

                                <button onClick={() => handlePlatformShare(PLATFORMS.MESSAGES)} className="flex flex-col items-center justify-center py-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 group active:scale-95 transition-all">
                                    <div className="w-12 h-12 bg-white dark:bg-black rounded-2xl flex items-center justify-center mb-2 shadow-sm">
                                        <MessageSquare strokeWidth={1.5} className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <span className="text-[12px] font-bold text-blue-500">Mesajlar</span>
                                </button>
                            </div>

                            {/* SECONDARY ACTIONS */}
                            <div className="space-y-3 mb-6">
                                <button 
                                    onClick={handleCopy}
                                    className="w-full p-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl flex items-center justify-between transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-white dark:bg-white/10 rounded-xl shadow-sm">
                                            {isCopying ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-gray-700 dark:text-white" />}
                                        </div>
                                        <span className="font-semibold text-gray-800 dark:text-white/90">{isCopying ? 'Kopyalandı!' : 'Bağlantıyı Kopyala'}</span>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setShowQR(true)}
                                    className="w-full p-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl flex items-center justify-between transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-white dark:bg-white/10 rounded-xl shadow-sm">
                                            <QrCode className="w-5 h-5 text-gray-700 dark:text-white" />
                                        </div>
                                        <span className="font-semibold text-gray-800 dark:text-white/90">QR-ID ile Paylaş</span>
                                    </div>
                                </button>

                                {selectedPost.media || selectedPost.image ? (
                                    <button 
                                        onClick={() => { 
                                            const mediaUrl = selectedPost.media || selectedPost.image;
                                            const link = document.createElement('a');
                                            link.href = mediaUrl;
                                            link.download = `moffi-post-${selectedPost.id}.jpg`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            showToast("Medya Galeriye Kaydedildi 📸", "Zap", "cyan");
                                            onClose(); 
                                        }}
                                        className="w-full p-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl flex items-center justify-between transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-white dark:bg-white/10 rounded-xl shadow-sm">
                                                <Download className="w-5 h-5 text-gray-700 dark:text-white" />
                                            </div>
                                            <span className="font-semibold text-gray-800 dark:text-white/90">Medyayı İndir</span>
                                        </div>
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </motion.div>

                    {/* QR MODAL */}
                    <AnimatePresence>
                        {showQR && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-0 z-[1300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                                onClick={() => setShowQR(false)}
                            >
                                <motion.div 
                                    className="bg-white dark:bg-[#1C1C1E] p-8 rounded-[2rem] flex flex-col items-center gap-6 max-w-[300px] w-full shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-3xl flex items-center justify-center border border-gray-100 dark:border-white/5">
                                        <QRCodeSVG 
                                            value={postUrl}
                                            size={180}
                                            level="Q"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Moffi QR-ID</h3>
                                        <p className="text-sm text-gray-500 dark:text-white/50">Kamerayla okutarak anında paylaş.</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowQR(false)}
                                        className="w-full py-3.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-2xl text-gray-900 dark:text-white font-bold transition-colors"
                                    >
                                        Kapat
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
