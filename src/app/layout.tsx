import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { SocialProvider } from "@/context/SocialContext";
import { AuthProvider } from "@/context/AuthContext";
import { ShopProvider } from "@/context/ShopContext";
import { PetProvider } from "@/context/PetContext";
import { ThemeProvider } from "@/context/ThemeContext";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClientAuthWrapper } from "@/components/auth/ClientAuthWrapper";
import { DynamicNavigation } from "@/components/common/DynamicNavigation";

const poppins = Poppins({
  weight: ['400', '600', '700', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Moffi Pro",
  description: "Advanced Customization Engine",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Moffi Pro",
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
        className={`${poppins.variable} ${inter.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <PetProvider> {/* Added PetProvider wrapper */}
            <SocialProvider>
              <AuthProvider>
                <ShopProvider>
                  <ClientAuthWrapper>
                    <div className="min-h-screen relative overflow-hidden">
                      <ErrorBoundary>
                        {children}
                      </ErrorBoundary>
                    </div>

                    <DynamicNavigation />
                  </ClientAuthWrapper>
                </ShopProvider>
              </AuthProvider>
            </SocialProvider>
          </PetProvider> {/* Closed PetProvider wrapper */}
        </ThemeProvider>
      </body>
    </html>
  );
}
