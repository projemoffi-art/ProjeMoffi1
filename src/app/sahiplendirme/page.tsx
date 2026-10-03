'use client';

// Referans Ekran 1 (ana ekran, iki sütunlu kartlar), Ekran 2 (harita) ve Ekran 3 (liste) — Sahiplendirme.
// Görünüm adreste tutulur (?view=list|map) ki geri tuşu ana ekrana dönsün.

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClipboardList, MapPin, Search } from 'lucide-react';
import { PanelHeader } from '@/components/lost/PanelHeader';
import { AreaSheet } from '@/components/lost/AreaSheet';
import { useSearchArea } from '@/components/lost/useSearchArea';
import { HealthHeader, LoadingBlocks, PrimaryButton, Sheet } from '@/components/health/HealthUI';
import { GridCard, RowCard, CheckRow, Tag, listingFacts } from '@/components/adoption/AdoptionUI';
import { adoptionService, AGE_GROUPS, type AdoptionListing, type AgeGroup } from '@/services/adoptionService';
import type { Species } from '@/services/lostService';
import { distanceKm, distanceText } from '@/lib/geo';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const ListingsMap = dynamic(() => import('@/components/lost/ListingsMap'), { ssr: false });

const RADII = [5, 10, 25, 50];
const TIMES: { id: string; label: string; hours: number | null }[] = [
    { id: 'all', label: 'Tüm ilanlar', hours: null },
    { id: '24h', label: '24 saat', hours: 24 },
    { id: '7d', label: '7 gün', hours: 24 * 7 },
    { id: '30d', label: '30 gün', hours: 24 * 30 },
];

interface Extra { ages: AgeGroup[]; gender: '' | 'Dişi' | 'Erkek'; kids: boolean; cats: boolean; dogs: boolean; neutered: boolean; shelter: boolean }
const NO_EXTRA: Extra = { ages: [], gender: '', kids: false, cats: false, dogs: false, neutered: false, shelter: false };

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick} className={cn('h-9 px-3.5 rounded-full text-xs font-bold whitespace-nowrap border shrink-0',
            on ? 'bg-foreground text-background border-foreground' : 'bg-card border-card-border text-secondary')}>{children}</button>
    );
}

export default function AdoptionHomePage() {
    return <Suspense fallback={null}><AdoptionHome /></Suspense>;
}

function AdoptionHome() {
    const router = useRouter();
    const params = useSearchParams();
    const view = (params.get('view') as 'list' | 'map' | null) || 'grid';
    const { user } = useAuth();
    const { area, choose, detectDevice } = useSearchArea();
    const [listings, setListings] = useState<AdoptionListing[] | null>(null);
    // Zaman süzgecinin ölçüsü: ilanların yüklendiği an (render saf kalsın diye Date.now() burada değil).
    const [loadedAt, setLoadedAt] = useState(0);
    const [mine, setMine] = useState<AdoptionListing[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState('');
    const [species, setSpecies] = useState<'all' | Species>('all');
    const [radius, setRadius] = useState(10);
    const [time, setTime] = useState('all');
    const [vaccinated, setVaccinated] = useState(false);
    const [extra, setExtra] = useState<Extra>(NO_EXTRA);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [areaOpen, setAreaOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        adoptionService.list().then(l => { setListings(l); setLoadedAt(Date.now()); }).catch(e => setError(e?.message || 'İlanlar yüklenemedi.'));
    }, []);
    useEffect(() => {
        if (user) adoptionService.mine().then(m => setMine(m.filter(l => l.status === 'active' || l.status === 'paused'))).catch(() => {});
    }, [user]);

    const shown = useMemo(() => {
        if (!listings || !area) return [];
        const hours = TIMES.find(t => t.id === time)?.hours ?? null;
        const minTs = hours ? loadedAt - hours * 3600000 : 0;
        const term = q.trim().toLocaleLowerCase('tr-TR');
        return listings
            .map(l => ({ l, km: l.lat != null && l.lng != null ? distanceKm(area, { lat: l.lat, lng: l.lng }) : null }))
            .filter(({ l, km }) =>
                (species === 'all' || l.species === species)
                && (km == null || km <= radius)
                && new Date(l.createdAt).getTime() >= minTs
                && (!vaccinated || l.vaccinated)
                && (extra.ages.length === 0 || (l.ageGroup && extra.ages.includes(l.ageGroup)))
                && (!extra.gender || l.gender === extra.gender)
                && (!extra.kids || l.goodWithKids) && (!extra.cats || l.goodWithCats) && (!extra.dogs || l.goodWithDogs)
                && (!extra.neutered || l.neutered) && (!extra.shelter || l.isShelter)
                && (!term || [l.petName, l.breed, l.locationText, l.description].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR').includes(term)))
            .sort((a, b) => (a.km ?? 999) - (b.km ?? 999) || new Date(b.l.createdAt).getTime() - new Date(a.l.createdAt).getTime());
    }, [listings, loadedAt, area, species, radius, time, vaccinated, extra, q]);

    const extraCount = extra.ages.length + (extra.gender ? 1 : 0) + [extra.kids, extra.cats, extra.dogs, extra.neutered, extra.shelter].filter(Boolean).length;
    const selected = shown.find(s => s.l.id === selectedId) || null;
    const setView = (v: 'grid' | 'list' | 'map') => {
        if (v === 'grid') router.push('/sahiplendirme');
        else if (view === 'grid') router.push(`/sahiplendirme?view=${v}`);
        else router.replace(`/sahiplendirme?view=${v}`);
    };

    const filters = (
        <>
            <label className="flex items-center gap-2 h-11 px-4 rounded-2xl bg-card border border-card-border">
                <Search className="w-4 h-4 text-secondary shrink-0" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="İlanlarda ara (ad, ırk, yer)"
                    className="flex-1 bg-transparent text-sm font-semibold outline-none" />
            </label>
            <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold min-w-0">
                    <MapPin className="w-4 h-4 text-accent shrink-0" /><span className="truncate">{area?.name || 'Konum alınıyor…'}</span>
                </span>
                <button onClick={() => setAreaOpen(true)} className="h-9 px-3.5 rounded-full bg-card border border-card-border text-xs font-bold shrink-0">Konum değiştir</button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {(['all', 'dog', 'cat', 'other'] as const).map(s => (
                    <Chip key={s} on={species === s} onClick={() => setSpecies(s)}>{{ all: 'Tümü', dog: 'Köpek', cat: 'Kedi', other: 'Diğer' }[s]}</Chip>
                ))}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                <Chip on={false} onClick={() => setRadius(RADII[(RADII.indexOf(radius) + 1) % RADII.length])}>{radius} km</Chip>
                <Chip on={time !== 'all'} onClick={() => setTime(TIMES[(TIMES.findIndex(t => t.id === time) + 1) % TIMES.length].id)}>{TIMES.find(t => t.id === time)?.label}</Chip>
                <Chip on={vaccinated} onClick={() => setVaccinated(v => !v)}>Aşılı</Chip>
                <Chip on={extraCount > 0} onClick={() => setFiltersOpen(true)}>Filtreler{extraCount ? ` (${extraCount})` : ''}</Chip>
            </div>
        </>
    );

    const empty = (
        <div className="bg-card border border-card-border rounded-2xl p-6 text-center space-y-1">
            <div className="text-base font-black">Bu alanda ilan yok</div>
            <p className="text-sm font-semibold text-secondary">Mesafeyi genişletmeyi ya da filtreleri azaltmayı dene.</p>
        </div>
    );

    return (
        <>
            {view === 'grid' ? (
                <main className="max-w-2xl mx-auto px-4 pt-[calc(16px+env(safe-area-inset-top,0px))] space-y-3.5">
                    <PanelHeader active="adopt" subtitle="Daha fazla pati, daha mutlu yuvalar." />
                    {filters}

                    {user && (
                        <div className="grid grid-cols-2 gap-2">
                            <Link href="/sahiplendirme/basvurularim" className="h-11 rounded-2xl bg-card border border-card-border text-xs font-black flex items-center justify-center gap-1.5">
                                <ClipboardList className="w-4 h-4" /> Başvurularım
                            </Link>
                            <button onClick={() => setView('list')} className="h-11 rounded-2xl bg-card border border-card-border text-xs font-black">Liste / harita</button>
                        </div>
                    )}

                    {mine.map(m => (
                        <Link key={m.id} href={`/sahiplendirme/${m.id}/yonet`} className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-3">
                            {m.photos[0] && <img src={m.photos[0]} alt="" className="w-11 h-11 rounded-xl object-cover" />}
                            <span className="flex-1 min-w-0">
                                <span className="block text-sm font-black truncate">{m.status === 'paused' ? 'İlanın durduruldu' : 'İlanın yayında'}: {m.petName}</span>
                                <span className="block text-xs font-semibold text-secondary">
                                    {m.openApplications ? `${m.openApplications} açık başvuru` : 'Henüz başvuru yok'}
                                </span>
                            </span>
                            <span className="text-xs font-black text-accent">Yönet</span>
                        </Link>
                    ))}

                    {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                    {!listings || !area ? <LoadingBlocks count={3} /> : shown.length === 0 ? empty : (
                        <div className="grid grid-cols-2 gap-2.5">
                            {shown.map(({ l, km }) => <GridCard key={l.id} listing={l} distanceKm={km} />)}
                        </div>
                    )}
                    <p className="text-[11px] font-semibold text-secondary text-center">Moffi&apos;de sahiplendirme ücretsizdir. İlan konumları yaklaşık gösterilir.</p>
                </main>
            ) : (
                <>
                    <HealthHeader title="Sahiplendirme" backHref="/sahiplendirme" />
                    <main className="max-w-2xl mx-auto px-4 space-y-3.5">
                        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-card border border-card-border">
                            {(['list', 'map'] as const).map(v => (
                                <button key={v} onClick={() => setView(v)} className={cn('h-10 rounded-xl text-sm font-black', view === v ? 'bg-foreground text-background' : 'text-secondary')}>
                                    {v === 'list' ? 'Liste' : 'Harita'}
                                </button>
                            ))}
                        </div>
                        {filters}
                        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                        {view === 'list' ? (
                            !listings || !area ? <LoadingBlocks count={3} /> : shown.length === 0 ? empty : (
                                <div className="space-y-2.5">{shown.map(({ l, km }) => <RowCard key={l.id} listing={l} distanceKm={km} />)}</div>
                            )
                        ) : area && (
                            <div className="relative h-[56vh] rounded-3xl overflow-hidden border border-card-border">
                                <ListingsMap listings={shown.map(s => ({ ...s.l, kind: 'adopt' as const }))} center={[area.lat, area.lng]} radiusKm={radius}
                                    selectedId={selectedId} onSelect={setSelectedId} />
                                {selected && (
                                    <Link href={`/sahiplendirme/${selected.l.id}`} className="absolute inset-x-3 bottom-3 z-[500] flex items-center gap-3 bg-card border border-card-border rounded-2xl p-2.5 shadow-lg">
                                        {selected.l.photos[0] && <img src={selected.l.photos[0]} alt="" className="w-14 h-14 rounded-xl object-cover" />}
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-sm font-black truncate">{selected.l.petName}</span>
                                            <span className="block text-xs font-semibold text-secondary truncate">{listingFacts(selected.l)}</span>
                                            <span className="block text-xs font-semibold text-secondary truncate">{[selected.l.locationText, distanceText(selected.km)].filter(Boolean).join(' · ')}</span>
                                        </span>
                                    </Link>
                                )}
                                {listings && shown.every(s => s.l.lat == null) && (
                                    <div className="absolute inset-x-3 top-3 z-[500] rounded-2xl bg-card/95 border border-card-border p-3 text-xs font-semibold text-secondary">
                                        Bu filtrelerde haritada gösterilecek konumlu ilan yok.
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </>
            )}

            <div className="fixed inset-x-0 bottom-[calc(108px+env(safe-area-inset-bottom,0px))] z-40 px-4 pointer-events-none">
                <div className="max-w-2xl mx-auto pointer-events-auto">
                    <Link href={user ? '/sahiplendirme/ilan-ver' : '/'} className="h-12 rounded-2xl bg-accent text-white font-black text-sm flex items-center justify-center shadow-lg">Sahiplendirme ilanı ver</Link>
                </div>
            </div>

            {area && <AreaSheet open={areaOpen} onClose={() => setAreaOpen(false)} area={area} onChoose={choose} onDevice={detectDevice} />}
            <FilterSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} value={extra} onApply={setExtra} />
        </>
    );
}

function FilterSheet({ open, onClose, value, onApply }: { open: boolean; onClose: () => void; value: Extra; onApply: (v: Extra) => void }) {
    const [v, setV] = useState<Extra>(value);
    // Her açılışta taslak güncel süzgeçlerden başlar (render sırasında, efektte setState yok).
    const [wasOpen, setWasOpen] = useState(open);
    if (open !== wasOpen) { setWasOpen(open); if (open) setV(value); }
    return (
        <Sheet open={open} onClose={onClose} title="Filtreler">
            <div>
                <div className="text-xs font-bold text-secondary mb-2">Yaş</div>
                <div className="flex flex-wrap gap-2">
                    {AGE_GROUPS.map(a => (
                        <button key={a.id} onClick={() => setV(x => ({ ...x, ages: x.ages.includes(a.id) ? x.ages.filter(y => y !== a.id) : [...x.ages, a.id] }))}>
                            <Tag label={a.label} strong={v.ages.includes(a.id)} className={cn('text-xs px-3 py-1.5 rounded-full', !v.ages.includes(a.id) && 'bg-card border border-card-border text-secondary')} />
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <div className="text-xs font-bold text-secondary mb-2">Cinsiyet</div>
                <div className="flex gap-2">
                    {([['', 'Farketmez'], ['Dişi', 'Dişi'], ['Erkek', 'Erkek']] as const).map(([id, label]) => (
                        <Chip key={id} on={v.gender === id} onClick={() => setV(x => ({ ...x, gender: id }))}>{label}</Chip>
                    ))}
                </div>
            </div>
            <div className="bg-card border border-card-border rounded-2xl px-4 py-1">
                <CheckRow checked={v.kids} onChange={c => setV(x => ({ ...x, kids: c }))} label="Çocuklarla uyumlu" />
                <CheckRow checked={v.cats} onChange={c => setV(x => ({ ...x, cats: c }))} label="Kedilerle uyumlu" />
                <CheckRow checked={v.dogs} onChange={c => setV(x => ({ ...x, dogs: c }))} label="Köpeklerle uyumlu" />
                <CheckRow checked={v.neutered} onChange={c => setV(x => ({ ...x, neutered: c }))} label="Kısırlaştırılmış" />
                <CheckRow checked={v.shelter} onChange={c => setV(x => ({ ...x, shelter: c }))} label="Sadece barınak ilanları" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => setV(NO_EXTRA)} className="h-12 rounded-2xl bg-card border border-card-border font-black text-sm">Temizle</button>
                <PrimaryButton onClick={() => { onApply(v); onClose(); }}>Uygula</PrimaryButton>
            </div>
        </Sheet>
    );
}
