"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Moffi AI paneli. Ekranda kendi düğmesi yok; alt menünün ortasındaki düğme, kenar paneli ve diğer ekranlar
// 'open-ai-assistant' olayıyla açar. Giriş/kurulum ekranlarında ve giriş yapılmamışken yüklenmez.
const MoffiAssistant = dynamic(() => import("@/components/ai/MoffiAssistant").then(mod => mod.MoffiAssistant), { ssr: false });

const HIDDEN = ['/', '/onboarding', '/login', '/register', '/reset-password', '/business-register'];
const PUBLIC_PREFIXES = ['/p/', '/id/', '/verify/', '/invitation/'];

export function AIWidgetLoader() {
    const pathname = usePathname() || '';
    const { user } = useAuth();
    if (!user?.id || HIDDEN.includes(pathname) || PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return null;
    return <MoffiAssistant />;
}
