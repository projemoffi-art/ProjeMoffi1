// Yürüyüş ölçümlerinin tek kaynağı. Kaydedilmiş yürüyüşlerde kalori/süre/adım sunucudan gelir
// (finish_walk); canlı yürüyüşte aynı formül burada. Ekranlar kendi formülünü yazmaz.

const DEFAULT_PET_WEIGHT_KG = 15;

export function petWeightKg(pet: { weight?: unknown } | null | undefined): number {
    const parsed = parseFloat(String(pet?.weight ?? ''));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PET_WEIGHT_KG;
}

// public.walk_calories ile aynı: km × kg.
export function walkCalories(distanceKm: number, weightKg: number): number {
    return Math.max(0, Math.round(distanceKm * weightKg));
}

export function formatKm(km: number, digits = 2): string {
    return km.toFixed(digits).replace('.', ',');
}

export function formatClock(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function formatMinutes(totalMinutes: number): string {
    const m = Math.max(0, Math.round(totalMinutes));
    if (m < 60) return `${m} dk`;
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return rest ? `${h}s ${rest}dk` : `${h}s`;
}

export function formatSteps(steps: number | null | undefined): string {
    return steps && steps > 0 ? steps.toLocaleString('tr-TR') : '—';
}
