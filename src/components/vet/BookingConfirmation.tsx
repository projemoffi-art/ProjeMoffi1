'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Navigation, PawPrint, CheckCircle2 } from 'lucide-react';
import { directionsUrl } from '@/components/vet/VetShared';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import type { VetClinic } from '@/types/domain';

export interface BookingSummary {
    clinic: VetClinic;
    serviceName: string;
    dateKey: string;
    time: string;
    durationMinutes: number;
    petName: string | null;
    petImage: string | null;
    staffName: string | null;
}

function icsDate(dateKey: string, time: string, addMinutes = 0) {
    const [y, m, d] = dateKey.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const dt = new Date(y, m - 1, d, hh, mm + addMinutes);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function icsEscape(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// Randevu yerel (Türkiye) saatiyle takvime eklenir; TZID olarak Europe/Istanbul verilir.
function downloadIcs(summary: BookingSummary) {
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Moffi//Randevu//TR',
        'BEGIN:VEVENT',
        `UID:${Date.now()}@moffi.net`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;TZID=Europe/Istanbul:${icsDate(summary.dateKey, summary.time)}`,
        `DTEND;TZID=Europe/Istanbul:${icsDate(summary.dateKey, summary.time, summary.durationMinutes)}`,
        `SUMMARY:${icsEscape(`${summary.serviceName} · ${summary.clinic.name}`)}`,
        `LOCATION:${icsEscape(summary.clinic.address || summary.clinic.name)}`,
        `DESCRIPTION:${icsEscape(`Moffi randevusu${summary.petName ? ` (${summary.petName})` : ''}. İşletme onayı bekleniyor olabilir, durumu uygulamadan kontrol et.`)}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT2H',
        'ACTION:DISPLAY',
        'DESCRIPTION:Randevu hatırlatması',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moffi-randevu.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Referans Ekran 6. Talep işletme onayına gittiği için başlık "onaylandı" değil.
export function BookingConfirmation({ summary, onViewAppointments, onClose }: {
    summary: BookingSummary;
    onViewAppointments: () => void;
    onClose: () => void;
}) {
    const rows: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[] = [
        { icon: MapPin, label: 'İşletme', value: summary.clinic.name },
        { icon: PawPrint, label: 'Hizmet', value: summary.serviceName + (summary.staffName ? ` · ${summary.staffName}` : '') },
        { icon: Calendar, label: 'Tarih', value: formatDateKeyTr(summary.dateKey, { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }) },
        { icon: Clock, label: 'Saat', value: `${summary.time} (${summary.durationMinutes} dk)` },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3200] bg-background overflow-y-auto"
        >
            <div className="max-w-md mx-auto px-6 pt-[calc(env(safe-area-inset-top,0px)+40px)] pb-[calc(32px+env(safe-area-inset-bottom,0px))] flex flex-col items-center text-center">
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 14 }}
                    className="w-36 h-36 rounded-full bg-accent/10 flex items-center justify-center"
                >
                    <div className="w-24 h-24 rounded-3xl bg-card shadow-lg flex items-center justify-center">
                        <CheckCircle2 className="w-11 h-11 text-accent" />
                    </div>
                </motion.div>
                <h1 className="text-2xl font-black mt-6">Randevu talebin alındı 🐾</h1>
                <p className="text-sm font-medium text-secondary mt-2 max-w-xs">
                    İşletme onayladığında bildirim alacaksın. Randevundan önce sana hatırlatma da göndereceğiz.
                </p>

                <div className="w-full bg-card border border-card-border rounded-2xl mt-7 divide-y divide-card-border text-left">
                    {rows.map(r => (
                        <div key={r.label} className="flex items-center gap-3 px-4 py-3">
                            <r.icon className="w-4 h-4 text-accent shrink-0" />
                            <span className="text-[12px] font-semibold text-secondary w-16 shrink-0">{r.label}</span>
                            <span className="text-[13px] font-bold min-w-0">{r.value}</span>
                        </div>
                    ))}
                    {summary.petName && (
                        <div className="flex items-center gap-3 px-4 py-3">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-card-border/50 shrink-0 flex items-center justify-center text-[10px] font-black">
                                {summary.petImage ? <img src={summary.petImage} alt="" className="w-full h-full object-cover" /> : summary.petName.charAt(0)}
                            </div>
                            <span className="text-[12px] font-semibold text-secondary w-16 shrink-0">Kimin için</span>
                            <span className="text-[13px] font-bold">{summary.petName}</span>
                        </div>
                    )}
                </div>

                <div className="w-full space-y-2.5 mt-7">
                    <button onClick={() => downloadIcs(summary)} className="w-full h-12 rounded-xl bg-accent text-white font-black text-sm flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4" /> Takvime ekle
                    </button>
                    <button onClick={onViewAppointments} className="w-full h-12 rounded-xl border border-accent/40 text-accent font-black text-sm">
                        Randevularımı gör
                    </button>
                    <a href={directionsUrl(summary.clinic)} target="_blank" rel="noopener noreferrer" className="w-full h-11 flex items-center justify-center gap-2 text-sm font-bold text-secondary">
                        <Navigation className="w-4 h-4" /> Yol tarifi al
                    </a>
                    <button onClick={onClose} className="w-full h-10 text-xs font-bold text-secondary/80">Kapat</button>
                </div>
            </div>
        </motion.div>
    );
}
