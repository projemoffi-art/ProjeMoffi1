// Faz 2/3/4: ActivityContext'teki WalkIssue state machine değerlerinin
// kullanıcıya gösterilecek kısa Türkçe açıklaması. WalkQuickSheet ve
// /walk/tracking arasında paylaşılır (aynı metin iki yerde tekrar etmesin diye).
export const WALK_ISSUE_LABELS: Record<string, string> = {
    location_permission_required: 'Konum izni gerekiyor — tarayıcı ayarlarından izin ver.',
    gps_searching: 'GPS sinyali aranıyor...',
    gps_weak: 'GPS sinyali zayıf, mesafe hesabı etkilenebilir.',
    location_lost: 'Konum sinyali kayboldu, yeniden bulunmaya çalışılıyor...',
    network_unavailable: 'İnternet bağlantısı yok, veriler cihazda tutuluyor.',
    background_permission_required: 'Uygulama arka planda, takip kesintiye uğrayabilir.',
    error: 'Bir GPS hatası oluştu.',
};
