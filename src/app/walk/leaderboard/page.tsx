"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LeaderboardSection } from "@/components/walk/LeaderboardSection";

// Ekran 12 (Sıralamalar) — daha önce SADECE `/walk` hub'ının içine gömülü bir
// bölümdü, kendi ayrı bir ekranı/rotası yoktu. Ekran 10 (`/walk` hub) yeniden
// yapılanmasının (design-reference/walk-final/) bir parçası olarak hub'daki
// gömülü liste kaldırılıp yerine bu gerçek, ayrı sayfaya bir kısayol kondu —
// `LeaderboardSection.tsx` zaten Faz 13'te referansa göre inşa edilmişti,
// burada sadece gerçek bir sayfa/route içine alınıyor.
export default function WalkLeaderboardPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans flex flex-col border-x border-card-border">
            <div className="bg-card px-6 py-6 border-b border-card-border sticky top-0 z-20 flex items-center justify-between">
                <button onClick={() => router.back()} className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-gray-100 transition active:scale-90">
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <h1 className="text-lg font-bold text-foreground font-sans">Sıralamalar</h1>
                <div className="w-10" />
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
                <LeaderboardSection />
            </div>
        </main>
    );
}
