// Randevu saatleri veritabanında Türkiye duvar saati olarak UTC etiketiyle tutulur
// ("14:00" seçimi 14:00+00 olarak yazılır, bkz. CLAUDE.md 8.38). Gösterimde tarayıcının
// saat dilimine ÇEVRİLMEMELİ; UTC alanları doğrudan duvar saatidir.

export function wallParts(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateKey = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    return { dateKey, time, minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

export function toWallIso(dateKey: string, time: string) {
    return `${dateKey}T${time}:00+00:00`;
}

export function todayKey() {
    return new Date().toLocaleDateString('sv-SE');
}

export function addDaysKey(dateKey: string, days: number) {
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + days));
    return date.toISOString().slice(0, 10);
}

export function formatDateKeyTr(dateKey: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', weekday: 'long' }) {
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('tr-TR', { ...opts, timeZone: 'UTC' });
}
