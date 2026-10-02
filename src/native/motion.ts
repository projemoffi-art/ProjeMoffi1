import { isBrowser } from "./platform";

// Hareket (ivmeölçer) ve yön sensörleri. iOS 13+ izni kullanıcının dokunuşuyla AYNI çağrı yığınında
// istenmelidir; bu yüzden requestPermission'ı bir tıklama işleyicisinden çağır.

export type MotionSample = {
    /** Yerçekimi dahil ivme (m/s²) */
    x: number;
    y: number;
    z: number;
    timestamp: number;
};

export type OrientationSample = { alpha: number | null; beta: number | null; gamma: number | null };

type PermissionCapable = { requestPermission?: () => Promise<"granted" | "denied"> };

export function isMotionSupported(): boolean {
    return isBrowser() && "DeviceMotionEvent" in window;
}

/** Hareket ve yön sensörü izni. İzin gerekmeyen cihazlarda true döner. */
export async function requestPermission(): Promise<boolean> {
    if (!isBrowser()) return false;
    let ok = true;
    for (const ctor of [window.DeviceMotionEvent, window.DeviceOrientationEvent] as unknown as (PermissionCapable | undefined)[]) {
        if (typeof ctor?.requestPermission === "function") {
            try { ok = (await ctor.requestPermission()) === "granted" && ok; } catch { ok = false; }
        }
    }
    return ok;
}

/** İvmeölçer örnekleri. Dönen fonksiyon dinlemeyi durdurur. */
export function onMotion(cb: (s: MotionSample) => void): () => void {
    if (!isMotionSupported()) return () => {};
    const handler = (e: DeviceMotionEvent) => {
        const a = e.accelerationIncludingGravity;
        if (!a || a.x == null || a.y == null || a.z == null) return;
        cb({ x: a.x, y: a.y, z: a.z, timestamp: Date.now() });
    };
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
}

/** Cihaz yönü (eğim). Dönen fonksiyon dinlemeyi durdurur. */
export function onOrientation(cb: (s: OrientationSample) => void): () => void {
    if (!isBrowser() || !("DeviceOrientationEvent" in window)) return () => {};
    const handler = (e: DeviceOrientationEvent) => cb({ alpha: e.alpha, beta: e.beta, gamma: e.gamma });
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
}
