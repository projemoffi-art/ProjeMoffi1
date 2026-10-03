"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";
import type { MyBusiness } from "@/services/types";

// Kişinin üyesi olduğu işletmeler (8.54) — kişisel tarafta "İşletme paneline geç" girişleri bunu kullanır
// (rol değil üyelik). Aynı oturumda birden fazla bileşen istese de tek istek atılır.
let cache: { userId: string; promise: Promise<MyBusiness[]> } | null = null;

const listeners = new Set<() => void>();

/** Yeni işletme açıldığında / üyelik değiştiğinde çağrılır: tüm ekranlar listeyi yeniden çeker. */
export function invalidateMyBusinesses() {
    cache = null;
    listeners.forEach(fn => fn());
}

export function useMyBusinesses(): MyBusiness[] {
    const { user } = useAuth();
    const [state, setState] = useState<{ userId: string; list: MyBusiness[] } | null>(null);
    const [version, setVersion] = useState(0);

    useEffect(() => {
        const bump = () => setVersion(v => v + 1);
        listeners.add(bump);
        return () => { listeners.delete(bump); };
    }, []);

    useEffect(() => {
        const userId = user?.id;
        if (!userId) return;
        if (!cache || cache.userId !== userId) {
            cache = { userId, promise: apiService.getMyBusinesses().catch(() => []) };
        }
        let alive = true;
        cache.promise.then(list => { if (alive) setState({ userId, list }); });
        return () => { alive = false; };
    }, [user?.id, version]);

    // Oturum kapandıysa ya da başka kullanıcıya geçildiyse eski liste gösterilmez.
    return state && state.userId === user?.id ? state.list : [];
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
