'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ChevronLeft, Plus, AlertTriangle, ShieldAlert, 
    PhoneCall, Sparkles, Dog, Cat
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddPetModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: number;
    setStep: (val: number | ((p: number) => number)) => void;
    newPetName: string;
    setNewPetName: (val: string) => void;
    newPetType: string;
    setNewPetType: (val: string) => void;
    newPetBreed: string;
    setNewPetBreed: (val: string) => void;
    newPetAge: string;
    setNewPetAge: (val: string) => void;
    newPetGender: string;
    setNewPetGender: (val: string) => void;
    newPetNeutered: string;
    setNewPetNeutered: (val: string) => void;
    newPetSize: string;
    setNewPetSize: (val: string) => void;
    newPetFeatures: string;
    setNewPetFeatures: (val: string) => void;
    newPetHealth: string;
    setNewPetHealth: (val: string) => void;
    newPetCharacter: string;
    setNewPetCharacter: (val: string) => void;
    newPetMicrochip: string;
    setNewPetMicrochip: (val: string) => void;
    newPetShowPhone: boolean;
    setNewPetShowPhone: (val: boolean) => void;
    newPetPhotos: { file: File, preview: string }[];
    setNewPetPhotos: (val: any | ((p: any) => any)) => void;
    isSaving: boolean;
    onSave: () => Promise<void>;
    
    // Props for dynamic goals, streak, health and weight inputs
    newPetWeight: string;
    setNewPetWeight: (val: string) => void;
    newPetHealthStatus: string;
    setNewPetHealthStatus: (val: string) => void;
    newPetActivityTarget: string;
    setNewPetActivityTarget: (val: string) => void;
    newPetWaterTarget: string;
    setNewPetWaterTarget: (val: string) => void;
    newPetFoodTarget: string;
    setNewPetFoodTarget: (val: string) => void;
    newPetStreak: string;
    setNewPetStreak: (val: string) => void;
}

export function AddPetModal({
    isOpen,
    onClose,
    step,
    setStep,
    newPetName,
    setNewPetName,
    newPetType,
    setNewPetType,
    newPetBreed,
    setNewPetBreed,
    newPetAge,
    setNewPetAge,
    newPetGender,
    setNewPetGender,
    newPetNeutered,
    setNewPetNeutered,
    newPetSize,
    setNewPetSize,
    newPetFeatures,
    setNewPetFeatures,
    newPetHealth,
    setNewPetHealth,
    newPetCharacter,
    setNewPetCharacter,
    newPetMicrochip,
    setNewPetMicrochip,
    newPetShowPhone,
    setNewPetShowPhone,
    newPetPhotos,
    setNewPetPhotos,
    isSaving,
    onSave,
    
    newPetWeight,
    setNewPetWeight,
    newPetHealthStatus,
    setNewPetHealthStatus,
    newPetActivityTarget,
    setNewPetActivityTarget,
    newPetWaterTarget,
    setNewPetWaterTarget,
    newPetFoodTarget,
    setNewPetFoodTarget,
    newPetStreak,
    setNewPetStreak
}: AddPetModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[500] bg-black/45 backdrop-blur-md flex flex-col justify-end sm:items-center sm:justify-center sm:px-4"
                    onClick={onClose}
                >
                    {/* Glowing background auroras */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
                        <div className="absolute top-[20%] left-[-20%] w-[350px] h-[350px] bg-green-500/10 rounded-full blur-[90px] animate-pulse" />
                        <div className="absolute bottom-[20%] right-[-20%] w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[90px] animate-pulse" />
                    </div>

                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 26, stiffness: 280 }}
                        className={cn(
                            "w-full max-w-md bg-white/90 backdrop-blur-2xl border border-white/20 shadow-[0_32px_80px_rgba(0,0,0,0.12)] relative flex flex-col",
                            "rounded-t-[40px] sm:rounded-[36px] p-6",
                            "pb-safe sm:pb-8 max-h-[92vh] overflow-y-auto no-scrollbar"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Mobile Handle */}
                        <div className="w-12 h-1.5 bg-gray-200/80 rounded-full mx-auto mb-6 sm:hidden" />

                        <div className="w-full flex justify-between items-center mb-8">
                            {step > 1 ? (
                                <button 
                                    onClick={() => setStep(prev => prev - 1)} 
                                    className="w-10 h-10 bg-white/80 border border-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-all flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            ) : <div className="w-10" />}
                            
                            <div className="text-center">
                                <h2 className="text-lg font-black text-gray-850 tracking-tight">Yeni Pati Ekle</h2>
                                <div className="flex items-center justify-center gap-1.5 mt-2">
                                    {[1, 2, 3].map(i => (
                                        <div 
                                            key={i} 
                                            className={cn(
                                                "h-1 rounded-full transition-all duration-300", 
                                                step === i 
                                                    ? "w-6 bg-[#527958] shadow-[0_0_8px_rgba(82,121,88,0.3)]" 
                                                    : "w-2 bg-gray-200"
                                            )} 
                                        />
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={onClose} 
                                className="w-10 h-10 bg-white/80 border border-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-all flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="w-full">
                            {step === 1 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-6">
                                    
                                    {/* PHOTO GALLERY SECTION */}
                                    <div className="bg-white/60 rounded-[28px] p-5 border border-gray-200/80 shadow-sm space-y-3">
                                        <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Fotoğraflar (En Fazla 5)</label>
                                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                                            {newPetPhotos.map((photo, index) => (
                                                <div key={index} className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden border border-gray-100 shadow-sm group">
                                                    <img src={photo.preview} className="w-full h-full object-cover" alt="Pet Preview" />
                                                    <button
                                                        onClick={() => setNewPetPhotos((prev: any[]) => prev.filter((_, i) => i !== index))}
                                                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                    >
                                                        <X className="w-3.5 h-3.5 text-white" />
                                                    </button>
                                                    {index === 0 && (
                                                        <div className="absolute bottom-1 left-1 right-1 bg-[#527958]/95 backdrop-blur-md flex items-center justify-center py-0.5 rounded-lg shadow-sm">
                                                            <span className="text-[7.5px] font-black text-white uppercase tracking-widest">Kapak</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {newPetPhotos.length < 5 && (
                                                <label htmlFor="add-pet-photos" className="shrink-0 w-20 h-20 rounded-2xl bg-white/60 border-2 border-dashed border-gray-200/80 flex flex-col items-center justify-center cursor-pointer hover:border-[#527958] hover:bg-white transition-all group shadow-inner">
                                                    <div className="w-7 h-7 bg-green-50/80 rounded-xl flex items-center justify-center mb-1 group-hover:scale-110 transition-all duration-300">
                                                        <Plus className="w-4.5 h-4.5 text-[#527958]" />
                                                    </div>
                                                    <span className="text-[8.5px] text-gray-400 font-black uppercase tracking-wider text-center">Ekle</span>
                                                    <input
                                                        type="file"
                                                        id="add-pet-photos"
                                                        className="hidden"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={(e) => {
                                                            const files = Array.from(e.target.files || []);
                                                            if (files.length > 0) {
                                                                const validFiles = files.slice(0, 5 - newPetPhotos.length);
                                                                const newPhotos = validFiles.map(file => ({
                                                                    file,
                                                                    preview: URL.createObjectURL(file)
                                                                }));
                                                                setNewPetPhotos((prev: any[]) => [...prev, ...newPhotos]);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* CORE INFO CARD */}
                                    <div className="bg-white/60 rounded-[28px] p-5 border border-gray-200/80 shadow-sm space-y-4">
                                        
                                        {/* İsim Girişi */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">İsim</label>
                                            <input 
                                                type="text" 
                                                value={newPetName} 
                                                onChange={e => setNewPetName(e.target.value)} 
                                                placeholder="Örn: Pamuk" 
                                                className="w-full bg-white/60 focus:bg-white border border-gray-200/80 rounded-2xl px-4 py-3.5 text-foreground text-sm outline-none focus:ring-4 focus:ring-[#527958]/10 focus:border-[#527958] transition-all font-semibold placeholder-gray-400" 
                                            />
                                        </div>

                                        {/* Tür Seçimi - Horizontal Segmented Control */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Tür</label>
                                            <div className="flex bg-[#F1F3F2] p-1 rounded-2xl border border-gray-250/30">
                                                {[
                                                    { emoji: '🐶', label: 'Köpek' },
                                                    { emoji: '🐱', label: 'Kedi' },
                                                    { emoji: '🦜', label: 'Kuş' },
                                                    { emoji: '🐰', label: 'Tavşan' }
                                                ].map(t => (
                                                    <button
                                                        key={t.emoji}
                                                        type="button"
                                                        onClick={() => setNewPetType(t.emoji)}
                                                        className={cn(
                                                            "flex-1 py-2 rounded-xl text-base transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer",
                                                            newPetType === t.emoji 
                                                                ? "bg-white shadow-sm scale-[1.02] text-gray-900" 
                                                                : "opacity-60 hover:opacity-90 text-gray-500"
                                                        )}
                                                    >
                                                        <span>{t.emoji}</span>
                                                        <span className="text-[8px] font-black tracking-tight uppercase">{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1.5 col-span-1">
                                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Irkı</label>
                                                <input 
                                                    type="text" 
                                                    value={newPetBreed} 
                                                    onChange={e => setNewPetBreed(e.target.value)} 
                                                    placeholder="Golden" 
                                                    className="w-full bg-white/60 focus:bg-white border border-gray-200/80 rounded-2xl px-4 py-3 text-foreground text-sm outline-none focus:ring-4 focus:ring-[#527958]/10 focus:border-[#527958] transition-all font-semibold placeholder-gray-400" 
                                                />
                                            </div>
                                            <div className="space-y-1.5 col-span-1">
                                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Yaş</label>
                                                <input 
                                                    type="text" 
                                                    value={newPetAge} 
                                                    onChange={e => setNewPetAge(e.target.value)} 
                                                    placeholder="2 Yaş" 
                                                    className="w-full bg-white/60 focus:bg-white border border-gray-200/80 rounded-2xl px-4 py-3 text-foreground text-sm text-center outline-none focus:ring-4 focus:ring-[#527958]/10 focus:border-[#527958] transition-all font-semibold placeholder-gray-400" 
                                                />
                                            </div>
                                            <div className="space-y-1.5 col-span-1">
                                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Kilo (KG)</label>
                                                <input 
                                                    type="text" 
                                                    value={newPetWeight} 
                                                    onChange={e => setNewPetWeight(e.target.value)} 
                                                    placeholder="Örn: 24.5" 
                                                    className="w-full bg-white/60 focus:bg-white border border-gray-200/80 rounded-2xl px-4 py-3 text-foreground text-sm text-center outline-none focus:ring-4 focus:ring-[#527958]/10 focus:border-[#527958] transition-all font-semibold placeholder-gray-400" 
                                                />
                                            </div>
                                        </div>

                                        {/* Horizontal Segmented Controls */}
                                        <div className="space-y-3 pt-2">
                                            
                                            {/* Cinsiyet */}
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] text-gray-450 font-black uppercase tracking-wider block ml-1">Cinsiyet</label>
                                                <div className="flex bg-[#F1F3F2] p-1 rounded-2xl border border-gray-250/30">
                                                    {['Erkek', 'Dişi'].map(g => (
                                                        <button
                                                            key={g}
                                                            type="button"
                                                            onClick={() => setNewPetGender(g)}
                                                            className={cn(
                                                                "flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                                                                newPetGender === g 
                                                                    ? "bg-white text-gray-800 shadow-sm" 
                                                                    : "text-gray-400 hover:text-gray-600"
                                                            )}
                                                        >
                                                            {g}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Kısır Mı? */}
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] text-gray-450 font-black uppercase tracking-wider block ml-1">Kısırlaştırılmış mı?</label>
                                                <div className="flex bg-[#F1F3F2] p-1 rounded-2xl border border-gray-250/30">
                                                    {['Evet', 'Hayır'].map(val => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => setNewPetNeutered(val)}
                                                            className={cn(
                                                                "flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                                                                newPetNeutered === val 
                                                                    ? "bg-white text-gray-800 shadow-sm" 
                                                                    : "text-gray-400 hover:text-gray-600"
                                                            )}
                                                        >
                                                            {val}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Boyut */}
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] text-gray-450 font-black uppercase tracking-wider block ml-1">Boyut</label>
                                                <div className="flex bg-[#F1F3F2] p-1 rounded-2xl border border-gray-250/30">
                                                    {['Küçük', 'Orta', 'Büyük'].map(sz => (
                                                        <button
                                                            key={sz}
                                                            type="button"
                                                            onClick={() => setNewPetSize(sz)}
                                                            className={cn(
                                                                "flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                                                                newPetSize === sz 
                                                                    ? "bg-white text-gray-800 shadow-sm" 
                                                                    : "text-gray-400 hover:text-gray-600"
                                                            )}
                                                        >
                                                            {sz}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    <motion.button 
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setStep(2)} 
                                        disabled={!newPetName || !newPetBreed || !newPetWeight} 
                                        className="w-full py-4.5 bg-gradient-to-r from-[#527958] to-emerald-600 hover:opacity-95 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-green-950/10 cursor-pointer text-center"
                                    >
                                        Sonraki Adım
                                    </motion.button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-5">
                                    
                                    {/* Warnings / SOS Info */}
                                    <div className="p-4 bg-gradient-to-br from-amber-50/80 to-orange-50/60 border border-orange-100/50 rounded-[24px] flex items-start gap-3.5 shadow-sm">
                                        <div className="w-8.5 h-8.5 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                                            <AlertTriangle className="w-4.5 h-4.5 text-orange-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-orange-800 text-xs font-black uppercase tracking-wider leading-none">Tıbbi & SOS Verisi</h4>
                                            <p className="text-[10px] text-orange-700/80 leading-relaxed font-semibold mt-1.5">Bu bilgiler acil/kayıp durumunda Moffi QR künyesinde gösterilir.</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/60 rounded-[28px] p-5 border border-gray-200/80 shadow-sm space-y-4">
                                        
                                        {/* Sağlık Durumu - Segmented Buttons */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block ml-1">Sağlık Durumu</label>
                                            <div className="grid grid-cols-2 gap-2 bg-[#F1F3F2] p-1 rounded-2xl border border-gray-250/30">
                                                {[
                                                    { value: 'Mükemmel', label: 'Mükemmel 🌟' },
                                                    { value: 'İyi', label: 'İyi 👍' },
                                                    { value: 'Hassas', label: 'Hassas ⚠️' },
                                                    { value: 'Tedavide', label: 'Tedavide 🩺' }
                                                ].map(h => (
                                                    <button
                                                        key={h.value}
                                                        type="button"
                                                        onClick={() => setNewPetHealthStatus(h.value)}
                                                        className={cn(
                                                            "py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                                                            newPetHealthStatus === h.value 
                                                                ? "bg-white text-gray-800 shadow-sm scale-[1.01]" 
                                                                : "text-gray-400 hover:text-gray-600"
                                                        )}
                                                    >
                                                        {h.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Alerjiler & Kronik Hastalıklar</label>
                                            <textarea 
                                                value={newPetHealth} 
                                                onChange={e => setNewPetHealth(e.target.value)} 
                                                placeholder="Örn: Tavuk alerjisi var, günlük ilaç kullanımı vb..." 
                                                className="w-full bg-[#FDF5F5]/60 focus:bg-white border border-red-100 focus:border-red-400 rounded-2xl px-4.5 py-3 text-foreground placeholder-gray-400 outline-none focus:ring-4 focus:ring-red-500/5 transition-all font-medium text-xs h-16 resize-none leading-relaxed" 
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Ayırt Edici Özellikleri</label>
                                            <textarea 
                                                value={newPetFeatures} 
                                                onChange={e => setNewPetFeatures(e.target.value)} 
                                                placeholder="Örn: Sol gözünün üstünde küçük beyaz bir leke var..." 
                                                className="w-full bg-white/60 focus:bg-white border border-gray-200/80 focus:border-[#527958] rounded-2xl px-4.5 py-3 text-foreground placeholder-gray-400 outline-none focus:ring-4 focus:ring-[#527958]/10 transition-all font-medium text-xs h-16 resize-none leading-relaxed" 
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Karakter Özellikleri</label>
                                            <textarea 
                                                value={newPetCharacter} 
                                                onChange={e => setNewPetCharacter(e.target.value)} 
                                                placeholder="Örn: İnsanlara karşı çok sevecendir fakat gürültüden korkar..." 
                                                className="w-full bg-white/60 focus:bg-white border border-gray-200/80 focus:border-[#527958] rounded-2xl px-4.5 py-3 text-foreground placeholder-gray-400 outline-none focus:ring-4 focus:ring-[#527958]/10 transition-all font-medium text-xs h-16 resize-none leading-relaxed" 
                                            />
                                        </div>
                                    </div>

                                    <motion.button 
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setStep(3)} 
                                        className="w-full py-4.5 bg-gradient-to-r from-[#527958] to-emerald-600 hover:opacity-95 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-green-950/10 cursor-pointer text-center"
                                    >
                                        Sonraki Adım
                                    </motion.button>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-6">
                                    
                                    <div className="bg-white/60 rounded-[28px] p-5 border border-gray-200/80 shadow-sm space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Mikroçip Numarası</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    value={newPetMicrochip} 
                                                    onChange={e => setNewPetMicrochip(e.target.value)} 
                                                    placeholder="TR-000000000" 
                                                    className="w-full bg-white/60 focus:bg-white border border-gray-200/80 rounded-2xl pl-12 pr-5 py-4 text-foreground outline-none focus:ring-4 focus:ring-[#527958]/10 focus:border-[#527958] transition-all font-mono tracking-widest text-sm" 
                                                />
                                                <ShieldAlert className="absolute left-4.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400/80" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gezi, Su, Beslenme Hedefleri & Seri İstikrarı */}
                                    <div className="bg-white/60 rounded-[28px] p-5 border border-gray-200/80 shadow-sm space-y-4">
                                        <span className="text-[10px] text-foreground font-black uppercase tracking-wider block ml-1">Günlük Hedefler & İstikrar Serisi</span>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider ml-1">Aktivite Hedefi (%)</label>
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    max="100"
                                                    value={newPetActivityTarget} 
                                                    onChange={e => setNewPetActivityTarget(e.target.value)} 
                                                    placeholder="Örn: 70" 
                                                    className="w-full bg-white/60 focus:bg-white border border-gray-200/80 rounded-2xl px-4 py-3.5 text-foreground text-xs outline-none focus:ring-4 focus:ring-[#527958]/10 focus:border-[#527958] transition-all font-semibold" 
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider ml-1">Su Hedefi (%)</label>
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    max="100"
                                                    value={newPetWaterTarget} 
                                                    onChange={e => setNewPetWaterTarget(e.target.value)} 
                                                    placeholder="Örn: 80" 
                                                    className="w-full bg-white/60 focus:bg-white border border-gray-200/80 rounded-2xl px-4 py-3.5 text-foreground text-xs outline-none focus:ring-4 focus:ring-[#527958]/10 focus:border-[#527958] transition-all font-semibold" 
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider ml-1">Beslenme Hedefi (%)</label>
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    max="100"
                                                    value={newPetFoodTarget} 
                                                    onChange={e => setNewPetFoodTarget(e.target.value)} 
                                                    placeholder="Örn: 60" 
                                                    className="w-full bg-white/60 focus:bg-white border border-gray-200/80 rounded-2xl px-4 py-3.5 text-foreground text-xs outline-none focus:ring-4 focus:ring-[#527958]/10 focus:border-[#527958] transition-all font-semibold" 
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider ml-1">Yürüyüş Serisi (Gün)</label>
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    max="7"
                                                    value={newPetStreak} 
                                                    onChange={e => setNewPetStreak(e.target.value)} 
                                                    placeholder="Örn: 4" 
                                                    className="w-full bg-white/60 focus:bg-white border border-gray-200/80 rounded-2xl px-4 py-3.5 text-foreground text-xs outline-none focus:ring-4 focus:ring-[#527958]/10 focus:border-[#527958] transition-all font-semibold text-center" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Telefon Göster - Premium Card Slide Toggle */}
                                    <div className="bg-white/60 border border-gray-200/80 rounded-[28px] p-5 shadow-sm relative overflow-hidden group">
                                        <div className="flex justify-between items-center mb-3 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-inner", newPetShowPhone ? "bg-green-50 text-[#527958] border border-green-100" : "bg-gray-100 text-gray-400 border border-gray-200/50")}>
                                                    <PhoneCall className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <span className="font-black text-foreground text-sm tracking-tight block leading-none">Telefonu Göster</span>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 leading-none">SOS Arama Yetkisi</p>
                                                </div>
                                            </div>
                                            <div
                                                className={cn("w-12 h-6.5 rounded-full p-1 cursor-pointer transition-all relative border border-gray-100 shadow-inner", newPetShowPhone ? "bg-[#527958]" : "bg-gray-200")}
                                                onClick={() => setNewPetShowPhone(!newPetShowPhone)}
                                            >
                                                <motion.div
                                                    animate={{ x: newPetShowPhone ? 22 : 0 }}
                                                    className="w-4.5 h-4.5 rounded-full bg-white shadow-sm"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-455 leading-relaxed font-semibold mt-3 relative z-10">
                                            Kayıp Modu aktif olduğunda patinizin künyesini okutan kişiler sizinle anında telefon veya WhatsApp üzerinden iletişim kurabilir.
                                        </p>
                                    </div>

                                    <motion.button
                                        disabled={isSaving}
                                        onClick={onSave}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className="w-full py-5 bg-gradient-to-r from-[#527958] to-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:opacity-50 shadow-lg shadow-green-950/15 cursor-pointer"
                                    >
                                        {isSaving ? (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5 animate-pulse" />
                                                Dostu Kaydet
                                            </>
                                        )}
                                    </motion.button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
