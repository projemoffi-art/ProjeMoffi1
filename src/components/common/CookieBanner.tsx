"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Giriş, ilk kurulum, işletme başvurusu ve yönetici panelinde gösterilmez (alttaki ana düğmelerin üstüne biniyordu;
// karşılama ekranında kabul bilgisi zaten var); ana sayfaya geçince bir kez çıkar.
const QUIET_ROUTES = ["/", "/onboarding", "/business-register", "/admin", "/demo"];

const KEY = "moffi_cookie_consent";
const listeners = new Set<() => void>();
function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
function readConsent() {
    try { return !!localStorage.getItem(KEY); } catch { return true; }
}

export default function CookieBanner() {
    const pathname = usePathname() ?? "";
    // Sunucuda ve ilk çizimde "kabul edilmiş" sayılır (bant yanıp sönmesin); tarayıcıda cihaz kaydı okunur.
    const consented = useSyncExternalStore(subscribe, readConsent, () => true);

    const accept = () => {
        try { localStorage.setItem(KEY, "true"); } catch { /* depolama kapalı */ }
        listeners.forEach(fn => fn());
    };

    const quiet = QUIET_ROUTES.some(r => (r === "/" ? pathname === "/" : pathname.startsWith(r)));
    const visible = !consented && !quiet;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    role="dialog"
                    aria-label="Çerez bildirimi"
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 60, opacity: 0 }}
                    className="theme-vet fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] z-40 px-4 pointer-events-none"
                >
                    <div className="max-w-md mx-auto pointer-events-auto bg-card border border-card-border rounded-2xl p-4 shadow-xl flex items-center gap-3">
                        <p className="flex-1 text-xs leading-relaxed text-secondary">
                            Uygulamanın çalışması ve performansı için çerez kullanıyoruz. <a href="/cookies" className="font-semibold text-accent underline">Çerez Politikası</a>
                        </p>
                        <button onClick={accept} className="shrink-0 h-10 px-5 rounded-full bg-accent text-white text-sm font-bold active:scale-95 transition">Tamam</button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
