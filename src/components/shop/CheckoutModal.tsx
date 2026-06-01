"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ShieldCheck, CreditCard, Apple, 
  Smartphone, CheckCircle2, Lock, ArrowRight,
  Sparkles, Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { paymentService } from "@/services/paymentService";
import { useAuth } from "@/context/AuthContext";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  plan: {
    id: string;
    name: string;
    price: string;
    features: string[];
  };
}

export function CheckoutModal({ isOpen, onClose, onSuccess, plan }: CheckoutModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'selection' | 'processing' | 'success'>('selection');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'google'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState("");

  const handlePayment = async () => {
    if (!user) return;
    setIsProcessing(true);
    setStep('processing');

    const result = await paymentService.completeSubscription(user.id, plan.id);

    if (result.success) {
      setOrderId(result.orderId || "");
      setStep('success');
      // Trigger a celebratory haptic if supported
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } else {
      setStep('selection');
      setIsProcessing(false);
      alert("Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isProcessing ? onClose : undefined}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#0A0A0E] border border-card-border rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(34,211,238,0.2)]"
          >
            {/* Header Gradient */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />

            {/* Close Button */}
            {step !== 'processing' && (
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 border border-card-border rounded-full text-white/40 hover:text-white transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="p-8 sm:p-12">
              {step === 'selection' && (
                <div className="space-y-8">
                  {/* Plan Badge */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 rotate-3">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">
                      Moffi <span className="text-cyan-400">Elite</span>
                    </h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.3em] mt-2">
                      Sınırsız Evren Deneyimi
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-white/5 border border-card-border rounded-[2rem] p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-400">Seçilen Plan</span>
                      <span className="text-sm font-black text-white uppercase italic">{plan.name}</span>
                    </div>
                    <div className="h-px bg-white/5 w-full" />
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-gray-400">Toplam Ödeme</span>
                      <div className="text-right">
                        <span className="text-4xl font-black text-white tracking-tighter">{plan.price}</span>
                        <span className="text-[10px] font-black text-gray-500 block">/ Aylık</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Ödeme Yöntemi</p>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setPaymentMethod('card')}
                        className={cn(
                          "py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all active:scale-95",
                          paymentMethod === 'card' ? "bg-card text-black border-white" : "bg-white/5 text-white/40 border-card-border"
                        )}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span className="text-[9px] font-black uppercase">Kart</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('apple')}
                        className={cn(
                          "py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all active:scale-95",
                          paymentMethod === 'apple' ? "bg-card text-black border-white" : "bg-white/5 text-white/40 border-card-border"
                        )}
                      >
                        <Apple className="w-5 h-5" />
                        <span className="text-[9px] font-black uppercase">Pay</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('google')}
                        className={cn(
                          "py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all active:scale-95",
                          paymentMethod === 'google' ? "bg-card text-black border-white" : "bg-white/5 text-white/40 border-card-border"
                        )}
                      >
                        <Smartphone className="w-5 h-5" />
                        <span className="text-[9px] font-black uppercase">Google</span>
                      </button>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button 
                    onClick={handlePayment}
                    className="w-full py-5 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                  >
                    Güvenle Öde
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="flex items-center justify-center gap-2 opacity-30">
                    <Lock className="w-3 h-3 text-white" />
                    <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">256-Bit SSL Şifreli Ödeme</span>
                  </div>
                </div>
              )}

              {step === 'processing' && (
                <div className="flex flex-col items-center py-20 text-center">
                  <div className="relative mb-10">
                    <div className="w-24 h-24 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck className="w-10 h-10 text-cyan-500" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase italic mb-4">İşlem Onaylanıyor</h2>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[280px]">
                    Bankanızla güvenli bir bağlantı kuruluyor. Lütfen pencereyi kapatmayın.
                  </p>
                  
                  {/* Fake Progress Indicator */}
                  <div className="mt-12 w-48 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                    <motion.div 
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-y-0 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                    />
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center py-10 text-center space-y-8">
                  <motion.div 
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,184,129,0.4)]"
                  >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </motion.div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white uppercase italic">Elite Evreni Aktif!</h2>
                    <p className="text-sm text-emerald-400 font-black uppercase tracking-widest">Ödeme Başarılı</p>
                  </div>

                  <div className="w-full bg-white/5 border border-card-border rounded-[2rem] p-6 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                      <span>Sipariş No</span>
                      <span className="text-white">#{orderId}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                      <span>Durum</span>
                      <span className="text-emerald-400">Tamamlandı</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Abonelik bilgileriniz e-posta adresinize gönderildi. Artık Moffi'nin tüm premium özelliklerine erişebilirsiniz.
                  </p>

                  <button 
                    onClick={() => {
                      if (onSuccess) onSuccess();
                      onClose();
                    }}
                    className="w-full py-5 bg-card text-black rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all"
                  >
                    Macerayı Başlat
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Branding */}
            <div className="p-8 border-t border-card-border bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Moffi Secure Payment</span>
              </div>
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Iyzico_logo.png" className="h-4 opacity-30 grayscale invert" alt="iyzico" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
