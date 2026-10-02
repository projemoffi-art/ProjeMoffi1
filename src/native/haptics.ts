// Titreşim geri bildirimi. Web'de navigator.vibrate (Android Chrome); iOS Safari ve masaüstü desteklemez,
// o zaman sessizce hiçbir şey yapmaz.
function vibrate(pattern: number | number[]) {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    try { navigator.vibrate(pattern); } catch { /* politika gereği reddedilebilir */ }
}

export const haptics = {
    /** Küçük, nötr dokunuş: buton, sekme */
    tap: () => vibrate(10),
    /** İşlem tamam: satın alma, yürüyüş bitirme */
    success: () => vibrate([15, 40, 15]),
    /** Büyük kazanım: rozet, meydan okuma */
    celebrate: () => vibrate([20, 30, 20, 30, 40]),
    /** Ters giden bir şey */
    warn: () => vibrate([30, 20, 30]),
    /** Özel desen (ms) */
    pattern: (p: number | number[]) => vibrate(p),
};
