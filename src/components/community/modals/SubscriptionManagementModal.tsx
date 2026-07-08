"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, X, ChevronRight, AlertTriangle, Loader2, CalendarClock } from 'lucide-react';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/context/AuthContext';

export function SubscriptionManagementModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [subStatus, setSubStatus] = useState<any>(null);
    const { user, refreshUser } = useAuth();

    useEffect(() => {
        const handleOpen = async () => {
            setIsOpen(true);
            setIsLoading(true);
            if (user?.id) {
                const status = await paymentService.getSubscriptionStatus(user.id);
                setSubStatus(status);
            }
            setIsLoading(false);
        };
        window.addEventListener('open-subscription-management', handleOpen);
        return () => window.removeEventListener('open-subscription-management', handleOpen);
    }, [user?.id]);

    const handleCancel = async () => {
        if (!user?.id) return;
        if (!window.confirm("Aboneliğinizi iptal etmek istediğinize emin misiniz? Fatura dönemi sonuna kadar haklarınız devam edecektir.")) return;
        
        setIsCancelling(true);
        const result = await paymentService.cancelSubscription(user.id);
        if (result.success) {
            window.dispatchEvent(new CustomEvent('moffi-toast', { detail: { message: result.message, icon: 'Check' } }));
            const newStatus = await paymentService.getSubscriptionStatus(user.id);
            setSubStatus(newStatus);
            if (refreshUser) refreshUser();
        } else {
            window.dispatchEvent(new CustomEvent('moffi-toast', { detail: { message: result.message || 'Hata oluştu.', icon: 'AlertTriangle' } }));
        }
        setIsCancelling(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
                
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden z-10"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-3xl rounded-full" />
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/40 transition-colors z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        
                        <div className="w-20 h-20 bg-white/20 rounded-3xl mx-auto flex items-center justify-center mb-4 backdrop-blur-md shadow-lg border border-white/20">
                            <Crown className="w-10 h-10 text-white drop-shadow-md" />
                        </div>
                        
                        <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                            Moffi Prime Aktif <Sparkles className="w-5 h-5 text-yellow-300" />
                        </h2>
                        <p className="text-green-100 text-sm mt-2 opacity-90">Sistemin en üst düzey özelliklerine sahipsiniz.</p>
                    </div>

                    {/* Content */}
                    <div className="p-6 bg-gray-50/50">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                                <span className="text-sm font-medium text-gray-500">Abonelik verileriniz getiriliyor...</span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Billing Details */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                                        <CalendarClock className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800">Mevcut Planınız</h4>
                                        <p className="text-xs text-gray-500 font-medium mt-1">Aylık Bireysel Prime (299 ₺)</p>
                                    </div>
                                </div>

                                {/* Status Info */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-semibold text-gray-600">Fatura Durumu</span>
                                        {subStatus?.will_cancel ? (
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-600 px-2 py-1 rounded-md">İptal Edildi</span>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-600 px-2 py-1 rounded-md">Otomatik Yenileme Aktif</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                                        <span className="text-sm font-semibold text-gray-600">Sonraki Fatura Tarihi</span>
                                        <span className="text-sm font-bold text-gray-800">
                                            {subStatus?.next_billing_date ? new Date(subStatus.next_billing_date).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                                        </span>
                                    </div>
                                    
                                    {subStatus?.will_cancel && (
                                        <div className="mt-4 flex items-start gap-3 p-3 bg-blue-50 rounded-xl text-blue-800">
                                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                            <p className="text-xs font-medium leading-relaxed">
                                                Aboneliğinizi iptal ettiniz. Son fatura tarihinize kadar tüm Prime özelliklerini kullanmaya devam edebilirsiniz.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                {!subStatus?.will_cancel && (
                                    <button 
                                        onClick={handleCancel}
                                        disabled={isCancelling}
                                        className="w-full py-4 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : "Aboneliği İptal Et"}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
