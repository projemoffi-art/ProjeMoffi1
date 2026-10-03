'use client';

// E5 · Rozet Kasası (design-reference/quests-final/): son kazanılan rozet büyük, kategori süzgeci, madalyon ızgarası.
// Tek rozet ekranı (eski /walk/badges ve görev ekranındaki rozet sekmesinin yerine). Rozetler sunucuda (quest_badges).
// A3 · Rozet detayı: ilerleme, kazanç, profil vitrinine koyma, paylaşma.

import { useEffect, useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { usePet } from '@/context/PetContext';
import { useAuth } from '@/context/AuthContext';
import { questService, QUESTS_CHANGED, type BadgeCategory, type BadgeItem } from '@/services/questService';
import { genitive } from '@/lib/turkish';
import { openShare } from '@/components/common/ShareSheet';
import { LoadingBlocks } from '@/components/health/HealthUI';
import { CoralButton, Medallion, PillTabs, ProgressLine, QuestHeader, QuestSheet, SheetClose } from '@/components/quests/QuestUI';
import { cn, showToast } from '@/lib/utils';

type Filter = 'all' | BadgeCategory;
const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Tümü' }, { id: 'yuruyus', label: 'Yürüyüş' }, { id: 'saglik', label: 'Sağlık' }, { id: 'egitim', label: 'Eğitim' },
    { id: 'sosyal', label: 'Sosyal' }, { id: 'kesif', label: 'Keşif' }, { id: 'ozel', label: 'Özel' },
];
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toLocaleString('tr-TR', { maximumFractionDigits: 1 }));

export default function BadgeVaultPage() {
    const { activePet } = usePet();
    const petId = activePet?.id ?? null;
    const isDog = activePet?.type === 'dog';
    const [filter, setFilter] = useState<Filter>('all');
    const [state, setState] = useState<{ petId: string; badges: BadgeItem[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [openKey, setOpenKey] = useState<string | null>(null);

    useEffect(() => {
        if (!petId) return;
        let alive = true;
        const load = () => questService.badges(petId)
            .then(r => alive && setState({ petId, badges: r.badges }))
            .catch(e => alive && setError(e instanceof Error ? e.message : 'Rozetler yüklenemedi.'));
        void load();
        window.addEventListener(QUESTS_CHANGED, load);
        return () => { alive = false; window.removeEventListener(QUESTS_CHANGED, load); };
    }, [petId]);

    const all = state && state.petId === petId ? state.badges : null;
    // Yürüyüş ve keşif rozetleri yürüyüş kaydından gelir; yalnızca köpeklerde gösterilir (kazanılmışsa her zaman).
    const relevant = (all ?? []).filter(b => b.earned_at || isDog || (b.category !== 'yuruyus' && b.category !== 'kesif'));
    const shown = relevant.filter(b => filter === 'all' || b.category === filter);
    const earned = relevant.filter(b => b.earned_at).sort((a, b) => (b.earned_at! > a.earned_at! ? 1 : -1));
    const hero = earned.find(b => b.featured) ?? earned[0] ?? null;
    const open = (all ?? []).find(b => b.key === openKey) ?? null;
    const filters = FILTERS.filter(f => isDog || (f.id !== 'yuruyus' && f.id !== 'kesif'));

    return (
        <>
            <QuestHeader title="Rozet Kasası" subtitle={`${activePet ? genitive(activePet.name) : 'Dostunun'} başarıları burada. 🏆`} />
            {error && !all && <p className="px-4 text-sm font-semibold text-red-600">{error}</p>}
            {!all ? <div className="px-4"><LoadingBlocks count={3} /></div> : (
                <>
                    {hero ? (
                        <button type="button" onClick={() => setOpenKey(hero.key)} className="w-full flex flex-col items-center text-center px-6 pt-2 pb-4">
                            <div className="relative">
                                <span className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(247,215,116,0.45)_0%,transparent_70%)]" aria-hidden />
                                <Medallion icon={hero.icon} earned size={132} />
                            </div>
                            <span className="text-[19px] font-extrabold mt-3">{hero.title}</span>
                            <span className="text-[13px] font-semibold text-secondary mt-0.5">{hero.description}. Harika gidiyorsun!</span>
                            <span className="text-[12px] font-bold text-accent mt-1">{earned.length} rozet kazanıldı</span>
                        </button>
                    ) : (
                        <div className="text-center px-8 pt-2 pb-4">
                            <Medallion icon="🏅" earned={false} size={96} className="mx-auto" />
                            <p className="text-[15px] font-extrabold mt-3">İlk rozetin yolda</p>
                            <p className="text-[13px] font-semibold text-secondary">Günlük görevleri tamamladıkça rozetler burada birikir.</p>
                        </div>
                    )}

                    <PillTabs<Filter> value={filter} onChange={setFilter} tabs={filters} />

                    <div className="px-4 pt-4 grid grid-cols-3 gap-x-2 gap-y-5">
                        {shown.map(b => (
                            <button key={b.key} type="button" onClick={() => setOpenKey(b.key)} className="flex flex-col items-center text-center gap-1.5">
                                <Medallion icon={b.icon} earned={!!b.earned_at} size={70} />
                                <span className={cn('text-[12px] font-bold leading-tight', !b.earned_at && 'text-secondary')}>{b.title}</span>
                                {!b.earned_at && b.current != null && (
                                    <span className="text-[10.5px] font-semibold text-secondary tabular-nums">{fmt(b.current)}/{fmt(b.threshold)} {b.unit}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
            {open && petId && <BadgeSheet badge={open} petId={petId} petName={activePet?.name ?? ''} onClose={() => setOpenKey(null)} />}
        </>
    );
}

function BadgeSheet({ badge, petId, petName, onClose }: { badge: BadgeItem; petId: string; petName: string; onClose: () => void }) {
    const { user } = useAuth();
    const [busy, setBusy] = useState(false);
    const earned = !!badge.earned_at;
    const current = earned ? badge.threshold : badge.current;

    const toggleFeature = async () => {
        setBusy(true);
        try {
            await questService.featureBadge(petId, badge.key, !badge.featured);
            window.dispatchEvent(new Event(QUESTS_CHANGED));
            showToast(badge.featured ? 'Rozet vitrinden kaldırıldı.' : 'Rozet profilindeki vitrine eklendi.', 'CheckCircle2', 'text-emerald-500 font-bold');
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Vitrin güncellenemedi.', 'AlertCircle', 'text-red-500 font-bold');
        } finally {
            setBusy(false);
        }
    };

    const top = (
        <div className="flex items-start justify-between px-5 pt-5">
            <span className="w-9" />
            <div className="text-center">
                <h2 className="text-[19px] font-extrabold">{badge.title}</h2>
                <p className="text-[12.5px] font-semibold text-secondary">{earned ? badge.description : badge.hidden ? 'Keşfetmen gereken bir rozet' : 'Henüz kazanılmadı'}</p>
            </div>
            <div className="flex gap-2">
                {earned && user?.id && (
                    <button type="button" aria-label="Paylaş" onClick={() => openShare({ title: `${petName} "${badge.title}" rozetini kazandı!`, text: badge.description, url: `/profile/${user.id}`, badge: 'Moffi rozeti' })}
                        className="w-9 h-9 rounded-full bg-card border border-card-border flex items-center justify-center"><Share2 className="w-4 h-4" /></button>
                )}
                <SheetClose onClose={onClose} />
            </div>
        </div>
    );

    return (
        <QuestSheet open onClose={onClose} title={badge.title} top={top}
            footer={earned ? <CoralButton onClick={toggleFeature} disabled={busy}>{badge.featured ? 'Profilimden kaldır' : 'Profilimde göster'}</CoralButton> : undefined}>
            <div className="flex flex-col items-center pt-4">
                <Medallion icon={badge.icon} earned={earned} size={150} />
                {current != null && (
                    <div className="w-full max-w-xs mt-5">
                        <div className="flex items-center gap-2">
                            <ProgressLine value={current} max={badge.threshold} tone="green" className="flex-1" />
                            {earned && <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check className="w-4 h-4" /></span>}
                        </div>
                        <p className="text-center text-[12.5px] font-bold text-secondary mt-1.5 tabular-nums">{fmt(current)} / {fmt(badge.threshold)} {badge.unit}</p>
                    </div>
                )}
                {(badge.pawcoin > 0 || badge.xp > 0) && (
                    <div className="w-full mt-5 bg-card border border-card-border rounded-2xl p-4">
                        <span className="block text-[13px] font-black mb-2">{earned ? 'Kazandıkların' : 'Kazanacakların'}</span>
                        <div className="flex gap-6">
                            {badge.pawcoin > 0 && <span className="inline-flex items-center gap-2 text-[15px] font-black"><span aria-hidden>🪙</span>+{badge.pawcoin} <span className="text-[11.5px] font-semibold text-secondary">PawCoin</span></span>}
                            {badge.xp > 0 && <span className="inline-flex items-center gap-2 text-[15px] font-black"><span aria-hidden>⭐</span>+{badge.xp} <span className="text-[11.5px] font-semibold text-secondary">XP</span></span>}
                        </div>
                    </div>
                )}
                {earned && badge.earned_at && (
                    <p className="text-[12px] font-semibold text-secondary mt-3">
                        {new Date(badge.earned_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihinde kazanıldı
                    </p>
                )}
            </div>
        </QuestSheet>
    );
}
