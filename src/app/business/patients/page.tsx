"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, PawPrint, Loader2, Plus, X } from "lucide-react";
import { apiService } from "@/services/apiService";
import type { ClinicClient } from "@/services/types";
import { useBusinessType, useActiveBusiness } from "@/context/BusinessTypeContext";
import { cn, showToast } from "@/lib/utils";
import { wallParts, formatDateKeyTr } from "@/lib/appointmentTime";
import { NewAppointmentModal } from "@/components/business/NewAppointmentModal";

const SPECIES_LABEL: Record<string, string> = { dog: 'Köpek', cat: 'Kedi', bird: 'Kuş', rabbit: 'Tavşan', other: 'Diğer' };
const STATUS_LABEL: Record<string, string> = { pending: 'Onay bekliyor', confirmed: 'Onaylı', completed: 'Tamamlandı', cancelled: 'İptal', rejected: 'Reddedildi' };

function formatWall(iso: string | null) {
    if (!iso) return null;
    const w = wallParts(iso);
    return `${formatDateKeyTr(w.dateKey, { day: 'numeric', month: 'short', year: 'numeric' })} ${w.time}`;
}

export default function BusinessPatientsPage() {
    const { businessId } = useActiveBusiness();
    const { hasMedicalRecords, staffLabel } = useBusinessType();
    const [clients, setClients] = useState<ClinicClient[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<'all' | 'moffi' | 'guest' | 'noshow'>('all');
    const [selected, setSelected] = useState<ClinicClient | null>(null);
    const [noteDraft, setNoteDraft] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const load = useCallback(async () => {
        if (!businessId) return;
        try {
            const [clientList, apptList] = await Promise.all([
                apiService.getClinicClients(),
                apiService.getClinicAppointments(businessId)
            ]);
            setClients(clientList);
            setAppointments(apptList || []);
        } finally {
            setIsLoading(false);
        }
    }, [businessId]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
        return clients
            .filter(c => filter === 'all' || (filter === 'noshow' ? c.no_show_count > 0 : c.kind === filter))
            .filter(c => !q || [c.owner_name, c.pet_name, c.phone, c.breed].some(v => (v || '').toLocaleLowerCase('tr-TR').includes(q)))
            .sort((a, b) => (b.next_visit || b.last_visit || '').localeCompare(a.next_visit || a.last_visit || ''));
    }, [clients, searchQuery, filter]);

    const history = useMemo(() => {
        if (!selected) return [];
        return appointments
            .filter(a => selected.kind === 'moffi'
                ? a.user_id === selected.owner_id && (a.pet_id || null) === (selected.pet_id || null)
                : !a.user_id && a.unclaimed_patient_id === selected.client_key.replace('guest:', ''))
            .sort((a, b) => (b.appointment_date || '').localeCompare(a.appointment_date || ''));
    }, [selected, appointments]);

    const openClient = (c: ClinicClient) => {
        setSelected(c);
        setNoteDraft(c.note || "");
    };

    const saveNote = async () => {
        if (!selected || !businessId) return;
        setSavingNote(true);
        try {
            await apiService.saveClientNote(businessId, selected.client_key, noteDraft.trim());
            setClients(prev => prev.map(c => c.client_key === selected.client_key ? { ...c, note: noteDraft.trim() } : c));
            showToast("Not kaydedildi", "CheckCircle2", "text-emerald-500 font-bold");
        } catch {
            showToast("Not kaydedilemedi", "AlertCircle", "text-rose-500 font-bold");
        } finally {
            setSavingNote(false);
        }
    };

    const title = hasMedicalRecords ? 'Hastalarım' : 'Müşterilerim';

    return (
        <div className="p-4 md:p-8 font-sans w-full max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground dark:text-white flex items-center gap-2">
                        <PawPrint className="w-6 h-6 text-indigo-500" />
                        {title}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Randevu aldığı ya da senin eklediğin tüm müşteriler. Moffi dışı müşteriler Veri Taşıma listesinden de gelir.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        aria-label="Müşteri ara"
                        placeholder="İsim, evcil hayvan, telefon veya ırk ara"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 dark:text-white"
                    />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {([['all', 'Tümü'], ['moffi', 'Moffi üyeleri'], ['guest', 'Moffi dışı'], ['noshow', 'Gelmeyenler']] as const).map(([k, l]) => (
                        <button key={k} onClick={() => setFilter(k)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border", filter === k ? "bg-foreground text-background border-foreground dark:bg-white dark:text-black" : "border-zinc-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300")}>{l}</button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-12 flex justify-center text-indigo-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        <PawPrint className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>{clients.length === 0 ? 'Henüz müşterin yok. İlk randevu geldiğinde burada görünecek.' : 'Aramana uygun müşteri bulunamadı.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50/80 dark:bg-white/5 border-b border-zinc-200 dark:border-zinc-800/80">
                                <tr>
                                    <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Evcil hayvan</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Sahibi</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Son ziyaret</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Sıradaki</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Ziyaret</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                                {filtered.map(c => (
                                    <tr key={c.client_key} onClick={() => openClient(c)} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden">
                                                    {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" /> : (c.pet_name || c.owner_name || '?').charAt(0).toLocaleUpperCase('tr-TR')}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-foreground dark:text-white flex items-center gap-2">
                                                        {c.pet_name || 'Belirtilmedi'}
                                                        {c.kind === 'guest' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300">Moffi dışı</span>}
                                                        {c.no_show_count > 0 && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">{c.no_show_count} gelmedi</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{[SPECIES_LABEL[c.species || ''] || c.species, c.breed].filter(Boolean).join(' · ') || '—'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                                            <div className="font-medium">{c.owner_name || '—'}</div>
                                            <div className="text-xs text-gray-400">{c.phone || ''}</div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300 tabular-nums">{formatWall(c.last_visit) || <span className="text-gray-400">—</span>}</td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300 tabular-nums">{formatWall(c.next_visit) || <span className="text-gray-400">—</span>}</td>
                                        <td className="py-3 px-4 text-right font-bold text-foreground dark:text-white tabular-nums">{c.visit_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selected && (
                <div className="fixed inset-0 z-[3000] bg-black/40 flex justify-end" onClick={() => setSelected(null)}>
                    <div onClick={e => e.stopPropagation()} className="w-full max-w-md h-full overflow-y-auto bg-card dark:bg-[#121212] border-l border-card-border dark:border-[#27272a] p-6 space-y-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-black text-foreground dark:text-white">{selected.pet_name || 'Evcil hayvan belirtilmedi'}</h2>
                                <p className="text-sm text-gray-500 font-semibold">{selected.owner_name}{selected.kind === 'guest' && ' · Moffi dışı'}</p>
                                {selected.phone && <p className="text-sm text-foreground dark:text-white font-bold mt-1 select-all">{selected.phone}</p>}
                            </div>
                            <button onClick={() => setSelected(null)} aria-label="Kapat" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-zinc-100 dark:hover:bg-white/10"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                            {[['Tamamlanan', selected.visit_count], ['Gelmedi', selected.no_show_count], ['Toplam kayıt', history.length]].map(([l, v]) => (
                                <div key={l as string} className="bg-zinc-50 dark:bg-white/5 rounded-xl py-3">
                                    <div className="text-lg font-black text-foreground dark:text-white tabular-nums">{v}</div>
                                    <div className="text-[11px] font-bold text-gray-500">{l}</div>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => setModalOpen(true)} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-black">
                            <Plus className="w-4 h-4" /> Bu müşteriye randevu oluştur
                        </button>

                        <div>
                            <label htmlFor="client-note" className="text-sm font-black text-foreground dark:text-white block mb-2">Özel not</label>
                            <p className="text-[11px] text-gray-500 font-medium mb-2">Sadece işletmen görür. Örn: &quot;Veteriner masasında ürkek, ağızlık gerekli&quot;.</p>
                            <textarea id="client-note" rows={3} value={noteDraft} onChange={e => setNoteDraft(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-semibold text-foreground dark:text-white outline-none focus:border-indigo-500" />
                            <button onClick={saveNote} disabled={savingNote || noteDraft.trim() === (selected.note || '')} className="mt-2 px-4 py-2 rounded-xl bg-foreground dark:bg-white text-background dark:text-black text-xs font-black disabled:opacity-40">
                                {savingNote ? 'Kaydediliyor…' : 'Notu kaydet'}
                            </button>
                        </div>

                        <div>
                            <h3 className="text-sm font-black text-foreground dark:text-white mb-2">Randevu geçmişi</h3>
                            {history.length === 0 ? (
                                <p className="text-xs text-gray-500 font-medium">Henüz randevu yok.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {history.map(a => (
                                        <li key={a.id} className="bg-zinc-50 dark:bg-white/5 rounded-xl px-3 py-2.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-black text-foreground dark:text-white tabular-nums">{formatWall(a.appointment_date)}</span>
                                                <span className="text-[10px] font-bold text-gray-500">{STATUS_LABEL[a.status] || a.status}{a.attendance_status === 'no_show' && ' · Gelmedi'}</span>
                                            </div>
                                            <div className="text-[11px] font-semibold text-gray-500 mt-0.5">
                                                {(a.reason || '').split('\n')[0].replace('Randevu tipi:', '').trim() || 'Randevu'}
                                                {(a.doctor?.name || a.doctor_name) && ` · ${staffLabel} ${a.doctor?.name || a.doctor_name}`}
                                            </div>
                                            {a.status_reason && <div className="text-[11px] text-gray-500 mt-0.5">Sebep: {a.status_reason}</div>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {businessId && (
                <NewAppointmentModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onCreated={() => { showToast("Randevu oluşturuldu", "CheckCircle2", "text-emerald-500 font-bold"); load(); }}
                    clinicId={businessId}
                    staffLabel={staffLabel}
                    prefill={{ client: selected }}
                />
            )}
        </div>
    );
}
