"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { purchases } from '@/native';
import { showToast } from '@/lib/utils';

// Prime: sadece gerçekten çalışan ayrıcalıklar listelenir (8.52). Satın alma uygulama mağazası üzerinden
// (Faz 6, RevenueCat); o zamana kadar düğme dürüstçe "çok yakında" der, ödeme simüle edilmez.
export function PremiumUpgradeModal({ isOpen: isOpenProp, onClose: onCloseProp }: { isOpen?: boolean, onClose?: () => void }) {
    const [isOpenInternal, setIsOpenInternal] = useState(false);

    // Support both controlled (props) and uncontrolled (event) modes
    const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenInternal;
    const handleClose = onCloseProp !== undefined ? onCloseProp : () => setIsOpenInternal(false);

    useEffect(() => {
        const handleOpen = () => setIsOpenInternal(true);
        window.addEventListener('open-premium-modal', handleOpen);
        return () => window.removeEventListener('open-premium-modal', handleOpen);
    }, []);

    const { user } = useAuth();
    const isPrime = !!user?.is_prime;

    // Telefon uygulamasında mağaza ürünleri (Prime abonelikleri)
    const canBuy = purchases.isSupported();
    const [offers, setOffers] = useState<purchases.StoreOffer[]>([]);
    const [busy, setBusy] = useState<string | null>(null);
    useEffect(() => {
        if (!isOpen || !canBuy || !user?.id) return;
        purchases.getOffers(user.id).then(list => setOffers(list.filter(o => o.kind === 'subscription'))).catch(() => setOffers([]));
    }, [isOpen, canBuy, user?.id]);

    const buy = async (productId: string) => {
        if (!user?.id) return;
        setBusy(productId);
        const r = await purchases.purchase(user.id, productId);
        setBusy(null);
        if (r === 'purchased') {
            showToast('Teşekkürler! Prime birkaç saniye içinde açılacak.', 'CheckCircle2', 'text-emerald-500 font-bold');
            handleClose();
        } else if (r === 'failed') {
            showToast('Satın alma tamamlanamadı, tekrar dene.', 'AlertCircle', 'text-red-500 font-bold');
        }
    };

    const restore = async () => {
        if (!user?.id) return;
        setBusy('restore');
        const ok = await purchases.restore(user.id);
        setBusy(null);
        showToast(ok ? 'Satın alımların kontrol edildi; aktif üyelik varsa birkaç saniye içinde açılır.' : 'Geri yükleme yapılamadı.', ok ? 'CheckCircle2' : 'AlertCircle', ok ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold');
    };

    const comparisonFeatures: { name: string; free: string | false; prime: string | true }[] = [
        { name: "Moffi AI asistanı", free: "Günde 5 mesaj", prime: "Günde 60 mesaj" },
        { name: "Her ay PawCoin hediyesi", free: false, prime: "500 PawCoin" },
        { name: "Seri kalkanı", free: "Haftada 1", prime: "Haftada 2" },
        { name: "Neon Aura ve Dark Metal profil çerçeveleri", free: false, prime: true },
        { name: "Profilinde Prime rozeti", free: false, prime: true },
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
                                Moffi'yi Prime olmadan da tamamen kullanabilirsin. Prime, asistanı daha çok kullanmak ve küçük ayrıcalıklar isteyenler için.
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

                            {isPrime ? (
                                <div className="w-full py-5 rounded-2xl font-bold text-sm bg-foreground/5 flex items-center justify-center gap-2">
                                    <Check className="w-5 h-5 text-[#D4AF37]" /> Prime üyeliğin aktif
                                </div>
                            ) : canBuy && offers.length > 0 ? (
                                <div className="w-full space-y-3">
                                    {offers.map(o => (
                                        <button key={o.productId} onClick={() => buy(o.productId)} disabled={!!busy}
                                            className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#FFD700] via-[#FDB931] to-[#D4AF37] text-black disabled:opacity-60 flex items-center justify-center gap-2">
                                            {busy === o.productId ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{o.title.replace(/\s*\(.*\)$/, '')} · {o.price}</>}
                                        </button>
                                    ))}
                                    <button onClick={restore} disabled={!!busy} className="w-full py-2 text-xs font-semibold text-secondary">
                                        {busy === 'restore' ? 'Kontrol ediliyor…' : 'Satın alımları geri yükle'}
                                    </button>
                                    <p className="text-[11px] text-secondary">Abonelik, iptal edilmedikçe her dönem otomatik yenilenir; mağaza ayarlarından istediğin zaman iptal edebilirsin.</p>
                                </div>
                            ) : (
                                <>
                                    <button disabled className="w-full py-5 rounded-2xl font-bold text-sm bg-foreground/10 text-foreground/60 cursor-not-allowed">
                                        Çok yakında
                                    </button>
                                    <p className="text-xs text-secondary mt-4">
                                        Prime, Moffi telefon uygulaması mağazalara çıktığında App Store ve Google Play üzerinden satın alınabilecek.
                                    </p>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
