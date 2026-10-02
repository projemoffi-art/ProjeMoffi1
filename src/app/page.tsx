"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthFlow } from "@/components/auth/AuthFlow";
import { getLastPanel } from "@/hooks/useMyBusinesses";
import { fetchOnboardingCompleted } from "@/hooks/useOnboardingStatus";

// Açılışta cihazda en son kullanılan panel; seçim yoksa eski işletme hesapları panele, diğerleri ana sayfaya.
// Yetki değil: işletme panelinin kapısı ara katmandaki üyelik kontrolü.
function landingFor(role?: string) {
  const last = getLastPanel();
  if (last) return last === 'business' ? '/business/dashboard' : '/home';
  return role === 'business' ? '/business/dashboard' : '/home';
}

// Giriş sonrası dönülecek adres (?next=/invitation/...). Sadece site içi yol kabul edilir (açık yönlendirme olmasın).
function nextPath(): string | null {
  if (typeof window === 'undefined') return null;
  const next = new URLSearchParams(window.location.search).get('next');
  return next && /^\/(?![\/\\])[^\s]*$/.test(next) ? next : null;
}

function Spinner() {
  return (
    <main className="min-h-[100dvh] bg-[#F7F3EA] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#EE5B3D]/20 border-t-[#EE5B3D] rounded-full animate-spin" />
    </main>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [routing, setRouting] = useState(false);

  // Oturum varsa: davet gibi bir hedef → oraya; ilk kurulumu bitirmemiş kullanıcı → /onboarding; diğerleri → panel/ana sayfa
  useEffect(() => {
    if (isLoading || !user) return;
    let alive = true;
    setRouting(true);
    (async () => {
      const next = nextPath();
      if (next) return router.replace(next);
      const done = await fetchOnboardingCompleted(user.id);
      if (!alive) return;
      router.replace(done ? landingFor(user.role) : '/onboarding');
    })();
    return () => { alive = false; };
  }, [user, isLoading, router]);

  if (isLoading || user || routing) return <Spinner />;

  return <AuthFlow onDone={() => setRouting(true)} />;
}
