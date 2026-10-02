import { isBrowser, isNative } from "./platform";

export type ShareInput = { title?: string; text?: string; url?: string; files?: File[] };
export type ShareResult = "shared" | "cancelled" | "unsupported";

/** Sistemin paylaşım penceresi var mı (dosyalarla birlikte de sorulabilir). */
export function canShare(input?: ShareInput): boolean {
    // Telefonda metin/bağlantı paylaşımı her zaman var; dosya paylaşımı (hikâye kartı) henüz bağlanmadı
    if (isNative()) return !input?.files?.length;
    if (!isBrowser() || typeof navigator.share !== "function") return false;
    if (input?.files?.length) return typeof navigator.canShare === "function" && navigator.canShare({ files: input.files });
    return true;
}

/** Sistemin paylaşım penceresini açar. Kullanıcı vazgeçerse "cancelled". */
export async function share(input: ShareInput): Promise<ShareResult> {
    if (!canShare(input)) return "unsupported";
    try {
        if (isNative()) {
            const { Share } = await import("@capacitor/share");
            await Share.share({ title: input.title, text: input.text, url: input.url, dialogTitle: input.title });
        } else {
            await navigator.share(input);
        }
        return "shared";
    } catch {
        return "cancelled";
    }
}

/** Panoya kopyalar; başarı durumunu döner. */
export async function copyText(text: string): Promise<boolean> {
    try {
        if (isNative()) {
            const { Clipboard } = await import("@capacitor/clipboard");
            await Clipboard.write({ string: text });
            return true;
        }
        if (!isBrowser() || !navigator.clipboard) return false;
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

/** Paylaş, olmazsa kopyala. Hangisinin olduğunu döner. */
export async function shareOrCopy(input: ShareInput & { copyText: string }): Promise<"shared" | "cancelled" | "copied" | "failed"> {
    const r = await share(input);
    if (r !== "unsupported") return r;
    return (await copyText(input.copyText)) ? "copied" : "failed";
}
