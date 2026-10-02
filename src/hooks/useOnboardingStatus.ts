"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// İlk kurulum (pet ekleme) tamamlandı mı? Sunucudaki profiles.onboarding_completed_at tek kaynaktır
// (mevcut kullanıcılar tamamlanmış sayılır; "Şimdilik atla" da tamamlar).
export async function fetchOnboardingCompleted(userId: string): Promise<boolean> {
    const { data, error } = await supabase.from("profiles").select("onboarding_completed_at, role").eq("id", userId).maybeSingle();
    if (error || !data) return true; // belirsizse kullanıcıyı kurulum akışına zorlama
    if (data.role && data.role !== "user") return true;
    return !!data.onboarding_completed_at;
}

export async function completeOnboarding(): Promise<void> {
    await supabase.rpc("complete_onboarding");
}

export function useOnboardingStatus(userId: string | undefined) {
    const [state, setState] = useState<{ loading: boolean; completed: boolean }>({ loading: true, completed: true });
    useEffect(() => {
        if (!userId) { setState({ loading: false, completed: true }); return; }
        let alive = true;
        fetchOnboardingCompleted(userId).then(c => { if (alive) setState({ loading: false, completed: c }); });
        return () => { alive = false; };
    }, [userId]);
    return state;
}
