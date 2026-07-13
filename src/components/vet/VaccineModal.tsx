"use client";

import { useState } from "react";
import {
    X, Syringe, CheckCircle2, AlertCircle,
    Calendar, ChevronRight, Info, ShieldCheck,
    Thermometer, Clock, HelpCircle, FileText,
    Shield, Download, Filter, Search, BadgeCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, showToast } from "@/lib/utils";
import { useVaccineSchedule, RichVaccineRecord } from "@/hooks/useVaccineSchedule";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

interface VaccineModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function VaccineModal({ isOpen, onClose }: VaccineModalProps) {
    const { theme } = useTheme();
    const { schedule, ruleset, isLoading } = useVaccineSchedule();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'guide'>('upcoming');
    const [selectedRichRecord, setSelectedRichRecord] = useState<RichVaccineRecord | null>(null);
    const [selectedDefId, setSelectedDefId] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    if (!isOpen) return null;

    const handleBookAppointment = (record: RichVaccineRecord) => {
        onClose();
        // In a real app, this would route to appointment booking with the vaccine pre-selected
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('openVetModal', { detail: 'clinicList' }));
        }, 100);
    };

    const handleDownloadPDF = () => {
        setIsDownloading(true);
        setTimeout(() => {
            setIsDownloading(false);
            showToast('Aşı Geçmişi PDF olarak indirildi.', 'success');
        }, 1500);
    };

    const getDefinition = (id: string) => ruleset?.definitions.find(d => d.id === id);
    const activeDefinition = selectedDefId ? getDefinition(selectedDefId) : (selectedRichRecord ? selectedRichRecord.definition : null);

    // Segment data
    const upcomingVaccines = schedule.filter(item => item.status !== 'completed');
    const completedVaccines = schedule.filter(item => item.status === 'completed')
        .sort((a, b) => new Date(b.dateAdministered!).getTime() - new Date(a.dateAdministered!).getTime()); // Sort newest first

    const filteredHistory = completedVaccines.filter(item => 
        item.definition.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.vetName && item.vetName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/60 dark:bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <motion.div
                initial={{ y: "100%", scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: "100%", scale: 0.95 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="w-full max-w-2xl bg-zinc-50 dark:bg-[#0f1115] rounded-t-[2.5rem] sm:rounded-[3rem] h-[92vh] sm:h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-zinc-200/50 dark:border-white/5 relative"
            >
                {/* iOS Style Grab Handle */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full sm:hidden z-50" />

                {/* HEADER */}
                <div className="px-6 pt-10 pb-4 bg-white/80 dark:bg-[#0f1115]/80 backdrop-blur-xl z-30 sticky top-0 border-b border-zinc-200 dark:border-white/5">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white shrink-0">
                                <Syringe className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">Sağlık Takvimi</h2>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                    {ruleset ? `Moffi Onaylı Sistem` : 'Güncelleniyor...'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* NEW TABS - Segmented Control Style */}
                    <div className="flex bg-zinc-200/50 dark:bg-black/40 p-1.5 rounded-[1.2rem] border border-zinc-300/50 dark:border-white/5">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={cn(
                                "flex-1 py-2.5 rounded-[0.9rem] text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                                activeTab === 'upcoming' ? "bg-white dark:bg-[#1a1c23] text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200 dark:border-white/10" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                            )}
                        >
                            <Calendar className="w-3.5 h-3.5" /> Yaklaşanlar
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={cn(
                                "flex-1 py-2.5 rounded-[0.9rem] text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                                activeTab === 'history' ? "bg-white dark:bg-[#1a1c23] text-emerald-600 dark:text-emerald-400 shadow-sm border border-zinc-200 dark:border-white/10" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                            )}
                        >
                            <ShieldCheck className="w-3.5 h-3.5" /> Aşı Geçmişi
                        </button>
                        <button
                            onClick={() => setActiveTab('guide')}
                            className={cn(
                                "flex-1 py-2.5 rounded-[0.9rem] text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                                activeTab === 'guide' ? "bg-white dark:bg-[#1a1c23] text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200 dark:border-white/10" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                            )}
                        >
                            <Info className="w-3.5 h-3.5" /> Rehber
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-zinc-50 dark:bg-transparent">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-64 gap-4">
                                <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sistem Hazırlanıyor</span>
                            </motion.div>
                        ) : (
                            <>
                                {/* TAB 1: YAKLAŞANLAR (UPCOMING) */}
                                {activeTab === 'upcoming' && ruleset && (
                                    <motion.div key="upcoming" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                                        {upcomingVaccines.length === 0 ? (
                                            <div className="text-center py-16 bg-white dark:bg-[#15171c] rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm">
                                                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <CheckCircle2 className="w-8 h-8" />
                                                </div>
                                                <h3 className="text-sm font-black text-zinc-900 dark:text-white mb-1 uppercase tracking-tight">Tüm Aşılar Tamam!</h3>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Yakın zamanda planlanmış bir aşı bulunmuyor.</p>
                                            </div>
                                        ) : (
                                            upcomingVaccines.map((item, idx) => {
                                                const daysLeft = Math.ceil((new Date(item.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                                                const isOverdue = daysLeft < 0;
                                                const isUrgent = daysLeft >= 0 && daysLeft <= 7;

                                                return (
                                                    <div key={item.id} className={cn(
                                                        "bg-white dark:bg-[#15171c] p-5 rounded-3xl border transition-all flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between group shadow-sm hover:shadow-md",
                                                        isOverdue ? "border-red-500/30 dark:border-red-500/20 shadow-[0_4px_20px_rgba(239,68,68,0.05)]" : 
                                                        isUrgent ? "border-amber-500/30 dark:border-amber-500/20" : 
                                                        "border-zinc-200 dark:border-white/5 hover:border-indigo-500/30"
                                                    )}>
                                                        <div className="flex gap-4 items-center">
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                                                                isOverdue ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                                                isUrgent ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                                                "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
                                                            )}>
                                                                {isOverdue ? <AlertCircle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-1">{item.definition.name}</h3>
                                                                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                                                    Planlanan: <span className="text-zinc-700 dark:text-zinc-200">{item.dueDate}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                                            <div className={cn(
                                                                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-center flex-1 sm:flex-none",
                                                                isOverdue ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                                                                isUrgent ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                                                                "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300"
                                                            )}>
                                                                {isOverdue ? `${Math.abs(daysLeft)} GÜN GECİKTİ` : 
                                                                isUrgent ? `SON ${daysLeft} GÜN` : `${daysLeft} GÜN KALDI`}
                                                            </div>
                                                            <button 
                                                                onClick={() => handleBookAppointment(item)}
                                                                className="bg-zinc-900 hover:bg-zinc-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 shrink-0"
                                                            >
                                                                Randevu <ChevronRight className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </motion.div>
                                )}

                                {/* TAB 2: AŞI GEÇMİŞİ (HISTORY / PASSPORT STYLE) */}
                                {activeTab === 'history' && ruleset && (
                                    <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                                        {/* Action Bar */}
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Aşı veya veteriner ara..." 
                                                    className="w-full bg-white dark:bg-[#15171c] border border-zinc-200 dark:border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-zinc-800 dark:text-white outline-none focus:border-emerald-500/50 dark:focus:border-emerald-500/50 transition-colors"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <button 
                                                onClick={handleDownloadPDF}
                                                disabled={isDownloading || completedVaccines.length === 0}
                                                className="bg-white dark:bg-[#15171c] border border-zinc-200 dark:border-white/5 hover:border-emerald-500/30 text-zinc-700 dark:text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isDownloading ? (
                                                    <div className="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-emerald-500 animate-spin" />
                                                ) : (
                                                    <><Download className="w-4 h-4 text-emerald-500" /> PDF İndir</>
                                                )}
                                            </button>
                                        </div>

                                        {filteredHistory.length === 0 ? (
                                            <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 text-xs font-bold bg-white dark:bg-[#15171c] rounded-3xl border border-zinc-200 dark:border-white/5">
                                                Kayıtlı geçmiş aşı bulunamadı.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {filteredHistory.map((item, idx) => (
                                                    <div key={item.id} className="bg-gradient-to-br from-white to-zinc-50 dark:from-[#15171c] dark:to-[#121418] p-5 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
                                                        {/* Decorative Passport Background Pattern */}
                                                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                                                        
                                                        {/* Digital Stamp Watermark */}
                                                        {item.vetName && (
                                                            <div className="absolute -right-4 -bottom-4 opacity-5 rotate-[-15deg] pointer-events-none">
                                                                <BadgeCheck className="w-32 h-32 text-emerald-500" />
                                                            </div>
                                                        )}

                                                        <div className="relative z-10 flex flex-col h-full justify-between">
                                                            <div>
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black px-2 py-1 rounded border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
                                                                        <CheckCircle2 className="w-3 h-3" /> UYGULANDI
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-zinc-400">{item.dateAdministered}</span>
                                                                </div>
                                                                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-tight mb-1">{item.definition.name}</h3>
                                                                <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider line-clamp-1">{item.definition.description}</p>
                                                            </div>

                                                            <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 dark:border-white/10">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-black/30 flex items-center justify-center border border-zinc-200 dark:border-white/5">
                                                                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Onaylayan Veteriner Hekim / Klinik</p>
                                                                        <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">{item.vetName || 'Kullanıcı Bildirimi'}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* TAB 3: REHBER (GUIDE) */}
                                {activeTab === 'guide' && ruleset && (
                                    <motion.div key="guide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                                        <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-3xl flex gap-4 items-start mb-2">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                <Info className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-1">Evcil Hayvan Aşı Rehberi</h4>
                                                <p className="text-[10px] text-blue-600/80 dark:text-blue-300/70 font-bold leading-relaxed">
                                                    Aşağıdaki bilgiler genel standartları yansıtır. Evcil hayvanınızın sağlık durumu ve yaşına göre veteriner hekiminiz farklı bir takvim önerebilir.
                                                </p>
                                            </div>
                                        </div>

                                        {ruleset.definitions.map(def => (
                                            <div key={def.id} className="bg-white dark:bg-[#15171c] p-5 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm">
                                                <div className="flex gap-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                                                        def.isCore ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                                    )}>
                                                        <ShieldCheck className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">{def.name}</h3>
                                                            {def.isCore && (
                                                                <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[8px] font-black px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-widest">
                                                                    ZORUNLU
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold leading-relaxed">{def.description}</p>
                                                        
                                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-100 dark:border-white/5">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                                                <span className="text-[9px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">Tekrar: {def.frequency}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                                                <span className="text-[9px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">Min Yaş: {def.minAgeWeeks} Hafta</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}
