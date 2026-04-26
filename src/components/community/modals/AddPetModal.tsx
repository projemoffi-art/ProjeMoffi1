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
    onSave
}: AddPetModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex flex-col justify-end sm:items-center sm:justify-center sm:px-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={cn(
                            "w-full max-w-xl bg-background border border-card-border shadow-[0_-20px_50px_rgba(0,0,0,0.5)] relative flex flex-col",
                            "rounded-t-[3.5rem] sm:rounded-[2.5rem] p-6 sm:p-8",
                            "pb-safe sm:pb-8 max-h-[92vh] overflow-y-auto no-scrollbar"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Mobile Handle */}
                        <div className="w-12 h-1.5 bg-foreground/10 rounded-full mx-auto mb-6 sm:hidden" />

                        <div className="w-full flex justify-between items-center mb-10">
                            {step > 1 ? (
                                <button onClick={() => setStep(prev => prev - 1)} className="w-10 h-10 bg-foreground/5 rounded-full text-foreground/50 hover:text-foreground transition-all flex items-center justify-center">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            ) : <div className="w-10" />}
                            
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Yeni Pati Ekle</h2>
                                <div className="flex items-center justify-center gap-1.5 mt-1">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={cn("h-1 rounded-full transition-all duration-300", step === i ? "w-6 bg-accent" : "w-2 bg-foreground/10")} />
                                    ))}
                                </div>
                            </div>

                            <button onClick={onClose} className="w-10 h-10 bg-foreground/5 rounded-full text-foreground/50 hover:text-foreground transition-all flex items-center justify-center">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="w-full">
                            {step === 1 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-6">
                                    {/* PHOTO GALLERY SECTION */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2">Fotoğraflar (Max 5)</label>
                                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                            {newPetPhotos.map((photo, index) => (
                                                <div key={index} className="relative shrink-0 w-28 h-28 rounded-2xl overflow-hidden border border-card-border shadow-lg group">
                                                    <img src={photo.preview} className="w-full h-full object-cover" alt="Pet Preview" />
                                                    <button
                                                        onClick={() => setNewPetPhotos((prev: any[]) => prev.filter((_, i) => i !== index))}
                                                        className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-4 h-4 text-white" />
                                                    </button>
                                                    {index === 0 && (
                                                        <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-accent/90 backdrop-blur-md flex items-center justify-center py-1 rounded-xl">
                                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Kapak</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {newPetPhotos.length < 5 && (
                                                <label htmlFor="add-pet-photos" className="shrink-0 w-28 h-28 rounded-2xl bg-foreground/5 border-2 border-dashed border-card-border flex flex-col items-center justify-center cursor-pointer hover:border-accent/40 transition-all group">
                                                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                        <Plus className="w-5 h-5 text-accent" />
                                                    </div>
                                                    <span className="text-[9px] text-secondary font-black uppercase tracking-widest text-center px-2">Ekle</span>
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

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2">İsim</label>
                                            <input 
                                                type="text" 
                                                value={newPetName} 
                                                onChange={e => setNewPetName(e.target.value)} 
                                                placeholder="Örn: Pamuk" 
                                                className="w-full bg-foreground/5 border border-card-border rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent/50 transition-all font-bold" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2 text-center block">Tür</label>
                                            <select 
                                                value={newPetType} 
                                                onChange={e => setNewPetType(e.target.value)} 
                                                className="w-full bg-foreground/5 border border-card-border rounded-2xl px-2 py-4 text-center text-xl outline-none focus:border-accent/50 transition-all appearance-none" 
                                                style={{ textAlignLast: "center" }}
                                            >
                                                <option value="🐶">🐶</option>
                                                <option value="🐱">🐱</option>
                                                <option value="🦜">🦜</option>
                                                <option value="🐰">🐰</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2">Irkı</label>
                                            <input 
                                                type="text" 
                                                value={newPetBreed} 
                                                onChange={e => setNewPetBreed(e.target.value)} 
                                                placeholder="Örn: Golden Retriever" 
                                                className="w-full bg-foreground/5 border border-card-border rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent/50 transition-all font-medium text-sm" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2">Yaş</label>
                                            <input 
                                                type="text" 
                                                value={newPetAge} 
                                                onChange={e => setNewPetAge(e.target.value)} 
                                                placeholder="Örn: 2 Yaş" 
                                                className="w-full bg-foreground/5 border border-card-border rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent/50 transition-all font-medium text-sm text-center" 
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2 text-center block">Cinsiyet</label>
                                            <select value={newPetGender} onChange={e => setNewPetGender(e.target.value)} className="w-full bg-foreground/5 border border-card-border rounded-2xl px-2 py-4 text-foreground outline-none focus:border-accent/50 transition-all text-xs font-bold text-center appearance-none">
                                                <option value="Erkek">Erkek</option>
                                                <option value="Dişi">Dişi</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2 text-center block">Kısır Mı?</label>
                                            <select value={newPetNeutered} onChange={e => setNewPetNeutered(e.target.value)} className="w-full bg-foreground/5 border border-card-border rounded-2xl px-2 py-4 text-foreground outline-none focus:border-accent/50 transition-all text-xs font-bold text-center appearance-none">
                                                <option value="Evet">Evet</option>
                                                <option value="Hayır">Hayır</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2 text-center block">Boyut</label>
                                            <select value={newPetSize} onChange={e => setNewPetSize(e.target.value)} className="w-full bg-foreground/5 border border-card-border rounded-2xl px-2 py-4 text-foreground outline-none focus:border-accent/50 transition-all text-xs font-bold text-center appearance-none">
                                                <option value="Küçük">Küçük</option>
                                                <option value="Orta">Orta</option>
                                                <option value="Büyük">Büyük</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setStep(2)} 
                                        disabled={!newPetName || !newPetBreed} 
                                        className="w-full py-5 mt-4 bg-foreground text-background rounded-2xl font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        Sonraki Adım
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-6">
                                    <div className="p-5 bg-orange-500/10 border border-orange-500/20 rounded-[2rem] flex items-start gap-4">
                                        <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                                            <AlertTriangle className="w-5 h-5 text-orange-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-orange-400 text-sm font-black uppercase tracking-tighter">Tıbbi & SOS Verisi</h4>
                                            <p className="text-[11px] text-orange-200/60 leading-relaxed font-medium mt-1">Bu bilgiler kayıp durumunda QR sayfasında (SOS) hayati önem taşır.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2">Sağlık & Alerji (Kritik!)</label>
                                        <textarea 
                                            value={newPetHealth} 
                                            onChange={e => setNewPetHealth(e.target.value)} 
                                            placeholder="Örn: Tavuk alerjisi var, ilaç kullanımı vb..." 
                                            className="w-full bg-red-500/5 border border-red-500/20 rounded-2xl px-5 py-4 text-foreground outline-none focus:border-red-500/50 transition-all font-medium text-sm h-24 resize-none" 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2">Ayırt Edici Özellikleri</label>
                                        <textarea 
                                            value={newPetFeatures} 
                                            onChange={e => setNewPetFeatures(e.target.value)} 
                                            placeholder="Örn: Sol kulağında hafif kesik, özel bir leke..." 
                                            className="w-full bg-foreground/5 border border-card-border rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent/50 transition-all font-medium text-sm h-20 resize-none" 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2">Karakteri</label>
                                        <textarea 
                                            value={newPetCharacter} 
                                            onChange={e => setNewPetCharacter(e.target.value)} 
                                            placeholder="Örn: İnsanlara çok uysal, diğer köpeklerden korkar..." 
                                            className="w-full bg-foreground/5 border border-card-border rounded-2xl px-5 py-4 text-foreground outline-none focus:border-accent/50 transition-all font-medium text-sm h-20 resize-none" 
                                        />
                                    </div>

                                    <button 
                                        onClick={() => setStep(3)} 
                                        className="w-full py-5 mt-4 bg-foreground text-background rounded-2xl font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all"
                                    >
                                        Sonraki Adım
                                    </button>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] ml-2">Mikroçip Numarası</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={newPetMicrochip} 
                                                onChange={e => setNewPetMicrochip(e.target.value)} 
                                                placeholder="TR-000000000" 
                                                className="w-full bg-foreground/5 border border-card-border rounded-2xl pl-14 pr-5 py-5 text-foreground outline-none focus:border-accent/50 transition-all font-mono tracking-widest text-sm" 
                                            />
                                            <ShieldAlert className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-secondary/40" />
                                        </div>
                                    </div>

                                    <div className="bg-foreground/5 border border-card-border rounded-[2.5rem] p-6 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-accent/10" />
                                        
                                        <div className="flex justify-between items-center mb-3 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", newPetShowPhone ? "bg-accent/20 text-accent" : "bg-foreground/10 text-secondary")}>
                                                    <PhoneCall className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <span className="font-black text-foreground uppercase text-sm italic tracking-tighter">Telefonu Göster</span>
                                                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">SOS Modu</p>
                                                </div>
                                            </div>
                                            <div
                                                className={cn("w-14 h-7 rounded-full p-1 cursor-pointer transition-all relative", newPetShowPhone ? "bg-accent" : "bg-foreground/10")}
                                                onClick={() => setNewPetShowPhone(!newPetShowPhone)}
                                            >
                                                <motion.div
                                                    animate={{ x: newPetShowPhone ? 28 : 0 }}
                                                    className="w-5 h-5 rounded-full bg-white shadow-lg"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-secondary leading-relaxed font-medium mt-4 relative z-10">
                                            Kayıp Alarmı durumunda, patinizi bulan kişiler doğrudan sizinle telefon numaranız üzerinden iletişime geçebilir.
                                        </p>
                                    </div>

                                    <button
                                        disabled={isSaving}
                                        onClick={onSave}
                                        className="w-full py-6 mt-4 bg-foreground text-background rounded-2xl font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl shadow-accent/20"
                                    >
                                        {isSaving ? (
                                            <div className="w-6 h-6 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Sparkles className="w-6 h-6" />
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
