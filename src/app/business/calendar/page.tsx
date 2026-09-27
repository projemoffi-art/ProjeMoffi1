"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBusinessType } from "@/context/BusinessTypeContext";
import { apiService } from "@/services/apiService";
import { supabase } from "@/lib/supabase";
import { cn, showToast } from "@/lib/utils";
import { wallParts, todayKey, addDaysKey, formatDateKeyTr, toWallIso } from "@/lib/appointmentTime";
import { NewAppointmentModal, NewAppointmentPrefill } from "@/components/business/NewAppointmentModal";

type CalAppointment = {
    id: string;
    dateKey: string;
    time: string;
    startMin: number;
    duration: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
    attendance: string | null;
    doctorId: string | null;
    doctorName: string | null;
    ownerName: string;
    phone: string | null;
    petName: string | null;
    service: string;
    isGuest: boolean;
    createdBy: string;
};

const SLOT_PX = 44; // 30 dakika
const STATUS_STYLE: Record<string, string> = {
    pending: "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-100",
    confirmed: "bg-indigo-50 border-indigo-300 text-indigo-900 dark:bg-indigo-500/15 dark:border-indigo-500/40 dark:text-indigo-100",
    completed: "bg-zinc-100 border-zinc-300 text-zinc-600 dark:bg-white/5 dark:border-white/15 dark:text-zinc-300",
};
const STATUS_LABEL: Record<string, string> = {
    pending: "Onay bekliyor", confirmed: "Onaylı", completed: "Tamamlandı", cancelled: "İptal", rejected: "Reddedildi"
};

function parseService(reason: string | null) {
    if (!reason) return "Randevu";
    const first = reason.split('\n')[0];
    return first.includes('Randevu tipi:') ? first.split('Randevu tipi:')[1].trim() || "Randevu" : first;
}

export default function BusinessCalendarPage() {
    const { user } = useAuth();
    const { staffLabel, hasMedicalRecords } = useBusinessType();
    const [view, setView] = useState<'day' | 'week'>('day');
    const [anchor, setAnchor] = useState(todayKey());
    const [items, setItems] = useState<CalAppointment[]>([]);
    const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<CalAppointment | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [prefill, setPrefill] = useState<NewAppointmentPrefill | undefined>();
    const [busy, setBusy] = useState(false);
    const [reason, setReason] = useState("");
    const [reschedule, setReschedule] = useState<{ dateKey: string; time: string; ignoreHours: boolean } | null>(null);

    const load = useCallback(async () => {
        if (!user?.id) return;
        const [list, docs] = await Promise.all([
            apiService.getClinicAppointments(user.id),
            apiService.getAllClinicDoctors(user.id)
        ]);
        setDoctors((docs || []).filter((d: any) => d.is_active !== false).map((d: any) => ({ id: d.id, name: d.name })));
        setItems((list || [])
            .filter((a: any) => a.appointment_date && ['pending', 'confirmed', 'completed'].includes(a.status))
            .map((a: any) => {
                const w = wallParts(a.appointment_date);
                return {
                    id: a.id,
                    dateKey: w.dateKey,
                    time: w.time,
                    startMin: w.minutes,
                    duration: a.duration_minutes || 30,
                    status: a.status,
                    attendance: a.attendance_status,
                    doctorId: a.doctor_id,
                    doctorName: a.doctor?.name || a.doctor_name || null,
                    ownerName: a.user?.full_name || a.user?.username || a.guest_name || "Müşteri",
                    phone: a.user?.phone || a.guest_phone || null,
                    petName: a.pet?.name || a.guest_pet_name || null,
                    service: parseService(a.reason),
                    isGuest: !a.user_id,
                    createdBy: a.created_by || 'customer',
                };
            }));
        setLoading(false);
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        load();
        const channel = supabase
            .channel(`clinic-calendar-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `clinic_id=eq.${user.id}` }, () => load())
            .subscribe();
        const onVisible = () => { if (document.visibilityState === 'visible') load(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            document.removeEventListener('visibilitychange', onVisible);
            supabase.removeChannel(channel);
        };
    }, [user?.id, load]);

    const weekStart = useMemo(() => {
        const [y, m, d] = anchor.split('-').map(Number);
        const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
        return addDaysKey(anchor, -((dow + 6) % 7));
    }, [anchor]);

    const days = view === 'day' ? [anchor] : Array.from({ length: 7 }, (_, i) => addDaysKey(weekStart, i));
    const visible = items.filter(a => days.includes(a.dateKey));

    const columns: { key: string; label: string; dateKey: string; doctorId: string | null }[] = view === 'week'
        ? days.map(d => ({ key: d, label: formatDateKeyTr(d, { weekday: 'short', day: 'numeric' }), dateKey: d, doctorId: null }))
        : doctors.length > 0
            ? [
                ...doctors.map(d => ({ key: d.id, label: d.name, dateKey: anchor, doctorId: d.id })),
                ...(visible.some(a => !a.doctorId || !doctors.some(d => d.id === a.doctorId)) ? [{ key: 'none', label: 'Atanmamış', dateKey: anchor, doctorId: null }] : [])
            ]
            : [{ key: 'all', label: formatDateKeyTr(anchor, { weekday: 'long', day: 'numeric', month: 'long' }), dateKey: anchor, doctorId: null }];

    const itemsFor = (col: typeof columns[number]) => visible.filter(a => {
        if (a.dateKey !== col.dateKey) return false;
        if (view === 'week' || col.key === 'all') return true;
        if (col.key === 'none') return !a.doctorId || !doctors.some(d => d.id === a.doctorId);
        return a.doctorId === col.doctorId;
    });

    const minStart = Math.min(7 * 60, ...visible.map(a => Math.floor(a.startMin / 30) * 30));
    const maxEnd = Math.max(21 * 60, ...visible.map(a => Math.ceil((a.startMin + a.duration) / 30) * 30));
    const rows = Array.from({ length: (maxEnd - minStart) / 30 }, (_, i) => minStart + i * 30);
    const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

    const today = todayKey();
    const todays = items.filter(a => a.dateKey === today && a.status !== 'completed');
    const pending = items.filter(a => a.status === 'pending').sort((a, b) => (a.dateKey + a.time).localeCompare(b.dateKey + b.time));
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const next = todays.filter(a => a.status === 'confirmed' && a.startMin >= nowMin).sort((a, b) => a.startMin - b.startMin)[0];

    const act = async (fn: () => Promise<void>, ok: string) => {
        setBusy(true);
        try {
            await fn();
            showToast(ok, "CheckCircle2", "text-emerald-500 font-bold");
            setSelected(null);
            setReason("");
            setReschedule(null);
            await load();
        } catch (err: any) {
            showToast(err?.message || "İşlem başarısız oldu.", "AlertCircle", "text-rose-500 font-bold");
        } finally {
            setBusy(false);
        }
    };

    const approveAll = () => act(async () => {
        const results = await Promise.allSettled(pending.map(p => apiService.updateAppointmentStatus(p.id, 'confirmed')));
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) throw new Error(`${pending.length - failed} talep onaylandı, ${failed} talep onaylanamadı.`);
    }, `${pending.length} talep onaylandı`);

    const openNew = (p?: NewAppointmentPrefill) => { setPrefill(p); setModalOpen(true); };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
    }

    return (
        <div className="p-4 md:p-8 w-full max-w-[1400px] mx-auto space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground dark:text-white tracking-tight">Takvim</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Bugün {todays.length} randevu · {pending.length} onay bekleyen
                        {next && <> · sıradaki {next.time} {next.ownerName}</>}
                    </p>
                </div>
                <button onClick={() => openNew({ dateKey: anchor })} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-black hover:bg-indigo-600">
                    <Plus className="w-4 h-4" /> Yeni randevu
                </button>
            </div>

            {pending.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <h2 className="text-sm font-black text-amber-900 dark:text-amber-100">Onay bekleyen talepler ({pending.length})</h2>
                        <button disabled={busy} onClick={approveAll} className="text-xs font-black px-3 py-1.5 rounded-lg bg-amber-500 text-white disabled:opacity-50">Tümünü onayla</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {pending.map(p => (
                            <button key={p.id} onClick={() => { setSelected(p); setAnchor(p.dateKey); }} className="shrink-0 text-left bg-white dark:bg-black/20 border border-amber-200 dark:border-amber-500/30 rounded-xl px-3 py-2">
                                <div className="text-xs font-black text-foreground dark:text-white">{p.ownerName}{p.petName && ` · ${p.petName}`}</div>
                                <div className="text-[11px] font-semibold text-gray-500 tabular-nums">{formatDateKeyTr(p.dateKey, { day: 'numeric', month: 'short' })} {p.time} · {p.service}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button onClick={() => setAnchor(addDaysKey(anchor, view === 'day' ? -1 : -7))} aria-label="Önceki" className="w-9 h-9 rounded-xl border border-card-border dark:border-[#27272a] flex items-center justify-center text-gray-500 hover:text-foreground"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setAnchor(today)} className="px-3 h-9 rounded-xl border border-card-border dark:border-[#27272a] text-xs font-black text-gray-600 dark:text-gray-300">Bugün</button>
                    <button onClick={() => setAnchor(addDaysKey(anchor, view === 'day' ? 1 : 7))} aria-label="Sonraki" className="w-9 h-9 rounded-xl border border-card-border dark:border-[#27272a] flex items-center justify-center text-gray-500 hover:text-foreground"><ChevronRight className="w-4 h-4" /></button>
                    <span className="text-sm font-black text-foreground dark:text-white ml-2">
                        {view === 'day'
                            ? formatDateKeyTr(anchor)
                            : `${formatDateKeyTr(weekStart, { day: 'numeric', month: 'short' })} – ${formatDateKeyTr(addDaysKey(weekStart, 6), { day: 'numeric', month: 'short' })}`}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-white/5 rounded-xl">
                    {([['day', 'Gün'], ['week', 'Hafta']] as const).map(([k, l]) => (
                        <button key={k} onClick={() => setView(k)} className={cn("px-4 py-1.5 rounded-lg text-xs font-black", view === k ? "bg-card dark:bg-zinc-800 text-foreground dark:text-white shadow-sm" : "text-gray-500")}>{l}</button>
                    ))}
                </div>
            </div>

            <div className="bg-card dark:bg-[#121212] border border-card-border dark:border-[#27272a] rounded-2xl overflow-x-auto">
                <div className="min-w-[640px]" style={{ display: 'grid', gridTemplateColumns: `56px repeat(${columns.length}, minmax(140px, 1fr))` }}>
                    <div className="border-b border-card-border dark:border-[#27272a]" />
                    {columns.map(col => (
                        <div key={col.key} className={cn("px-3 py-2.5 border-b border-l border-card-border dark:border-[#27272a] text-xs font-black truncate",
                            view === 'week' && col.dateKey === today ? "text-indigo-600 dark:text-indigo-400" : "text-foreground dark:text-white")}>
                            {view === 'week'
                                ? <button onClick={() => { setAnchor(col.dateKey); setView('day'); }} className="hover:underline">{col.label}</button>
                                : col.label}
                        </div>
                    ))}

                    <div className="relative">
                        {rows.map(m => (
                            <div key={m} style={{ height: SLOT_PX }} className="text-[10px] font-bold text-gray-400 text-right pr-2 -translate-y-1.5 tabular-nums">{m % 60 === 0 ? fmt(m) : ''}</div>
                        ))}
                    </div>
                    {columns.map(col => (
                        <div key={col.key} className="relative border-l border-card-border dark:border-[#27272a]" style={{ height: rows.length * SLOT_PX }}>
                            {rows.map((m, i) => (
                                <button
                                    key={m}
                                    aria-label={`${fmt(m)} için randevu oluştur`}
                                    onClick={() => openNew({ dateKey: col.dateKey, time: fmt(m), doctorId: col.doctorId })}
                                    className={cn("absolute inset-x-0 hover:bg-indigo-50/60 dark:hover:bg-indigo-500/5", m % 60 === 0 && "border-t border-card-border/70 dark:border-[#27272a]")}
                                    style={{ top: i * SLOT_PX, height: SLOT_PX }}
                                />
                            ))}
                            {itemsFor(col).map(a => (
                                <button
                                    key={a.id}
                                    onClick={() => { setSelected(a); setReason(""); setReschedule(null); }}
                                    className={cn("absolute left-1 right-1 rounded-lg border px-2 py-1 text-left overflow-hidden", STATUS_STYLE[a.status])}
                                    style={{ top: ((a.startMin - minStart) / 30) * SLOT_PX + 1, height: Math.max((a.duration / 30) * SLOT_PX - 2, 22) }}
                                >
                                    <div className="text-[11px] font-black truncate">{a.time} {a.ownerName}</div>
                                    <div className="text-[10px] font-semibold truncate opacity-80">{a.petName ? `${a.petName} · ` : ''}{a.service}</div>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {selected && (
                <div className="fixed inset-0 z-[3000] bg-black/40 flex justify-end" onClick={() => setSelected(null)}>
                    <div onClick={e => e.stopPropagation()} className="w-full max-w-md h-full overflow-y-auto bg-card dark:bg-[#121212] border-l border-card-border dark:border-[#27272a] p-6 space-y-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <span className={cn("inline-block text-[10px] font-black px-2 py-1 rounded-md border", STATUS_STYLE[selected.status])}>{STATUS_LABEL[selected.status]}</span>
                                <h2 className="text-xl font-black text-foreground dark:text-white mt-2">{selected.ownerName}</h2>
                                <p className="text-sm text-gray-500 font-semibold">{selected.petName || 'Evcil hayvan belirtilmedi'}{selected.isGuest && ' · Moffi dışı müşteri'}</p>
                            </div>
                            <button onClick={() => setSelected(null)} aria-label="Kapat" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-zinc-100 dark:hover:bg-white/10"><X className="w-4 h-4" /></button>
                        </div>

                        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                            <dt className="text-gray-500 font-semibold">Zaman</dt>
                            <dd className="font-bold text-foreground dark:text-white tabular-nums">{formatDateKeyTr(selected.dateKey)} · {selected.time} ({selected.duration} dk)</dd>
                            <dt className="text-gray-500 font-semibold">Hizmet</dt>
                            <dd className="font-bold text-foreground dark:text-white">{selected.service}</dd>
                            {selected.doctorName && <><dt className="text-gray-500 font-semibold">{staffLabel}</dt><dd className="font-bold text-foreground dark:text-white">{selected.doctorName}</dd></>}
                            {selected.phone && <><dt className="text-gray-500 font-semibold">Telefon</dt><dd className="font-bold text-foreground dark:text-white select-all">{selected.phone}</dd></>}
                            <dt className="text-gray-500 font-semibold">Kaynak</dt>
                            <dd className="font-bold text-foreground dark:text-white">{selected.createdBy === 'business' ? 'İşletme tarafından girildi' : 'Müşteri talebi'}</dd>
                        </dl>

                        {(selected.status === 'pending' || selected.status === 'confirmed') && (
                            <div className="space-y-3">
                                <textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Red veya iptal sebebi (müşteriye iletilir)" aria-label="Sebep" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-semibold text-foreground dark:text-white outline-none focus:border-indigo-500" />
                                <div className="grid grid-cols-2 gap-2">
                                    {selected.status === 'pending' && (
                                        <>
                                            <button disabled={busy} onClick={() => act(() => apiService.updateAppointmentStatus(selected.id, 'confirmed'), 'Randevu onaylandı')} className="py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-black disabled:opacity-50">Onayla</button>
                                            <button disabled={busy} onClick={() => act(() => apiService.updateAppointmentStatus(selected.id, 'rejected', reason), 'Talep reddedildi')} className="py-2.5 rounded-xl border border-rose-300 text-rose-600 text-xs font-black disabled:opacity-50">Reddet</button>
                                        </>
                                    )}
                                    {selected.status === 'confirmed' && (
                                        hasMedicalRecords && !selected.isGuest
                                            ? <Link href="/business/appointments" className="py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-black text-center">Muayene formuna git</Link>
                                            : <button disabled={busy} onClick={() => act(() => apiService.updateAppointmentStatus(selected.id, 'completed'), 'Randevu tamamlandı')} className="py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-black disabled:opacity-50">Tamamlandı</button>
                                    )}
                                    {selected.status === 'confirmed' && (
                                        <button disabled={busy} onClick={() => act(() => apiService.updateAppointmentStatus(selected.id, 'cancelled', reason), 'Randevu iptal edildi')} className="py-2.5 rounded-xl border border-rose-300 text-rose-600 text-xs font-black disabled:opacity-50">İptal et</button>
                                    )}
                                    <button disabled={busy} onClick={() => setReschedule(reschedule ? null : { dateKey: selected.dateKey, time: selected.time, ignoreHours: false })} className="py-2.5 rounded-xl border border-card-border dark:border-[#27272a] text-foreground dark:text-white text-xs font-black col-span-2">
                                        {reschedule ? 'Yeniden planlamayı kapat' : 'Yeniden planla'}
                                    </button>
                                </div>

                                {reschedule && (
                                    <div className="space-y-2 bg-zinc-50 dark:bg-white/5 rounded-xl p-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="date" aria-label="Yeni tarih" value={reschedule.dateKey} onChange={e => setReschedule({ ...reschedule, dateKey: e.target.value })} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-2 text-xs font-bold text-foreground dark:text-white" />
                                            <input type="time" aria-label="Yeni saat" value={reschedule.time} onChange={e => setReschedule({ ...reschedule, time: e.target.value })} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-2 text-xs font-bold text-foreground dark:text-white" />
                                        </div>
                                        <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                                            <input type="checkbox" className="accent-indigo-500" checked={reschedule.ignoreHours} onChange={e => setReschedule({ ...reschedule, ignoreHours: e.target.checked })} />
                                            Mesai dışına izin ver
                                        </label>
                                        <button
                                            disabled={busy || !reschedule.dateKey || !reschedule.time}
                                            onClick={() => act(() => apiService.rescheduleAppointment(selected.id, toWallIso(reschedule.dateKey, reschedule.time), selected.doctorId, reschedule.ignoreHours), 'Randevu yeni saate taşındı, müşteri bilgilendirildi')}
                                            className="w-full py-2.5 rounded-xl bg-foreground dark:bg-white text-background dark:text-black text-xs font-black disabled:opacity-50"
                                        >
                                            Yeni saate taşı
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {(selected.status === 'confirmed' || selected.status === 'completed') && (selected.dateKey < today || (selected.dateKey === today && selected.startMin <= nowMin)) && (
                            <div className="flex items-center justify-between gap-2 border-t border-card-border dark:border-[#27272a] pt-4">
                                <span className="text-xs font-bold text-gray-500">Katılım</span>
                                <div className="flex gap-2">
                                    <button disabled={busy} onClick={() => act(() => apiService.updateAttendanceStatus(selected.id, 'attended'), 'Geldi olarak işaretlendi')} className={cn("px-3 py-1.5 rounded-lg text-xs font-black border", selected.attendance === 'attended' ? "bg-emerald-500 border-emerald-500 text-white" : "border-card-border dark:border-[#27272a] text-gray-600 dark:text-gray-300")}>Geldi</button>
                                    <button disabled={busy} onClick={() => act(() => apiService.updateAttendanceStatus(selected.id, 'no_show'), 'Gelmedi olarak işaretlendi')} className={cn("px-3 py-1.5 rounded-lg text-xs font-black border", selected.attendance === 'no_show' ? "bg-rose-500 border-rose-500 text-white" : "border-card-border dark:border-[#27272a] text-gray-600 dark:text-gray-300")}>Gelmedi</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {user?.id && (
                <NewAppointmentModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onCreated={() => { showToast("Randevu oluşturuldu", "CheckCircle2", "text-emerald-500 font-bold"); load(); }}
                    clinicId={user.id}
                    staffLabel={staffLabel}
                    prefill={prefill}
                />
            )}
        </div>
    );
}
