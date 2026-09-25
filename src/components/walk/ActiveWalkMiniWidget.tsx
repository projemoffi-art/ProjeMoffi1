"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Footprints, ChevronRight, X } from "lucide-react";
import { useActivity } from "@/context/ActivityContext";
import { haptics } from "@/lib/haptics";

function formatTime(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Baran'ın isteği: yürüyüş takibi arka planda (uygulama içinde gezinirken) çalışmaya
// devam etmeli VE kullanıcı bunu farklı bir ekrandayken de görebilmeli. GPS/zamanlayıcı
// zaten route'tan bağımsız, global `ActivityContext`'te çalışıyordu (bkz. CLAUDE.md) —
// eksik olan, bunu gösteren küçük bir "geri dön" göstergesiydi. Bu widget SADECE bunu
// sağlıyor; GERÇEK OS-seviyesi arka plan takibi (ekran kapalıyken/uygulama değişince)
// bir web uygulamasında mümkün değil — bu dürüstçe `/walk/tracking` sayfasındaki
// "Arka Planda" GPS durumu rozetiyle zaten belirtiliyor, burada yeniden vaat edilmiyor.
// NOT (Baran'ın Capacitor sorusu): bu widget SADECE uygulama ön plandayken, kendi
// sayfaları arasında görünüyor — uygulamadan çıkılınca (ana ekrana dönülünce) kaybolur,
// Capacitor'e sarmak bunu TEK BAŞINA değiştirmez. Uygulamadan çıkınca da görünen gerçek
// bir "canlı widget/bildirim" (iOS Live Activity, Android kalıcı bildirim gibi) AYRI,
// ek bir native eklenti gerektirir — ileride ayrıca ele alınmalı.
export function ActiveWalkMiniWidget() {
    const router = useRouter();
    const { walkData } = useActivity();

    // Baran'ın isteği: kullanıcı widget'ı rahatsız edici bulursa kapatabilmeli.
    // Sadece BU yürüyüş için kapanıyor — yeni bir yürüyüş başlayınca (yeni sessionId)
    // otomatik olarak tekrar görünür hale geliyor, sonsuza kadar gizli kalmıyor.
    const [dismissed, setDismissed] = useState(false);
    const lastSessionIdRef = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (walkData.sessionId !== lastSessionIdRef.current) {
            lastSessionIdRef.current = walkData.sessionId;
            setDismissed(false);
        }
    }, [walkData.sessionId]);

    const visible = walkData.isActive && !dismissed;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ type: "spring", damping: 26, stiffness: 300 }}
                    className="fixed top-4 left-4 right-4 z-[90]"
                >
                    <div
                        className={`w-full flex items-center gap-2.5 pl-4 pr-2 py-2.5 rounded-full shadow-xl border backdrop-blur-md ${
                            walkData.isPaused
                                ? "bg-slate-900/90 border-white/10"
                                : "bg-orange-500/95 border-orange-400/40"
                        }`}
                    >
                        <button
                            onClick={() => { haptics.tap(); router.push('/walk/tracking'); }}
                            className="flex items-center gap-2.5 flex-1 min-w-0 border-0 bg-transparent cursor-pointer active:opacity-80 transition-opacity"
                        >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${walkData.isPaused ? "bg-slate-400" : "bg-white animate-pulse"}`} />
                            <span className="text-white text-[12px] font-black truncate shrink-0">
                                {walkData.petName || "Yürüyüş"}
                            </span>
                            <span className="flex items-center gap-1 text-white/90 text-[11px] font-bold shrink-0 ml-auto">
                                {formatTime(walkData.time)}
                            </span>
                            {/* Baran'ın isteği: sadece km değil, adım da görünsün — aynı gerçek
                                ivmeölçer tabanlı sayaç (bkz. CLAUDE.md 8.19/8.20), km ile tutarlı. */}
                            <span className="flex items-center gap-1 text-white/90 text-[11px] font-bold shrink-0">
                                <Footprints className="w-3 h-3" /> {walkData.realSteps.toLocaleString('tr-TR')}
                            </span>
                            <span className="text-white/90 text-[11px] font-bold shrink-0">
                                {(walkData.distance / 1000).toFixed(2)} km
                            </span>
                            <ChevronRight className="w-4 h-4 text-white/70 shrink-0" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); haptics.tap(); setDismissed(true); }}
                            className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0 border-0 cursor-pointer active:scale-90 transition-transform"
                            title="Kapat"
                        >
                            <X className="w-3.5 h-3.5 text-white" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
