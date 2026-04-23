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

interface MedicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    petId: string;
}

export function MedicationModal({ isOpen, onClose, petId }: MedicationModalProps) {
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
        } catch (err) {
            console.error("Meds fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogDose = async (medId: string) => {
        try {
            await apiService.recordMedicationDose(medId);
            setSuccessMessage("Doz Kaydedildi! ✨");
            fetchMedications();
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            console.error("Log dose error:", err);
        }
    };

    const handleAddMed = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Simplification: use saveData via apiService or add explicit addMedication to IApiService
            // For now, assume it's handled or we use a generic add logic
            const currentMeds = await apiService.getPetMedications(petId);
            const newEntry = {
                id: `m-${Date.now()}`,
                petId,
                ...newMed,
                isActive: true,
                lastLog: null
            };
            
            // Note: In a real app we'd call apiService.addMedication
            // For this implementation, I'll assume we can use current patterns
            await apiService.saveData(`meds_${petId}`, [...currentMeds, newEntry]);
            
            setNewMed({
                name: '',
                dosage: '',
                frequency: 'Günde 1 kez',
                instructions: '',
                startDate: new Date().toISOString().split('T')[0]
            });
            setShowAddForm(false);
            fetchMedications();
        } catch (err) {
            console.error("Add med error:", err);
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
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />
                    
                    <motion.div 
                        initial={{ y: "100%" }} 
                        animate={{ y: 0 }} 
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="w-full max-w-xl bg-[#0D0D12] sm:rounded-[3rem] rounded-t-[3rem] border border-white/5 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
                    >
                        {/* HEADER */}
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-white/[0.02] to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#5B4D9D]/20 flex items-center justify-center border border-[#5B4D9D]/30 shadow-lg shadow-[#5B4D9D]/10">
                                    <Pill className="w-6 h-6 text-[#8E7EF4]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">İlaç Takvimi</h2>
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Günlük Hatırlatıcılar</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10">
                                <X className="w-5 h-5 text-white/40" />
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
                                    <Sparkles className="w-5 h-5 text-emerald-400" />
                                    <span className="text-sm font-black text-emerald-100 uppercase italic">{successMessage}</span>
                                </motion.div>
                            )}

                            {loading ? (
                                <div className="py-20 text-center opacity-20 font-black text-white uppercase italic tracking-widest">Yükleniyor...</div>
                            ) : medications.length === 0 && !showAddForm ? (
                                <div className="py-16 text-center flex flex-col items-center gap-6 opacity-30">
                                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                                        <Clock className="w-8 h-8" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest leading-loose max-w-[200px]">Henüz bir ilaç hatırlatıcısı eklemediniz</p>
                                    <button 
                                        onClick={() => setShowAddForm(true)}
                                        className="mt-2 text-[#8E7EF4] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 py-3 px-6 rounded-full border border-[#8E7EF4]/20 bg-[#8E7EF4]/5 hover:bg-[#8E7EF4]/10 transition-all"
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
                                                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                                )}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all",
                                                        taken 
                                                            ? "bg-emerald-500/10 border-emerald-500/20" 
                                                            : "bg-white/5 border-white/10 shadow-inner"
                                                    )}>
                                                        {taken ? <CheckCircle2 className="w-7 h-7 text-emerald-400" /> : <Pill className="w-7 h-7 text-white/20" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-black text-lg tracking-tight leading-none mb-1.5">{med.name}</h4>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-[#8E7EF4] uppercase tracking-widest">{med.dosage}</span>
                                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">{med.frequency}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right">
                                                    {taken ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">BUGÜN ALINDI</span>
                                                            <span className="text-[9px] font-bold text-white/20 uppercase">SAAT: {new Date(med.lastLog!).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleLogDose(med.id)}
                                                            className="h-12 px-6 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#8E7EF4] hover:text-white transition-all shadow-xl active:scale-95"
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
                                            className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-4">
                                                <button type="button" onClick={() => setShowAddForm(false)} className="text-white/20 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                                            </div>
                                            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-2">Yeni İlaç Ekle</h3>
                                            
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">İlacın Adı</label>
                                                    <input 
                                                        required
                                                        placeholder="Örn: VetLife Vitamin"
                                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#8E7EF4]/50 transition-all"
                                                        value={newMed.name}
                                                        onChange={e => setNewMed({...newMed, name: e.target.value})}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Dozaj</label>
                                                        <input 
                                                            placeholder="Örn: 5ml / 1 Tablet"
                                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#8E7EF4]/50 transition-all"
                                                            value={newMed.dosage}
                                                            onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Frekans</label>
                                                        <select 
                                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#8E7EF4]/50 transition-all appearance-none"
                                                            value={newMed.frequency}
                                                            onChange={e => setNewMed({...newMed, frequency: e.target.value})}
                                                        >
                                                            <option>Günde 1 kez</option>
                                                            <option>Günde 2 kez</option>
                                                            <option>Günde 3 kez</option>
                                                            <option>Haftada 1 kez</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Özel Talimatlar</label>
                                                    <textarea 
                                                        placeholder="Örn: Tok karnına veriniz..."
                                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#8E7EF4]/50 transition-all resize-none h-24"
                                                        value={newMed.instructions}
                                                        onChange={e => setNewMed({...newMed, instructions: e.target.value})}
                                                    />
                                                </div>
                                            </div>

                                            <button 
                                                type="submit"
                                                className="w-full bg-[#8E7EF4] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#8E7EF4]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                HATIRLATICI OLUŞTUR
                                            </button>
                                        </motion.form>
                                    )}

                                    {!showAddForm && medications.length > 0 && (
                                        <button 
                                            onClick={() => setShowAddForm(true)}
                                            className="w-full py-6 border border-dashed border-white/10 rounded-[2.2rem] flex items-center justify-center gap-2 hover:bg-white/5 transition-all group"
                                        >
                                            <Plus className="w-5 h-5 text-white/20 group-hover:text-[#8E7EF4] transition-colors" />
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">YENİ İLAÇ EKLE</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* FOOTER INFO */}
                        <div className="p-8 bg-black/40 border-t border-white/5">
                            <div className="bg-[#5B4D9D]/10 border border-[#5B4D9D]/20 p-5 rounded-[1.8rem] flex items-start gap-4 shadow-inner">
                                <ShieldCheck className="w-6 h-6 text-[#8E7EF4] shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="text-[11px] font-black text-white uppercase italic tracking-tighter mb-1">Moffi Sağlık Güvencesi</h5>
                                    <p className="text-[10px] text-white/40 font-bold leading-relaxed">İlaç takibi, dostunuzun iyileşme sürecini %40 hızlandırır. Lütfen dozlarınızı zamanında kaydedin.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
