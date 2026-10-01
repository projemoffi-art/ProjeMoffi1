'use client';

// Referans Ekran 4 (Gönderi Oluştur), 5 (Medya Düzenle), 6 (Yayınla). ?edit=<id> aynı akışla gönderiyi düzenler
// (medya değiştirilemez; açıklama, etiket, konum ve izinler değişir).

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, MapPin, Plus, X } from 'lucide-react';
import { ErrorText, LoadingBlocks, SelectInput } from '@/components/health/HealthUI';
import { PetAvatar } from '@/components/health/PetPicker';
import { ToggleRow } from '@/components/lost/LostUI';
import { MediaEditor, DEFAULT_EDIT, isEdited, renderEdited, type EditState } from '@/components/social/MediaEditor';
import { filterCss, filterLabel } from '@/lib/mediaFilters';
import { usePet } from '@/context/PetContext';
import { useAuth } from '@/context/AuthContext';
import { socialService, COMMENT_PRIVACY, TOPICS, type CommentPrivacy, type PostTopic } from '@/services/socialService';
import { areaName, currentPosition } from '@/lib/geo';
import { speciesLabel } from '@/lib/petIdentity';
import { cn, showToast } from '@/lib/utils';

interface MediaItem { key: string; file?: File; url?: string; preview: string; isVideo: boolean; edit: EditState }
type Step = 'compose' | 'edit' | 'options';

const MAX_IMAGES = 10;
const MAX_VIDEO_MB = 50;

export default function NewPostPage() {
    return <Suspense fallback={null}><Composer /></Suspense>;
}

function Composer() {
    const router = useRouter();
    const params = useSearchParams();
    const editId = params.get('edit');
    const { user } = useAuth();
    const { pets } = usePet();
    const fileRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<Step>('compose');
    const [editIndex, setEditIndex] = useState(0);
    const [loaded, setLoaded] = useState(!editId);
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [content, setContent] = useState('');
    const [tagged, setTagged] = useState<string[]>([]);
    const [loc, setLoc] = useState<{ text: string; lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [privacy, setPrivacy] = useState<CommentPrivacy>('everyone');
    const [topic, setTopic] = useState<PostTopic | null>(null);
    const [showOnProfile, setShowOnProfile] = useState(true);
    const [shareAfter, setShareAfter] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (!user && loaded) router.replace('/'); }, [user, loaded, router]);

    // Ana sayfadaki doğum günü kartından gelindiyse: hayvan etiketli, hazır bir kutlama metni.
    const birthdayPetId = params.get('dogumgunu');
    useEffect(() => {
        if (!birthdayPetId || editId) return;
        const pet = pets.find(p => p.id === birthdayPetId);
        if (!pet) return;
        const age = pet.birthday ? new Date().getFullYear() - Number(pet.birthday.slice(0, 4)) : null;
        setTagged(t => (t.includes(pet.id) ? t : [pet.id, ...t].slice(0, 5)));
        setContent(c => c || (age && age > 0 ? `Doğum günün kutlu olsun ${pet.name}! 🎂 Bugün ${age} yaşında 🐾` : `Doğum günün kutlu olsun ${pet.name}! 🎂🐾`));
        setTopic(tp => tp || 'daily');
    }, [birthdayPetId, pets]); // eslint-disable-line react-hooks/exhaustive-deps
    // Keşfet'teki "Haftanın teması" kartından gelindiyse metin etiketle başlar.
    const themeTag = params.get('tema');
    useEffect(() => {
        if (!themeTag || editId || !/^[\p{L}\p{N}_]{2,30}$/u.test(themeTag)) return;
        setContent(c => (c.includes(`#${themeTag}`) ? c : `${c ? c + ' ' : ''}#${themeTag} `));
    }, [themeTag, editId]);
    useEffect(() => { if (!editId) setPrivacy((user as any)?.settings?.default_comment_privacy === 'followers' ? 'followers' : 'everyone'); }, [user, editId]);

    useEffect(() => {
        if (!editId) return;
        socialService.post(editId).then(p => {
            if (!p || !p.isMine) { setError('Bu gönderiyi sadece sahibi düzenleyebilir.'); setLoaded(true); return; }
            setMedia(p.media.map((u, i) => ({ key: `${i}-${u}`, url: u, preview: u, isVideo: p.isVideo, edit: DEFAULT_EDIT })));
            setContent(p.content); setTagged(p.pets.map(x => x.id)); setPrivacy(p.commentPrivacy); setTopic(p.topic);
            setLoc(p.locationText ? { text: p.locationText, lat: NaN, lng: NaN } : null);
            setLoaded(true);
        }).catch(() => { setError('Gönderi yüklenemedi.'); setLoaded(true); });
    }, [editId]);

    const hasVideo = media.some(m => m.isVideo);
    const addFiles = (files: FileList | null) => {
        if (!files) return;
        setError(null);
        const list = Array.from(files);
        const video = list.find(f => f.type.startsWith('video/'));
        if (video) {
            if (video.size > MAX_VIDEO_MB * 1024 * 1024) { setError(`Video en fazla ${MAX_VIDEO_MB} MB olabilir.`); return; }
            setMedia([{ key: `${Date.now()}`, file: video, preview: URL.createObjectURL(video), isVideo: true, edit: DEFAULT_EDIT }]);
            setEditIndex(0); setStep('edit');
            return;
        }
        const next = hasVideo ? [] : [...media];
        const first = next.length;
        for (const f of list) {
            if (next.length >= MAX_IMAGES) break;
            if (!f.type.startsWith('image/')) continue;
            next.push({ key: `${Date.now()}-${f.name}-${next.length}`, file: f, preview: URL.createObjectURL(f), isVideo: false, edit: DEFAULT_EDIT });
        }
        setMedia(next);
        // Seçilen fotoğraflar doğrudan düzenleyicide açılır (filtre ve ayarlar burada).
        if (next.length > first) { setEditIndex(first); setStep('edit'); }
    };

    const detectLocation = async () => {
        setLocating(true);
        const p = await currentPosition(10000);
        if (!p) { setLocating(false); showToast('Konum alınamadı; tarayıcı iznini kontrol et.', 'AlertCircle', 'text-red-500 font-bold'); return; }
        const name = await areaName(p.lat, p.lng);
        setLocating(false);
        if (!name) { showToast('Semt bulunamadı, tekrar dene.', 'AlertCircle', 'text-red-500 font-bold'); return; }
        setLoc({ text: name.slice(0, 80), lat: p.lat, lng: p.lng });
    };

    const togglePet = (id: string) => setTagged(t => (t.includes(id) ? t.filter(x => x !== id) : t.length >= 5 ? t : [...t, id]));
    const taggedPets = useMemo(() => pets.filter(p => tagged.includes(p.id)), [pets, tagged]);

    const next = () => {
        setError(null);
        if (media.length === 0) { setError('En az bir fotoğraf ya da video ekle.'); return; }
        setStep('options');
    };

    const publish = async () => {
        setError(null);
        setSaving(true);
        try {
            const input = {
                content, taggedPetIds: tagged, topic, showOnProfile, commentPrivacy: privacy,
                locationText: loc?.text || null,
                lat: loc && Number.isFinite(loc.lat) ? loc.lat : null,
                lng: loc && Number.isFinite(loc.lng) ? loc.lng : null,
            };
            if (editId) {
                // Konum değişmediyse mevcut yaklaşık konum korunur (yazma kuralı sadece değişince yeniden yuvarlar).
                await socialService.update(editId, input);
                router.replace(`/community/gonderi/${editId}`);
                return;
            }
            const files: File[] = [];
            for (const m of media) {
                if (m.isVideo) { files.push(m.file!); continue; }
                const blob = await renderEdited(m.preview, m.edit);
                files.push(new File([blob], 'moffi.jpg', { type: 'image/jpeg' }));
            }
            const urls = await socialService.uploadMedia(files);
            const id = await socialService.create({ ...input, media: urls, isVideo: hasVideo, mediaFilter: hasVideo ? media[0].edit.filter : null });
            router.replace(`/community/gonderi/${id}${shareAfter ? '?paylas=1' : ''}`);
        } catch (e: any) {
            setError(e?.message || 'Paylaşılamadı.');
            setSaving(false);
        }
    };

    if (!loaded) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={3} /></main>;

    const title = step === 'edit' ? 'Medya Düzenle' : step === 'options' ? 'Gönderi Seçenekleri' : editId ? 'Gönderiyi Düzenle' : 'Gönderi Oluştur';
    const onBack = () => (step === 'compose' ? router.back() : setStep('compose'));
    const action = step === 'options'
        ? <button onClick={publish} disabled={saving} className="h-9 px-4 rounded-full bg-accent text-white text-sm font-black disabled:opacity-50">{saving ? 'Paylaşılıyor…' : editId ? 'Kaydet' : 'Paylaş'}</button>
        : <button onClick={step === 'edit' ? () => setStep('compose') : next} className="h-9 px-4 rounded-full bg-accent text-white text-sm font-black">{step === 'edit' ? 'Tamam' : 'İleri'}</button>;

    return (
        <>
            <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-3">
                <div className="max-w-2xl mx-auto grid grid-cols-[40px_1fr_auto] items-center gap-2">
                    <button onClick={onBack} aria-label={step === 'compose' ? 'Kapat' : 'Geri'} className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center">
                        {step === 'compose' ? <X className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                    <h1 className="text-lg font-black text-center truncate">{title}</h1>
                    {action}
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pb-16 space-y-5">
                {step === 'compose' && (
                    <>
                        <section>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                {media.map((m, i) => (
                                    <div key={m.key} className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-card-border/40">
                                        <button onClick={() => { if (!editId) { setEditIndex(i); setStep('edit'); } }} className="w-full h-full" aria-label="Düzenle">
                                            {m.isVideo
                                                ? <video src={m.preview} muted className="w-full h-full object-cover" style={{ filter: filterCss(m.edit.filter) }} />
                                                : <img src={m.preview} alt="" className="w-full h-full object-cover" style={{ filter: filterCss(m.edit.filter) }} />}
                                        </button>
                                        {!editId && (
                                            <button onClick={() => setMedia(ms => ms.filter((_, j) => j !== i))} aria-label="Kaldır"
                                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
                                        )}
                                        {isEdited(m.edit) && <span className="absolute bottom-1 left-1 text-[9px] font-black bg-black/60 text-white px-1.5 py-0.5 rounded">{m.edit.filter !== 'none' ? filterLabel(m.edit.filter) : 'Düzenlendi'}</span>}
                                    </div>
                                ))}
                                {!editId && !hasVideo && media.length < MAX_IMAGES && (
                                    <button onClick={() => fileRef.current?.click()} className="w-24 h-24 shrink-0 rounded-xl border-2 border-dashed border-card-border flex flex-col items-center justify-center text-secondary gap-1">
                                        <Plus className="w-6 h-6" /><span className="text-[10px] font-bold">Ekle</span>
                                    </button>
                                )}
                            </div>
                            <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
                            <div className="flex justify-between text-[11px] font-semibold text-secondary mt-1.5">
                                <span>Medya</span>
                                <span>{editId ? 'Medya düzenlemede değiştirilemez' : hasVideo ? '1 video seçildi' : `${media.length} fotoğraf seçildi`}</span>
                            </div>
                            {!editId && media.length > 0 && (
                                <button onClick={() => { setEditIndex(0); setStep('edit'); }}
                                    className="mt-2.5 w-full h-11 rounded-2xl bg-card border border-card-border text-sm font-black flex items-center justify-center gap-2">
                                    <span aria-hidden>✨</span> Efekt ve düzenleme
                                </button>
                            )}
                        </section>

                        <section>
                            <div className="text-sm font-black mb-1.5">Açıklama</div>
                            <textarea value={content} onChange={e => setContent(e.target.value)} maxLength={1000} rows={4}
                                placeholder="Bugün sahilde harika bir yürüyüş yaptık…"
                                className="w-full px-4 py-3 rounded-2xl bg-card border border-card-border text-sm font-semibold outline-none focus:border-accent" />
                            <div className="text-right text-[11px] font-semibold text-secondary">{content.length}/1000</div>
                        </section>

                        <section className="space-y-2">
                            <div className="text-sm font-black">Hayvanı etiketle</div>
                            {taggedPets.map(p => (
                                <div key={p.id} className="flex items-center gap-3 bg-card border border-card-border rounded-2xl p-2.5">
                                    <PetAvatar src={p.image} name={p.name} className="w-11 h-11 rounded-full" />
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-sm font-black">{p.name}</span>
                                        <span className="block text-xs font-semibold text-secondary truncate">{p.breed || speciesLabel(p.type)}</span>
                                    </span>
                                    <button onClick={() => togglePet(p.id)} aria-label="Etiketi kaldır" className="w-8 h-8 flex items-center justify-center text-secondary"><X className="w-4 h-4" /></button>
                                </div>
                            ))}
                            {pets.filter(p => !tagged.includes(p.id)).length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {pets.filter(p => !tagged.includes(p.id)).map(p => (
                                        <button key={p.id} onClick={() => togglePet(p.id)} className="inline-flex items-center gap-1.5 h-9 pl-1 pr-3 rounded-full bg-card border border-card-border text-xs font-bold">
                                            <PetAvatar src={p.image} name={p.name} className="w-7 h-7 rounded-full text-xs" />+ {p.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {pets.length === 0 && <p className="text-xs font-semibold text-secondary">Etiketlemek için önce pasaportuna bir hayvan ekle.</p>}
                        </section>

                        <section className="space-y-1.5">
                            <div className="text-sm font-black">Konum <span className="text-secondary font-semibold">(isteğe bağlı)</span></div>
                            {loc ? (
                                <div className="flex items-center gap-2 h-12 px-4 rounded-2xl bg-card border border-card-border">
                                    <MapPin className="w-4 h-4 text-accent shrink-0" />
                                    <span className="flex-1 text-sm font-bold truncate">{loc.text} <span className="text-xs font-semibold text-secondary">(yalnızca semt paylaşılır)</span></span>
                                    <button onClick={() => setLoc(null)} aria-label="Konumu kaldır"><X className="w-4 h-4 text-secondary" /></button>
                                </div>
                            ) : (
                                <button onClick={detectLocation} disabled={locating} className="w-full h-12 px-4 rounded-2xl bg-card border border-card-border text-sm font-bold text-secondary flex items-center gap-2 disabled:opacity-60">
                                    <MapPin className="w-4 h-4 text-accent" />{locating ? 'Semt bulunuyor…' : 'Konum ekle'}
                                </button>
                            )}
                        </section>

                        <section>
                            <div className="text-sm font-black mb-1.5">Kimler yorum yapabilir?</div>
                            <SelectInput value={privacy} onChange={e => setPrivacy(e.target.value as CommentPrivacy)}>
                                {COMMENT_PRIVACY.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </SelectInput>
                        </section>
                    </>
                )}

                {step === 'edit' && media[editIndex] && (
                    <>
                        <MediaEditor items={media} index={editIndex} onIndex={setEditIndex}
                            onChange={(idx, v) => setMedia(ms => ms.map((m, i) => (i === idx ? { ...m, edit: v } : m)))}
                            onApplyAll={v => setMedia(ms => ms.map(m => (m.isVideo ? m : { ...m, edit: { ...m.edit, filter: v.filter, adjust: v.adjust } })))} />
                    </>
                )}

                {step === 'options' && (
                    <>
                        <section className="bg-card border border-card-border rounded-2xl px-4 py-2">
                            <ToggleRow on={!!loc} onChange={v => (v ? detectLocation() : setLoc(null))} label="Konumu paylaş" hint="Sadece semt adı görünür; tam konumun kimseyle paylaşılmaz." />
                            {loc && <div className="h-10 px-3 mb-2 rounded-xl bg-background border border-card-border text-sm font-bold flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" />{loc.text}</div>}
                        </section>
                        <section>
                            <div className="text-sm font-black mb-1.5">Yorum yapabilir?</div>
                            <SelectInput value={privacy} onChange={e => setPrivacy(e.target.value as CommentPrivacy)}>
                                {COMMENT_PRIVACY.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </SelectInput>
                        </section>
                        <section>
                            <div className="text-sm font-black mb-1.5">Konu <span className="text-secondary font-semibold">(isteğe bağlı, Keşfet'te bulunmasını kolaylaştırır)</span></div>
                            <div className="flex flex-wrap gap-2">
                                {TOPICS.map(t => (
                                    <button key={t.id} onClick={() => setTopic(topic === t.id ? null : t.id)}
                                        className={cn('h-9 px-4 rounded-full text-xs font-black border', topic === t.id ? 'bg-foreground text-background border-foreground' : 'bg-card border-card-border text-secondary')}>{t.label}</button>
                                ))}
                            </div>
                        </section>
                        <section className="bg-card border border-card-border rounded-2xl px-4 py-2">
                            <div className="text-sm font-black pt-1">Diğer seçenekler</div>
                            <ToggleRow on={showOnProfile} onChange={setShowOnProfile} label="Profilimde göster" hint="Kapalıysa gönderi sadece akışta görünür." />
                            {!editId && <ToggleRow on={shareAfter} onChange={setShareAfter} label="Diğer uygulamalarda da paylaş" hint="Yayınlandıktan sonra paylaşım menüsü açılır (Instagram, WhatsApp vb.)." />}
                        </section>
                    </>
                )}

                <ErrorText>{error}</ErrorText>
            </main>
        </>
    );
}
