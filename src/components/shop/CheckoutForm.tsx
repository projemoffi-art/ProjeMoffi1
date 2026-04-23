"use client";

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, CreditCard } from 'lucide-react';

interface CheckoutFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ amount, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Bir hata oluştu.");
      } else {
        setMessage("BEKLENMEDİK BİR HATA OLUŞTU.");
      }
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Lock size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Güvenli Ödeme</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-5 bg-[rgba(255,255,255,0.1)] rounded" />
            <div className="w-8 h-5 bg-[rgba(255,255,255,0.1)] rounded" />
            <div className="w-8 h-5 bg-[rgba(255,255,255,0.1)] rounded" />
          </div>
        </div>

        <PaymentElement 
          id="payment-element" 
          options={{
            layout: 'tabs',
          }}
        />

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center"
          >
            {message}
          </motion.div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button
          disabled={isLoading || !stripe || !elements}
          id="submit"
          className="w-full h-14 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <ShieldCheck size={20} />
              {amount} TL ÖDE
            </>
          )}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full h-12 bg-transparent text-[var(--text-secondary)] font-medium rounded-2xl hover:bg-[rgba(255,255,255,0.05)] transition-all"
        >
          İptal Et
        </button>
      </div>

      <p className="text-[10px] text-center text-[var(--text-tertiary)] opacity-50 px-8">
        Ödemeniz 128-bit SSL sertifikası ile %100 güvence altındadır. 
        Kredi kartı bilgileriniz Moffi tarafından asla saklanmaz.
      </p>
    </form>
  );
};
