'use client';

import React, { useRef, useState } from 'react';
import { device } from "@/native";
import { FileText } from 'lucide-react';
import { useHealth } from './HealthProvider';
import { ErrorText, Field, PrimaryButton, SelectInput, Sheet, TextInput } from './HealthUI';
import { healthService, MAX_DOCUMENT_BYTES } from '@/services/healthService';
import { formatDateKeyTr } from '@/lib/appointmentTime';
import type { DocumentCategory, PetDocument } from '@/types/health';
import { showToast } from '@/lib/utils';

export const DOC_CATEGORIES: { id: DocumentCategory; label: string }[] = [
    { id: 'vaccine_card', label: 'Aşı karnesi' },
    { id: 'lab', label: 'Tahlil' },
    { id: 'imaging', label: 'Röntgen / görüntüleme' },
    { id: 'prescription', label: 'Reçete' },
    { id: 'report', label: 'Rapor' },
    { id: 'invoice', label: 'Fatura' },
    { id: 'other', label: 'Diğer' },
];
export const docCategoryLabel = (c: DocumentCategory) => DOC_CATEGORIES.find(x => x.id === c)?.label || 'Belge';

function sizeText(bytes: number | null) {
    if (!bytes) return '';
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Belgeler özel bir alanda durur; açmak için kısa ömürlü imzalı bağlantı alınır. */
export function DocumentRow({ doc, onDeleted }: { doc: PetDocument; onDeleted?: () => void }) {
    const { run } = useHealth();
    const [busy, setBusy] = useState(false);
    const open = async () => {
        setBusy(true);
        try { device.openExternal(await healthService.getDocumentUrl(doc.storagePath)); }
        catch (e: any) { showToast(e.message, 'AlertCircle', 'text-red-500 font-bold'); }
        finally { setBusy(false); }
    };
    const ext = (doc.storagePath.split('.').pop() || '').toUpperCase();
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={open} disabled={busy} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <span className="w-10 h-12 rounded-lg bg-card-border/40 border border-card-border flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-secondary" />
                </span>
                <span className="min-w-0">
                    <span className="block text-sm font-black truncate">{doc.title}</span>
                    <span className="block text-xs font-semibold text-secondary">
                        {docCategoryLabel(doc.category)} · {formatDateKeyTr(doc.docDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                        {ext ? ` · ${ext}` : ''}{doc.sizeBytes ? ` · ${sizeText(doc.sizeBytes)}` : ''}
                    </span>
                </span>
            </button>
            <button onClick={async () => { const err = await run(() => healthService.deleteDocument(doc)); if (!err) onDeleted?.(); else showToast(err, 'AlertCircle', 'text-red-500 font-bold'); }}
                className="text-xs font-bold text-red-600 shrink-0">Sil</button>
        </div>
    );
}

export function UploadDocumentSheet({ open, onClose, medicalRecordId, defaultCategory = 'other' }: {
    open: boolean; onClose: () => void; medicalRecordId?: string | null; defaultCategory?: DocumentCategory;
}) {
    const { pet, today, run } = useHealth();
    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState<DocumentCategory>(defaultCategory);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(today);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    React.useEffect(() => { if (open) setCategory(defaultCategory); }, [open, defaultCategory]);

    const close = () => { setFile(null); setTitle(''); setDate(today); setCategory(defaultCategory); setError(null); onClose(); };

    const save = async () => {
        if (!pet || !file) { setError('Bir dosya seç.'); return; }
        setSaving(true);
        const err = await run(() => healthService.uploadDocument(pet.id, file, { category, title: title || file.name, docDate: date, medicalRecordId }));
        setSaving(false);
        if (err) setError(err); else close();
    };

    return (
        <Sheet open={open} onClose={close} title="Belge yükle">
            <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden
                onChange={e => {
                    const f = e.target.files?.[0] || null;
                    e.target.value = '';
                    if (f && f.size > MAX_DOCUMENT_BYTES) { setError('Dosya 10 MB\'tan büyük olamaz.'); return; }
                    setFile(f); setError(null);
                    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''));
                }} />
            <button onClick={() => fileRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-card-border bg-card p-5 text-center">
                <span className="block text-sm font-black">{file ? file.name : 'Dosya seç'}</span>
                <span className="block text-xs font-semibold text-secondary mt-1">PDF ya da fotoğraf · en fazla 10 MB</span>
            </button>
            <Field label="Tür">
                <SelectInput value={category} onChange={e => setCategory(e.target.value as DocumentCategory)}>
                    {DOC_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </SelectInput>
            </Field>
            <Field label="Başlık"><TextInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn: Kan tahlili sonucu" /></Field>
            <Field label="Belge tarihi"><TextInput type="date" value={date} max={today} onChange={e => setDate(e.target.value)} /></Field>
            <p className="text-[11px] font-semibold text-secondary">Belgeleri sadece sen görürsün; bir klinikle paylaşmayı sen seçersin.</p>
            <ErrorText>{error}</ErrorText>
            <PrimaryButton onClick={save} disabled={saving || !file}>{saving ? 'Yükleniyor…' : 'Yükle'}</PrimaryButton>
        </Sheet>
    );
}
