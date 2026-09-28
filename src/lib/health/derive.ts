// Sağlık Karnesi'nin tüm "durum" hesapları burada. Hiçbir durum elle girilmez; hepsi kayıtlardan
// türetilir (rapor: "Sağlık: İyi" gibi uydurma etiket yok).

import { addDaysKey } from '@/lib/appointmentTime';
import type {
    HealthBundle, HealthSpecies, Medication, ParasiteKind, ParasiteTreatment, VaccineDefinition, VaccineRecord, WeightLog,
} from '@/types/health';

export function speciesOf(pet: { type?: string | null } | null | undefined): HealthSpecies {
    const t = String(pet?.type || '').toLowerCase();
    return t === 'cat' ? 'cat' : t === 'dog' ? 'dog' : 'other';
}

export type DueStatus = 'overdue' | 'due_soon' | 'current' | 'planned' | 'unplanned' | 'done';

/** Yaklaşıyor sayılan pencere (gün). */
export const DUE_SOON_DAYS = 30;

export function daysBetween(fromKey: string, toKey: string): number {
    const [a, b] = [fromKey, toKey].map(k => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); });
    return Math.round((b - a) / 86400000);
}

export function addMonthsKey(dateKey: string, months: number): string {
    const [y, m, d] = dateKey.split('-').map(Number);
    const target = new Date(Date.UTC(y, m - 1 + months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(d, lastDay));
    return target.toISOString().slice(0, 10);
}

function statusFor(dueDate: string | null, hasDone: boolean, today: string): { status: DueStatus; daysLeft: number | null } {
    if (!dueDate) return { status: hasDone ? 'done' : 'unplanned', daysLeft: null };
    const daysLeft = daysBetween(today, dueDate);
    if (daysLeft < 0) return { status: 'overdue', daysLeft };
    if (daysLeft <= DUE_SOON_DAYS) return { status: 'due_soon', daysLeft };
    return { status: hasDone ? 'current' : 'planned', daysLeft };
}

// --- Aşılar -------------------------------------------------------------

export interface VaccineRow {
    key: string;
    name: string;
    definition: VaccineDefinition | null;
    isCore: boolean;
    last: VaccineRecord | null;
    plan: VaccineRecord | null;
    dueDate: string | null;
    status: DueStatus;
    daysLeft: number | null;
    history: VaccineRecord[];
}

export function vaccineRows(definitions: VaccineDefinition[], vaccines: VaccineRecord[], today: string): VaccineRow[] {
    const groups = new Map<string, VaccineRecord[]>();
    for (const v of vaccines) {
        const key = v.definitionId || `custom:${v.name.trim().toLocaleLowerCase('tr-TR')}`;
        groups.set(key, [...(groups.get(key) || []), v]);
    }
    const build = (key: string, name: string, def: VaccineDefinition | null): VaccineRow => {
        const recs = groups.get(key) || [];
        const done = recs.filter(r => r.status === 'completed' && r.dateAdministered)
            .sort((a, b) => (b.dateAdministered || '').localeCompare(a.dateAdministered || ''));
        const plans = recs.filter(r => r.status === 'pending' && r.nextDueDate)
            .sort((a, b) => (a.nextDueDate || '').localeCompare(b.nextDueDate || ''));
        const last = done[0] || null;
        // Plandan sonra yapılmış bir doz varsa plan geçersizdir (o doz planı karşılamıştır).
        const plan = plans.find(p => !last || (last.dateAdministered || '') < p.createdAt.slice(0, 10)) || null;
        const dueDate = plan?.nextDueDate || last?.nextDueDate || null;
        return { key, name, definition: def, isCore: def?.isCore ?? false, last, plan, dueDate,
            ...statusFor(dueDate, !!last, today), history: done };
    };
    const rows = definitions.map(d => build(d.id, d.name, d));
    for (const [key, recs] of groups) {
        if (!key.startsWith('custom:')) {
            if (!definitions.some(d => d.id === key)) rows.push(build(key, recs[0].name, null));
            continue;
        }
        rows.push(build(key, recs[0].name, null));
    }
    return rows;
}

// --- Parazit ------------------------------------------------------------

export const PARASITE_LABEL: Record<ParasiteKind, string> = {
    internal: 'İç parazit', external: 'Dış parazit', combined: 'İç ve dış parazit',
};
/** Öneri aralığı (ay); kullanıcı sonraki tarihi her zaman değiştirebilir, ürüne göre değişir. */
export const PARASITE_SUGGESTED_MONTHS: Record<ParasiteKind, number> = { internal: 3, external: 1, combined: 1 };

export interface ParasiteRow {
    kind: 'internal' | 'external';
    last: ParasiteTreatment | null;
    plan: ParasiteTreatment | null;
    dueDate: string | null;
    status: DueStatus;
    daysLeft: number | null;
}

export function parasiteRows(treatments: ParasiteTreatment[], today: string): ParasiteRow[] {
    return (['internal', 'external'] as const).map(kind => {
        const mine = treatments.filter(t => t.kind === kind || t.kind === 'combined');
        const last = mine.filter(t => t.status === 'done' && t.appliedOn)
            .sort((a, b) => (b.appliedOn || '').localeCompare(a.appliedOn || ''))[0] || null;
        const plan = mine.filter(t => t.status === 'planned' && t.nextDueOn
                && (!last || (last.appliedOn || '') < t.createdAt.slice(0, 10)))
            .sort((a, b) => (a.nextDueOn || '').localeCompare(b.nextDueOn || ''))[0] || null;
        const dueDate = plan?.nextDueOn || last?.nextDueOn || null;
        return { kind, last, plan, dueDate, ...statusFor(dueDate, !!last, today) };
    });
}

// --- İlaçlar ------------------------------------------------------------

export function isMedicationActive(m: Medication, today: string) {
    return m.isActive && (!m.endDate || m.endDate >= today);
}

export function medicationDaysLeft(m: Medication, today: string): number | null {
    return m.endDate ? daysBetween(today, m.endDate) : null;
}

export interface DoseSlot { medication: Medication; slot: string; given: boolean }

export function todayDoseSlots(bundle: HealthBundle, today: string): DoseSlot[] {
    const given = new Set(bundle.doses.filter(d => d.doseDate === today).map(d => `${d.medicationId}|${d.slot}`));
    return bundle.medications
        .filter(m => isMedicationActive(m, today) && m.doseTimes.length > 0)
        .flatMap(m => [...m.doseTimes].sort().map(slot => ({ medication: m, slot, given: given.has(`${m.id}|${slot}`) })));
}

// --- Kilo ---------------------------------------------------------------

export interface WeightSummary { latest: WeightLog | null; change: number | null; changeSince: string | null }

export function weightSummary(weights: WeightLog[], today: string): WeightSummary {
    if (weights.length === 0) return { latest: null, change: null, changeSince: null };
    const sorted = [...weights].sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));
    const latest = sorted[sorted.length - 1];
    const cutoff = addDaysKey(today, -90);
    const base = [...sorted].reverse().find(w => w.measuredOn <= cutoff && w.id !== latest.id)
        || (sorted.length > 1 ? sorted[0] : null);
    if (!base || base.id === latest.id) return { latest, change: null, changeSince: null };
    return { latest, change: Math.round((latest.weightKg - base.weightKg) * 10) / 10, changeSince: base.measuredOn };
}

// --- Yaklaşanlar ve genel durum ------------------------------------------

export interface UpcomingItem {
    id: string;
    kind: 'vaccine' | 'parasite' | 'appointment';
    title: string;
    date: string;
    daysLeft: number;
    href: string;
}

export function upcomingItems(bundle: HealthBundle, appointments: any[], today: string): UpcomingItem[] {
    const items: UpcomingItem[] = [];
    for (const r of vaccineRows(bundle.definitions, bundle.vaccines, today)) {
        if (r.dueDate && r.daysLeft !== null) {
            items.push({ id: `v-${r.key}`, kind: 'vaccine', title: r.name, date: r.dueDate, daysLeft: r.daysLeft, href: '/health/asilar' });
        }
    }
    for (const r of parasiteRows(bundle.parasites, today)) {
        if (r.dueDate && r.daysLeft !== null) {
            items.push({ id: `p-${r.kind}`, kind: 'parasite', title: `${PARASITE_LABEL[r.kind]} uygulaması`, date: r.dueDate, daysLeft: r.daysLeft, href: '/health/parazit' });
        }
    }
    for (const a of appointments) {
        if (!['pending', 'confirmed'].includes(a.status) || !a.appointment_date) continue;
        const date = String(a.appointment_date).slice(0, 10);
        const daysLeft = daysBetween(today, date);
        if (daysLeft < 0) continue;
        const reason = String(a.reason || '').split('\n')[0].replace('Randevu tipi:', '').trim();
        items.push({ id: `a-${a.id}`, kind: 'appointment', title: reason || 'Veteriner randevusu', date, daysLeft, href: '/vet?view=appointments' });
    }
    return items.sort((a, b) => a.date.localeCompare(b.date));
}

export interface OverallStatus { tone: 'good' | 'attention' | 'overdue'; title: string; overdue: number; dueSoon: number }

export function overallStatus(bundle: HealthBundle, today: string): OverallStatus {
    const rows = [...vaccineRows(bundle.definitions, bundle.vaccines, today), ...parasiteRows(bundle.parasites, today)];
    const overdue = rows.filter(r => r.status === 'overdue').length;
    const dueSoon = rows.filter(r => r.status === 'due_soon' && (r.daysLeft ?? 99) <= 14).length;
    if (overdue > 0) return { tone: 'overdue', title: `${overdue} gecikmiş işin var`, overdue, dueSoon };
    if (dueSoon > 0) return { tone: 'attention', title: `${dueSoon} yaklaşan işin var`, overdue, dueSoon };
    return { tone: 'good', title: 'Her şey yolunda', overdue, dueSoon };
}

export function lastCheckupDate(bundle: HealthBundle): string | null {
    return bundle.records.map(r => r.date).sort().at(-1) || null;
}

// --- Zaman çizelgesi ----------------------------------------------------

export type TimelineKind = 'vaccine' | 'visit' | 'parasite' | 'medication' | 'weight' | 'document';

export interface TimelineEvent {
    id: string;
    kind: TimelineKind;
    date: string;
    title: string;
    subtitle: string | null;
    source: 'owner' | 'clinic';
    href: string | null;
}

export function timelineEvents(bundle: HealthBundle): TimelineEvent[] {
    const e: TimelineEvent[] = [];
    for (const v of bundle.vaccines) {
        if (v.status === 'completed' && v.dateAdministered) {
            e.push({ id: `v-${v.id}`, kind: 'vaccine', date: v.dateAdministered, title: v.name,
                subtitle: v.vetName || 'Aşı uygulandı', source: v.source, href: '/health/asilar' });
        }
    }
    for (const r of bundle.records) {
        e.push({ id: `r-${r.id}`, kind: 'visit', date: r.date, title: r.diagnosis,
            subtitle: r.clinicName || r.vetName, source: r.source, href: `/health/muayeneler/${r.id}` });
    }
    for (const p of bundle.parasites) {
        if (p.status === 'done' && p.appliedOn) {
            e.push({ id: `p-${p.id}`, kind: 'parasite', date: p.appliedOn, title: `${PARASITE_LABEL[p.kind]} uygulaması`,
                subtitle: p.product, source: p.source, href: '/health/parazit' });
        }
    }
    for (const m of bundle.medications) {
        if (m.startDate) {
            e.push({ id: `m-${m.id}`, kind: 'medication', date: m.startDate, title: m.name,
                subtitle: [m.dosage, m.prescribedBy].filter(Boolean).join(' · ') || 'İlaç başlandı', source: m.source, href: '/health/ilaclar' });
        }
    }
    for (const w of bundle.weights) {
        e.push({ id: `w-${w.id}`, kind: 'weight', date: w.measuredOn, title: `${formatKg(w.weightKg)} kg`,
            subtitle: 'Kilo ölçümü', source: w.source, href: '/health/kilo' });
    }
    for (const d of bundle.documents) {
        e.push({ id: `d-${d.id}`, kind: 'document', date: d.docDate, title: d.title,
            subtitle: 'Belge eklendi', source: 'owner', href: '/health/belgeler' });
    }
    return e.sort((a, b) => b.date.localeCompare(a.date));
}

// --- Biçimlendirme ------------------------------------------------------

export function formatKg(n: number) {
    return n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}

export function daysLeftText(daysLeft: number | null): string {
    if (daysLeft === null) return '';
    if (daysLeft < 0) return `${Math.abs(daysLeft)} gün gecikti`;
    if (daysLeft === 0) return 'Bugün';
    if (daysLeft === 1) return 'Yarın';
    return `${daysLeft} gün kaldı`;
}

/** Doğum tarihinden "3 yıl 6 ay"; yoksa kayıtlı yaş metni. */
export function ageText(birthday: string | undefined | null, fallback: string | number | undefined | null, today: string): string | null {
    if (birthday && /^\d{4}-\d{2}-\d{2}/.test(birthday)) {
        const [y, m, d] = birthday.slice(0, 10).split('-').map(Number);
        const [ty, tm, td] = today.split('-').map(Number);
        let months = (ty - y) * 12 + (tm - m) - (td < d ? 1 : 0);
        if (months < 0) return null;
        const years = Math.floor(months / 12); months %= 12;
        if (years === 0) return `${months} ay`;
        return months ? `${years} yıl ${months} ay` : `${years} yaş`;
    }
    if (fallback === null || fallback === undefined || fallback === '') return null;
    return /^\d+$/.test(String(fallback)) ? `${fallback} yaş` : String(fallback);
}
