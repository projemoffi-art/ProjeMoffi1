// Piyasa araştırması bulgusu #3: Strava/Nike Run Club'ın çekirdek özelliği olan
// sesli geri bildirim ("1 kilometre, tempon 12'00\"") — yeni bir kütüphane veya
// native uygulama gerekmeden tarayıcının kendi Web Speech API'sini (SpeechSynthesis)
// kullanıyor. Sadece destekleyen tarayıcılarda (Chrome/Edge/Safari çoğu masaüstü
// ve mobil sürüm) gerçekten seslendirir; desteklenmiyorsa sessizce no-op — hata
// fırlatmaz, uygulamanın geri kalanını etkilemez.
function speak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
        window.speechSynthesis.cancel(); // önceki anonsu yarıda kesip yenisini önceliklendir
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'tr-TR';
        utterance.rate = 1.0;
        utterance.volume = 0.9;
        window.speechSynthesis.speak(utterance);
    } catch {
        /* bazı tarayıcılar/işletim sistemleri kullanıcı etkileşimi olmadan konuşmayı reddedebilir */
    }
}

function formatPace(splitSeconds: number): string {
    const mins = Math.floor(splitSeconds / 60);
    const secs = Math.round(splitSeconds % 60);
    return secs === 0 ? `${mins} dakika` : `${mins} dakika ${secs} saniye`;
}

export const audioCues = {
    enabled: true, // kullanıcı ayarından açıp kapatılabilir (bkz. tracking sayfası ses ikonu)
    setEnabled(v: boolean) { audioCues.enabled = v; },
    walkStarted: () => { if (audioCues.enabled) speak('Yürüyüş başladı, iyi yürüyüşler!'); },
    split: (km: number, splitSeconds: number) => {
        if (!audioCues.enabled) return;
        speak(`${km} kilometre tamamlandı. Bu kilometreyi ${formatPace(splitSeconds)}de tamamladın.`);
    },
    autoPaused: () => { if (audioCues.enabled) speak('Hareketsizlik algılandı, yürüyüş duraklatıldı.'); },
    autoResumed: () => { if (audioCues.enabled) speak('Hareket algılandı, yürüyüşe devam ediliyor.'); },
    walkFinished: (distanceKm: number) => {
        if (!audioCues.enabled) return;
        speak(`Harika bir yürüyüş! Toplam ${distanceKm.toFixed(1).replace('.', ',')} kilometre tamamladın.`);
    },
};
