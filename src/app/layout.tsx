import type { Metadata } from "next";
import { Poppins, Inter, Pacifico, Satisfy, Playfair_Display } from "next/font/google";
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
import { WellbeingProvider } from "@/context/WellbeingContext";
import { GlobalAuraBackground } from "@/components/common/GlobalAuraBackground";
import { WeatherProvider } from "@/context/WeatherContext";
import { QuestEngineProvider } from "@/context/QuestEngineContext";
import { LiveEventsProvider } from "@/context/LiveEventsContext";
import { QuestRewardEngineLoader } from "@/components/quests/QuestRewardEngineLoader";
import { Phase2Loader } from "@/components/quests/Phase2Loader";
import { GlobalToast } from "@/components/common/GlobalToast";

const poppins = Poppins({
  weight: ['400', '600', '700', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const pacificoFont = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pacifico',
});

const satisfyFont = Satisfy({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-satisfy',
});

const playfairFont = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
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
        className={`${poppins.variable} ${inter.variable} ${pacificoFont.variable} ${satisfyFont.variable} ${playfairFont.variable} font-sans antialiased bg-background text-foreground`}
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
                              <ShopProvider>
                                <ClientAuthWrapper>
                                  <GlobalIdentitySync />
                                  <GlobalAuraBackground />
                                  <div className="min-h-screen relative overflow-hidden">
                                    <ErrorBoundary>
                                      {children}
                                    </ErrorBoundary>
                                  </div>

                                  <Suspense fallback={null}>
                                    <DynamicNavigation />
                                  </Suspense>
                                  <QuestRewardEngineLoader />
                                  <Phase2Loader />
                                  <AIWidgetLoader />
                                  <GlobalToast />
                                </ClientAuthWrapper>
                              </ShopProvider>
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
