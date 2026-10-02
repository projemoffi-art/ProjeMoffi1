import { isBrowser, isNative } from "./platform";

// Anlık bildirim aboneliği. Web: service worker + Web Push (VAPID). Dönen abonelik, sunucudaki
// push_subscriptions satırına yazılacak bilgidir.
// Telefon uygulaması: APNs/FCM jetonu gerekir (Firebase projesi + Apple anahtarı + sunucuda gönderim);
// bunlar kurulana kadar telefonda bildirim aboneliği "desteklenmiyor" döner (CLAUDE.md Bölüm 12).

export type PushPermission = "granted" | "denied" | "default" | "unsupported";
export type PushSubscriptionInfo = { endpoint: string; p256dh?: string; auth?: string };

export function isSupported(): boolean {
    if (isNative()) return false;
    return isBrowser() && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function permission(): PushPermission {
    if (!isSupported()) return "unsupported";
    return Notification.permission;
}

function urlBase64ToUint8Array(base64: string) {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const raw = window.atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export async function currentSubscription(): Promise<PushSubscriptionInfo | null> {
    if (!isSupported()) return null;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return null;
    const j = sub.toJSON();
    return { endpoint: sub.endpoint, p256dh: j.keys?.p256dh, auth: j.keys?.auth };
}

/** İzin ister ve abone olur. İzin verilmezse null. */
export async function subscribe(vapidPublicKey: string): Promise<{ permission: PushPermission; subscription: PushSubscriptionInfo | null }> {
    if (!isSupported()) return { permission: "unsupported", subscription: null };
    const result = await Notification.requestPermission();
    if (result !== "granted") return { permission: result, subscription: null };
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) });
    const j = sub.toJSON();
    return { permission: "granted", subscription: { endpoint: sub.endpoint, p256dh: j.keys?.p256dh, auth: j.keys?.auth } };
}

/** Aboneliği kaldırır; kaldırılan aboneliğin adresini döner. */
export async function unsubscribe(): Promise<string | null> {
    if (!isSupported()) return null;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    const endpoint = sub?.endpoint ?? null;
    if (sub) await sub.unsubscribe();
    if (reg) await reg.unregister();
    return endpoint;
}
