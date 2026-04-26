'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Save, BookOpen, Heart, 
    Sparkles, Camera, MapPin, 
    Smile, Sun, Moon, Cloud, 
    ChevronDown, Check, PenTool
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePet } from '@/context/PetContext';

interface DiaryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DiaryModal({ isOpen, onClose }: DiaryModalProps) {
    const { pets, activePet } = usePet();
    const [selectedPetId, setSelectedPetId] = useState(activePet?.id || pets[0]?.id);
    const [memory, setMemory] = useState('');
    const [mood, setMood] = useState('Mutlu ✨');
    const [isSaving, setIsSaving] = useState(false);
    const [showPetSelector, setShowPetSelector] = useState(false);

    const moods = [
        { label: 'Mutlu ✨', color: 'text-yellow-400' },
        { label: 'Uykulu 💤', color: 'text-blue-400' },
        { label: 'Oyunbaz 🎾', color: 'text-green-400' },
        { label: 'Yaramaz 😈', color: 'text-purple-400' },
        { label: 'Acıkmış 🦴', color: 'text-orange-400' },
        { label: 'Sakin 🍃', color: 'text-emerald-400' }
    ];

    const selectedPet = pets.find(p => p.id === selectedPetId) || pets[0];

    const handleSave = async () => {
        if (!memory.trim()) return;
        
        setIsSaving(true);
        // Simulate secure saving process
        await new Promise(r => setTimeout(r, 1200));
        
        window.dispatchEvent(new CustomEvent('moffi-toast', { 
            detail: { 
                message: 'Anı başarıyla mühürlendi ve günlüğe eklendi! 📖✨', 
                icon: 'BookOpen', 
                color: 'text-yellow-500' 
            } 
        }));
        
        setIsSaving(false);
        setMemory('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose} 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]" 
                    />
                    <motion.div 
                        initial={{ y: '100%', opacity: 0, scale: 0.95 }} 
                        animate={{ y: 0, opacity: 1, scale: 1 }} 
                        exit={{ y: '100%', opacity: 0, scale: 0.95 }} 
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-x-4 bottom-8 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[500px] bg-[#0c0c0c]/90 backdrop-blur-2xl border border-white/10 rounded-[3.5rem] p-8 shadow-[0_50px_100px_rgba(0,0,0,0.8)] z-[10001] overflow-hidden"
                    >
                        {/* Decorative Background Glow */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full" />

                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-yellow-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Pati Günlüğü</h2>
                                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mt-1.5">Unutulmaz Anılar</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                                    <X className="w-5 h-5 text-white/40" />
                                </button>
                            </div>

                            {/* Pet Selector */}
                            <div className="relative mb-8">
                                <button 
                                    onClick={() => setShowPetSelector(!showPetSelector)}
                                    className="w-full flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/5 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-yellow-500/30 transition-colors">
                                            <img src={selectedPet?.avatar} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">Anı Sahibi</p>
                                            <p className="text-sm font-black text-white">{selectedPet?.name}</p>
                                        </div>
                                    </div>
                                    <ChevronDown className={cn("w-5 h-5 text-white/20 transition-transform", showPetSelector && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                    {showPetSelector && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-[2rem] p-2 shadow-2xl z-50 max-h-48 overflow-y-auto no-scrollbar"
                                        >
                                            {pets.map(pet => (
                                                <button 
                                                    key={pet.id}
                                                    onClick={() => { setSelectedPetId(pet.id); setShowPetSelector(false); }}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-all"
                                                >
                                                    <img src={pet.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                                    <span className="text-sm font-bold text-white flex-1 text-left">{pet.name}</span>
                                                    {selectedPetId === pet.id && <Check className="w-4 h-4 text-yellow-500" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Mood Grid */}
                            <div className="mb-8">
                                <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-4 px-1">Bugün Nasıl Hissediyor?</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {moods.map((m) => (
                                        <button 
                                            key={m.label}
                                            onClick={() => setMood(m.label)}
                                            className={cn(
                                                "py-3 rounded-2xl border text-[11px] font-black uppercase tracking-tighter transition-all",
                                                mood === m.label ? "bg-white text-black border-transparent shadow-lg" : "bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5"
                                            )}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Text Input */}
                            <div className="mb-8 relative">
                                <textarea 
                                    value={memory}
                                    onChange={(e) => setMemory(e.target.value)}
                                    placeholder="Neler yaptınız? Unutmak istemediğin bir anı yaz..."
                                    className="w-full h-40 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 text-sm text-white focus:outline-none focus:border-yellow-500/50 transition-all placeholder:text-white/10 resize-none font-medium leading-relaxed"
                                />
                                <div className="absolute bottom-6 right-6 flex gap-2">
                                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all">
                                        <Camera className="w-4 h-4" />
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all">
                                        <MapPin className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving || !memory.trim()}
                                    className={cn(
                                        "flex-1 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all",
                                        memory.trim() ? "bg-yellow-500 text-black shadow-[0_15px_40px_rgba(234,179,8,0.3)] hover:scale-[1.02] active:scale-95" : "bg-white/5 text-white/20 cursor-not-allowed"
                                    )}
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Anıyı Mühürle</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            <p className="text-center text-[8px] text-white/10 font-black uppercase tracking-[0.5em] mt-8">Moffi Legacy Journal v1.0</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
