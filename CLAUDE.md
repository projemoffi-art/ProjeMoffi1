# Moffi — Proje Hafızası (CLAUDE.md)

Bu dosya, bu projede çalışan her Claude Code oturumunun **otomatik olarak okuduğu**
kalıcı proje hafızasıdır. Amacı: sıfırdan başlamamak — geçmişte öğrenilen mimari
kararları, tuzakları ve çalışma kurallarını her seferinde yeniden keşfetmemek.

Bu dosyayı güncel tut: yeni bir mimari karar alındığında, yeni bir kritik tuzak
bulunduğunda veya bir Faz tamamlandığında buraya ekle.

---

> **Arşiv:** bu dosya bugün geçerli kural, mimari ve açık işleri tutar. Faz faz tam anlatı (hangi hata nasıl bulundu,
> test ayrıntıları) `docs/gecmis/claude-md-2026-10-02-tam.md` içinde, Bölüm numaralarıyla aynı. Bir bölümün ayrıntısı
> gerekirse oraya bak; kuralı/mimariyi güncellerken ikisini karıştırma, yeni anlatıyı arşive değil buraya KISA yaz.

## 1. Proje nedir

Moffi, Türkiye pazarına yönelik bir evcil hayvan ekosistemi platformu:
sahiplenme, sağlık takibi (aşı, veteriner, diş, ilaç), beslenme, sosyal
topluluk (mesajlaşma, gönderi), klinik/işletme paneli ve e-ticaret (mama,
aksesuar) bir arada.

- **Sahibi:** Baran (proje kurucusu, ürün kararlarını o veriyor, gerçek cihaz/tarayıcı
  testlerini o yapıyor). Şirket, bir aile üyesinin adına kayıtlı.
- **Geliştirme modeli:** Kod tabanının tamamı Baran + AI ajanları (Antigravity,
  Claude) tarafından yazıldı. Hiçbir dış katkıcı dokunmadı.
- **İletişim dili:** Baran Türkçe konuşuyor, uygulama arayüzü Türkçe.

## 2. Teknoloji yığını

- **Frontend/Framework:** Next.js 16 (App Router, `--webpack` build modu),
  React 19, TypeScript, Tailwind CSS 4
- **Backend/DB:** Supabase (Postgres + Auth + Realtime + Storage), proje ref:
  `kedbmjupdwuxtatscyjg`, bölge `eu-central-1`, Postgres 17.6.1
- **Ödeme:** mağaza siparişleri PayTR (`/api/paytr/*`); Prime ve PawCoin paketleri App Store/Google Play, RevenueCat
  (`@revenuecat/purchases-capacitor`, 8.61). Stripe paketleri kodda ölü (kullanılmıyor).
- **Yapay zekâ:** Google Gemini (`@google/generative-ai`, model `gemini-2.5-flash-lite`), tüm çağrılar `lib/server/aiGuard.ts` kapısından (8.60).
  `ai`/`@ai-sdk/google`/OpenAI paketleri kullanılmıyor.
- **Telefon uygulaması:** Capacitor 8 (`android/`, `ios/`, `capacitor.config.ts`), uygulama canlı siteyi açar; telefon özellikleri `src/native` (8.58–8.59).
- **E-posta:** Resend (uygulama bildirimleri `email_outbox` kuyruğu + Vercel; Supabase auth kodları Supabase SMTP üzerinden aynı Resend).
- **3D/Görsel:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **Diğer:** `date-fns`, `framer-motion`, `leaflet`/`react-leaflet` (harita), `qrcode`/`qrcode.react`, `jspdf`, `xlsx`, `canvas-confetti`
- **Deploy:** Vercel

Komutlar: `npm run dev`, `npm run build` (webpack modunda), `npm run lint`.

**Proje konumu (2026-10-02):** `D:\Dev\moffi` (OneDrive dışı). Eski `OneDrive\Masaüstü\ProjeMoffi1` ve
`C:\Dev\moffi` kopyaları artık kullanılmıyor. D: diskine taşıma hem Bölüm 5.6'daki OneDrive/Turbopack ikon
çökmelerini ve "yalnızca bulutta" `node_modules` sorununu hem de C: diskindeki yer darlığını çözdü.

**Telefon önizleme:** `npm run dev` açıkken `http://localhost:<port>/live` uygulamayı telefon çerçevesinde
gösterir (Baran bunu Claude panelinin yanındaki tarayıcıda kullanıyor; `src/app/live/route.ts`, sadece
geliştirmede çalışır). Eskiden geçici klasörde duruyordu ve kayboldu; silme. Canlı sitede (production) 404 döner.
Port normalde 3000'dir; doluysa Next.js 3001, 3002… seçer, gerçek adres sunucu penceresinde yazar. Sunucuyu
Claude'un arka plan komutuyla değil (en fazla 2 saat yaşar), kendi penceresinde aç:
`Start-Process cmd -ArgumentList '/k','npm run dev' -WorkingDirectory D:\Dev\moffi` — pencere kapanınca sunucu da kapanır.

## 3. Git güvenlik kuralı — MUTLAK, İSTİSNASIZ

🔴 Proje kökünde ayrıca bir `AGENTS.md` dosyası var (Antigravity için yazılmış)
ve oradaki şu kural burada da aynen geçerli — iki ajan arasında tutarlılık için:

- **`git checkout`, `git restore`, `git reset` gibi bir dosyayı/değişikliği geri
  alan hiçbir komut, Baran'ın o spesifik işlem için açık onayı olmadan asla
  çalıştırılmaz.** İstisnası yok.
- Varsayılan olarak serbest olan git komutları SADECE: `git status`, `git diff`,
  `git log`, `git show`, `git add <belirli dosya>`, `git commit`, `git push`.
- Bunların dışında bir git komutu (checkout, restore, reset, stash, clean,
  `branch -D` vb.) gerekiyorsa, ÖNCE dur ve Baran'dan açık onay iste.
- Bir değişiklik beklenmedik/yanlış/eksik sonuç verdiyse, bunu git ile geri
  almaya ÇALIŞMA. Onun yerine: (1) dosyanın doğru halini baştan tam olarak
  yaz, ya da (2) sadece hatalı satırları manuel düzelt. Emin değilsen dur,
  Baran'a sor.
- "Hızlıca düzeltmem lazım" hissi bu kuralın istisnası değildir — tam tersine,
  kuralın en çok gerekli olduğu andır.

## 4. Çalışma felsefesi — EN ÖNEMLİ İKİNCİ KURAL

🔴 **Geçici yama / band-aid çözüm YOK.** Baran açıkça, daha fazla iş gerektirse
bile her zaman kalıcı ve doğru çözümü istiyor. "Şimdilik böyle dursun, sonra
düzeltiriz" yaklaşımı kabul edilmiyor.

Bundan çıkan pratik kurallar:
- Bir hata düzeltilirken önce **kök nedeni** bul (belirti değil). Örnek: mesajlar
  anlık gelmiyor sorunu, aslında `receiver_id` insert'te set edilmediği için
  Supabase Realtime'ın RLS'i doğrulayamamasıydı — sadece "sayfayı yenile" gibi
  bir görünüşte çözüm değil, gerçek insert sorgusu düzeltildi.
- Yeni bir özellik/bileşen eklemeden önce, **aynı işi yapan başka bir bileşen
  zaten var mı** diye kod tabanında ara (bkz. Bölüm 7 — CareHubModal örneği).
  Bu projede kod tekrarı / birbirinden habersiz paralel sistemler ciddi bir risk.
- Bir değişiklik yaptıktan sonra **gerçekten çalıştığını doğrula** (build/lint
  çalıştır, ilgili tabloyu/veriyi sorgula, dosyayı tekrar oku) — "yazdım, çalışır
  diye varsayıyorum" değil.
- Güvenlik adımlarını atlama: RLS politikalarını, publication ayarlarını,
  yetkilendirme kontrollerini değişiklik öncesi ve sonrası kontrol et.
- 🔴 **Dokunduğun dosyayı temiz bırak (Baran, 2026-10-03):** "işlevsel sorun yaratmıyor" diye hata bırakılmaz. Değiştirdiğin her dosya
  tip kontrolünden (tsc) ve lint'ten (`npx eslint <dosya>`) HATASIZ çıkar — dosyada senden önce kalan hatalar dahil. Tüm kod tabanının borcu
  Bölüm 12.3'te sayıyla tutulur ve yalnızca azalır. Tip kontrolünü kaynak üzerinde çalıştır: `.next/dev/types` geliştirme sunucusu
  yeniden derlerken yarım kalabiliyor ve sözdizimi hatası verip asıl kontrolü durduruyor (`include` yalnız `src/**` olan geçici bir tsconfig).

## 5. Tasarım prensipleri

- **Sadelik/minimalizm öncelikli.** Parlak, "rainbow dashboard" tarzı renk
  paletlerinden kaçın (bir örnek: silinen CareHubModal'da 13+ farklı renk
  vardı — text-red-400, text-emerald-400, text-cyan-400, text-indigo-400, vs. —
  bu doğrudan bu prensibe aykırıydı ve düzeltme sebeplerinden biriydi).
- **Mavi "premium değil" olarak görülüyor** — Baran mavi tonlarını özellikle
  reddetti. Nötr/monokrom (zinc/gray tonları) + tek bir vurgu rengi (genelde
  indigo, mor, amber) tercih edilen palet yapısı.
- Örnek iyi uygulamalar: `VaccineModal.tsx`, `NutritionModal.tsx`,
  `DentalCareModal.tsx`, `MedicationModal.tsx`, `PharmacyModal.tsx` — hepsi
  ağırlıklı nötr zinc tonu + tek aksan renk kullanıyor, bu zaten hedeflenen
  estetiğe yakın.

## 6. Kritik teknik tuzaklar (tekrar keşfetme, buradan oku)

### 5.1 Supabase Realtime + RLS sınırlaması (ÇOK ÖNEMLİ)

Supabase Realtime'ın `postgres_changes` yetkilendirme motoru, başka bir tabloya
JOIN/subquery yapan RLS politikalarını **güvenilir şekilde değerlendiremiyor**
(örn. `EXISTS (SELECT 1 FROM conversations WHERE ...)`). Sadece basit,
tek-tablo kolon kontrollerini güvenilir değerlendiriyor (örn.
`sender_id = auth.uid()`).

**Sonuç:** Eğer bir tabloda Realtime canlı güncelleme bekleniyorsa ve RLS
politikası join içeriyorsa, o satırın karşı tarafının (örn. alıcının)
kendi ID'sini doğrudan tutan bir kolonu (örn. `receiver_id`) olmalı ve o
kolon insert sırasında mutlaka doldurulmalı. `messages` tablosunda bu
eksikti, mesajlar sadece sayfa yenilenince (normal sorgu join'i tam
çalıştırdığı için) görünüyordu, Realtime hiç tetiklenmiyordu.

Ayrıca: bir tablo `postgres_changes` ile dinlenecekse, o tablo
`supabase_realtime` publication'ına eklenmiş olmalı
(`alter publication supabase_realtime add table public.X;`).

### 5.2 Mesajlaşma sistemi mimarisi (referans)

- `src/context/ChatContext.tsx` — realtime INSERT/UPDATE dinleyicileri,
  presence (çevrimiçi durumu), typing indicator state'i burada.
- `src/components/community/InboxModal.tsx` — mesajlaşma arayüzü, mesaj
  balonu renkleri (gönderilen: amber/açık ton, gelen: cyan).
- `src/services/supabaseApiService.ts` — `sendChatMessage()` (satır ~3383
  civarı) mesaj insert'i yapıyor, `receiver_id` MUTLAKA set edilmeli.
- **Çevrimiçi durumu:** gerçek Supabase Presence kullanılıyor (`'online-users'`
  paylaşımlı kanal, `presence.track()`). Arka plan sekmesi throttle sorununa
  karşı `visibilitychange` dinleyicisi + 25 saniyelik heartbeat var — bu
  olmadan sekme arka plana geçince "çevrimdışı" gibi görünebiliyordu.
- **Yazıyor göstergesi:** RLS'den bağımsız, ephemeral `broadcast` kanalı
  kullanıyor (`typing-${sortedPairKey}`), publication/RLS'e tabi değil.

### 5.3 Global vs. sayfa-lokal modal mimarisi

- `src/components/common/GlobalCareModals.tsx`: `VaccineModal` ve
  `NutritionModal`'ı her sayfadan erişilebilir şekilde global olarak render
  ediyor, `window` üzerinden `'open-care-hub'` custom event'i dinliyor
  (`detail: { tab: 'health' | 'vaccine' | 'nutrition' }`).
- `src/components/common/DynamicNavigation.tsx`: alt menüdeki hızlı erişim
  butonları (`'carehub'`, `'nutrition'`) bu event'i **herhangi bir sayfadan**
  fırlatabiliyor — bu yüzden Vaccine/Nutrition modalları global olmak zorunda.
- `DentalCareModal`, `PharmacyModal`, `MedicationModal` ise SADECE
  `src/app/vet/page.tsx` içinden erişildiği için o sayfaya lokal olarak
  tanımlı — bu bir hata değil, doğru mimari (sadece `/vet` sayfasından
  ulaşılabiliyorlar, global olmalarına gerek yok).

### 5.4 Beslenme ("Nutrition") — iki paralel, birbirinden habersiz sistem (AÇIK SORUN)

Şu an platformda iki ayrı "beslenme" konsepti var, birbirine bağlı değil:

1. **`NutritionModal.tsx`** (vet klasörü) — "veteriner onaylı diyet planı"
   kaydı, gerçek Supabase tablosu `nutrition_plans` (`getNutritionPlan` /
   `updateNutritionPlan`, `supabaseApiService.ts` satır ~2596). Ana sayfadaki
   "Beslenme" halkasından ve alt menüden `open-care-hub` event'i ile açılıyor.
   **Canlı veritabanında bu tabloda 0 satır var (platformdaki 15 hayvanın
   hiçbirinde plan yok)** — bomboş kart bu yüzden çıkıyor, bug değil.
2. **`/food` sayfası** (`src/app/food/page.tsx`) — çok daha zengin bir günlük
   beslenme takip arayüzü (`NutritionRing`, `WaterTracker`, `MealLoggerModal`,
   `DietSetupWizard`, `MacroChart`, `MoffiPantry`, `FoodGradeCard`,
   `SmartMealCard`). **Tamamen `localStorage` üzerinde çalışıyor, hiç
   Supabase bağlantısı yok** — girilen veri gerçek veritabanına hiç gitmiyor.

**Henüz karara bağlanmadı, ama önerilen yön:** ana sayfa halkasını
`NutritionModal` yerine `/food` sayfasına yönlendirmek + `/food`'un
localStorage kısmını gerçek Supabase tablolarına taşımak. `NutritionModal`'ı
tamamen silmek yerine, veterinerin resmi reçete girişi olarak `/vet` akışına
taşımak (Bölüm 5.3'teki DentalCareModal örneği gibi lokal hale getirmek)
mantıklı. Bu Faz 12.5/19'un "ilk izlenim" (ana sayfa) yenilemesiyle bağlantılı.

Küçük ek not: `NutritionModal`'daki dolu-plan görünümünde "DİYETİSYENE SOR"
butonunun `onClick` işlevi yok (dead button) — küçük ama düzeltilmesi gereken
bir detay.

### 5.5 State machine'i localStorage'a bölünmüş şekilde yazarken dikkat (Faz 2-5 kontrolü, `ActivityContext.tsx`)

Bir state'i (örn. yarım kalmış yürüyüş) mount sırasında normal state yerine
ayrı bir "beklemede/onay gerekiyor" state'ine (örn. `recoverableWalk`) yönlendirdiğinde,
projede zaten var olan genel "değişiklik olunca localStorage'a yaz" efekti hâlâ
ESKİ (yeni yönlendirilen) state'i (`walkData`, artık boş/idle) izliyor olabilir —
ve kullanıcı henüz onay vermeden o efekt localStorage'daki gerçek anlık görüntüyü
sessizce boş veriyle ezer. Sonuç: kullanıcı onay ekranını görmeden sayfayı bir
kez daha yenilerse veri kaybolur. **Ders:** yeni bir "beklemede" state'i
eklerken, o state boşalana kadar genel persistans efektinin İLGİLİ localStorage
anahtarına dokunmamasını sağla (bkz. `discardRecoveredWalk`/`continueRecoveredWalk`
ve persistans `useEffect`'indeki `recoverableWalk` guard'ı). Aynı derste: bir
"tamamlandı" gibi geçici state fazı varsa, o fazı sadece "onaylandı" butonundan
değil, panelin/ekranın KAPANABİLECEĞİ HER yoldan (X butonu, geri tuşu, başka
bir ekrandan bitirme) sıfırlayan bir yol olduğundan emin ol — yoksa state
sonsuza kadar takılı kalıp ilgisiz ekranlarda yanlış rozet/durum gösterebilir.

### 5.6 Turbopack + OneDrive: bazı `lucide-react` ikonları dosya okuma panic'i veriyor

🔴 **Tekrarlayan, spesifik bir ikona bağlı olmayan bir sorun.** Bazı
`lucide-react` ikon dosyalarını import etmek Turbopack'i "Bulut dosya
sağlayıcısı çalışmıyor (os error 362)" hatasıyla çökertiyor — dosya diskte
gerçekten var ama Turbopack'in dev-modu dosya okuyucusu OneDrive'ın sanal
dosya sistemiyle (cloud file provider) bir şekilde çakışıyor. Şimdiye kadar
karşılaşılanlar: `Soup` (`soup.js`), `HelpCircle` (`circle-question-mark.js`),
`CalendarPlus` (`calendar-plus.js`, 2026-09-28), `Swords` (`swords.js`, 2026-09-25, Faz 24'te bulundu — bir kez dev sunucusu
kilitlenip `.next/dev/lock`'u tutan eski bir process'i `taskkill` ile
sonlandırıp sunucuyu yeniden başlatmak gerekti), ve `Siren`/`Pencil`
(2026-09-25, Faz 25'te AYNI OTURUMDA ART ARDA iki farklı ikonla — `/vet`
sayfası tamamen 500 vermeye başladı, ikisi de sırasıyla `ShieldAlert`/düz
`✎` karakterine çevrilerek düzeltildi).
Ortak bir desen yok (hepsi sıradan, küçük SVG ikonları) — tahmin
edilemiyor, sadece karşılaşınca fark ediliyor (genelde 500 hatası + dev
sunucusu log'unda "Execution of <DiskFileSystem as FileSystem>::read
failed" görülür). **Çözüm:** o ikonu KULLANMA — işlevsel olarak eşdeğer
başka bir ikonla değiştir (ya da bu örnekte olduğu gibi düz metin/emoji
kullan). Zaman kaybetmeden hatayı tanı ve ikonu değiştir, kök nedenini
araştırmaya çalışma (OneDrive/Turbopack etkileşimi, bu projenin kontrolü
dışında). **Alışkanlık hâline getir:** yeni bir lucide-react ikonu eklerken
sadece typecheck'e güvenme (bu hatayı hiç yakalamaz) — sayfayı gerçekten
`curl`/tarayıcıyla yükleyip 200 döndüğünü doğrula.

### 5.7 Yeni bir tabloya RLS policy eklemek YETMİYOR, GRANT de gerekiyor

🔴 Bu projenin `public` şemasında hiçbir "default privilege" tanımlı değil —
yeni oluşturulan bir tabloya RLS policy eklemek tek başına yetmiyor,
`anon`/`authenticated` rolüne ayrıca `grant select/insert on <tablo>`
verilmesi de gerekiyor (RLS satır filtreler, GRANT işlemi baştan açar).
`execute_sql` ile yapılan testler `postgres` (superuser) bağlamında çalıştığı
için bu eksikliği YAKALAYAMAZ — sadece gerçek bir authenticated/anon istemci
çağrısı (Playwright ya da `information_schema.role_table_grants` sorgusu)
ortaya çıkarır. Detay, bulunuş hikayesi ve düzeltilen tablolar (`reward_products`,
`point_transactions`, `streak_shield_uses`) için bkz. Bölüm 8.10.

## 7. Ölü/yinelenen kod hassasiyeti — CareHubModal örneği

`src/components/community/modals/CareHubModal.tsx` (64KB, 3 sekmeli:
Beslenme & Su / Sağlık & Aşılar / Klinik & Randevu) silindi çünkü:
- Hiçbir yerde import/render edilmiyordu (tamamen orphan/dead code) —
  Antigravity tarafından daha önce bağlantısı koparılmış ama dosya
  silinmemişti.
- İçerdiği her özellik zaten başka, aktif kullanılan bileşenlerde
  duplicate ediliyordu: aşı takibi → `VaccineModal.tsx`, randevu iptali →
  `MyAppointmentsPanel.tsx`, beslenme → `NutritionModal.tsx`.
- Renk paleti de tasarım prensiplerine (Bölüm 5) aykırıydı.

**Ders:** Bu projede zaman zaman "bağlantısı koparılmış ama silinmemiş" ölü
kod birikebiliyor. Yeni bir modal/özellik eklerken veya "bu ekran neden garip
davranıyor" tarzı bir soru gelince, önce o bileşenin gerçekten hâlâ
kullanılıp kullanılmadığını (import zinciri) doğrula.

**2026-09-23, walk modülü UI-doğruluk turunda bulunan 4 ek örnek (aynı desen):**
- `src/app/walk/competition/page.tsx` — tamamen `// Mock Data` yorumlu,
  hardcoded sahte lig/leaderboard/işletme verisi, hiçbir yerden link
  edilmiyordu. Silindi.
- `src/components/community/ProfileTab.tsx` (500+ satır) — `/profile/[id]/
  page.tsx`'te import ediliyordu ama JSX'te HİÇ render edilmiyordu (dead
  import). Kendisi de başka hiçbir yerden kullanılmıyordu. Hem dosya hem
  dead import silindi.
- `src/app/profile/test/page.tsx` + `src/components/profile/ProfileTabs.tsx`
  — bir "test" route'u ve onun tek tüketicisi, hiçbir yerden link
  edilmiyordu. İkisi de silindi.
- `PetContext.tsx`'teki `walkRoutes` state'i — `RoutesTab.tsx`'e prop olarak
  akıyordu ama `setWalkRoutes` kod tabanında SIFIR kez çağrılıyordu, yani her
  zaman boş `{}` kalıyordu (bkz. 8.11, RoutesTab bunun yüzünden hep sahte
  `mockHistory`'ye düşüyordu). State'in kendisi silinmedi (PetContext'in genel
  yapısını bozmamak için), ama RoutesTab artık ona hiç bağlı değil.

**Genel gözlem:** Bu 4 örneğin hepsi "bir önceki refactor sırasında yeni bir
yol inşa edilip eskisi bağlantısız bırakıldı, silinmedi" deseni. Yeni bir
ekran/bileşen inşa ederken eskisini SİLMEK (sadece bağlantıyı kesmek değil)
alışkanlık hâline getirilmeli.

## 8. Mimari, kurallar ve fazların özeti

Her alt bölümün **tam anlatısı** (hangi hata nasıl bulundu, test ayrıntıları, vazgeçilen yollar) `docs/gecmis/claude-md-2026-10-02-tam.md`
dosyasında, aynı "8.N" numarasıyla durur. Burada sadece bugün geçerli kural, mimari ve bilinçli sınırlar var. Numaralar atıflar için korunmuştur.
(İki "8.15" var: ilki sürüklenebilir panel turu, ikincisi rozet sistemi — arşivde sırayla bulunur.)

### Yürüyüş modülü (8.0 – 8.22)

- **8.0–8.1 Plan ve sınırlar.** Yürüyüş yeniden yapımı Faz 1–14 ve 18 tamam; kalan: 15 yönlendirici ödül, 16 analitik, 17 cila.
  Bilinçli yaklaşık çözümler: GPS kalite eşikleri deneysel; `network_unavailable` sadece tarayıcının online/offline'ına bakar;
  hazırlık kontrol listesi (poşet/su/tasma) state machine'e bağlı değil; `LiveMap.tsx` içine gömülü sahte POI/hazine avı 4 ekranda
  paylaşılıyor, bilerek dokunulmadı; `bluetoothManager.ts` orphan (gerçek kod, kullanılmıyor); "Bu Yürüyüşü Kaydet" gerçek bir onay
  kapısı değil (kayıt zaten yapılmış); `LiveMap` Carto altlığı API anahtarı filigranı gösteriyor (veteriner haritası OSM'e geçti).
- **8.2 Puan sistemi (2026-10-03 kilitlendi).** 🔴 İstemci puan MİKTARI söyleyemez: `award_pati_puan` istemciye kapalı (sadece
  sunucu fonksiyonları sahibi olarak çağırır), yeni ödül `claim_reward(key)` ile. Miktar/dönem (günlük-haftalık-aylık)/günlük 200 sınırı
  `reward_rules` tablosunda; aynı ödül aynı dönemde bir kez (`point_transactions` source='quest', reference_id `kural@dönem`). Yeni ödül
  eklerken önce `reward_rules`'a satır, istemcide `awardReward('<kural>', xp, ...)`. Puan harcama da sadece fiyatı sunucuda olan
  fonksiyonlarla (`redeem_cosmetic_item`, `redeem_vip_perk`); istemcide "puan düş" fonksiyonu YOK. Tek para birimi PP = **PawCoin**
  (8.52). Görev tamamlanma kararı hâlâ istemcide (C aşamasında sunucuya taşınacak); kötüye kullanım en fazla günlük sınır kadar.
  Kupon (`reward_products`) satıştan kaldırıldı: kupon kaydı/ödemede uygulama altyapısı yoktu.
- **8.3 Seri.** `streak_shield_uses` + `use_streak_shield` (haftada 1, Prime 2). Günler YEREL tarihle karşılaştırılır (UTC `startsWith`
  hatası vardı). `bestStreak` 365 günün tamamını tarar. Haftalık pul günde en fazla 1.
- **8.4/8.5/8.14 Hub ve bağlam.** "Bugün" değerleri tek kaynaktan: `QuestEngineContext.todayDistanceKm/todaySteps/walkPpEarned`
  (iki paralel hesap yapma). Rozet takibi `QuestEngineContext`'te (panel unmount olunca yerel state kaybolur). "Tüm Zamanlar" ile
  "Son 7 Gün" aynı kartta etiketsiz karıştırılmaz.
- **8.6a Yürüyüş kaydı (2026-10-03, A+B).** 🔴 `walk_sessions`'a istemci yazamaz (sadece SELECT): `start_walk_session(pet, started_at)`
  (çevrimdışı başlangıç sonradan gerçek saatle açılır), `append_walk_points` (ActivityContext tamponu, 10 sn'de bir toplu; çevrimdışı kuyruk
  aynı tampon, anlık görüntüyle cihazda saklanır), `finish_walk` (aktif süre `active_seconds`, gerçek adım ya da boş, `calories_kcal`
  = km × kilo, `route_preview` ≤60 nokta, `start_lat/lng`; kurtarmada bitiş son nokta), `add_walk_photo`, `discard_walk` (kullanıcı
  geçmişten kaldırır). Mesafe sunucuda (25 km/sa üstü sıçrama sayılmaz). Yolu ve adımı olmayan yürüyüş `discarded`. Liste ekranları tam
  rota değil `route_preview` çeker; ölçüm/biçim tek yerde `lib/walkMetrics.ts` (ekran kendi kalori formülünü yazmaz). Süre saniye
  sayacı değil zaman damgasından; `stopWalk` başarısızsa yürüyüşü silmez (işleme ekranı "Tekrar Dene"). Canlı konum: `get_walk_beacon(id)`.
  Arayüz: yürüyüş sayfaları `.theme-vet` (home-final paleti) içinde, ortak parçalar `components/walk/WalkUI.tsx`, harita
  `components/walk/WalkMap.tsx` (takipte yakınlaştırmayı bozmadan takip eder; `LiveMap` yürüyüşte kullanılmaz).
- **8.6 Geçmiş.** `walk_sessions` RLS sadece sahibi. `walk_sessions.pet_id` text, FK yok → PostgREST `pet:pets(...)` embed'i KULLANMA
  (yürüyüş geçmişi bu yüzden hiç çalışmamıştı). `path_coordinates` DB'de `{lat,lng,timestamp}[]`; ekranlar tuple bekler →
  `normalizePathToTuples()` (`lib/utils.ts`). Adım katsayısı 1.3.
- **8.7 + ikinci 8.15 Rozetler.** 38 rozet, 6 "aile/kademe" (mesafe, seri, yürüyüş sayısı, paylaşım, beğeni, bölge); aile rozetleri TEK merkezi
  `useEffect`'ten verilir; ömür boyu sayaçlar günlük sıfırlanmaz (`lifetimePostCountRef`, `lifetimeLikeCountRef`). `/walk/badges`.
- **8.8 Sıralama.** `get_distance_leaderboard` (SECURITY DEFINER, sadece toplam km; hiçbir rota sızmaz), km tabanlı, zaman + sosyal filtre.
  🔴 Ders: UI'ya bağlı işe referans görsel olmadan başlama (PP'li lig sistemi yanlış yöne gitmişti, silindi).
- **8.9 / 8.23 / 8.24 Ödül ve kozmetik.** `reward_products` (kupon), `cosmetic_items` + `redeem_cosmetic_item`, `vip_perks` +
  `redeem_vip_perk` (süreli çerçeve, süre uzatır), `/dress-up` (SVG maskot, `components/cosmetics`). Çerçeve hakkı tek yerde:
  `lib/vipFrames.ts` (`resolveFrameStyle`, kendi profilinde render anında yeniden doğrulanır). Kombinle'nin Düello Arenası/giysi
  görevleri bilerek alınmadı (MoffiCoin→PP çevirisi şart).
- **8.10 🔴 GRANT kuralı** (aşağıda Bölüm 6, 5.7 ile aynı): yeni tabloda RLS policy yetmez, `grant` da şart; doğrulama `execute_sql` ile değil
  gerçek istemciyle ya da `information_schema.role_table_grants` ile.
- **8.11 Profil istatistikleri** (`RoutesTab.tsx`) gerçek `walkHistory`'den (limit 60).
- **8.12 Görevler.** `MonthlyResearch` gerçek sinyallerle ilerler; `/walk/challenges` haversine kümelemeyle (300 m "farklı yer", 2 km "farklı
  bölge"), tamamlanma state'i tutulmaz (her render'da türetilir). `showToast(message, icon, color)` imzası; ikon `IconMap`'te olmalı.
- **8.13 Cila.** `src/app/walk/template.tsx` route geçişi, `canvas-confetti`, haptik. Renk taramasında ham hex (`#6366F1`) de aranır.
- **8.15(ilk)–8.16 Aktif yürüyüş tek ekran.** Aktif yürüyüş SADECE `/walk/tracking`'de; `WalkQuickSheet` yalnızca hazırlık/kurtarma
  (eski aktif görünümü silindi). `DynamicNavigation.handleOpenWalk` yürüyüş aktifse doğrudan `/walk/tracking`'e gider. Sürüklenebilir panel:
  framer-motion `dragControls` ikinci jestte çalışmıyor → varsayılan `dragListener` + içerik `onPointerDown stopPropagation`. Tam ekranda üst
  kontroller `pointer-events-none`. `WalkData.petId/petName` yürüyen hayvanı tutar. `ActiveWalkMiniWidget` yalnız uygulama içi.
- **8.17–8.22.** Günlük hedef gerçek +/- stepper (`manualDailyGoalKm`, null = otomatik). Ana sayfa kartı `dailyGoal` + `QuestEngineContext`
  kullanır (kart kendi ayrı hedefini tutmaz). Kart 3 durumlu: aktif > lapsed (3+ gün) > normal.
  🔴 **8.18:** Vercel build'i `package.json`'da olmayan ama yerel `node_modules`'te duran pakette kırılmıştı → "yerel build geçti" garanti değil,
  şüphede temiz `git clone` + `npm install` + build. GPS drift kalkanı sabit 15 m değil `max(accuracy, 8)` m.
  🔴 **8.19–8.20 Pedometre:** adım GPS'ten bağımsız, `devicemotion`; algoritma = SABİT eşik (1.15) + histerezis + 300–2000 ms aralık +
  4'lü ritim onayı. Adaptif/varyans tabanlı eşik kısır döngüye girer, kullanma. GPS/sensör kodu statik mock'la değil HAREKETLİ simülasyonla test
  edilir. Ekran kapalıyken adım web'de sayılmaz (native'de de sensör). Mesafe PP'yi belirler, adım belirlemez.

### Sosyal meydan okuma ve işletme türü (8.25 – 8.35)

- **8.25 Düello / Takım Görevi.** `create_social_challenge`, `respond_social_challenge`, `get_social_challenge_progress`,
  `finalize_social_challenge` ("görüntülerken sonuçlandır"). Karşılıklı takip şart. Kullanıcılar arası PP transferi YOK (herkes kendi
  hesabına, sunucudan). 🔴 **Her yeni SECURITY DEFINER fonksiyonda `revoke execute ... from public, anon` + sadece gereken role `grant`.**
- **8.26–8.30 Veteriner arayüzü.** Gerçek veri sistemi üstüne re-skin (mock yeniden yazma). 🔴 **8.27 Tema tuzağı:** `<html>` dışındaki bir
  `.theme-X` renk override'ı için Tailwind'in okuduğu `--color-*` değişkenleri DOĞRUDAN override edilir (`--accent` takma adı aşağı inmez).
  `/vet` paleti `home-final` ile aynı (#EE5B3D, #F7F3EA…). Overlay z-index: `h-full` overlay'ler alt navigasyonun (z-2900) üstünde olmalı;
  randevu açılırken `ClinicDetailDrawer` kapatılır. Mavi/indigo yok.
- **8.31–8.35 İşletme türü.** `src/config/businessTypes.ts` (5 tür: menü, personel etiketi, varsayılan hizmetler, `hasMedicalRecords`),
  `BusinessTypeContext` (panelin kökünde; sayfalar kendi `getBusinessTypeConfig` çağırmaz). Muayene/EMR sadece `hasMedicalRecords=true`.
  Müşteri keşfi `business_type` filtreli (`/vet?type=`); petshop `/petshop`'a gider. Kurulum sihirbazı `OnboardingWizard`
  (`onboarding_completed`). `getNearbyClinics` sadece `business_approved`.

### Randevu, bildirim, e-posta, ticaret (8.36 – 8.43)

- **8.36 Randevu durumu sadece sunucuda:** `transition_appointment`, `set_appointment_attendance`; istemcinin `appointments` UPDATE/DELETE yetkisi yok.
  Çift rezervasyon `appointments_no_overlap` (btree_gist). Dolu saatler `get_clinic_busy_slots`. Sipariş okuma satıcı fonksiyonlarıyla
  (`is_order_seller`). 🔴 Saat kuralı: randevu saatleri Türkiye duvar saati, UTC etiketli (`lib/appointmentTime.ts` `wallParts`).
- **8.37/8.42 Tek bildirim omurgası.** Bildirimi SADECE sunucu üretir (`notify_user`, `notify_business`, tetikleyiciler); istemcinin
  `notifications`'a INSERT yetkisi yok. `NotificationContext` uygulamanın tek bildirim kaynağı. Sohbet tek `ChatContext` kanalı + `CHAT_MESSAGE_EVENT`;
  yeni ekran yoklama/ayrı kanal açmaz.
- **8.38 Uygunluk sunucuda:** `clinic_day_hours`, `find_slot_doctor`, `get_available_slots`, `get_clinics_open_status`; `appointments_before_insert`
  aynı fonksiyonla doğrular; istemci saat hesaplamaz. Hizmet–personel eşleşmesi yok (her aktif personel her hizmeti verir).
- **8.39 Işletme verimliliği.** Moffi dışı müşteri = `unclaimed_patients` (+ `appointments.guest_*`); `create_business_appointment`,
  `reschedule_appointment`, `get_clinic_clients`; `/business/calendar`, `NewAppointmentModal`.
- **8.40 E-posta.** `email_outbox` (istemciye kapalı), pg_cron her 5 dk → `/api/cron/email-outbox` (`EMAIL_CRON_SECRET`), Resend. 🔴 cron/pg_net
  komutlarına düz metin anahtar YAZMA, vault kullan. İptal politikası `cancellation_notice_hours`; erteleme `request_reschedule`/`respond_reschedule`.
  Sonuç `finish_email_outbox` ile yazılır (servis rolünün tabloya doğrudan yetkisi yok), takılan işler 15 dk sonra yeniden alınır.
- **8.41 Pazar yeri.** Ödeme PayTR (`/api/paytr/payment` → webhook → `finalize_paid_order`); `products.owner_id`, `order_items.business_id`;
  satıcı durum geçişleri `order_items_guard_status` ile ileri yönlü; komisyon `platform_settings`. Abonelik/kupon kodu kaldırıldı.
  İşletme üst çubuğu `components/business/Header.tsx`.
- **8.43 Veteriner 14 ekran.** Ortak parçalar `components/vet/VetShared.tsx` (yeni liste yazarken buradan al). Hatırlatma tercihleri
  `profiles.reminder_prefs`. Finans sayfası gerçek (tamamlanan randevu × hizmet fiyatı, "tahmini"). Harita altlığı OSM.

### Sağlık, pasaport, topluluk (8.44 – 8.51, 8.53)

- **8.44 Sağlık tek kayıt.** Yazma/okuma `src/services/healthService.ts`, durum hesapları `src/lib/health/derive.ts`, tipler `types/health.ts`. Yeni ekran
  kendi hesabını yazmaz. İşletme muayenesi `record_consultation()` ile atomik. Tıbbi belge alanı özel (yalnız sahibi). Karne için
  `loadBundle`/`usePetHealthBundle` (doğrudan `getBundle` değil). Tasarım: `design-reference/health-final/`.
- **8.45a 🔴 Tetikleyici + sayaç dersi (2026-10-03).** `pets_passport_no_guard` kullanıcının yetkisiyle `pet_passport_seq`'i
  çağırdığı için 28 Eylül–3 Ekim arası istemciden HİÇ hayvan eklenemedi (yeni kurulum akışı dahil); `security definer` yapıldı.
  Bir tetikleyici sayaç/başka tablo kullanıyorsa ya `security definer` olmalı ya da yetki verilmeli; gerçek kullanıcı rolüyle test et.
- **8.45 Pasaport.** Bir bilgiyi SADECE sahibi olan ekran yazar: kimlik → `/pasaport/kimlik`; alerji/hastalık/not/acil → `/health/acil`
  (`pet_health_profile`); aşı/ilaç/kilo/muayene → `/health/*`. Paylaşım `pet_share_links` + `get_shared_passport` + `/p/[token]`, varsayılan KAPALI.
  Künye `/id/[petId]` (`get_pet_tag_info`, `submit_tag_report`). 🔴 `pets` başkalarına kapalı; başkasına gereken alanlar `pet_cards` görünümünden.
  Tasarım: `design-reference/passport-final/`.
- **8.46 Gizlilik.** `profiles` sadece sahibi/yönetici/randevulu klinik/siparişli satıcı okur; başkasını gösterirken `profile_cards`
  (telefon/adres/IBAN yok). `guard_profile_rewards` istemcinin PP/kalkan alanlarını değiştirmesini engeller. `adoption_pets`/`lost_pets`'ten
  `select('*')` YAPMA (`adoption_cards`, `lost_pet_cards` kullan).
- **8.47 Kayıp.** Tek kaynak ilan (`lost_pets`), `src/services/lostService.ts`; kayıp modu sadece `publish_lost_listing`/`resolve_lost_listing`;
  künye mesajı/ödül/telefon ilandan okunur. Yakın çevre bildirimi `set_community_alerts`. Tasarım: `design-reference/community-final/`.
- **8.48 Sahiplendirme.** `src/services/adoptionService.ts`; durum/başvuru sunucu fonksiyonlarıyla; sahiplendirme ücretsiz (satış/IBAN/telefon
  yazısı reddedilir); pasaport devri `pet_ownership_transfers`/`respond_pet_transfer` (sağlık geçmişi hayvanla gider, eski sahibin acil bilgisi silinir).
- **8.49 Keşfet.** `src/services/socialService.ts` (gönderi, yorum, hikâye, takip, engel). Okuma sunucu fonksiyonlarıyla; sayaçlar istemciden
  değişmez (`posts_guard`); yorum izni/engel/gizli kelime sunucuda; `block_user`/`unblock_user`.
- **8.50 Ortak paylaşım + etkileşim.** Paylaşmanın tek yolu `openShare()` (`components/common/ShareSheet.tsx`). Efektler `lib/mediaFilters.ts`
  (fotoğraf piksele işlenir, video `posts.media_filter`). 🔴 **`setX(prev => ...)` içinde bildirim, `setTimeout` ya da sunucu çağrısı YAPMA**
  (React iki kez çalıştırabilir; rozet/ödül iki kez verilmişti). Silinen gönderinin depodaki dosyası da silinir (geçmişte kalanlar bekliyor).
- **8.51 Mesajlaşma v2.** `messages`/`conversations` yazma sadece `send_chat_message`, `mark_chat_read`, `recall_chat_message`,
  `toggle_message_reaction`, `set_conversation_pref`. Fotoğraflar özel `chat-media`.
- **8.53 Faz 2 sosyal.** Mesaj istekleri (`chat_is_request`, `accept_chat_request`), @bahsetme, pati tepkisi (`toggle_post_paw`), haftanın teması
  (`weekly_themes`, `/admin/themes`). `/live` telefon önizlemesi (iPhone 17).

### Hesap, işletme modeli, ekonomi, native (8.52, 8.54 – 8.62)

- **8.52 Baran'ın kararları.** Hesap = kişi, işletme = ayrı kayıt. Telefonla SMS girişi yok (e-posta kodu, Google, Apple). Ücretli arka plan konum
  eklentisi alınmaz. Prime/PawCoin uygulama içi satın alma; PawCoin ile alınan hiçbir şey platforma zarar ettirmez; yapay zekâ aylık 50 $ tavan.
  İşletme geliri TL (komisyon), coin değil. 🔴 Yetkiyi asla istemcinin taşıdığı çereze/değere dayandırma (taklit edilebilen rol çerezi kaldırıldı).
- **8.54 İşletme modeli (KRİTİK).** `businesses` + `business_members` (owner/manager/staff). Panelde kişinin `user.id`'si ASLA işletme kimliği yerine
  kullanılmaz: `useActiveBusiness()` (`BusinessTypeContext`), servis `getActiveBusinessId()`/`updateActiveBusiness()`. Yetki: `is_business_member`,
  `can_manage_business`, `current_business_id`. Başka işletmeyi `business_cards`'tan oku. İşletme bildirimi `notify_business` (`biz_*` türleri).
  **Kayıt ve onay (2026-10-03, yeniden yapıldı — önceden hiç çalışmıyordu):** işletme açmanın TEK yolu `submit_business_application`
  (`services/businessApplicationService.ts`): giriş yapmış + e-postası doğrulanmış kişi, `/business-register` (girişsizse tanıtım → `/?next=`);
  doğrulama sunucuda (tür, IBAN mod-97 `iban_is_valid`, VKN/TCKN, konum TR sınırı), aynı anda 1 bekleyen başvuru, kişi başı ≤5 işletme;
  reddedilen başvuru `?resubmit=<id>` ile düzeltilip aynı fonksiyonla yeniden gönderilir. Yöneticilere `admin_business` bildirim + e-posta.
  Karar TEK ekranda `/admin/businesses` → `admin_review_business` (yönetici + **aal2 JWT'den**, ret nedeni ≥5 karakter) → `biz_kyb` bildirim +
  e-posta. 🔴 Servis rolünün `businesses`'a yazma yetkisi YOK (eski `reviewBusiness` bu yüzden hiç çalışmıyordu; silindi). Kişisel tarafta giriş:
  Ayarlar → İşletme Portalı ("İşletmeni Moffi'ye ekle"/"Yeni işletme aç"). Ara katman yalnız `/business` ve `/business/*`'ı korur
  (`/business-register` dahil değil). `useMyBusinesses` önbelleği `invalidateMyBusinesses()` ile yenilenir. Barınak etiketi üyelikten
  (`is_approved_shelter`). 🔴 `profiles`'ta e-posta sütunu YOK; yönetici e-postayı `admin_user_emails(ids)` ile okur.
- **8.55 Personel daveti.** `business_invitations` (token kolon yetkisiyle kapalı), `invite_staff`, `respond_staff_invitation`,
  `cancel_staff_invitation`, `remove_business_member`, `get_business_team`, `/invitation/[token]` (hesapsız açılır, giriş `/?next=`).
  Hesabı olmayana e-posta `enqueue_email_address`. Davet kabulü doğrulanmış e-posta ister.
- **8.56 Kayıt/giriş.** E-posta kodu (`CodeStep`, 6–8 hane; Supabase 8 üretir), şifre en az 8, doğrulanmamış girişte yeni kod, şifre sıfırlama kodla
  (`resetPasswordWithCode`). "Confirm email" AÇIK ve test edildi. Leaked password protection Supabase Pro'da.
- **8.57 Hesap silme.** `request_account_deletion` (30 gün, ekibi olan işletme sahibi engellenir) / `cancel_account_deletion`;
  `AccountDeletionBanner`; kalıcı silme cron `account-purge-daily` → `/api/cron/account-purge` (`prepare_account_purge` randevuları
  "Silinmiş kullanıcı" yapar). Bağlantı kuralları uygulandı (sipariş/randevu/yorum isimsiz kalır). Şifre değiştirme mevcut şifreyi doğrular;
  "Oturumlar" diğer cihazlardan çıkış yapar. Yönetici 2FA: `AdminMfaGate` + `20261002180000_admin_requires_mfa.sql` (BEKLİYOR, Bölüm 12).
  Yönetici bir hesabı aynı 30 günlük sürece alır/geri alır: `admin_schedule_account_deletion` / `admin_cancel_account_deletion` (aal2;
  yönetici hesabı ve ekibi olan işletme sahibi hariç). Profil satırı istemciden ASLA doğrudan silinmez (eski "Sil" bunu yapıyordu).
  Yönetici yazma işlemleri (`admin_*`) aal2'yi kendileri denetler; yönetici 2FA migration'ını beklemez.
- **8.58 Native ara katman.** 🔴 Telefon özelliklerine (konum, sensör, paylaşım, pano, titreşim, ekran açık tutma, dış bağlantı, ön plan/ağ,
  push, satın alma) SADECE `@/native` üzerinden erişilir. Modüller: `geolocation`, `sensors` (iOS izni dokunuşla aynı çağrı yığınında),
  `share`, `device`, `push`, `purchases`, `haptics`, `isNative()/platform()`. Adlar `location`/`motion` değil (tarayıcı/framer çakışması).
  Sürekli konum takibinde varsayılan zaman aşımı YOK.
- **8.59 Capacitor.** `capacitor.config.ts` (`net.moffi.app`, `server.url=https://app.moffi.net`), `android/` + `ios/` commit'li, izin açıklamaları
  Türkçe. Ekran kapalıyken yürüyüş `@capacitor-community/background-geolocation` (kalıcı bildirimli). Eklenti eklenince `npx cap sync`.
  Telefon bildirimi Firebase(FCM)/Apple(APNs) gelene kadar kapalı.
- **8.60 Yapay zekâ + Prime.** Her yapay zekâ uç noktası `startAi()` (`lib/server/aiGuard.ts`) ile başlar, `finish()` ile biter. `ai_consume` /
  `ai_finish` / `ai_quota_status` / `ai_limits()` (ücretsiz 5 mesaj + 1 fotoğraf, Prime 60 + 10, ek hak 10/30 PawCoin, sert tavan 100/20, 40 $'da
  ücretsiz hak düşer, 50 $'da kapanır). Model hata verirse hak/PawCoin iade; uydurma cevap dönülmez. Prime: `profiles.prime_until`
  (istemci yazamaz), `has_prime()`, `profile_cards.is_prime`, haftada 2 kalkan, aylık 500 PawCoin cron.
- **8.61 Mağaza satın alma.** RevenueCat: `store_products`, `store_events`, `apply_store_event` (idempotent), `/api/revenuecat/webhook`
  (`REVENUECAT_WEBHOOK_SECRET`). 🔴 Prime/PawCoin yetkisi ASLA istemcinin "satın aldım" demesine dayanmaz. Prime web'de satılmaz.
- **8.62 Genel kontrol.** SECURITY DEFINER fonksiyon yetkileri temizlendi (`get_auth_email`, `check_unclaimed_matches` vb.). 🔴 SQL dersi:
  `execute_sql` tek işlemdir; sonda bilerek `raise exception` atan deneme bloğuyla AYNI komuta kalıcı değişiklik koyma. Bilinçli kalanlar:
  `*_cards` görünümleri (tasarım gereği), `spatial_ref_sys`, `postgis`/`pg_net` public şemada, kapalı tablolar (RLS var politika yok).

### Ana sayfa, alt menü, Moffi AI, kenar paneli (8.63, 2026-10-03 — KAPANDI)

- **8.63a Ana sayfa** son hâl `design-reference/home-final/README.md` başında. `app/home/page.tsx` yalnızca sıra + veri; bölümler
  `components/home/*`. Sağlık hatırlatmaları tüm hayvanlar için `hooks/useUpcomingCare.ts` (kenar paneli de kullanır).
  Hikâye kanalı içeriksizse görünmez (`useStories`; yer tutucu hikâye üretme). Varsayılan tema AÇIK (`ThemeContext`); `<html lang="tr">`.
- **8.63b Alt menü** (`MoffiBottomNav`): Ana Sayfa · Keşfet · Moffi AI (orta) · Pati Yardım · Profil; etiketli, aktif turuncu.
- **8.63c Moffi AI** tek panel `components/ai/MoffiAssistant.tsx` (ekranda kendi düğmesi yok). Açmak için
  `window.dispatchEvent(new CustomEvent('open-ai-assistant', { detail: { prompt? | prefill? } }))`. Seçili hayvanın kimlik, sağlık özeti
  ve yürüyüşü gönderilir; sunucu (`api/ai/chat`) geçmişi (son 12) modele verir, ton/uzunluk `settings.ai.personality/detailLevel`
  (Ayarlar → Moffi AI). Model hata verirse 503 + hak iadesi; hazır/uydurma cevap YOK. Sahte "Moffi Core" radar ekranı silindi.
- **8.63d Kenar paneli** `components/edge/EdgePanel.tsx` + TEK katalog `edgeCatalog.ts` (panelin Düzenle'si ve Ayarlar → Kenar Paneli
  aynı listeyi, aynı `settings.edge`'i kullanır; eski `settings.sidebar` hiç okunmuyordu). Widget'lar gerçek: yürüyüş, hava (Open-Meteo,
  izin varsa kendiliğinden, yoksa dokununca), sıradaki sağlık işi, gerçek künye QR (`/id/<petId>`). Eski `MoffiSidebar` (sahte hava/adım/
  su/ruh hali/QR/kapsül) ve `ActivityContext.activeMode/recTime/orderStep` silindi. `getWeather` hata hâlinde `null` döner.
  Düzenle ekranı taslak tutmaz: her dokunuş anında kaydedilir (eskiden "Kaydet"e basmadan geri dönen kullanıcının eklediği widget
  kayboluyordu). En üstte arama (kelime başından, Türkçe karakter duyarsız, katalogdaki `keywords` ile; adı eşleşen önce).
- **8.63e Bildirim izni** Ayarlar → Bildirimler'de gerçek aboneliğe bağlı (`PushSubscriptionRow`, `push_subscriptions`).
- **8.63f 🔴 Ayarlar kayboluyordu (kök neden, düzeltildi):** `AuthContext` profili yüklerken `settings`'ten yalnızca
  `appearance`/`privacy`'yi alıyordu; sonraki her `updateSettings` bu eksik kopyayı yazıp kenar paneli, yapay zekâ, bildirim,
  erişilebilirlik ayarlarını veritabanından SİLİYORDU. Şimdi tüm kategoriler korunur ve `updateSettings` veritabanındaki güncel
  ayarları okuyup yalnızca değişen kategoriyi birleştirir (yazımlar sıraya alınır). Ders: kısmi bir kopyayı bütün olarak geri yazma.
- **8.63g Hava durumu TEK kaynak `WeatherContext`** (`weatherService`/`hooks/useWeather` silindi). Konum izni kendiliğinden SORULMAZ:
  izin varsa GPS, yoksa IP'den yaklaşık konum (`source: 'ip'`); kesin konum `requestPrecise()` ile kullanıcı isteyince. Veri yoksa
  `weather = null` (eski sahte "Caddebostan 21°" / varsayılan İstanbul kaldırıldı). `isHotForPaws` (≥25°), `advice`, `iconKey`.
- **8.63h Görsel dil:** `globals.css` → `.glass` (yüzen cam: alt menü, başlık düğmeleri, takip ekranı panelleri), `.glass-photo`
  (fotoğraf üstü), `.card-premium` (kartlar). "Saydamlığı azalt" açıksa düz renk. Alt menü yüzen cam hap (Liquid Glass benzeri).
  Tema: `ThemeContext.preference` = açık/koyu/sistem, seçici `components/common/ThemePicker` (Ayarlar → Görünüm ve tema, kenar paneli).
- **8.63i Yürüyüş:** ana sayfa kartı = halka (yüzde) + hafta şeridi (Pzt–Paz yürünen günler) + seri + hava/sıcak zemin uyarısı + cam
  ölçü şeridi. Hazırlık paneli: kim yürüyor (isimli seçim), hedef her zaman açık, hava/pati güvenliği, günlük hazırlık listesi
  (tasma/poşet/su/ödül, cihazda o gün), son yürüyüş + son 7 gün, sabit "Yürüyüşe Başla". Kenar tutamağı açık pencerelerde gizlenir.
- **8.63j Adım öncelikli** (ana sayfa kartı, takip, sonuç): büyük rakam adım, km ikincil. Sensör yoksa ya da mesafe varken adım 0 ise
  büyük rakam km'ye döner. Hedef/halka/puan mesafeden (8.20). Adım yalnızca uygulamada başlatılan yürüyüşlerde sayılır; gün boyu adım
  Apple Sağlık / Health Connect ister (native aşaması).
- **8.63k Hava detayı** `components/walk/WeatherDetailSheet.tsx` (kök düzende), `open-weather-detail` olayıyla her yerden açılır; saatlik +
  7 gün + yürüyüş için en iyi saatler + pati güvenliği; `fetchForecast` WeatherContext'te. Open-Meteo atfı (CC BY 4.0) zorunlu, altta.
- **8.63l Yürüyüş sesleri** tek modül `lib/audioCues.ts`: Web Audio ile kodda üretilen melodik sesler (dosya yok, telif yok), 3 tema
  (Zil/Marimba/Pati), olaylar başla/duraklat/devam/km/hedef/bitiş; sesli anons (cihaz sesi) isteğe bağlı, varsayılan kapalı. Tercih cihazda
  (`moffi_walk_audio`). Ses ancak dokunuşla açılır: başlat düğmesinde `audioCues.unlock()`.
- **8.63m Üst alan:** hayvan seçimi sağ üstte, alttan açılan çekmecede (tek hayvanda da). Selamlama altında "günün notu"
  (`components/home/dailyNote.ts`): geciken/yaklaşan sağlık işi > sıcak hava > hedef tamam > uzun süredir yürünmedi > iyi hava > günlük bakım bilgisi.

### İçerik Stüdyosu ve hikâyeler (8.64, 2026-10-04 — Baran onaylı 5 kanal)

- **Kanallar** (`hooks/useStories.ts`): **Kayıp Alarmı** (otomatik, kullanıcının 25 km çevresi), **<Hayvan>'ın Haftası** (otomatik özet
  kartları: yürüyüş, seri, sağlık), **Moffi** (yönetici), **Veteriner Önerisi** ve **Fırsatlar** (işletme gönderir, yönetici ONAYLAR, yalnızca
  işletmenin çevresine; fırsat "Reklam" etiketli). İçeriksiz kanal görünmez. "Moffi'den İlham" da aynı kaynaktan (yoksa marka kartları).
  Yıldız Patiler ana sayfadan çıktı → Keşfet'e taşınacak (açık iş).
- **Veri:** `content_items` + `content_events` (20261004100000). İstemcinin tabloya doğrudan erişimi YOK; fonksiyonlar: `content_feed`,
  `content_track`, `content_submit_vet`, `content_promote_campaign` (fırsat = işletmenin `clinic_campaigns` kaydı, ikinci kopya yok),
  `content_withdraw`, `content_my_items`, `content_admin_list/save/review/archive`. Yönetici denetimi `is_platform_admin()` = `get_my_role()`
  (yönetici 2FA kuralı uygulanınca otomatik ona tabi). Onay/red işletmeye `notify_business('biz_content_review')`.
- **Ekranlar:** yönetici `/admin/icerik` (eski `/admin/alerts` silindi), işletme `/business/campaigns` (öne çıkar + Veteriner Önerisi; randevu
  sayfasındaki eski tavsiye editörü silindi). Servis `services/contentService.ts`. Emekli: `system_announcements`, `vet_advices`, `business_deals`,
  `deal_analytics`, `/api/deals*` (kod ve tablolar silindi, 2026-10-03 Baran SQL Editor'dan; FK'lar ve test temizliği de uygulandı).
  Özel ad ekleri için `lib/turkish.ts` (`genitive`, `locative`).
- 🔴 **8.64a Depo güvenlik açığı (düzeltildi, 2026-10-03):** avatars/posts/stories/sounds depolarında güncelleme ve silme kuralları
  sahiplik denetlemiyordu. Artık yalnızca sahibi (`owner` ya da `<kullanıcı-id>/` klasörü). Yeni depo açarken aynı kuralı yaz.
- Servis rolünün `businesses` gibi tablolara doğrudan yazma yetkisi yok (bilinçli); test kurulumunda işletme `execute_sql` ile açılır.
- 🔴 Fırsat hikâyesi kampanyayı `clinic_campaigns`'ten CANLI okur; bu yüzden gösterilen alan (başlık/metin/görsel/kupon/hedef) değişince
  `clinic_campaigns_content_review` tetikleyicisi öne çıkarmayı yeniden onaya düşürür (20261004100600). Canlı okunan işletme içeriğine yeni
  alan eklersen tetikleyiciye de ekle. İçerik bağlantıları tek kural: `contentLink()` (`/…` ya da https; `//` reddedilir).

### Supabase bağlayıcısı (claude.ai) notu
`DROP` ve `DELETE` geçen her komut için ayrı onay ister (VS Code panelinde gösterilemez → "declined"; "her zaman izin ver" aşmaz).
Migration'ı bu kelimeleri içermeyen parçalar (Claude uygular) + içeren parça (Baran SQL Editor'dan) diye böl; kelimeyi gizleme.

## 9. Bilinen, bilinçli ya da düşük öncelikli sorunlar (2026-10-02)

Güvenlik taraması ve genel kontrolün sonucu (ayrıntı 8.62). Acil olan yok; unutulmasın:
- 18 fonksiyonda mutable `search_path` (düşük risk; yeni fonksiyonlarda `set search_path to 'public'` zaten zorunlu).
- Tasarım gereği kalanlar: `*_cards` görünümleri SECURITY DEFINER, `spatial_ref_sys`, `postgis`/`pg_net` public şemada, istemciye kapalı
  tablolar (RLS var, politika yok: `email_outbox`, `store_events` vb.).
- "Leaked password protection" Supabase Pro planında (şimdilik sadece en az 8 karakter kuralı).
- Bakım modu (`platform_settings.general.maintenanceMode`) normal kullanıcılar için hiç çalışmıyor: ayar satırı sadece yöneticiye okunur,
  ara katman okuyamaz. Düzeltmek için ayrı, herkese okunur küçük bir alan/görünüm gerekir.
- `/profile/me` (literal "me") sonsuz "Profil Yükleniyor"da kalır; uygulama bu adresi hiçbir yerde kullanmaz, düşük öncelik.
- 🔴 Bilgi: `getSessionUser()` (`supabaseApiService.ts`) 60+ fonksiyonun çağırdığı tek noktadır ve 2 sn'lik promise cache'i vardır
  (cache'siz hâli Supabase auth hız sınırına takılıp girişi donduruyordu). Bu cache'i kaldırma.

## 10. Baran ile çalışma tarzı

- Kısa, net, dürüst değerlendirme ister — pohpohlama veya belirsiz "olabilir"
  cevapları değil.
- Sadece kritik bilgiyi vurgula (🔴 veya kalın), gerisini sade tut.
- Kod/sınıf ismi ağırlıklı değil, **hangi ekran/özellik etkileniyor ve neden**
  şeklinde günlük dilde açıklama tercih ediyor.
- Kendi görüşünü/önerini proaktif olarak sun — sadece evet/hayır sorusu
  sorup pasif bir şekilde onun kararını beklemek yerine, bağımsız analiz
  yapıp yön öner.
- Bir konuda **birden fazla terminal/git komutu** gerekiyorsa, hepsini tek
  seferde, aralıklı biçimde ver — her küçük değişiklikten sonra ayrı ayrı
  komut isteme.

## 11. Çoklu-ajan çalışma sistemi ve kilitli tasarımlar

Aynı anda üç ajan çalışabilir: bu sohbetteki Claude (Supabase/Vercel'e MCP ile bağlı), editördeki Claude Code ve Antigravity.
- Basit, tek dosyalık UI/kod değişiklikleri editördeki ajanlarda daha hızlı. Mimari kararlar, çok dosyalı değişiklikler, inceleme/doğrulama
  bu sohbetteki Claude'da.
- 🔴 **Kalıcı veritabanı işlemleri (şema, migration, veri silme) SADECE bu sohbetteki Claude'dan yapılır.** Diğer ajanlar gerekirse önce Baran'a
  haber verir; salt okuma serbest.
- **Eşzamanlı düzenleme riski gerçek:** bir dosyayı düzenlemeden hemen önce güncel halini tekrar oku, eski kopyanın üstüne körlemesine yazma.
- Dış ajanın "tamamlandı" raporu doğrulanmadan kabul edilmez (bir kez "redeploy edildi" denmişti, edilmemişti): DNS, Vercel, kuyruk gibi
  gerçek durumdan kontrol et.

**Kilitli tasarım referansları** (`design-reference/`): bu klasörler Baran'ın verdiği gerçek referanslardır; ilgili ekranda UI değişikliğinden
ÖNCE okunmalı, tahmin edilmez, onaysız bölüm silinip eklenmez. (walk-final bir kez kaybolmuş, görselsiz inşa edilen işler baştan yapılmıştı.)

| Klasör | Kapsam |
|---|---|
| `home-final/` | `/home` ana sayfa (renk kodları, font, bölüm sırası, mockup, kaynak) |
| `walk-final/` | `/walk/*` yürüyüş modülü, 8 ekran |
| `vet-final/` | `/vet/*` veteriner bul & randevu, 14 ekran |
| `health-final/` | `/health/*` sağlık merkezi / karne (+ ilham görseli) |
| `community-final/` | `/kayip`, `/sahiplendirme`, `/community` (14 + 14 + 12 ekran) |
| `passport-final/` | `/pasaport/*`, `/id`, `/p` (10 ekran) |
| `onboarding-final/` | `/` giriş + `/onboarding` pet kurulumu (9 ekran) |

## 12. Açık işler (2026-10-02)

Baran PC başına dönünce bu liste birlikte gözden geçirilir; biten madde silinir. E-posta, anahtar ya da hesapla ilgili işe başlarken
ilgili maddeyi tek satırla hatırlat.

### 12.1 Baran'ın yapacakları ve kararları

**Hemen**
- [ ] SQL Editor'da `20261004100900_profiles_no_direct_delete_MANUAL_sql_editor.sql` (profil satırını doğrudan silme izni, `studio_assets`,
      testten kalan "[TEST]" işletmeler — şu an onaysız, görünmüyorlar).
- [ ] SQL Editor'da `supabase/migrations/20261003102000_walk_cleanup_MANUAL_sql_editor.sql` çalıştır (acil değil, tekrar eden
      politika/index temizliği; DROP içerdiği için bağlayıcıdan uygulanamıyor).
- [ ] 🔴 **`GEMINI_API_KEY`** (Google AI Studio) → Vercel Production + yeniden yayın. Yok: yapay zekâ canlıda çalışmıyor. Yereldeki `.env.local` anahtarı da Google tarafından reddediliyor (401, 2026-10-03): AI Studio’dan yeni anahtar her ikisine.
      Google tarafında da faturalandırma limiti/uyarısı önerilir (kod tarafında aylık 50 $ tavan var).
- [ ] 🔴 **Yönetici iki adımlı doğrulama kurulumu:** `/admin` şu an KİLİTLİ (doğrulama olmadan açılmaz, işletme başvuru onayı dahil). Yönetici
      hesabının e-postası Baran'a ait olmadığı için ertelendi. Kurulunca Claude `20261002180000_admin_requires_mfa.sql`'i uygular
      (ters sıra yönetici verisine erişimi kapatır). İlk gerçek işletme başvurusundan önce yapılmalı.

**Hesaplar ve ortam** (telefon uygulaması için; kod hazır, 8.59–8.61)
- [ ] Apple ve Google geliştirici hesapları (8.52: şirket adına, D-U-N-S). RevenueCat hesabı (ücretsiz başlangıç; App Store Connect + Play Console bağla).
- [ ] Firebase projesi (sadece FCM dağıtım kanalı; veri Supabase'de) + Apple APNs anahtarı. Gelince Claude sunucuda gönderimi ve
      `push_subscriptions`'a telefon jetonunu ekler; o zamana kadar telefonda bildirim aboneliği bilerek kapalı.
- [ ] Derleme ortamı: Android Studio + SDK ~10 GB (C: diskte ~1 GB boş; yer aç ya da başka diske kur). iPhone için Mac + Xcode ya da bulut derleme
      (Codemagic/Appflow). Sonra `npx cap open android`.
- [ ] Uygulama simgesi (1024×1024, köşesiz) ve açılış ekranı görseli. Android imza anahtarı (keystore) birlikte oluşturulup güvenli saklanmalı
      (kaybolursa uygulama bir daha güncellenemez).

**Kararlar**
- [ ] Uygulama kimliği `net.moffi.app` (mağazada sonradan değişmez): onay ya da başka kimlik. Uygulamanın adı değişecek; para birimi adı yeni isme göre.
- [ ] Mağaza fiyatları: Prime aylık/yıllık ve PawCoin paketleri. Mağazada ürünler AYNEN şu kimliklerle açılır: abonelik `moffi_prime_monthly`,
      `moffi_prime_yearly`; tüketilebilir `pawcoin_500`, `pawcoin_1200`, `pawcoin_3000`; RevenueCat'te `prime` entitlement + "default" offering.
- [ ] Vercel'e: `REVENUECAT_WEBHOOK_SECRET` (uzun rastgele; RevenueCat → Webhooks → Authorization'a aynısı; adres
      `https://app.moffi.net/api/revenuecat/webhook`), `NEXT_PUBLIC_REVENUECAT_IOS_KEY`, `NEXT_PUBLIC_REVENUECAT_ANDROID_KEY`.
- [ ] PawCoin paketi satın alma ekranı nerede olsun (Ödül Marketi'nin üstü / ayrı "Cüzdan")? Katalog ve sunucu hazır.
- [ ] Yapay zekâ fotoğraf analizi (`/api/ai/vision`, Prime ayrıcalığı olarak kararlaştırıldı) hangi ekrandan açılsın (Sağlık Merkezi "fotoğrafla sor",
      mama etiketi okuma)? Şimdilik arayüzde yok, Prime ekranında listelenmiyor.
- [ ] `ai` ve `@ai-sdk/google` paketleri artık kullanılmıyor: kaldırayım mı? (paket kaldırma onay ister)
- [ ] Mağaza sayfası: açıklama, ekran görüntüleri, gizlilik politikası (`/privacy`), destek e-postası, Apple gizlilik etiketleri (konum, evcil hayvan
      verisi, fotoğraf, e-posta). Claude metin taslağını hazırlayabilir.
- [ ] Bilgi: Apple kural 4.2 (uygulama canlı siteyi kendi içinde açıyor; arka plan konum/satın alma/bildirim bunu karşılar ama incelemede soru gelebilir).
      Widget (iOS WidgetKit/Android AppWidget) yerel kod ister, derleme ortamı hazır olunca birlikte. Adım sayar: ücretsiz güvenilir eklenti yok, sensör
      kullanılıyor, ekran kapalıyken adım sayılmaz (mesafe GPS'ten sürer); Apple Sağlık/Health Connect ayrı iş.

**Anahtar envanteri** (Baran'la birlikte, sıfırdan kayıt): Resend (Vercel ve Supabase SMTP için ayrı anahtarlar), Supabase (anon, service role, cron),
Vercel (`EMAIL_CRON_SECRET`, `GEMINI_API_KEY`, ileride RevenueCat/Firebase/Apple/PayTR). Her biri için: ad, servis, nerede kullanıldığı, ne zaman
oluşturulduğu, sızarsa ne yapılacağı. Değerler ASLA bu dosyaya yazılmaz (parola yöneticisine, örn. Bitwarden). Sonunda kullanılmayanlar iptal edilir,
yenileme tarihi konur.

### 12.2 Domain taşıma kontrol listesi
Baran yeni alan adı alıp `moffi.net`'i arkadaşına verecek (Vercel/Supabase/GitHub/Resend Baran'da kalır). 🔴 `moffi.net` devredilmeden ÖNCE taşı;
yoksa uygulama adresi, tüm e-postalar ve Resend doğrulaması kapanır. Sıra: (1) yeni domain'i Vercel'e ekle + DNS; (2) Resend'e yeni domain + SPF/DKIM,
Supabase SMTP gönderen adresi, Vercel `RESEND_FROM_EMAIL`; (3) Supabase Authentication → URL Configuration (site adresi, yönlendirmeler, Google girişi);
(4) Claude: pg_cron adresleri (`email-outbox`, `account-purge`), `capacitor.config.ts` `server.url`, koddaki sabit `app.moffi.net`; (5) yeni adreste test,
eski adresten yönlendirme, sonra devir. Basılı QR künyeler (`/id/...`) eski adrese gider: basmadan ÖNCE taşı.

### 12.3 Claude'un yapacağı (teknik borç ve bekleyen işler)
- [x] **Giriş + ilk karşılama + pet kurulumu yenilendi (2026-10-02).** Tek kaynak: `design-reference/onboarding-final/` (9 ekran, README'de kararlar).
      `/` → `components/auth/AuthFlow.tsx` (karşılama/kayıt/kod/giriş/sıfırlama); `/onboarding` → `components/onboarding/PetSetup.tsx` (ekran 4–9, tek
      kayıt: [Tamamla]'da pet + fotoğraflar + izinler). Sunucu bayrağı `profiles.onboarding_completed_at` (`complete_onboarding` RPC, `useOnboardingStatus`);
      "Şimdilik atla" da kurulumu bitirir. Onay kaydı `handle_new_user`'da (terms_accepted_at/terms_version/marketing_consent), kullanıcı adı ad+kısa kod,
      varsayılan avatar boş (baş harf). `addPet` artık ırk/yaş/cinsiyet/doğum tarihi (tahminî işareti)/renk/çip/kilo/galeri/ayırt edici özelliği kaydediyor
      (`constants/breeds.ts`). Eski `drafts/*` ve `AuthForms.tsx` silindi; `AddPetModal` sadece sonradan eklemelerde (eski tasarım, sıra ona gelince).
      🔴 Yolda bulunan hata: `ActivityContext` ilk `walkStats` değerleri sahteydi (18 yürüyüş/32 km/7 gün) → yeni kullanıcıya anında 5 "rozet kazandın"
      bildirimi çıkıyordu; sıfırlandı, rozet anahtarı `moffi_earned_badges_v3`. Çerez bandı kompakt yazıldı, giriş/kurulumda gizli. `/onboarding` açık
      temaya zorlanır (`ThemeContext` authPaths). **Baran'a bırakılan:** isteğe bağlı Supabase e-posta kodu uzunluğunu 6 yapmak (kutular 8'e kadar uyar),
      köpek/kedi kartları için gerçek fotoğraf, Apple girişi (hesap gelince), kamera eklentisi (native aşamasında).
- [ ] 🔴 **Kod borcu (2026-10-03 ölçümü, yalnızca azalır):** tip kontrolü (src) **68** hata; lint **~1.150** hata (çoğu `no-explicit-any` ~970,
      `no-unescaped-entities` ~98, React kuralları ~120). Sıra: (1) tip hataları — gerçek kusurlar önce: `MoffiRunGame` tanımsız değişkenler
      (oyun bitişinde çöker), `ShopProduct`'ın iki ayrı tanımı (`services/types` ↔ `types/domain`, mağaza), `IApiService`'te eksik metotlar
      (`getClinicProducts`, `updateOrderTracking`, `getClinicQuests` — çalışıyor ama tipsiz), `PetContext.Pet` ↔ `services/types.Pet`, `AuthContext`
      `UserProfile`; (2) React kuralları (`set-state-in-effect`, `purity`, `refs`); (3) `any` ve kaçış karakterleri en sonda, dosya dosya.
      Ölü dosya avı (E aşaması) 2026-10-03'te yapıldı: 48 kullanılmayan dosya silindi (`scratchpad/orphans.cjs` mantığı: hiçbir yerden import edilmeyen modül).
- [ ] Sahibi silinen (hesabı kalıcı silinen) tek kişilik işletme sahipsiz kalıyor: `request_account_deletion` yalnız ekibi olanı engelliyor; `prepare_account_purge`
      işletmeyi kapatmalı (onayı kaldır + gizle) ya da kişiye "önce işletmeni kapat" demeli. Karar gerekiyor.
- [ ] İşletme kurulum sihirbazı (`OnboardingWizard`) ve işletme panelinin bazı ekranları indigo/mavi tonlarda (Bölüm 5'e aykırı).
- [ ] Yürüyüş denetimi C/D aşamaları (2026-10-03 raporu): C = görev/rozet/XP sunucuya, görev tiplerinin düzeltilmesi (günlük
      toplam, imkânsız "Çift Yürüyüş"), otomatik günlük hedefin gün içinde sabit kalması (ilk yürüyüşten sonra 1,7→2,3 sıçrıyor),
      meydan okuma/rozet/sıralama/ödül ekranlarının referans tasarıma çekilmesi. D = anahtarlı harita sağlayıcısı (OSM karo kullanım
      politikası). (E = ölü dosyalar tamamlandı.)
- [ ] "Moffi Puanı / PP" yazan arayüz metinleri yeni para birimi adına çevrilecek (isim belli olunca topluca).
- [ ] `pets.health_notes` ve `sos_settings.critical_health_note` kolonları silinecek (içerik 8.45'te taşındı; kolon silme Baran'ın SQL Editor'ından).
- [ ] Silinen gönderi/hikâyelerin depoda kalan eski dosyaları (8.50).
- [ ] Bakım modu normal kullanıcıda çalışmıyor (Bölüm 9). `LiveMap` Carto altlığı OSM'e (8.1). Beslenme: `/food` localStorage → Supabase,
      `NutritionModal` kararı (Bölüm 6, 5.4).
- [ ] İlk gerçek hesap silme talebinde (en erken 2026-11-01) ilk gece çalışmasından sonra sonucu doğrula (8.57).
- [ ] Sahte veriyle çalışan ekranlar (2026-10-03 ana sayfa turunda bulundu, ana sayfadan/kenar panelinden bağlantıları kaldırıldı):
      `/wallet` (`data/mockWallet`), `MoffiMapsModal` (sahte işaretler), mağaza ürün yorumları (`petshop` "Ahmet S." vb.),
      `ActionHubDrawer` ("Moffi Pay cüzdan", "Aile"). Ayarlar'daki "Anlık Bildirimler" anahtarı (`pushEnabled`, Bildirim Ayarları bölümü) hâlâ sadece işaret.
