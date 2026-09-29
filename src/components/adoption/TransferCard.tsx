'use client';

// Sahiplendirme sonrası pasaport devri: yeni sahip kabul ederse hayvan (aşı, muayene, kilo geçmişiyle) hesabına geçer.

import React, { useState } from 'react';
import { adoptionService, type PetTransfer } from '@/services/adoptionService';
import { showToast } from '@/lib/utils';

export function TransferCard({ transfer, petName, onDone }: { transfer: PetTransfer; petName: string; onDone: () => void }) {
    const [busy, setBusy] = useState(false);
    if (transfer.status === 'accepted') {
        return <div className="rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/25 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-200">Pasaport devri tamamlandı: {petName} artık senin hesabında.</div>;
    }
    if (transfer.status !== 'pending' || new Date(transfer.expiresAt).getTime() < Date.now()) return null;
    const respond = async (accept: boolean) => {
        setBusy(true);
        try {
            await adoptionService.respondTransfer(transfer.id, accept);
            showToast(accept ? `${petName} pasaportuyla birlikte hesabına geçti.` : 'Devri reddettin.', 'CheckCircle2', 'text-emerald-500 font-bold');
            onDone();
        } catch (e: any) {
            showToast(e?.message || 'İşlem tamamlanamadı.', 'AlertCircle', 'text-red-500 font-bold');
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3 space-y-2">
            <div className="text-sm font-black">Pasaport devri: {petName}</div>
            <p className="text-xs font-semibold text-secondary">
                Kabul edersen aşı, muayene ve kilo geçmişiyle birlikte pasaport senin hesabına geçer. Eski sahibin iletişim bilgileri ve paylaşım bağlantıları kaldırılır.
            </p>
            <div className="grid grid-cols-2 gap-2">
                <button disabled={busy} onClick={() => respond(false)} className="h-10 rounded-xl bg-card border border-card-border text-xs font-black">Reddet</button>
                <button disabled={busy} onClick={() => respond(true)} className="h-10 rounded-xl bg-accent text-white text-xs font-black">{busy ? '…' : 'Kabul et'}</button>
            </div>
        </div>
    );
}
