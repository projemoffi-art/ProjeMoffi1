"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getBusinessTypeConfig, BusinessTypeConfig } from "@/config/businessTypes";
import { apiService } from "@/services/apiService";
import type { MyBusiness, BusinessRole } from "@/services/types";

// İşletme panelinin tek bağlamı (8.54). Hesap = kişi; işletme ayrı kayıt (`businesses`). Panel her şeyi
// "aktif işletme" adına yapar: kimliği, kaydı, kişinin oradaki rolü ve türe göre panel ayarı burada çözülür,
// sayfalar `useActiveBusiness()` / `useBusinessType()` ile okur. Hiçbir sayfa kişinin kimliğini işletme
// kimliği yerine kullanmaz (personel ya da birden fazla işletmesi olan kişi için yanlış olurdu).

interface ActiveBusinessValue {
    businessId: string | null;
    /** `businesses` satırı (sadece üyeler okuyabilir). */
    business: any | null;
    role: BusinessRole | null;
    /** Sahip ya da yönetici: işletme ayarlarını, hizmetleri, personeli yönetebilir. */
    canManage: boolean;
    businesses: MyBusiness[];
    config: BusinessTypeConfig;
    loading: boolean;
    refresh: () => Promise<void>;
    switchTo: (businessId: string) => Promise<void>;
}

const ActiveBusinessContext = createContext<ActiveBusinessValue | null>(null);

export function BusinessTypeProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [businesses, setBusinesses] = useState<MyBusiness[]>([]);
    const [business, setBusiness] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!user?.id) {
            setBusinesses([]);
            setBusiness(null);
            setLoading(false);
            return;
        }
        try {
            const [list, active] = await Promise.all([
                apiService.getMyBusinesses(),
                apiService.getActiveBusiness(),
            ]);
            setBusinesses(list);
            setBusiness(active);
        } catch (e) {
            console.error('Aktif işletme yüklenemedi:', e);
            setBusinesses([]);
            setBusiness(null);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        setLoading(true);
        load();
    }, [load]);

    const switchTo = useCallback(async (businessId: string) => {
        await apiService.setActiveBusiness(businessId);
        setLoading(true);
        await load();
    }, [load]);

    const value = useMemo<ActiveBusinessValue>(() => {
        const role = businesses.find(b => b.id === business?.id)?.role ?? null;
        return {
            businessId: business?.id ?? null,
            business,
            role,
            canManage: role === 'owner' || role === 'manager',
            businesses,
            config: getBusinessTypeConfig(business?.business_type),
            loading,
            refresh: load,
            switchTo,
        };
    }, [business, businesses, loading, load, switchTo]);

    return (
        <ActiveBusinessContext.Provider value={value}>
            {children}
        </ActiveBusinessContext.Provider>
    );
}

export function useActiveBusiness(): ActiveBusinessValue {
    const ctx = useContext(ActiveBusinessContext);
    if (!ctx) throw new Error('useActiveBusiness, işletme paneli (BusinessTypeProvider) içinde kullanılmalı.');
    return ctx;
}

export function useBusinessType(): BusinessTypeConfig {
    const ctx = useContext(ActiveBusinessContext);
    // Provider dışında (ör. testte) çağrılırsa vet varsayılanına düşer — panel dışında anlamı yok.
    return ctx?.config ?? getBusinessTypeConfig(undefined);
}
