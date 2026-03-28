'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ShieldAlert, BadgeCheck, Heart, 
    Bell, Coins, Phone, PhoneCall, 
    MessageCircle, AlertTriangle, Check, 
    ChevronRight, ChevronLeft, Save, Info, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SOSCommandCenterProps {
    isOpen: boolean;
    onClose: () => void;
    pet: any;
    sosData: any;
    onUpdate: (newSosData: any) => void;
}

export function SOSCommandCenter({ isOpen, onClose, pet, sosData, onUpdate }: SOSCommandCenterProps) {
    const [localSos, setLocalSos] = useState(sosData || {
        status: 'safe',
        sosConfig: {
            showPhoneNumber: true,
            allowProxyCalls: true,
            allowAnonymousMessaging: true,
            criticalHealthAlert: "",
            emergencyMessage: "Lütfen bana yardım edin, ailemi bulamıyorum.",
            rewardAmount: 0,
            rewardCurrency: "TL"
        }
    });

    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'status' | 'config' | 'preview'>('status');

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate premium save delay
        await new Promise(r => setTimeout(r, 1200));
        onUpdate(localSos);
        setIsSaving(false);
        onClose();
    };

    const isLost = localSos.status === 'lost';

    const handleBack = () => {
        if (activeTab !== 'status') {
            setActiveTab('status');
        } else {
            onClose();
        }
    };

    if (!pet) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[2500] bg-black/80 backdrop-blur-3xl flex flex-col justify-end"
                    onClick={onClose}
                >
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 32, stiffness: 300 }}
                        className="w-full h-[90vh] bg-[#0A0A0E] rounded-t-[3.5rem] border-t border-white/10 flex flex-col overflow-hidden shadow-[0_-20px_60px_rgba(0,0,0,0.8)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-[#0A0A0E]/80 backdrop-blur-md sticky top-0 z-50">
                            <button onClick={handleBack} className="flex items-center gap-1 text-white/40 font-bold text-xs uppercase tracking-widest hover:text-white transition-all active:scale-95 group">
                                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                {activeTab === 'status' ? "Vazgeç" : "Geri"}
                            </button>
                            <div className="flex flex-col items-center">
                                <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">Harekat Merkezi</h2>
                                <p className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mt-0.5">Moffi Pet-ID v2.0</p>
                            </div>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-gray-200 disabled:opacity-50 transition-all active:scale-95"
                            >
                                {isSaving ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : "Kaydet"}
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="px-8 py-4 flex gap-2 border-b border-white/5">
                            {[
                                { id: 'status', label: 'Durum', icon: ShieldAlert },
                                { id: 'config', label: 'Ayarlar', icon: Sparkles },
                                { id: 'preview', label: 'Önizleme', icon: Bell },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all border",
                                        activeTab === tab.id 
                                            ? "bg-white/10 border-white/20 text-white" 
                                            : "bg-transparent border-transparent text-white/30 hover:text-white/60"
                                    )}
                                >
                                    <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-cyan-400" : "")} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Body Content */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10 pb-40">

                            {/* TAB: STATUS MANAGEMENT */}
                            {activeTab === 'status' && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                    <div className="flex flex-col items-center text-center">
                                        <div className={cn(
                                            "w-24 h-24 rounded-[2rem] p-1 mb-6 relative",
                                            isLost ? "bg-red-500" : "bg-cyan-500"
                                        )}>
                                            <img src={pet.avatar} className="w-full h-full object-cover rounded-[1.7rem]" />
                                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-black border-2 border-white/10 flex items-center justify-center">
                                                {isLost ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <BadgeCheck className="w-4 h-4 text-cyan-400" />}
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-black text-white tracking-tight italic uppercase">{pet.name}</h3>
                                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Pet-ID Durum Kontrolü</p>
                                    </div>

                                    {/* GIANT STATUS TOGGLE */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <button 
                                            onClick={() => setLocalSos((prev: any) => ({...prev, status: isLost ? 'safe' : 'lost'}))}
                                            className={cn(
                                                "w-full p-8 rounded-[3rem] border transition-all flex flex-col items-center text-center gap-4 relative overflow-hidden group",
                                                isLost 
                                                    ? "bg-red-500 border-red-400 shadow-[0_0_50px_rgba(239,68,68,0.3)]" 
                                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110",
                                                isLost ? "bg-white text-red-500" : "bg-white/10 text-white/40"
                                            )}>
                                                <AlertTriangle className={cn("w-8 h-8", isLost ? "animate-pulse" : "")} />
                                            </div>
                                            <div>
                                                <h4 className={cn("text-xl font-black italic uppercase", isLost ? "text-white" : "text-white/40")}>
                                                    {isLost ? "Kayıp Alarmı Aktif!" : "Kayıp Alarmı Kapalı"}
                                                </h4>
                                                <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1", isLost ? "text-red-100" : "text-white/20")}>
                                                    {isLost ? "Künye EMERGENCY modunda çalışıyor" : "Künye NORMAL profilini gösteriyor"}
                                                </p>
                                            </div>
                                            {isLost && (
                                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                                            )}
                                        </button>

                                        <div className="bg-white/5 rounded-3xl p-5 border border-white/5 flex items-start gap-4">
                                            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-white/50 leading-relaxed font-bold">
                                                Durumu <span className="text-white font-black italic">"KAYIP"</span> olarak değiştirdiğinizde, künyeyi tarayan her kullanıcı otomatik olarak acil iletişim butonlarını ve sağlık uyarılarını görür. Ayrıca her taramada size anlık konum bildirimi gelir.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB: CONFIGURATION */}
                            {activeTab === 'config' && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                    {/* REWARD SECTION */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">Ödül ve Motivasyon</h4>
                                        <div className="bg-[#1C1C1E] rounded-[2.5rem] border border-white/10 p-6 flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-400">
                                                <Coins className="w-8 h-8" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Ödül Bedeli</p>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number"
                                                        value={localSos.sosConfig.rewardAmount}
                                                        onChange={(e) => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, rewardAmount: Number(e.target.value)}}))}
                                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-32 text-xl font-black text-white outline-none focus:border-cyan-500/50"
                                                        placeholder="0"
                                                    />
                                                    <select 
                                                        value={localSos.sosConfig.rewardCurrency}
                                                        onChange={(e) => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, rewardCurrency: e.target.value}}))}
                                                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-black text-white outline-none"
                                                    >
                                                        <option value="TL">TL</option>
                                                        <option value="USD">$</option>
                                                        <option value="EUR">€</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* MESSAGING AND ALERTS */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">İletişim Mesajları</h4>
                                        <div className="bg-[#1C1C1E] rounded-[2.5rem] border border-white/10 overflow-hidden divide-y divide-white/5">
                                            <div className="p-6 space-y-3">
                                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest block ml-1">Kayıp Acil Mesajı</label>
                                                <textarea 
                                                    value={localSos.sosConfig.emergencyMessage}
                                                    onChange={(e) => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, emergencyMessage: e.target.value}}))}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white font-medium outline-none focus:border-red-500/30 h-24 resize-none"
                                                    placeholder="Bulucuya petiniz hakkında bilgi verin..."
                                                />
                                            </div>
                                            <div className="p-6 space-y-3">
                                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest block ml-1">Kritik Sağlık Uyarısı</label>
                                                <textarea 
                                                    value={localSos.sosConfig.criticalHealthAlert}
                                                    onChange={(e) => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, criticalHealthAlert: e.target.value}}))}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-red-400 font-bold outline-none focus:border-red-500/50 h-20 resize-none"
                                                    placeholder="Örn: Piliç alerjisi var! Sadece su verin..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* PRIVACY TOGGLES */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">Güvenlik ve Gizlilik</h4>
                                        <div className="bg-[#1C1C1E] rounded-[3rem] border border-white/10 p-2 divide-y divide-white/5">
                                            {[
                                                { id: 'showPhoneNumber', label: 'Telefon Numaram Görünsün', icon: Phone, color: 'text-cyan-400' },
                                                { id: 'allowProxyCalls', label: 'Moffi Güvenli Arama', icon: PhoneCall, color: 'text-emerald-400' },
                                                { id: 'allowAnonymousMessaging', label: 'Anonim Mesajlaşma', icon: MessageCircle, color: 'text-purple-400' },
                                            ].map(item => (
                                                <div key={item.id} className="flex items-center justify-between p-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                            <item.icon className={cn("w-5 h-5", item.color)} />
                                                        </div>
                                                        <span className="text-xs font-bold text-white/80">{item.label}</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, [item.id]: !prev.sosConfig[item.id]}}))}
                                                        className={cn(
                                                            "w-12 h-6 rounded-full relative transition-all duration-300",
                                                            localSos.sosConfig[item.id] ? "bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "bg-white/10"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md",
                                                            localSos.sosConfig[item.id] ? "right-1" : "left-1"
                                                        )} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB: PREVIEW */}
                            {activeTab === 'preview' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    <div className="text-center">
                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4">Canlı Künye Önizlemesi</h4>
                                        <div className="relative mx-auto w-full max-w-[280px] aspect-[9/17.5] bg-black rounded-[3rem] border-[6px] border-[#1C1C1E] overflow-hidden shadow-2xl">
                                            {/* SIMULATED MIN-BROWSER FOR PREVIEW */}
                                            <div className="w-full h-full bg-black flex flex-col items-center p-4 pt-10 text-center">
                                                <div className={cn("w-20 h-20 rounded-2xl mb-4 border-2 p-0.5", isLost ? "border-red-500" : "border-cyan-500")}>
                                                    <img src={pet.avatar} className="w-full h-full object-cover rounded-[14px]" />
                                                </div>
                                                <h5 className="text-lg font-black text-white">{pet.name}</h5>
                                                {isLost ? (
                                                    <div className="mt-4 w-full bg-red-500/20 border border-red-500/30 rounded-2xl p-3">
                                                        <ShieldAlert className="w-5 h-5 text-red-500 mx-auto mb-2" />
                                                        <p className="text-[10px] font-bold text-red-200 uppercase tracking-widest leading-none mb-1">Kayıp Alarmı!</p>
                                                        <p className="text-[8px] text-white/60 line-clamp-3">{localSos.sosConfig.emergencyMessage}</p>
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 w-full bg-white/5 rounded-2xl p-3">
                                                        <Heart className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                                                        <p className="text-[10px] font-bold text-white uppercase tracking-widest leading-none mb-1">Ben Güvendeyim</p>
                                                        <p className="text-[8px] text-white/40 italic">"Sahibim yanımda..."</p>
                                                    </div>
                                                )}
                                                
                                                {isLost && (
                                                    <div className="mt-4 w-full space-y-2">
                                                        <div className="w-full h-6 bg-white rounded-lg flex items-center justify-center gap-1.5">
                                                            <PhoneCall className="w-3 h-3 text-emerald-600" />
                                                            <span className="text-[8px] font-black text-black">Sahibini Ara</span>
                                                        </div>
                                                        <div className="w-full h-6 bg-white/10 rounded-lg" />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Notch */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#1C1C1E] rounded-b-2xl" />
                                        </div>
                                        <p className="text-[10px] text-white/20 mt-4 font-bold uppercase tracking-widest">Bu alan künyeyi tarayan birinin göreceği arayüzdür.</p>
                                    </div>
                                </motion.div>
                            )}

                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
