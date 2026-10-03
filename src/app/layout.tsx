import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PetProvider } from "@/context/PetContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AIWidgetLoader } from "@/components/ai/AIWidgetLoader";
import { WeatherDetailSheet } from "@/components/walk/WeatherDetailSheet";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClientAuthWrapper } from "@/components/auth/ClientAuthWrapper";
import { AccountDeletionBanner } from "@/components/account/AccountDeletion";
import { DynamicNavigation } from "@/components/common/DynamicNavigation";
import { GlobalCareModals } from "@/components/common/GlobalCareModals";
import { GlobalAuraBackground } from "@/components/common/GlobalAuraBackground";
import { WeatherProvider } from "@/context/WeatherContext";
import { DailyProgressProvider } from "@/context/DailyProgressContext";
import { QuestCelebration } from "@/components/quests/QuestCelebration";
import { GlobalToast } from "@/components/common/GlobalToast";
import CookieBanner from "@/components/common/CookieBanner";
import { ShareSheetHost } from "@/components/common/ShareSheet";

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Moffi",
  description: "Evcil hayvanın için sağlık takibi, yürüyüş, kayıp ve sahiplendirme, veteriner ve topluluk tek uygulamada.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Moffi",
  },
  // Tarayıcının otomatik çevirisi arayüz metinlerini bozmasın.
  other: { google: "notranslate" },
};

import { ChatProvider } from "@/context/ChatContext";
import { ActivityProvider } from "@/context/ActivityContext";

import { LanguageProvider } from "@/context/LanguageContext";

import { NotificationProvider } from "@/context/NotificationContext";
import { ReportProvider } from "@/context/ReportContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" translate="no" className="notranslate">
      <body
        className={`${jakarta.variable} ${jakarta.className} font-sans antialiased bg-background text-foreground`}
      >
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <PetProvider>
                <ActivityProvider>
                  <WeatherProvider>
                    <DailyProgressProvider>
                      <ChatProvider>
                          <ThemeProvider>
                                  <ReportProvider>
                                    <ClientAuthWrapper>
                                      <AccountDeletionBanner />
                                      <GlobalAuraBackground />
                                      <div id="modal-root" className="pointer-events-none fixed inset-0 z-[99999]"></div>
                                      <div className="min-h-screen relative">
                                        <ErrorBoundary>
                                          <>
                                            {children}
                                          </>
                                        </ErrorBoundary>
                                      </div>

                                      <Suspense fallback={null}>
                                        <DynamicNavigation />
                                      </Suspense>
                                      <GlobalCareModals />
                                      <QuestCelebration />
                                      <AIWidgetLoader />
                                      <WeatherDetailSheet />
                                      <CookieBanner />
                                      <GlobalToast />
                                    </ClientAuthWrapper>
                                    <ShareSheetHost />
                                  </ReportProvider>
                          </ThemeProvider>
                      </ChatProvider>
                    </DailyProgressProvider>
                  </WeatherProvider>
                </ActivityProvider>
              </PetProvider>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
