import { isBrowser } from "./platform";

type WakeLockSentinel = { release: () => Promise<void> };

/** Ekranı açık tutar. Dönen fonksiyon bırakır. Desteklenmiyorsa hiçbir şey yapmaz. */
export async function keepScreenAwake(): Promise<() => void> {
    if (!isBrowser() || !("wakeLock" in navigator)) return () => {};
    try {
        const lock = await (navigator as unknown as { wakeLock: { request: (t: "screen") => Promise<WakeLockSentinel> } }).wakeLock.request("screen");
        return () => { lock.release().catch(() => {}); };
    } catch {
        return () => {};
    }
}

/** Uygulama dışı bir adresi (harita, Spotify, belge) yeni pencerede / sistem tarayıcısında açar. */
export function openExternal(url: string) {
    if (!isBrowser()) return;
    window.open(url, "_blank", "noopener,noreferrer");
}

/** Uygulama ön plana gelince / arka plana geçince. Dönen fonksiyon dinlemeyi durdurur. */
export function onForegroundChange(cb: (inForeground: boolean) => void): () => void {
    if (!isBrowser()) return () => {};
    const handler = () => cb(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
}

export const isInForeground = () => !isBrowser() || document.visibilityState === "visible";

/** İnternet bağlantısı değişimi. Dönen fonksiyon dinlemeyi durdurur. */
export function onNetworkChange(cb: (online: boolean) => void): () => void {
    if (!isBrowser()) return () => {};
    const on = () => cb(true);
    const off = () => cb(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
}

export const isOnline = () => !isBrowser() || navigator.onLine;
