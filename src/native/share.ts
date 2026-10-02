import { isBrowser } from "./platform";

export type ShareInput = { title?: string; text?: string; url?: string; files?: File[] };
export type ShareResult = "shared" | "cancelled" | "unsupported";

/** Sistemin paylaşım penceresi var mı (dosyalarla birlikte de sorulabilir). */
export function canShare(input?: ShareInput): boolean {
    if (!isBrowser() || typeof navigator.share !== "function") return false;
    if (input?.files?.length) return typeof navigator.canShare === "function" && navigator.canShare({ files: input.files });
    return true;
}

/** Sistemin paylaşım penceresini açar. Kullanıcı vazgeçerse "cancelled". */
export async function share(input: ShareInput): Promise<ShareResult> {
    if (!canShare(input)) return "unsupported";
    try {
        await navigator.share(input);
        return "shared";
    } catch {
        return "cancelled";
    }
}

/** Panoya kopyalar; başarı durumunu döner. */
export async function copyText(text: string): Promise<boolean> {
    if (!isBrowser() || !navigator.clipboard) return false;
    try {
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
