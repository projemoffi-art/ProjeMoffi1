import type { CapacitorConfig } from '@capacitor/cli';

// Telefon uygulaması canlı siteyi (app.moffi.net) kendi içinde açar; Moffi'nin sunucu tarafı (API rotaları,
// ara katman, SSR) olduğu için statik dışa aktarım mümkün değil. Telefon özellikleri src/native üzerinden
// Capacitor eklentilerine bağlanır. capacitor-shell/ sadece bağlantı yokken görünen yedek sayfa.
const config: CapacitorConfig = {
    appId: 'net.moffi.app',
    appName: 'Moffi',
    webDir: 'capacitor-shell',
    server: {
        url: 'https://app.moffi.net',
        cleartext: false,
        errorPath: 'index.html',
    },
    ios: {
        contentInset: 'automatic',
    },
    android: {
        allowMixedContent: false,
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 800,
            backgroundColor: '#F7F3EA',
            showSpinner: false,
        },
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },
    },
};

export default config;
