'use client';

// Kayıp durumu penceresi. Kayıp modu artık tek yerden yönetilir: kayıp ilanı (design-reference/community-final).
// İlan yayınlanınca künye kayıp moduna geçer ve künyede ilandaki not, ödül ve (seçildiyse) telefon görünür;
// kavuşunca ilan kapanır ve künye normale döner. Önceki "Harekat Merkezi"ndeki SMS kişisi, sessiz saatler,
// radar menzili ve konum hassasiyeti hiçbir yerde uygulanmıyordu; kaldırıldı.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { ErrorText, PrimaryButton, Sheet } from '@/components/health/HealthUI';
import { ToggleRow, eventTimeText } from '@/components/lost/LostUI';
import { lostService, type LostListing } from '@/services/lostService';
import { cn } from '@/lib/utils';

interface SOSCommandCenterProps {
    isOpen: boolean;
    onClose: () => void;
    pet: any;
    allPets?: any[];
    onPetChange?: (pet: any) => void;
}

export function SOSCommandCenter({ isOpen, onClose, pet, allPets = [], onPetChange }: SOSCommandCenterProps) {
    const router = useRouter();
    const [listing, setListing] = useState<LostListing | null | undefined>(undefined);
    const [confirm, setConfirm] = useState(false);
    const [thank, setThank] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !pet?.id) return;
        setListing(undefined); setConfirm(false); setError(null);
        lostService.activeForPet(pet.id).then(setListing).catch(() => setListing(null));
    }, [isOpen, pet?.id]);

    if (!pet) return null;

    const go = (href: string) => { onClose(); router.push(href); };

    const reunite = async () => {
        if (!listing) return;
        setBusy(true); setError(null);
        try {
            await lostService.resolve(listing.id, 'reunited', thank);
            go(`/kayip/${listing.id}/kavustuk`);
        } catch (e: any) {
            setError(e?.message || 'İşlem tamamlanamadı.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Sheet open={isOpen} onClose={onClose} title="Kayıp durumu">
            {allPets.length > 1 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
                    {allPets.map(p => (
                        <button key={p.id} onClick={() => onPetChange?.(p)}
                            className={cn('flex items-center gap-2 h-10 pl-1 pr-3 rounded-full border shrink-0 text-sm font-bold',
                                p.id === pet.id ? 'bg-foreground text-background border-foreground' : 'bg-card border-card-border')}>
                            <img src={p.avatar || p.avatar_url || p.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                            {p.name}
                            {p.is_lost && <span className="w-2 h-2 rounded-full bg-red-500" />}
                        </button>
                    ))}
                </div>
            )}

            {listing === undefined ? (
                <div className="h-28 rounded-2xl bg-card border border-card-border animate-pulse" />
            ) : listing ? (
                <div className="bg-card border border-red-200 dark:border-red-500/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                        <div>
                            <div className="text-base font-black">{pet.name} için kayıp ilanı yayında</div>
                            <div className="text-xs font-semibold text-secondary">Kaybolma: {eventTimeText(listing.eventAt)}</div>
                            <div className="text-xs font-semibold text-secondary mt-1">Künye kayıp modunda: okutan kişi ilandaki notu, ödülü ve seçtiysen telefonunu görür.</div>
                        </div>
                    </div>
                    {!confirm ? (
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => go(`/kayip/${listing.id}/yonet`)} className="h-11 rounded-2xl bg-background border border-card-border text-sm font-black">İlanı yönet</button>
                            <button onClick={() => setConfirm(true)} className="h-11 rounded-2xl bg-emerald-600 text-white text-sm font-black">Bulundu, kavuştuk</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm font-semibold">İlan kapanır, yakın çevre bildirimleri durur ve künye normale döner.</p>
                            <div className="bg-background border border-card-border rounded-2xl px-4 py-2">
                                <ToggleRow on={thank} onChange={setThank} label="Yardım edenlere teşekkür gönder" />
                            </div>
                            <ErrorText>{error}</ErrorText>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setConfirm(false)} className="h-11 rounded-2xl bg-background border border-card-border text-sm font-black">Vazgeç</button>
                                <button onClick={reunite} disabled={busy} className="h-11 rounded-2xl bg-emerald-600 text-white text-sm font-black disabled:opacity-50">
                                    {busy ? 'Kaydediliyor…' : 'Evet, kavuştuk'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                        <div>
                            <div className="text-base font-black">{pet.name} güvende</div>
                            <div className="text-xs font-semibold text-secondary">Künye okutulunca sadece adı, türü ve fotoğrafı görünür.</div>
                        </div>
                    </div>
                    <PrimaryButton onClick={() => go(`/kayip/ilan-ver?pet=${pet.id}`)}>Kayıp ilanı ver</PrimaryButton>
                    <p className="text-[11px] font-semibold text-secondary">İlanı yayınlayınca künye kayıp moduna geçer ve yakın çevrede bildirimi açanlara haber gider.</p>
                </div>
            )}

            <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                <Link href="/health/acil" onClick={onClose} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <span>
                        <span className="block text-sm font-black">Acil bilgiler</span>
                        <span className="block text-xs font-semibold text-secondary">Alerji, ilaç ve sağlık notunun künyede görünüp görünmeyeceği</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                </Link>
                <Link href="/kayip" onClick={onClose} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <span>
                        <span className="block text-sm font-black">Yakınımdaki kayıp ilanları</span>
                        <span className="block text-xs font-semibold text-secondary">Yakın çevre bildirimlerini de buradan açıp kapatırsın</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                </Link>
            </div>
        </Sheet>
    );
}
