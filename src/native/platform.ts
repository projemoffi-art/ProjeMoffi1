// Uygulamanın nerede çalıştığı. Telefon özelliklerine (konum, sensör, paylaşım, bildirim…) sadece
// src/native üzerinden erişilir; Capacitor (Faz 4) gelince yalnızca bu klasörün içi değişir.

export type Platform = "web" | "ios" | "android";

type CapacitorGlobal = { isNativePlatform?: () => boolean; getPlatform?: () => string };

function capacitor(): CapacitorGlobal | undefined {
    if (typeof window === "undefined") return undefined;
    return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

export function isNative(): boolean {
    return !!capacitor()?.isNativePlatform?.();
}

export function platform(): Platform {
    const p = capacitor()?.getPlatform?.();
    return p === "ios" || p === "android" ? p : "web";
}

export const isBrowser = () => typeof window !== "undefined";
