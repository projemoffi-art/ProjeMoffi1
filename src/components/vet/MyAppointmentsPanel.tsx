'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, AlertCircle, X, CheckCircle2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/apiService';
import { usePet } from '@/context/PetContext';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

interface MyAppointmentsPanelProps {
    appointments: any[];
    activePetId?: string;
    reviewableAppointmentIds?: Set<string>;
    onReviewClick?: (clinicId: string, appointmentId: string) => void;
}

export function MyAppointmentsPanel({ appointments, activePetId, reviewableAppointmentIds, onReviewClick }: MyAppointmentsPanelProps) {
    const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
    const [showAllPets, setShowAllPets] = useState(true);
    const { refreshAppointments } = usePet();
    const { user } = useAuth();
    const [cancelModalId, setCancelModalId] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [noShowCount, setNoShowCount] = useState<number>(0);

    useEffect(() => {
        if (user?.id) {
            apiService.getNoShowCount(user.id).then(setNoShowCount).catch(console.error);
        }
    }, [user?.id]);

    const handleCancel = async () => {
        if (!cancelModalId) return;
        setIsCancelling(true);
        try {
            await apiService.cancelAppointment(cancelModalId);
            await refreshAppointments();
        } catch (error) {
            console.error("Failed to cancel appointment:", error);
        } finally {
            setIsCancelling(false);
            setCancelModalId(null);
        }
    };

    


    const filteredByPet = showAllPets 
        ? appointments 
        : appointments.filter(a => a.petId === activePetId);

    const activeAppointments = filteredByPet.filter(a => ['pending', 'confirmed'].includes(a.status));
    const pastAppointments = filteredByPet.filter(a => ['completed', 'cancelled', 'rejected'].includes(a.status));

    activeAppointments.sort((a, b) => a._rawDate - b._rawDate);
    pastAppointments.sort((a, b) => b._rawDate - a._rawDate);

    const displayedAppointments = activeTab === 'active' ? activeAppointments : pastAppointments;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4 border-b border-card-border pb-0">
                <div className="flex">
                    <button 
                        onClick={() => setActiveTab('active')}
                        className={cn(
                            "px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all relative cursor-pointer",
                            activeTab === 'active' ? "text-foreground" : "text-secondary hover:text-foreground"
                        )}
                    >
                        Aktif
                        {activeTab === 'active' && <div className="absolute bottom-0 inset-x-4 h-1 bg-accent rounded-t-full" />}
                    </button>
                    <button 
                        onClick={() => setActiveTab('past')}
                        className={cn(
                            "px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all relative cursor-pointer",
                            activeTab === 'past' ? "text-foreground" : "text-secondary hover:text-foreground"
                        )}
                    >
                        Geçmiş
                        {activeTab === 'past' && <div className="absolute bottom-0 inset-x-4 h-1 bg-accent rounded-t-full" />}
                    </button>
                </div>
                
                <button 
                    onClick={() => setShowAllPets(!showAllPets)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all border mb-2",
                        showAllPets 
                            ? "bg-accent/10 border-accent/20 text-accent" 
                            : "bg-card border-card-border text-secondary hover:text-foreground"
                    )}
                >
                    <Filter className="w-3.5 h-3.5" />
                    {showAllPets ? "Tümü" : "Sadece Aktif Pati"}
                </button>
            </div>

            {displayedAppointments.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 px-8 text-center"
                >
                    <div className="w-20 h-20 rounded-[2rem] bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] flex items-center justify-center mb-6">
                        <Calendar className="w-9 h-9 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <h3 className="text-zinc-800 dark:text-[#fafafa] font-black text-lg uppercase italic tracking-tighter">
                        {activeTab === 'active' ? 'Henüz Aktif Randevunuz Yok' : 'Henüz Geçmiş Randevunuz Yok'}
                    </h3>
                    <p className="text-zinc-500 dark:text-[#a1a1aa] text-sm mt-2 leading-relaxed max-w-xs">
                        {activeTab === 'active' 
                            ? 'Klinik Keşfet sekmesinden çevrenizdeki veterinerleri bulup hemen randevu oluşturabilirsiniz.'
                            : 'Tamamlanan veya iptal edilen randevularınız burada listelenir.'}
                    </p>
                </motion.div>
            ) : (
                <div className="grid gap-4">

                {displayedAppointments.map((appt) => (
                    <div 
                        key={appt.id} 
                        className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-xl shrink-0">
                                {appt.icon || '🏥'}
                            </div>
                            <div>
                                <h4 className="text-zinc-800 dark:text-[#fafafa] font-black text-base uppercase leading-tight mb-1">{appt.type}</h4>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold text-secondary uppercase tracking-wider mt-1">
                                    <span className="text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded-md">
                                        {appt.petName}
                                    </span>
                                    <span className="text-foreground/80">{appt.clinicName}</span>
                                    {appt.realDoctorName && (
                                        <>
                                            <span className="opacity-50">•</span>
                                            <span>Dr. {appt.realDoctorName}</span>
                                        </>
                                    )}
                                    <span className="opacity-50">•</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {appt.date}</span>
                                    <span className="opacity-50">•</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {appt.time}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t border-zinc-100 dark:border-zinc-800 sm:border-0 pt-3 sm:pt-0">
                            {/* Status Badge */}
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5",
                                appt.status === 'İptal Edildi' || appt.status === 'cancelled' ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" :
                                appt.status === 'confirmed' || appt.status === 'Tamamlandı' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" :
                                "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                            )}>
                                {appt.status === 'cancelled' || appt.status === 'İptal Edildi' ? <X className="w-3 h-3" /> : 
                                 appt.status === 'confirmed' || appt.status === 'Tamamlandı' ? <CheckCircle2 className="w-3 h-3" /> : 
                                 <Clock className="w-3 h-3" />}
                                {appt.status === 'cancelled' ? 'İptal Edildi' : appt.status}
                            </div>
                            
                            {reviewableAppointmentIds?.has(appt.id) && onReviewClick && appt.clinicId && (
                                <button 
                                    onClick={() => onReviewClick(appt.clinicId, appt.id)}
                                    className="text-[9px] font-black text-accent hover:text-white hover:bg-accent border border-accent/20 bg-accent/5 uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg mt-2"
                                >
                                    DEĞERLENDİR
                                </button>
                            )}
                            {/* Cancel Button */}
                            {appt.status !== 'İptal Edildi' && appt.status !== 'cancelled' && appt.status !== 'Tamamlandı' && appt.status !== 'completed' && (
                                <button 
                                    onClick={() => setCancelModalId(appt.id)}
                                    className="text-[9px] font-black text-red-500/70 hover:text-red-600 dark:hover:text-red-400 uppercase tracking-widest transition-colors px-2 py-1"
                                >
                                    İPTAL ET
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            )}

            {/* Faz 9: No-Show Nötr Bilgi */}
            {noShowCount > 0 && (
                <div className="mt-4 px-4 py-3 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800/60 rounded-xl flex items-center justify-center text-center">
                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                        Hesabınızda toplam <span className="font-bold text-zinc-700 dark:text-zinc-300">{noShowCount} randevuya</span> katılmama kaydı var (tüm evcil hayvanlarınız dahil).
                    </p>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            <AnimatePresence>
                {cancelModalId && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-[2rem] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <AlertCircle className="w-24 h-24 text-red-500" />
                            </div>
                            
                            <div className="relative z-10 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                    <X className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-zinc-800 dark:text-white uppercase italic tracking-tight mb-2">
                                    Randevuyu İptal Et
                                </h3>
                                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium leading-relaxed mb-8">
                                    Bu randevuyu iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz ve klinik bilgilendirilir.
                                </p>
                                
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setCancelModalId(null)}
                                        className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-[#18181b] text-zinc-600 dark:text-zinc-400 font-black text-xs uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-[#27272a] transition-colors"
                                    >
                                        Vazgeç
                                    </button>
                                    <button 
                                        onClick={handleCancel}
                                        disabled={isCancelling}
                                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isCancelling ? 'İptal Ediliyor...' : 'Evet, İptal Et'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
