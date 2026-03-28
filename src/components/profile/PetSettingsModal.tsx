"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, User, Phone, 
    MapPin, Hash, Award, Calendar, 
    Fingerprint, Scissors, Zap, Stethoscope,
    ShieldCheck, Trash2, Camera, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PetSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pet: any;
    onSave: (updatedPet: any) => void;
}
const SettingRow = ({ icon: Icon, label, value, onChange, type = "text", options, tags, color = "text-white" }: any) => (
    <div className="w-full flex flex-col p-4 bg-white/5 border-b border-white/5 last:border-0 group transition-colors hover:bg-white/[0.07]">
        <div className="flex items-center gap-4">
            <div className={cn("w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform", color)}>
                <Icon className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">{label}</p>
                
                {tags && (
                    <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                        {tags.map((tag: string) => (
                            <button
                                key={tag}
                                onClick={() => {
                                    const newValue = value ? `${value}, ${tag}` : tag;
                                    onChange(newValue);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                            >
                                + {tag}
                            </button>
                        ))}
                    </div>
                )}

                {type === "select" ? (
                    <div className="flex gap-2 mt-1">
                        {options.map((opt: string) => (
                            <button
                                key={opt}
                                onClick={() => onChange(opt)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs font-bold transition-all border",
                                    value === opt 
                                        ? "bg-white text-black border-white" 
                                        : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                                )}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                ) : type === "boolean" ? (
                    <div className="flex gap-2 mt-1">
                        {[true, false].map((val) => (
                            <button
                                key={String(val)}
                                onClick={() => onChange(val)}
                                className={cn(
                                    "px-4 py-1 rounded-full text-xs font-bold transition-all border",
                                    value === val 
                                        ? "bg-white text-black border-white" 
                                        : "bg-transparent text-white/40 border-white/10 hover:border-white/30"
                                )}
                            >
                                {val ? "Evet" : "Hayır"}
                            </button>
                        ))}
                    </div>
                ) : (
                    <input 
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full bg-transparent text-[15px] font-bold text-white outline-none placeholder:text-white/10 truncate"
                        placeholder="..."
                    />
                )}
            </div>
        </div>
    </div>
);

export function PetSettingsModal({ isOpen, onClose, pet, onSave }: PetSettingsModalProps) {
    const [formData, setFormData] = useState({
        name: pet?.name || "",
        breed: pet?.breed || "",
        microchip: pet?.microchip || "",
        birthday: pet?.birthday || "",
        gender: pet?.gender || "Dişi",
        color: pet?.color || "",
        weight: pet?.weight || "",
        neutered: pet?.neutered || false,
        ownerName: pet?.ownerName || pet?.owner?.name || "Belirtilmedi",
        ownerPhone: pet?.ownerPhone || pet?.owner?.phone || "Belirtilmedi",
        ownerAddress: pet?.ownerAddress || pet?.owner?.address || "Belirtilmedi",
        parasiteInternal: pet?.parasiteInternal || "12 Ara 2024",
        parasiteExternal: pet?.parasiteExternal || "15 Ara 2024",
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate a small delay for premium feel
        await new Promise(r => setTimeout(r, 800));
        onSave(formData);
        setIsSaving(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-3xl flex flex-col justify-end"
                    onClick={onClose}
                >
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0.1 }} // Slight offset for sub-pixel rendering
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="w-full h-[94vh] bg-[#0A0A0E] rounded-t-[3rem] border-t border-white/10 flex flex-col overflow-hidden shadow-[0_-25px_50px_rgba(0,0,0,0.8)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 bg-[#0A0A0E]/80 backdrop-blur-md sticky top-0 z-50">
                            <button onClick={onClose} className="text-[17px] font-medium text-white/40 hover:text-white transition-colors">Vazgeç</button>
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] opacity-80">Passport Editor</h2>
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="flex items-center gap-2 text-[17px] font-black text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-all"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                                ) : (
                                    <>Bitti <Check className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-10 pb-40">
                            {/* Pet Identity Header */}
                            <div className="flex flex-col items-center gap-5 mt-4">
                                <div className="relative group">
                                    <div className="w-28 h-28 rounded-[2.8rem] overflow-hidden border-4 border-white/5 shadow-2xl relative">
                                        <img src={pet?.avatar || "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=256"} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Camera className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-cyan-500 w-8 h-8 rounded-full border-4 border-[#0A0A0E] flex items-center justify-center shadow-lg">
                                        <Fingerprint className="w-4 h-4 text-black" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-3xl font-black text-white tracking-tighter">{formData.name || "İsimsiz"}</h3>
                                    <span className="inline-block px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-2 border border-white/5">Digital Passport v2.0</span>
                                </div>
                            </div>

                            {/* Group 1: Temel Kimlik */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-6">Temel Kimlik Bilgileri</h4>
                                <div className="rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#1C1C1E]/40 backdrop-blur-xl">
                                    <SettingRow icon={Fingerprint} label="İsim" value={formData.name} onChange={(v:any) => setFormData(f => ({...f, name: v}))} color="text-cyan-400" />
                                    <SettingRow icon={Award} label="Cins / Irk" value={formData.breed} onChange={(v:any) => setFormData(f => ({...f, breed: v}))} color="text-purple-400" />
                                    <SettingRow icon={Hash} label="Microchip No" value={formData.microchip} onChange={(v:any) => setFormData(f => ({...f, microchip: v}))} color="text-emerald-400" />
                                    <SettingRow icon={Calendar} label="Doğum Tarihi" value={formData.birthday} onChange={(v:any) => setFormData(f => ({...f, birthday: v}))} type="date" color="text-orange-400" />
                                </div>
                            </div>

                            {/* Group 2: Biyometrik */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-6">Biyometrik Veriler</h4>
                                <div className="rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#1C1C1E]/40 backdrop-blur-xl">
                                    <SettingRow icon={User} label="Cinsiyet" value={formData.gender} onChange={(v:any) => setFormData(f => ({...f, gender: v}))} type="select" options={["Erkek", "Dişi"]} color="text-pink-400" />
                                    <SettingRow 
                                        icon={Zap} 
                                        label="Renk ve İşaretler" 
                                        value={formData.color} 
                                        onChange={(v:any) => setFormData(f => ({...f, color: v}))} 
                                        tags={["Siyah", "Beyaz", "Kahve", "Gri", "Krem", "Karma"]}
                                        color="text-yellow-400" 
                                    />
                                    <SettingRow icon={Stethoscope} label="Kilo (kg)" value={formData.weight} onChange={(v:any) => setFormData(f => ({...f, weight: v}))} type="number" color="text-blue-400" />
                                    <SettingRow icon={Scissors} label="Kısırlaştırma" value={formData.neutered} onChange={(v:any) => setFormData(f => ({...f, neutered: v}))} type="boolean" color="text-red-400" />
                                </div>
                            </div>

                            {/* Group 3: Veli Bilgileri */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-6">Veli (Sahip) Bilgileri</h4>
                                <div className="rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#1C1C1E]/40 backdrop-blur-xl">
                                    <SettingRow icon={User} label="Veli Adı" value={formData.ownerName} onChange={(v:any) => setFormData(f => ({...f, ownerName: v}))} color="text-white" />
                                    <SettingRow icon={Phone} label="Telefon Duyurusu" value={formData.ownerPhone} onChange={(v:any) => setFormData(f => ({...f, ownerPhone: v}))} type="tel" color="text-white" />
                                    <SettingRow icon={MapPin} label="Adres / Bölge" value={formData.ownerAddress} onChange={(v:any) => setFormData(f => ({...f, ownerAddress: v}))} color="text-white" />
                                </div>
                            </div>

                            {/* Group 4: Parazit Takibi */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-6">Parazit Kontrol Tarihleri</h4>
                                <div className="rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#1C1C1E]/40 backdrop-blur-xl">
                                    <SettingRow icon={ShieldCheck} label="İç Parazit Uygulaması" value={formData.parasiteInternal} onChange={(v:any) => setFormData(f => ({...f, parasiteInternal: v}))} type="date" color="text-emerald-400" />
                                    <SettingRow icon={ShieldCheck} label="Dış Parazit Uygulaması" value={formData.parasiteExternal} onChange={(v:any) => setFormData(f => ({...f, parasiteExternal: v}))} type="date" color="text-emerald-400" />
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="pt-12 flex flex-col gap-6">
                                <button className="group w-full bg-red-500/10 border border-red-500/20 py-5 rounded-[2.5rem] text-red-500 font-black text-xs uppercase tracking-[0.3em] active:scale-[0.98] transition-all flex items-center justify-center gap-3 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Trash2 className="w-4 h-4 transform group-hover:rotate-12 transition-transform" /> Pasaport Kaydını Sıfırla
                                </button>
                                <p className="text-[10px] text-white/20 text-center font-bold px-12 leading-relaxed uppercase tracking-[0.2em]">All data is secured via Moffi Cloud Encryption. Updated changes are synced instantly across your devices.</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
