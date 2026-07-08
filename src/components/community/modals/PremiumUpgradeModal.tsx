"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, X, Sparkles, Shield, Rocket, Palette, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { paymentService } from '@/services/paymentService';

export function PremiumUpgradeModal({ isOpen: isOpenProp, onClose: onCloseProp }: { isOpen?: boolean, onClose?: () => void }) {
    const [isOpenInternal, setIsOpenInternal] = useState(false);
    const [isBuying, setIsBuying] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Support both controlled (props) and uncontrolled (event) modes
    const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenInternal;
    const handleClose = onCloseProp !== undefined ? onCloseProp : () => {
        if (isBuying) return;
        setIsOpenInternal(false);
        setIsSuccess(false);
    };

    useEffect(() => {
        const handleOpen = () => setIsOpenInternal(true);
        window.addEventListener('open-premium-modal', handleOpen);
        return () => window.removeEventListener('open-premium-modal', handleOpen);
    }, []);

    const { user, refreshUser } = useAuth();

    const handleUpgrade = async () => {
        if (!user?.id) return;
        setIsBuying(true);
        
        // Simülasyon: Iyzico Checkout oluşturuluyor (Gerçekte paymentService.createSubscriptionCheckout çağrılıp yönlendirilecek)
        const checkout = await paymentService.createSubscriptionCheckout("prime_monthly", user.id);
        
        // Şimdilik ödemeyi anında başarılı varsayıyoruz (Gerçekte webhook ile çalışacak)
        const result = await paymentService.completeSubscription(user.id, "prime_monthly");
        
        setIsBuying(false);
        if (result.success) {
            setIsSuccess(true);
            if (refreshUser) refreshUser(); // Context'i güncelle
            
            setTimeout(() => {
                handleClose();
            }, 2500);
        } else {
            window.dispatchEvent(new CustomEvent('moffi-toast', { detail: { message: result.error || 'Satın alma başarısız.', icon: 'AlertTriangle' } }));
        }
    };

    // Karşılaştırma Tablosu Verileri (Tüm Prime Özellikleri)
    const comparisonFeatures = [
        { name: "Reklamsız Deneyim", free: false, prime: true },
        { name: "Temassız (NFC) Ödeme Limiti", free: "Max 5 İşlem/Ay", prime: "Sınırsız" },
        { name: "Moffi AI Asistan", free: "Günlük 5 Soru", prime: "Aylık 500 Gelişmiş Sorgu" },
        { name: "AI Görüntü Analizi (Veteriner)", free: false, prime: true },
        { name: "Stüdyo Kargo Hakkı", free: "Ücretli", prime: "Ayda 3 Kez (Max 30 Desi)" },
        { name: "Sınırsız Günlük Adım Puanı", free: "Limitli", prime: "Limitsiz (Cap Yok)" },
        { name: "Profil Ziyaretçilerini Görme", free: false, prime: true },
        { name: "Profil Aura & Neon Çerçeveleri", free: false, prime: true },
        { name: "Prime Özel Elite Rozet", free: false, prime: true },
        { name: "Öncelikli Müşteri Desteği", free: false, prime: true }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Arka plan sönükleşme */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
                    />

                    {/* Lüks Satış Kartı */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[90vh] overflow-y-auto no-scrollbar bg-background border border-[#D4AF37]/30 rounded-[3rem] shadow-[0_20px_100px_rgba(212,175,55,0.15)] z-[9999] text-foreground"
                    >
                        {/* Kapat Ma */}
                        <button 
                            onClick={handleClose}
                            className="absolute top-6 right-6 w-10 h-10 bg-foreground/5 rounded-full flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-colors z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="relative p-8 lg:p-12 overflow-hidden flex flex-col items-center text-center">
                            
                            {/* Arkadaki devasa parıltı (Aura) */}
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[150%] h-[200px] bg-gradient-to-b from-[#D4AF37]/20 to-transparent blur-3xl pointer-events-none" />

                            <motion.div 
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="w-24 h-24 bg-gradient-to-br from-[#FFD700] via-[#D4AF37] to-[#B8860B] rounded-[2.5rem] p-0.5 shadow-[0_0_50px_rgba(255,215,0,0.4)] mb-8 shrink-0 relative"
                            >
                                <div className="w-full h-full bg-background rounded-[2.4rem] flex items-center justify-center overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/20 to-transparent" />
                                    <Crown className="w-12 h-12 text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] z-10" />
                                </div>
                            </motion.div>

                            <h2 className="text-4xl font-black tracking-tighter mb-4">
                                Moffi <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#B8860B]">Prime</span>
                            </h2>
                            <p className="text-secondary font-medium leading-relaxed mb-10 max-w-sm">
                                Ekosistemin en prestijli kulübüne katıl. Moffi evrenindeki gücünü zirveye taşı.
                            </p>

                            <div className="w-full mb-10 bg-foreground/5 border border-glass-border rounded-2xl overflow-hidden shadow-lg">
                                {/* Table Header */}
                                <div className="grid grid-cols-3 bg-foreground/5 text-xs font-bold text-muted-foreground py-3 px-2 text-center uppercase tracking-wider">
                                    <div className="text-left pl-2">Özellik</div>
                                    <div className="text-muted-foreground">Normal</div>
                                    <div className="text-[#FFD700]">Prime</div>
                                </div>
                                {/* Table Rows */}
                                <div className="divide-y divide-foreground/5">
                                    {comparisonFeatures.map((feature, i) => (
                                        <div key={i} className="grid grid-cols-3 text-[11px] py-4 px-2 items-center text-center">
                                            <div className="text-left font-semibold text-foreground pl-2 pr-2">{feature.name}</div>
                                            <div className="text-muted-foreground font-medium">
                                                {feature.free === false ? <X className="w-4 h-4 mx-auto opacity-50" /> : feature.free}
                                            </div>
                                            <div className="text-[#FFD700] font-black">
                                                {feature.prime === true ? <Check className="w-4 h-4 mx-auto" /> : feature.prime}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <button 
                                    onClick={handleUpgrade}
                                    disabled={isBuying || isSuccess}
                                    className={cn(
                                        "w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_15px_40px_rgba(212,175,55,0.3)] transition-all flex items-center justify-center gap-3",
                                        isSuccess 
                                            ? "bg-green-500 text-white shadow-[0_15px_40px_rgba(34,197,94,0.4)]"
                                            : "bg-gradient-to-r from-[#FFD700] via-[#FDB931] to-[#D4AF37] text-black hover:brightness-110"
                                    )}
                                >
                                    {isBuying ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Ödeme Bekleniyor</>
                                    ) : isSuccess ? (
                                        <><Check className="w-5 h-5" /> Prime Aktif Edildi</>
                                    ) : (
                                        <>299₺ / Ay ile Başla <Sparkles className="w-5 h-5" /></>
                                    )}
                                </button>
                            </motion.div>

                            <p className="text-[10px] text-gray-600 mt-6 font-medium">
                                İstediğiniz zaman iptal edebilirsiniz. İyzico güvencesiyle 256-bit şifrelenmiştir.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
