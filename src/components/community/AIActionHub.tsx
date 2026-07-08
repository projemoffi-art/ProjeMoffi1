'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Sparkles, Camera, Stethoscope, MessageSquareHeart, 
    BookOpen, Activity, ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePet } from '@/context/PetContext';
import { useRouter } from 'next/navigation';

interface AIActionHubProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIActionHub({ isOpen, onClose }: AIActionHubProps) {
    const { activePet } = usePet();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const actions = [
        { 
            id: 'food', 
            icon: Camera, 
            label: 'Mama Analizi', 
            sub: 'İçerik Uygunluk Taraması', 
            color: 'text-emerald-400', 
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20'
        },
        { 
            id: 'health', 
            icon: Stethoscope, 
            label: 'Hızlı Sağlık Taraması', 
            sub: 'Dışkı & Göz & Cilt Analizi', 
            color: 'text-rose-400', 
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20'
        },
        { 
            id: 'chat', 
            icon: MessageSquareHeart, 
            label: 'Moffi Vet\'e Sor', 
            sub: 'Yapay Zeka Veterineri', 
            color: 'text-cyan-400', 
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/20'
        },
        { 
            id: 'story', 
            icon: BookOpen, 
            label: 'Anı Yarat', 
            sub: 'Fotoğraftan Eğlenceli Hikaye', 
            color: 'text-purple-400', 
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20'
        },
    ];

    const handleActionClick = (id: string) => {
        if (id === 'chat') {
            onClose();
            router.push('/ai-dressing'); 
            return;
        }
        
        setActiveAction(id);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeAction) return;

        setIsProcessing(true);
        setResult(null);

        try {
            // Convert file to base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;

                // Call the Vision API
                const res = await fetch('/api/ai/vision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageBase64: base64,
                        actionType: activeAction,
                        petData: activePet
                    })
                });

                const data = await res.json();
                
                setIsProcessing(false);
                if (data.success && data.result) {
                    setResult(data.result);
                } else {
                    setResult('Bağlantı hatası veya analiz yapılamadı. Lütfen tekrar deneyin.');
                }
            };
            
            reader.onerror = () => {
                setIsProcessing(false);
                setResult('Görsel okunamadı.');
            };

        } catch (error) {
            setIsProcessing(false);
            setResult('Bir hata oluştu, lütfen tekrar deneyin.');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose} 
                        className="fixed inset-0 z-[7000] bg-black/85 backdrop-blur-2xl" 
                    />
                    
                    {/* Drawer */}
                    <motion.div 
                        initial={{ y: "100%" }} 
                        animate={{ y: 0 }} 
                        exit={{ y: "100%" }} 
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose();
                        }}
                        className="fixed bottom-0 left-0 right-0 z-[7001] bg-[var(--background)] border-t border-white/10 rounded-t-[2.5rem] sm:rounded-t-[3.5rem] p-5 sm:p-8 pb-10 sm:pb-12 shadow-[0_-20px_100px_rgba(0,0,0,0.8)] max-h-[92vh] overflow-y-auto no-scrollbar"
                    >
                        {/* Apple Handle */}
                        <div className="absolute top-0 left-0 right-0 h-8 sm:h-10 flex items-center justify-center cursor-pointer pt-2">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>

                        {/* TITLE BAR */}
                        <div className="flex justify-between items-center py-4 mb-2 mt-2">
                            <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                                    <Sparkles className="text-white w-6 h-6" />
                                 </div>
                                 <div>
                                    <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase leading-none">Moffi AI</h2>
                                    <p className="text-[9px] text-cyan-400 font-black uppercase tracking-[0.2em] mt-1">Akıllı Güç Merkezi</p>
                                 </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all outline-none"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* HIDDEN FILE INPUT */}
                        <input 
                            type="file" 
                            accept="image/*"
                            capture="environment" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />

                        {/* RESULT PANEL */}
                        <AnimatePresence mode="wait">
                            {(isProcessing || result) ? (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-6 overflow-hidden"
                                >
                                    <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-[2rem] p-6 relative overflow-hidden mt-2">
                                        <div className="absolute -inset-10 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
                                        
                                        {isProcessing ? (
                                            <div className="flex flex-col items-center justify-center py-4 gap-4 relative z-10">
                                                <Activity className="w-10 h-10 text-cyan-400 animate-spin" />
                                                <div className="text-center">
                                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Moffi Düşünüyor...</h4>
                                                    <p className="text-[10px] text-cyan-200 mt-1">Görüntü analiz ediliyor, lütfen bekle.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-start gap-3 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="w-5 h-5 text-cyan-400" />
                                                    <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Analiz Sonucu</h4>
                                                </div>
                                                <p className="text-sm text-white/90 leading-relaxed font-medium italic">
                                                    {result}
                                                </p>
                                                <button 
                                                    onClick={() => { setResult(null); setActiveAction(null); }}
                                                    className="mt-2 text-[10px] uppercase font-bold text-cyan-400 border border-cyan-400/30 px-4 py-2 rounded-full hover:bg-cyan-400/10 transition-colors"
                                                >
                                                    Yeni Analiz Yap
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>

                        {/* AI ACTIONS GRID */}
                        <div className="space-y-3">
                            {actions.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleActionClick(item.id)}
                                    className="w-full flex items-center justify-between p-5 rounded-[2.2rem] bg-[#1a1a1f] border border-white/5 hover:bg-white/[0.05] transition-all active:scale-[0.98] group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 shadow-lg", item.bg, item.border)}>
                                            <item.icon className={cn("w-6 h-6", item.color)} />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-[13px] font-black text-white uppercase tracking-tight italic">{item.label}</h4>
                                            <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest mt-0.5">{item.sub}</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                        <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
