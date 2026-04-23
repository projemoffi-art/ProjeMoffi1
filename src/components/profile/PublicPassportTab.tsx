"use client";

import { motion } from "framer-motion";
import { 
    ShieldCheck, Award, 
    Calendar, MapPin, Hash, 
    Fingerprint, User, Phone,
    Heart, BadgeCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

interface PublicPassportTabProps {
    pet: any;
}

export function PublicPassportTab({ pet }: PublicPassportTabProps) {
    // Mask sensitive fields
    const maskedMicrochip = pet.microchip ? 
        `${pet.microchip.slice(0, 3)}***${pet.microchip.slice(-3)}` : 
        "Kayıtlı Değil";

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-8 pb-40 relative px-2 mb-12"
        >
            <div className="bg-gradient-to-br from-[#1C1C1E] via-[#0A0A0E] to-[#1C1C1E] rounded-[3.5rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col min-h-[480px]">
                {/* Public Badge */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30">
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-2xl px-5 py-2 rounded-full border border-white/10">
                        <BadgeCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Moffi Onaylı Profil</span>
                    </div>
                </div>

                {/* Header info */}
                <div className="flex justify-between items-start mb-12 relative z-10 pt-6">
                    <div className="flex gap-6 items-center text-left">
                        <img src={pet.avatar_url || pet.avatar} className="w-24 h-24 rounded-[2.5rem] object-cover border-4 border-[#0A0A0E] shadow-2xl scale-110" />
                        <div className="ml-4">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">Public Pet ID</p>
                            <h1 className="text-5xl font-black text-white tracking-tighter leading-none italic uppercase">{pet.name}</h1>
                        </div>
                    </div>
                    <div className="bg-white p-2 rounded-2xl">
                        <QRCodeSVG value={`moffi://id/${pet.id}`} size={64} />
                    </div>
                </div>

                {/* Stats Grid - Public Only */}
                <div className="grid grid-cols-2 gap-y-10 relative z-10 border-t border-white/10 pt-10 mt-auto">
                    {[
                        { label: 'Irk', value: pet.breed, icon: Award },
                        { label: 'Kimlik No', value: maskedMicrochip, icon: Hash, mono: true, color: 'text-gray-500' },
                        { label: 'Yaş', value: pet.age || "Belirtilmemiş", icon: Calendar },
                        { label: 'Bölge', value: pet.city || "Türkiye", icon: MapPin },
                    ].map((field, i) => (
                        <div key={i} className="space-y-1.5 px-2 text-left">
                            <div className="flex items-center gap-2 opacity-40">
                                <field.icon className="w-3 h-3 text-white" />
                                <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">{field.label}</p>
                            </div>
                            <p className={cn("text-sm font-black tracking-tight uppercase", field.mono ? "font-mono " + (field.color || "text-white") : "text-white")}>
                                {field.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Restricted Info Notice */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
                    <Fingerprint className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-white font-bold">Gizlilik Koruması Aktif</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                        Bu kullanıcının detaylı tıbbi verileri ve iletişim bilgileri gizlilik gereği sadece sahibi tarafından görülebilir.
                    </p>
                </div>
                <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors">
                    Mesaj Gönder
                </button>
            </div>
        </motion.div>
    );
}
