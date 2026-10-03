// Kenar panelinin kısayol kataloğu: TEK kaynak. Panelin kendi düzenleme ekranı ve Ayarlar → Kenar Paneli
// aynı listeyi kullanır. Her kısayol gerçek bir ekrana ya da pencereye gider; sahte/yarım ekranlar yok.
// Kullanıcının seçimi profiles.settings.edge.activeActions'ta (eski kimlikler okunurken ayıklanır).

import {
    Award, Bell, Building2, CalendarCheck, Compass, Gamepad2, HeartHandshake, HeartPulse, History,
    Megaphone, MessageCircle, Pill, PlusSquare, QrCode, Search, Settings, ShieldAlert, ShoppingBag,
    ShoppingCart, Sparkles, Stethoscope, Syringe, Target,
} from 'lucide-react';

export type EdgeShortcutId =
    | 'ai' | 'post' | 'tag' | 'sos' | 'vet' | 'appointments' | 'health' | 'vaccine' | 'meds'
    | 'market' | 'cart' | 'lost' | 'adoption' | 'feed' | 'messages' | 'quests' | 'badges' | 'games'
    | 'walks' | 'notifications' | 'search' | 'settings' | 'business';

export interface EdgeShortcut {
    id: EdgeShortcutId;
    label: string;
    desc: string;
    Icon: typeof Sparkles;
    color: string;
    /** Uygulama içi yol ya da açılacak pencere olayı; 'tag' ve 'messages' panelin kendisinde ele alınır. */
    path?: string;
    event?: string;
    group: 'Hızlı' | 'Sağlık' | 'Alışveriş' | 'Topluluk' | 'Aktivite' | 'Uygulama';
}

export const EDGE_SHORTCUTS: EdgeShortcut[] = [
    { id: 'ai', label: 'Moffi AI', desc: 'Dostun hakkında soru sor', Icon: Sparkles, color: '#EE5B3D', event: 'open-ai-assistant', group: 'Hızlı' },
    { id: 'post', label: 'Paylaş', desc: 'Yeni gönderi oluştur', Icon: PlusSquare, color: '#E8A33D', path: '/community/yeni', group: 'Hızlı' },
    { id: 'tag', label: 'Künye QR', desc: 'Okutulunca künye sayfası açılır', Icon: QrCode, color: '#564B40', group: 'Hızlı' },
    { id: 'sos', label: 'Acil SOS', desc: 'Kayıp ve acil durum merkezi', Icon: ShieldAlert, color: '#D9432F', event: 'open-sos-center', group: 'Hızlı' },
    { id: 'notifications', label: 'Bildirimler', desc: 'Son bildirimlerin', Icon: Bell, color: '#7A6E60', event: 'open-notification-drawer', group: 'Hızlı' },
    { id: 'search', label: 'Ara', desc: 'Kişi, gönderi, hayvan ara', Icon: Search, color: '#8A7E6F', event: 'open-moffi-spotlight', group: 'Hızlı' },

    { id: 'health', label: 'Sağlık', desc: 'Sağlık Merkezi', Icon: HeartPulse, color: '#8B7FD9', path: '/health', group: 'Sağlık' },
    { id: 'vaccine', label: 'Aşılar', desc: 'Aşı takvimi', Icon: Syringe, color: '#9C6FD0', path: '/health/asilar', group: 'Sağlık' },
    { id: 'meds', label: 'İlaçlar', desc: 'Tedavi ve dozlar', Icon: Pill, color: '#6BAF3A', path: '/health/ilaclar', group: 'Sağlık' },
    { id: 'vet', label: 'Veteriner', desc: 'Klinik bul', Icon: Stethoscope, color: '#2F9E8F', path: '/vet', group: 'Sağlık' },
    { id: 'appointments', label: 'Randevular', desc: 'Randevularım', Icon: CalendarCheck, color: '#2B8577', path: '/vet?view=appointments', group: 'Sağlık' },

    { id: 'market', label: 'Market', desc: 'Mama ve aksesuar', Icon: ShoppingBag, color: '#E07A2E', path: '/petshop', group: 'Alışveriş' },
    { id: 'cart', label: 'Sepet', desc: 'Sepetim', Icon: ShoppingCart, color: '#C9663A', path: '/cart', group: 'Alışveriş' },

    { id: 'feed', label: 'Keşfet', desc: 'Topluluk akışı', Icon: Compass, color: '#D9567A', path: '/community', group: 'Topluluk' },
    { id: 'messages', label: 'Mesajlar', desc: 'Sohbetlerin', Icon: MessageCircle, color: '#C2557F', group: 'Topluluk' },
    { id: 'lost', label: 'Kayıp', desc: 'Kayıp ilanları', Icon: Megaphone, color: '#E0623F', path: '/kayip', group: 'Topluluk' },
    { id: 'adoption', label: 'Sahiplen', desc: 'Yuva arayanlar', Icon: HeartHandshake, color: '#E0719A', path: '/sahiplendirme', group: 'Topluluk' },

    { id: 'walks', label: 'Yürüyüşler', desc: 'Yürüyüş geçmişi', Icon: History, color: '#7A8F3A', path: '/walk/history', group: 'Aktivite' },
    { id: 'quests', label: 'Görevler', desc: 'Günlük görevler', Icon: Target, color: '#5E9E3A', path: '/quests', group: 'Aktivite' },
    { id: 'badges', label: 'Rozetler', desc: 'Kazandıkların', Icon: Award, color: '#C9A227', path: '/walk/badges', group: 'Aktivite' },
    { id: 'games', label: 'Oyunlar', desc: 'Mini oyunlar', Icon: Gamepad2, color: '#4F9D69', path: '/game', group: 'Aktivite' },

    { id: 'settings', label: 'Ayarlar', desc: 'Uygulama ayarları', Icon: Settings, color: '#6F675B', event: 'open-moffi-settings', group: 'Uygulama' },
    { id: 'business', label: 'İşletme', desc: 'İşletme paneli', Icon: Building2, color: '#201B16', path: '/business/dashboard', group: 'Uygulama' },
];

export const DEFAULT_EDGE_SHORTCUTS: EdgeShortcutId[] = ['ai', 'post', 'tag', 'sos', 'vet', 'health', 'market', 'notifications'];
export const MIN_EDGE_SHORTCUTS = 4;
export const MAX_EDGE_SHORTCUTS = 12;

const KNOWN = new Set<string>(EDGE_SHORTCUTS.map(s => s.id));

/** Kayıtlı seçimi okur; artık var olmayan (eski panelden kalan) kimlikleri ayıklar, sırayı korur. */
export function normalizeEdgeShortcuts(saved: unknown): EdgeShortcutId[] {
    const list = Array.isArray(saved) ? saved.filter((id): id is EdgeShortcutId => typeof id === 'string' && KNOWN.has(id)) : [];
    const unique = Array.from(new Set(list));
    return unique.length >= MIN_EDGE_SHORTCUTS ? unique.slice(0, MAX_EDGE_SHORTCUTS) : DEFAULT_EDGE_SHORTCUTS;
}

export const EDGE_HANDLE_LEVELS = [
    { value: 0.35, label: 'Soluk' },
    { value: 0.6, label: 'Normal' },
    { value: 0.9, label: 'Belirgin' },
] as const;

export function readEdgeSettings(edge: { activeActions?: unknown; position?: unknown; handleOpacity?: unknown; hapticsEnabled?: unknown } | null | undefined) {
    const opacity = typeof edge?.handleOpacity === 'number' ? edge.handleOpacity : 0.6;
    const level = EDGE_HANDLE_LEVELS.reduce((best, l) => (Math.abs(l.value - opacity) < Math.abs(best.value - opacity) ? l : best), EDGE_HANDLE_LEVELS[1]);
    return {
        shortcuts: normalizeEdgeShortcuts(edge?.activeActions),
        position: (edge?.position === 'right' ? 'right' : 'left') as 'left' | 'right',
        handleOpacity: level.value as number,
        hapticsEnabled: edge?.hapticsEnabled !== false,
    };
}
