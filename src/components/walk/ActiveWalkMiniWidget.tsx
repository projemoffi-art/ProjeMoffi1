"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, Footprints, ChevronRight } from "lucide-react";
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
export function ActiveWalkMiniWidget() {
    const router = useRouter();
    const { walkData, pauseWalk, resumeWalk } = useActivity();

    return (
        <AnimatePresence>
            {walkData.isActive && (
                <motion.div
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ type: "spring", damping: 26, stiffness: 300 }}
                    className="fixed top-4 left-4 right-4 z-[90]"
                >
                    <button
                        onClick={() => { haptics.tap(); router.push('/walk/tracking'); }}
                        className={`w-full flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-full shadow-xl border backdrop-blur-md active:scale-[0.98] transition-transform ${
                            walkData.isPaused
                                ? "bg-slate-900/90 border-white/10"
                                : "bg-orange-500/95 border-orange-400/40"
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${walkData.isPaused ? "bg-slate-400" : "bg-white animate-pulse"}`} />
                        <span className="text-white text-[12px] font-black truncate min-w-0">
                            {walkData.petName || "Yürüyüş"} 🐾
                        </span>
                        <span className="flex items-center gap-1 text-white/90 text-[11px] font-bold shrink-0 ml-auto">
                            {formatTime(walkData.time)}
                        </span>
                        <span className="flex items-center gap-1 text-white/90 text-[11px] font-bold shrink-0">
                            <Footprints className="w-3 h-3" /> {(walkData.distance / 1000).toFixed(2)} km
                        </span>
                        <span
                            role="button"
                            onClick={(e) => { e.stopPropagation(); haptics.tap(); walkData.isPaused ? resumeWalk() : pauseWalk(); }}
                            className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0"
                        >
                            {walkData.isPaused ? <Play className="w-3.5 h-3.5 text-white fill-current" /> : <Pause className="w-3.5 h-3.5 text-white fill-current" />}
                        </span>
                        <ChevronRight className="w-4 h-4 text-white/70 shrink-0" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
