// Gerçek, minimal haptic geri bildirim katmanı — yeni bir kütüphane eklemeden
// tarayıcının kendi `navigator.vibrate` API'sini kullanıyor. Sadece destekleyen
// gerçek mobil cihazlarda (Android Chrome vb.) hissedilir; iOS Safari ve masaüstü
// tarayıcılar bu API'yi desteklemez, bu yüzden her çağrı özellik kontrolüyle
// sarılı ve desteklenmediğinde sessizce hiçbir şey yapmaz (hata fırlatmaz).
function vibrate(pattern: number | number[]) {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
    try {
        navigator.vibrate(pattern);
    } catch {
        /* bazı tarayıcılar izin/politika nedeniyle sessizce reddedebilir */
    }
}

export const haptics = {
    // Küçük, nötr bir dokunuş — buton tıklamaları, sekme değişimi
    tap: () => vibrate(10),
    // Bir işlem başarıyla tamamlandı — satın alma, yürüyüş bitirme
    success: () => vibrate([15, 40, 15]),
    // Büyük bir kazanım — rozet/meydan okuma tamamlama
    celebrate: () => vibrate([20, 30, 20, 30, 40]),
    // Bir şey ters gitti — yetersiz bakiye, hata
    warn: () => vibrate([30, 20, 30]),
};
