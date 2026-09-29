'use client';

// Referans Ekran 11 — Başvurularım: gönderdiğim ve ilanlarıma gelen başvurular, durum takibi.

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { HealthHeader, EmptyState, LoadingBlocks } from '@/components/health/HealthUI';
import { ApplicationStatusBadge } from '@/components/adoption/AdoptionUI';
import { TransferCard } from '@/components/adoption/TransferCard';
import { adoptionService, type AdoptionApplication } from '@/services/adoptionService';
import { cn } from '@/lib/utils';

type Tab = 'sent' | 'received';

export default function MyApplicationsPage() {
    return <Suspense fallback={null}><MyApplications /></Suspense>;
}

function dateText(iso: string) {
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function MyApplications() {
    const router = useRouter();
    const params = useSearchParams();
    const tab: Tab = params.get('tab') === 'received' ? 'received' : 'sent';
    const [sent, setSent] = useState<AdoptionApplication[] | null>(null);
    const [received, setReceived] = useState<AdoptionApplication[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(() => {
        adoptionService.sentApplications().then(setSent).catch(e => setError(e?.message || 'Yüklenemedi.'));
        adoptionService.receivedApplications().then(setReceived).catch(e => setError(e?.message || 'Yüklenemedi.'));
    }, []);
    useEffect(() => { load(); }, [load]);

    const list = tab === 'sent' ? sent : received;
    const openReceived = (received || []).filter(a => a.status === 'pending' || a.status === 'interview').length;

    return (
        <>
            <HealthHeader title="Başvurularım" backHref="/sahiplendirme" />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-card border border-card-border">
                    {(['sent', 'received'] as const).map(t => (
                        <button key={t} onClick={() => router.replace(`/sahiplendirme/basvurularim${t === 'received' ? '?tab=received' : ''}`)}
                            className={cn('h-10 rounded-xl text-sm font-black', tab === t ? 'bg-accent text-white' : 'text-secondary')}>
                            {t === 'sent' ? 'Giden başvurular' : `Gelen başvurular${openReceived ? ` (${openReceived})` : ''}`}
                        </button>
                    ))}
                </div>

                {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                {!list ? <LoadingBlocks count={3} /> : list.length === 0 ? (
                    <EmptyState title={tab === 'sent' ? 'Henüz başvurun yok' : 'İlanlarına henüz başvuru gelmedi'}
                        text={tab === 'sent' ? 'Yuva arayan dostlara göz at; sahiplenmek istediğin ilandan başvurabilirsin.' : 'İlanını paylaştıkça daha çok kişiye ulaşır.'}
                        action={<Link href="/sahiplendirme" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Sahiplendirme ilanları</Link>} />
                ) : (
                    <div className="space-y-2.5">
                        {list.map(a => (
                            <div key={a.id} className="space-y-2">
                                <Link href={`/sahiplendirme/basvuru/${a.id}`} className="flex items-center gap-3 bg-card border border-card-border rounded-2xl p-3">
                                    {tab === 'sent'
                                        ? (a.listing?.photos[0] ? <img src={a.listing.photos[0]} alt="" className="w-14 h-14 rounded-xl object-cover" /> : <span className="w-14 h-14 rounded-xl bg-card-border/40 flex items-center justify-center text-2xl">🐾</span>)
                                        : (a.applicant?.avatar ? <img src={a.applicant.avatar} alt="" className="w-14 h-14 rounded-full object-cover" /> : <span className="w-14 h-14 rounded-full bg-card-border/40" />)}
                                    <span className="flex-1 min-w-0">
                                        <span className="flex items-center gap-2">
                                            <span className="text-sm font-black truncate">{tab === 'sent' ? a.listing?.petName || 'İlan' : a.fullName}</span>
                                            <ApplicationStatusBadge status={a.status} />
                                        </span>
                                        <span className="block text-xs font-semibold text-secondary truncate">
                                            {tab === 'received' && a.listing ? `${a.listing.petName} · ` : ''}{dateText(a.createdAt)}
                                        </span>
                                        {a.status === 'interview' && a.interviewAt && (
                                            <span className="block text-xs font-bold text-accent">Görüşme: {new Date(a.interviewAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                        )}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                                </Link>
                                {tab === 'sent' && a.transfer && <TransferCard transfer={a.transfer} petName={a.listing?.petName || 'Dostun'} onDone={load} />}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}
