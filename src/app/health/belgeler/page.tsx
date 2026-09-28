'use client';

import React, { useMemo, useState } from 'react';
import { useHealth } from '@/components/health/HealthProvider';
import { DOC_CATEGORIES, DocumentRow, UploadDocumentSheet } from '@/components/health/Documents';
import { AddButton, EmptyState, FilterTabs, HealthHeader, LoadingBlocks, ModuleIcon, PrimaryButton } from '@/components/health/HealthUI';
import type { DocumentCategory } from '@/types/health';

type Filter = 'all' | DocumentCategory;

// Referans alt sıra — Belgeler.
export default function DocumentsPage() {
    const { pet, bundle, loading } = useHealth();
    const [filter, setFilter] = useState<Filter>('all');
    const [uploadOpen, setUploadOpen] = useState(false);

    const docs = bundle?.documents || [];
    const present = useMemo(() => new Set(docs.map(d => d.category)), [docs]);
    const options = [{ id: 'all' as Filter, label: 'Tümü' }, ...DOC_CATEGORIES.filter(c => present.has(c.id)).map(c => ({ id: c.id as Filter, label: c.label }))];
    const list = filter === 'all' ? docs : docs.filter(d => d.category === filter);

    return (
        <>
            <HealthHeader title="Belgeler" backHref="/health" action={pet ? <AddButton onClick={() => setUploadOpen(true)} label="Yükle" /> : null} />
            <main className="max-w-2xl mx-auto px-4 space-y-4">
                {options.length > 2 && <FilterTabs<Filter> options={options} value={filter} onChange={setFilter} />}
                {loading || !bundle ? <LoadingBlocks /> : list.length === 0 ? (
                    <EmptyState icon={<ModuleIcon module="belgeler" size="lg" />} title="Henüz belge yok"
                        text="Aşı karnesinin fotoğrafını, tahlil sonuçlarını ve reçeteleri burada sakla."
                        action={<button onClick={() => setUploadOpen(true)} className="h-11 px-5 rounded-2xl bg-accent text-white font-black text-sm">Belge yükle</button>} />
                ) : (
                    <>
                        <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border">
                            {list.map(d => <DocumentRow key={d.id} doc={d} />)}
                        </div>
                        <PrimaryButton onClick={() => setUploadOpen(true)}>+ Belge yükle</PrimaryButton>
                    </>
                )}
            </main>
            <UploadDocumentSheet open={uploadOpen} onClose={() => setUploadOpen(false)}
                defaultCategory={filter === 'all' ? 'other' : filter} />
        </>
    );
}
