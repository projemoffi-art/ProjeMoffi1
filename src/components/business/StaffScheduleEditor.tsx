"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, Trash2 } from "lucide-react";

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type DayHours = { open: string; close: string; closed: boolean };

const DAYS: [DayKey, string][] = [
    ['monday', 'Pazartesi'], ['tuesday', 'Salı'], ['wednesday', 'Çarşamba'], ['thursday', 'Perşembe'],
    ['friday', 'Cuma'], ['saturday', 'Cumartesi'], ['sunday', 'Pazar']
];

const defaultWeek = (): Record<DayKey, DayHours> =>
    Object.fromEntries(DAYS.map(([key]) => [key, { open: '09:00', close: '18:00', closed: key === 'sunday' }])) as Record<DayKey, DayHours>;

interface Props {
    doctorId: string;
    clinicId: string;
    staffLabel: string;
}

// Personel saatleri boşsa (null) işletmenin genel saatleri geçerlidir; sunucu tarafında
// find_slot_doctor bu saatleri ve izin günlerini randevu uygunluğunda kullanır.
export function StaffScheduleEditor({ doctorId, clinicId, staffLabel }: Props) {
    const [useCustom, setUseCustom] = useState(false);
    const [week, setWeek] = useState<Record<DayKey, DayHours>>(defaultWeek);
    const [timeOff, setTimeOff] = useState<{ id: string; off_date: string; note: string | null }[]>([]);
    const [newOffDate, setNewOffDate] = useState("");
    const [newOffNote, setNewOffNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

    const loadTimeOff = async () => {
        const today = new Date().toLocaleDateString('sv-SE');
        const { data } = await supabase
            .from('doctor_time_off')
            .select('id, off_date, note')
            .eq('doctor_id', doctorId)
            .gte('off_date', today)
            .order('off_date');
        setTimeOff(data || []);
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data } = await supabase.from('doctors').select('working_hours').eq('id', doctorId).maybeSingle();
            if (data?.working_hours) {
                setUseCustom(true);
                setWeek({ ...defaultWeek(), ...data.working_hours });
            }
            await loadTimeOff();
            setLoading(false);
        };
        load();
    }, [doctorId]);

    const flash = (type: 'ok' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const saveHours = async () => {
        for (const [key, label] of DAYS) {
            const d = week[key];
            if (useCustom && !d.closed && d.open >= d.close) {
                flash('error', `${label}: kapanış saati açılıştan sonra olmalı.`);
                return;
            }
        }
        setSaving(true);
        const { error } = await supabase
            .from('doctors')
            .update({ working_hours: useCustom ? week : null })
            .eq('id', doctorId);
        setSaving(false);
        if (error) flash('error', 'Çalışma saatleri kaydedilemedi.');
        else flash('ok', 'Çalışma saatleri kaydedildi.');
    };

    const addTimeOff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOffDate) return;
        const { error } = await supabase.from('doctor_time_off').insert({
            doctor_id: doctorId,
            clinic_id: clinicId,
            off_date: newOffDate,
            note: newOffNote.trim() || null
        });
        if (error) {
            flash('error', error.code === '23505' ? 'Bu tarih zaten izinli olarak işaretli.' : 'İzin günü eklenemedi.');
            return;
        }
        setNewOffDate("");
        setNewOffNote("");
        await loadTimeOff();
        flash('ok', 'İzin günü eklendi. O gün bu kişiye randevu verilmeyecek.');
    };

    const removeTimeOff = async (id: string) => {
        const { error } = await supabase.from('doctor_time_off').delete().eq('id', id);
        if (error) flash('error', 'İzin günü silinemedi.');
        else setTimeOff(prev => prev.filter(t => t.id !== id));
    };

    if (loading) {
        return <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
    }

    const inputCls = "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-xs font-bold text-foreground dark:text-white outline-none focus:border-indigo-500";

    return (
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-6">
            <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-black text-foreground dark:text-white">Çalışma saatleri</h3>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 cursor-pointer">
                        <input type="checkbox" checked={useCustom} onChange={e => setUseCustom(e.target.checked)} className="accent-indigo-500" />
                        Özel saatler kullan
                    </label>
                </div>
                {!useCustom ? (
                    <p className="text-xs text-gray-500 font-medium">Bu {staffLabel.toLocaleLowerCase('tr-TR')} işletmenin genel çalışma saatlerine göre randevu alır.</p>
                ) : (
                    <div className="space-y-2">
                        {DAYS.map(([key, label]) => {
                            const d = week[key];
                            return (
                                <div key={key} className="flex flex-wrap items-center gap-2">
                                    <span className="w-20 text-xs font-bold text-gray-600 dark:text-gray-300">{label}</span>
                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                                        <input
                                            type="checkbox"
                                            checked={d.closed}
                                            onChange={e => setWeek(prev => ({ ...prev, [key]: { ...prev[key], closed: e.target.checked } }))}
                                            className="accent-indigo-500"
                                        />
                                        Çalışmıyor
                                    </label>
                                    {!d.closed && (
                                        <>
                                            <input type="time" aria-label={`${label} başlangıç`} value={d.open} onChange={e => setWeek(prev => ({ ...prev, [key]: { ...prev[key], open: e.target.value } }))} className={inputCls} />
                                            <span className="text-xs text-gray-400">–</span>
                                            <input type="time" aria-label={`${label} bitiş`} value={d.close} onChange={e => setWeek(prev => ({ ...prev, [key]: { ...prev[key], close: e.target.value } }))} className={inputCls} />
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                <button
                    onClick={saveHours}
                    disabled={saving}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground dark:bg-white text-background dark:text-black text-xs font-black disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Saatleri kaydet
                </button>
            </div>

            <div>
                <h3 className="text-sm font-black text-foreground dark:text-white mb-3">İzin günleri</h3>
                <form onSubmit={addTimeOff} className="flex flex-wrap items-center gap-2 mb-3">
                    <input
                        type="date"
                        aria-label="İzin tarihi"
                        min={new Date().toLocaleDateString('sv-SE')}
                        value={newOffDate}
                        onChange={e => setNewOffDate(e.target.value)}
                        className={inputCls}
                        required
                    />
                    <input
                        type="text"
                        aria-label="İzin notu"
                        placeholder="Not (opsiyonel)"
                        value={newOffNote}
                        onChange={e => setNewOffNote(e.target.value)}
                        className={`${inputCls} flex-1 min-w-[120px]`}
                    />
                    <button type="submit" disabled={!newOffDate} className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-black disabled:opacity-50">
                        İzin ekle
                    </button>
                </form>
                {timeOff.length === 0 ? (
                    <p className="text-xs text-gray-500 font-medium">Planlanmış izin yok.</p>
                ) : (
                    <ul className="space-y-1.5">
                        {timeOff.map(t => (
                            <li key={t.id} className="flex items-center justify-between gap-2 text-xs font-bold text-foreground dark:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2">
                                <span>
                                    {new Date(`${t.off_date}T00:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' })}
                                    {t.note && <span className="text-gray-500 font-medium"> · {t.note}</span>}
                                </span>
                                <button onClick={() => removeTimeOff(t.id)} aria-label="İzni kaldır" className="text-gray-400 hover:text-rose-500">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {message && (
                <p className={`text-xs font-bold ${message.type === 'ok' ? 'text-emerald-600' : 'text-rose-500'}`}>{message.text}</p>
            )}
        </div>
    );
}
