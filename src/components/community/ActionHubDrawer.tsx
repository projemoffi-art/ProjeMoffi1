'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Zap, Wallet, QrCode, Users, Package, HeartPulse, Map, ChevronRight, Crown,
    Activity, Scale, Sparkles, PawPrint, ShieldAlert
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useHubData } from '@/hooks/useHubData';
import { PetSwitcher } from '../common/PetSwitcher';
import { usePet } from '@/context/PetContext';

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

    // Health Logic (Duplicate from Hub to ensure consistency in Kimliğim portal)
    const getPetPulse = (petId: any) => {
        if (!petId) return 78;
        const idStr = String(petId);
        const seed = idStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return 70 + (seed % 20);
    };

    const getPetAge = (pet: any) => {
        if (!pet) return "1.2";
        if (pet.birthday) {
            try {
                const months: Record<string, string> = {
                    'ocak': '01', 'subat': '02', 'mart': '03', 'nisan': '04', 'mayis': '05', 'haziran': '06',
                    'temmuz': '07', 'agustos': '08', 'eylul': '09', 'ekim': '10', 'kasim': '11', 'aralik': '12'
                };
                let bStr = pet.birthday.toLowerCase()
                    .replace('ı', 'i').replace('ş', 's').replace('ç', 'c').replace('ö', 'o').replace('ü', 'u').replace('ğ', 'g');
                let datePart = bStr;
                Object.keys(months).forEach(m => {
                    if (bStr.includes(m)) datePart = bStr.replace(m, months[m]);
                });
                const parts = datePart.match(/\d+/g);
                if (parts && parts.length === 3) {
                    const birth = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
                    if (!isNaN(birth.getTime())) {
                        return Math.abs((new Date().getTime() - birth.getTime()) / (1000 * 3600 * 24 * 365.25)).toFixed(1);
                    }
                }
            } catch (e) { console.error(e); }
        }
        return pet.age || (String(pet.id || "").length % 5 + 0.8).toFixed(1);
    };

    const identityActions = [
        { id: 'wallet', icon: Wallet, label: 'Moffi Pay Cüzdanım', sub: 'Bakiye ve Harcamalar', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { id: 'passport', icon: QrCode, label: 'Dijital Pet Pasaportu', sub: 'Resmi Kimlik Kaydı', color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { id: 'family', icon: Users, label: 'Aile ve Paylaşım', sub: 'Ortak Hesap Yönetimi', color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { id: 'orders', icon: Package, label: 'Market Siparişlerim', sub: 'Kargo Takibi', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { id: 'routes', icon: Map, label: 'Kayıtlı Rotalar', sub: 'Yürüyüş Geçmişi', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
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
                        className="fixed bottom-0 left-0 right-0 z-[7001] bg-background border-t border-card-border rounded-t-[3.5rem] p-8 pb-12 shadow-[0_-20px_100px_rgba(0,0,0,0.5)] max-h-[92vh] overflow-y-auto no-scrollbar"
                    >
                        {/* Apple Handle */}
                        <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-center cursor-pointer pt-2">
                            <div className="w-12 h-1.5 bg-foreground/10 rounded-full" />
                        </div>

                        {/* TITLE BAR (Sleek Identity Style) */}
                        <div className="flex justify-between items-center py-4 mb-2 mt-2">
                            <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                                    <Zap className="text-background w-6 h-6" />
                                 </div>
                                 <div>
                                    <h2 className="text-2xl font-black text-foreground tracking-tighter italic uppercase leading-none">Moffi Kimliğim</h2>
                                    <p className="text-[9px] text-accent font-black uppercase tracking-[0.2em] mt-1">Kişisel Erişim Portalı</p>
                                 </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <PetSwitcher />
                                <button 
                                    onClick={onClose}
                                    className="w-12 h-12 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center text-foreground active:scale-95 transition-all outline-none"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* PREMIUM STATUS BAR */}
                        {isPro && (
                            <div className="mb-8 p-5 rounded-[2rem] bg-accent/5 border border-accent/20 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                                    <Crown className="text-background w-5 h-5" />
                                </div>
                                <div>
                                    <h5 className="text-[11px] font-black text-accent uppercase italic">Premium Plus Status</h5>
                                    <p className="text-[9px] text-secondary font-bold uppercase tracking-widest">Tüm kimlik ve finans araçları yetkilendirildi.</p>
                                </div>
                            </div>
                        )}

                        {/* MOFFI HEALTH SUMMARY PANEL (RESTORED) */}
                        <div className="mb-8">
                            <div className="bg-card border border-card-border rounded-[2.5rem] p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        {activePet?.image || activePet?.avatar ? (
                                            <div className="w-10 h-10 rounded-xl border-2 border-accent/30 overflow-hidden shadow-lg">
                                                <img src={activePet.image || activePet.avatar} alt={activePet.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-background">
                                                <PawPrint size={20} />
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <h3 className="text-[12px] font-black text-foreground uppercase tracking-tight">{activePet?.name || "Pet"} Sağlık Durumu</h3>
                                            <span className="text-[8px] font-black text-accent uppercase tracking-[0.2em] opacity-80">Aktif Kimlik Takibi</span>
                                        </div>
                                    </div>
                                    {nextHealthAlert ? (
                                        <div className="px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30 animate-pulse">
                                            <span className="text-[8px] font-black text-red-400 uppercase">Kritik Aşı: {nextHealthAlert.daysLeft} Gün</span>
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                                            <span className="text-[8px] font-black text-emerald-400 uppercase">Stabil</span>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="flex flex-col items-center p-3 bg-foreground/5 rounded-2xl border border-foreground/5">
                                        <Scale className="text-accent mb-1" size={16} />
                                        <span className="text-sm font-black text-foreground italic">{activePet?.weight?.toString().replace(/[^0-9.]/g, '') || "12.4"} <small className="text-[8px] not-italic opacity-50">kg</small></span>
                                        <span className="text-[7px] font-bold text-secondary uppercase tracking-tighter mt-1">Kilo</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 bg-foreground/5 rounded-2xl border border-foreground/5">
                                        <Activity className="text-red-400 mb-1" size={16} />
                                        <span className="text-sm font-black text-foreground italic">{activePet ? getPetPulse(activePet.id) : 82} <small className="text-[8px] not-italic opacity-50">bpm</small></span>
                                        <span className="text-[7px] font-bold text-secondary uppercase tracking-tighter mt-1">Nabız</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 bg-foreground/5 rounded-2xl border border-foreground/5">
                                        <Sparkles className="text-yellow-400 mb-1" size={16} />
                                        <span className="text-sm font-black text-foreground italic">{getPetAge(activePet)} <small className="text-[8px] not-italic opacity-50">yıl</small></span>
                                        <span className="text-[7px] font-bold text-secondary uppercase tracking-tighter mt-1">Biyolojik</span>
                                    </div>
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
