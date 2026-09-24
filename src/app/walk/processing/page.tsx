"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useActivity } from "@/context/ActivityContext";
import { usePet } from "@/context/PetContext";
import { useQuestEngine } from "@/context/QuestEngineContext";

// Ekran 6 (İşleme Ekranı) — design-reference/walk-final/'de tarif edilen, önceden
// hiç var olmayan yeni bir ekran. Yürüyüş bittiğinde /walk/summary'e atlamadan
// önce burada gerçek async işi (stopWalk() -> apiService.endWalk DB yazımı +
// refreshWalkData) gösteriyoruz. Adımlar SAHTE bir "2 saniye bekle" gecikmesi
// DEĞİL — her adım gerçekten o iş bitince tamamlandı işaretleniyor.
type StepState = 'pending' | 'active' | 'done';

const STEPS = [
    { key: 'gps', label: 'GPS verileri işleniyor' },
    { key: 'distance', label: 'Mesafe hesaplanıyor' },
    { key: 'rewards', label: 'Kazanımlar hazırlanıyor' },
    { key: 'badge', label: 'Rozet kaydediliyor' },
] as const;

function StepIcon({ state }: { state: StepState }) {
    if (state === 'done') return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
    if (state === 'active') return <Loader2 className="w-5 h-5 text-blue-500 shrink-0 animate-spin" />;
    // NOT: `Circle` ikonu KULLANILMIYOR — bu projede Turbopack+OneDrive bazı
    // lucide-react ikon dosyalarında (bkz. CLAUDE.md 5.6) dosya okuma panic'i
    // veriyor; bu oturumda `circle.js` tam olarak bunu tetikledi. Basit bir
    // CSS dairesi işlevsel olarak eşdeğer, kök nedene inmeye gerek yok.
    return <span className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-white/15 shrink-0" />;
}

function ProcessingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { stopWalk, acknowledgeWalkCompletion } = useActivity();
    const { activePet } = usePet();
    const { lastEarnedBadge } = useQuestEngine();

    const [stepStates, setStepStates] = useState<StepState[]>(['active', 'active', 'pending', 'pending']);
    const ranRef = useRef(false);

    useEffect(() => {
        // NOT: Bilerek `cancelled`/cleanup deseni KULLANILMIYOR. React Strict Mode
        // dev modunda efekti mount->cleanup->mount olarak iki kez çalıştırıyor;
        // `ranRef` ikinci çalışmayı engelliyor ama cleanup yine de BİRİNCİ
        // çalışmanın closure'ındaki `cancelled`'ı true yapıyordu — bu da
        // `await stopWalk()` sonunda TEK gerçek zincirin sessizce iptal olup
        // asla /walk/summary'e geçmemesine yol açan gerçek bir bug'dı (canlı
        // testte yakalandı: ekran sonsuza dek "işleniyor" durumunda takılı
        // kalıyordu). `stopWalk()` gerçek bir yan etki (DB yazımı) olduğu için
        // zaten sadece bir kez tetiklenmeli ve başladıktan sonra iptal
        // edilmemeli — bunu `ranRef` tek başına garanti ediyor.
        if (ranRef.current) return;
        ranRef.current = true;

        (async () => {
            // Adım 1+2 — TEK gerçek async bekleme: stopWalk() yürüyüşü sunucuya
            // yazıyor (apiService.endWalk) ve gerçek istatistikleri tazeliyor
            // (refreshWalkData). Süresi gerçek ağ/DB gecikmesine bağlı, uydurma değil.
            await stopWalk();
            acknowledgeWalkCompletion();
            setStepStates(['done', 'done', 'active', 'active']);

            // Adım 3+4 — PP/rozet kazanımı yürüyüş SIRASINDA zaten canlı olarak
            // hesaplanmış durumda (QuestEngineContext); burada sadece o gerçek,
            // önceden hesaplanmış sonucu okuyup ekrana yansıtıyoruz. Bir React
            // tick'i kadar bekliyoruz ki context güncellemesi gerçekten otursun —
            // sabit bir "2 saniye" gecikmesi değil.
            await new Promise(requestAnimationFrame);
            setStepStates(['done', 'done', 'done', 'done']);

            const params = new URLSearchParams(searchParams?.toString() || '');
            if (lastEarnedBadge) {
                params.set('badgeName', lastEarnedBadge.name);
                params.set('badgeIcon', lastEarnedBadge.icon);
            }
            router.replace(`/walk/summary?${params.toString()}`);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="h-screen w-full bg-background flex flex-col items-center justify-center px-6 text-center">
            <span className="font-black text-[13px] text-slate-800 dark:text-white bg-card px-4 py-2 rounded-full shadow-moffi-card mb-8">
                {activePet?.name || 'Moffi'} ile Yürüyüş
            </span>

            <div className="w-40 h-40 rounded-full overflow-hidden bg-emerald-50 flex items-center justify-center mb-8 shadow-moffi-card">
                {activePet?.image ? (
                    <img src={activePet.image} alt={activePet.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-6xl">🐾</span>
                )}
            </div>

            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1.5">Yürüyüşün hesaplanıyor...</h1>
            <p className="text-[12px] font-bold text-slate-400 mb-8">Rota ve istatistikler oluşturuluyor.</p>

            <div className="w-full max-w-xs bg-card rounded-3xl p-5 shadow-moffi-card border border-slate-200/50 dark:border-white/5 space-y-4 text-left">
                {STEPS.map((step, i) => (
                    <motion.div
                        key={step.key}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3"
                    >
                        <StepIcon state={stepStates[i]} />
                        <span className={
                            stepStates[i] === 'done'
                                ? "text-[12.5px] font-bold text-slate-700 dark:text-slate-200"
                                : stepStates[i] === 'active'
                                ? "text-[12.5px] font-bold text-slate-800 dark:text-slate-100"
                                : "text-[12.5px] font-bold text-slate-350 dark:text-slate-500"
                        }>
                            {step.label}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default function ProcessingPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full bg-background flex items-center justify-center text-sm font-bold text-slate-400">Hazırlanıyor...</div>}>
            <ProcessingContent />
        </Suspense>
    );
}
