// Görev Merkezi v2 (design-reference/quests-final/, migration 20261004102300–102700).
// Görevin tamamlandığına ve ödüle SUNUCU karar verir; bu servis yalnızca okur ve kullanıcı eylemlerini iletir.
// Ödül veren tek yol sunucudaki quest_grant (istemciye kapalı). Eski istemci ödül anahtarları (claim_reward) kapalı.
// PawCoin HESAP başına (aynı ödül başka hayvanla alındıysa bu hayvanda pawcoin 0, yalnızca XP); XP ve rozet hayvan başına (20261004103000).

import { supabase } from '@/lib/supabase';

// ── Tipler (sunucu JSON'u) ───────────────────────────────────────────────────
export interface PetLevel { level: number; xp: number; level_start: number; level_next: number; name: string }

export interface DailyQuest {
    key: string; title: string; description: string; why: string; how: string; icon: string; category: string; unit: string;
    target: number; progress: number; completed: boolean; pawcoin: number; xp: number;
    /** Bu görevin bugünkü PawCoin'u başka bir hayvanla alındı (bu hayvan yalnızca XP kazanır). */
    coin_shared: boolean;
    /** Kısa durum (sunucu): aşıda "12 gün kaldı" / "3 gün gecikti", pasaportta "2 bilgi eksik", acil kişide "Henüz eklenmedi". */
    hint: string | null;
    /** '/yol' ya da özel eylem: 'walk' (yürüyüş paneli), 'care:meal' | 'care:water' | 'care:play' (bakım kaydı). */
    route: string; self_report: boolean; scope: 'core' | 'pool'; can_reroll: boolean;
    /** Son 7 gün: o gün bu görev verildi mi, tamamlandı mı (eskiden yeniye). */
    history: { date: string; given: boolean; done: boolean }[];
}

export interface WeekGoal { key: string; label: string; target: number; progress: number }
export interface WeekChest {
    week_start: string; goals: WeekGoal[]; ready: boolean; opened: boolean; days_left: number;
    /** Bu haftanın sandık PawCoin'u ve çerçevesi başka bir hayvanın sandığıyla alındı. */
    shared: boolean;
    reward: { pawcoin: number; xp: number; perk_key: string | null; perk_name: string | null };
}

export interface Awarded { kind: 'quest' | 'day' | 'adventure' | 'program'; key?: string; label: string; pawcoin: number; xp: number }
export interface NewBadge { key: string; title: string; icon: string; pawcoin: number; xp: number }

export interface LessonCard { id: string; title: string; summary: string; emoji: string; tint: string; read_minutes: number; category?: string; read: boolean }

export interface QuestCenter {
    pet: { id: string; name: string; species: 'dog' | 'cat' | 'other'; avatar_url: string | null; level: PetLevel };
    balance: number; today_pawcoin: number; day: string;
    quests: DailyQuest[]; done: number; total: number;
    day_bonus: { earned: boolean; pawcoin: number; xp: number };
    week: { days: { date: string; done: number; total: number }[]; chest: WeekChest; streak_weeks: number };
    adventure: { month: string; title: string; emoji: string; days_left: number; current_stage: number; stages: number; completed: boolean } | null;
    program: { key: string; title: string; emoji: string; steps_done: number; total: number; today_done: boolean } | null;
    next_badge: { key: string; title: string; icon: string; current: number; target: number; unit: string } | null;
    lesson: LessonCard | null;
    awarded: Awarded[]; new_badges: NewBadge[];
}

export type BadgeCategory = 'yuruyus' | 'saglik' | 'egitim' | 'sosyal' | 'kesif' | 'ozel';
export interface BadgeItem {
    key: string; family: string; tier: number; category: BadgeCategory; title: string; description: string; icon: string;
    threshold: number; unit: string; current: number | null; pawcoin: number; xp: number; earned_at: string | null; featured: boolean; hidden: boolean;
}

export interface AdventureStage {
    index: number; title: string; story: string; emoji: string; pawcoin: number; xp: number;
    unlocked: boolean; done: boolean; claimed: boolean; goals: { label: string; progress: number; target: number }[];
}
export interface Adventure {
    month: string; title: string; subtitle: string; story: string; emoji: string; tint: string; days_left: number;
    badge: { key: string; title: string; icon: string; earned: boolean }; final_pawcoin: number;
    current_stage: number; completed: boolean; stages: AdventureStage[]; awarded: Awarded[];
    month_pawcoin: number; month_badges: { key: string; title: string; icon: string }[];
}

export interface Lesson extends LessonCard { body: { h?: string; p: string }[]; tip: string | null; source: string; vet_reviewed: boolean }

export interface ProgramCard {
    key: string; title: string; subtitle: string; description: string; tags: string[]; emoji: string; tint: string;
    days: number; pawcoin: number; xp: number; badge: { title: string; icon: string } | null;
    status: 'active' | 'left' | 'done' | null; steps_done: number; for_you: boolean;
}
export interface ProgramDetail extends Omit<ProgramCard, 'days' | 'for_you'> {
    total: number; today_done: boolean | null; vet_reviewed: boolean; other_active: { key: string; title: string } | null;
    steps: { index: number; title: string; body: string; tip: string | null; done: boolean; current: boolean }[];
}

export type TeamKind = 'walk_km' | 'walk_days' | 'care_days' | 'lessons';
export interface TeamMember { id: string; name: string | null; avatar_url: string | null; status: 'invited' | 'accepted'; amount: number; me: boolean }
export interface TeamGoal {
    id: string; title: string; kind: TeamKind; target: number; total: number; status: 'active' | 'completed' | 'expired';
    starts_at: string; ends_at: string; days_left: number; members: TeamMember[]; is_creator: boolean; reward: { pawcoin: number; xp: number };
    /** Kabul eden üye sayısı; hedef en az 2 kişiyle tamamlanır. */
    accepted: number;
}
export interface TeamInvite { id: string; title: string; kind: TeamKind; target: number; ends_at: string; creator: string | null; members: TeamMember[] }
export interface Duel {
    id: string; status: 'pending' | 'active' | 'completed' | 'declined' | 'cancelled'; starts_at: string | null; ends_at: string | null;
    duration_days: number; winner_id: string | null; i_am_creator: boolean;
    opponent: { id: string; name: string | null; avatar_url: string | null } | null; my_km: number; their_km: number;
    /** Sonuçlanınca bana yazılan PawCoin (en az 1 km yürüdüysem); yoksa null. */
    my_reward: number | null;
}
/** social_coin_left: bu hafta Birlikte (ortak hedef + düello) ödüllerinden kalan PawCoin (haftada en çok 120). */
export interface TeamView { goals: TeamGoal[]; invites: TeamInvite[]; duels: Duel[]; social_coin_left: number }
export interface Friend { id: string; name: string | null; avatar_url: string | null }

/** Ortak hedef türünün birimi ve adı (ekranlar tek yerden okur). */
export const TEAM_KINDS: Record<TeamKind, { label: string; unit: string; group: 'Yürüyüş' | 'Sağlık' | 'Eğitim' | 'Diğer' }> = {
    walk_km: { label: 'Toplam yürüyüş mesafesi', unit: 'km', group: 'Yürüyüş' },
    walk_days: { label: 'Yürüyüş yapılan gün', unit: 'gün', group: 'Diğer' },
    care_days: { label: 'Öğün ve su eksiksiz gün', unit: 'gün', group: 'Sağlık' },
    lessons: { label: 'Okunan bilgi kartı', unit: 'bilgi', group: 'Eğitim' },
};

// ── Çağrılar ────────────────────────────────────────────────────────────────
async function rpc<T>(fn: string, args: Record<string, unknown> | undefined, fallback: string): Promise<T> {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) throw new Error(error.message?.replace(/^.*?: /, '') || fallback);
    return data as T;
}

/** Görev Merkezi'ndeki veriyi değiştiren bir eylemden sonra açık ekranları tazelet. */
export const QUESTS_CHANGED = 'moffi-quests-changed';
const changed = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event(QUESTS_CHANGED)); };

export const questService = {
    center: (petId: string) => rpc<QuestCenter>('quest_center', { p_pet: petId }, 'Görevler yüklenemedi.'),
    async reroll(petId: string, key: string) {
        const r = await rpc<{ key: string }>('quest_reroll', { p_pet: petId, p_key: key }, 'Görev değiştirilemedi.');
        changed();
        return r;
    },
    async openChest(petId: string) {
        const r = await rpc<{ pawcoin: number; xp: number; perk_name: string | null; perk_expires_at: string | null }>('quest_open_chest', { p_pet: petId }, 'Sandık açılamadı.');
        changed();
        return r;
    },

    badges: (petId: string) => rpc<{ badges: BadgeItem[]; earned: number }>('quest_badges', { p_pet: petId }, 'Rozetler yüklenemedi.'),
    featureBadge: (petId: string, key: string, on: boolean) => rpc<null>('quest_badge_feature', { p_pet: petId, p_key: key, p_on: on }, 'Vitrin güncellenemedi.'),

    adventure: (petId: string) => rpc<{ current: Adventure | null; past: { month: string; title: string; icon: string; earned: boolean }[] }>(
        'quest_adventure', { p_pet: petId }, 'Macera yüklenemedi.'),

    lessonsFeed: (petId: string | null) => rpc<{ today: LessonCard | null; featured: LessonCard[] | null; recent: LessonCard[] | null }>(
        'lessons_feed', { p_pet: petId }, 'Bilgiler yüklenemedi.'),
    lesson: (id: string) => rpc<Lesson | null>('lesson_view', { p_id: id }, 'Bilgi yüklenemedi.'),
    async markLessonRead(id: string, petId: string | null) {
        const r = await rpc<{ xp: number }>('lesson_mark_read', { p_id: id, p_pet: petId }, 'Kaydedilemedi.');
        changed();
        return r;
    },

    programs: (petId: string) => rpc<ProgramCard[]>('programs_list', { p_pet: petId }, 'Programlar yüklenemedi.'),
    program: (petId: string, key: string) => rpc<ProgramDetail>('program_view', { p_pet: petId, p_key: key }, 'Program yüklenemedi.'),
    async startProgram(petId: string, key: string) {
        await rpc<null>('program_start', { p_pet: petId, p_key: key }, 'Program başlatılamadı.');
        changed();
    },
    async completeProgramStep(petId: string, key: string) {
        const r = await rpc<{ steps_done: number; total: number; completed: boolean; xp: number; final_pawcoin: number; final_xp: number }>(
            'program_step_done', { p_pet: petId, p_key: key }, 'Adım kaydedilemedi.');
        changed();
        return r;
    },
    async leaveProgram(petId: string, key: string) {
        await rpc<null>('program_leave', { p_pet: petId, p_key: key }, 'Program bırakılamadı.');
        changed();
    },

    friends: () => rpc<Friend[]>('team_friend_candidates', undefined, 'Arkadaşlar yüklenemedi.'),
    team: () => rpc<TeamView>('team_goals_view', undefined, 'Ortak hedefler yüklenemedi.'),
    createTeamGoal: (input: { title: string; kind: TeamKind; target: number; days: number; members: string[] }) =>
        rpc<string>('team_goal_create', { p_title: input.title, p_kind: input.kind, p_target: input.target, p_days: input.days, p_members: input.members },
            'Hedef oluşturulamadı.'),
    respondTeamGoal: (id: string, accept: boolean) => rpc<null>('team_goal_respond', { p_goal: id, p_accept: accept }, 'Yanıt kaydedilemedi.'),
    leaveTeamGoal: (id: string) => rpc<null>('team_goal_leave', { p_goal: id }, 'Hedeften ayrılınamadı.'),

    walkGoal: (petId: string) => rpc<{ goal_km: number; auto_km: number; manual_km: number | null }>('pet_walk_goal', { p_pet: petId }, 'Hedef okunamadı.'),
    setWalkGoal: (petId: string, km: number | null) =>
        rpc<{ goal_km: number; auto_km: number; manual_km: number | null }>('set_pet_walk_goal', { p_pet: petId, p_km: km }, 'Hedef kaydedilemedi.'),
};
