"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, CalendarClock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { device, platform, purchases } from '@/native';
import { showToast } from '@/lib/utils';

// Prime aboneliği App Store / Google Play üzerinden yürür (8.61): yenileme ve iptal mağazada yapılır,
// Moffi sadece bitiş tarihini gösterir. Tarih, mağaza bildirimiyle sunucuda güncellenir (prime_until).
const STORE_SUBSCRIPTIONS: Record<'ios' | 'android', string> = {
    ios: 'https://apps.apple.com/account/subscriptions',
    android: 'https://play.google.com/store/account/subscriptions',
};

export function SubscriptionManagementModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-subscription-management', handleOpen);
        return () => window.removeEventListener('open-subscription-management', handleOpen);
    }, []);

    if (!isOpen) return null;

    const until = (user as { prime_until?: string | null } | null)?.prime_until;
    const p = platform();
    const manageUrl = p === 'ios' || p === 'android' ? STORE_SUBSCRIPTIONS[p] : null;

    const restore = async () => {
        if (!user?.id) return;
        setRestoring(true);
        const ok = await purchases.restore(user.id);
        setRestoring(false);
        showToast(ok ? 'Satın alımların kontrol edildi.' : 'Geri yükleme yapılamadı.', ok ? 'CheckCircle2' : 'AlertCircle', ok ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold');
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

                <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="relative w-full max-w-md bg-background rounded-[2rem] shadow-2xl overflow-hidden z-10 p-6 space-y-5">
                    <button onClick={() => setIsOpen(false)} aria-label="Kapat"
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-secondary">
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 flex items-center justify-center">
                            <Crown className="w-6 h-6 text-[#D4AF37]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Moffi Prime</h2>
                            <p className="text-sm text-secondary">{user?.is_prime ? 'Üyeliğin aktif' : 'Aktif üyelik yok'}</p>
                        </div>
                    </div>

                    {until && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-foreground/5">
                            <CalendarClock className="w-5 h-5 text-secondary shrink-0" />
                            <p className="text-sm text-foreground">
                                Dönem sonu: <b>{new Date(until).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</b>
                            </p>
                        </div>
                    )}

                    <p className="text-sm text-secondary leading-relaxed">
                        Abonelik {p === 'ios' ? 'App Store' : p === 'android' ? 'Google Play' : 'App Store / Google Play'} üzerinden yürür.
                        Yenilemeyi kapatmak ya da planı değiştirmek için mağazanın abonelik sayfasını kullan; iptal etsen de dönem sonuna kadar
                        Prime ayrıcalıkların sürer.
                    </p>

                    {manageUrl ? (
                        <div className="space-y-2">
                            <button onClick={() => device.openExternal(manageUrl)}
                                className="w-full py-3.5 rounded-2xl bg-foreground text-background font-semibold text-sm">
                                Aboneliği mağazada yönet
                            </button>
                            <button onClick={restore} disabled={restoring} className="w-full py-2 text-xs font-semibold text-secondary">
                                {restoring ? 'Kontrol ediliyor…' : 'Satın alımları geri yükle'}
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-secondary">Aboneliği, satın aldığın telefondaki mağaza ayarlarından yönetebilirsin.</p>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
