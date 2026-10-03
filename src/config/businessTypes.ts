import type { BusinessType } from "@/context/AuthContext";

// Faz 2/3 (işletme türü mimarisi, 2026-09-25) — TEK kaynak: işletme paneli
// bugüne kadar her işletmeye (türü ne olursa olsun) aynı vet-odaklı ekranı
// gösteriyordu (bkz. CLAUDE.md Bölüm 8.31/mimari raporu). Bu dosya paneldeki
// HİÇBİR yerde tekrar edilmemesi gereken tek kayıt defteri — Sidebar,
// Hizmetlerim varsayılanları ve personel etiketi (Doktor/Bakıcı/Eğitmen)
// hep buradan okunuyor. Yeni bir tür eklemek = buraya bir satır eklemek.
//
// Müşteri keşif ekranı da aynı kayıttan işletme adı, hizmet kısayolları ve
// randevu/sipariş akışı metinlerini alır; sipariş tabanlı türler mağazaya gider.

export type SidebarItemKey =
  | 'dashboard' | 'calendar' | 'appointments' | 'patients' | 'migration' | 'finance'
  | 'orders' | 'services' | 'doctors' | 'products' | 'campaigns' | 'profile';

export const BUSINESS_TYPE_ORDER: BusinessType[] = ['vet', 'grooming', 'trainer', 'shelter', 'petshop'];

export interface BusinessTypeConfig {
  label: string;
  customerLabel: string;
  customerTitle: string;
  customerSearchPlaceholder: string;
  customerMapSearchQuery: string;
  customerBookingLabel: string;
  customerSubmitLabel: string;
  customerRequestTitle: string;
  customerFallbackService: string;
  customerShortcuts: { key: string; label: string; icon: string; keywords: string[] }[];
  /** Müşterinin işletmeyle randevu talebi mi yoksa ürün siparişi mi oluşturduğunu belirler. */
  primaryFlow: 'appointment' | 'order';
  /** "Doktor Ekle" gibi personel/kaynak etiketleri buradan gelir. */
  staffLabel: string;
  staffLabelPlural: string;
  /** Faz 3.1 — randevu tamamlama akışında aşı/ilaç/tıbbi kayıt (EMR) formu SADECE bu true olan türlerde gösterilir. */
  hasMedicalRecords: boolean;
  sidebar: SidebarItemKey[];
  defaultServices: { name: string; duration: number; icon: string }[];
}

export const BUSINESS_TYPE_CONFIG: Record<BusinessType, BusinessTypeConfig> = {
  vet: {
    label: 'Veteriner Kliniği',
    customerLabel: 'Veteriner',
    customerTitle: 'Veteriner Bul',
    customerSearchPlaceholder: 'Veteriner, klinik veya hizmet ara...',
    customerMapSearchQuery: 'veteriner kliniği',
    customerBookingLabel: 'Randevu Al',
    customerSubmitLabel: 'Randevu talebini ilet',
    customerRequestTitle: 'Randevu oluştur',
    customerFallbackService: 'Genel Muayene',
    customerShortcuts: [
      { key: 'muayene', label: 'Genel Muayene', icon: '🩺', keywords: ['muayene', 'genel'] },
      { key: 'acil', label: 'Acil Servis', icon: '🚨', keywords: ['acil'] },
      { key: 'asi', label: 'Aşı', icon: '💉', keywords: ['aşı', 'asi'] },
      { key: 'dis', label: 'Diş Sağlığı', icon: '🦷', keywords: ['diş', 'dis'] },
    ],
    primaryFlow: 'appointment',
    staffLabel: 'Doktor',
    staffLabelPlural: 'Doktorlar',
    hasMedicalRecords: true,
    sidebar: ['dashboard', 'calendar', 'appointments', 'patients', 'migration', 'finance', 'services', 'doctors', 'campaigns', 'profile'],
    defaultServices: [
      { name: "Genel Muayene", duration: 20, icon: "🩺" },
      { name: "Aşı", duration: 15, icon: "💉" },
      { name: "Diş Bakımı/Temizliği", duration: 30, icon: "🦷" },
      { name: "Kontrol/Takip", duration: 15, icon: "📅" },
      { name: "Acil Müdahale", duration: 45, icon: "🚨" },
      { name: "Ameliyat/Operasyon", duration: 90, icon: "⚕️" },
      { name: "Laboratuvar/Tahlil", duration: 20, icon: "🧪" },
      { name: "Kısırlaştırma", duration: 60, icon: "🩺" },
      { name: "Ultrason/Görüntüleme", duration: 25, icon: "🖥️" },
    ],
  },
  grooming: {
    label: 'Pet Kuaförü / Bakım Salonu',
    customerLabel: 'Kuaför',
    customerTitle: 'Pet Kuaförü Bul',
    customerSearchPlaceholder: 'Kuaför, bakım salonu veya hizmet ara...',
    customerMapSearchQuery: 'pet kuaförü',
    customerBookingLabel: 'Bakım Randevusu Al',
    customerSubmitLabel: 'Bakım randevusu talebini ilet',
    customerRequestTitle: 'Bakım randevusu oluştur',
    customerFallbackService: 'Bakım randevusu',
    customerShortcuts: [
      { key: 'wash', label: 'Yıkama', icon: '🛁', keywords: ['yıkama', 'yikama'] },
      { key: 'trim', label: 'Tıraş / Trim', icon: '✂️', keywords: ['tıraş', 'tiras', 'trim'] },
      { key: 'nails', label: 'Tırnak Bakımı', icon: '🐾', keywords: ['tırnak', 'tirnak'] },
      { key: 'coat', label: 'Tüy Bakımı', icon: '🪮', keywords: ['tüy', 'tuy', 'fırçalama', 'fircalama'] },
    ],
    primaryFlow: 'appointment',
    staffLabel: 'Bakıcı',
    staffLabelPlural: 'Bakıcılar',
    hasMedicalRecords: false,
    sidebar: ['dashboard', 'calendar', 'appointments', 'patients', 'finance', 'services', 'doctors', 'campaigns', 'profile'],
    defaultServices: [
      { name: "Yıkama", duration: 30, icon: "🛁" },
      { name: "Tıraş / Trim", duration: 45, icon: "✂️" },
      { name: "Tırnak Kesimi", duration: 15, icon: "💅" },
      { name: "Kulak Temizliği", duration: 15, icon: "👂" },
      { name: "Tüy Bakımı / Fırçalama", duration: 20, icon: "🪮" },
      { name: "Tam Bakım Paketi", duration: 90, icon: "✨" },
    ],
  },
  trainer: {
    label: 'Eğitmen',
    customerLabel: 'Eğitmen',
    customerTitle: 'Eğitmen Bul',
    customerSearchPlaceholder: 'Eğitmen veya eğitim hizmeti ara...',
    customerMapSearchQuery: 'köpek eğitim merkezi',
    customerBookingLabel: 'Ders Talep Et',
    customerSubmitLabel: 'Ders talebini ilet',
    customerRequestTitle: 'Eğitim dersi talep et',
    customerFallbackService: 'Eğitim dersi',
    customerShortcuts: [
      { key: 'obedience', label: 'İtaat Eğitimi', icon: '🐾', keywords: ['itaat'] },
      { key: 'social', label: 'Sosyalleşme', icon: '🤝', keywords: ['sosyalleşme', 'sosyallesme'] },
      { key: 'behavior', label: 'Davranış', icon: '🎯', keywords: ['davranış', 'davranis'] },
      { key: 'private', label: 'Özel Ders', icon: '⭐', keywords: ['özel ders', 'ozel ders', 'birebir'] },
    ],
    primaryFlow: 'appointment',
    staffLabel: 'Eğitmen',
    staffLabelPlural: 'Eğitmenler',
    hasMedicalRecords: false,
    sidebar: ['dashboard', 'calendar', 'appointments', 'patients', 'finance', 'services', 'doctors', 'campaigns', 'profile'],
    defaultServices: [
      { name: "Temel İtaat Eğitimi", duration: 60, icon: "🐾" },
      { name: "Sosyalleşme Eğitimi", duration: 60, icon: "🤝" },
      { name: "Tuvalet Eğitimi", duration: 45, icon: "🚽" },
      { name: "Davranış Düzeltme", duration: 60, icon: "🎯" },
      { name: "Özel Ders (Birebir)", duration: 60, icon: "⭐" },
      { name: "Grup Dersi", duration: 90, icon: "👥" },
    ],
  },
  shelter: {
    label: 'Barınak',
    customerLabel: 'Barınak',
    customerTitle: 'Barınakları Keşfet',
    customerSearchPlaceholder: 'Barınak veya hizmet ara...',
    customerMapSearchQuery: 'hayvan barınağı',
    customerBookingLabel: 'Ziyaret Talep Et',
    customerSubmitLabel: 'Ziyaret talebini ilet',
    customerRequestTitle: 'Barınak ziyareti talep et',
    customerFallbackService: 'Barınak ziyareti',
    customerShortcuts: [],
    primaryFlow: 'appointment',
    staffLabel: 'Gönüllü',
    staffLabelPlural: 'Gönüllüler',
    hasMedicalRecords: false,
    sidebar: ['dashboard', 'calendar', 'appointments', 'patients', 'campaigns', 'profile'],
    defaultServices: [],
  },
  petshop: {
    label: 'Pet Shop',
    customerLabel: 'Pet Shop',
    customerTitle: 'Pet Shop',
    customerSearchPlaceholder: 'Ürün ara...',
    customerMapSearchQuery: 'pet shop',
    customerBookingLabel: 'Ürünleri Keşfet',
    customerSubmitLabel: '',
    customerRequestTitle: 'Ürünleri keşfet',
    customerFallbackService: '',
    customerShortcuts: [],
    primaryFlow: 'order',
    staffLabel: 'Personel',
    staffLabelPlural: 'Personel',
    hasMedicalRecords: false,
    sidebar: ['dashboard', 'orders', 'products', 'finance', 'campaigns', 'profile'],
    defaultServices: [],
  },
};

export function getBusinessTypeConfig(businessType?: BusinessType | null): BusinessTypeConfig {
  return BUSINESS_TYPE_CONFIG[businessType || 'vet'] || BUSINESS_TYPE_CONFIG.vet;
}

/**
 * Moffi mağazasında ürün satan tür (sipariş akışı = pet shop). Yalnızca bunlardan IBAN istenir; sunucu aynı kuralı
 * submit_business_application ve ürün ekleme kuralında (business_can_sell) uygular.
 */
export function sellsProducts(businessType: BusinessType): boolean {
  return getBusinessTypeConfig(businessType).primaryFlow === 'order';
}

export function isBusinessType(value: string | null): value is BusinessType {
  return value !== null && Object.prototype.hasOwnProperty.call(BUSINESS_TYPE_CONFIG, value);
}
