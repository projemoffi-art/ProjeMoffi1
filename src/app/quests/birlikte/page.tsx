'use client';

// E6 · Birlikte (design-reference/quests-final/): arkadaşlarla ortak hedefler (2–5 kişi) ve düellolar.
// İlerleme herkesin gerçek kayıtlarından sunucuda hesaplanır (team_goals_view); hedef tutunca her üyeye +50 PawCoin.
// A4 · Arkadaş görevi oluştur. Davet yalnızca karşılıklı takipleşilen kişilere.

import { useEffect, useState } from 'react';
import { UserPlus, Swords } from 'lucide-react';
import { usePet } from '@/context/PetContext';
import { apiService } from '@/services/apiService';
import { questService, TEAM_KINDS, type Duel, type Friend, type TeamGoal, type TeamKind, type TeamView } from '@/services/questService';
import { BALANCE_CHANGED } from '@/context/DailyProgressContext';
import { LoadingBlocks, TextInput, SelectInput } from '@/components/health/HealthUI';
import { CoralButton, PetPhoto, PillTabs, ProgressLine, QuestCard, QuestHeader, QuestSheet } from '@/components/quests/QuestUI';
import { cn, showToast } from '@/lib/utils';

type Tab = 'aktif' | 'davet';
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toLocaleString('tr-TR', { maximumFractionDigits: 1 }));

function Avatar({ url, name, className }: { url: string | null; name: string | null; className?: string }) {
    return url
        // eslint-disable-next-line @next/next/no-img-element -- kullanıcı fotoğrafı
        ? <img src={url} alt="" className={cn('rounded-full object-cover border-2 border-card', className)} />
        : <span className={cn('rounded-full bg-accent/15 text-accent font-black flex items-center justify-center border-2 border-card', className)}>{(name || '?').slice(0, 1).toUpperCase()}</span>;
}

export default function TogetherPage() {
    const { activePet } = usePet();
    const [tab, setTab] = useState<Tab>('aktif');
    const [view, setView] = useState<TeamView | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sheet, setSheet] = useState<'goal' | 'duel' | null>(null);
    const [busy, setBusy] = useState(false);
    const [version, setVersion] = useState(0);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                let v = await questService.team();
                // Süresi dolan düellolar açan kişide sonuçlanır (sunucu kazananı ve ödülü belirler).
                const due = v.duels.filter(d => d.status === 'active' && d.ends_at && new Date(d.ends_at).getTime() <= Date.now());
                if (due.length) {
                    await Promise.all(due.map(d => apiService.finalizeSocialChallengeIfDue(d.id).catch(() => {})));
                    window.dispatchEvent(new Event(BALANCE_CHANGED));
                    v = await questService.team();
                }
                if (alive) { setView(v); setError(null); }
            } catch (e) {
                if (alive) setError(e instanceof Error ? e.message : 'Ortak hedefler yüklenemedi.');
            }
        })();
        return () => { alive = false; };
    }, [version]);

    const reload = () => setVersion(v => v + 1);
    const act = async (fn: () => Promise<unknown>, okText: string) => {
        setBusy(true);
        try { await fn(); showToast(okText, 'CheckCircle2', 'text-emerald-500 font-bold'); reload(); }
        catch (e) { showToast(e instanceof Error ? e.message : 'İşlem yapılamadı.', 'AlertCircle', 'text-red-500 font-bold'); }
        finally { setBusy(false); }
    };

    const duelInvites = (view?.duels ?? []).filter(d => d.status === 'pending' && !d.i_am_creator);
    const inviteCount = (view?.invites.length ?? 0) + duelInvites.length;
    const goals = view?.goals ?? [];
    const duels = (view?.duels ?? []).filter(d => !(d.status === 'pending' && !d.i_am_creator) && d.status !== 'declined' && d.status !== 'cancelled');

    return (
        <>
            <QuestHeader title="Birlikte" right={
                <button type="button" onClick={() => setSheet('goal')} aria-label="Yeni ortak hedef" className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                </button>
            } />
            <PillTabs<Tab> value={tab} onChange={setTab} tabs={[{ id: 'aktif', label: 'Aktif' }, { id: 'davet', label: 'Davetler', badge: inviteCount || undefined }]} />

            <div className="px-4 pt-3 space-y-4">
                {error && !view && <p className="text-sm font-semibold text-red-600">{error}</p>}
                {!view ? <LoadingBlocks count={3} /> : tab === 'aktif' ? (
                    <>
                        <div className="relative rounded-[28px] overflow-hidden">
                            <PetPhoto url={activePet?.image} species={activePet?.type} className="w-full h-48" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                                <p className="text-[18px] font-extrabold text-center">Arkadaşlarınla birlikte daha eğlenceli! 🐾</p>
                                <div className="grid grid-cols-3 mt-3 text-center">
                                    {[{ i: '🎯', t: 'Ortak hedef' }, { i: '💪', t: 'Motivasyon' }, { i: '🪙', t: 'PawCoin ödülü' }].map(f => (
                                        <span key={f.t} className="flex flex-col items-center gap-1 text-[11.5px] font-bold"><span className="text-xl" aria-hidden>{f.i}</span>{f.t}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <h2 className="text-[16px] font-extrabold">Aktif hedefler</h2>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setSheet('duel')} className="h-8 px-3 rounded-full bg-card border border-card-border text-[12.5px] font-bold inline-flex items-center gap-1"><Swords className="w-3.5 h-3.5" />Düello</button>
                                <button type="button" onClick={() => setSheet('goal')} className="h-8 px-3 rounded-full bg-accent/10 text-accent text-[12.5px] font-bold">+ Yeni hedef</button>
                            </div>
                        </div>

                        {goals.length === 0 && duels.length === 0 && (
                            <QuestCard className="p-5 text-center">
                                <p className="text-[15px] font-extrabold">Henüz ortak hedefin yok</p>
                                <p className="text-[13px] font-semibold text-secondary mt-1">Karşılıklı takipleştiğin arkadaşlarınla haftalık bir hedef kur; birlikte tamamlayınca herkes ödül alır.</p>
                            </QuestCard>
                        )}
                        {goals.map(g => <GoalCard key={g.id} g={g} busy={busy} onLeave={() => act(() => questService.leaveTeamGoal(g.id), 'Hedeften ayrıldın.')} />)}
                        {duels.map(d => <DuelCard key={d.id} d={d} />)}
                    </>
                ) : (
                    <>
                        {inviteCount === 0 && <p className="text-center text-[14px] font-semibold text-secondary py-10">Bekleyen davetin yok.</p>}
                        {view.invites.map(inv => (
                            <QuestCard key={inv.id} className="p-4">
                                <p className="text-[12px] font-bold text-secondary">{inv.creator ?? 'Bir arkadaşın'} seni davet etti</p>
                                <p className="text-[16px] font-extrabold mt-0.5">{inv.title}</p>
                                <p className="text-[12.5px] font-semibold text-secondary">{TEAM_KINDS[inv.kind].label}: {fmt(inv.target)} {TEAM_KINDS[inv.kind].unit} · {inv.members.length} kişi</p>
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    <button type="button" disabled={busy} onClick={() => act(() => questService.respondTeamGoal(inv.id, false), 'Davet reddedildi.')} className="h-11 rounded-2xl bg-card border border-card-border text-[14px] font-bold">Reddet</button>
                                    <CoralButton disabled={busy} onClick={() => act(() => questService.respondTeamGoal(inv.id, true), 'Hedefe katıldın!')}>Katıl</CoralButton>
                                </div>
                            </QuestCard>
                        ))}
                        {duelInvites.map(d => (
                            <QuestCard key={d.id} className="p-4">
                                <div className="flex items-center gap-3">
                                    <Avatar url={d.opponent?.avatar_url ?? null} name={d.opponent?.name ?? null} className="w-11 h-11 text-base" />
                                    <div className="flex-1">
                                        <p className="text-[15px] font-extrabold">Düello daveti</p>
                                        <p className="text-[12.5px] font-semibold text-secondary">{d.opponent?.name ?? 'Bir arkadaşın'} · {d.duration_days} gün, en çok kim yürüyecek?</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    <button type="button" disabled={busy} onClick={() => act(() => apiService.respondSocialChallenge(d.id, false), 'Düello reddedildi.')} className="h-11 rounded-2xl bg-card border border-card-border text-[14px] font-bold">Reddet</button>
                                    <CoralButton disabled={busy} onClick={() => act(() => apiService.respondSocialChallenge(d.id, true), 'Düello başladı!')}>Kabul et</CoralButton>
                                </div>
                            </QuestCard>
                        ))}
                    </>
                )}
            </div>

            <CreateGoalSheet open={sheet === 'goal'} petPhoto={activePet?.image ?? null} species={activePet?.type} onClose={() => setSheet(null)} onCreated={() => { setSheet(null); reload(); }} />
            <DuelSheet open={sheet === 'duel'} onClose={() => setSheet(null)} onCreated={() => { setSheet(null); reload(); }} />
        </>
    );
}

function GoalCard({ g, busy, onLeave }: { g: TeamGoal; busy: boolean; onLeave: () => void }) {
    const k = TEAM_KINDS[g.kind];
    const accepted = g.members.filter(m => m.status === 'accepted');
    return (
        <QuestCard className="p-4">
            <div className="flex items-start gap-3">
                <span className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-xl shrink-0" aria-hidden>
                    {g.kind === 'walk_km' ? '🐾' : g.kind === 'care_days' ? '🥣' : g.kind === 'lessons' ? '💡' : '📅'}
                </span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-[15.5px] font-extrabold truncate">{g.title}</p>
                        {g.status !== 'active' && (
                            <span className={cn('text-[11px] font-black px-2 py-0.5 rounded-full', g.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-black/[0.05] text-secondary')}>
                                {g.status === 'completed' ? `Tamamlandı · +${g.reward.pawcoin}` : 'Süre doldu'}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <ProgressLine value={g.total} max={g.target} tone="green" className="flex-1 h-2.5" />
                        <span className="text-[12px] font-black tabular-nums whitespace-nowrap">{fmt(g.total)} / {fmt(g.target)} {k.unit}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                        <div className="flex -space-x-2">
                            {accepted.slice(0, 4).map(m => <Avatar key={m.id} url={m.avatar_url} name={m.name} className="w-7 h-7 text-[11px]" />)}
                        </div>
                        <span className="text-[12px] font-semibold text-secondary">{accepted.length} kişi{g.members.length > accepted.length ? ` · ${g.members.length - accepted.length} davet bekliyor` : ''} · {g.status === 'active' ? `${g.days_left} gün kaldı` : 'bitti'}</span>
                    </div>
                    <div className="mt-2 space-y-0.5">
                        {accepted.map(m => (
                            <p key={m.id} className="text-[11.5px] font-semibold text-secondary flex justify-between">
                                <span>{m.me ? 'Sen' : m.name}</span><span className="tabular-nums">{fmt(m.amount)} {k.unit}</span>
                            </p>
                        ))}
                    </div>
                    {g.status === 'active' && (
                        <button type="button" disabled={busy} onClick={onLeave} className="mt-2 text-[12px] font-bold text-secondary underline-offset-2 hover:underline">Hedeften ayrıl</button>
                    )}
                </div>
            </div>
        </QuestCard>
    );
}

function DuelCard({ d }: { d: Duel }) {
    const leading = d.my_km > d.their_km ? 'me' : d.their_km > d.my_km ? 'them' : 'tie';
    return (
        <QuestCard className="p-4">
            <div className="flex items-center gap-3">
                <Avatar url={d.opponent?.avatar_url ?? null} name={d.opponent?.name ?? null} className="w-11 h-11 text-base" />
                <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-extrabold">Düello: {d.status === 'pending' ? 'Yanıt bekleniyor' : d.status === 'completed' ? 'Sonuçlandı' : 'Kim daha çok yürüyecek?'}</p>
                    <p className="text-[12px] font-semibold text-secondary">{d.opponent?.name ?? 'Rakip'} · {d.duration_days} gün</p>
                </div>
            </div>
            {d.status !== 'pending' && (
                <div className="flex items-center justify-center gap-3 mt-3">
                    <span className={cn('h-9 px-3 rounded-full text-[15px] font-black inline-flex items-center', leading === 'me' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-black/[0.04]')}>Sen {fmt(d.my_km)} km</span>
                    <span className="w-9 h-9 rounded-full bg-amber-400 text-white text-[12px] font-black flex items-center justify-center">VS</span>
                    <span className={cn('h-9 px-3 rounded-full text-[15px] font-black inline-flex items-center', leading === 'them' ? 'bg-accent/10 text-accent' : 'bg-black/[0.04]')}>{fmt(d.their_km)} km</span>
                </div>
            )}
        </QuestCard>
    );
}

const KIND_ORDER: TeamKind[] = ['walk_km', 'care_days', 'lessons', 'walk_days'];
const DEFAULTS: Record<TeamKind, { title: string; target: number }> = {
    walk_km: { title: 'Haftalık 30 km Yürüyüş', target: 30 },
    care_days: { title: 'Sağlıklı Pati Ekibi', target: 20 },
    lessons: { title: 'Bilgi Kulübü', target: 10 },
    walk_days: { title: 'Her Gün Hareket', target: 15 },
};

function CreateGoalSheet({ open, onClose, onCreated, petPhoto, species }: { open: boolean; onClose: () => void; onCreated: () => void; petPhoto: string | null; species?: string }) {
    const [kind, setKind] = useState<TeamKind>('walk_km');
    const [title, setTitle] = useState(DEFAULTS.walk_km.title);
    const [target, setTarget] = useState(String(DEFAULTS.walk_km.target));
    const [days, setDays] = useState('7');
    const [friends, setFriends] = useState<Friend[] | null>(null);
    const [picked, setPicked] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        if (!open) return;
        let alive = true;
        questService.friends().then(f => alive && setFriends(f)).catch(() => alive && setFriends([]));
        return () => { alive = false; };
    }, [open]);

    const pickKind = (k: TeamKind) => { setKind(k); setTitle(DEFAULTS[k].title); setTarget(String(DEFAULTS[k].target)); };
    const toggle = (id: string) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : p.length >= 4 ? p : [...p, id]));

    const create = async () => {
        setBusy(true);
        try {
            await questService.createTeamGoal({ title: title.trim(), kind, target: Number(target.replace(',', '.')), days: Number(days), members: picked });
            showToast('Hedef oluşturuldu, davetler gönderildi.', 'CheckCircle2', 'text-emerald-500 font-bold');
            setPicked([]);
            onCreated();
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Hedef oluşturulamadı.', 'AlertCircle', 'text-red-500 font-bold');
        } finally {
            setBusy(false);
        }
    };

    const list = friends ?? [];
    const visibleFriends = showAll ? list : list.slice(0, 5);
    return (
        <QuestSheet open={open} onClose={onClose} title="Arkadaş Görevi Oluştur"
            footer={<CoralButton onClick={create} disabled={busy || picked.length === 0 || title.trim().length < 3 || !(Number(target.replace(',', '.')) > 0)}>Görevi Oluştur</CoralButton>}>
            <div className="space-y-4">
                <PetPhoto url={petPhoto} species={species} className="w-full h-28 rounded-2xl" />
                <div>
                    <span className="text-[12.5px] font-bold text-secondary">Hedef türü</span>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                        {KIND_ORDER.map(k => (
                            <button key={k} type="button" onClick={() => pickKind(k)}
                                className={cn('h-9 px-4 rounded-full text-[13px] font-bold', kind === k ? 'bg-accent text-white' : 'bg-card border border-card-border text-secondary')}>
                                {TEAM_KINDS[k].group}
                            </button>
                        ))}
                    </div>
                    <p className="text-[11.5px] font-semibold text-secondary mt-1.5">{TEAM_KINDS[kind].label}: herkesin toplamı sayılır.</p>
                </div>
                <div className="grid grid-cols-[1fr_120px] gap-2">
                    <label className="block">
                        <span className="text-[12.5px] font-bold text-secondary mb-1 block">Hedef adı</span>
                        <TextInput value={title} maxLength={60} onChange={e => setTitle(e.target.value)} />
                    </label>
                    <label className="block">
                        <span className="text-[12.5px] font-bold text-secondary mb-1 block">Hedef ({TEAM_KINDS[kind].unit})</span>
                        <TextInput value={target} inputMode="decimal" onChange={e => setTarget(e.target.value.replace(/[^0-9.,]/g, ''))} />
                    </label>
                </div>
                <label className="block">
                    <span className="text-[12.5px] font-bold text-secondary mb-1 block">Süre</span>
                    <SelectInput value={days} onChange={e => setDays(e.target.value)}>
                        <option value="3">3 gün</option><option value="7">1 hafta</option><option value="14">2 hafta</option><option value="30">1 ay</option>
                    </SelectInput>
                </label>
                <div>
                    <span className="text-[12.5px] font-bold text-secondary">Arkadaşları davet et ({picked.length}/4)</span>
                    {friends === null ? <p className="text-[12.5px] text-secondary mt-2">Yükleniyor…</p> : list.length === 0 ? (
                        <p className="text-[12.5px] font-semibold text-secondary mt-2">Davet için karşılıklı takipleştiğin biri olmalı. Keşfet&apos;ten arkadaşlarını takip et.</p>
                    ) : (
                        <div className="flex flex-wrap gap-3 mt-2">
                            {visibleFriends.map(f => (
                                <button key={f.id} type="button" onClick={() => toggle(f.id)} className="flex flex-col items-center w-14">
                                    <span className={cn('rounded-full p-0.5', picked.includes(f.id) ? 'ring-2 ring-accent' : '')}>
                                        <Avatar url={f.avatar_url} name={f.name} className="w-11 h-11 text-base" />
                                    </span>
                                    <span className="text-[10.5px] font-bold truncate w-full text-center mt-1">{f.name}</span>
                                </button>
                            ))}
                            {list.length > 5 && !showAll && (
                                <button type="button" onClick={() => setShowAll(true)} aria-label="Tüm arkadaşlar" className="w-11 h-11 rounded-full border-2 border-dashed border-card-border text-secondary text-xl flex items-center justify-center">+</button>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-[11.5px] font-semibold text-secondary">Hedef süresinde tamamlanırsa katılan herkes +50 PawCoin ve +100 XP kazanır.</p>
            </div>
        </QuestSheet>
    );
}

function DuelSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
    const [friends, setFriends] = useState<Friend[] | null>(null);
    const [picked, setPicked] = useState<string | null>(null);
    const [days, setDays] = useState('3');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return;
        let alive = true;
        questService.friends().then(f => alive && setFriends(f)).catch(() => alive && setFriends([]));
        return () => { alive = false; };
    }, [open]);

    const create = async () => {
        if (!picked) return;
        setBusy(true);
        try {
            await apiService.createSocialChallenge(picked, 'duel', Number(days));
            showToast('Düello daveti gönderildi.', 'CheckCircle2', 'text-emerald-500 font-bold');
            setPicked(null);
            onCreated();
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Düello başlatılamadı.', 'AlertCircle', 'text-red-500 font-bold');
        } finally {
            setBusy(false);
        }
    };

    return (
        <QuestSheet open={open} onClose={onClose} title="Düello başlat"
            footer={<CoralButton onClick={create} disabled={busy || !picked}>Davet gönder</CoralButton>}>
            <p className="text-[13px] font-semibold text-secondary">Bir arkadaşını seç; belirlediğiniz sürede en çok kim yürüyecek? Mesafe gerçek yürüyüş kayıtlarından ölçülür.</p>
            <div className="flex flex-wrap gap-3 mt-3">
                {(friends ?? []).map(f => (
                    <button key={f.id} type="button" onClick={() => setPicked(f.id)} className="flex flex-col items-center w-14">
                        <span className={cn('rounded-full p-0.5', picked === f.id ? 'ring-2 ring-accent' : '')}>
                            <Avatar url={f.avatar_url} name={f.name} className="w-11 h-11 text-base" />
                        </span>
                        <span className="text-[10.5px] font-bold truncate w-full text-center mt-1">{f.name}</span>
                    </button>
                ))}
                {friends && friends.length === 0 && <p className="text-[12.5px] font-semibold text-secondary">Düello için karşılıklı takipleştiğin biri olmalı.</p>}
            </div>
            <label className="block mt-4">
                <span className="text-[12.5px] font-bold text-secondary mb-1 block">Süre</span>
                <SelectInput value={days} onChange={e => setDays(e.target.value)}>
                    <option value="1">1 gün</option><option value="3">3 gün</option><option value="7">1 hafta</option>
                </SelectInput>
            </label>
        </QuestSheet>
    );
}
