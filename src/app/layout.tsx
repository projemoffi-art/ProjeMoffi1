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


import { RootOnboardingWrapper } from "@/components/onboarding/RootOnboardingWrapper";

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
        className={`${poppins.variable} ${inter.variable} ${pacificoFont.variable} ${satisfyFont.variable} ${playfairFont.variable} font-sans antialiased`}
      >
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <ActivityProvider>
                <ChatProvider>
                  <WellbeingProvider>
                    <ThemeProvider>
                      <PetProvider>
                        <SocialProvider>
                          <ShopProvider>
                            <ClientAuthWrapper>
                              <RootOnboardingWrapper>
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
                                <AIWidgetLoader />
                              </RootOnboardingWrapper>
                            </ClientAuthWrapper>
                          </ShopProvider>
                        </SocialProvider>
                      </PetProvider>
                    </ThemeProvider>
                  </WellbeingProvider>
                </ChatProvider>
              </ActivityProvider>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
