// Faz 23 — Profil Aura/Neon çerçeveleri (ProfileHeader.tsx/SettingsDrawer.tsx'te
// zaten var olan, gerçek Prime-kilitli özellik) artık Ödül Merkezi'nden PP ile
// GEÇİCİ olarak da açılabiliyor (bkz. `vip_perks`/`user_active_perks`,
// migration add_vip_temporary_perks_system). Bu dosya, "bu çerçeveyi kullanmaya
// gerçekten hakkı var mı" kontrolünü TEK bir yerde topluyor — hem
// ProfileHeader hem SettingsDrawer aynı fonksiyonu çağırıyor, iki ayrı yerde
// aynı mantığın tekrar edip birbirinden habersizleşmesi (bkz. CLAUDE.md Bölüm 7)
// riski olmasın diye.

export type FrameStyle = 'minimal' | 'glass' | 'neon' | 'metal';

const PREMIUM_FRAME_PERK_KEY: Partial<Record<FrameStyle, string>> = {
    neon: 'frame_neon',
    metal: 'frame_metal',
};

// `activePerks`: QuestEngineContext'ten gelen, perk_key -> ISO expiresAt haritası
// (sadece SÜRESİ GEÇMEMİŞ satırlar içerir, bkz. getActivePerks).
export function isFrameUnlocked(style: FrameStyle, opts: { isPrime: boolean; activePerks: Record<string, string> }): boolean {
    const requiredPerk = PREMIUM_FRAME_PERK_KEY[style];
    if (!requiredPerk) return true; // minimal/glass her zaman serbest
    return opts.isPrime || !!opts.activePerks[requiredPerk];
}

// Kullanıcının SEÇTİĞİ stil hak edilmemişse (örn. Prime iptal olmuş veya geçici
// VIP süresi dolmuşsa) sessizce 'minimal'e düşürür — istemcinin gönderdiği
// değeri kör kör güvenerek render etmek yerine burada gerçek bir yeniden
// doğrulama yapılıyor.
export function resolveFrameStyle(requested: FrameStyle | undefined, opts: { isPrime: boolean; activePerks: Record<string, string> }): FrameStyle {
    const style = requested || 'minimal';
    return isFrameUnlocked(style, opts) ? style : 'minimal';
}

export const FRAME_CLASSES: Record<FrameStyle, Record<'sm' | 'md' | 'lg', string>> = {
    minimal: {
        sm: 'border-2 border-background',
        md: 'border-[3px] border-background',
        lg: 'border-[6px] border-background bg-card shadow-moffi-card',
    },
    glass: {
        sm: 'border-2 border-white/40 bg-black/10 dark:bg-white/10 backdrop-blur-md',
        md: 'border-[3px] border-white/40 shadow-[0_4px_16px_rgba(255,255,255,0.15)] bg-black/10 dark:bg-white/10 backdrop-blur-md',
        lg: 'border-4 border-white/40 shadow-[0_8px_32px_rgba(255,255,255,0.15)] bg-black/10 dark:bg-white/10 backdrop-blur-md',
    },
    neon: {
        sm: 'border-2 border-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.8)]',
        md: 'border-[3px] border-[#00FFFF] shadow-[0_0_16px_rgba(0,255,255,0.8)]',
        lg: 'border-[6px] border-[#00FFFF] shadow-[0_0_30px_rgba(0,255,255,0.8)] bg-white dark:bg-black',
    },
    metal: {
        sm: 'border-2 border-gray-400 bg-gradient-to-br from-gray-300 via-gray-600 to-gray-900',
        md: 'border-[3px] border-gray-400 bg-gradient-to-br from-gray-300 via-gray-600 to-gray-900',
        lg: 'border-[6px] border-gray-400 bg-gradient-to-br from-gray-300 via-gray-600 to-gray-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.8),_0_10px_25px_rgba(0,0,0,0.5)]',
    },
};

export function formatRemaining(expiresAtIso: string): string {
    const ms = new Date(expiresAtIso).getTime() - Date.now();
    if (ms <= 0) return 'süresi doldu';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours < 1) return `${Math.max(1, Math.floor(ms / (1000 * 60)))} dk kaldı`;
    if (hours < 24) return `${hours} saat kaldı`;
    return `${Math.floor(hours / 24)} gün ${hours % 24} saat kaldı`;
}
