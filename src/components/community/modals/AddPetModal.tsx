'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ChevronLeft, Plus, AlertTriangle, ShieldAlert, 
    PhoneCall 
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
                    className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm px-2 pb-2"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="w-full bg-[#12121A] border border-white/10 rounded-[2.5rem] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-1.5 bg-gray-600 rounded-full mb-6" />

                        <div className="w-full flex justify-between items-center mb-6">
                            {step > 1 ? (
                                <button onClick={() => setStep(prev => prev - 1)} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            ) : <div className="w-9" />}
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-white tracking-tight">
                                    {step === 1 ? 'Temel Kimlik' : step === 2 ? 'Karakter & Tıbbi' : 'Güvenlik & Kayıt'}
                                </h2>
                                <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mt-1">Adım {step} / 3</p>
                            </div>
                            <div className="w-9 flex justify-end">
                                <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="w-full max-h-[60vh] overflow-y-auto no-scrollbar pb-6 px-1 flex flex-col items-center">
                            {step === 1 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-4 max-w-sm flex flex-col items-center">
                                    <div className="w-full mb-2">
                                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 items-center px-1">
                                            {newPetPhotos.map((photo, index) => (
                                                <div key={index} className="relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                                                    <img src={photo.preview} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => setNewPetPhotos((prev: any[]) => prev.filter((_, i) => i !== index))}
                                                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3 text-white" />
                                                    </button>
                                                    {index === 0 && (
                                                        <div className="absolute bottom-1 left-1 right-1 bg-cyan-500/80 backdrop-blur-md flex items-center justify-center py-0.5 rounded-lg">
                                                            <span className="text-[9px] font-bold text-white uppercase tracking-wider">Kapak</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {newPetPhotos.length < 5 && (
                                                <label htmlFor="add-pet-photos" className="shrink-0 w-24 h-24 rounded-2xl bg-gradient-to-tr from-cyan-900/20 to-purple-900/20 border-2 border-dashed border-cyan-500/30 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400/60 transition-colors">
                                                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center mb-1">
                                                        <Plus className="w-4 h-4 text-cyan-400" />
                                                    </div>
                                                    <span className="text-[9px] text-cyan-200 font-bold uppercase tracking-wide px-2 text-center">Foto Ekle<br />(Max 5)</span>
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

                                    <div className="flex gap-3 w-full">
                                        <div className="flex-1">
                                            <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">İsim</label>
                                            <input type="text" value={newPetName} onChange={e => setNewPetName(e.target.value)} placeholder="Örn: Pamuk" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors font-bold" />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Tür</label>
                                            <select value={newPetType} onChange={e => setNewPetType(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-2 py-3.5 text-center text-xl mt-1 outline-none focus:border-cyan-400 transition-colors appearance-none" style={{ textAlignLast: "center" }}>
                                                <option value="🐶">🐶</option>
                                                <option value="🐱">🐱</option>
                                                <option value="🦜">🦜</option>
                                                <option value="🐰">🐰</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 w-full">
                                        <div className="flex-[2]">
                                            <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Irkı</label>
                                            <input type="text" value={newPetBreed} onChange={e => setNewPetBreed(e.target.value)} placeholder="Örn: Golden Retriever" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors font-medium text-sm" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Yaş</label>
                                            <input type="text" value={newPetAge} onChange={e => setNewPetAge(e.target.value)} placeholder="Örn: 2 Yaş" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors font-medium text-sm text-center" />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 w-full">
                                        <div className="flex-1">
                                            <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Cinsiyet</label>
                                            <select value={newPetGender} onChange={e => setNewPetGender(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors text-sm">
                                                <option value="Erkek">Erkek</option>
                                                <option value="Dişi">Dişi</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Kısır Mı?</label>
                                            <select value={newPetNeutered} onChange={e => setNewPetNeutered(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors text-sm">
                                                <option value="Evet">Evet</option>
                                                <option value="Hayır">Hayır</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Boyut</label>
                                            <select value={newPetSize} onChange={e => setNewPetSize(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors text-sm">
                                                <option value="Küçük">Küçük</option>
                                                <option value="Orta">Orta</option>
                                                <option value="Büyük">Büyük</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button onClick={() => setStep(2)} disabled={!newPetName || !newPetBreed} className="w-full py-4 mt-4 bg-white rounded-2xl font-black text-black hover:bg-gray-200 transition-colors disabled:opacity-50">
                                        Sonraki Adım
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-4 max-w-sm">
                                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-orange-400 text-sm font-bold mb-1">Tıbbi & Fiziksel İşaretler</h4>
                                            <p className="text-[11px] text-orange-200/80 leading-relaxed font-medium">Bu bilgiler, kayıp durumunda sizi temsil edecek Acil QR Sayfasında (SOS) hayati önem taşır.</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Sağlık & Alerji (Kritik!)</label>
                                        <textarea value={newPetHealth} onChange={e => setNewPetHealth(e.target.value)} placeholder="Örn: Tavuk alerjisi var..." className="w-full bg-red-950/20 border border-red-500/30 rounded-2xl px-5 py-3.5 text-white mt-1 outline-none focus:border-red-500 transition-colors font-medium text-sm h-20 resize-none" />
                                    </div>

                                    <div>
                                        <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Ayırt Edici Özellikleri</label>
                                        <textarea value={newPetFeatures} onChange={e => setNewPetFeatures(e.target.value)} placeholder="Örn: Sol kulağındaki hafif kesik..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors font-medium text-sm h-16 resize-none" />
                                    </div>

                                    <div>
                                        <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Karakteri</label>
                                        <textarea value={newPetCharacter} onChange={e => setNewPetCharacter(e.target.value)} placeholder="Örn: Çok uysaldır..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white mt-1 outline-none focus:border-cyan-400 transition-colors font-medium text-sm h-16 resize-none" />
                                    </div>

                                    <button onClick={() => setStep(3)} className="w-full py-4 mt-4 bg-white rounded-2xl font-black text-black hover:bg-gray-200 transition-colors disabled:opacity-50">
                                        Sonraki Adım
                                    </button>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full space-y-5 max-w-sm">
                                    <div>
                                        <label className="text-[11px] text-gray-400 font-bold ml-3 uppercase tracking-wider">Mikroçip Numarası</label>
                                        <div className="relative mt-1">
                                            <input type="text" value={newPetMicrochip} onChange={e => setNewPetMicrochip(e.target.value)} placeholder="TR-000000000" className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white outline-none focus:border-cyan-400 transition-colors font-mono tracking-widest text-sm" />
                                            <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <PhoneCall className={cn("w-5 h-5 transition-colors", newPetShowPhone ? "text-cyan-400" : "text-gray-500")} />
                                                <span className="font-bold text-white text-sm">Telefonu Göster</span>
                                            </div>
                                            <div
                                                className={cn("w-12 h-6 rounded-full p-1 cursor-pointer transition-colors relative", newPetShowPhone ? "bg-cyan-500" : "bg-gray-700")}
                                                onClick={() => setNewPetShowPhone(!newPetShowPhone)}
                                            >
                                                <motion.div
                                                    animate={{ x: newPetShowPhone ? 24 : 0 }}
                                                    className="w-4 h-4 rounded-full bg-white shadow-md"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium mt-2">
                                            Eğer "Kayıp Alarmı" verirseniz, Moffi QR kodunuzu okutan kişiler doğrudan sizinle telefon numaranız üzerinden görüşebilir.
                                        </p>
                                    </div>

                                    <button
                                        disabled={isSaving}
                                        onClick={onSave}
                                        className="w-full py-4 mt-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl font-black text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Plus className="w-5 h-5" /> Dostu Kaydet
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
