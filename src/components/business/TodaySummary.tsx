"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiService } from "@/services/apiService";
import { supabase } from "@/lib/supabase";
import { wallParts, todayKey } from "@/lib/appointmentTime";
import { cn } from "@/lib/utils";

type Item = { id: string; time: string; minutes: number; status: string; owner: string; pet: string | null; service: string };

// İşletme sabah paneli açtığında ilk göreceği özet: bugünkü randevular, bekleyen talepler, sıradaki.
export function TodaySummary({ clinicId }: { clinicId: string }) {
    const [items, setItems] = useState<Item[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const load = async () => {
            const list = await apiService.getClinicAppointments(clinicId);
            const today = todayKey();
            setPendingCount((list || []).filter((a: any) => a.status === 'pending').length);
            setItems((list || [])
                .filter((a: any) => a.appointment_date && ['pending', 'confirmed', 'completed'].includes(a.status))
                .map((a: any) => ({ a, w: wallParts(a.appointment_date) }))
                .filter(({ w }) => w.dateKey === today)
                .map(({ a, w }) => ({
                    id: a.id,
                    time: w.time,
                    minutes: w.minutes,
                    status: a.status,
                    owner: a.user?.full_name || a.user?.username || a.guest_name || 'Müşteri',
                    pet: a.pet?.name || a.guest_pet_name || null,
                    service: ((a.reason || '').split('\n')[0].replace('Randevu tipi:', '').trim()) || 'Randevu'
                }))
                .sort((x, y) => x.minutes - y.minutes));
            setLoaded(true);
        };
        load();
        const channel = supabase
            .channel(`today-summary-${clinicId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `clinic_id=eq.${clinicId}` }, () => load())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [clinicId]);

    if (!loaded) return null;

    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const next = items.find(i => i.status === 'confirmed' && i.minutes >= nowMin);

    return (
        <section className="bg-card border border-card-border dark:border-[#27272a] rounded-3xl p-5 md:p-6 mb-8">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-lg font-black text-foreground dark:text-white">Bugün</h2>
                    <p className="text-sm text-gray-500 font-medium">
                        {items.length} randevu{next ? ` · sıradaki ${next.time} ${next.owner}` : items.length > 0 ? ' · bugünlük sıradaki randevu yok' : ''}
                    </p>
                </div>
                <div className="flex gap-2">
                    {pendingCount > 0 && (
                        <Link href="/business/calendar" className="px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200 text-xs font-black">
                            {pendingCount} talep onay bekliyor
                        </Link>
                    )}
                    <Link href="/business/calendar" className="px-3 py-2 rounded-xl border border-card-border dark:border-[#27272a] text-xs font-black text-foreground dark:text-white">Takvime git</Link>
                </div>
            </div>
            {items.length === 0 ? (
                <p className="text-sm text-gray-500 font-medium">Bugün için randevu yok.</p>
            ) : (
                <ul className="divide-y divide-card-border dark:divide-[#27272a]">
                    {items.slice(0, 8).map(i => (
                        <li key={i.id} className={cn("flex items-center gap-4 py-2.5", i.status === 'completed' && "opacity-50")}>
                            <span className="w-12 text-sm font-black tabular-nums text-foreground dark:text-white">{i.time}</span>
                            <span className="flex-1 min-w-0 text-sm font-semibold text-foreground dark:text-white truncate">
                                {i.owner}{i.pet && <span className="text-gray-500 font-medium"> · {i.pet}</span>}
                                <span className="text-gray-500 font-medium"> · {i.service}</span>
                            </span>
                            <span className={cn("text-[10px] font-black px-2 py-1 rounded-md shrink-0",
                                i.status === 'pending' ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                                    : i.status === 'confirmed' ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200"
                                        : "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300")}>
                                {i.status === 'pending' ? 'Onay bekliyor' : i.status === 'confirmed' ? 'Onaylı' : 'Tamamlandı'}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
