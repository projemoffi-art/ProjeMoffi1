"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";
import type { MyBusiness } from "@/services/types";

// Kişinin üyesi olduğu işletmeler (8.54) — kişisel tarafta "İşletme paneline geç" girişleri bunu kullanır
// (rol değil üyelik). Aynı oturumda birden fazla bileşen istese de tek istek atılır.
let cache: { userId: string; promise: Promise<MyBusiness[]> } | null = null;

export function useMyBusinesses(): MyBusiness[] {
    const { user } = useAuth();
    const [list, setList] = useState<MyBusiness[]>([]);

    useEffect(() => {
        if (!user?.id) { setList([]); return; }
        if (!cache || cache.userId !== user.id) {
            cache = { userId: user.id, promise: apiService.getMyBusinesses().catch(() => []) };
        }
        let alive = true;
        cache.promise.then(r => { if (alive) setList(r); });
        return () => { alive = false; };
    }, [user?.id]);

    return list;
}

// Cihazda en son kullanılan panel (kişisel / işletme): sadece açılışta nereye gidileceği için bir kolaylık,
// yetki değildir (işletme panelinin kapısı ara katmandaki üyelik kontrolü).
const LAST_PANEL_KEY = 'moffi-last-panel';

export function setLastPanel(panel: 'personal' | 'business') {
    try { localStorage.setItem(LAST_PANEL_KEY, panel); } catch { /* depolama kapalı olabilir */ }
}

/** Seçim yapılmamışsa null. */
export function getLastPanel(): 'personal' | 'business' | null {
    try {
        const v = localStorage.getItem(LAST_PANEL_KEY);
        return v === 'business' || v === 'personal' ? v : null;
    } catch { return null; }
}
