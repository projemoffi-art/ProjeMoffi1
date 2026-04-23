'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ShieldAlert, BadgeCheck, Heart, 
    Bell, Coins, Phone, PhoneCall, 
    MessageCircle, AlertTriangle, Check, 
    ChevronRight, ChevronLeft, Save, Info, Sparkles, MapPin, 
    ShieldCheck, Target, Zap, Clock, Radar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/apiService';

import { usePet } from '@/context/PetContext';

interface SOSCommandCenterProps {
    isOpen: boolean;
    onClose: () => void;
    pet: any;
    allPets?: any[];
    onPetChange?: (pet: any) => void;
    sosData: any;
    onUpdate: (newSosData: any) => void;
}

export function SOSCommandCenter({ isOpen, onClose, pet, allPets = [], onPetChange, sosData, onUpdate }: SOSCommandCenterProps) {
    const { updatePet } = usePet();
    const [localSos, setLocalSos] = useState({
        status: pet?.is_lost ? 'lost' : 'safe',
        sosConfig: {
            showPhoneNumber: !pet?.sos_settings?.secure_proxy_only,
            allowProxyCalls: pet?.sos_settings?.secure_proxy_only || true,
            allowAnonymousMessaging: true,
            criticalHealthAlert: pet?.sos_settings?.critical_health_note || "",
            emergencyMessage: pet?.sos_settings?.finder_message || "Lütfen bana yardım edin, ailemi bulamıyorum.",
            rewardAmount: pet?.sos_settings?.reward_amount || 0,
            rewardCurrency: pet?.sos_settings?.reward_currency || "TL",
            sosRadius: pet?.sos_settings?.sos_radius || '5km',
            locationPrecision: pet?.sos_settings?.location_precision || 'exact',
            autoPostSos: pet?.sos_settings?.auto_post_sos || true,
            emergencySmsNumber: pet?.sos_settings?.emergency_sms_number || "",
            quietHours: pet?.sos_settings?.quiet_hours || { enabled: false, from: '23:00', to: '08:00' },
            emergencyBypass: pet?.sos_settings?.emergency_bypass ?? true,
            lastSeenLocation: pet?.sos_settings?.last_seen_location || "",
            rewardEnabled: pet?.sos_settings?.reward_enabled ?? true,
            headerSosAlertEnabled: pet?.sos_settings?.header_sos_alert_enabled ?? true
        }
    });
    
    // Sync local state when pet changes (Apple Style Persistent Window)
    React.useEffect(() => {
        if (pet) {
            setLocalSos({
                status: pet.is_lost ? 'lost' : 'safe',
                sosConfig: {
                    showPhoneNumber: !pet.sos_settings?.secure_proxy_only,
                    allowProxyCalls: pet.sos_settings?.secure_proxy_only || true,
                    allowAnonymousMessaging: true,
                    criticalHealthAlert: pet.sos_settings?.critical_health_note || "",
                    emergencyMessage: pet.sos_settings?.finder_message || "Lütfen bana yardım edin, ailemi bulamıyorum.",
                    rewardAmount: pet.sos_settings?.reward_amount || 0,
                    rewardCurrency: pet.sos_settings?.reward_currency || "TL",
                    sosRadius: pet.sos_settings?.sos_radius || '5km',
                    locationPrecision: pet.sos_settings?.location_precision || 'exact',
                    autoPostSos: pet.sos_settings?.auto_post_sos || true,
                    emergencySmsNumber: pet.sos_settings?.emergency_sms_number || "",
                    quietHours: pet.sos_settings?.quiet_hours || { enabled: false, from: '23:00', to: '08:00' },
                    emergencyBypass: pet.sos_settings?.emergency_bypass ?? true,
                    lastSeenLocation: pet.sos_settings?.last_seen_location || "",
                    rewardEnabled: pet.sos_settings?.reward_enabled ?? true,
                    headerSosAlertEnabled: pet.sos_settings?.header_sos_alert_enabled ?? true
                }
            });
            // Reset tab to status when switching pets for clarity
            setActiveTab('status');
        }
    }, [pet?.id]);

    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'status' | 'config' | 'preview'>('status');
    const [activeTimePicker, setActiveTimePicker] = useState<'from' | 'to' | null>(null);

    const TimeWheel = ({ value, onChange, max, label }: { value: number, onChange: (v: number) => void, max: number, label: string }) => {
        const numbers = Array.from({ length: max + 1 }, (_, i) => i);
        return (
            <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-white/20 mb-2 uppercase tracking-widest">{label}</span>
                <div className="h-32 w-16 overflow-y-auto no-scrollbar snap-y snap-mandatory relative outline-none py-12">
                    <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#1C1C1E] to-transparent z-10 pointer-events-none" />
                    {numbers.map(n => (
                        <div 
                            key={n} 
                            onClick={() => onChange(n)}
                            className={cn(
                                "h-8 flex items-center justify-center snap-center transition-all duration-200 cursor-pointer shrink-0",
                                value === n ? "text-cyan-400 font-black text-xl scale-110" : "text-white/20 text-sm font-bold opacity-40 hover:opacity-100"
                            )}
                        >
                            {n.toString().padStart(2, '0')}
                        </div>
                    ))}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#1C1C1E] to-transparent z-10 pointer-events-none" />
                </div>
            </div>
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 1. Durumu ve Ayarları Context'e ve Servis Katmanına kaydet
            await apiService.togglePetSosStatus(pet.id, localSos.status as 'lost' | 'safe');
            
            const newSosSettings = {
                ...pet.sos_settings,
                reward_amount: localSos.sosConfig.rewardAmount,
                reward_currency: localSos.sosConfig.rewardCurrency,
                critical_health_note: localSos.sosConfig.criticalHealthAlert,
                finder_message: localSos.sosConfig.emergencyMessage,
                secure_proxy_only: localSos.sosConfig.allowProxyCalls,
                sos_radius: localSos.sosConfig.sosRadius,
                location_precision: localSos.sosConfig.locationPrecision,
                auto_post_sos: localSos.sosConfig.autoPostSos,
                emergency_sms_number: localSos.sosConfig.emergencySmsNumber,
                quiet_hours: localSos.sosConfig.quietHours,
                emergency_bypass: localSos.sosConfig.emergencyBypass,
                last_seen_location: localSos.sosConfig.lastSeenLocation,
                reward_enabled: localSos.sosConfig.rewardEnabled,
                header_sos_alert_enabled: localSos.sosConfig.headerSosAlertEnabled
            };

            // Call specific service method for deep persistence/alerts
            await apiService.updatePetSosSettings(pet.id, newSosSettings);
            
            updatePet(pet.id, {
                is_lost: localSos.status === 'lost',
                sos_settings: newSosSettings
            });

            // Simüle edilmiş premium kayıt gecikmesi
            await new Promise(r => setTimeout(r, 800));
            onUpdate(localSos);
            setIsSaving(false);
            onClose();
        } catch (err) {
            console.error("SOS Save Error:", err);
            setIsSaving(false);
        }
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

                        {/* QUICK PET SWITCHER - Apple Style */}
                        {allPets.length > 1 && (
                            <div className="px-8 py-4 bg-white/5 border-b border-white/5 overflow-x-auto no-scrollbar flex items-center gap-4">
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] shrink-0">Hızlı Seçim:</span>
                                {allPets.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => onPetChange?.(p)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-95 shrink-0",
                                            p.id === pet.id 
                                                ? "bg-cyan-500/20 border-cyan-500/40 text-white" 
                                                : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                                        )}
                                    >
                                        <div className="w-6 h-6 rounded-lg overflow-hidden border border-white/10">
                                            <img src={p.avatar || p.avatar_url} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase">{p.name}</span>
                                        {p.is_lost && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                                    </button>
                                ))}
                            </div>
                        )}

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
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={pet.id + activeTab}
                                    initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
                                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                                >

                            {/* TAB: STATUS MANAGEMENT */}
                            {activeTab === 'status' && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                    <div className="flex flex-col items-center text-center">
                                        <div className={cn(
                                            "w-24 h-24 rounded-[2rem] p-1 mb-6 relative",
                                            isLost ? "bg-red-500" : "bg-cyan-500"
                                        )}>
                                            <img src={pet.avatar || pet.avatar_url} className="w-full h-full object-cover rounded-[1.7rem]" />
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
                                    {/* SECTION 1: PET-ID & BROADCAST (YAYIN) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 px-6 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                                <ShieldCheck className="w-4 h-4 text-orange-400" />
                                            </div>
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Kişisel Yayın Ayarları (Dostum İçin)</h3>
                                        </div>
                                        
                                        <div className="bg-white/5 border-y border-white/10 divide-y divide-white/5">
                                            {/* Reward Row */}
                                            <div className="p-6 space-y-4 bg-orange-500/5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block">Kayıp Ödülü</label>
                                                        <button 
                                                            onClick={() => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, rewardEnabled: !prev.sosConfig.rewardEnabled}}))}
                                                            className={cn(
                                                                "w-8 h-4 rounded-full relative transition-all duration-300",
                                                                localSos.sosConfig.rewardEnabled ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]" : "bg-white/10"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-md",
                                                                localSos.sosConfig.rewardEnabled ? "right-0.5" : "left-0.5"
                                                            )} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] bg-white/5 px-2 py-1 rounded-lg border border-white/5 font-bold text-orange-400">
                                                        <Coins className="w-3 h-3" />
                                                        Moffi Coin Opsiyonel
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {localSos.sosConfig.rewardEnabled && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="space-y-4 overflow-hidden"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative flex-1">
                                                                    <input 
                                                                        type="number"
                                                                        value={localSos.sosConfig.rewardAmount}
                                                                        onChange={(e) => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, rewardAmount: Number(e.target.value)}}))}
                                                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-lg font-black text-white outline-none focus:border-orange-500/50"
                                                                        placeholder="0"
                                                                    />
                                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400 font-black">TL</div>
                                                                </div>
                                                                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                                                                    {[1000, 2500, 5000].map(amt => (
                                                                        <button 
                                                                            key={amt}
                                                                            onClick={() => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, rewardAmount: amt}}))}
                                                                            className={cn(
                                                                                "px-4 py-2 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap",
                                                                                localSos.sosConfig.rewardAmount === amt 
                                                                                    ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20" 
                                                                                    : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                                                                            )}
                                                                        >
                                                                            {amt} TL
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Last Seen Location Row */}
                                            <div className="p-6 space-y-3 bg-cyan-500/5">
                                                <label className="text-[9px] font-black text-cyan-400/60 uppercase tracking-widest block ml-1">Son Görülen Konum (Kritik)</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                                                    <input 
                                                        type="text"
                                                        value={localSos.sosConfig.lastSeenLocation}
                                                        onChange={(e) => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, lastSeenLocation: e.target.value}}))}
                                                        className="w-full bg-cyan-400/10 border border-cyan-400/20 rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-white outline-none focus:border-cyan-400/50 placeholder:text-white/20"
                                                        placeholder="Örn: Moda Sahil, Migros Rezidans Önü..."
                                                    />
                                                </div>
                                                <p className="text-[8px] text-cyan-400/40 ml-1 italic font-medium">Bu bilgi radarda tüm kullanıcılara gösterilecektir.</p>
                                            </div>

                                            {/* Health Note Row */}
                                            <div className="p-6 space-y-3">
                                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest block ml-1">Kritik Sağlık Uyarısı</label>
                                                <textarea 
                                                    value={localSos.sosConfig.criticalHealthAlert}
                                                    onChange={(e) => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, criticalHealthAlert: e.target.value}}))}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-red-400 font-bold outline-none focus:border-red-500/50 h-20 resize-none"
                                                    placeholder="Örn: Piliç alerjisi var! Sadece su verin..."
                                                />
                                            </div>

                                            {/* SMS Number Row */}
                                            <div className="p-6 space-y-3">
                                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest block ml-1">Acil Durum SMS Kişisi</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                    <input 
                                                        type="text"
                                                        value={localSos.sosConfig.emergencySmsNumber}
                                                        onChange={(e) => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, emergencySmsNumber: e.target.value}}))}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-cyan-500/50"
                                                        placeholder="+90 5XX XXX XX XX"
                                                    />
                                                </div>
                                                <p className="text-[8px] text-white/20 ml-1 italic font-medium">SOS durumunda bu numaraya otomatik konum SMS'i gönderilir.</p>
                                            </div>

                                            {/* Finder Message Row */}
                                            <div className="p-6 space-y-3">
                                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest block ml-1">Bulan Kişiye Özel Mesaj</label>
                                                <textarea 
                                                    value={localSos.sosConfig.emergencyMessage}
                                                    onChange={(e) => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, emergencyMessage: e.target.value}}))}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white/80 font-medium outline-none focus:border-cyan-500/50 h-24 resize-none"
                                                    placeholder="Lütfen bahçeye kapatıp beni arayın..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 2: RADAR & COMMUNITY (KOMÜNİTE) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 px-6 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                                <Radar className="w-4 h-4 text-cyan-400" />
                                            </div>
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Komünite & Radar Ayarları (Topluluk)</h3>
                                        </div>

                                        <div className="bg-white/5 border-y border-white/10 divide-y divide-white/5">
                                            {/* Radar Radius Row */}
                                            <div className="p-6 space-y-4 bg-cyan-500/5">
                                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block leading-none">Radar Bildirim Menzili</label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {(['2km', '5km', '10km', 'city'] as const).map((r) => (
                                                        <button 
                                                            key={r}
                                                            onClick={() => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, sosRadius: r}}))}
                                                            className={cn(
                                                                "py-3 rounded-2xl text-[10px] font-black uppercase transition-all border",
                                                                localSos.sosConfig.sosRadius === r 
                                                                    ? "bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/20" 
                                                                    : "bg-white/5 border-white/10 text-white/30 hover:text-white/60"
                                                            )}
                                                        >
                                                            {r === 'city' ? 'Şehir' : r}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-[8px] text-white/20 italic font-medium">Başkalarının ilanlarını ne kadar mesafeden duymak istersiniz?</p>
                                            </div>

                                            {/* Location Precision Row */}
                                            <div className="p-6 space-y-4">
                                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block leading-none">Konum Hassasiyeti</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {(['exact', 'area'] as const).map((p) => (
                                                        <button 
                                                            key={p}
                                                            onClick={() => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, locationPrecision: p}}))}
                                                            className={cn(
                                                                "p-4 rounded-2xl text-start transition-all border relative overflow-hidden",
                                                                localSos.sosConfig.locationPrecision === p 
                                                                    ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/5" 
                                                                    : "bg-white/5 border-white/10"
                                                            )}
                                                        >
                                                            <div className="relative z-10">
                                                                <p className={cn("text-xs font-black uppercase tracking-wider mb-1", localSos.sosConfig.locationPrecision === p ? "text-emerald-400" : "text-white/40")}>
                                                                    {p === 'exact' ? 'Nokta Atışı' : 'Genel Bölge'}
                                                                </p>
                                                                <p className="text-[9px] text-white/20 font-bold leading-tight">
                                                                    {p === 'exact' ? 'Tam koordinatlar gösterilir.' : 'Sadece mahalle/bölge gösterilir.'}
                                                                </p>
                                                            </div>
                                                            {localSos.sosConfig.locationPrecision === p && (
                                                                <div className="absolute right-3 top-3 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                                                    <Check className="w-2.5 h-2.5 text-white stroke-[4px]" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Privacy Toggles Row */}
                                            <div className="divide-y divide-white/5">
                                                {[
                                                    { id: 'autoPostSos', label: 'Topluluğa Otomatik İlan', icon: Zap, color: 'text-yellow-400' },
                                                    { id: 'headerSosAlertEnabled', label: 'Header SOS Uyarısı', icon: Bell, color: 'text-red-400' },
                                                    { id: 'showPhoneNumber', label: 'Telefon Numaram Görünsün', icon: Phone, color: 'text-cyan-400' },
                                                    { id: 'allowProxyCalls', label: 'Moffi Güvenli Arama', icon: PhoneCall, color: 'text-emerald-400' },
                                                    { id: 'allowAnonymousMessaging', label: 'Anonim Mesajlaşma', icon: MessageCircle, color: 'text-purple-400' },
                                                ].map(item => (
                                                    <div key={item.id} className="flex items-center justify-between p-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                                <item.icon className={cn("w-5 h-5", item.color)} />
                                                            </div>
                                                            <span className="text-[11px] font-bold text-white/80">{item.label}</span>
                                                        </div>
                                                        <button 
                                                            onClick={() => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, [item.id]: !prev.sosConfig[item.id]}}))}
                                                            className={cn(
                                                                "w-11 h-6 rounded-full relative transition-all duration-300",
                                                                (localSos.sosConfig as any)[item.id] ? "bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "bg-white/10"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md",
                                                                (localSos.sosConfig as any)[item.id] ? "right-1" : "left-1"
                                                            )} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* QUIET HOURS & BYPASS Row */}
                                            <div className="p-6 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                            <Clock className={cn("w-5 h-5", localSos.sosConfig.quietHours.enabled ? "text-purple-400" : "text-white/20")} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[11px] font-bold text-white/80 block">Sessiz Saatler</span>
                                                            <span className="text-[9px] text-white/20 font-bold uppercase tracking-tighter">İhbar Bildirim Aralığı</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, quietHours: {...prev.sosConfig.quietHours, enabled: !prev.sosConfig.quietHours.enabled}}}))}
                                                        className={cn(
                                                            "w-11 h-6 rounded-full relative transition-all duration-300",
                                                            localSos.sosConfig.quietHours.enabled ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "bg-white/10"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md",
                                                            localSos.sosConfig.quietHours.enabled ? "right-1" : "left-1"
                                                        )} />
                                                    </button>
                                                </div>

                                                {localSos.sosConfig.quietHours.enabled && (
                                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
                                                        <div className="flex items-center gap-3">
                                                            <button 
                                                                onClick={() => setActiveTimePicker(activeTimePicker === 'from' ? null : 'from')}
                                                                className={cn(
                                                                    "flex-1 border rounded-2xl p-4 flex flex-col items-center transition-all",
                                                                    activeTimePicker === 'from' ? "bg-cyan-500/10 border-cyan-500/50" : "bg-white/5 border-white/10"
                                                                )}
                                                            >
                                                                <span className="text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest leading-none">Başlangıç</span>
                                                                <span className="text-white text-2xl font-black">{localSos.sosConfig.quietHours.from}</span>
                                                            </button>
                                                            <div className="w-2 h-0.5 bg-white/10 rounded-full" />
                                                            <button 
                                                                onClick={() => setActiveTimePicker(activeTimePicker === 'to' ? null : 'to')}
                                                                className={cn(
                                                                    "flex-1 border rounded-2xl p-4 flex flex-col items-center transition-all",
                                                                    activeTimePicker === 'to' ? "bg-purple-500/10 border-purple-500/50" : "bg-white/5 border-white/10"
                                                                )}
                                                            >
                                                                <span className="text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest leading-none">Bitiş</span>
                                                                <span className="text-white text-2xl font-black">{localSos.sosConfig.quietHours.to}</span>
                                                            </button>
                                                        </div>

                                                        <AnimatePresence>
                                                            {activeTimePicker && (
                                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-black/40 border border-white/5 rounded-[2rem] p-8">
                                                                    <div className="flex justify-center items-center gap-8">
                                                                        <TimeWheel 
                                                                            label="Saat"
                                                                            value={Number(localSos.sosConfig.quietHours[activeTimePicker].split(':')[0])}
                                                                            max={23}
                                                                            onChange={(h) => {
                                                                                const current = localSos.sosConfig.quietHours[activeTimePicker].split(':');
                                                                                const nextVal = `${h.toString().padStart(2, '0')}:${current[1]}`;
                                                                                setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, quietHours: {...prev.sosConfig.quietHours, [activeTimePicker]: nextVal}}}));
                                                                            }}
                                                                        />
                                                                        <div className="text-white/20 font-black text-2xl self-end mb-11">:</div>
                                                                        <TimeWheel 
                                                                            label="Dakika"
                                                                            value={Number(localSos.sosConfig.quietHours[activeTimePicker].split(':')[1])}
                                                                            max={59}
                                                                            onChange={(m) => {
                                                                                const current = localSos.sosConfig.quietHours[activeTimePicker].split(':');
                                                                                const nextVal = `${current[0]}:${m.toString().padStart(2, '0')}`;
                                                                                setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, quietHours: {...prev.sosConfig.quietHours, [activeTimePicker]: nextVal}}}));
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <button onClick={() => setActiveTimePicker(null)} className="w-full mt-6 py-4 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs transition-colors">Tamam</button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                )}

                                                <div className="flex items-center justify-between group cursor-pointer" onClick={() => setLocalSos((prev: any) => ({...prev, sosConfig: {...prev.sosConfig, emergencyBypass: !prev.sosConfig.emergencyBypass}}))}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                            <ShieldCheck className={cn("w-5 h-5", localSos.sosConfig.emergencyBypass ? "text-cyan-400 font-bold" : "text-white/20")} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[11px] font-bold text-white/80 block group-hover:text-cyan-400 transition-colors">Kritik İhbar Bypass</span>
                                                            <span className="text-[9px] text-white/20 font-bold uppercase tracking-tighter italic leading-none block mt-1">Acil durumlarda sessiz modu del</span>
                                                        </div>
                                                    </div>
                                                    <div className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all", localSos.sosConfig.emergencyBypass ? "border-cyan-400 bg-cyan-400/20" : "border-white/10")}>
                                                        {localSos.sosConfig.emergencyBypass && <Check className="w-4 h-4 text-cyan-400" />}
                                                    </div>
                                                </div>
                                            </div>
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

                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
