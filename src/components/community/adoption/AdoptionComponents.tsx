'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, HeartHandshake, Camera, Plus, CheckCheck, 
    ShieldAlert, MessageCircle, Check, ChevronLeft, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
// 1. ADD ADOPTION MODAL
interface AddAdoptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    adoptionPhotoRef: React.RefObject<HTMLInputElement>;
    adoptionPetPhotos: { file: File, preview: string }[];
    setAdoptionPetPhotos: (val: any | ((p: any) => any)) => void;
    adoptionPetType: string;
    setAdoptionPetType: (val: string) => void;
    adoptionPetName: string;
    setAdoptionPetName: (val: string) => void;
    adoptionPetBreed: string;
    setAdoptionPetBreed: (val: string) => void;
    adoptionPetAge: string;
    setAdoptionPetAge: (val: string) => void;
    adoptionPetDesc: string;
    setAdoptionPetDesc: (val: string) => void;
    isSubmitting: boolean;
    onPost: () => Promise<void>;
}

export function AddAdoptionModal({
    isOpen,
    onClose,
    adoptionPhotoRef,
    adoptionPetPhotos,
    setAdoptionPetPhotos,
    adoptionPetType,
    setAdoptionPetType,
    adoptionPetName,
    setAdoptionPetName,
    adoptionPetBreed,
    setAdoptionPetBreed,
    adoptionPetAge,
    setAdoptionPetAge,
    adoptionPetDesc,
    setAdoptionPetDesc,
    isSubmitting,
    onPost
}: AddAdoptionModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] flex flex-col justify-end bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            if (offset.y > 100 || velocity.y > 500) {
                                onClose();
                            }
                        }}
                        className="relative w-full h-[90vh] bg-[#12121A] rounded-t-[2.5rem] flex flex-col overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.8)] border-t border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={onClose}
                            className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-50 hover:bg-white/40 transition-colors cursor-pointer"
                        />

                        <div className="p-6 pt-12 pb-4 border-b border-white/5 shrink-0">
                            <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                <HeartHandshake className="w-6 h-6 text-cyan-400" /> Sahiplendirme İlanı Ver
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">Dostumuz için en iyi yuvayı bulalım.</p>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                            <input
                                type="file"
                                ref={adoptionPhotoRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                    const files = e.target.files;
                                    if (files) {
                                        const newPhotos = Array.from(files).map(file => ({
                                            file,
                                            preview: URL.createObjectURL(file)
                                        }));
                                        setAdoptionPetPhotos((prev: any[]) => [...prev, ...newPhotos]);
                                        if (adoptionPhotoRef.current) adoptionPhotoRef.current.value = '';
                                    }
                                }}
                            />
                            {adoptionPetPhotos.length > 0 ? (
                                <div className="grid grid-cols-4 gap-3 mb-2">
                                    {adoptionPetPhotos.map((photo, idx) => (
                                        <div key={idx} className="aspect-square rounded-2xl bg-[#1C1C1E] border border-white/10 relative overflow-hidden group">
                                            <img src={photo.preview} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                            <button
                                                onClick={() => setAdoptionPetPhotos((prev: any[]) => prev.filter((_, i) => i !== idx))}
                                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {adoptionPetPhotos.length < 4 && (
                                        <button
                                            onClick={() => adoptionPhotoRef.current?.click()}
                                            className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-400 hover:border-cyan-400/50 hover:text-cyan-400 transition-all font-bold"
                                        >
                                            <Plus className="w-6 h-6" />
                                            <span className="text-[10px] mt-1">Ekle</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div
                                    onClick={() => adoptionPhotoRef.current?.click()}
                                    className="w-full h-52 rounded-3xl bg-[#1C1C1E] border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-400 hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-colors cursor-pointer group mb-2 shadow-inner overflow-hidden"
                                >
                                    <Camera className="w-8 h-8 mb-2 group-hover:text-cyan-400 group-hover:scale-110 transition-all" />
                                    <span className="text-sm font-bold">Net Fotoğraflar Yükle</span>
                                    <span className="text-[10px] mt-1 text-gray-500 font-medium italic">Sahiplendirme şansını %80 artırır</span>
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Kategori</label>
                                    <div className="flex gap-2 mb-4">
                                        {[
                                            { id: 'cat', label: 'Kedi', icon: '🐱' },
                                            { id: 'dog', label: 'Köpek', icon: '🐶' },
                                            { id: 'bird', label: 'Kuş', icon: '🦜' },
                                            { id: 'other', label: 'Diğer', icon: '🐾' },
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                onClick={() => setAdoptionPetType(type.id)}
                                                className={cn(
                                                    "flex-1 py-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1 border",
                                                    adoptionPetType === type.id ? "bg-cyan-500/20 border-cyan-400 text-cyan-400" : "bg-[#0A0A0E] border-white/5 text-gray-500"
                                                )}
                                            >
                                                <span className="text-xl">{type.icon}</span>
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>

                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">İsim & Tür</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="İsim (Örn: Pamuk)"
                                            value={adoptionPetName}
                                            onChange={(e) => setAdoptionPetName(e.target.value)}
                                            className="w-1/2 bg-[#0A0A0E] border border-white/5 rounded-2xl px-4 py-3 text-white text-[15px] focus:outline-none focus:border-cyan-400 transition-colors"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Tür / Irk"
                                            value={adoptionPetBreed}
                                            onChange={(e) => setAdoptionPetBreed(e.target.value)}
                                            className="w-1/2 bg-[#0A0A0E] border border-white/5 rounded-2xl px-4 py-3 text-white text-[15px] focus:outline-none focus:border-cyan-400 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Yaş & Açıklama</label>
                                    <input
                                        type="text"
                                        placeholder="Yaşı (Örn: 2 Aylık)"
                                        value={adoptionPetAge}
                                        onChange={(e) => setAdoptionPetAge(e.target.value)}
                                        className="w-full bg-[#0A0A0E] border border-white/5 rounded-2xl px-4 py-3 text-white text-[15px] focus:outline-none focus:border-cyan-400 transition-colors mb-3"
                                    />
                                    <textarea
                                        rows={4}
                                        placeholder="Onu biraz anlatın..."
                                        value={adoptionPetDesc}
                                        onChange={(e) => setAdoptionPetDesc(e.target.value)}
                                        className="w-full bg-[#0A0A0E] border border-white/5 rounded-2xl px-4 py-3 text-white text-[15px] focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                                    />
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-3xl border border-red-500/20 mt-2">
                                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
                                        <span className="text-red-400 font-bold tracking-wide">ÜCRET TALEP ETMEK YASAKTIR.</span> Moffi tamamen ücretsiz sahiplendirme üzerine kuruludur.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 pt-3 pb-8 bg-[#12121A] shrink-0 border-t border-white/5 relative z-20">
                            <button
                                onClick={onPost}
                                disabled={isSubmitting}
                                className="w-full py-4 rounded-full bg-white text-black font-black text-[15px] shadow-[0_10px_30px_rgba(255,255,255,0.15)] active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <><CheckCheck className="w-5 h-5" /> İlanı Onaya Gönder</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// 2. ADOPTION PET DETAIL MODAL
interface AdoptionPetDetailModalProps {
    pet: any;
    onClose: () => void;
    onChat: (pet: any) => void;
    onApply: () => void;
    onReport: (id: string) => void;
}

export function AdoptionPetDetailModal({
    pet,
    onClose,
    onChat,
    onApply,
    onReport
}: AdoptionPetDetailModalProps) {
    if (!pet) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[310] flex flex-col justify-end"
                onClick={onClose}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    drag="y"
                    dragConstraints={{ top: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                        if (offset.y > 100 || velocity.y > 500) {
                            onClose();
                        }
                    }}
                    className="relative w-full h-[85vh] bg-[#0A0A0E] rounded-t-[2.5rem] flex flex-col overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-50 hover:bg-white/40 transition-colors cursor-pointer"
                    />

                    <div className="w-full h-[45%] relative shrink-0">
                        <img src={pet.img} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0A0A0E] to-transparent" />
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar px-6 -mt-8 relative z-10">
                        <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest">{pet.breed}</span>
                        <h1 className="text-4xl font-black text-white leading-tight mt-1">{pet.name}</h1>
                        <div className="flex gap-2 mt-4">
                            {pet.tags?.map((tag: string) => (
                                <div key={tag} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5">
                                    <Check className="w-3 h-3 text-cyan-400" /> {tag}
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 bg-white/5 rounded-3xl p-5 border border-white/5">
                            <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Hikaye & Durum</h3>
                            <p className="text-gray-300 text-sm leading-relaxed font-medium">{pet.desc}</p>
                        </div>
                    </div>

                    <div className="w-full p-6 pt-2 pb-10 bg-gradient-to-t from-[#0A0A0E] via-[#0A0A0E] to-transparent relative z-20">
                        <div className="flex gap-3">
                            <button onClick={() => onChat(pet)} className="flex-1 py-4 rounded-full bg-white/10 border border-white/10 text-white font-bold text-[15px] active:scale-95 transition-transform flex items-center justify-center gap-2">
                                <MessageCircle className="w-5 h-5" /> Mesaj
                            </button>
                            <button onClick={onApply} className="flex-[2] py-4 rounded-full bg-cyan-500 text-black font-black text-[15px] shadow-[0_10px_30px_rgba(34,211,238,0.3)] active:scale-95 transition-transform flex items-center justify-center gap-2">
                                <HeartHandshake className="w-5 h-5" /> Sahiplenme Başvurusu
                            </button>
                        </div>
                        <button onClick={() => onReport(pet.id)} className="w-full mt-3 py-3 rounded-full bg-red-500/10 text-red-400 font-bold text-[13px] border border-red-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> Ücret Talep Ediyor / İhbar Et
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// 3. REPORT ADOPTION MODAL
interface ReportAdoptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason: string;
    setReason: (val: string) => void;
    onReport: () => Promise<void>;
    isSubmitting: boolean;
}

export function ReportAdoptionModal({
    isOpen,
    onClose,
    reason,
    setReason,
    onReport,
    isSubmitting
}: ReportAdoptionModalProps) {
    const reportOptions = [
        { value: 'fee', label: '💸 Ücret Talep Ediyor', desc: 'Sahiplendirme için para isteniyor' },
        { value: 'sale', label: '🏷️ Hayvan Satışı', desc: 'Ticari amaçlı satış ilanı' },
        { value: 'fake', label: '❌ Sahte İlan', desc: 'Görsel veya bilgiler gerçek değil' },
        { value: 'inappropriate', label: '⚠️ Uygunsuz İçerik', desc: 'Kötü muamele veya şidder' },
        { value: 'other', label: '🔍 Diğer', desc: 'Diğer güvenlik sorunları' }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[501] flex flex-col justify-end"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 250 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            if (offset.y > 100 || velocity.y > 500) {
                                onClose();
                            }
                        }}
                        className="relative bg-[#12121A] rounded-t-[2.5rem] p-6 pb-12 border-t border-white/10 z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={onClose}
                            className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 hover:bg-white/40 transition-colors cursor-pointer block" 
                        />
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldAlert className="w-6 h-6 text-red-500" />
                            <div>
                                <h3 className="text-white font-black text-lg">İlanı Bildir</h3>
                                <p className="text-gray-500 text-xs">Moffi ekibi en kısa sürede inceleyecek</p>
                            </div>
                        </div>
                        <div className="space-y-2 mb-6">
                            {reportOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setReason(opt.value)}
                                    className={cn(
                                        "w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left",
                                        reason === opt.value ? "bg-red-500/10 border-red-500/30" : "bg-white/5 border-white/5"
                                    )}
                                >
                                    <div className="flex-1">
                                        <p className="text-white font-bold text-sm">{opt.label}</p>
                                        <p className="text-gray-500 text-xs mt-0.5">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={onReport}
                            disabled={!reason || isSubmitting}
                            className="w-full py-4 rounded-full bg-red-500 text-white font-black text-[15px] active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><ShieldAlert className="w-5 h-5" /> Bildirimi Gönder</>
                            )}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// 4. ADOPTION APPLICATION FORM
interface AdoptionApplicationFormProps {
    isOpen: boolean;
    onClose: () => void;
    pet: any;
    experience: string;
    setExperience: (val: string) => void;
    homeType: string;
    setHomeType: (val: string) => void;
    note: string;
    setNote: (val: string) => void;
    isSubmitting: boolean;
    onSubmit: () => Promise<void>;
}

export function AdoptionApplicationForm({
    isOpen,
    onClose,
    pet,
    experience,
    setExperience,
    homeType,
    setHomeType,
    note,
    setNote,
    isSubmitting,
    onSubmit
}: AdoptionApplicationFormProps) {
    if (!pet) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[400] flex flex-col justify-end"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 250 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            if (offset.y > 100 || velocity.y > 500) {
                                onClose();
                            }
                        }}
                        className="relative bg-[#0A0A0E] rounded-t-[3rem] p-6 pb-12 border-t border-white/10 z-10 flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={onClose}
                            className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 hover:bg-white/40 transition-colors cursor-pointer block" 
                        />
                        <div className="flex items-center gap-4 mb-8">
                            <img src={pet.img} className="w-16 h-16 rounded-[1.5rem] overflow-hidden border border-white/10 object-cover" />
                            <div>
                                <h3 className="text-white font-black text-xl">{pet.name} İçin Başvuru</h3>
                                <p className="text-cyan-400 text-xs font-bold uppercase mt-1 tracking-widest">Son Adım: Yuva Olma Formu</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                            <div>
                                <label className="text-gray-500 text-[11px] font-black uppercase tracking-widest ml-1 mb-2 block">Evcil Hayvan Tecrübeniz</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['0-2 Yaş', '3-5 Yaş', '5+ Yaş'].map(lvl => (
                                        <button key={lvl} onClick={() => setExperience(lvl)} className={cn("py-3 rounded-2xl text-xs font-bold border transition-all", experience === lvl ? "bg-cyan-500/20 border-cyan-400 text-cyan-400" : "bg-white/5 border-white/5 text-gray-400")}>{lvl}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-500 text-[11px] font-black uppercase tracking-widest ml-1 mb-2 block">Yaşam Alanınız</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Apartman', 'Müstakil', 'Bahçeli'].map(type => (
                                        <button key={type} onClick={() => setHomeType(type)} className={cn("py-3 rounded-2xl text-xs font-bold border transition-all", homeType === type ? "bg-cyan-500/20 border-cyan-400 text-cyan-400" : "bg-white/5 border-white/5 text-gray-400")}>{type}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-500 text-[11px] font-black uppercase tracking-widest ml-1 mb-2 block">Kendinizden Bahsedin</label>
                                <textarea rows={4} placeholder="Neden onu sahiplenmek istiyorsunuz?" value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-cyan-400 transition-colors resize-none" />
                            </div>
                        </div>
                        <button onClick={onSubmit} disabled={!note.trim() || isSubmitting} className="w-full mt-8 py-4 rounded-full bg-cyan-500 text-black font-black text-[16px] shadow-[0_15px_40px_rgba(34,211,238,0.2)] active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-40">
                            {isSubmitting ? <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><CheckCheck className="w-5 h-5" /> Başvuruyu Tamamla</>}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// 5. ADOPTION CHAT
interface AdoptionChatProps {
    isOpen: boolean;
    onClose: () => void;
    pet: any;
    messages: any[];
    newMessage: string;
    setNewMessage: (val: string) => void;
    onSend: () => Promise<void>;
}

export function AdoptionChat({
    isOpen,
    onClose,
    pet,
    messages,
    newMessage,
    setNewMessage,
    onSend
}: AdoptionChatProps) {
    if (!pet) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="fixed inset-0 z-[500] bg-black flex flex-col pt-safe"
                >
                    <div className="pb-4 px-4 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center gap-3">
                        <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-3">
                            <img src={pet.img} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                            <div>
                                <h3 className="text-white font-bold text-sm leading-tight">{pet.name} İlanı</h3>
                                <p className="text-green-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Sahiplendirme Süreci Aktif
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("max-w-[80%] flex flex-col", msg.sender === 'me' ? "ml-auto items-end" : msg.sender === 'system' ? "mx-auto items-center" : "mr-auto items-start")}>
                                {msg.sender === 'system' ? (
                                    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-[11px] text-gray-400 text-center">{msg.text}</div>
                                ) : (
                                    <>
                                        <div className={cn("px-4 py-2.5 rounded-2xl text-[14px] font-medium", msg.sender === 'me' ? "bg-cyan-500 text-white rounded-tr-sm" : "bg-[#1C1C1E] text-white rounded-tl-sm border border-white/5")}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-tight">{msg.time}</span>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-4 pb-10 bg-black/80 backdrop-blur-xl border-t border-white/5">
                        <div className="flex items-center gap-2 bg-[#1C1C1E] rounded-full p-2 pl-4 border border-white/5">
                            <input
                                type="text"
                                placeholder="Bir mesaj yazın..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onSend()}
                                className="flex-1 bg-transparent border-none outline-none text-white text-[14px]"
                            />
                            <button onClick={onSend} className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white active:scale-95 transition-transform">
                                <Send className="w-4 h-4 ml-0.5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
