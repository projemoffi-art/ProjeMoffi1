'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Pill, Clock, Plus, CheckCircle2, 
    AlertCircle, ChevronRight, Calendar, Info, 
    Trash2, Sparkles, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/apiService';
import { PetMedication } from '@/types/domain';
import { useTheme } from '@/context/ThemeContext';

interface MedicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    petId: string;
}

export function MedicationModal({ isOpen, onClose, petId }: MedicationModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const [medications, setMedications] = useState<PetMedication[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form State
    const [newMed, setNewMed] = useState({
        name: '',
        dosage: '',
        frequency: 'Günde 1 kez',
        instructions: '',
        startDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (isOpen && petId) {
            fetchMedications();
        }
    }, [isOpen, petId]);

    const fetchMedications = async () => {
        setLoading(true);
        try {
            const data = await apiService.getPetMedications(petId);
            setMedications(data);
        } catch (error) {
            console.error('Failed to fetch medications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogDose = async (medId: string) => {
        try {
            await apiService.logMedicationDose(medId);
            setSuccessMessage("İlaç Dozu Kaydedildi! 💊");
            setTimeout(() => setSuccessMessage(null), 3000);
            fetchMedications();
        } catch (error) {
            console.error('Failed to log dose:', error);
        }
    };

    const handleAddMed = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiService.addPetMedication(petId, newMed);
            setSuccessMessage("Yeni İlaç Hatırlatıcısı Eklendi! ✨");
            setTimeout(() => setSuccessMessage(null), 3000);
            setShowAddForm(false);
            setNewMed({
                name: '',
                dosage: '',
                frequency: 'Günde 1 kez',
                instructions: '',
                startDate: new Date().toISOString().split('T')[0]
            });
            fetchMedications();
        } catch (error) {
            console.error('Failed to add medication:', error);
        }
    };

    const isTakenToday = (lastLog: string | null) => {
        if (!lastLog) return false;
        const logDate = new Date(lastLog).toDateString();
        const today = new Date().toDateString();
        return logDate === today;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md dark:bg-black/80 dark:backdrop-blur-xl"
                    />
                    
                    <motion.div 
                        initial={{ y: "100%" }} 
                        animate={{ y: 0 }} 
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="w-full max-w-xl bg-white dark:bg-[#0D0D12] sm:rounded-[3rem] rounded-t-[3rem] border border-zinc-200 dark:border-card-border shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
                    >
                        {/* HEADER */}
                        <div className="p-8 border-b border-zinc-200 dark:border-card-border flex justify-between items-center bg-gradient-to-r from-zinc-50 dark:from-white/[0.02] to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#5B4D9D]/10 dark:bg-[#5B4D9D]/20 flex items-center justify-center border border-[#5B4D9D]/20 dark:border-[#5B4D9D]/30 shadow-lg">
                                    <Pill className="w-6 h-6 text-[#8E7EF4]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-zinc-800 dark:text-white italic uppercase tracking-tighter">İlaç Takvimi</h2>
                                    <p className="text-[10px] text-zinc-400 dark:text-white/30 font-bold uppercase tracking-[0.2em]">Günlük Hatırlatıcılar</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-all border border-zinc-200 dark:border-card-border cursor-pointer">
                                <X className="w-5 h-5 text-zinc-500 dark:text-white/40" />
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                            
                            {successMessage && (
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3"
                                >
                                    <Sparkles className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                                    <span className="text-sm font-black text-emerald-800 dark:text-emerald-100 uppercase italic">{successMessage}</span>
                                </motion.div>
                            )}

                            {loading ? (
                                <div className="py-20 text-center text-zinc-400 dark:text-white opacity-40 font-black uppercase italic tracking-widest">Yükleniyor...</div>
                            ) : medications.length === 0 && !showAddForm ? (
                                <div className="py-16 text-center flex flex-col items-center gap-6 opacity-40">
                                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-250 dark:border-card-border flex items-center justify-center text-zinc-450 dark:text-white/30">
                                        <Clock className="w-8 h-8" />
                                    </div>
                                    <p className="text-xs font-black text-zinc-500 dark:text-white/40 uppercase tracking-widest leading-loose max-w-[200px]">Henüz bir ilaç hatırlatıcısı eklemediniz</p>
                                    <button 
                                        onClick={() => setShowAddForm(true)}
                                        className="mt-2 text-[#8E7EF4] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 py-3 px-6 rounded-full border border-[#8E7EF4]/30 bg-[#8E7EF4]/5 hover:bg-[#8E7EF4]/10 transition-all cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4" /> İLK İLACI EKLE
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {!showAddForm && medications.map((med) => {
                                        const taken = isTakenToday(med.lastLog || null);
                                        return (
                                            <motion.div 
                                                key={med.id}
                                                layout
                                                className={cn(
                                                    "p-6 rounded-[2.2rem] border transition-all flex items-center justify-between group",
                                                    taken 
                                                        ? "bg-emerald-500/[0.03] border-emerald-500/20" 
                                                        : "bg-white dark:bg-white/[0.02] border-zinc-205 dark:border-card-border hover:border-zinc-300 dark:hover:border-zinc-700"
                                                )}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all",
                                                        taken 
                                                            ? "bg-emerald-500/10 border-emerald-500/20" 
                                                            : "bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-card-border shadow-inner"
                                                    )}>
                                                        {taken ? <CheckCircle2 className="w-7 h-7 text-emerald-500 dark:text-emerald-400" /> : <Pill className="w-7 h-7 text-zinc-400 dark:text-white/20" />}
                                                    </div>
                                                    <div className="text-left">
                                                        <h4 className="text-zinc-850 dark:text-white font-black text-lg tracking-tight leading-none mb-1.5">{med.name}</h4>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-[#8E7EF4] uppercase tracking-widest">{med.dosage}</span>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-white/10" />
                                                            <span className="text-[10px] font-bold text-zinc-500 dark:text-white/30 uppercase tracking-[0.1em]">{med.frequency}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right">
                                                    {taken ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-1">BUGÜN ALINDI</span>
                                                            <span className="text-[9px] font-bold text-zinc-400 dark:text-white/20 uppercase">SAAT: {new Date(med.lastLog!).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleLogDose(med.id)}
                                                            className="h-12 px-6 rounded-2xl bg-zinc-100 hover:bg-[#8E7EF4] hover:text-white text-zinc-800 border border-zinc-200 dark:border-none dark:bg-card dark:text-black text-[10px] font-black uppercase tracking-widest transition-all shadow-md dark:shadow-xl active:scale-95 cursor-pointer"
                                                        >
                                                            ALINDI İŞARETLE
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {showAddForm && (
                                        <motion.form 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            onSubmit={handleAddMed}
                                            className="bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-card-border p-8 rounded-[2.5rem] space-y-6 shadow-md dark:shadow-2xl relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-4">
                                                <button type="button" onClick={() => setShowAddForm(false)} className="text-zinc-400 hover:text-zinc-750 dark:text-white/20 dark:hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
                                            </div>
                                            <h3 className="text-lg font-black text-zinc-800 dark:text-white italic uppercase tracking-tighter mb-2 text-left">Yeni İlaç Ekle</h3>
                                            
                                            <div className="space-y-4">
                                                <div className="space-y-2 text-left">
                                                    <label className="text-[9px] font-black text-zinc-400 dark:text-white/30 uppercase tracking-widest ml-1">İlacın Adı</label>
                                                    <input 
                                                        required
                                                        placeholder="Örn: VetLife Vitamin"
                                                        className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-2xl px-5 py-4 text-sm font-bold text-zinc-800 dark:text-white outline-none focus:border-[#8E7EF4]/50 transition-all"
                                                        value={newMed.name}
                                                        onChange={e => setNewMed({...newMed, name: e.target.value})}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2 text-left">
                                                        <label className="text-[9px] font-black text-zinc-400 dark:text-white/30 uppercase tracking-widest ml-1">Dozaj</label>
                                                        <input 
                                                            placeholder="Örn: 5ml / 1 Tablet"
                                                            className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-2xl px-5 py-4 text-sm font-bold text-zinc-800 dark:text-white outline-none focus:border-[#8E7EF4]/50 transition-all"
                                                            value={newMed.dosage}
                                                            onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="space-y-2 text-left">
                                                        <label className="text-[9px] font-black text-zinc-400 dark:text-white/30 uppercase tracking-widest ml-1">Frekans</label>
                                                        <select 
                                                            className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-2xl px-5 py-4 text-sm font-bold text-zinc-800 dark:text-white outline-none focus:border-[#8E7EF4]/50 transition-all appearance-none"
                                                            value={newMed.frequency}
                                                            onChange={e => setNewMed({...newMed, frequency: e.target.value})}
                                                        >
                                                            <option className="text-zinc-850 dark:text-white bg-white dark:bg-black">Günde 1 kez</option>
                                                            <option className="text-zinc-850 dark:text-white bg-white dark:bg-black">Günde 2 kez</option>
                                                            <option className="text-zinc-850 dark:text-white bg-white dark:bg-black">Günde 3 kez</option>
                                                            <option className="text-zinc-850 dark:text-white bg-white dark:bg-black">Haftada 1 kez</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-left">
                                                    <label className="text-[9px] font-black text-zinc-400 dark:text-white/30 uppercase tracking-widest ml-1">Özel Talimatlar</label>
                                                    <textarea 
                                                        placeholder="Örn: Tok karnına veriniz..."
                                                        className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-card-border rounded-2xl px-5 py-4 text-sm font-bold text-zinc-800 dark:text-white outline-none focus:border-[#8E7EF4]/50 transition-all resize-none h-24"
                                                        value={newMed.instructions}
                                                        onChange={e => setNewMed({...newMed, instructions: e.target.value})}
                                                    />
                                                </div>
                                            </div>

                                            <button 
                                                type="submit"
                                                className="w-full bg-[#8E7EF4] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#8E7EF4]/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                                            >
                                                HATIRLATICI OLUŞTUR
                                            </button>
                                        </motion.form>
                                    )}

                                    {!showAddForm && medications.length > 0 && (
                                        <button 
                                            onClick={() => setShowAddForm(true)}
                                            className="w-full py-6 border border-dashed border-zinc-200 dark:border-card-border rounded-[2.2rem] flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all group cursor-pointer"
                                        >
                                            <Plus className="w-5 h-5 text-zinc-400 dark:text-white/20 group-hover:text-[#8E7EF4] transition-colors" />
                                            <span className="text-[10px] font-black text-zinc-500 dark:text-white/30 uppercase tracking-widest">YENİ İLAÇ EKLE</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* FOOTER INFO */}
                        <div className="p-8 bg-zinc-50/50 dark:bg-black/40 border-t border-zinc-200 dark:border-card-border">
                            <div className="bg-[#5B4D9D]/5 dark:bg-[#5B4D9D]/10 border border-[#5B4D9D]/15 dark:border-[#5B4D9D]/20 p-5 rounded-[1.8rem] flex items-start gap-4 shadow-inner">
                                <ShieldCheck className="w-6 h-6 text-[#8E7EF4] shrink-0 mt-0.5" />
                                <div className="text-left">
                                    <h5 className="text-[11px] font-black text-zinc-800 dark:text-white uppercase italic tracking-tighter mb-1">Moffi Sağlık Güvencesi</h5>
                                    <p className="text-[10px] text-zinc-500 dark:text-white/40 font-bold leading-relaxed">İlaç takibi, dostunuzun iyileşme sürecini %40 hızlandırır. Lütfen dozlarınızı zamanında kaydedin.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
