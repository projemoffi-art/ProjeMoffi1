'use client';

// Seçili hayvanın albümü (ana sayfa üst kartı → Albüm). Yalnızca sahibi görür (özel depo, CLAUDE.md 8.65).
// Fotoğraflar: albüme yüklenenler + yürüyüş + etiketli gönderiler + profil fotoğrafları, tek akışta.
// Anılar: elle eklenenler (başlık, tarih, not, fotoğraf/video) + mevcut veriden otomatik anılar.
// Adres parametreleri: ?tab=memories, ?open=<anahtar> (fotoğraf ya da anı), ?new=1 (yeni anı), ?add=1 (yükleme vurgusu).

import Link from 'next/link';
import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Crown, ImagePlus, Loader2, Lock, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePet } from '@/context/PetContext';
import { usePetAlbum, invalidatePetAlbum } from '@/hooks/usePetAlbum';
import { albumService, AlbumLimitError, type AlbumPhoto, type Memory } from '@/services/albumService';
import { apiService } from '@/services/apiService';
import { EmptyState, ErrorText, Field, FilterTabs, HealthHeader, PrimaryButton, Sheet, TextArea, TextInput } from '@/components/health/HealthUI';
import { AlbumViewer } from '@/components/album/AlbumViewer';
import { albumPetOf, MEMORY_ICON, memoryDate } from '@/components/home/hero/AlbumTab';
import { nunito } from '@/components/home/homeUI';
import { genitive } from '@/lib/turkish';
import { todayKey } from '@/lib/appointmentTime';
import { haptics } from '@/native';
import { showToast } from '@/lib/utils';

type Filter = 'all' | 'album' | 'walk' | 'post' | 'profile';
const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Tümü' }, { id: 'album', label: 'Yüklediklerin' }, { id: 'walk', label: 'Yürüyüş' },
    { id: 'post', label: 'Gönderiler' }, { id: 'profile', label: 'Profil' },
];

const openPrime = () => window.dispatchEvent(new CustomEvent('open-premium-modal'));
const toastError = (e: unknown, fallback: string) => showToast(e instanceof Error ? e.message : fallback, 'AlertCircle', 'text-red-500 font-bold');

function AlbumContent() {
    const params = useSearchParams();
    const { user } = useAuth();
    const { activePet, pets, updatePet, isLoading } = usePet();
    const pet = activePet || pets[0] || null;
    const album = usePetAlbum(pet ? albumPetOf(pet) : null, user?.id);
    const data = album.data;
    const limits = data?.status.limits;

    const [tab, setTab] = useState<'photos' | 'memories'>(params.get('tab') === 'memories' ? 'memories' : 'photos');
    const [filter, setFilter] = useState<Filter>('all');
    const openParam = params.get('open');
    const [viewer, setViewer] = useState<{ list: 'all' | 'memory'; key: string } | null>(
        openParam && !openParam.startsWith('memory-') && !openParam.startsWith('auto-') ? { list: 'all', key: openParam } : null);
    const [memoryKey, setMemoryKey] = useState<string | null>(openParam && (openParam.startsWith('memory-') || openParam.startsWith('auto-')) ? openParam : null);
    const [form, setForm] = useState<{ id: string | null; title: string; note: string; date: string } | null>(
        params.get('new') === '1' ? { id: null, title: '', note: '', date: todayKey() } : null);
    const [formError, setFormError] = useState('');
    const [pickFor, setPickFor] = useState<AlbumPhoto | null>(null);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
    const [limitHit, setLimitHit] = useState<{ reason: 'quota' | 'prime' | 'size'; message: string } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const uploadTarget = useRef<string | null>(null);

    const photos = useMemo(() => (data?.photos || []).filter(p => filter === 'all' || p.source === filter), [data, filter]);
    const memory = useMemo(() => data?.memories.find(m => m.key === memoryKey) || null, [data, memoryKey]);
    const manualMemories = useMemo(() => (data?.memories || []).filter(m => m.kind === 'manual'), [data]);

    const viewerList = viewer?.list === 'memory' ? memory?.media || [] : photos;
    const viewerIndex = viewer ? viewerList.findIndex(p => p.key === viewer.key) : -1;
    const setViewerIndex = useCallback((i: number) => setViewer(v => (v ? { ...v, key: (v.list === 'memory' ? memory?.media || [] : photos)[i]?.key ?? v.key } : v)), [memory, photos]);
    const closeViewer = useCallback(() => setViewer(null), []);

    if (!pet) {
        return (
            <>
                <HealthHeader title="Albüm" backHref="/home" />
                {isLoading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>
                    : <EmptyState title="Önce dostunu ekle" text="Albüm, evcil hayvanını ekledikten sonra açılır." action={<Link href="/home" className="text-accent font-black">Ana sayfaya dön</Link>} />}
            </>
        );
    }

    const pickFiles = (memoryId: string | null) => {
        uploadTarget.current = memoryId;
        setLimitHit(null);
        fileRef.current?.click();
    };

    const upload = async (files: File[]) => {
        if (!files.length) return;
        const memoryId = uploadTarget.current;
        setProgress({ done: 0, total: files.length });
        let ok = 0;
        for (const [i, f] of files.entries()) {
            try {
                await albumService.upload(pet.id, f, memoryId);
                ok++;
            } catch (e) {
                if (e instanceof AlbumLimitError) { setLimitHit({ reason: e.reason, message: e.message }); break; }
                toastError(e, `${f.name} yüklenemedi`);
            }
            setProgress({ done: i + 1, total: files.length });
        }
        setProgress(null);
        if (ok) {
            invalidatePetAlbum(pet.id);
            showToast(ok === 1 ? 'Albüme eklendi' : `${ok} dosya albüme eklendi`, 'CheckCircle2', 'text-emerald-500 font-bold');
        }
    };

    const makeCover = async (p: AlbumPhoto) => {
        setBusy(true);
        try {
            let url = p.fullUrl;
            if (p.source === 'album') {
                // Özel albüm adresi süreli; kapak herkese görünen profil deposuna kopyalanır (tek dosya, küçültülmüş).
                const blob = await (await fetch(await albumService.fullUrlOf(p))).blob();
                url = await apiService.uploadMedia(new File([blob], `kapak.${blob.type === 'image/jpeg' ? 'jpg' : 'webp'}`, { type: blob.type }), 'avatars');
            }
            if (!url) throw new Error('Kapak yapılamadı.');
            updatePet(pet.id, { cover_photo: url });
            invalidatePetAlbum(pet.id);
            showToast('Kapak fotoğrafı güncellendi', 'CheckCircle2', 'text-emerald-500 font-bold');
        } catch (e) {
            toastError(e, 'Kapak yapılamadı');
        } finally {
            setBusy(false);
        }
    };

    const removePhoto = async (p: AlbumPhoto) => {
        setBusy(true);
        try {
            await albumService.remove(p);
            setViewer(null);
            invalidatePetAlbum(pet.id);
            showToast('Silindi', 'CheckCircle2', 'text-emerald-500 font-bold');
        } catch (e) { toastError(e, 'Silinemedi'); }
        finally { setBusy(false); }
    };

    const assignMemory = async (memoryId: string | null) => {
        if (!pickFor?.mediaId) return;
        setBusy(true);
        try {
            await albumService.setMediaMemory(pickFor.mediaId, memoryId);
            setPickFor(null);
            invalidatePetAlbum(pet.id);
            showToast(memoryId ? 'Anıya eklendi' : 'Anıdan çıkarıldı', 'CheckCircle2', 'text-emerald-500 font-bold');
        } catch (e) { toastError(e, 'Güncellenemedi'); }
        finally { setBusy(false); }
    };

    const saveForm = async () => {
        if (!form) return;
        setFormError('');
        setBusy(true);
        try {
            const id = await albumService.saveMemory({ id: form.id, petId: pet.id, title: form.title, note: form.note, date: form.date });
            setForm(null);
            setTab('memories');
            setMemoryKey(`memory-${id}`);
            invalidatePetAlbum(pet.id);
        } catch (e) {
            if (e instanceof AlbumLimitError) { setForm(null); setLimitHit({ reason: e.reason, message: e.message }); }
            else setFormError(e instanceof Error ? e.message : 'Kaydedilemedi');
        } finally { setBusy(false); }
    };

    const removeMemory = async (m: Memory) => {
        if (!m.id) return;
        setBusy(true);
        try {
            await albumService.removeMemory(m.id);
            setMemoryKey(null);
            invalidatePetAlbum(pet.id);
            showToast('Anı silindi', 'CheckCircle2', 'text-emerald-500 font-bold');
        } catch (e) { toastError(e, 'Silinemedi'); }
        finally { setBusy(false); }
    };

    const quota = data ? `${data.status.mediaCount.toLocaleString('tr-TR')}/${data.status.limits.photosPerPet.toLocaleString('tr-TR')}` : '';
    const memoryQuota = data && data.status.limits.memoriesPerPet !== null ? `${data.status.memoryCount}/${data.status.limits.memoriesPerPet}` : null;

    return (
        <>
            <HealthHeader title={`${genitive(pet.name)} albümü`} backHref="/home" action={
                <button type="button" onClick={() => pickFiles(null)} disabled={!!progress} aria-label="Fotoğraf ekle" className="h-10 px-2 text-accent font-black text-sm flex items-center gap-1 disabled:opacity-50">
                    <ImagePlus className="w-5 h-5" />
                </button>
            } />
            <input ref={fileRef} type="file" multiple accept={limits?.video ? 'image/*,video/mp4,video/quicktime,video/webm' : 'image/*'} className="hidden"
                onChange={e => { const files = Array.from(e.target.files || []); e.target.value = ''; upload(files); }} />

            <main className="max-w-2xl mx-auto px-4 pb-[calc(env(safe-area-inset-bottom)+112px)] space-y-4">
                <div className="flex items-center gap-2 text-[12.5px] font-semibold text-secondary">
                    <Lock className="w-3.5 h-3.5" /> Albüm yalnızca sana görünür.
                    {limits && !limits.prime && (
                        <button type="button" onClick={openPrime} className="ml-auto flex items-center gap-1 text-accent font-extrabold"><Crown className="w-3.5 h-3.5" /> Prime</button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-foreground/[0.06]" role="tablist">
                    {(['photos', 'memories'] as const).map(t => (
                        <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                            className={`h-10 rounded-xl text-[14px] font-extrabold transition-colors ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-secondary'}`}>
                            {t === 'photos' ? 'Fotoğraflar' : 'Anılar'}
                        </button>
                    ))}
                </div>

                {progress && (
                    <div className="card-premium rounded-2xl px-4 py-3 flex items-center gap-3" role="status">
                        <Loader2 className="w-5 h-5 animate-spin text-accent" />
                        <span className="flex-1 text-[13.5px] font-bold">Yükleniyor {progress.done}/{progress.total}</span>
                        <span className="w-24 h-1.5 rounded-full bg-foreground/[0.08] overflow-hidden"><span className="block h-full bg-accent transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} /></span>
                    </div>
                )}
                {limitHit && (
                    <div className="rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3">
                        <p className="text-[13.5px] font-bold text-foreground">{limitHit.message}</p>
                        {limits && !limits.prime && limitHit.reason !== 'size' && (
                            <p className="text-[12.5px] font-semibold text-secondary mt-1">
                                Prime ile hayvan başına 1.000 dosya, sınırsız anı ve 30 saniyelik videolar.{' '}
                                <button type="button" onClick={openPrime} className="text-accent font-extrabold">Prime&apos;ı incele</button>
                            </p>
                        )}
                    </div>
                )}
                {album.status === 'error' && !data && (
                    <ErrorText>{album.error} <button type="button" onClick={album.reload} className="underline">Tekrar dene</button></ErrorText>
                )}

                {!data ? (
                    <div className="grid grid-cols-3 gap-1.5">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-square rounded-xl bg-foreground/[0.06] animate-pulse" />)}</div>
                ) : tab === 'photos' ? (
                    <>
                        <FilterTabs options={FILTERS} value={filter} onChange={setFilter} />
                        {photos.length === 0 ? (
                            <EmptyState title={filter === 'all' ? 'Henüz fotoğraf yok' : 'Bu kaynakta fotoğraf yok'}
                                text="Yüklediğin fotoğraflar, yürüyüş fotoğrafları ve dostunu etiketlediğin gönderiler burada toplanır."
                                action={<PrimaryButton onClick={() => pickFiles(null)} className="max-w-[240px] mx-auto"><ImagePlus className="w-5 h-5" /> Fotoğraf ekle</PrimaryButton>} />
                        ) : (
                            <div className="grid grid-cols-3 gap-1.5">
                                {photos.map(p => (
                                    <button key={p.key} type="button" onClick={() => { haptics.tap(); setViewer({ list: 'all', key: p.key }); }}
                                        className="relative aspect-square rounded-xl overflow-hidden bg-foreground/[0.06]">
                                        <img src={p.thumbUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                                        {p.kind === 'video' && (
                                            <span className="absolute right-1.5 bottom-1.5 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-white text-[10.5px] font-bold">
                                                <Play className="w-3 h-3" fill="currentColor" />{p.durationSeconds ? `${Math.round(p.durationSeconds)} sn` : ''}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                        <p className="text-center text-[12px] font-semibold text-secondary">
                            Yüklenen: {quota}{limits?.video ? ' · video en fazla 30 sn' : ' · video Prime ile'}
                        </p>
                    </>
                ) : (
                    <>
                        <button type="button" onClick={() => { setFormError(''); setForm({ id: null, title: '', note: '', date: todayKey() }); }}
                            className="w-full h-12 rounded-2xl bg-accent text-white text-[14.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                            <Plus className="w-5 h-5" strokeWidth={2.6} /> Yeni anı ekle{memoryQuota ? ` (${memoryQuota})` : ''}
                        </button>
                        {data.memories.length === 0 ? (
                            <EmptyState title="Henüz anı yok" text="İlk yürüyüş, doğum günleri ve km eşikleri kendiliğinden burada belirir." />
                        ) : (
                            <div className="space-y-2.5">
                                {data.memories.map(m => {
                                    const Icon = MEMORY_ICON[m.icon];
                                    return (
                                        <button key={m.key} type="button" onClick={() => setMemoryKey(m.key)} className="w-full card-premium rounded-[20px] p-2.5 flex items-center gap-3 text-left">
                                            <span className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-[#3A2E24]">
                                                {m.cover ? <img src={m.cover.thumbUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                                                    : <span className="absolute inset-0 flex items-center justify-center" style={{ background: 'radial-gradient(120% 90% at 70% 20%, #F4A77F 0%, #E2734F 50%, #8E4A33 100%)' }}><Icon className="w-6 h-6 text-white" /></span>}
                                            </span>
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-[15px] font-extrabold text-foreground truncate">{m.title}</span>
                                                <span className="block text-[12.5px] font-semibold text-secondary">{memoryDate(m.date)}{m.kind === 'auto' ? ' · Otomatik' : m.media.length ? ` · ${m.media.length} dosya` : ''}</span>
                                                {m.note && <span className="block text-[12.5px] font-semibold text-secondary/90 truncate">{m.note}</span>}
                                            </span>
                                            <Icon className="w-4 h-4 text-secondary/70 shrink-0 mr-1" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>

            <AlbumViewer photos={viewerList} index={viewerIndex >= 0 ? viewerIndex : null} onIndex={setViewerIndex} onClose={closeViewer}
                onCover={makeCover} onRemove={removePhoto} onAddToMemory={p => setPickFor(p)} busy={busy} />

            <Sheet open={!!memory && !form && !viewer} onClose={() => setMemoryKey(null)} title={memory?.title || 'Anı'}>
                {memory && (
                    <>
                        <p className="text-[13px] font-semibold text-secondary">{memoryDate(memory.date)}{memory.kind === 'auto' ? ' · Otomatik anı' : ''}</p>
                        {memory.note && <p className="text-[14.5px] font-semibold text-foreground whitespace-pre-line">{memory.note}</p>}
                        {memory.kind === 'manual' ? (
                            <>
                                {memory.media.length > 0 && (
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {memory.media.map(p => (
                                            <button key={p.key} type="button" onClick={() => setViewer({ list: 'memory', key: p.key })} className="relative aspect-square rounded-xl overflow-hidden bg-foreground/[0.06]">
                                                <img src={p.thumbUrl} alt="" className="w-full h-full object-cover" />
                                                {p.kind === 'video' && <Play className="absolute right-1.5 bottom-1.5 w-4 h-4 text-white drop-shadow" fill="currentColor" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <PrimaryButton onClick={() => pickFiles(memory.id || null)} disabled={!!progress}>
                                    <ImagePlus className="w-5 h-5" /> {limits?.video ? 'Fotoğraf ya da video ekle' : 'Fotoğraf ekle'}
                                </PrimaryButton>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => { setFormError(''); setForm({ id: memory.id || null, title: memory.title, note: memory.note || '', date: memory.date }); }}
                                        className="h-11 rounded-2xl bg-card border border-card-border text-[13.5px] font-bold flex items-center justify-center gap-1.5"><Pencil className="w-4 h-4" /> Düzenle</button>
                                    <button type="button" disabled={busy} onClick={() => removeMemory(memory)}
                                        className="h-11 rounded-2xl bg-card border border-card-border text-[13.5px] font-bold text-[#D9432F] flex items-center justify-center gap-1.5 disabled:opacity-50"><Trash2 className="w-4 h-4" /> Anıyı sil</button>
                                </div>
                                <p className="text-[12px] font-semibold text-secondary">Anı silinince fotoğrafları albümde kalır.</p>
                            </>
                        ) : (
                            <>
                                {memory.cover && <img src={memory.cover.thumbUrl} alt="" className="w-full max-h-64 object-cover rounded-2xl" />}
                                <p className="text-[13px] font-semibold text-secondary">Bu anı kayıtlarından kendiliğinden oluştu; depolama harcamaz.</p>
                                {memory.href && <Link href={memory.href} className="h-12 rounded-2xl border border-accent/30 bg-accent/5 text-accent font-black text-sm flex items-center justify-center">Kaydı aç</Link>}
                            </>
                        )}
                    </>
                )}
            </Sheet>

            <Sheet open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Anıyı düzenle' : 'Yeni anı'}>
                {form && (
                    <>
                        <Field label="Başlık"><TextInput value={form.title} maxLength={80} placeholder="Örn. İlk deniz günü" onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
                        <Field label="Tarih"><TextInput type="date" value={form.date} max={todayKey()} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
                        <Field label="Not (isteğe bağlı)"><TextArea value={form.note} maxLength={1000} placeholder="O gün neler oldu?" onChange={e => setForm({ ...form, note: e.target.value })} /></Field>
                        <ErrorText>{formError}</ErrorText>
                        <PrimaryButton onClick={saveForm} disabled={busy || !form.title.trim() || !form.date}>
                            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : form.id ? 'Kaydet' : 'Anıyı oluştur'}
                        </PrimaryButton>
                        {!form.id && <p className="text-[12px] font-semibold text-secondary text-center">Oluşturduktan sonra fotoğraf ekleyebilirsin.</p>}
                    </>
                )}
            </Sheet>

            <Sheet open={!!pickFor} onClose={() => setPickFor(null)} title="Hangi anıya?">
                {manualMemories.length === 0 ? (
                    <EmptyState title="Henüz anın yok" text="Önce Anılar sekmesinden bir anı oluştur." />
                ) : (
                    <div className="space-y-2">
                        {manualMemories.map(m => (
                            <button key={m.key} type="button" disabled={busy} onClick={() => assignMemory(m.id || null)}
                                className={`w-full card-premium rounded-2xl px-4 py-3 text-left disabled:opacity-60 ${pickFor?.memoryId === m.id ? 'ring-2 ring-accent/70' : ''}`}>
                                <span className="block text-[14.5px] font-extrabold">{m.title}</span>
                                <span className="block text-[12.5px] font-semibold text-secondary">{memoryDate(m.date)}</span>
                            </button>
                        ))}
                        {pickFor?.memoryId && (
                            <button type="button" disabled={busy} onClick={() => assignMemory(null)} className="w-full h-11 rounded-2xl text-[13.5px] font-bold text-[#D9432F]">Anıdan çıkar</button>
                        )}
                    </div>
                )}
            </Sheet>
        </>
    );
}

export default function AlbumPage() {
    return (
        <div className={`theme-vet ${nunito.className} min-h-[100dvh] bg-background text-foreground`}>
            <Suspense fallback={null}>
                <AlbumContent />
            </Suspense>
        </div>
    );
}
