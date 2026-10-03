"use client";

// Ekran 12 · Sıralamalar (design-reference/walk-final/). Girişler: yürüyüş hazırlık panelindeki kısayol ve /walk istatistik sayfası.
import { LeaderboardSection } from "@/components/walk/LeaderboardSection";
import { WalkHeader } from "@/components/walk/WalkUI";

export default function WalkLeaderboardPage() {
    return (
        <main className="min-h-screen pb-[calc(140px+env(safe-area-inset-bottom,0px))]">
            <WalkHeader title="Sıralamalar" />
            <div className="px-4 pt-1">
                <LeaderboardSection />
            </div>
        </main>
    );
}
