import type { BusinessType } from "@/context/AuthContext";

// Faz 2/3 (işletme türü mimarisi, 2026-09-25) — TEK kaynak: işletme paneli
// bugüne kadar her işletmeye (türü ne olursa olsun) aynı vet-odaklı ekranı
// gösteriyordu (bkz. CLAUDE.md Bölüm 8.31/mimari raporu). Bu dosya paneldeki
// HİÇBİR yerde tekrar edilmemesi gereken tek kayıt defteri — Sidebar,
// Hizmetlerim varsayılanları ve personel etiketi (Doktor/Bakıcı/Eğitmen)
// hep buradan okunuyor. Yeni bir tür eklemek = buraya bir satır eklemek.
//
// Bilinçli olarak dokunulmayan (ayrı, daha büyük bir iş): appointments
// sayfasındaki muayene-tamamlama akışı (aşı/ilaç/tıbbi kayıt yazma) hâlâ
// her türde aynı şekilde çalışıyor — bunu sadece hasMedicalRecords=true
// olan türlerde göstermek, 2400 satırlık o dosyaya dokunmayı gerektiriyor,
// bu turun kapsamına (kredi/zaman kısıtı gereği) alınmadı.

export type SidebarItemKey =
  | 'dashboard' | 'appointments' | 'patients' | 'migration' | 'finance'
  | 'orders' | 'services' | 'doctors' | 'products' | 'campaigns' | 'quests';

interface BusinessTypeConfig {
  label: string;
  /** Randevu tabanlı mı (vet/grooming/trainer/shelter) yoksa sipariş tabanlı mı (petshop) — Faz 4/5'te kullanılacak, bugün sadece belgeleme amaçlı. */
  primaryFlow: 'appointment' | 'order';
  /** "Doktor Ekle" gibi personel/kaynak etiketleri buradan gelir. */
  staffLabel: string;
  staffLabelPlural: string;
  sidebar: SidebarItemKey[];
  defaultServices: { name: string; duration: number; icon: string }[];
}

export const BUSINESS_TYPE_CONFIG: Record<BusinessType, BusinessTypeConfig> = {
  vet: {
    label: 'Veteriner Kliniği',
    primaryFlow: 'appointment',
    staffLabel: 'Doktor',
    staffLabelPlural: 'Doktorlar',
    sidebar: ['dashboard', 'appointments', 'patients', 'migration', 'finance', 'services', 'doctors', 'campaigns', 'quests'],
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
    primaryFlow: 'appointment',
    staffLabel: 'Bakıcı',
    staffLabelPlural: 'Bakıcılar',
    sidebar: ['dashboard', 'appointments', 'patients', 'finance', 'services', 'doctors', 'campaigns', 'quests'],
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
    primaryFlow: 'appointment',
    staffLabel: 'Eğitmen',
    staffLabelPlural: 'Eğitmenler',
    sidebar: ['dashboard', 'appointments', 'patients', 'finance', 'services', 'doctors', 'campaigns', 'quests'],
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
    primaryFlow: 'appointment',
    staffLabel: 'Gönüllü',
    staffLabelPlural: 'Gönüllüler',
    sidebar: ['dashboard', 'appointments', 'patients', 'campaigns', 'quests'],
    defaultServices: [],
  },
  petshop: {
    label: 'Pet Shop',
    primaryFlow: 'order',
    staffLabel: 'Personel',
    staffLabelPlural: 'Personel',
    sidebar: ['dashboard', 'orders', 'products', 'finance', 'campaigns', 'quests'],
    defaultServices: [],
  },
};

export function getBusinessTypeConfig(businessType?: BusinessType | null): BusinessTypeConfig {
  return BUSINESS_TYPE_CONFIG[businessType || 'vet'] || BUSINESS_TYPE_CONFIG.vet;
}
