'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { cn } from '@/lib/utils';
import { toWallIso, todayKey, addDaysKey, formatDateKeyTr } from '@/lib/appointmentTime';

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-card border border-card-border rounded-t-3xl sm:rounded-3xl p-6 space-y-5"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-foreground tracking-tight">{title}</h3>
                    <button onClick={onClose} aria-label="Kapat" className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-card-border/60">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {children}
            </motion.div>
        </motion.div>
    );
}

interface RescheduleProps {
    appointment: { id: string; clinicId: string; clinicName: string; date: string; time: string; durationMinutes: number; status: string } | null;
    onClose: () => void;
    onDone: (message: string) => void;
}

// Müşterinin erteleme talebi: onaylı randevuda işletme onayına gider, bekleyen talepte doğrudan taşınır.
export function RescheduleRequestModal({ appointment, onClose, onDone }: RescheduleProps) {
    const [dateKey, setDateKey] = useState(todayKey());
    const [slots, setSlots] = useState<{ slot_time: string; available: boolean }[]>([]);
    const [time, setTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [noticeHours, setNoticeHours] = useState(0);

    useEffect(() => {
        if (!appointment) return;
        setDateKey(appointment.date >= todayKey() ? appointment.date : todayKey());
        setTime('');
        setError(null);
        apiService.getCancellationNoticeHours(appointment.clinicId).then(setNoticeHours).catch(() => setNoticeHours(0));
    }, [appointment?.id]);

    useEffect(() => {
        if (!appointment || !dateKey) return;
        let cancelled = false;
        setLoading(true);
        apiService.getAvailableSlots(appointment.clinicId, dateKey, appointment.durationMinutes, null)
            .then(list => { if (!cancelled) { setSlots(list); setTime(''); } })
            .catch(() => { if (!cancelled) setSlots([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [appointment?.id, dateKey]);

    const days = Array.from({ length: 14 }, (_, i) => addDaysKey(todayKey(), i));

    const submit = async () => {
        if (!appointment || !time) return;
        setSubmitting(true);
        setError(null);
        try {
            await apiService.requestReschedule(appointment.id, toWallIso(dateKey, time));
            onDone(appointment.status === 'confirmed'
                ? 'Erteleme talebin işletmeye iletildi. Onaylanınca bildirim alacaksın.'
                : 'Randevu talebin yeni saate taşındı.');
        } catch (err: any) {
            setError(err?.message || 'Erteleme isteği gönderilemedi.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {appointment && (
                <Shell title="Randevuyu ertele" onClose={onClose}>
                    <p className="text-xs font-semibold text-secondary">
                        {appointment.clinicName} · şu anki randevun {formatDateKeyTr(appointment.date, { day: 'numeric', month: 'long' })} {appointment.time}.
                        {appointment.status === 'confirmed' && ' Yeni saat işletmenin onayından sonra geçerli olur; o zamana kadar mevcut randevun geçerli.'}
                    </p>
                    {noticeHours > 0 && (
                        <p className="text-[11px] font-semibold text-secondary bg-card-border/40 rounded-xl p-3">
                            Bu işletme randevudan en az {noticeHours} saat önce yapılan erteleme ve iptalleri kabul ediyor.
                        </p>
                    )}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {days.map(d => (
                            <button
                                key={d}
                                onClick={() => setDateKey(d)}
                                className={cn("shrink-0 px-3 py-2 rounded-xl border text-xs font-bold",
                                    d === dateKey ? "bg-accent border-accent text-white" : "bg-card border-card-border text-secondary")}
                            >
                                {formatDateKeyTr(d, { weekday: 'short', day: 'numeric' })}
                            </button>
                        ))}
                    </div>
                    {loading ? (
                        <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-secondary" /></div>
                    ) : slots.filter(s => s.available).length === 0 ? (
                        <p className="text-xs font-semibold text-secondary">Bu gün için uygun saat yok. Başka bir gün seç.</p>
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            {slots.map(s => (
                                <button
                                    key={s.slot_time}
                                    disabled={!s.available}
                                    onClick={() => setTime(s.slot_time)}
                                    className={cn("py-2 rounded-lg border text-xs font-bold tabular-nums",
                                        !s.available ? "opacity-40 line-through border-transparent text-secondary"
                                            : time === s.slot_time ? "bg-accent border-accent text-white" : "border-card-border bg-card text-secondary")}
                                >
                                    {s.slot_time}
                                </button>
                            ))}
                        </div>
                    )}
                    {error && <p className="text-xs font-bold text-red-500">{error}</p>}
                    <button
                        onClick={submit}
                        disabled={!time || submitting}
                        className="w-full py-3.5 rounded-xl bg-accent text-white font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {appointment.status === 'confirmed' ? 'Erteleme talebi gönder' : 'Yeni saate taşı'}
                    </button>
                </Shell>
            )}
        </AnimatePresence>
    );
}

interface VisitSummaryProps {
    appointment: { id: string; clinicName: string; date: string; time: string; type: string; realDoctorName?: string | null; petName: string; statusReason?: string | null } | null;
    onClose: () => void;
    onRebook?: () => void;
}

export function VisitSummaryModal({ appointment, onClose, onRebook }: VisitSummaryProps) {
    const [record, setRecord] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!appointment) return;
        setLoading(true);
        apiService.getVisitSummary(appointment.id).then(setRecord).finally(() => setLoading(false));
    }, [appointment?.id]);

    const meds: any[] = Array.isArray(record?.medications) ? record.medications : [];

    return (
        <AnimatePresence>
            {appointment && (
                <Shell title="Ziyaret özeti" onClose={onClose}>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                        <dt className="text-secondary font-semibold">İşletme</dt><dd className="font-bold text-foreground">{appointment.clinicName}</dd>
                        <dt className="text-secondary font-semibold">Tarih</dt><dd className="font-bold text-foreground tabular-nums">{formatDateKeyTr(appointment.date, { day: 'numeric', month: 'long', year: 'numeric' })} {appointment.time}</dd>
                        <dt className="text-secondary font-semibold">Hizmet</dt><dd className="font-bold text-foreground">{appointment.type}</dd>
                        <dt className="text-secondary font-semibold">Evcil hayvan</dt><dd className="font-bold text-foreground">{appointment.petName}</dd>
                        {(record?.vet_name || appointment.realDoctorName) && <><dt className="text-secondary font-semibold">İlgilenen</dt><dd className="font-bold text-foreground">{record?.vet_name || appointment.realDoctorName}</dd></>}
                    </dl>

                    {loading ? (
                        <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-secondary" /></div>
                    ) : record ? (
                        <div className="space-y-3">
                            {record.diagnosis && (
                                <div className="bg-card-border/40 rounded-xl p-3">
                                    <div className="text-[10px] font-black text-secondary uppercase tracking-wider mb-1">Tanı / değerlendirme</div>
                                    <p className="text-sm font-semibold text-foreground">{record.diagnosis}</p>
                                </div>
                            )}
                            {meds.length > 0 && (
                                <div className="bg-card-border/40 rounded-xl p-3">
                                    <div className="text-[10px] font-black text-secondary uppercase tracking-wider mb-1">Reçete</div>
                                    <ul className="space-y-1">
                                        {meds.map((m, i) => (
                                            <li key={i} className="text-sm font-semibold text-foreground">
                                                {typeof m === 'string' ? m : [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(' · ')}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {record.critical_notes && (
                                <div className="bg-card-border/40 rounded-xl p-3">
                                    <div className="text-[10px] font-black text-secondary uppercase tracking-wider mb-1">Önemli not</div>
                                    <p className="text-sm font-semibold text-foreground">{record.critical_notes}</p>
                                </div>
                            )}
                            {(record.weight_kg || record.temperature_c || record.cost) && (
                                <div className="flex flex-wrap gap-2 text-xs font-bold text-foreground">
                                    {record.weight_kg && <span className="bg-card-border/40 rounded-lg px-2.5 py-1.5">Kilo {record.weight_kg} kg</span>}
                                    {record.temperature_c && <span className="bg-card-border/40 rounded-lg px-2.5 py-1.5">Ateş {record.temperature_c} °C</span>}
                                    {record.cost != null && <span className="bg-card-border/40 rounded-lg px-2.5 py-1.5">Ücret {Number(record.cost).toLocaleString('tr-TR')} ₺</span>}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs font-semibold text-secondary">Bu ziyaret için işletme ayrıntılı kayıt girmedi.</p>
                    )}

                    {onRebook && (
                        <button onClick={onRebook} className="w-full py-3.5 rounded-xl bg-accent text-white font-black text-sm">
                            Tekrar randevu al
                        </button>
                    )}
                </Shell>
            )}
        </AnimatePresence>
    );
}
