"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useActivity, type WalkFinishStage } from "@/context/ActivityContext";
import { usePet } from "@/context/PetContext";
import { PrimaryButton, SoftButton } from "@/components/walk/WalkUI";
import { errorMessage } from "@/lib/utils";

// Ekran 6 (İşleme). Her adım gerçek bir işin bitişine bağlı: noktaların gönderilmesi, sunucuda mesafe/süre/
// kalori hesabı (finish_walk), istatistik ve kazanımların yenilenmesi. Kayıt başarısız olursa yürüyüş
// silinmez; kullanıcı tekrar deneyebilir ya da takibe dönebilir.
const STEPS: { label: string; doneAt: WalkFinishStage }[] = [
    { label: 'GPS verileri işleniyor', doneAt: 'points' },
    { label: 'Mesafe hesaplanıyor', doneAt: 'saved' },
    { label: 'Kazanımlar hazırlanıyor', doneAt: 'refreshed' },
    { label: 'Rota kaydediliyor', doneAt: 'refreshed' },
];
const STAGE_ORDER: WalkFinishStage[] = ['points', 'saved', 'refreshed'];

function StepIcon({ state }: { state: 'done' | 'active' | 'pending' }) {
    if (state === 'done') {
        return (
            <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </span>
        );
    }
    if (state === 'active') return <span className="w-6 h-6 rounded-full border-[2.5px] border-emerald-500/25 border-t-emerald-500 animate-spin shrink-0" />;
    return <span className="w-6 h-6 rounded-full border-2 border-black/15 dark:border-white/20 shrink-0" />;
}

function ProcessingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { stopWalk, acknowledgeWalkCompletion, walkData } = useActivity();
    const { pets, activePet } = usePet();
    const walkingPet = pets.find(p => String(p.id) === String(walkData.petId)) || activePet;
    const petImage = walkingPet?.avatar || walkingPet?.image;

    const [reached, setReached] = useState<WalkFinishStage | null>(null);
    const [error, setError] = useState<string | null>(null);
    const ranRef = useRef(false);

    const run = async () => {
        setError(null);
        setReached(null);
        try {
            const result = await stopWalk(stage => setReached(stage));
            acknowledgeWalkCompletion();
            const params = new URLSearchParams(searchParams?.toString() || '');
            params.set('status', result.status);
            if (result.sessionId) params.set('id', result.sessionId);
            router.replace(`/walk/summary?${params.toString()}`);
        } catch (e) {
            setError(errorMessage(e, '') === 'Giriş gerekli'
                ? 'Yürüyüşü kaydetmek için giriş yapmış olman gerekiyor.'
                : 'Yürüyüş kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene; yürüyüşün kaybolmadı.');
        }
    };

    // stopWalk gerçek bir kayıt işlemi: Strict Mode'un çift çalıştırmasına karşı tek sefer.
    useEffect(() => {
        if (ranRef.current) return;
        ranRef.current = true;
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const reachedIndex = reached ? STAGE_ORDER.indexOf(reached) : -1;
    const stepState = (i: number): 'done' | 'active' | 'pending' => {
        const need = STAGE_ORDER.indexOf(STEPS[i].doneAt);
        if (reachedIndex >= need) return 'done';
        const firstUnfinished = STEPS.findIndex(s => reachedIndex < STAGE_ORDER.indexOf(s.doneAt));
        return !error && i === firstUnfinished ? 'active' : 'pending';
    };

    return (
        <div className="min-h-[100dvh] flex flex-col px-6 pt-[calc(env(safe-area-inset-top,0px)+48px)] pb-10">
            <div className="flex-1 flex flex-col items-center justify-center">
                <motion.div
                    animate={error ? {} : { y: [0, -8, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    className="w-52 h-52 rounded-[40px] overflow-hidden bg-[radial-gradient(circle_at_50%_40%,#FFF4E3,#F7F3EA)] flex items-center justify-center mb-8"
                >
                    {petImage
                        ? <img src={petImage} alt="" className="w-40 h-40 rounded-full object-cover shadow-[0_16px_30px_-12px_rgba(0,0,0,0.35)]" />
                        : <span className="text-7xl">🐕</span>}
                </motion.div>

                <h1 className="text-[22px] font-extrabold text-center">{error ? 'Kaydedilemedi' : 'Yürüyüşün hesaplanıyor...'}</h1>
                <p className="text-[13px] text-secondary text-center mt-1.5 mb-8 px-4">{error || 'Rota ve istatistikler oluşturuluyor.'}</p>

                <div className="w-full max-w-sm bg-card rounded-3xl border border-card-border p-5 space-y-4">
                    {STEPS.map((s, i) => {
                        const state = stepState(i);
                        return (
                            <div key={s.label} className="flex items-center gap-3.5">
                                <StepIcon state={state} />
                                <span className={state === 'pending' ? "text-[14px] font-semibold text-secondary" : "text-[14px] font-semibold text-foreground"}>{s.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {error && (
                <div className="space-y-2.5 max-w-sm w-full mx-auto">
                    <PrimaryButton onClick={run}>Tekrar Dene</PrimaryButton>
                    <SoftButton onClick={() => router.replace('/walk/tracking')}>Yürüyüşe Dön</SoftButton>
                </div>
            )}
        </div>
    );
}

export default function ProcessingPage() {
    return (
        <Suspense fallback={<div className="min-h-[100dvh] bg-background" />}>
            <ProcessingContent />
        </Suspense>
    );
}
