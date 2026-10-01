// Ürün görseli alanı (products.image_url) ya virgülle ayrılmış görsel adresleri ya da yönetici panelinde seçilmiş
// bir emoji tutar. Emoji <img src> olarak verilirse tarayıcı onu göreli adres sanıp 404 isteği atar; bu yüzden
// görsel olup olmadığına her yerde bu tek kontrolle karar verilir.

export const isImageUrl = (v?: string | null): boolean => !!v && /^(https?:\/\/|\/|data:image\/|blob:)/.test(v.trim());

/** Alandaki gerçek görsel adresleri (sırayla). */
export const productImages = (v?: string | null): string[] => (v || '').split(',').map(s => s.trim()).filter(isImageUrl);

/** Görseli yoksa gösterilecek emoji (yönetici seçtiyse o, değilse kemik). */
export const productEmoji = (v?: string | null): string => (v && !isImageUrl(v) && v.trim().length <= 12 ? v.trim() : '🦴');
