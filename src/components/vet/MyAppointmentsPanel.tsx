'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, AlertCircle, X, CheckCircle2, Filter, ArrowDownUp, Check, Bell } from 'lucide-react';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import { cn, showToast } from '@/lib/utils';
import { RescheduleRequestModal, VisitSummaryModal } from '@/components/vet/AppointmentActionModals';
import { apiService } from '@/services/apiService';
import { usePet } from '@/context/PetContext';
import { useAuth } from '@/context/AuthContext';

interface MyAppointmentsPanelProps {
    appointments: any[];
    activePetId?: string;
    reviewableAppointmentIds?: Set<string>;
    onReviewClick?: (clinicId: string, appointmentId: string) => void;
    onRebook?: (clinicId: string, serviceName: string) => void;
    onOpenClinic?: (clinicId: string) => void;
}

const actionBtn = "h-8 px-3 rounded-lg text-[11px] font-bold text-foreground border border-card-border bg-background hover:border-accent/30 transition-colors inline-flex items-center";
const actionBtnAccent = "h-8 px-3 rounded-lg text-[11px] font-bold text-accent border border-accent/25 bg-accent/5 hover:bg-accent/10 transition-colors inline-flex items-center";

type ReminderPrefs = { h24: boolean; h2: boolean; day: boolean };
const REMINDER_ROWS: { key: keyof ReminderPrefs; label: string }[] = [
    { key: 'h24', label: '24 saat önce' },
    { key: 'h2', label: '2 saat önce' },
    { key: 'day', label: 'Randevu günü sabahı' },
];

// Hatırlatmalar sunucuda (enqueue_appointment_reminders) bu tercihlere göre bildirim + e-posta olarak gönderilir.
function ReminderSettings() {
    const [prefs, setPrefs] = useState<ReminderPrefs | null>(null);
    useEffect(() => {
        apiService.getReminderPrefs().then(setPrefs).catch(() => setPrefs({ h24: true, h2: true, day: true }));
    }, []);
    const toggle = async (key: keyof ReminderPrefs) => {
        if (!prefs) return;
        const prev = prefs;
        const next = { ...prefs, [key]: !prefs[key] };
        setPrefs(next);
        try {
            await apiService.setReminderPrefs(next);
        } catch {
            setPrefs(prev);
            showToast("Hatırlatma ayarı kaydedilemedi.", "AlertCircle", "text-red-500 font-bold");
        }
    };
    return (
        <div className="bg-card border border-card-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4 text-accent" />
                <h4 className="text-sm font-black text-foreground">Hatırlatmalar</h4>
            </div>
            <p className="text-[11px] font-semibold text-secondary mb-2">Yaklaşan randevuların için bildirim ve e-posta gönderilir.</p>
            <div className="divide-y divide-card-border">
                {REMINDER_ROWS.map(r => {
                    const on = !!prefs?.[r.key];
                    return (
                        <button key={r.key} onClick={() => toggle(r.key)} disabled={!prefs} role="switch" aria-checked={on}
                            className="w-full flex items-center justify-between py-2.5 disabled:opacity-50">
                            <span className="text-[13px] font-semibold text-foreground">{r.label}</span>
                            <span className={cn("w-10 h-6 rounded-full p-0.5 transition-colors", on ? "bg-accent" : "bg-card-border")}>
                                <span className={cn("block w-5 h-5 rounded-full bg-white transition-transform", on ? "translate-x-4" : "translate-x-0")} />
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}


const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
        case 'pending':
            return { label: 'Onay Bekliyor', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: <Clock className="w-3 h-3" /> };
        case 'confirmed':
            return { label: 'Onaylandı', bg: 'bg-accent-secondary/10', text: 'text-accent-secondary', icon: <CheckCircle2 className="w-3 h-3" /> };
        case 'completed':
            return { label: 'Tamamlandı', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: <CheckCircle2 className="w-3 h-3" /> };
        case 'cancelled':
        case 'i̇ptal edildi':
            return { label: 'İptal Edildi', bg: 'bg-card-border/50', text: 'text-secondary', icon: <X className="w-3 h-3" /> };
        case 'rejected':
            return { label: 'Reddedildi', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400', icon: <X className="w-3 h-3" /> };
        default:
            return { label: status, bg: 'bg-card-border/40', text: 'text-secondary', icon: <Clock className="w-3 h-3" /> };
    }
};

export function MyAppointmentsPanel({ appointments, activePetId, reviewableAppointmentIds, onReviewClick, onRebook, onOpenClinic }: MyAppointmentsPanelProps) {
    const [rescheduleAppt, setRescheduleAppt] = useState<any | null>(null);
    const [summaryAppt, setSummaryAppt] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
    const [showAllPets, setShowAllPets] = useState(true);
    const [sortMode, setSortMode] = useState<'date' | 'created'>('date');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);
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
            showToast("Randevun iptal edildi.", "CheckCircle2", "text-emerald-500 font-bold");
        } catch (error: any) {
            showToast(error?.message || "Randevu iptal edilemedi.", "AlertCircle", "text-red-500 font-bold");
        } finally {
            setIsCancelling(false);
            setCancelModalId(null);
        }
    };

    


    const filteredByPet = showAllPets 
        ? appointments 
        : appointments.filter(a => a.petId === activePetId);

    const now = Date.now();
    const activeAppointments = filteredByPet.filter(a => 
        ['pending', 'confirmed'].includes(a.status) && a._rawDate > now
    );
    const pastAppointments = filteredByPet.filter(a => 
        !( ['pending', 'confirmed'].includes(a.status) && a._rawDate > now )
    );

    activeAppointments.sort((a, b) => sortMode === 'date' ? a._rawDate - b._rawDate : b._rawCreatedAt - a._rawCreatedAt);
    pastAppointments.sort((a, b) => sortMode === 'date' ? b._rawDate - a._rawDate : b._rawCreatedAt - a._rawCreatedAt);

    const displayedAppointments = activeTab === 'active' ? activeAppointments : pastAppointments;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4 border-b border-card-border pb-0">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={cn(
                            "px-6 py-4 text-xs sm:text-sm font-black transition-all relative cursor-pointer",
                            activeTab === 'active' ? "text-foreground" : "text-secondary hover:text-foreground"
                        )}
                    >
                        Aktif
                        {activeTab === 'active' && <div className="absolute bottom-0 inset-x-4 h-1 bg-accent rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={cn(
                            "px-6 py-4 text-xs sm:text-sm font-black transition-all relative cursor-pointer",
                            activeTab === 'past' ? "text-foreground" : "text-secondary hover:text-foreground"
                        )}
                    >
                        Geçmiş
                        {activeTab === 'past' && <div className="absolute bottom-0 inset-x-4 h-1 bg-accent rounded-t-full" />}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative" ref={sortRef}>
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="p-2 sm:px-4 sm:py-3 bg-card border border-card-border rounded-xl text-[10px] font-bold text-secondary hover:text-foreground transition-all flex items-center gap-2"
                        >
                            <ArrowDownUp className="w-3 h-3" />
                            <span className="hidden sm:inline">Sırala</span>
                        </button>

                        <AnimatePresence>
                            {isSortOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-64 bg-card border border-card-border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col p-1"
                                >
                                    <button
                                        onClick={() => { setSortMode('date'); setIsSortOpen(false); }}
                                        className={cn("flex items-center justify-between w-full px-3 py-3 text-left text-[11px] font-bold rounded-lg transition-colors", sortMode === 'date' ? "bg-accent/10 text-accent" : "text-foreground hover:bg-card-border/40")}
                                    >
                                        Tarihe göre (yakın→uzak)
                                        {sortMode === 'date' && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        onClick={() => { setSortMode('created'); setIsSortOpen(false); }}
                                        className={cn("flex items-center justify-between w-full px-3 py-3 text-left text-[11px] font-bold rounded-lg transition-colors", sortMode === 'created' ? "bg-accent/10 text-accent" : "text-foreground hover:bg-card-border/40")}
                                    >
                                        Eklenme sırasına göre (son alınan üstte)
                                        {sortMode === 'created' && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button
                        onClick={() => setShowAllPets(!showAllPets)}
                        className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all border mb-2",
                        showAllPets
                            ? "bg-accent/10 border-accent/20 text-accent"
                            : "bg-card border-card-border text-secondary hover:text-foreground"
                    )}
                >
                    <Filter className="w-3.5 h-3.5" />
                    {showAllPets ? "Tümü" : "Sadece aktif pati"}
                </button>
                </div>
            </div>

            {activeTab === 'active' && <ReminderSettings />}

            {displayedAppointments.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 px-8 text-center"
                >
                    <div className="w-20 h-20 rounded-[2rem] bg-card border border-card-border flex items-center justify-center mb-6">
                        <Calendar className="w-9 h-9 text-secondary" />
                    </div>
                    <h3 className="text-foreground font-black text-lg tracking-tight">
                        {activeTab === 'active' ? 'Henüz aktif randevunuz yok' : 'Henüz geçmiş randevunuz yok'}
                    </h3>
                    <p className="text-secondary text-sm mt-2 leading-relaxed max-w-xs">
                        {activeTab === 'active' 
                            ? 'İşletme Keşfet sekmesinden çevrendeki hizmet sağlayıcıları bulup randevu talebi oluşturabilirsin.'
                            : 'Tamamlanan veya iptal edilen randevularınız burada listelenir.'}
                    </p>
                </motion.div>
            ) : (
                <div className="grid gap-4">

                {displayedAppointments.map((appt) => {
                    const badge = getStatusBadge(appt.status);
                    const hasDate = /^\d{4}-\d{2}-\d{2}$/.test(appt.date);
                    const [, mm, dd] = hasDate ? appt.date.split('-') : ['', '', ''];
                    const monthShort = hasDate ? formatDateKeyTr(appt.date, { month: 'short' }) : '';
                    const weekday = hasDate ? formatDateKeyTr(appt.date, { weekday: 'long' }) : '';
                    const mapsUrl = appt.clinicAddress
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${appt.clinicName} ${appt.clinicAddress}`)}`
                        : null;
                    const isActive = activeTab === 'active' && ['pending', 'confirmed'].includes(appt.status);

                    return (
                        <div key={appt.id} className="bg-card border border-card-border rounded-2xl overflow-hidden">
                            <div className="p-4 flex gap-3.5">
                                <div className={cn(
                                    "w-14 shrink-0 rounded-xl flex flex-col items-center justify-center py-2",
                                    isActive ? "bg-accent/10 text-accent" : "bg-card-border/40 text-secondary"
                                )}>
                                    <span className="text-xl font-black leading-none tabular-nums">{hasDate ? Number(dd) : '–'}</span>
                                    <span className="text-[10px] font-bold mt-1 capitalize">{monthShort || (mm ? mm : '')}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="text-sm font-black text-foreground truncate">{appt.clinicName}</div>
                                            <div className="text-[12px] font-semibold text-secondary truncate">{appt.type}</div>
                                        </div>
                                        <span className={cn("shrink-0 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1", badge.bg, badge.text)}>
                                            {badge.icon}{badge.label}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-secondary">
                                        <span className="flex items-center gap-1 capitalize"><Clock className="w-3 h-3" />{weekday ? `${weekday}, ` : ''}{appt.time}</span>
                                        <span className="flex items-center gap-1.5">
                                            {appt.petImage
                                                ? <img src={appt.petImage} alt="" className="w-4 h-4 rounded-full object-cover" />
                                                : <span className="w-4 h-4 rounded-full bg-accent/15 text-accent text-[9px] font-black flex items-center justify-center">{(appt.petName || '?').charAt(0)}</span>}
                                            {appt.petName}
                                        </span>
                                        {appt.realDoctorName && <span className="truncate">{appt.realDoctorName}</span>}
                                    </div>
                                    {appt.rescheduleRequested && (
                                        <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-2">
                                            Erteleme talebin işletme onayı bekliyor: {appt.rescheduleRequested}
                                        </p>
                                    )}
                                    {appt.statusReason && ['rejected', 'cancelled'].includes(appt.status) && (
                                        <p className="text-[11px] font-semibold text-secondary mt-2">Sebep: {appt.statusReason}</p>
                                    )}
                                </div>
                            </div>

                            <div className="px-4 pb-4 flex flex-wrap gap-2">
                                {onOpenClinic && appt.clinicId && (
                                    <button onClick={() => onOpenClinic(appt.clinicId)} className={actionBtn}>Detayları gör</button>
                                )}
                                {isActive && mapsUrl && (
                                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={actionBtn}>Yol tarifi</a>
                                )}
                                {appt.status === 'completed' && (
                                    <button onClick={() => setSummaryAppt(appt)} className={actionBtn}>Ziyaret özeti</button>
                                )}
                                {reviewableAppointmentIds?.has(appt.id) && onReviewClick && appt.clinicId && (
                                    <button onClick={() => onReviewClick(appt.clinicId, appt.id)} className={actionBtnAccent}>Değerlendir</button>
                                )}
                                {activeTab === 'past' && onRebook && appt.clinicId && (
                                    <button onClick={() => onRebook(appt.clinicId, appt.type)} className={actionBtnAccent}>Tekrar randevu al</button>
                                )}
                                {isActive && !appt.rescheduleRequested && (
                                    <button onClick={() => setRescheduleAppt(appt)} className={actionBtn}>Ertele</button>
                                )}
                                {isActive && (
                                    <button onClick={() => setCancelModalId(appt.id)} className="h-8 px-3 rounded-lg text-[11px] font-bold text-red-500 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors">İptal et</button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            )}

            {/* Faz 9: No-Show Nötr Bilgi */}
            {noShowCount > 0 && (
                <div className="mt-4 px-4 py-3 bg-card border border-card-border rounded-xl flex items-center justify-center text-center">
                    <p className="text-[11px] font-medium text-secondary">
                        Hesabınızda toplam <span className="font-bold text-foreground">{noShowCount} randevuya</span> katılmama kaydı var (tüm evcil hayvanlarınız dahil).
                    </p>
                </div>
            )}

            <RescheduleRequestModal
                appointment={rescheduleAppt}
                onClose={() => setRescheduleAppt(null)}
                onDone={async (message) => {
                    setRescheduleAppt(null);
                    showToast(message, "CheckCircle2", "text-emerald-500 font-bold");
                    await refreshAppointments();
                }}
            />
            <VisitSummaryModal
                appointment={summaryAppt}
                onClose={() => setSummaryAppt(null)}
                onRebook={onRebook && summaryAppt?.clinicId ? () => { const a = summaryAppt; setSummaryAppt(null); onRebook(a.clinicId, a.type); } : undefined}
            />

            {/* Cancel Confirmation Modal */}
            <AnimatePresence>
                {cancelModalId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[3100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-card border border-card-border rounded-[2rem] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <AlertCircle className="w-24 h-24 text-red-500" />
                            </div>

                            <div className="relative z-10 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                    <X className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-foreground tracking-tight mb-2">
                                    Randevuyu iptal et
                                </h3>
                                <p className="text-secondary text-xs font-medium leading-relaxed mb-8">
                                    Bu randevuyu iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz ve klinik bilgilendirilir.
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setCancelModalId(null)}
                                        className="flex-1 py-3 rounded-xl bg-card-border/40 text-secondary font-black text-xs hover:bg-card-border/70 transition-colors"
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={isCancelling}
                                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-black text-xs hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isCancelling ? 'İptal ediliyor...' : 'Evet, iptal et'}
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
