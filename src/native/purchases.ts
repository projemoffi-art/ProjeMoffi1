import { isNative, platform } from "./platform";

// Uygulama içi satın alma (App Store / Google Play) — RevenueCat. Sadece telefon uygulamasında çalışır;
// web'de isSupported() false. Satın almanın sonucu (Prime / PawCoin) sunucuya RevenueCat bildirimiyle gelir
// (/api/revenuecat/webhook); buradaki dönüş sadece arayüz içindir, yetki için kullanılmaz.

export type StoreOffer = {
    /** Mağazadaki ürün kimliği (store_products.product_id ile aynı) */
    productId: string;
    title: string;
    /** Mağazanın biçimlendirdiği fiyat, ör. "₺99,99" */
    price: string;
    kind: "subscription" | "consumable";
};

type RcPackage = { identifier: string; product: { identifier: string; title: string; priceString: string; productCategory?: string } };

let configuredFor: string | null = null;

function apiKey(): string | undefined {
    return platform() === "ios" ? process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY : process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY;
}

export function isSupported(): boolean {
    return isNative() && !!apiKey();
}

async function sdk(userId: string) {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    if (configuredFor === null) {
        await Purchases.configure({ apiKey: apiKey()!, appUserID: userId });
        configuredFor = userId;
    } else if (configuredFor !== userId) {
        await Purchases.logIn({ appUserID: userId });
        configuredFor = userId;
    }
    return Purchases;
}

async function currentPackages(userId: string): Promise<RcPackage[]> {
    const Purchases = await sdk(userId);
    const offerings = await Purchases.getOfferings();
    return (offerings.current?.availablePackages || []) as unknown as RcPackage[];
}

/** Mağazada satışta olan ürünler (RevenueCat "current offering"). */
export async function getOffers(userId: string): Promise<StoreOffer[]> {
    if (!isSupported()) return [];
    const packages = await currentPackages(userId);
    return packages.map(p => ({
        productId: p.product.identifier,
        title: p.product.title,
        price: p.product.priceString,
        kind: p.product.productCategory === "NON_SUBSCRIPTION" ? "consumable" : "subscription",
    }));
}

/** Satın alma penceresini açar. Kullanıcı vazgeçerse "cancelled". */
export async function purchase(userId: string, productId: string): Promise<"purchased" | "cancelled" | "failed"> {
    if (!isSupported()) return "failed";
    try {
        const Purchases = await sdk(userId);
        const pkg = (await currentPackages(userId)).find(p => p.product.identifier === productId);
        if (!pkg) return "failed";
        await Purchases.purchasePackage({ aPackage: pkg as never });
        return "purchased";
    } catch (e) {
        const err = e as { userCancelled?: boolean; code?: string };
        return err?.userCancelled || err?.code === "1" ? "cancelled" : "failed";
    }
}

/** Başka telefonda alınmış aboneliği geri yükler (Apple bunu zorunlu tutar). */
export async function restore(userId: string): Promise<boolean> {
    if (!isSupported()) return false;
    try {
        const Purchases = await sdk(userId);
        await Purchases.restorePurchases();
        return true;
    } catch {
        return false;
    }
}
