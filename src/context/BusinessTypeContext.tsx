"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getBusinessTypeConfig, BusinessTypeConfig } from "@/config/businessTypes";

// Faz 2 düzeltmesi (2026-09-25) — Baran'ın haklı bulgusu: işletme türü zaten
// kayıt sırasında bir kere seçiliyor, panelin TAMAMI o karara göre otomatik
// ayarlanmalı — bunu Sidebar/Services/Doctors gibi her sayfanın kendi başına
// `getBusinessTypeConfig(user.businessType)` çağırarak çözmesi "kolaycı" bir
// yaklaşımdı (her yeni sayfa bunu yeniden hatırlamak zorunda kalırdı). Artık
// tek bir yerde (business/layout.tsx, panelin gerçek kökü) çözülüyor ve
// context ile aşağı akıyor — tıpkı onay/erişim kontrolünün zaten o layout'ta
// yapılması gibi, işletme türü de aynı katmanda ele alınan bir kavram oldu.
const BusinessTypeContext = createContext<BusinessTypeConfig | null>(null);

export function BusinessTypeProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const config = useMemo(() => getBusinessTypeConfig(user?.businessType), [user?.businessType]);

    return (
        <BusinessTypeContext.Provider value={config}>
            {children}
        </BusinessTypeContext.Provider>
    );
}

export function useBusinessType(): BusinessTypeConfig {
    const ctx = useContext(BusinessTypeContext);
    // Provider'ın dışında (ör. testte) çağrılırsa sessizce vet varsayılanına
    // düşer — panel dışında bu hook'un anlamı yok zaten.
    return ctx ?? getBusinessTypeConfig(undefined);
}
