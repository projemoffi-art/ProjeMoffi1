'use client';

// Künye (/id) ve karne doğrulama (/verify) ekranlarında sahibin açtığı acil bilgiler.
// Sahip "Acil Bilgiler" ekranında o yer için kapalı bıraktıysa hiçbir şey göstermez.

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Info { allergies: string[]; chronic_conditions: string[]; medications: string[]; blood_type: string | null; vet_name: string | null; vet_phone: string | null }

export function EmergencyInfoCard({ petId, context }: { petId: string; context: 'lost' | 'qr' }) {
    const [info, setInfo] = useState<Info | null>(null);

    useEffect(() => {
        let alive = true;
        supabase.rpc('get_public_emergency_info', { p_pet_id: petId, p_context: context })
            .then(({ data }) => { if (alive) setInfo((Array.isArray(data) ? data[0] : data) || null); });
        return () => { alive = false; };
    }, [petId, context]);

    if (!info) return null;
    const rows = [
        info.allergies?.length ? ['Alerjiler', info.allergies.join(', ')] : null,
        info.chronic_conditions?.length ? ['Kronik hastalık', info.chronic_conditions.join(', ')] : null,
        info.medications?.length ? ['Kullandığı ilaçlar', info.medications.join(', ')] : null,
        info.blood_type ? ['Kan grubu', info.blood_type] : null,
        info.vet_name ? ['Veterineri', info.vet_name] : null,
    ].filter(Boolean) as [string, string][];
    if (rows.length === 0 && !info.vet_phone) return null;

    return (
        <div className="w-full rounded-3xl border border-red-200 bg-red-50 p-5 text-left">
            <div className="text-sm font-black text-red-700 mb-2">Acil sağlık bilgileri</div>
            <dl className="space-y-1.5">
                {rows.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 text-sm">
                        <dt className="font-bold text-red-900/80">{k}</dt>
                        <dd className="font-semibold text-red-900 text-right">{v}</dd>
                    </div>
                ))}
            </dl>
            {info.vet_phone && (
                <a href={`tel:${info.vet_phone.replace(/\s/g, '')}`} className="mt-3 flex h-11 items-center justify-center rounded-2xl bg-red-600 text-white text-sm font-black">
                    Veterinerini ara
                </a>
            )}
        </div>
    );
}
