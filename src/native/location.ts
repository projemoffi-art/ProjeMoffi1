import { isBrowser } from "./platform";

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

function toOptions(o: LocationOptions = {}, defaultTimeoutMs: number): PositionOptions {
    return { enableHighAccuracy: o.highAccuracy ?? false, timeout: o.timeoutMs ?? defaultTimeoutMs, maximumAge: o.maxAgeMs ?? 0 };
}

export function isSupported(): boolean {
    return isBrowser() && "geolocation" in navigator;
}

/** İzin durumu, sormadan. Tarayıcı bildirmiyorsa "unknown". */
export async function permission(): Promise<"granted" | "denied" | "prompt" | "unknown"> {
    if (!isSupported()) return "denied";
    try {
        const s = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        return s.state;
    } catch {
        return "unknown";
    }
}

/** İzin durumunu verir ve kullanıcı ayarlardan değiştirirse tekrar bildirir. Dönen fonksiyon dinlemeyi durdurur. */
export function watchPermission(cb: (state: "granted" | "denied" | "prompt" | "unknown") => void): () => void {
    let stopped = false;
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
export function getCurrent(options?: LocationOptions): Promise<GeoFix> {
    return new Promise((resolve, reject) => {
        if (!isSupported()) return reject(new LocationError("unsupported"));
        navigator.geolocation.getCurrentPosition(p => resolve(toFix(p)), e => reject(toError(e)), toOptions(options, 10000));
    });
}

/** Tek seferlik konum; alınamazsa null (hata ayrıntısı gerekmeyen yerler için). */
export async function getCurrentOrNull(options?: LocationOptions): Promise<GeoFix | null> {
    try { return await getCurrent(options); } catch { return null; }
}

/** Sürekli konum takibi (ön planda). Varsayılan zaman aşımı yok (sinyal gelene kadar bekler).
 *  Dönen fonksiyon takibi durdurur. */
export function watch(onFix: (fix: GeoFix) => void, onError: (err: LocationError) => void, options?: LocationOptions): () => void {
    if (!isSupported()) {
        onError(new LocationError("unsupported"));
        return () => {};
    }
    const id = navigator.geolocation.watchPosition(p => onFix(toFix(p)), e => onError(toError(e)), toOptions(options, Infinity));
    return () => navigator.geolocation.clearWatch(id);
}
