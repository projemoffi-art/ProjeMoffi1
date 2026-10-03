"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { apiService } from "@/services/apiService";
import type { ClinicClient } from "@/services/types";
import { toWallIso, todayKey } from "@/lib/appointmentTime";
import { cn } from "@/lib/utils";

export interface NewAppointmentPrefill {
    dateKey?: string;
    time?: string;
    doctorId?: string | null;
    client?: ClinicClient | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    clinicId: string;
    staffLabel: string;
    prefill?: NewAppointmentPrefill;
}

const inputCls = "w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground dark:text-white outline-none focus:border-indigo-500";
const labelCls = "text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 block";

// İşletmenin telefonla ya da kapıdan gelen müşteri için randevu girdiği pencere.
// Uygunluk ve personel ataması sunucudaki create_business_appointment içinde yapılır.
export function NewAppointmentModal({ isOpen, onClose, onCreated, clinicId, staffLabel, prefill }: Props) {
    const [mode, setMode] = useState<'existing' | 'guest'>('existing');
    const [clients, setClients] = useState<ClinicClient[]>([]);
    const [clientQuery, setClientQuery] = useState("");
    const [clientKey, setClientKey] = useState<string | null>(null);
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [guestPetName, setGuestPetName] = useState("");
    const [guestPetSpecies, setGuestPetSpecies] = useState("");
    const [services, setServices] = useState<{ service_name: string; duration_minutes: number | null; price: number | null }[]>([]);
    const [serviceName, setServiceName] = useState("");
    const [duration, setDuration] = useState(30);
    const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
    const [doctorId, setDoctorId] = useState<string>("");
    const [dateKey, setDateKey] = useState(todayKey());
    const [time, setTime] = useState("");
    const [slots, setSlots] = useState<{ slot_time: string; available: boolean }[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [ignoreHours, setIgnoreHours] = useState(false);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setNotes("");
        setDateKey(prefill?.dateKey || todayKey());
        setTime(prefill?.time || "");
        setDoctorId(prefill?.doctorId || "");
        setIgnoreHours(false);
        if (prefill?.client) {
            if (prefill.client.kind === 'moffi') {
                setMode('existing');
                setClientKey(prefill.client.client_key);
            } else {
                setMode('guest');
                setClientKey(null);
                setGuestName(prefill.client.owner_name || "");
                setGuestPhone(prefill.client.phone || "");
                setGuestPetName(prefill.client.pet_name || "");
                setGuestPetSpecies(prefill.client.species || "");
            }
        } else {
            setMode('existing');
            setClientKey(null);
            setGuestName(""); setGuestPhone(""); setGuestPetName(""); setGuestPetSpecies("");
        }

        const load = async () => {
            const [clientList, serviceList, doctorList] = await Promise.all([
                apiService.getClinicClients(),
                apiService.getClinicServices(clinicId),
                apiService.getAllClinicDoctors(clinicId)
            ]);
            setClients(clientList.filter(c => c.kind === 'moffi'));
            setServices(serviceList || []);
            setDoctors((doctorList || []).filter(d => d.is_active !== false).map(d => ({ id: d.id, name: d.name })));
            if (serviceList?.length) {
                setServiceName(serviceList[0].service_name);
                setDuration(serviceList[0].duration_minutes || 30);
            } else {
                setServiceName("");
                setDuration(30);
            }
        };
        load().catch(err => {
            console.error("New appointment form could not load:", err);
            setError("Form verileri yüklenemedi.");
        });
    }, [isOpen, clinicId]);

    useEffect(() => {
        if (!isOpen || ignoreHours || !dateKey) return;
        let cancelled = false;
        setSlotsLoading(true);
        apiService.getAvailableSlots(clinicId, dateKey, duration, doctorId || null)
            .then(list => {
                if (cancelled) return;
                setSlots(list);
                setTime(prev => (prev && list.some(s => s.slot_time === prev && s.available)) ? prev : "");
            })
            .catch(err => { if (!cancelled) { console.error(err); setSlots([]); } })
            .finally(() => { if (!cancelled) setSlotsLoading(false); });
        return () => { cancelled = true; };
    }, [isOpen, clinicId, dateKey, duration, doctorId, ignoreHours]);

    const filteredClients = useMemo(() => {
        const q = clientQuery.trim().toLocaleLowerCase('tr-TR');
        if (!q) return clients.slice(0, 30);
        return clients.filter(c =>
            (c.owner_name || '').toLocaleLowerCase('tr-TR').includes(q) ||
            (c.pet_name || '').toLocaleLowerCase('tr-TR').includes(q) ||
            (c.phone || '').includes(q)
        ).slice(0, 30);
    }, [clients, clientQuery]);

    const selectedClient = clients.find(c => c.client_key === clientKey) || null;

    const canSubmit = !!time && !!serviceName.trim() && (
        mode === 'existing' ? !!selectedClient : (guestName.trim().length > 1 && guestPhone.replace(/\D/g, '').length >= 10)
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);
        try {
            await apiService.createBusinessAppointment({
                start: toWallIso(dateKey, time),
                durationMinutes: duration,
                serviceName: serviceName.trim(),
                doctorId: doctorId || null,
                userId: mode === 'existing' ? selectedClient?.owner_id : null,
                petId: mode === 'existing' ? selectedClient?.pet_id : null,
                guestName: mode === 'guest' ? guestName.trim() : null,
                guestPhone: mode === 'guest' ? guestPhone.trim() : null,
                guestPetName: mode === 'guest' ? guestPetName.trim() : null,
                guestPetSpecies: mode === 'guest' ? guestPetSpecies.trim() : null,
                notes: notes.trim() || null,
                ignoreHours
            });
            onCreated();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Randevu oluşturulamadı.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[3100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={onClose}
                >
                    <motion.form
                        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        onSubmit={handleSubmit}
                        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-card dark:bg-[#121212] border border-card-border dark:border-[#27272a] rounded-t-3xl sm:rounded-3xl p-6 space-y-5"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-foreground dark:text-white">Yeni randevu</h2>
                            <button type="button" onClick={onClose} aria-label="Kapat" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-zinc-100 dark:hover:bg-white/10">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-white/5 rounded-xl">
                            {([['existing', 'Kayıtlı müşteri'], ['guest', 'Yeni / Moffi dışı']] as const).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setMode(key)}
                                    className={cn("py-2 rounded-lg text-xs font-black transition-colors", mode === key ? "bg-card dark:bg-zinc-800 text-foreground dark:text-white shadow-sm" : "text-gray-500")}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {mode === 'existing' ? (
                            <div>
                                <label className={labelCls} htmlFor="na-client-search">Müşteri</label>
                                <input id="na-client-search" className={inputCls} placeholder="İsim, evcil hayvan veya telefon ara" value={clientQuery} onChange={e => setClientQuery(e.target.value)} />
                                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                                    {filteredClients.length === 0 ? (
                                        <p className="text-xs text-gray-500 font-medium py-2">Kayıtlı müşteri bulunamadı. Moffi dışı müşteri için diğer sekmeyi kullan.</p>
                                    ) : filteredClients.map(c => (
                                        <button
                                            key={c.client_key}
                                            type="button"
                                            onClick={() => setClientKey(c.client_key)}
                                            className={cn("w-full text-left px-3 py-2 rounded-lg text-xs font-bold border transition-colors",
                                                clientKey === c.client_key ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-foreground dark:text-white" : "border-transparent hover:bg-zinc-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300")}
                                        >
                                            {c.owner_name || 'İsimsiz'}{c.pet_name && <span className="text-gray-500 font-medium"> · {c.pet_name}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className={labelCls} htmlFor="na-guest-name">Müşteri adı</label>
                                    <input id="na-guest-name" className={inputCls} value={guestName} onChange={e => setGuestName(e.target.value)} required />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className={labelCls} htmlFor="na-guest-phone">Telefon</label>
                                    <input id="na-guest-phone" type="tel" className={inputCls} placeholder="05xx xxx xx xx" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} required />
                                </div>
                                <div>
                                    <label className={labelCls} htmlFor="na-guest-pet">Evcil hayvan adı</label>
                                    <input id="na-guest-pet" className={inputCls} value={guestPetName} onChange={e => setGuestPetName(e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelCls} htmlFor="na-guest-species">Tür</label>
                                    <select id="na-guest-species" className={inputCls} value={guestPetSpecies} onChange={e => setGuestPetSpecies(e.target.value)}>
                                        <option value="">Seç</option>
                                        <option value="dog">Köpek</option>
                                        <option value="cat">Kedi</option>
                                        <option value="other">Diğer</option>
                                    </select>
                                </div>
                                <p className="col-span-2 text-[11px] text-gray-500 font-medium">Müşteri Veri Taşıma listene eklenir; Moffi&apos;ye katılıp hesabını eşleştirdiğinde randevu geçmişi hesabına taşınır.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <label className={labelCls} htmlFor="na-service">Hizmet</label>
                                {services.length > 0 ? (
                                    <select
                                        id="na-service"
                                        className={inputCls}
                                        value={serviceName}
                                        onChange={e => {
                                            const svc = services.find(s => s.service_name === e.target.value);
                                            setServiceName(e.target.value);
                                            if (svc) setDuration(svc.duration_minutes || 30);
                                        }}
                                    >
                                        {services.map(s => <option key={s.service_name} value={s.service_name}>{s.service_name}</option>)}
                                    </select>
                                ) : (
                                    <input id="na-service" className={inputCls} placeholder="Örn: Kontrol" value={serviceName} onChange={e => setServiceName(e.target.value)} />
                                )}
                            </div>
                            <div>
                                <label className={labelCls} htmlFor="na-duration">Süre (dk)</label>
                                <input id="na-duration" type="number" min={5} max={480} className={inputCls} value={duration} onChange={e => setDuration(Math.min(Math.max(parseInt(e.target.value) || 30, 5), 480))} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls} htmlFor="na-date">Tarih</label>
                                <input id="na-date" type="date" className={inputCls} value={dateKey} min={ignoreHours ? undefined : todayKey()} onChange={e => setDateKey(e.target.value)} />
                            </div>
                            {doctors.length > 0 && (
                                <div>
                                    <label className={labelCls} htmlFor="na-doctor">{staffLabel}</label>
                                    <select id="na-doctor" className={inputCls} value={doctorId} onChange={e => setDoctorId(e.target.value)}>
                                        <option value="">Otomatik ata</option>
                                        {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className={labelCls + " mb-0"}>Saat</span>
                                <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 cursor-pointer">
                                    <input type="checkbox" className="accent-indigo-500" checked={ignoreHours} onChange={e => { setIgnoreHours(e.target.checked); setTime(""); }} />
                                    Mesai dışı / acil
                                </label>
                            </div>
                            {ignoreHours ? (
                                <input type="time" aria-label="Saat" className={inputCls} value={time} onChange={e => setTime(e.target.value)} />
                            ) : slotsLoading ? (
                                <div className="py-3 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
                            ) : slots.filter(s => s.available).length === 0 ? (
                                <p className="text-xs text-gray-500 font-medium py-2">Bu gün için uygun saat yok. Başka bir gün seç ya da acil kaydı işaretle.</p>
                            ) : (
                                <div className="grid grid-cols-4 gap-1.5">
                                    {slots.map(s => (
                                        <button
                                            key={s.slot_time}
                                            type="button"
                                            disabled={!s.available}
                                            onClick={() => setTime(s.slot_time)}
                                            className={cn("py-2 rounded-lg text-xs font-bold border tabular-nums transition-colors",
                                                !s.available ? "opacity-40 line-through border-transparent bg-zinc-100 dark:bg-white/5 text-gray-400"
                                                    : time === s.slot_time ? "bg-indigo-500 border-indigo-500 text-white"
                                                        : "border-zinc-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:border-indigo-400")}
                                        >
                                            {s.slot_time}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {ignoreHours && <p className="text-[11px] text-gray-500 font-medium mt-1.5">Çalışma saati ve izin kontrolü atlanır, yalnızca başka randevuyla çakışma engellenir.</p>}
                        </div>

                        <div>
                            <label className={labelCls} htmlFor="na-notes">Not (opsiyonel)</label>
                            <textarea id="na-notes" rows={2} className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>

                        {error && <p className="text-xs font-bold text-rose-500">{error}</p>}

                        <button
                            type="submit"
                            disabled={!canSubmit || submitting}
                            className="w-full py-3.5 rounded-xl bg-indigo-500 text-white text-sm font-black disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Randevuyu oluştur
                        </button>
                    </motion.form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
