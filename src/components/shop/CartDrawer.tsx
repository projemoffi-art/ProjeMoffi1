"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag, Plus, Minus, CreditCard, ChevronRight } from 'lucide-react';
import { useShop } from '@/hooks/useShop';
import { ShopCartItem, ShopProduct } from '@/services/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
  const { cart, removeFromCart, updateQuantity, totalPrice, isLoading } = useShop();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-[101] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--moffi-blue)] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(91,77,157,0.3)]">
                  <ShoppingBag size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Sepetim</h2>
                  <p className="text-xs text-[var(--text-tertiary)]">{cart.length} Ürün</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-all text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ShoppingBag size={48} className="mb-4" />
                  <p className="text-lg font-bold">Sepetiniz Boş</p>
                  <p className="text-sm">Hemen alışverişe başlayın!</p>
                </div>
              ) : (
                cart.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-4 group"
                  >
                    <div className="w-20 h-20 bg-black/40 rounded-xl flex items-center justify-center text-3xl border border-white/5 relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent" />
                       <span className="relative z-10">📦</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-sm text-white line-clamp-1">{item.product?.name || 'Ürün'}</h4>
                        <p className="text-xs text-[var(--text-tertiary)]">{item.product?.brand?.name || 'Premium'}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[var(--moffi-blue)]">{item.product?.price || 0} TL</p>
                        
                        <div className="flex items-center gap-3 bg-black/40 rounded-lg p-1 border border-white/5">
                          <button 
                            onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                            className="p-1 hover:bg-white/10 rounded transition-all text-white/50"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                             onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 hover:bg-white/10 rounded transition-all text-white/50"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-500/50 hover:text-red-500 transition-all self-start"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer / Summary */}
            {cart.length > 0 && (
              <div className="p-8 bg-[#0d0d0d] border-t border-white/5 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-[var(--text-tertiary)]">
                    <span>Ara Toplam</span>
                    <span>{totalPrice} TL</span>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-400 font-medium">
                    <span>Kargo</span>
                    <span>ÜCRETSİZ</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-white pt-2">
                    <span>Toplam</span>
                    <span>{totalPrice} TL</span>
                  </div>
                </div>

                <button
                  onClick={onCheckout}
                  disabled={isLoading}
                  className="w-full h-14 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  <CreditCard size={20} />
                  ÖDEMEYE GEÇ
                  <ChevronRight size={20} className="ml-auto opacity-30" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
