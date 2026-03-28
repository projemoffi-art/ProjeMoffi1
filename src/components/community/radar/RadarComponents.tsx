'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ChevronLeft, MapPin, Camera, Plus, Activity, 
    Share2, Phone, MessageCircle, AlertCircle, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 1. ADD LOST PET (SOS) MODAL
interface AddLostPetModalProps {
    isOpen: boolean;
    onClose: () => void;
    lostPetName: string;
    setLostPetName: (val: string) => void;
    lostPetBreed: string;
    setLostPetBreed: (val: string) => void;
    lostPetLocation: string;
    setLostPetLocation: (val: string) => void;
    lostPetDesc: string;
    setLostPetDesc: (val: string) => void;
    lostPetPhotos: { file: File, preview: string }[];
    setLostPetPhotos: (val: any | ((p: any) => any)) => void;
    sosInputRef: React.RefObject<HTMLInputElement>;
    isSubmitting: boolean;
    onSubmit: () => Promise<void>;
    handleSosImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AddLostPetModal({
    isOpen,
    onClose,
    lostPetName,
    setLostPetName,
    lostPetBreed,
    setLostPetBreed,
    lostPetLocation,
    setLostPetLocation,
    lostPetDesc,
    setLostPetDesc,
    lostPetPhotos,
    setLostPetPhotos,
    sosInputRef,
    isSubmitting,
    onSubmit,
    handleSosImageSelect
}: AddLostPetModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed inset-0 z-[120] bg-[#0A0A0E] flex flex-col pt-12 text-white"
                >
                    <div className="flex justify-between items-center px-6 pb-4 border-b border-red-500/20">
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center -ml-2 hover:bg-white/10 transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg font-black text-red-500 tracking-wider">ACİL DURUM İLANI</h2>
                        <div className="w-10" />
                    </div>

                    <div className="flex-1 overflow-y-auto w-full max-w-lg mx-auto p-6 space-y-6">
                        <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 text-center shadow-inner relative overflow-hidden">
                            <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
                            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                                <MapPin className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Çevredeki Herkesi Uyar!</h3>
                            <p className="text-sm text-red-500 font-medium leading-relaxed">
                                Kaybolan dostunuzun bilgilerini girdiğinizde, 5 km çapındaki tüm Moffi üyelerine anında acil durum (SOS) bildirimi gönderilecektir.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">İsim</label>
                                <input value={lostPetName} onChange={e => setLostPetName(e.target.value)} type="text" placeholder="Örn: Buster" className="w-full mt-1.5 bg-[#12121A] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-red-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Tür / Irk</label>
                                <input value={lostPetBreed} onChange={e => setLostPetBreed(e.target.value)} type="text" placeholder="Örn: Golden Retriever" className="w-full mt-1.5 bg-[#12121A] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-red-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Son Görüldüğü Yer</label>
                                <input value={lostPetLocation} onChange={e => setLostPetLocation(e.target.value)} type="text" placeholder="Örn: Kadıköy Moda Sahili" className="w-full mt-1.5 bg-[#12121A] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-red-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Detaylar / Not</label>
                                <textarea value={lostPetDesc} onChange={e => setLostPetDesc(e.target.value)} placeholder="Tasma rengi, belirgin özelliği..." className="w-full mt-1.5 bg-[#12121A] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-red-500 transition-colors resize-none h-24" />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Fotoğraflar</label>
                                    <button onClick={() => sosInputRef.current?.click()} className="text-[10px] bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20 font-bold uppercase tracking-tight flex items-center gap-1.5">
                                        <Plus className="w-3 h-3" /> Fotoğraf Ekle
                                    </button>
                                    <input type="file" ref={sosInputRef} className="hidden" accept="image/*" multiple onChange={handleSosImageSelect} />
                                </div>
                                {lostPetPhotos.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-3">
                                        {lostPetPhotos.map((photo, idx) => (
                                            <div key={idx} className="aspect-square rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group">
                                                <img src={photo.preview} className="w-full h-full object-cover" />
                                                <button onClick={() => setLostPetPhotos((prev: any[]) => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div onClick={() => sosInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-600 hover:border-red-500/30 transition-all cursor-pointer">
                                        <Camera className="w-8 h-8 mb-2 opacity-30" />
                                        <p className="text-[11px] font-bold uppercase tracking-widest">Fotoğraf Ekle</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-red-500/20 bg-[#0A0A0E] shrink-0">
                        <button
                            onClick={onSubmit}
                            disabled={isSubmitting}
                            className={cn("w-full py-4 rounded-2xl font-black text-white text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(220,38,38,0.4)] transition-all", isSubmitting ? "bg-red-800" : "bg-red-600 active:scale-95")}
                        >
                            {isSubmitting ? <span className="animate-pulse">Sinyal İletiliyor...</span> : <><Activity className="w-5 h-5 animate-pulse" /> S.O.S Sinyali Gönder</>}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// 2. LOST PET DETAIL MODAL
interface LostPetDetailModalProps {
    pet: any;
    onClose: () => void;
    onShare: () => void;
    onReportLocation: () => void;
    isAdmin?: boolean;
}

export function LostPetDetailModal({
    pet,
    onClose,
    onShare,
    onReportLocation,
    isAdmin
}: LostPetDetailModalProps) {
    if (!pet) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-0 z-[130] bg-black text-white flex flex-col pt-safe"
            >
                <div className="relative w-full h-[55vh] shrink-0 overflow-hidden">
                    <img src={pet.media_url || pet.avatar} className="w-full h-full object-cover opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0E] via-[#0A0A0E]/40 to-transparent" />
                    
                    <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent pt-12">
                        <button onClick={onClose} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center"><ChevronLeft className="w-6 h-6" /></button>
                        <button onClick={onShare} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center"><Share2 className="w-5 h-5" /></button>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(220,38,38,0.5)]">KAYIP İLANI</span>
                            <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(pet.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight">{pet.pet_name}</h1>
                        <p className="text-gray-300 text-lg font-medium">{pet.pet_breed || "Belirtilmedi"}</p>
                    </div>
                </div>

                <div className="flex-1 bg-[#0A0A0E] overflow-y-auto no-scrollbar pb-32">
                    <div className="p-6 space-y-8 max-w-lg mx-auto">
                        <div className="flex gap-4">
                            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-1.5">
                                <MapPin className="w-6 h-6 text-red-400" />
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Son Konumu</span>
                                <span className="text-sm font-bold text-gray-200">{pet.last_location || "Bilinmiyor"}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">İlan Detayları</h3>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full" />
                                <p className="text-gray-300 text-base leading-relaxed font-medium relative z-10">{pet.description || "Açıklama belirtilmemiş."}</p>
                            </div>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-5 flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">Bu bir S.O.S (Acil Durum) ilanıdır. Dostumuzu görenlerin en yakın emniyet birimine veya sahibine aşağıdaki butonlarla ulaşması rica olunur.</p>
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-20 pb-10">
                    <div className="flex gap-4 max-w-lg mx-auto">
                        <button onClick={onReportLocation} className="flex-[2] py-4 rounded-2xl bg-white text-black font-black text-base shadow-[0_15px_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all flex items-center justify-center gap-2">
                            <MapPin className="w-5 h-5" /> Gördüm / Konum Bildir
                        </button>
                        <a href={`tel:${pet.phone || ''}`} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black text-base shadow-[0_15px_40px_rgba(220,38,38,0.3)] active:scale-95 transition-all flex items-center justify-center">
                            <Phone className="w-6 h-6" />
                        </a>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
