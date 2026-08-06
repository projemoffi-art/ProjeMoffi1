import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SocialProvider } from "@/context/SocialContext";
import { AuthProvider } from "@/context/AuthContext";
import { ShopProvider } from "@/context/ShopContext";
import { PetProvider } from "@/context/PetContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AIWidgetLoader } from "@/components/ai/AIWidgetLoader";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClientAuthWrapper } from "@/components/auth/ClientAuthWrapper";
import { DynamicNavigation } from "@/components/common/DynamicNavigation";
import { GlobalIdentitySync } from "@/components/common/GlobalIdentitySync";
import { GlobalCareModals } from "@/components/common/GlobalCareModals";
import { WellbeingProvider } from "@/context/WellbeingContext";
import { GlobalAuraBackground } from "@/components/common/GlobalAuraBackground";
import { WeatherProvider } from "@/context/WeatherContext";
import { QuestEngineProvider } from "@/context/QuestEngineContext";
import { LiveEventsProvider } from "@/context/LiveEventsContext";
import { QuestRewardEngineLoader } from "@/components/quests/QuestRewardEngineLoader";
import { Phase2Loader } from "@/components/quests/Phase2Loader";
import { GlobalToast } from "@/components/common/GlobalToast";
import { RootOnboardingWrapper } from "@/components/drafts/RootOnboardingWrapper";
import CookieBanner from "@/components/common/CookieBanner";
import { ShareProvider } from "@/context/ShareContext";
import { GlobalShareSheet } from "@/components/common/GlobalShareSheet";

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
  title: "Moffi Demo",
  description: "Advanced Customization Engine",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Moffi Demo",
  },
  google: 'notranslate',
};

import { ChatProvider } from "@/context/ChatContext";
import { ActivityProvider } from "@/context/ActivityContext";

import { LanguageProvider } from "@/context/LanguageContext";

import { NotificationProvider } from "@/context/NotificationContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no" className="notranslate">
      <body
        className={`${jakarta.variable} ${jakarta.className} font-sans antialiased bg-background text-foreground`}
      >
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <PetProvider>
                <ActivityProvider>
                  <WeatherProvider>
                    <QuestEngineProvider>
                      <LiveEventsProvider>
                      <ChatProvider>
                        <WellbeingProvider>
                          <ThemeProvider>
                            <SocialProvider>
                              <ShareProvider>
                                <ShopProvider>
                                <ClientAuthWrapper>
                                  <GlobalIdentitySync />
                                  <GlobalAuraBackground />
                                  <div className="min-h-screen relative">
                                    <ErrorBoundary>
                                      <RootOnboardingWrapper>
                                        {children}
                                      </RootOnboardingWrapper>
                                    </ErrorBoundary>
                                  </div>

                                  <Suspense fallback={null}>
                                    <DynamicNavigation />
                                  </Suspense>
                                  <GlobalCareModals />
                                  <QuestRewardEngineLoader />
                                  <Phase2Loader />
                                  <AIWidgetLoader />
                                  <CookieBanner />
                                  <GlobalToast />
                                </ClientAuthWrapper>
                                  <GlobalShareSheet />
                                </ShopProvider>
                              </ShareProvider>
                            </SocialProvider>
                          </ThemeProvider>
                        </WellbeingProvider>
                      </ChatProvider>
                      </LiveEventsProvider>
                    </QuestEngineProvider>
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
