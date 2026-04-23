import type { Metadata } from "next";
import { Poppins, Inter, Pacifico, Satisfy, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SocialProvider } from "@/context/SocialContext";
import { AuthProvider } from "@/context/AuthContext";
import { ShopProvider } from "@/context/ShopContext";
import { PetProvider } from "@/context/PetContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AIWidgetLoader } from "@/components/ai/AIWidgetLoader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClientAuthWrapper } from "@/components/auth/ClientAuthWrapper";
import { DynamicNavigation } from "@/components/common/DynamicNavigation";
import { GlobalIdentitySync } from "@/components/common/GlobalIdentitySync";
import { WellbeingProvider } from "@/context/WellbeingContext";
import { GlobalAuraBackground } from "@/components/common/GlobalAuraBackground";
import { WellbeingOverlay } from "@/components/common/WellbeingOverlay";
import GlobalFeedback from "@/components/common/GlobalFeedback";

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
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${inter.variable} ${pacificoFont.variable} ${satisfyFont.variable} ${playfairFont.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <WellbeingProvider>
            <ThemeProvider>
              <PetProvider>
                <SocialProvider>
                  <ShopProvider>
                    <ClientAuthWrapper>
                      <GlobalIdentitySync />
                      <GlobalAuraBackground />
                      <WellbeingOverlay />
                      <div className="min-h-screen relative overflow-hidden">
                        <ErrorBoundary>
                          {children}
                        </ErrorBoundary>
                      </div>

                      <DynamicNavigation />
                      <AIWidgetLoader />
                      <GlobalFeedback />
                    </ClientAuthWrapper>
                  </ShopProvider>
                </SocialProvider>
              </PetProvider>
            </ThemeProvider>
          </WellbeingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
