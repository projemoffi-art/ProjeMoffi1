import { isBrowser, isNative } from "./platform";

export type GeoFix = {
    lat: number;
    lng: number;
    /** metre */
    accuracy: number;
    /** m/s, cihaz bildirmezse null */
    speed: number | null;
    heading: number | null;
    timestamp: number;
};

export type LocationErrorCode = "denied" | "unavailable" | "timeout" | "unsupported";
export type PermissionState = "granted" | "denied" | "prompt" | "unknown";

export class LocationError extends Error {
    constructor(public code: LocationErrorCode, message?: string) {
        super(message || code);
    }
}

export type LocationOptions = {
    highAccuracy?: boolean;
    timeoutMs?: number;
    /** Önbellekteki konum en fazla bu kadar eski olabilir */
    maxAgeMs?: number;
};

export type WatchOptions = LocationOptions & {
    /** Telefonda ekran kapalıyken de takip et (yürüyüş). Tarayıcıda etkisiz. */
    background?: boolean;
};

function toFix(p: GeolocationPosition): GeoFix {
    return {
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        accuracy: p.coords.accuracy,
        speed: p.coords.speed,
        heading: p.coords.heading,
        timestamp: p.timestamp,
    };
}

function toError(e: GeolocationPositionError): LocationError {
    const code: LocationErrorCode = e.code === e.PERMISSION_DENIED ? "denied" : e.code === e.TIMEOUT ? "timeout" : "unavailable";
    return new LocationError(code, e.message);
}

function nativeError(e: unknown): LocationError {
    const msg = String((e as { message?: string; code?: string })?.message || (e as { code?: string })?.code || e);
    if (/denied|not.?authori|permission/i.test(msg)) return new LocationError("denied", msg);
    if (/timeout/i.test(msg)) return new LocationError("timeout", msg);
    return new LocationError("unavailable", msg);
}

function toOptions(o: LocationOptions = {}, defaultTimeoutMs: number): PositionOptions {
    return { enableHighAccuracy: o.highAccuracy ?? false, timeout: o.timeoutMs ?? defaultTimeoutMs, maximumAge: o.maxAgeMs ?? 0 };
}

export function isSupported(): boolean {
    return isNative() || (isBrowser() && "geolocation" in navigator);
}

/** Ekran kapalıyken takip mümkün mü (sadece telefon uygulamasında). */
export function supportsBackground(): boolean {
    return isNative();
}

async function nativePermission(): Promise<PermissionState> {
    const { Geolocation } = await import("@capacitor/geolocation");
    try {
        const s = await Geolocation.checkPermissions();
        return s.location === "granted" ? "granted" : s.location === "denied" ? "denied" : "prompt";
    } catch {
        return "unknown";
    }
}

/** İzin durumu, sormadan. Bilinmiyorsa "unknown". */
export async function permission(): Promise<PermissionState> {
    if (isNative()) return nativePermission();
    if (!isSupported()) return "denied";
    try {
        const s = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        return s.state;
    } catch {
        return "unknown";
    }
}

/** İzin durumunu verir ve kullanıcı ayarlardan değiştirirse tekrar bildirir. Dönen fonksiyon dinlemeyi durdurur. */
export function watchPermission(cb: (state: PermissionState) => void): () => void {
    let stopped = false;
    if (isNative()) {
        // Telefonda izin ayarlar uygulamasında değişir; uygulamaya dönüşte tekrar bak
        const check = () => nativePermission().then(s => { if (!stopped) cb(s); });
        check();
        let remove: (() => void) | null = null;
        import("@capacitor/app").then(({ App }) => App.addListener("resume", check)).then(h => {
            if (stopped) h.remove(); else remove = () => h.remove();
        });
        return () => { stopped = true; remove?.(); };
    }
    let status: PermissionStatus | null = null;
    if (!isSupported()) { cb("denied"); return () => {}; }
    navigator.permissions?.query({ name: "geolocation" as PermissionName })
        .then(s => {
            if (stopped) return;
            status = s;
            cb(s.state);
            s.onchange = () => { if (!stopped) cb(s.state); };
        })
        .catch(() => { if (!stopped) cb("unknown"); });
    return () => { stopped = true; if (status) status.onchange = null; };
}

/** Tek seferlik konum. Hata olursa LocationError fırlatır. */
export async function getCurrent(options?: LocationOptions): Promise<GeoFix> {
    if (isNative()) {
        const { Geolocation } = await import("@capacitor/geolocation");
        try {
            const p = await Geolocation.getCurrentPosition({
                enableHighAccuracy: options?.highAccuracy ?? false,
                timeout: options?.timeoutMs ?? 10000,
                maximumAge: options?.maxAgeMs ?? 0,
            });
            return {
                lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy,
                speed: p.coords.speed ?? null, heading: p.coords.heading ?? null, timestamp: p.timestamp,
            };
        } catch (e) {
            throw nativeError(e);
        }
    }
    return new Promise((resolve, reject) => {
        if (!isSupported()) return reject(new LocationError("unsupported"));
        navigator.geolocation.getCurrentPosition(p => resolve(toFix(p)), e => reject(toError(e)), toOptions(options, 10000));
    });
}

/** Tek seferlik konum; alınamazsa null (hata ayrıntısı gerekmeyen yerler için). */
export async function getCurrentOrNull(options?: LocationOptions): Promise<GeoFix | null> {
    try { return await getCurrent(options); } catch { return null; }
}

type BgLocation = { latitude: number; longitude: number; accuracy: number; speed: number | null; bearing: number | null; time: number | null };
type BgPlugin = {
    addWatcher(options: Record<string, unknown>, cb: (loc?: BgLocation, err?: { code?: string; message?: string }) => void): Promise<string>;
    removeWatcher(options: { id: string }): Promise<void>;
    openSettings(): Promise<void>;
};

/** Sürekli konum takibi. Varsayılan zaman aşımı yok (sinyal gelene kadar bekler).
 *  Telefonda `background: true` ile ekran kapalıyken de devam eder (kalıcı bildirim gösterilir).
 *  Dönen fonksiyon takibi durdurur. */
export function watch(onFix: (fix: GeoFix) => void, onError: (err: LocationError) => void, options?: WatchOptions): () => void {
    if (isNative()) {
        let stopped = false;
        let stopNative: (() => void) | null = null;
        (async () => {
            if (options?.background) {
                const { registerPlugin } = await import("@capacitor/core");
                const Bg = registerPlugin<BgPlugin>("BackgroundGeolocation");
                const id = await Bg.addWatcher(
                    {
                        backgroundTitle: "Moffi yürüyüşü sürüyor",
                        backgroundMessage: "Rotan ve mesafen kaydediliyor.",
                        requestPermissions: true,
                        stale: false,
                        distanceFilter: 0,
                    },
                    (loc, err) => {
                        if (err) { onError(err.code === "NOT_AUTHORIZED" ? new LocationError("denied", err.message) : nativeError(err)); return; }
                        if (loc) onFix({
                            lat: loc.latitude, lng: loc.longitude, accuracy: loc.accuracy,
                            speed: loc.speed, heading: loc.bearing, timestamp: loc.time ?? Date.now(),
                        });
                    },
                );
                stopNative = () => { Bg.removeWatcher({ id }); };
            } else {
                const { Geolocation } = await import("@capacitor/geolocation");
                const id = await Geolocation.watchPosition({ enableHighAccuracy: options?.highAccuracy ?? false }, (p, err) => {
                    if (err) { onError(nativeError(err)); return; }
                    if (p) onFix({
                        lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy,
                        speed: p.coords.speed ?? null, heading: p.coords.heading ?? null, timestamp: p.timestamp,
                    });
                });
                stopNative = () => { Geolocation.clearWatch({ id }); };
            }
            if (stopped) stopNative();
        })().catch(e => onError(nativeError(e)));
        return () => { stopped = true; stopNative?.(); };
    }
    if (!isSupported()) {
        onError(new LocationError("unsupported"));
        return () => {};
    }
    const id = navigator.geolocation.watchPosition(p => onFix(toFix(p)), e => onError(toError(e)), toOptions(options, Infinity));
    return () => navigator.geolocation.clearWatch(id);
}

/** Telefonun konum ayarlarını açar (izin reddedildiyse). Tarayıcıda etkisiz. */
export async function openSettings(): Promise<void> {
    if (!isNative()) return;
    const { registerPlugin } = await import("@capacitor/core");
    await registerPlugin<BgPlugin>("BackgroundGeolocation").openSettings();
}
