"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Package, Truck, MapPin, CheckCircle2, 
  Clock, Navigation2, ChevronRight, Share2 
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Mapbox dynamic import
const MapboxLiveMap = dynamic(() => import('@/components/maps/MapboxLiveMap'), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-[#111] animate-pulse rounded-3xl" /> 
});

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  status: 'preparing' | 'shipped' | 'out_for_delivery' | 'delivered';
}

const steps = [
  { id: 'preparing', label: 'Hazırlanıyor', sub: 'Moffi Deposu', icon: Package },
  { id: 'shipped', label: 'Yola Çıktı', sub: 'Transfer Merkezi', icon: Truck },
  { id: 'out_for_delivery', label: 'Dağıtımda', sub: 'Mahallenizde', icon: Navigation2 },
  { id: 'delivered', label: 'Teslim Edildi', sub: 'Kapınızda', icon: CheckCircle2 },
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ isOpen, onClose, orderId, status }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const idx = steps.findIndex(s => s.id === status);
    setCurrentStepIndex(idx > -1 ? idx : 0);
  }, [status]);

  // Simulated courier position for the hybrid map
  const courierPos: [number, number] = [41.0082, 28.9784]; // Istanbul center for demo
  const userPos: [number, number] = [41.0422, 29.0084]; // Slightly away

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-[600px]"
        >
          {/* Left: Map (Hybrid Component) */}
          <div className="relative w-full md:w-1/2 h-1/2 md:h-full bg-[#111]">
            <MapboxLiveMap 
                userPos={userPos}
                deliveryPos={courierPos}
                isTracking={true}
                hideInternalUI={true}
            />
            
            {/* Map Overlay Info */}
            <div className="absolute top-6 left-6 right-6 z-10 flex flex-col gap-2">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                            <Truck className="text-black" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Kurye</p>
                            <p className="text-sm font-bold text-white">Moffi Express ⚡️</p>
                        </div>
                    </div>
                    <div className="text-right">
                         <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Tahmini Varış</p>
                         <p className="text-sm font-bold text-[var(--moffi-blue)]">14 Dakika</p>
                    </div>
                </div>
            </div>

            {/* Bottom Map Controls */}
            <div className="absolute bottom-6 left-6 flex gap-2 z-10">
                <button className="w-10 h-10 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white">
                    <Navigation2 size={18} />
                </button>
            </div>
          </div>

          {/* Right: Timeline & Info */}
          <div className="w-full md:w-1/2 flex flex-col p-8 overflow-y-auto custom-scrollbar bg-black">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-widest">Sipariş Takibi</p>
                <p className="text-lg font-bold text-white">#{orderId.split('-')[1]?.toUpperCase() || 'MFF-9421'}</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--text-secondary)] hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Steps Timeline */}
            <div className="space-y-0 relative flex-1">
              {/* Connecting Line */}
              <div className="absolute left-[21px] top-6 bottom-6 w-[2px] bg-white/5" />
              <div 
                className="absolute left-[21px] top-6 w-[2px] bg-[var(--moffi-blue)] transition-all duration-1000"
                style={{ height: `${(currentStepIndex / (steps.length - 1)) * 90}%` }}
              />

              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = idx <= currentStepIndex;
                const isActive = idx === currentStepIndex;

                return (
                  <div key={step.id} className={`flex items-start gap-6 pb-10 last:pb-0 transition-all ${isCompleted ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-[var(--moffi-blue)] text-white' : 'bg-[#111] text-gray-600'}`}>
                      <Icon size={18} />
                      {isActive && (
                        <motion.div 
                          layoutId="active-step-ring"
                          className="absolute inset-[-4px] border border-[var(--moffi-blue)] rounded-full animate-ping"
                        />
                      )}
                    </div>
                    <div>
                      <p className={`font-bold transition-all ${isActive ? 'text-white text-lg' : 'text-gray-400 text-sm'}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">{step.sub}</p>
                      {isActive && (
                         <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--moffi-blue)] font-bold">
                            <Clock size={12} />
                            ŞİMDİ GÜNCELLENDİ
                         </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-8 pt-8 border-t border-white/5 flex gap-3">
              <button className="flex-1 h-12 bg-white/5 hover:bg-white/10 rounded-2xl text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
                <Share2 size={16} />
                SİPARİŞİ PAYLAŞ
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
