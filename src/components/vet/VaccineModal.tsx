"use client";

import { useState } from "react";
import {
    X, Syringe, CheckCircle2, AlertCircle,
    Calendar, ChevronRight, Info, ShieldCheck,
    Thermometer, Clock, HelpCircle, FileText,
    Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useVaccineSchedule, RichVaccineRecord } from "@/hooks/useVaccineSchedule";
import { useRouter } from "next/navigation";

interface VaccineModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function VaccineModal({ isOpen, onClose }: VaccineModalProps) {
    const { schedule, ruleset, isLoading } = useVaccineSchedule();
    const [activeTab, setActiveTab] = useState<'calendar' | 'guide'>('calendar');
    const [selectedRichRecord, setSelectedRichRecord] = useState<RichVaccineRecord | null>(null);
    const [selectedDefId, setSelectedDefId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleBookAppointment = (record: RichVaccineRecord) => {
        onClose();
        // In a real app, this would open the expanded appointment flow with context
    };

    const getDefinition = (id: string) => ruleset?.definitions.find(d => d.id === id);
    const activeDefinition = selectedDefId ? getDefinition(selectedDefId) : (selectedRichRecord ? selectedRichRecord.definition : null);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-2xl flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="w-full max-w-lg bg-[#111111] rounded-t-[3.5rem] sm:rounded-[4rem] h-[90vh] flex flex-col overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/10 relative"
            >
                {/* iOS Style Grab Handle */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full sm:hidden z-50" />

                {/* HEADER */}
                <div className="p-8 pb-4 bg-[#111111]/80 backdrop-blur-3xl z-30 sticky top-0 border-b border-white/5">
                    <div className="flex justify-between items-center mb-8 mt-2 sm:mt-0">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-2xl">
                                <Syringe className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Aşı Takvimi</h2>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-2">
                                    {ruleset ? `DOĞRULANMIŞ: ${ruleset.countryCode}` : 'GÜNCELLENİYOR...'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* TABS - Apple Glass style */}
                    <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-[1.8rem]">
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={cn(
                                "flex-1 py-3.5 rounded-[1.4rem] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 relative overflow-hidden",
                                activeTab === 'calendar' ? "bg-white text-black shadow-2xl" : "text-white/30 hover:text-white/60"
                            )}
                        >
                            <Calendar className="w-4 h-4" /> TAKVİMİM
                        </button>
                        <button
                            onClick={() => setActiveTab('guide')}
                            className={cn(
                                "flex-1 py-3.5 rounded-[1.4rem] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 relative overflow-hidden",
                                activeTab === 'guide' ? "bg-[#5B4D9D] text-white shadow-2xl" : "text-white/30 hover:text-white/60"
                            )}
                        >
                            <Info className="w-4 h-4" /> AŞI REHBERİ
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/20">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <div className="animate-spin w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full" />
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Veriler Hazırlanıyor</span>
                        </div>
                    )}

                    {!isLoading && ruleset && activeTab === 'calendar' && (
                        <div className="relative pl-8 space-y-10">
                            {/* Vertical Line */}
                            <div className="absolute left-[3px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-blue-500 via-white/10 to-transparent opacity-20" />
                            
                            {schedule.map((item, idx) => {
                                const isCompleted = item.status === 'completed';
                                const daysLeft = Math.ceil((new Date(item.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                                const isOverdue = !isCompleted && daysLeft < 0;

                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={item.id} 
                                        className="relative"
                                    >
                                        {/* Timeline Dot with Glow */}
                                        <div className={cn(
                                            "absolute -left-[32px] top-3 w-4 h-4 rounded-full border-2 z-10 shadow-2xl",
                                            isCompleted ? "bg-emerald-500 border-emerald-900 shadow-emerald-500/20" :
                                                isOverdue ? "bg-[#FF3B30] border-red-900 shadow-red-500/20" : 
                                                "bg-blue-500 border-blue-900 shadow-blue-500/20 animate-pulse"
                                        )} />

                                        <div
                                            onClick={() => { setSelectedRichRecord(item); setSelectedDefId(null); }}
                                            className={cn(
                                                "bg-[#1C1C1E] p-6 rounded-[2.5rem] border transition-all active:scale-[0.98] cursor-pointer group hover:bg-[#252528]",
                                                isCompleted ? "border-emerald-500/10" :
                                                    isOverdue ? "border-red-500/20 shadow-[0_15px_40px_rgba(255,59,48,0.05)]" : 
                                                    "border-blue-500/20 shadow-[0_15px_40px_rgba(0,122,255,0.05)]"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-black text-white tracking-tight uppercase italic mb-1">{item.definition.name}</h3>
                                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                                                        {isCompleted ? `TAMAMLANDI: ${item.dateAdministered}` : `PLANLANAN: ${item.dueDate}`}
                                                    </p>
                                                </div>
                                                {isCompleted ? (
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </div>
                                                ) : isOverdue ? (
                                                    <div className="bg-[#FF3B30]/10 text-[#FF3B30] text-[9px] font-black px-3 py-1.5 rounded-full border border-red-500/20 uppercase tracking-widest">
                                                        GECİKTİ ({Math.abs(daysLeft)} GÜN)
                                                    </div>
                                                ) : (
                                                    <div className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-3 py-1.5 rounded-full border border-blue-500/20 uppercase tracking-widest">
                                                        {daysLeft} GÜN KALDI
                                                    </div>
                                                )}
                                            </div>

                                            {!isCompleted && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleBookAppointment(item); }}
                                                    className="w-full h-12 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all shadow-xl"
                                                >
                                                    Randevu Al <ChevronRight className="w-4 h-4" />
                                                </button>
                                            )}

                                            {isCompleted && item.vetName && (
                                                <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400 mt-2 uppercase tracking-widest">
                                                    <ShieldCheck className="w-4 h-4" /> DOĞRULANMIŞ: {item.vetName}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* TAB: GUIDE (KNOWLEDGE BASE) */}
                    {!isLoading && ruleset && activeTab === 'guide' && (
                        <div className="grid grid-cols-1 gap-5">
                            {ruleset.definitions.map(def => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={def.id}
                                    onClick={() => { setSelectedDefId(def.id); setSelectedRichRecord(null); }}
                                    className="bg-[#1C1C1E] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl flex items-center gap-5 cursor-pointer hover:bg-[#252528] transition-all group active:scale-[0.98]"
                                >
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner",
                                        def.isCore ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                    )}>
                                        <ShieldCheck className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-black text-white tracking-tight uppercase italic mb-1">{def.name}</h3>
                                        <p className="text-[10px] text-white/30 font-bold line-clamp-2 uppercase tracking-tighter leading-relaxed">{def.description}</p>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-white/10 group-hover:text-white/40 transition-colors" />
                                </motion.div>
                            ))}

                            <div className="mt-8 p-10 rounded-[3rem] bg-white/5 border border-white/5 text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                <FileText className="w-8 h-8 mx-auto mb-4 text-white/20 group-hover:text-white/40 transition-colors" />
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">KAYNAK: {ruleset.source}</p>
                                <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.2em]">{ruleset.lastUpdated} Güncellemesi</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* INFO DETAILS SHEET - Apple Style Slide-up / Detail view */}
                <AnimatePresence>
                    {activeDefinition && (
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            className="absolute inset-0 z-40 bg-[#111111] overflow-y-auto custom-scrollbar"
                        >
                            {/* Details Header */}
                            <div className="sticky top-0 bg-[#111111]/80 backdrop-blur-3xl p-6 border-b border-white/5 flex items-center justify-between z-50">
                                <button onClick={() => { setSelectedRichRecord(null); setSelectedDefId(null); }} className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">
                                    <ChevronRight className="w-6 h-6 rotate-180" />
                                </button>
                                <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.4em]">AŞI DETAYLARI</h3>
                                <div className="w-11" /> {/* Spacer */}
                            </div>

                            <div className="p-8 pb-32">
                                <div className="flex flex-col items-center text-center mb-12">
                                    <div className="w-24 h-24 bg-blue-500/10 border border-blue-500/20 rounded-[2.5rem] flex items-center justify-center text-blue-400 mb-6 shadow-2xl shadow-blue-500/10">
                                        <Syringe className="w-10 h-10" />
                                    </div>
                                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-tight mb-3">{activeDefinition.name}</h1>
                                    
                                    {activeDefinition.isCore && (
                                        <div className="flex items-center gap-2 bg-[#FF3B30]/10 text-[#FF3B30] text-[10px] font-black px-4 py-2 rounded-full border border-red-500/20 uppercase tracking-[0.2em]">
                                            <Shield className="w-3.5 h-3.5 fill-current" /> ZORUNLU AŞI (CORE)
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-white/5 border border-white/5 p-8 rounded-[3rem] relative overflow-hidden">
                                         <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4 flex items-center gap-2 italic"> Tıbbi Açıklama</h4>
                                        <p className="text-sm font-bold text-white/70 dark:text-gray-300 leading-relaxed uppercase tracking-tight">{activeDefinition.description}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-[2.5rem] flex flex-col items-center text-center">
                                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3 border border-orange-500/10">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">SIKLIK</div>
                                            <div className="text-lg font-black text-white italic">{activeDefinition.frequencyMonths} AY</div>
                                        </div>
                                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[2.5rem] flex flex-col items-center text-center">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 border border-emerald-500/10">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">MİN. YAŞ</div>
                                            <div className="text-lg font-black text-white italic">{activeDefinition.minAgeWeeks} HAFTA</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4 px-2 italic">KATEGORİLER</h4>
                                        <div className="flex flex-wrap gap-2 px-1">
                                            {activeDefinition.tags.map(p => (
                                                <span key={p} className="bg-white/5 border border-white/5 text-white/40 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all cursor-default">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => { setSelectedRichRecord(null); setSelectedDefId(null); }}
                                        className="w-full mt-8 bg-white text-black py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
                                    >
                                        BİLGİYİ KAPAT
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        </motion.div>
    );
}
