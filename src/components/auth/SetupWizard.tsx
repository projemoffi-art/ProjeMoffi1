"use client";

import { useState } from "react";
import { Camera, ChevronRight, User, Dog, Cat, Bird, Heart, Loader2, Sparkles, ShieldCheck, Zap, Star, Crown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface SetupProps {
    onComplete: () => void;
}

type SetupStep = 1 | 2 | 3; // 1: Profile, 2: Pet, 3: Subscription

export function SetupWizard({ onComplete }: SetupProps) {
    const { user, updateProfile } = useAuth();
    const [step, setStep] = useState<SetupStep>(1);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'elite'>('pro');

    // Avatar State
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Profile State
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");

    // Pet State
    const [petName, setPetName] = useState("");
    const [petType, setPetType] = useState<'dog' | 'cat' | 'bird' | 'other'>('dog');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleFinish = async () => {
        setIsUploading(true);
        
        // MOCK: In mock mode, we skip Supabase Storage uploads.
        const finalAvatarUrl = avatarPreview || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300";

        // Update Context with real user data
        await updateProfile({
            username: username || user?.email?.split('@')[0] || "User",
            bio: `Merhaba! Ben ${name}. İlk dostum ${petName} (${petType}). Planım: ${selectedPlan}`,
            avatar: finalAvatarUrl
        });

        setIsUploading(false);
        onComplete();
    };

    const handleNext = () => {
        if (step === 1 && name && username) {
            setStep(2);
        } else if (step === 2 && petName) {
            setStep(3);
        } else if (step === 3) {
            handleFinish();
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent font-sans relative overflow-hidden">
            {/* Progress Visualization */}
            <div className="h-2 flex gap-2 px-10 pt-10">
                {[1, 2, 3].map((s) => (
                    <div 
                        key={s} 
                        className={cn(
                            "h-full flex-1 rounded-full transition-all duration-700", 
                            step >= s ? "bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" : "bg-white/10"
                        )} 
                    />
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-10 pt-12">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Kimliğinizi <br/>Tanımlayın</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-4">Evrene Bağlanmak İçin İlk Adım</p>
                            </div>

                            <div className="flex justify-center py-6">
                                <label
                                    htmlFor="profile-upload"
                                    className="w-36 h-36 bg-white/5 rounded-[2.5rem] flex items-center justify-center relative border border-white/10 shadow-2xl cursor-pointer overflow-hidden group"
                                >
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <User className="w-10 h-10 text-gray-600 group-hover:scale-110 transition-transform" />
                                            <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Fotoğraf Ekle</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                    <input type="file" id="profile-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">Tam Adınız</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        type="text"
                                        className="w-full px-6 py-5 bg-white/5 rounded-2xl border border-white/10 focus:border-cyan-500/50 outline-none text-white placeholder-gray-800"
                                        placeholder="Örn: Ayşe Yılmaz"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">Evren Kimliğiniz (Username)</label>
                                    <input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        type="text"
                                        className="w-full px-6 py-5 bg-white/5 rounded-2xl border border-white/10 focus:border-cyan-500/50 outline-none text-white placeholder-gray-800"
                                        placeholder="@ayseyilmaz"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <div>
                                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">İlk Dostunuzu <br/>Tanıtın</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-4">Onun Dijital Kimliği Hazırlanıyor</p>
                            </div>

                            <div className="flex justify-center">
                                <div className="w-32 h-32 bg-orange-500/5 rounded-3xl border border-orange-500/20 flex items-center justify-center relative shadow-2xl">
                                    <Dog className="w-12 h-12 text-orange-400" />
                                    <div className="absolute -bottom-2 -right-2 p-3 bg-orange-500 rounded-2xl border-2 border-[#0A0A0E] text-white">
                                        <Camera className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">Dostunuzun Türü</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {[
                                            { id: 'dog', icon: Dog, label: 'KÖPEK' },
                                            { id: 'cat', icon: Cat, label: 'KEDİ' },
                                            { id: 'bird', icon: Bird, label: 'KUŞ' },
                                            { id: 'other', icon: Heart, label: 'DİĞER' },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setPetType(item.id as any)}
                                                className={cn(
                                                    "py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                                                    petType === item.id 
                                                        ? "border-orange-500 bg-orange-500/10 text-orange-400" 
                                                        : "border-white/5 bg-white/5 text-gray-600"
                                                )}
                                            >
                                                <item.icon className="w-6 h-6" />
                                                <span className="text-[8px] font-black">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">Onun Adı</label>
                                    <input
                                        value={petName}
                                        onChange={(e) => setPetName(e.target.value)}
                                        type="text"
                                        className="w-full px-6 py-5 bg-white/5 rounded-2xl border border-white/10 focus:border-orange-500/50 outline-none text-white placeholder-gray-800"
                                        placeholder="Örn: Pamuk"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-10"
                        >
                            <div className="text-center">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
                                    <Sparkles className="w-3 h-3 text-cyan-400" />
                                    <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Özel Seçim</span>
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Moffi Planınızı Seçin</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-4 leading-relaxed">Ekosistemdeki yerinizi belirleyin</p>
                            </div>

                            <div className="space-y-4">
                                {/* Plan Card: ELITE (Recommended) */}
                                <button 
                                    onClick={() => setSelectedPlan('elite')}
                                    className={cn(
                                        "w-full p-8 rounded-[3rem] border transition-all relative overflow-hidden group text-left",
                                        selectedPlan === 'elite' 
                                            ? "border-cyan-500 bg-gradient-to-br from-cyan-500/20 to-transparent shadow-[0_20px_40px_rgba(6,182,212,0.2)]" 
                                            : "border-white/5 bg-white/5 opacity-60"
                                    )}
                                >
                                    {selectedPlan === 'elite' && (
                                        <div className="absolute top-6 right-8">
                                            <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                                            <Crown className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-white font-black text-xl uppercase italic tracking-tight">ELITE PREMİUM</h4>
                                                <div className="px-2 py-0.5 bg-cyan-500 text-black text-[7px] font-black rounded-full">POPÜLER</div>
                                            </div>
                                            <p className="text-[9px] text-cyan-400/60 font-black uppercase tracking-widest mt-1">Sınırsız Evren Erişimi</p>
                                        </div>
                                    </div>
                                </button>

                                {/* Plan Card: PRO */}
                                <button 
                                    onClick={() => setSelectedPlan('pro')}
                                    className={cn(
                                        "w-full p-8 rounded-[3rem] border transition-all relative overflow-hidden group text-left",
                                        selectedPlan === 'pro' 
                                            ? "border-purple-500 bg-gradient-to-br from-purple-500/20 to-transparent shadow-[0_20px_40px_rgba(139,92,246,0.2)]" 
                                            : "border-white/5 bg-white/5 opacity-60"
                                    )}
                                >
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                                            <Star className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black text-xl uppercase italic tracking-tight">PRO ÜYE</h4>
                                            <p className="text-[9px] text-purple-400/60 font-black uppercase tracking-widest mt-1">Gelişmiş Özellikler</p>
                                        </div>
                                    </div>
                                </button>

                                {/* Plan Card: FREE */}
                                <button 
                                    onClick={() => setSelectedPlan('free')}
                                    className={cn(
                                        "w-full p-8 rounded-[3rem] border transition-all relative overflow-hidden group text-left",
                                        selectedPlan === 'free' 
                                            ? "border-gray-500 bg-gradient-to-br from-gray-500/20 to-transparent" 
                                            : "border-white/5 bg-white/5 opacity-60"
                                    )}
                                >
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-gray-400 border border-white/10">
                                            <Zap className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black text-xl uppercase italic tracking-tight">STANDART</h4>
                                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">Temel Erişim</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Global Action Area */}
            <div className="p-10 pb-12 bg-transparent">
                <button
                    onClick={handleNext}
                    disabled={(step === 1 && (!name || !username)) || (step === 2 && !petName) || isUploading}
                    className="group relative w-full bg-white text-black py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] overflow-hidden active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        {isUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                {step === 3 ? "Evreni Başlat" : "Devam Et"}
                                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </span>
                </button>
            </div>
            
            {/* Ambient Background Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10">
                 <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full" />
                 <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full" />
            </div>
        </div>
    );
}
