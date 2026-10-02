import { isNative } from "./platform";

// Titreşim geri bildirimi. Telefonda gerçek dokunsal motor (Capacitor Haptics; iPhone dahil),
// tarayıcıda navigator.vibrate (Android Chrome; iOS Safari ve masaüstü desteklemez, sessizce atlanır).
function vibrate(pattern: number | number[]) {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    try { navigator.vibrate(pattern); } catch { /* politika gereği reddedilebilir */ }
}

type Kind = "tap" | "success" | "celebrate" | "warn";

function nativeHaptic(kind: Kind) {
    import("@capacitor/haptics").then(async ({ Haptics, ImpactStyle, NotificationType }) => {
        if (kind === "tap") await Haptics.impact({ style: ImpactStyle.Light });
        else if (kind === "success") await Haptics.notification({ type: NotificationType.Success });
        else if (kind === "warn") await Haptics.notification({ type: NotificationType.Warning });
        else {
            await Haptics.notification({ type: NotificationType.Success });
            setTimeout(() => { Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}); }, 180);
        }
    }).catch(() => {});
}

const WEB: Record<Kind, number | number[]> = {
    tap: 10,
    success: [15, 40, 15],
    celebrate: [20, 30, 20, 30, 40],
    warn: [30, 20, 30],
};

const fire = (kind: Kind) => (isNative() ? nativeHaptic(kind) : vibrate(WEB[kind]));

export const haptics = {
    /** Küçük, nötr dokunuş: buton, sekme */
    tap: () => fire("tap"),
    /** İşlem tamam: satın alma, yürüyüş bitirme */
    success: () => fire("success"),
    /** Büyük kazanım: rozet, meydan okuma */
    celebrate: () => fire("celebrate"),
    /** Ters giden bir şey */
    warn: () => fire("warn"),
    /** Özel desen (ms). Telefonda toplam süre kadar tek titreşim. */
    pattern: (p: number | number[]) => {
        if (!isNative()) return vibrate(p);
        const duration = Array.isArray(p) ? p.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) : p;
        import("@capacitor/haptics").then(({ Haptics }) => Haptics.vibrate({ duration })).catch(() => {});
    },
};
