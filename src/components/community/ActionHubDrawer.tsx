'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Zap, Wallet, Users, Package, HeartPulse, Map, ChevronRight, Crown,
    Activity, Scale, Sparkles, PawPrint, ShieldAlert
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useHubData } from '@/hooks/useHubData';
import { PetSwitcher } from '../common/PetSwitcher';
import { usePet } from '@/context/PetContext';
import { ageText, daysLeftText } from '@/lib/health/derive';
import { todayKey } from '@/lib/appointmentTime';

interface ActionHubDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (id: string) => void;
}

export function ActionHubDrawer({ 
    isOpen, 
    onClose, 
    onNavigate
}: ActionHubDrawerProps) {
    const { activePet } = usePet();
    const { isPro, nextHealthAlert } = useHubData();

    const weightNumber = (() => {
        const n = parseFloat(String(activePet?.weight ?? '').replace(',', '.'));
        return Number.isFinite(n) && n > 0 ? n.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) : null;
    })();
    const petAge = activePet ? ageText(activePet.birthday, activePet.age, todayKey()) : null;

    const identityActions = [
        { id: 'carehub', icon: HeartPulse, label: 'Sağlık Merkezi', sub: 'Aşı, ilaç, kilo ve belgeler', color: 'text-red-400', bg: 'bg-red-500/10' },
        { id: 'wallet', icon: Wallet, label: 'Moffi Pay Cüzdanım', sub: 'Bakiye ve Harcamalar', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { id: 'family', icon: Users, label: 'Aile ve Paylaşım', sub: 'Ortak Hesap Yönetimi', color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { id: 'orders', icon: Package, label: 'Market Siparişlerim', sub: 'Kargo Takibi', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { id: 'activity', icon: Activity, label: 'Yürüyüş ve Aktivite', sub: 'Egzersiz Geçmişi', color: 'text-rose-400', bg: 'bg-rose-500/10' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose} 
                        className="fixed inset-0 z-[7000] bg-black/85 backdrop-blur-2xl" 
                    />
                    
                    {/* Drawer */}
                    <motion.div 
                        initial={{ y: "100%" }} 
                        animate={{ y: 0 }} 
                        exit={{ y: "100%" }} 
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose();
                        }}
                        className="fixed bottom-0 left-0 right-0 z-[7001] bg-background border-t border-card-border rounded-t-[2.5rem] sm:rounded-t-[3.5rem] p-5 sm:p-8 pb-10 sm:pb-12 shadow-[0_-20px_100px_rgba(0,0,0,0.5)] max-h-[92vh] overflow-y-auto no-scrollbar"
                    >
                        {/* Apple Handle */}
                        <div className="absolute top-0 left-0 right-0 h-8 sm:h-10 flex items-center justify-center cursor-pointer pt-2">
                            <div className="w-10 sm:w-12 h-1 sm:h-1.5 bg-foreground/10 rounded-full" />
                        </div>

                        {/* TITLE BAR (Sleek Identity Style) */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 mb-2 mt-2 gap-4 sm:gap-0">
                            <div className="flex items-center gap-3">
                                 <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                                    <Zap className="text-background w-5 h-5 sm:w-6 sm:h-6" />
                                 </div>
                                 <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tighter italic uppercase leading-none">Moffi Kimliğim</h2>
                                    <p className="text-[8px] sm:text-[9px] text-accent font-black uppercase tracking-[0.2em] mt-1">Kişisel Erişim Portalı</p>
                                 </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                                <PetSwitcher />
                                <button 
                                    onClick={onClose}
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center text-foreground active:scale-95 transition-all outline-none"
                                >
                                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        </div>

                        {/* PREMIUM STATUS BAR */}
                        {isPro && (
                            <div className="mb-6 sm:mb-8 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] bg-accent/5 border border-accent/20 flex items-center gap-3 sm:gap-4">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                                    <Crown className="text-background w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div>
                                    <h5 className="text-[10px] sm:text-[11px] font-black text-accent uppercase italic">Premium Plus Status</h5>
                                    <p className="text-[8px] sm:text-[9px] text-secondary font-bold uppercase tracking-widest">Tüm araçlar yetkilendirildi.</p>
                                </div>
                            </div>
                        )}

                        {/* MOFFI HEALTH SUMMARY PANEL (RESTORED) */}
                        <div className="mb-6 sm:mb-8">
                            <div className="bg-card border border-card-border rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-6 shadow-moffi-card">
                                <div className="flex items-center justify-between mb-5 sm:mb-6">
                                    <div className="flex items-center gap-3">
                                        {activePet?.image || activePet?.avatar ? (
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 border-accent/30 overflow-hidden shadow-lg">
                                                <img src={activePet.image || activePet.avatar} alt={activePet.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent flex items-center justify-center text-background">
                                                <PawPrint size={18} />
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <h3 className="text-[11px] sm:text-[12px] font-black text-foreground uppercase tracking-tight">{activePet?.name || "Pet"} Sağlık</h3>
                                            <span className="text-[7px] sm:text-[8px] font-black text-accent uppercase tracking-[0.2em] opacity-80">Aktif Kimlik Takibi</span>
                                        </div>
                                    </div>
                                    {nextHealthAlert ? (
                                        <div className={`px-2.5 py-1 rounded-full border ${nextHealthAlert.daysLeft < 0 ? 'bg-red-500/20 border-red-500/30' : 'bg-amber-500/15 border-amber-500/30'}`}>
                                            <span className={`text-[8px] font-black ${nextHealthAlert.daysLeft < 0 ? 'text-red-400' : 'text-amber-500'}`}>{daysLeftText(nextHealthAlert.daysLeft)}</span>
                                        </div>
                                    ) : (
                                        <div className="px-2.5 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                                            <span className="text-[8px] font-black text-emerald-500">Güncel</span>
                                        </div>
                                    )}
                                </div>
                                {/* Gerçek veriler: Sağlık Karnesi'ndeki son kilo, doğum tarihinden yaş, sıradaki sağlık işi. */}
                                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                    <div className="flex flex-col items-center p-2.5 sm:p-3 bg-foreground/5 rounded-xl sm:rounded-2xl border border-foreground/5">
                                        <Scale className="text-accent mb-1" size={14} />
                                        <span className="text-xs sm:text-sm font-black text-foreground">{weightNumber ?? '—'} {weightNumber != null && <small className="text-[8px] opacity-50">kg</small>}</span>
                                        <span className="text-[8px] font-bold text-secondary mt-1">Kilo</span>
                                    </div>
                                    <div className="flex flex-col items-center p-2.5 sm:p-3 bg-foreground/5 rounded-xl sm:rounded-2xl border border-foreground/5">
                                        <Sparkles className="text-yellow-400 mb-1" size={14} />
                                        <span className="text-xs sm:text-sm font-black text-foreground text-center">{petAge || '—'}</span>
                                        <span className="text-[8px] font-bold text-secondary mt-1">Yaş</span>
                                    </div>
                                    <button onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'carehub' })); }}
                                        className="flex flex-col items-center p-2.5 sm:p-3 bg-foreground/5 rounded-xl sm:rounded-2xl border border-foreground/5">
                                        <Activity className="text-red-400 mb-1" size={14} />
                                        <span className="text-[10px] font-black text-foreground text-center leading-tight line-clamp-2">{nextHealthAlert?.name || 'Sıradaki iş yok'}</span>
                                        <span className="text-[8px] font-bold text-secondary mt-1">Sıradaki</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* IDENTITY GRID/LIST */}
                        <div className="space-y-3">
                            {identityActions.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => { 
                                        onNavigate(item.id); 
                                        window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: item.id }));
                                        onClose(); 
                                    }}
                                    className="w-full flex items-center justify-between p-5 rounded-[2.2rem] bg-card border border-card-border hover:bg-foreground/[0.05] transition-all active:scale-[0.98] group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-card-border transition-transform group-hover:scale-110", item.bg)}>
                                            <item.icon className={cn("w-6 h-6", item.color)} />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-[12px] font-black text-foreground uppercase tracking-tight italic">{item.label}</h4>
                                            <p className="text-[9px] text-secondary font-bold uppercase tracking-widest">{item.sub}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-foreground/10 group-hover:text-foreground/40 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
