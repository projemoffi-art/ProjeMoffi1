'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ChevronLeft, Plus, AlertTriangle, ShieldAlert, 
    PhoneCall, Check, Sparkles
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
    
    // New Props for dynamic goals, streak, health and weight inputs
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
                    className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-md flex flex-col justify-end sm:items-center sm:justify-center sm:px-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={cn(
                            "w-full max-w-md bg-[#FBFBFB] border border-card-border/80 shadow-[0_-20px_50px_rgba(0,0,0,0.06)] relative flex flex-col",
                            "rounded-t-[40px] sm:rounded-[36px] p-6",
                            "pb-safe sm:pb-8 max-h-[92vh] overflow-y-auto no-scrollbar"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Mobile Handle */}
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />

                        <div className="w-full flex justify-between items-center mb-8">
                            {step > 1 ? (
                                <button 
                                    onClick={() => setStep(prev => prev - 1)} 
                                    className="w-10 h-10 bg-card border border-card-border rounded-full text-gray-400 hover:text-foreground transition-all flex items-center justify-center shadow-moffi-card cursor-pointer"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            ) : <div className="w-10" />}
                            
                            <div className="text-center">
                                <h2 className="text-lg font-black text-gray-850 tracking-tight">Yeni Pati Ekle</h2>
                                <div className="flex items-center justify-center gap-1.5 mt-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={cn("h-1 rounded-full transition-all duration-300", step === i ? "w-6 bg-[#527958]" : "w-2 bg-gray-200")} />
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={onClose} 
                                className="w-10 h-10 bg-card border border-card-border rounded-full text-gray-400 hover:text-foreground transition-all flex items-center justify-center shadow-moffi-card cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="w-full">
                            {step === 1 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-6">
                                    
                                    {/* PHOTO GALLERY SECTION */}
                                    <div className="bg-card rounded-[28px] p-5 border border-card-border shadow-moffi-card space-y-3">
                                        <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Fotoğraflar (En Fazla 5)</label>
                                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                                            {newPetPhotos.map((photo, index) => (
                                                <div key={index} className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden border border-card-border shadow-sm group">
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
                                                <label htmlFor="add-pet-photos" className="shrink-0 w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-card-border flex flex-col items-center justify-center cursor-pointer hover:border-[#527958]/40 transition-all group">
                                                    <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                                                        <Plus className="w-4 h-4 text-[#527958]" />
                                                    </div>
                                                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider text-center">Ekle</span>
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
                                    <div className="bg-card rounded-[28px] p-5 border border-card-border shadow-moffi-card space-y-4">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="col-span-2 space-y-1.5">
                                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">İsim</label>
                                                <input 
                                                    type="text" 
                                                    value={newPetName} 
                                                    onChange={e => setNewPetName(e.target.value)} 
                                                    placeholder="Örn: Pamuk" 
                                                    className="w-full bg-[#FBFBFB] border border-card-border rounded-2xl px-4 py-3 text-foreground text-sm outline-none focus:border-[#527958]/50 transition-all font-bold placeholder-gray-400" 
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider text-center block">Tür</label>
                                                <div className="relative">
                                                    <select 
                                                        value={newPetType} 
                                                        onChange={e => setNewPetType(e.target.value)} 
                                                        className="w-full bg-[#FBFBFB] border border-card-border rounded-2xl px-2 py-3 text-center text-lg outline-none focus:border-[#527958]/50 transition-all appearance-none cursor-pointer" 
                                                        style={{ textAlignLast: "center" }}
                                                    >
                                                        <option value="🐶">🐶</option>
                                                        <option value="🐱">🐱</option>
                                                        <option value="🦜">🦜</option>
                                                        <option value="🐰">🐰</option>
                                                    </select>
                                                </div>
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
                                                    className="w-full bg-[#FBFBFB] border border-card-border rounded-2xl px-4 py-3 text-gray-850 text-sm outline-none focus:border-[#527958]/50 transition-all font-semibold placeholder-gray-400" 
                                                />
                                            </div>
                                            <div className="space-y-1.5 col-span-1">
                                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Yaş</label>
                                                <input 
                                                    type="text" 
                                                    value={newPetAge} 
                                                    onChange={e => setNewPetAge(e.target.value)} 
                                                    placeholder="2 Yaş" 
                                                    className="w-full bg-[#FBFBFB] border border-card-border rounded-2xl px-4 py-3 text-gray-850 text-sm text-center outline-none focus:border-[#527958]/50 transition-all font-semibold placeholder-gray-400" 
                                                />
                                            </div>
                                            <div className="space-y-1.5 col-span-1">
                                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Kilo (KG)</label>
                                                <input 
                                                    type="text" 
                                                    value={newPetWeight} 
                                                    onChange={e => setNewPetWeight(e.target.value)} 
                                                    placeholder="Örn: 24.5" 
                                                    className="w-full bg-[#FBFBFB] border border-card-border rounded-2xl px-4 py-3 text-gray-850 text-sm text-center outline-none focus:border-[#527958]/50 transition-all font-semibold placeholder-gray-400" 
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 pt-1">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] text-gray-400 font-black uppercase tracking-wider text-center block">Cinsiyet</label>
                                                <select value={newPetGender} onChange={e => setNewPetGender(e.target.value)} className="w-full bg-[#FBFBFB] border border-card-border rounded-xl py-2.5 text-foreground outline-none focus:border-[#527958]/50 transition-all text-xs font-bold text-center appearance-none cursor-pointer">
                                                    <option value="Erkek">Erkek</option>
                                                    <option value="Dişi">Dişi</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] text-gray-400 font-black uppercase tracking-wider text-center block">Kısır mı?</label>
                                                <select value={newPetNeutered} onChange={e => setNewPetNeutered(e.target.value)} className="w-full bg-[#FBFBFB] border border-card-border rounded-xl py-2.5 text-foreground outline-none focus:border-[#527958]/50 transition-all text-xs font-bold text-center appearance-none cursor-pointer">
                                                    <option value="Evet">Evet</option>
                                                    <option value="Hayır">Hayır</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] text-gray-400 font-black uppercase tracking-wider text-center block">Boyut</label>
                                                <select value={newPetSize} onChange={e => setNewPetSize(e.target.value)} className="w-full bg-[#FBFBFB] border border-card-border rounded-xl py-2.5 text-foreground outline-none focus:border-[#527958]/50 transition-all text-xs font-bold text-center appearance-none cursor-pointer">
                                                    <option value="Küçük">Küçük</option>
                                                    <option value="Orta">Orta</option>
                                                    <option value="Büyük">Büyük</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setStep(2)} 
                                        disabled={!newPetName || !newPetBreed || !newPetWeight} 
                                        className="w-full py-4.5 bg-[#527958] hover:bg-[#436448] text-white rounded-2xl font-black text-xs uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-green-950/10 cursor-pointer text-center"
                                    >
                                        Sonraki Adım
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-5">
                                    
                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-[24px] flex items-start gap-3.5 shadow-[0_4px_12px_rgba(249,115,22,0.02)]">
                                        <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-orange-850 text-xs font-black uppercase tracking-wider">Tıbbi & SOS Verisi</h4>
                                            <p className="text-[10px] text-orange-700/80 leading-relaxed font-semibold mt-0.5">Bu bilgiler acil/kayıp durumunda Moffi QR künyesinde gösterilir.</p>
                                        </div>
                                    </div>

                                    <div className="bg-card rounded-[28px] p-5 border border-card-border shadow-moffi-card space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block ml-1">Sağlık Durumu</label>
                                            <select 
                                                value={newPetHealthStatus} 
                                                onChange={e => setNewPetHealthStatus(e.target.value)} 
                                                className="w-full bg-[#FBFBFB] border border-card-border rounded-2xl px-4 py-3 text-foreground outline-none focus:border-[#527958]/50 transition-all text-xs font-bold appearance-none cursor-pointer text-center"
                                                style={{ textAlignLast: "center" }}
                                            >
                                                <option value="Mükemmel">Mükemmel 🌟</option>
                                                <option value="İyi">İyi 👍</option>
                                                <option value="Hassas">Hassas ⚠️</option>
                                                <option value="Tedavide">Tedavide 🩺</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Alerjiler & Kronik Hastalıklar</label>
                                            <textarea 
                                                value={newPetHealth} 
                                                onChange={e => setNewPetHealth(e.target.value)} 
                                                placeholder="Örn: Tavuk alerjisi var, günlük ilaç kullanımı vb..." 
                                                className="w-full bg-[#FDF5F5] border border-red-100 rounded-2xl px-4.5 py-3 text-foreground placeholder-gray-400 outline-none focus:border-red-500/30 transition-all font-medium text-xs h-16 resize-none leading-relaxed" 
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Ayırt Edici Özellikleri</label>
                                            <textarea 
                                                value={newPetFeatures} 
                                                onChange={e => setNewPetFeatures(e.target.value)} 
                                                placeholder="Örn: Sol gözünün üstünde küçük beyaz bir leke var..." 
                                                className="w-full bg-[#FBFBFB] border border-card-border rounded-2xl px-4.5 py-3 text-gray-850 placeholder-gray-400 outline-none focus:border-[#527958]/50 transition-all font-medium text-xs h-16 resize-none leading-relaxed" 
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Karakter Özellikleri</label>
                                            <textarea 
                                                value={newPetCharacter} 
                                                onChange={e => setNewPetCharacter(e.target.value)} 
                                                placeholder="Örn: İnsanlara karşı çok sevecendir fakat gürültüden korkar..." 
                                                className="w-full bg-[#FBFBFB] border border-card-border rounded-2xl px-4.5 py-3 text-gray-850 placeholder-gray-400 outline-none focus:border-[#527958]/50 transition-all font-medium text-xs h-16 resize-none leading-relaxed" 
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setStep(3)} 
                                        className="w-full py-4.5 bg-[#527958] hover:bg-[#436448] text-white rounded-2xl font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-green-950/10 cursor-pointer text-center"
                                    >
                                        Sonraki Adım
                                    </button>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-6">
                                    
                                    <div className="bg-card rounded-[28px] p-5 border border-card-border shadow-moffi-card space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider ml-1">Mikroçip Numarası</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    value={newPetMicrochip} 
                                                    onChange={e => setNewPetMicrochip(e.target.value)} 
                                                    placeholder="TR-000000000" 
                                                    className="w-full bg-[#FBFBFB] border border-card-border rounded-2xl pl-12 pr-5 py-4 text-foreground outline-none focus:border-[#527958]/50 transition-all font-mono tracking-widest text-sm" 
                                                />
                                                <ShieldAlert className="absolute left-4.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400/80" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gezi, Su, Beslenme Hedefleri & Seri İstikrarı */}
                                    <div className="bg-card rounded-[28px] p-5 border border-card-border shadow-moffi-card space-y-4">
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
                                                    className="w-full bg-[#FBFBFB] border border-card-border rounded-2xl px-4 py-3 text-foreground text-xs outline-none focus:border-[#527958]/50 transition-all font-semibold" 
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
                                                    className="w-full bg-[#FBFBFB] border border-card-border rounded-2xl px-4 py-3 text-foreground text-xs outline-none focus:border-[#527958]/50 transition-all font-semibold" 
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
                                                    className="w-full bg-[#FBFBFB] border border-card-border rounded-2xl px-4 py-3 text-foreground text-xs outline-none focus:border-[#527958]/50 transition-all font-semibold" 
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
                                                    className="w-full bg-[#FBFBFB] border border-card-border rounded-2xl px-4 py-3 text-gray-850 text-xs outline-none focus:border-[#527958]/50 transition-all font-semibold text-center" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-card border border-card-border rounded-[28px] p-5 shadow-moffi-card relative overflow-hidden group">
                                        <div className="flex justify-between items-center mb-3 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm", newPetShowPhone ? "bg-green-50 text-[#527958]" : "bg-gray-150 text-gray-400")}>
                                                    <PhoneCall className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <span className="font-black text-foreground text-sm tracking-tight block">Telefonu Göster</span>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">SOS Arama Yetkisi</p>
                                                </div>
                                            </div>
                                            <div
                                                className={cn("w-12 h-6.5 rounded-full p-1 cursor-pointer transition-all relative", newPetShowPhone ? "bg-[#527958]" : "bg-gray-200")}
                                                onClick={() => setNewPetShowPhone(!newPetShowPhone)}
                                            >
                                                <motion.div
                                                    animate={{ x: newPetShowPhone ? 22 : 0 }}
                                                    className="w-4.5 h-4.5 rounded-full bg-card shadow-moffi-card"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 leading-relaxed font-semibold mt-3 relative z-10">
                                            Kayıp Modu aktif olduğunda patinizin künyesini okutan kişiler sizinle anında telefon veya WhatsApp üzerinden iletişim kurabilir.
                                        </p>
                                    </div>

                                    <button
                                        disabled={isSaving}
                                        onClick={onSave}
                                        className="w-full py-5 bg-[#527958] hover:bg-[#436448] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-green-950/10 cursor-pointer"
                                    >
                                        {isSaving ? (
                                            <div className="w-5 h-5 border-2 border-card-border border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Dostu Kaydet
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
