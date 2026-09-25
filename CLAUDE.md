# Moffi — Proje Hafızası (CLAUDE.md)

Bu dosya, bu projede çalışan her Claude Code oturumunun **otomatik olarak okuduğu**
kalıcı proje hafızasıdır. Amacı: sıfırdan başlamamak — geçmişte öğrenilen mimari
kararları, tuzakları ve çalışma kurallarını her seferinde yeniden keşfetmemek.

Bu dosyayı güncel tut: yeni bir mimari karar alındığında, yeni bir kritik tuzak
bulunduğunda veya bir Faz tamamlandığında buraya ekle.

---

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
- **Ödeme:** Stripe (`@stripe/react-stripe-js`, `@stripe/stripe-js`)
- **AI:** Google Generative AI (`@ai-sdk/google`, `@google/generative-ai`), OpenAI SDK
- **3D/Görsel:** Three.js, `@react-three/fiber`, `@react-three/drei` (muhtemelen
  evcil hayvan avatarı/oyunlaştırma için)
- **Diğer:** `date-fns`, `framer-motion`, `leaflet`/`react-leaflet` (harita),
  `qrcode`/`qrcode.react`, `jspdf`, `xlsx`, `resend` (e-posta)
- **Deploy:** Vercel

Komutlar: `npm run dev`, `npm run build` (webpack modunda), `npm run lint`.

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
karşılaşılanlar: `Soup` (`soup.js`) ve `HelpCircle` (`circle-question-mark.js`).
Ortak bir desen yok (ikisi de sıradan, küçük SVG ikonları) — tahmin
edilemiyor, sadece karşılaşınca fark ediliyor (genelde 500 hatası + dev
sunucusu log'unda "Execution of <DiskFileSystem as FileSystem>::read
failed" görülür). **Çözüm:** o ikonu KULLANMA — işlevsel olarak eşdeğer
başka bir ikonla değiştir (ya da bu örnekte olduğu gibi düz metin/emoji
kullan). Zaman kaybetmeden hatayı tanı ve ikonu değiştir, kök nedenini
araştırmaya çalışma (OneDrive/Turbopack etkileşimi, bu projenin kontrolü
dışında).

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

## 8. Faz (geliştirme fazı) yol haritası

- **Faz 1–12:** Tamamlandı.
- **Faz 12.5/19 (şu an aktif):** CareHub ailesi için kalan "Kural C" tasarım
  kararları + DentalCareModal/MedicationModal yerleşim doğrulaması (Bölüm
  5.3'te doğrulandı, sorun yok) + ana sayfa "ilk izlenim" yenilemesi (Bölüm
  5.4'teki beslenme sorunuyla bağlantılı, henüz başlanmadı).
- **Faz 13:** Klinik mesajlaşmasını genel mesaj merkeziyle birleştirme.
- **Faz 14:** Kupon otomatik kullanımı.
- **Faz 15:** Klinik paneli verimlilik araçları.
- **Faz 16:** Dashboard widget denetimi.
- **Faz 17:** Çoklu işletme türü desteği.
- **Faz 18:** Görev (quest) sistemi denetimi. ✅ Tamamlandı (2026-09-23,
  bkz. Bölüm 8.12) — `MonthlyResearch` donuk ilerleme bugı düzeltildi, gerçek
  "Meydan Okumalar" ekranı (`/walk/challenges`) inşa edildi.
- **Faz 20:** Doktor profili zenginleştirme.

### 8.0 Yürüyüş modülü yeniden yapımı — 17 fazlık plan ve durumu (2026-09-23)

Baran'ın verdiği 81 maddelik "TOTAL MOFFİ YÜRÜYÜŞ MODÜLÜ" brief'ine ve 8 ekranlık
referans mockup görseline dayanan, onaylanmış 17 fazlık plan. Bu plan daha önce
sadece konuşma hafızasındaydı, kalıcı olarak buraya not düşülmemişti — kayıp
riskine karşı şimdi ekleniyor. Her fazın CLAUDE.md'de kendi alt bölümü var
(bkz. 8.2-8.6), burası sadece genel durum takibi.

- **Faz 1 — Envanter/mimari karar:** ✅ Tamamlandı. `NeighborhoodLeague.tsx`
  silindi. `LeaderboardSection`/`WeatherSphereEffect`/`QuestBentoCard`
  kendi fazlarına (13/hava durumu/görev) bilinçli olarak ertelendi.
- **Faz 2 — State machine + izin/hata altyapısı:** ✅ Tamamlandı
  (`ActivityContext.tsx`: walkPhase, walkIssue, recoverableWalk).
- **Faz 3 — Ready ekranı:** ✅ Tamamlandı (`WalkQuickSheet.tsx`).
- **Faz 4 — Aktif Yürüyüş ekranı (harita + bottom sheet):** ✅ Tamamlandı,
  sonra referans görsele göre yeniden tasarlandı (bkz. 8.2 öncesi notlar).
- **Faz 5 — Paused durumu:** ✅ Tamamlandı.
- **Faz 6 — Bitirme onayı + Result ekranı:** ✅ Tamamlandı (`/walk/summary`).
- **Faz 7 — Puan sistemi (transaction-tabanlı):** ✅ Tamamlandı (bkz. 8.2).
  `point_transactions` + `award_pati_puan` RPC, coin_balance/PawCoin'den ayrı.
- **Faz 8 — Streak + Günlük/Haftalık Hedef:** ✅ Tamamlandı (bkz. 8.3).
  Gerçek seri kalkanı sistemi kuruldu (öncekiyse tamamen sahteydi).
- **Faz 9 — İlerleme & İstatistikler ekranı:** ✅ Tamamlandı (bkz. 8.4).
  Hedef: `/walk/page.tsx`.
- **Faz 10 — Yürüyüş Geçmişi + Detay:** ✅ Tamamlandı (bkz. 8.6). En yoğun
  bulgu seti — RLS güvenlik açığı + yürüyüş geçmişinin hiç çalışmadığı
  ortaya çıktı.
- **Faz 11 — Meydan Okumalar:** ✅ Tamamlandı (2026-09-23, Faz 18 kapsamında,
  bkz. 8.12). İlk turda referans görsel elde değilken Faz 18'e ertelenmişti;
  görsel geri gelince tam bir coğrafi kümeleme altyapısı olmadan da gerçek
  GPS verisinden hesaplanabildiği görüldü — gerçek `/walk/challenges` ekranı
  inşa edildi.
- **Faz 12 — Rozetler:** ✅ Tamamlandı (bkz. 8.7). 3 kalıcı-kazanılamaz
  rozet bulundu, 2'si o an düzeltildi (`photographer`, `pet_care_week`),
  `research_complete` donmuş `MonthlyResearch`'e bağlı olduğu için o zaman
  Faz 18'e bırakılmıştı — Faz 18'de (bkz. 8.12) `MonthlyResearch`'ün kendisi
  düzeltildiği için bu rozet de artık gerçekten kazanılabiliyor. Yeni
  `/walk/badges` ekranı inşa edildi.
- **Faz 13 — Sıralama (Leaderboard):** ✅ Tamamlandı (bkz. 8.8, önemli bir
  düzeltme geçirdi). İlk turda referans görsel elde olmadığı için PP-tabanlı,
  pg_cron'lu bir "haftalık lig" sistemi kuruldu — sonra referans görsel geri
  gelince bunun ekranla hiç alakası olmadığı anlaşıldı (referans: km-bazlı +
  zaman/sosyal filtre, lig kavramı yok), lig sistemi tamamen geri alınıp
  referansa göre yeniden kuruldu.
- **Faz 14 — Ödül Marketi:** ✅ Tamamlandı (bkz. 8.9). Yeni `reward_products`
  kataloğu + mevcut PP ekonomisiyle (award_pati_puan, negatif miktar) gerçek
  satın alma. Yeni `/walk/rewards` ekranı.
- **Faz 15 — Yönlendirici (referral) ödül sistemi:** ⏳ Bekliyor.
- **Faz 16 — Analytics & KPI enstrümantasyonu:** ⏳ Bekliyor.
- **Faz 17 — Cila (performans/erişilebilirlik/arka plan/ağ toparlama):** ⏳ Bekliyor.

### 8.1 Yürüyüş modülü yeniden yapımı — kurgu/yaklaşık çözüm listesi

Baran'ın talimatı: yürüyüş modülü rebuild'inin (17 fazlık plan, bkz. yukarısı)
her fazında geçici/yaklaşık/"gerçeği tam karşılamayan" bir çözümle
karşılaşılırsa buraya not düşülecek, çözülmeyecek — **tüm fazlar bitince**
hepsi tek tek gerçek/kalıcı hale getirilmeye çalışılacak. Bu bölüm o listedir.

- **`background_permission_required` durumu (Faz 2, `ActivityContext.tsx`):**
  Web'de gerçek bir "arka planda konum izni" API'si yok (bu native/mobil bir
  kavram). Şu an sadece `visibilitychange` ile "sekme arka plana alındı"
  tespit edilip kullanıcıya bilgilendirici bir uyarı gösteriliyor — gerçek bir
  izin isteği/arka plan takibi değil. Tam çözüm muhtemelen bir native wrapper
  (Capacitor vb.) veya PWA background sync/permission API gerektirir.
- **GPS kalite eşikleri (Faz 2):** `accuracy > 50m` → "zayıf", 15sn boyunca
  yeni fix gelmezse → "kayıp", drift kalkanı (15m hareket + 25km/h üstü hız
  reddi) — hepsi deneyimsel/tahmini sabitler, gerçek cihaz/GPS testleriyle
  kalibre edilmedi.
- **`network_unavailable` durumu (Faz 2):** Şu an sadece tarayıcının
  `online`/`offline` event'ine bakıyor (bağlantının var/yok olduğunu, kalitesini
  değil). Sunucuya konum senkronu (`updateWalkLocation`) sessizce başarısız
  olduğunda (try/catch içinde yutuluyor) bunu da bu duruma bağlamak henüz
  yapılmadı.
- **"Devam eden yürüyüş bulundu" ekranı (Faz 3, `WalkQuickSheet.tsx`):** Sadece
  mesafe ve süreyi gösteriyor; brief'in istediği harita/rota önizlemesi henüz
  yok (o `LiveMap`'e bağlanmayı gerektirir, Faz 4'ün kapsamı).
- **Yürüyüş hazırlık checklist'i (poşet/su/tasma) ve özel hedef mesafe UI'ı
  (Faz 1'den kalma):** State machine'e bağlanmadı, hâlâ bağımsız
  localStorage state'i — Faz 3 kapsamında sadece phase geçişleri eklendi,
  checklist'in kendisi dokunulmadı.
- **`LiveMap.tsx` içine gömülü sahte POI/hazine avı (Faz 4):** Aktif yürüyüş
  ekranındaki (`/walk/tracking`) kamera/müzik/BLE-nabız/coin-oyunu/pet-stats/
  yanıltıcı-tab-switcher Baran onayıyla tamamen kaldırıldı. Ama `PLACES`/
  `MOCK_MARKS` (uydurma konum işaretleri) `LiveMap.tsx`'in KENDİSİNE gömülü
  (tracking sayfasının geçtiği prop'lardan bağımsız) — haritada hâlâ görünüyor
  olabilir. `LiveMap` 4 farklı yerde paylaşılıyor (`/walk/tracking`, `/walk`,
  `OrderTrackingModal`, `MoffiMapsModal`) — Baran'ın "sistemin diğer
  parçalarını etkilemesin" sınırı gereği bu fazda dokunulmadı. Temizlemek
  için bu 4 kullanım noktasını da kapsayan ayrı, dikkatli bir inceleme
  gerekiyor.
- **`bluetoothManager.ts` artık hiçbir yerden çağrılmıyor (Faz 4):** Sahte
  değil, gerçek/çalışır bir Bluetooth kalp ritmi yardımcı modülü — ama tek
  çağıran yer (tracking sayfasındaki sahte nabız simülasyonu) kaldırıldığı
  için artık orphan. Silinmedi (gerçek kod), ileride gerçek bir BLE nabız
  özelliği istenirse buradan devam edilebilir.
- **Yürüyüşü tracking sayfasından bitirme (Faz 4, `handleFinish`):** ~~Hâlâ
  sadece `stopWalk()` çağırıp `/walk`'a yönlendiriyor~~ — Faz 6'da düzeltildi,
  artık `/walk/summary`'e yönlendiriyor.
- **"Bu Yürüyüşü Kaydet" buton etiketi (Faz 6, referans revizyonu):** Referans
  görsele göre etiketlendi ama gerçek bir "kaydetmeden önce ertelenmiş"
  mekanizma yok — yürüyüş bu ekran açılmadan ÖNCE (stopWalk sırasında) zaten
  veritabanına kaydedilmiş oluyor. Buton sadece "tamam, anladım" işlevi
  görüyor, gerçek bir onay kapısı değil. İleride gerçek bir taslak/onay akışı
  istenirse `stopWalk`'un DB yazımını bu ekrandaki buton tıklamasına
  ertelemek gerekir (mevcut mimariye orta büyüklükte bir değişiklik).
- **`LiveMap` içindeki "API KEY REQUIRED" filigranı (2026-09-23'te fark
  edildi, ilgisiz/önceden var olan bir sorun):** Harita tile sağlayıcısı
  (Carto) için bir API anahtarı eksik/yapılandırılmamış görünüyor — 4
  kullanım noktasının hepsini etkiliyor olabilir. Yürüyüş modülü kapsamı
  dışında, ayrı incelenmeli.
- **Global AI asistan widget'ı (✨ ikonu) ve alt navigasyon çubuğu artık
  `/walk/tracking` ve `/walk/summary`'de gizli** (Faz 6, referans
  revizyonu) — ikisi de referans mockup'ta yok, ayrıca daha önce start/bitir
  butonlarının üzerine binip gerçek tıklama sorunlarına yol açmıştı.
  `WalkQuickSheet` açıkken (pathname hâlâ `/home` olduğu için) bu widget hâlâ
  görünür kalabilir — küçük, kozmetik bir örtüşme, henüz ele alınmadı.

### 8.2 Faz 7 — "Moffi Puanı" (PP) transaction-tabanlı puan sistemi mimarisi (2026-09-23)

🔴 **`profiles.coin_balance`/`moffi_coins` ("Moffi PawCoin") ile "Moffi Puanı"
(PP) İKİ AYRI, BİRBİRİNE KARIŞTIRILMAMASI GEREKEN para birimi.** PawCoin
gerçek/satın alınabilir bir "dijital varlık" (`WalletTab.tsx`: "Dijital Varlık
Cüzdanı") — ve istemci tarafından artırılması geçmişte kritik bir güvenlik
açığıydı: `supabaseApiService.ts`'teki `addBalance()` bu yüzden bilerek devre
dışı bırakılmış (her zaman hata fırlatıyor), yorum satırında "bakiye
yalnızca gerçek ödeme webhook'ları üzerinden eklenebilir" yazıyor. Moffi
Puanı (PP) ise yürüyüş/görev kaynaklı, ücretsiz bir oyunlaştırma para birimi
— PawCoin'e KARIŞTIRILSAYDI bu patchlenmiş güvenlik açığı yeniden açılırdı.

**Kurulan yapı:**
- `point_transactions` tablosu (user_id, amount, reason, source, reference_id,
  created_at) — her PP kazanımı/harcaması denetlenebilir bir satır. RLS açık,
  `authenticated` sadece kendi satırlarını SELECT edebilir; INSERT/UPDATE
  policy'si YOK — yazma sadece aşağıdaki fonksiyon üzerinden.
- `profiles.pati_puan_balance` (integer, default 0) — gerçek bakiye.
- `award_pati_puan(p_amount, p_reason, p_source, p_reference_id)` — SECURITY
  DEFINER fonksiyon, `search_path` sabitlendi (mutable search_path listesine
  eklenmedi), sadece `authenticated`'e EXECUTE verildi (`anon`'a değil).
  `auth.uid()` içeriden alınıyor (istemci başka kullanıcı hedefleyemez).
  Negatif miktar (harcama) için bakiye kontrolü sunucu tarafında da yapılıyor
  (`Yetersiz Moffi Puanı bakiyesi` hatası) — sadece istemci kontrolüne
  güvenilmiyor. Doğrulama: gerçek SQL ile earn/overdraft-reddi/spend üçü de
  test edildi, sonra temizlendi.
- `QuestEngineContext.tsx`: `totalPatiPuan` artık mount'ta
  `apiService.getPatiPuanBalance()` ile gerçek DB'den uzlaştırılıyor.
  `awardReward`/`spendPatiPuan`'ın MEVCUT senkron API sözleşmesi (anında
  state güncellemesi, `spendPatiPuan`'ın senkron `boolean` dönüşü) BİLEREK
  bozulmadı — bunun yerine her ikisi de localStorage'a yazmaya devam eder
  AYRICA arka planda `apiService.awardPatiPuan(...)` çağırır (fire-and-forget,
  hata sadece console'a loglanır). Sebep: `spendPatiPuan`'ı sync tutmak,
  `home/page.tsx`'teki 4 çağıran yeri (apparel/accessory/sandık satın alma —
  yürüyüş modülü kapsamı dışında, dokunulmadı) kırmadan gerçek kalıcılığı
  eklemenin tek yolu.

**Bilerek kapsam dışı bırakılan (gelecek fazların işi):** Görev/rozet
TAMAMLANMA mantığı hâlâ %100 istemci tarafında (`updateQuestProgress`
client state'ini okuyup karar veriyor) — yani teorik olarak biri
devtools'tan `award_pati_puan` RPC'sini doğrudan çağırıp sahte bir "görev
tamamlandı" ödülü isteyebilir (miktarı serbestçe seçemez ama HERHANGİ bir
kazanım/harcama tetikleyebilir). Bu, PawCoin'de düzeltilen güvenlik açığının
daha küçük bir versiyonu — TAM çözümü (sunucu tarafında görev/mesafe
doğrulaması) Faz 11 (Meydan Okumalar) ve Faz 12 (Rozetler) kapsamına
bırakıldı, bilinçli bir sınır, unutulmuş bir şey değil.

### 8.3 Faz 8 — Streak + Günlük/Haftalık Hedef, bulunan gerçek hatalar (2026-09-23)

🔴 **`useStreakShield()` tamamen yanıltıcı/sahte bir özellikti — kullanıcıya
yalan söylüyordu.** Buton tıklandığında sadece "🛡️ Seriniz korundu!" toast'u
gösterip localStorage'da bir flag kapatıyordu; gerçek seri hesaplaması
(`getWalkStats()`, `walk_sessions` üzerinden gün gün tarama yapıyor) bu
flag'ten tamamen habersizdi. Kullanıcı kalkanı kullandığını sanıp bir
sonraki yenilemede serisinin yine de sıfırlandığını görebiliyordu. Ayrıca
dosya başlığındaki "48 saat affı + yağmur affı" yorumu da hiç
implemente edilmemişti (sadece dokümantasyon niyeti, kod yok).

**Düzeltme:** `streak_shield_uses` tablosu (hangi tarihin kalkanla
"affedildiği") + `profiles.streak_shield_available`/`streak_shield_week_start`
+ `use_streak_shield(p_covered_date)` SECURITY DEFINER fonksiyonu (sunucu
tarafında gerçekten doğruluyor: tarih geçerli mi, o gün gerçekten boş mu,
kalkan gerçekten müsait mi). `getWalkStats()`'in seri tarama döngüsü artık
bu "affedilmiş" tarihleri de yürünmüş gibi sayıyor — kalkan artık GERÇEKTEN
seriyi kurtarıyor. Gerçek SQL ile 4 senaryo da test edildi (geçersiz tarih
reddi, dolu gün reddi, başarılı kullanım, haftada ikinci kullanım reddi).

🔴 **Zaman dilimi hatası:** `getWalkStats()` seri hesaplamasında `end_time`'ın
UTC ISO string'i doğrudan `startsWith(dateStr)` ile karşılaştırılıyordu —
gece yarısına yakın (UTC/yerel gün sınırı civarı) yürüyüşlerde seri hatalı
kırılabiliyordu. Düzeltme: karşılaştırma artık `Date` nesnesinin YEREL
(`getFullYear/getMonth/getDate`) alanlarıyla yapılıyor.

**`bestStreak` hatası:** önceki algoritma ilk boşlukta taramayı tamamen
durduruyordu, yani "en iyi seri" aslında sadece "bugünden geriye ilk kesintiye
kadar olan seri" oluyordu — geçmişteki gerçekten en uzun seriyi hiç
bulamıyordu. Artık 365 günün tamamı taranıp gerçek en uzun aralık bulunuyor.

**Haftalık pul (7-gün serisi) hatası:** `setWeeklyStamps` her görev
tamamlanışında artıyordu — yani bir günde 3 görev bitirilirse 3 pul birden
kazanılıyordu. Bu, "7 FARKLI GÜN" anlamına gelen haftalık serinin amacını
bozuyordu (biri 2-3 günde 7 görev bitirip haftalık büyük ödülü alabilirdi).
Düzeltme: pul artık günde en fazla 1 kez ekleniyor (`LAST_STAMP_DATE_KEY`
ile günlük kontrol) — hâlâ istemci tarafında (Faz 11/12'nin görev
doğrulama sınırıyla aynı bilinçli sınır), ama en azından mantığı doğru.

**Dokunulmayan (zaten doğru bulunan):** `computeDailyGoal()` — gerçek,
adaptif (totalWalks/averageDistanceKm/currentStreak'e göre) bir motor,
sahte/hardcoded değil, sorun yok.

### 8.4 Faz 9 — İlerleme & İstatistikler ekranı (2026-09-23)

Hedef sayfa: `/walk/page.tsx` — WalkQuickSheet'teki "Yürüyüş İstatistikleri"
butonundan gerçekten ulaşılan, gerçekten kullanılan sayfa bu (referansın 8.
ekranı "Profil – Yürüyüş İstatistikleri" ile karıştırılmamalı — o, profilin
içindeki `RoutesTab.tsx`'e karşılık geliyor ve **tamamen sahte** (hardcoded
"12.4 km"/"8.2 saat" + `mockHistory` sabit rota listesi + işlevsiz "Buluta
Yedekle" promosu) ama profil sayfası walk modülü kapsamı dışında, sadece not
edildi, dokunulmadı).

**Bulunan ve düzeltilen gerçek hatalar:**
- `walkStats.longestWalkKm` hiç hesaplanmıyordu — `getWalkStats()` bu alanı
  hiç döndürmüyordu, sayfa `?? 0` ile sessizce her zaman "0.0 km" gösteriyordu.
  Artık gerçekten hesaplanıyor (en uzun tekil yürüyüş).
- Aynı UTC/yerel gün karışıklığı (Faz 8'deki seri hatasıyla aynı sınıf):
  haftalık bar grafiği `started_at`/`ended_at`'ın UTC ISO string'ini yerel
  tarih string'iyle `startsWith` karşılaştırıyordu — düzeltildi.
- 3. kez karşılaşılan "yanıltıcı sekme switcher" deseni (WalkQuickSheet ve
  tracking sayfasında zaten düzeltilmişti): "Yürüyüş/İstatistikler/Harita"
  sekmeleri vardı, "İstatistikler" hep aktif görünüyordu, diğer ikisi bu
  sayfayı hiç değiştirmeden başka sayfaya atıyordu. Kaldırıldı, yerine
  gerçek başlık + (sadece aktif yürüyüş varsa görünen) gerçek "Canlı
  Yürüyüşe Dön" kısayolu kondu.
- Ölü kod temizliği: kullanılmayan harita importu + hiç render edilmeyen bir
  `useEffect` ile alınıp hiçbir yerde kullanılmayan GPS konumu, `PLACES`,
  `QuestBentoCard`, `startWalk`/`stopWalk`, birkaç kullanılmayan ikon importu,
  geçersiz bir `PetSwitcher mode="compact"` prop'u (bileşen böyle bir prop
  kabul etmiyor, sessizce yok sayılıyordu).

**Bilerek dokunulmayan (deferred, Faz 1'den beri):** `LeaderboardSection`,
`WeatherSphereEffect` — bu sayfada render ediliyorlar ama kendi fazlarında
(Faz 13 Sıralama, ileride hava durumu) ele alınacaklar.

### 8.5 Faz 6-9 kontrol turu (2026-09-23) — 2 gerçek hata bulundu ve düzeltildi

Baran'ın isteğiyle Faz 6-9'u da Faz 1-5 gibi baştan kontrol ettim (kod okuma +
gerçek girişle Playwright testi + DB doğrulama). İki gerçek, orta-ciddiyette
hata buldum:

🔴 **Rozet/PP "bulaşması" arasında yürüyüşler (cross-contamination).**
`WalkQuickSheet` ve `/walk/tracking`'in ikisi de "bu yürüyüşte rozet
kazanıldı mı" bilgisini kendi YEREL state'lerinde (`useState` + kendi
`moffi-badge-earned` dinleyicileri) tutuyordu. Ama `DynamicNavigation`
(WalkQuickSheet'i içeren bileşen) `/walk/tracking` ve `/walk/summary`
rotalarında **tamamen unmount oluyor** (sadece gizlenmiyor — bkz. Bölüm
8.2'deki `HIDDEN_ROUTES` eklemesi, bu fazda ben ekledim). Yani: kullanıcı
yürüyüşe başlayıp panели kapatınca, WalkQuickSheet tamamen yok oluyor;
yürüyüş sırasında bir rozet kazanılsa bile WalkQuickSheet'in state'i onu hiç
görmüyor. Kullanıcı eve dönüp paneli TEKRAR açarsa (sıfırdan mount), önceki
yürüyüşten kalma state de sıfırlanıyor. Sonuç: bir rozet, kazanıldığı
yürüyüşle YANLIŞ eşleşebiliyor ya da hiç gösterilmeyebiliyordu. **Düzeltme:**
rozet takibi `QuestEngineContext`'e taşındı (`lastEarnedBadge`) — orası
zaten rozeti VEREN yer, ve context sayfa/panel geçişlerinde hiç unmount
olmuyor. Yürüyüş başlarken (false→true geçişi) otomatik sıfırlanıyor.
Playwright ile doğrulandı: art arda 2 yürüyüş yapıldığında ikinci yürüyüşün
sonuç ekranı URL'sinde ilk yürüyüşün rozetine dair hiçbir iz kalmadığı
görüldü.

🔴 **Aynı sınıf hata: "Kazandıklarınız → Moffi Puanı" günün TAMAMINI
gösteriyordu, sadece o yürüyüşü değil.** Sonuç ekranı `todayEarned.pp`
kullanıyordu — bu GÜN BOYUNCA kümülatif bir sayaç. Aynı gün 2. bir yürüyüş
yapılsaydı, ikinci sonuç ekranı da ilk yürüyüşün puanını üstüne katarak
gösterirdi ("bu yürüyüşte kazanıldı" gibi ama aslında değil). **Düzeltme:**
`QuestEngineContext`'e `walkPpEarned` eklendi — sadece aktif yürüyüş
başladığından beri kazanılanı tutar, walk start'ta sıfırlanır. Sonuç ekranı
artık bunu kullanıyor. (WalkQuickSheet'in üst kısmındaki "+X PP Bugün"
rozeti kasıtlı olarak `todayEarned.pp`'de kaldı — o zaten "bugün" diye
açıkça etiketli, doğru kullanım o.)

Ayrıca gözden geçirilen, sorun bulunmayan noktalar: `getStreakShieldStatus()`
haftalık sıfırlama tarihi hesabı istemci (yerel saat) tarafında yapılıyor,
sunucudaki `use_streak_shield` RPC'si ise `current_date` (DB sunucu saat
dilimi) kullanıyor — haftanın Pazartesi 00:00 sınırına çok yakın anlarda birkaç
saatlik bir tutarsızlık teorik olarak mümkün ama etkisi çok küçük (haftalık
kalkan bir kez erken/geç sıfırlanır, veri kaybı yok), şimdilik göz ardı edildi.

### 8.6 Faz 10 — Yürüyüş Geçmişi + Detay (2026-09-23) — bugüne kadarki en yoğun bulgu seti

🔴🔴 **Güvenlik: `walk_sessions` tablosunda "using: true" olan 2 RLS policy'si
HERKESİN HERKESİN GPS geçmişini/rotasını okumasına izin veriyordu.**
("Anyone can read completed walk sessions", "Anyone can read walk sessions")
Doğru kısıtlayıcı policy'ler (`user_id = auth.uid()`) zaten vardı ama RLS
policy'leri OR'landığı için bu ikisi onları tamamen etkisizleştiriyordu.
Baran'ın onayıyla ikisi de silindi (migration:
`remove_permissive_walk_sessions_read_policies`). Başka hiçbir kod
walk_sessions'ı başka kullanıcılar için okumuyordu (kontrol edildi) — kaldırma
güvenli.

🔴🔴 **`getWalkHistory()` ve `getWalkById()`'nin ikisi de `vet_advices` ile
AYNI KÖK NEDENE sahip bozuk bir PostgREST embed içeriyordu**
(`pet:pets(name, species, photo_url)` — `walk_sessions.pet_id` text tipinde,
`pets`'e gerçek bir FK constraint'i hiç yok). Sonuç: **yürüyüş geçmişi
özelliği projenin başından beri, hiçbir zaman gerçek veri göstermemişti** —
sorgu her seferinde PGRST200 ile tamamen başarısız oluyor, fonksiyon sessizce
boş dizi döndürüyordu. `/walk/history` sayfasının "hep mock veri gösteriyor"
görünmesinin gerçek sebebi budur — alan adı uyuşmazlığından ÖNCE gelen, çok
daha temel bir sorunmuş. İkisinden de embed kaldırıldı, artık gerçek veri
dönüyor.

🔴 **`ActivityContext.tsx`'teki `mapSessionToRecord`, var olmayan `route`/
`path` alan adlarını okuyordu** — gerçek DB kolonu `path_coordinates`.
Yukarıdaki sorgu hatası yüzünden hiç fark edilmemişti (zaten hep boş veri
geliyordu). Düzeltildi.

🔴 **Veri şekli uyuşmazlığı: `path_coordinates` DB'de gerçekte
`{lat, lng, timestamp}[]` olarak saklanıyor** (bkz. `updateWalkLocation`),
ama `WalkRecord.path`, `LiveMap`'in `path` prop'u ve canlı takip sırasındaki
bellek-içi hal HEP `[number, number][]` tuple bekliyor. Bu uyuşmazlık bugüne
kadar hiç ortaya çıkmamıştı çünkü yukarıdaki sorgu hataları yüzünden hiçbir
kod gerçek `path_coordinates`'i geri okuyup GERÇEKTEN tüketmemişti. İlk kez
bugün, Faz 10'da yeni geçmiş/detay sayfaları bunu gerçekten kullanmaya
çalışınca "object is not iterable" ile çöktü. **Düzeltme:**
`src/lib/utils.ts`'e paylaşılan bir `normalizePathToTuples()` eklendi (her
iki şekli de — tuple ve `{lat,lng}` objesi — kabul edip tuple'a çeviriyor),
tüm gerçek path tüketen yerlerde kullanılıyor.

**Küçük tutarlılık düzeltmesi:** adım sayısı hesaplaması üç farklı yerde üç
farklı katsayı kullanıyordu (`mapSessionToRecord`: 1.4, `getWalkStats`/
`getWalkHistory`/tracking sayfası: 1.3) — artık hepsi zaten hesaplanmış
gerçek değeri kullanıyor ya da 1.3'e sabitlendi.

**Yeni inşa edilen:** `/walk/history/[id]` — "Detay" ekranı daha önce HİÇ
yoktu (`getWalkById()` servis katmanında tanımlıydı ama hiçbir UI bileşeni
onu çağırmıyordu, tamamen orphan bir fonksiyondu). Artık gerçek GPS rotasını
gerçek `LiveMap` üzerinde (statik/geçmiş modda) gösteriyor.

**`/walk/history` listesinden kaldırılan sahte içerik:** `MOCK_HISTORY_WALKS`
(Freepik stok görselli sahte "harita" önizlemeleri), her kart için hardcoded
sahte SVG rota eğrisi (`M10,90 Q30,60...` — gerçek path'le hiç ilgisi yoktu),
ve işlevsiz "İstatistikler" sekmesi ("Detaylı grafikler hazırlanıyor..."
placeholder'ı, hiçbir zaman doldurulmamış). Sahte harita/SVG yerine artık her
kartın KENDİ gerçek `path` verisinden hesaplanan gerçek bir SVG çizgisi var
(rota yoksa nötr bir ikon — sahte görsel yok). "İstatistikler" sekmesi
kaldırıldı, yerine `/walk` sayfasına (zaten Faz 9'da gerçek istatistikleri
barındıran yer) giden gerçek bir kısayol kondu.

**Doğrulama:** gerçek SQL ile eklenmiş 4-noktalı gerçekçi bir rota içeren
test satırıyla hem liste (gerçek çizgi önizlemesi) hem detay (gerçek harita +
gerçek 1.25km/30dk/75kcal/1.625 adım istatistikleri) canlı doğrulandı, sonra
temizlendi. Ayrıca bugünün önceki fazlarından (ve daha önceki bir oturumdan)
kalma 12 adet test `walk_sessions` satırı bulunup temizlendi.

### 8.7 Faz 11 → ertelendi, Faz 12 — Rozetler (2026-09-23)

**Faz 11 (Meydan Okumalar) Faz 18'e ertelendi** — Baran'ın kararı, detay
8.0'da. Bulunan ama düzeltilmeyen hata: `MonthlyResearch`'ün 3 aşamalı zinciri
(`getMonthlyResearch()`) — `currentStageIndex` HİÇBİR YERDE ilerletilmiyor,
yani tüm sistem stage 0'da donmuş durumda, hiçbir aşama hiçbir zaman
tamamlanamaz/ilerleyemez. Bu, sadece "research_complete" rozetini değil,
TÜM aylık araştırma özelliğini etkisiz kılıyor. Faz 18'in kapsamına bırakıldı.

**Faz 12'de gerçek `BADGE_POOL`'daki (14 rozet) 3 rozetin KALICI OLARAK
KAZANILAMAZ olduğu bulundu ve 2'si düzeltildi:**
- 🔴 `photographer` ("10 post paylaş"): hiçbir `awardBadge()` çağrısı ona
  işaret etmiyordu. Ayrıca mevcut post sayaçları (`socialCountsRef`) GÜNLÜK
  sıfırlanıyor, 10 gibi bir ömür-boyu eşiği zaten hiç karşılayamazdı.
  **Düzeltildi**: yeni, hiç sıfırlanmayan bir `lifetimePostCountRef` +
  localStorage kalıcılığı eklendi, 10'a ulaşınca rozet veriliyor.
- 🔴 `pet_care_week` ("7 gün mama kaydı tut"): eşleşen görev şablonu
  (`pet_feed_week`) zaten vardı ama tamamlanması hiçbir rozete
  bağlanmamıştı. **Düzeltildi**: tek satırlık eksik bağlantı eklendi.
- 🔶 `research_complete`: yukarıdaki donmuş `MonthlyResearch` sistemine
  bağlı olduğu için düzeltilmedi, Faz 18'e bırakıldı. **Güncelleme
  (Faz 18, bkz. 8.12): `MonthlyResearch` düzeltildi, bu rozet artık
  gerçekten kazanılabiliyor.**

**Ek küçük düzeltme:** `birthday_walk` rozeti ("Pet doğum gününde yürü")
`walkData.isActive` kontrolü olmadan, sadece uygulama pet'in doğum gününde
açıldığında (hiç yürüyüş yapılmasa bile) veriliyordu — kendi açıklamasıyla
çelişiyordu. Artık gerçekten aktif bir yürüyüş sırasında olmayı gerektiriyor.

**Yeni inşa edilen:** `/walk/badges` — "Rozetlerim" ekranı daha önce hiç
yoktu (rozetler sadece genel `/quests` sayfasının içinde, diğer her şeyle
karışık gösteriliyordu). Gerçek 14 rozet + gerçek kazanılma durumu ile,
kategori sekmeleriyle (Tümü/Yürüyüş/Keşif/Sosyal/Özel — "Özel" =
`isHidden` rozetler, kilitliyken isim/açıklama göstermeden "???" ile).
`/walk` sayfasından gerçek bir kısayolla erişilebiliyor. Canlı Playwright
testiyle her sekmenin doğru filtrelediği doğrulandı (Özel: 5, Sosyal: 3).

### 8.8 Faz 13 — Sıralama (Leaderboard): önce yanlış lig sistemi kuruldu, sonra referans UI'ye göre düzeltildi (2026-09-23)

🔴 **Bu fazın ilk turu, referans görsel (bkz. Bölüm 11 ve
`design-reference/walk-final/`) o sırada kaybolmuş olduğu için YANLIŞ bir
yöne gitti.** İlk turda: `LeaderboardSection.tsx`'in eski hâli
`profiles.coin_balance` (PawCoin) kullanan, hiç sıfırlanmayan, rastgele
eşikli (`// --- MOCK LEAGUES ---`) sahte bir sistemdi. Baran'a kapsam
soruldu, "tam gerçek sistemi kur" dedi — bunun üzerine PP-tabanlı, pg_cron'lu,
terfi/düşmeli GERÇEK bir haftalık lig sistemi kuruldu (bronze/silver/gold/
diamond, `league_tier`/`league_weekly_score`/`league_week_start` kolonları,
`run_weekly_league_reset()` fonksiyonu, `weekly-league-reset` cron job'ı).

**Sonra Baran referans görseli tekrar gönderdi ve bunun kilitlenmesini istedi
— görsele bakınca "4. Sıralama Sayfası" ekranının bu lig sistemiyle YAPISAL
OLARAK hiç alakası olmadığı ortaya çıktı:** referans, kilometre bazlı düz bir
sıralama + zaman aralığı filtresi ("Bu Hafta"/"Bu Ay"/"Tüm Zamanlar") + sosyal
kapsam filtresi ("Herkes"/"Arkadaşlarım"/"Aynı Şehir") gösteriyor — lig/terfi/
düşme kavramı YOK. Baran'ın talimatı: "sıralamayı öncelikle görsele göre
ayarla ama gerekli olduğunda kendin ayarla" — yani referansa dönüldü.

**Geri alınanlar (hiç gerçek veri birikmemişti, kayıp yok):** `weekly-league-reset`
cron job'ı unschedule edildi, `run_weekly_league_reset()` silindi,
`award_pati_puan()` eski haline (league_weekly_score güncellemesi olmadan)
döndürüldü, `profiles.league_tier`/`league_weekly_score`/`league_week_start`
kolonları drop edildi.

**Kurulan gerçek sistem (referansa göre, sadece `role=user` için):**
- `get_distance_leaderboard(p_period, p_user_ids, p_limit)` — SECURITY
  DEFINER SQL fonksiyonu (`walk_sessions.status='completed'` satırlarını
  `end_time`'a göre hafta/ay/tüm-zamanlar filtresiyle `user_id`'ye göre
  gruplayıp toplam mesafe+yürüyüş sayısı döndürüyor). SECURITY DEFINER
  şart çünkü Faz 10'da `walk_sessions` RLS'i bilinçli olarak sadece
  kendi satırını okumaya kilitlenmişti — kullanıcılar-arası toplam mesafe
  RLS'i bypass eden dar kapsamlı bir fonksiyon gerektiriyor. Sadece
  `authenticated`'e EXECUTE verildi, ve SADECE toplam mesafe/sayı döner
  (hiçbir GPS rotası/path_coordinates dışarı sızmıyor — Faz 10'daki
  gizlilik disiplini korundu). Gerçek SQL ile test edildi.
- "Arkadaşlarım" filtresi: gerçek `follows` tablosu (`getFollowing()`,
  zaten var olan takip sistemi) — uydurma bir arkadaşlık kavramı değil.
- "Aynı Şehir" filtresi: `profiles.address` alanının (serbest metin) tam
  eşleşmesi — gerçek ama şu an hiçbir kullanıcı adres girmediği için
  dürüstçe boş/"profilinde konum bilgin olması gerekiyor" durumu gösteriyor,
  sahte şehir verisi üretilmedi.
- `LeaderboardSection.tsx` artık: "Sıralamalar" başlığı + gerçek arama
  (isme göre client-side filtre) + zaman filtresi (turuncu, dolu) + sosyal
  kapsam filtresi (koyu/siyah, dolu) + podyum (top 3, km) + liste (4-10) +
  kullanıcı ilk 10'da değilse (o aralıkta hiç yürümemiş olabilir) ayrı,
  turuncu vurgulu bir "Sen" satırı — referansın "12 Sen (Luna) 24,8 km" satırıyla
  aynı desen.
- Servis katmanı: `getDistanceLeaderboard()`, `getSameCityUserIds()`,
  `getProfilesByIds()` eklendi; `getLeagueRoster()`/`getMyLeagueStatus()`
  tamamen kaldırıldı (kısa ömürlü, hiç gerçek veriyle kullanılmamış kod).
  `getLeaderboard()`/`getUserRank()` (coin_balance bazlı) sadece İşletmeler
  sekmesi için hâlâ kullanılıyor — bkz. aşağıdaki kapsam notu.

**Bilinçli kapsam sınırı — İşletmeler sekmesi:** işletmelerin yürüyüş
modülüyle ilişkili bir "km" veya haftalık aktivite metriği yok, bu yüzden o
sekme hâlâ eski basit/filtresiz `coin_balance` sıralamasını kullanıyor —
referans görselde bu sekmenin ne göstermesi gerektiğine dair ayrı bir netlik
yok, mevcut hali korundu.

**Ayrıca bu turda bulunan, ilgisiz bir ölü kod:** `src/app/walk/competition/page.tsx`
— tamamen `// Mock Data` yorumlu, hardcoded sahte lig/leaderboard/işletme
verisiyle dolu, HİÇBİR YERDEN import/link edilmiyordu (URL'yi doğrudan
yazmadan ulaşılamıyordu). CareHubModal (Bölüm 7) ile aynı desen — silindi.

**Ders (bu oturumun en pahalı hatası):** UI-doğruluğu gerektiren bir işe,
referans görsel elde olmadan "mantıken doğru olanı inşa ederek" başlamak,
görsel geri geldiğinde tamamen atılması gereken gerçek (ama yanlış yöne)
altyapı üretebiliyor. `design-reference/walk-final/` klasörü artık kalıcı
olduğu için bu belirli hata bir daha olmamalı — ama genel ders: UI'ya sıkı
bağlı bir görev geliyorsa, önce referansın gerçekten elde/güncel olduğunu
doğrula, sonra inşa et.

### 8.9 Faz 14 — Ödül Marketi (2026-09-23)

Daha önce hiç yoktu, doğrudan referansın ("7. Ödül / Puan Marketi") karşılığı.

- Yeni `reward_products` tablosu (RLS: herkes aktif ürünleri görebilir, yazma
  yok — katalog şimdilik sadece SQL ile yönetiliyor, admin paneli yok).
  6 gerçek ürünle dolduruldu (Moffi Bandana, Mama Kabı, Moffi İsimlik, %10
  İndirim Kuponu, Moffi Sırt Çantası, Oyuncak Top) — referansta görülen 4 ürün
  + kesilmiş/görünmeyen 2 ürün için makul isim/fiyat verildi. Ürün fotoğrafı
  yerine bilerek emoji kullanıldı (sahte stok fotoğrafı üretmemek için).
  "Özel Deneyimler" kategorisi bilerek boş bırakıldı — bir "deneyim" ödülünü
  gerçek anlamda karşılayabilmek (randevu/rezervasyon entegrasyonu) için
  altyapı yok, uydurma bir deneyim ürünü eklenmedi.
- Satın alma (redemption) YENİ bir para birimi/RPC gerektirmedi — mevcut
  `award_pati_puan()` RPC'si negatif miktarla çağrılıyor (`source='redemption'`,
  `reference_id`=ürün id'si). Sunucu tarafı bakiye kontrolü zaten fonksiyonun
  içinde var. Gerçek Playwright testiyle uçtan uca doğrulandı: 500 PP'lik test
  bakiyesiyle "Moffi Bandana" (150p) satın alındı, bakiye 350'ye düştü, gerçek
  bir `point_transactions` satırı oluştu — sonra temizlendi.
- Yeni `/walk/rewards` ekranı: kategori sekmeleri, 2 sütunlu ürün grid'i,
  satın alma onay modalı, yetersiz bakiye durumunda dürüst engelleme (buton
  yerine "Yetersiz Moffi Puanı bakiyesi" mesajı).

🔴 **Bu fazda test ederken önemli, genelleştirilebilir bir altyapı hatası
bulundu ve düzeltildi — bkz. 8.10.**

### 8.10 KRİTİK TUZAK: Yeni bir tabloya RLS policy eklemek YETMİYOR, GRANT de gerekiyor

`reward_products` tablosunu ilk oluşturduğumda sadece bir RLS SELECT policy'si
ekledim (`using (is_active = true)`) ve gerçek Playwright testinde ürün listesi
SESSİZCE boş döndü (hata yok, sadece boş dizi). Kök neden: bu projenin `public`
şemasında **hiçbir "default privilege" tanımlı değil** (`pg_default_acl` boş).
Yani PostgREST'in kullandığı `anon`/`authenticated` rolüne, RLS policy'sinden
BAĞIMSIZ olarak, ayrıca `GRANT SELECT/INSERT ON <tablo>` verilmesi gerekiyor —
RLS satır bazlı filtreleme yapar, GRANT ise işlemi baştan (tablo seviyesinde)
açar; ikisi de gerekli, biri diğerinin yerine geçmiyor.

**Bunu nasıl fark ettim:** `execute_sql` ile SQL testleri her zaman `postgres`
(superuser) bağlamında çalışıyor — `set_config('request.jwt.claim.sub', ...)`
ile `auth.uid()`'i spoof etmek RLS policy mantığını test eder ama GRANT
kontrolünü hiç TETİKLEMEZ (superuser GRANT kısıtlamalarını zaten atlar). Yani
Faz 7/8'de "gerçek SQL ile test edildi" dediğim doğrulamalar RLS'i doğru test
etmişti ama GRANT eksikliğini YAKALAYAMAZDI — bu ancak gerçek tarayıcıdan
(anon-key/authenticated JWT ile) bir Playwright testiyle ortaya çıktı.

**Bulunca kontrol ettim, AYNI hata Faz 7/8'de oluşturulan `point_transactions`
ve `streak_shield_uses` tablolarında da vardı** (muhtemelen oradan beri hep
sessizce eksikti — `getPatiPuanHistory()` ve `getWalkStats()`'in
`streak_shield_uses` union kısmı gerçek istemciden hiç çalışmamış olabilir,
sessizce boş dönüyordu). Üçü için de düzeltme: `grant select on <tablo> to
authenticated;` (yazma zaten sadece SECURITY DEFINER fonksiyonlar üzerinden
oluyor — fonksiyon SAHİBİNİN yetkisiyle çalıştığı için çağıran role'e INSERT
grant'i hiç gerekmiyor, o yüzden sadece SELECT verildi).

**KURAL:** Bundan sonra yeni bir tablo oluştururken (RLS + policy'lerden
SONRA) mutlaka `grant select ...`/`grant insert ...` (ihtiyaca göre)
`authenticated`'e (gerektiğinde `anon`'a) verilmeli, VE gerçek doğrulama
`execute_sql` ile DEĞİL, ya gerçek bir Playwright oturumuyla ya da en azından
`information_schema.role_table_grants` sorgusuyla yapılmalı — sadece RLS
policy'sinin var olması yeterli değil.

### 8.11 Screen 8 (Profil – Yürüyüş İstatistikleri) — `RoutesTab.tsx` gerçek veriyle yeniden inşa edildi (2026-09-23)

Faz 9'da "kapsam dışı, sahte, dokunulmadı" diye not edilmişti; referans görsel
geri gelince bunun aslında referansın 8. ekranının ("Profil – Yürüyüş
İstatistikleri") doğrudan karşılığı olduğu anlaşıldı — artık kapsamda.

**Önceki hâli tamamen sahteydi:** hardcoded "12.4 km"/"8.2 saat" sabitleri +
3 uydurma rota (`mockHistory`) + işlevsiz "Buluta Yedekle" butonu (dead
button). Besleyen `routes` prop'u (`PetContext.walkRoutes`) hiçbir yerden
doldurulmuyordu (bkz. Bölüm 7) — yani gerçek veriyle ASLA çalışamazdı.

**Önce ölü kod temizliği yapıldı** (bkz. Bölüm 7): `RoutesTab.tsx`'in 3
kullanım noktasından ikisi (`community/ProfileTab.tsx`, `profile/ProfileTabs.tsx`
+ onun tek tüketicisi `profile/test/page.tsx`) tamamen orphan çıktı, silindi.
Geriye tek gerçek, ulaşılabilir kullanım kaldı: `/profile/[id]/page.tsx`
(zaten `isOwnProfile` ile korunuyor — RLS'in başka kullanıcının yürüyüş
verisini göstermesine izin vermediği Faz 10 kısıtlamasıyla tutarlı).

**Yeniden inşa:** `RoutesTab.tsx` artık `ActivityContext.walkHistory`'den
(gerçek, Faz 10'da düzeltilen `walk_sessions` verisi) bu ayın istatistiklerini
hesaplıyor — toplam mesafe/yürüyüş sayısı/süre/ortalama adım (2×2 grid),
haftalık (1-5. hafta) km bar grafiği, en aktif gün. `routes` prop'u tamamen
kaldırıldı (artık anlamsızdı). Ayrıca `ActivityContext`'teki `getWalkHistory()`
çağrısının limiti 10'dan 60'a çıkarıldı — 10, aylık toplamlar için günde 1
yürüyüş yapan biri için bile yetersiz kalıyordu (~10 gün).

**Doğrulama:** gerçek Playwright testiyle (`/profile/<gerçek-uuid>?view=routes`)
canlı doğrulandı — bu ayki 4 gerçek `walk_sessions` satırı doğru şekilde
"4 Yürüyüş" olarak sayıldı, süre toplamı doğru hesaplandı, haftalık grafik
render edildi. (Not: `/profile/me` route'u — literal "me" string'i — ayrı,
önceden var olan bir hata yüzünden sonsuza kadar "Profil Yükleniyor"da
takılı kalıyor; gerçek uygulama hiçbir yerden bu URL'i kullanmıyor, hep
`/profile/${user.id}` ile gerçek UUID kullanıyor, bu yüzden düzeltilmedi —
kapsam dışı, ayrı bir pre-existing bug.)

### 8.12 Faz 18 — Görev sistemi denetimi + gerçek Meydan Okumalar (2026-09-23)

Baran'ın "hataları gider, Faz 18'i de kapat" talimatıyla yapıldı.

**Önce gerçek hatalar giderildi** (walk modülüne bitişik dosyalarda tsc'nin
işaret ettiği, önceki fazlarda "pre-existing, dokunulmadı" diye bırakılan
hatalar):
- `src/app/profile/[id]/page.tsx`: `handleFollowToggle`/`handleMessageClick`
  içinde `showToast("Giriş Gerekli", "...", "User")` şeklinde YANLIŞ 3-argümanlı
  çağrılar vardı (`showToast` gerçekte `(message, icon, color)` alıyor) — bu
  yüzden kullanıcı sadece "Giriş Gerekli" görüyordu, asıl açıklayıcı mesaj
  hiç gösterilmiyordu. Doğru 2-argümanlı forma çevrildi.
- Aynı dosyada `'Check'` ikonuyla iki `showToast` çağrısı vardı — `GlobalToast.
  tsx`'in `IconMap`'inde `'Check'` yok (sadece `'CheckCircle2'` var), yani
  sessizce yanlış ikona (Bell) düşüyordu. `'CheckCircle2'`'ye düzeltildi.
- `showToast()`'un TypeScript tipi çok dardı (6 ikon), `GlobalToast.tsx`'in
  gerçekte desteklediği ~13 ikonu (`ShieldAlert`, `AlertCircle` dahil)
  kapsamıyordu — tip genişletildi, gerçek desteklenen ikonlarla eşleşiyor.
- 🔴 **Gerçek bir runtime hatası:** `handleNavigate` (moffi-navigate event
  dinleyicisi) tanımsız bir `dest` değişkenine erişiyordu (`ReferenceError`) —
  uygulamanın HERHANGİ bir yerinde bir `moffi-navigate` event'i fırlatıldığında
  (çok sık oluyor: sidebar, alt nav, post kartları), `/profile/[id]` sayfası
  açıkken konsola sessiz bir hata düşüyordu. Kök neden araştırılınca bu
  handler'ın besleyeceği `activeSubView` state'inin PROJENİN HİÇBİR YERİNDE
  okunmadığı (tamamen ölü) bulundu — muhtemelen bu oturumda silinen
  `community/ProfileTab.tsx`'in (bkz. Bölüm 7) eski bir entegrasyon kalıntısı.
  Sadece `dest`'i tanımlamak yerine, tüm ölü `activeSubView` state'i + onu
  besleyen 2 ölü effect silindi (band-aid değil kök çözüm).
- `ActivityContext.tsx`: 3 adet `useRef<NodeJS.Timeout | null>` tipi, tarayıcı
  bağlamında (`window.setInterval`) `@types/node`'un global `Timeout` tipiyle
  çakışıp yanlış tip hatası veriyordu — `ReturnType<typeof setInterval>` ile
  değiştirildi (davranış aynı, sadece doğru tipleniyor).
- `GlobalToast.tsx`'e eksik `Award`/`Gift` ikonları eklendi — rozet kazanma
  toast'ı (`awardBadge`) ve yeni Ödül Marketi redemption toast'ı bu ikonları
  kullanıyordu ama `IconMap`'te yoktu, sessizce Bell'e düşüyordu.
- `LiveMap.tsx`'te de birkaç pre-existing tip hatası (mock `PLACES` verisiyle
  ilgili `'veteriner'` karşılaştırması, bir `routeTo` prop eksikliği) var —
  bunlara BİLEREK dokunulmadı, çünkü bunlar Bölüm 8.1'de Baran'ın açıkça
  "sistemin diğer parçalarını etkilemesin" dediği, 4 farklı ekranda paylaşılan
  sahte POI/hazine-avı sisteminin bir parçası. İstenirse ayrı, dikkatli bir
  incelemeyle ele alınabilir.

**Sonra Faz 18/11 kapatıldı — `MonthlyResearch` (Aylık Araştırma) donuk
ilerleme bug'ı düzeltildi:** `setMonthlyResearch` daha önce SADECE ilk
yüklemede çağrılıyordu, hiçbir gerçek sinyal (yürüyüş/post/seri) `currentStageIndex`'i
veya `stages[].tasks[].current`'ı hiç güncellemiyordu — tüm sistem stage 0'da
sonsuza kadar donuktu (Faz 11'de bulunmuş ama düzeltilmemişti). Yeni
`updateMonthlyResearchProgress()`, `updateQuestProgress()` (günlük görevler)
ile AYNI gerçek sinyalleri (`walkData`, `walkStats`, `lifetimePostCountRef`)
kullanarak aktif aşamanın görevlerini ilerletiyor; bir aşamanın tüm görevleri
tamamlanınca ödül+rozet veriliyor ve `currentStageIndex` bir sonrakine
geçiyor, son aşama bitince `completedAt` set ediliyor (→ `research_complete`
rozeti artık gerçekten kazanılabilir). `t2_1` ("2 farklı rotada yürü") için
gerçek bir "farklı rota" sayacı yok diye asla ilerlemiyordu — artık
`walkHistory`'deki gerçek GPS başlangıç noktalarını basit bir haversine
kümelemesiyle (>300m ayrı = farklı rota) sayıyor.

**Gerçek "Meydan Okumalar" ekranı (`/walk/challenges`) inşa edildi:**
Faz 11'de referans görsel elde değilken ertelenmişti ("gerçek coğrafi
kümeleme altyapısı gerektiriyor, yok" diye not edilmişti) — görsel geri
gelince referansın 3 kartının da (aylık toplam mesafe / haftalık farklı
yer / kalıcı farklı bölge) TAM bir POI/bölge veritabanı olmadan, aynı basit
haversine kümeleme tekniğiyle (iki farklı yarıçapla: "farklı yer" için 300m,
"farklı bölge" için 2km) gerçek `walkHistory` verisinden hesaplanabildiği
görüldü. Kalıcı bir "meydan okuma tamamlandı" state'i TUTULMUYOR — her
render'da gerçek veriden yeniden türetiliyor (basit, senkron kaybı riski yok).
3 yeni gerçek rozet eklendi (`monthly_explorer`, `park_hopper`,
`region_explorer`), hedefe ulaşınca `awardBadge` (zaten idempotent) ile
otomatik veriliyor. "Yaklaşan" sekmesi BİLEREK boş bırakıldı — gerçek bir
gelecek-meydan-okuma kuyruğu/planlama sistemi yok, uydurma bir "yakında"
kartı eklenmedi.

**Bilerek yapılmayan (Faz 18'in orijinal, daha geniş kapsamının bir parçası
olabilirdi ama ayrı, büyük bir iş):** görev/rozet/meydan okuma tamamlanması
hâlâ %100 istemci tarafında hesaplanıyor (Faz 7'de belgelenen, PawCoin'deki
gibi ciddi olmayan ama teorik bir client-trust açığı) — sunucu tarafında
gerçek doğrulama (örn. bir RPC'nin `walk_sessions`'tan bağımsızca tekrar
hesaplaması) bu fazın kapsamına alınmadı, ayrı bir güvenlik sertleştirme
işi olarak bırakıldı.

**Doğrulama:** typecheck temiz, gerçek Playwright testiyle `/walk/challenges`
(3 kart, gerçek "0.0/100 km" / "0/5 yer" / "0/10 bölge" — test hesabının
gerçek ama mesafesiz/rotasız yürüyüşleri olduğu için hepsi 0) ve `/walk/badges`
(rozet sayısı 14'ten 17'ye çıktı, doğru) canlı doğrulandı.

### 8.13 Yürüyüş modülü genel "hissiyat/premium" cila turu (2026-09-23)

Baran'ın isteği: ana sayfadaki yürüyüş kartından açılan tüm panellerin
UI'sini, geçiş akıcılığını, genel bütünlüğü, zenginliği, profesyonelliği,
güven vericiliği ve kullanıcı metinlerinin tonunu baştan sona gözden geçir
("beni şaşırt", karar tamamen bana bırakıldı). Kapsam: WalkQuickSheet →
tracking → summary → hub (`/walk`) → badges/rewards/challenges/history →
`RoutesTab`/`LeaderboardSection`. Yapılanlar:

- **Gerçek route-transition sistemi (proje genelinde ilk kez):** `src/app/
  walk/template.tsx` eklendi — Next.js'in her navigasyonda yeniden mount
  olan `template.tsx` mekanizmasıyla, `/walk/*` altındaki HER sayfa geçişine
  tutarlı, yumuşak bir giriş animasyonu (fade+slide) veriyor. Önceden bu
  projede HİÇ route-transition altyapısı yoktu (sadece modal/sheet'lerin
  kendi lokal `AnimatePresence`'ı vardı) — hub→takip→sonuç→rozet/ödül/meydan
  okuma arasında sert, animasyonsuz sayfa değişimleri oluyordu.
- **Gerçek haptic geri bildirim** (`src/lib/haptics.ts`): yeni kütüphane
  eklemeden `navigator.vibrate`'i saran minimal bir katman (`tap`/`success`/
  `celebrate`/`warn`). Sadece destekleyen gerçek mobil tarayıcılarda
  hissediliyor, desteklenmeyen ortamlarda (iOS Safari, masaüstü) sessizce
  no-op. Yürüyüş başlatma/bitirme, duraklat/devam, checklist, sekme
  geçişleri, ödül satın alma gibi ana etkileşim noktalarına bağlandı.
- **Gerçek kutlama anı:** özet ekranında daha önce sadece framer-motion ile
  elle çizilen sönük bir parçacık efekti vardı — `package.json`'da zaten
  kurulu ama HİÇ kullanılmayan `canvas-confetti` devreye sokuldu. Rozet
  kazanıldıysa büyük, sadece PP/seri kazanıldıysa küçük bir confetti
  patlaması + uygun haptic. Canlı Playwright testiyle gerçek confetti'nin
  render edildiği doğrulandı.
- **`/walk` hub'ı → gerçek "Kontrol Merkezi":** Rozetlerim/Ödül Marketi/
  Meydan Okumalar kısayolları önceden düz, önizlemesiz butonlardı. Artık
  her biri `QuestEngineContext`'ten GERÇEK, canlı bir sayı gösteriyor
  (uydurma önizleme değil): "12/17" kazanılan rozet, "🐾 340" gerçek PP
  bakiyesi, "1/3" tamamlanan meydan okuma. Aynı context zaten bu verileri
  tutuyordu, sadece hiç yüzeye çıkarılmamıştı.
- **Ödül Marketi satın alma modalı:** sert bir pop yerine gerçek spring
  animasyonlu `AnimatePresence` girişi/çıkışı + satın alma sonrası anlık
  kapanma yerine kısa bir "✓ Harika, alındı!" başarı durumu (900ms) eklendi.
- **Mikro-etkileşim tutarlılığı:** hub, rozetler, ödül marketi, meydan
  okumalar, geçmiş listesi ve `RoutesTab` gibi tamamen statik (framer-motion
  hiç kullanmayan) ekranlara gerçek `whileTap` spring geri bildirimi ve
  liste öğelerinde kademeli (staggered) giriş animasyonu eklendi — önceden
  sadece WalkQuickSheet/tracking/summary'nin KONTEYNER seviyesinde hafif
  hareket vardı, içindeki çoğu buton salt CSS `active:scale-95`
  kullanıyordu.
- **🔴 Ayrıca bulunan gerçek bir renk hatası:** `/walk/history` sayfasındaki
  rota önizleme SVG'sinde çizgi rengi hâlâ hardcoded indigo hex kodu
  (`#6366F1`) idi — Faz 13'teki genel renk taramasında bu satır atlanmıştı
  çünkü tarama "indigo"/"purple" kelimesini arıyordu, ham hex kodunu
  yakalamamıştı. `#F97316` (turuncu) ile değiştirildi. **Ders:** renk
  taraması yaparken sadece Tailwind sınıf adlarını değil, ham hex/RGB
  değerlerini de aramak gerekiyor.
- **Metin tonu geçişi:** boş durum, hata ve teşvik metinleri (ödül
  yetersiz bakiye, boş sıralama/geçmiş/meydan okuma listeleri, yürüyüş
  bitirme onayı) daha yumuşak, nazik bir dile çevrildi (örn. "Yetersiz
  Moffi Puanı bakiyesi." → "Bu ödül için birkaç Moffi Puanına daha ihtiyacın
  var — yürümeye devam, yakında burada olacaksın! 🐾"). İşlevsel istatistik
  etiketleri (Toplam Mesafe, Süre vb.) BİLEREK sade/profesyonel bırakıldı —
  her yere emoji eklemek "premium" değil amatör görünürdü, sıcaklık sadece
  kullanıcının cesaretinin kırılabileceği noktalara (boş/hata durumları)
  eklendi.
- **Bilerek yapılmayan:** `LiveMap.tsx`'in geri kalan hataları (mock POI
  sistemi) yine dokunulmadı, aynı gerekçeyle (Bölüm 8.1/8.12).

**Doğrulama:** typecheck temiz (sadece önceden bilinen LiveMap hataları
kaldı), gerçek Playwright testiyle hub'daki canlı sayılar, ödül modalının
spring animasyonu ve yumuşatılmış metni, meydan okumalar ekranındaki
animasyonlu ilerleme çubukları ve özet ekranındaki gerçek confetti patlaması
görsel olarak doğrulandı.

### 8.14 `/walk` hub'ında bulunan gerçek netlik/tutarlılık hataları (2026-09-23)

Baran'ın "Yürüyüş İstatistikleri kısmında herşey net mi, kullanıcı neye
baktığını biliyor mu?" sorusu üzerine yapılan inceleme — sadece kozmetik
değil, gerçek veri tutarsızlığı bulundu:

🔴 **"Bugünkü Hedef" kartları (Mesafe/Süre) iki farklı zaman dilimini
karıştırıyordu:** Mesafe kartı, bir yürüyüş aktifken CANLI o yürüyüşün
mesafesini, aktif değilken ise TÜM ZAMANLARIN toplamını (`walkStats.
totalDistanceKm`) gösteriyordu — ama ilerleme çubuğu her iki durumda da
sadece aktif yürüyüşün canlı değerinden hesaplanıyordu. Sonuç: yürüyüş aktif
değilken ekranda "42,3 / 2km" gibi anlamsız bir sayı yazarken, ilerleme
çubuğu boş (%0) kalıyordu — kullanıcı "bu sayı neyi ifade ediyor, neden
çubuk boş?" diye haklı olarak kafası karışabilirdi. Süre kartı ise HİÇ
dallanmıyordu, yürüyüş aktif değilken hep "0/25dk" gösteriyordu. İkisi de
gerçek "bugün ne kadar yürüdün" bilgisini YANSITMIYORDU.
**Kök neden düzeltmesi:** `QuestEngineContext`'e gerçek `todayDistanceKm`/
`todayDurationMin` eklendi — bugün tamamlanmış yürüyüşlerin (walkHistory'den,
yerel takvim gününe göre filtrelenmiş) toplamı + varsa şu an aktif yürüyüşün
canlı değeri. `progressPercent`/`durationPercent` da AYNI bu değerlerden
hesaplanıyor artık — büyük sayı ile ilerleme çubuğu birbirini tutuyor, ikisi
de gerçekten "bugün" anlamına geliyor. Kart başlığına da net "Bugünkü Hedef"
etiketi eklendi (önceden hiç üst başlık yoktu).
- Bu değişiklik `progressPercent`/`durationPercent`'in TEK tüketicisinin
  `/walk` hub'ı olduğu doğrulandıktan sonra yapıldı (WalkQuickSheet kendi
  canlı ilerlemesini ayrı, lokal olarak hesaplıyor — ona dokunulmadı, o
  zaten doğru şekilde "şu anki yürüyüşün ilerlemesi" anlamına geliyor).

🔴 **"Son 7 Gün" kartı iki farklı zaman dilimini ETİKETSİZ karıştırıyordu:**
kartın üstündeki bar grafiği gerçekten son 7 güne aitti (doğruydu), ama
hemen altındaki "Toplam / En Uzun / En İyi Seri" satırı `walkStats`'ten
(TÜM ZAMANLARIN verisi) geliyordu — aynı kartın içinde, herhangi bir ayırıcı
etiket olmadan. Kullanıcı bu 3 sayının da "son 7 gün"e ait olduğunu
düşünebilirdi. **Düzeltme:** o satırın üstüne net bir "Tüm Zamanlar" etiketi
+ görsel ayırıcı eklendi.

🟡 **Hava durumu iki kez, aynı bilgiyle gösteriliyordu:** büyük 3D "sphere"
kartı (sıcaklık+durum) ile hemen altındaki düz banner (sıcaklık+durum+
uygunluk skoru) art arda AYNI veriyi iki farklı görselde tekrar ediyordu.
**Düzeltme:** tek bir hava durumu modülüne birleştirildi — sphere kartının
üstünde sıcaklık/durum, altında (yeni eklenen) uygunluk skoru + "hissedilen"
sıcaklığı gösteren bir overlay. Hava verisi henüz gelmediyse/hata varsa
sadeleştirilmiş düz bir yer tutucu gösteriliyor (sphere hiç render olmadığı
için tekrar riski yok).

🟡 **"Dostum" kartı sayfanın amacına hizmet etmiyordu:** sadece pet
fotoğrafı+ırkı gösteriyordu — bu bilgi zaten header'daki `PetSwitcher`'da
var, bir "yürüyüş istatistikleri" sayfasında tekrarının bir anlamı yoktu.
**Düzeltme:** ırk yerine gerçek, walk-özelinde bir durum gösteriyor artık
("Bugün seninle yürüdü" / "Son yürüyüş: 3 gün önce" / "Henüz birlikte
yürüyüşe çıkmadınız" / aktif yürüyüş varsa "Şu an seninle yürüyor 🐾") -
`walkHistory`'den hesaplanan gerçek bir değer.

**Doğrulama:** typecheck temiz, gerçek Playwright testiyle canlı doğrulandı -
"Bugünkü Hedef" artık "0.0/2km %0" gibi TUTARLI (sayı ve çubuk birbirini
destekliyor) bir durum gösteriyor, "Tüm Zamanlar" etiketi görünür, hava
durumu tek modülde, "Dostum" kartı "BUGÜN SENİNLE YÜRÜDÜ" gösteriyor.

### 8.15 Ölü kod temizliği + 6 yeni özellik: sürüklenebilir panel, adım önceliği, ana sayfa senkronu, gerçek ayarlar, arka plan widget'ı, müzik kararı (2026-09-24)

Baran'ın audit turundan sonraki talimatı: "ölü kodları silelim" + 6 madde
(bkz. bu oturumun tam talebi). Kumanda tamamen Baran tarafından bırakıldı
("kumanda sende, sana güveniyorum, şaşırt beni").

**Ölü kod temizliği:** `community/page.tsx`'teki duplicate `WalkQuickSheet`
(hiçbir yerden tetiklenmeyen `open-walk-sheet` event'ine bağlıydı) +
`OverlaySystem.tsx`'teki karşılık gelen pass-through prop'lar,
`LiveMap.tsx`'teki tamamen ölü "topluluk işareti oluşturma" alt sistemi
(`MOCK_MARKS`, `createMarkIcon`, `MarkCreationModal` — `setIsMarkModalOpen`
hiçbir yerden çağrılmıyordu), `WalkQuickSheet.tsx`'teki erişilemez
`WeatherDetailSheet` (tetikleyici buton daha önceki bir fazda kaldırılmış,
bileşen unutulmuştu). Hepsi grep ile "gerçekten sıfır çağrı noktası" doğrulanıp
silindi.

🔴 **Gerçek bir Framer Motion kütüphane hatası bulundu ve atlatıldı:**
sürüklenebilir gösterge paneli (3 durak: kısaltılmış/varsayılan/tam ekran)
ilk yapıldığında resmi/önerilen "`useDragControls()` + `dragListener={false}`
+ tutamacın `onPointerDown`'ında `dragControls.start(e)`" deseni kullanıldı.
Canlı Playwright testinde (yavaş, 20+ adımlı gerçekçi sürükleme dahil) İLK
sürükleme jesti kusursuz çalışıyor, ama İKİNCİ ve sonraki HER jest (yön
farketmeksizin) tamamen tepkisiz kalıyordu — framer/motion GitHub'ında bilinen
(#712, #525), versiyondan bağımsız bir "dragControls tekrar-jest" sorunu.
**Çözüm:** deseni terk edip sürüklemeyi doğrudan panelin kendi üzerinde
dinlemeye (varsayılan `dragListener`) geçildi; panel içeriği (istatistik/
buton alanı) kendi `onPointerDown`'ında `stopPropagation()` çağırarak
sürüklemeyi kendi alanından izole ediyor — SADECE tutamaç bu izolasyonun
dışında olduğu için sürüklemeyi başlatabiliyor. Aynı "yanlış dokunmalara karşı
hassasiyet" hedefine ulaşan ama gerçekte tekrar tekrar çalışan bir yöntem.

🔴 **İkinci gerçek hata (aynı özelliğin test turunda bulundu):** panel tam
ekran ('full') durumundayken üstteki harita kontrolleri (header z-[60],
durum rozetleri z-[55]) panelin tutamacının TAM ÜSTÜNE biniyordu — kullanıcı
paneli tam ekrana çektikten sonra BİR DAHA ASLA geri çekemiyordu (tutamaca
dokunuş, altındaki değil üstteki görünmez katmana gidiyordu). Playwright'ta
`onDragStart`'ın ikinci jestte hiç tetiklenmediği kanıtlanınca kök neden
bulundu. **Düzeltme:** header/durum rozetleri/uyarı bandı artık `sheetState
==='full'` olduğunda `opacity-0 pointer-events-none` (kök neden çözümü —
zaten o durumda gösterecek bir harita da yok).

**Adım sayısı önceliklendirmesi:** piyasa araştırması bulgusu — km her zaman
birincildi, adım sayısı hiç yoktu. Artık `steps = Math.round(distance*1.3)`
(uygulamanın her yerinde zaten kullanılan aynı dürüst tahmin formülü) büyük,
birincil gösterge; km ikincil küçük bir satıra indi (aktif + duraklatılmış
görünüm + bitirme onayı modalının 3'lü istatistik grid'i, hepsi tutarlı).

🔴 **Ana sayfa senkron sorunu — İKİ ayrı gerçek hata bulundu:**
1. `walkData`'da (ve dolayısıyla `useWalk()`'ın `activeSession`'ında) hangi
   PET'in yürüyüşte olduğu HİÇ tutulmuyordu — "Yürüyüş Radarı" kartı sadece
   PetSwitcher'da o an seçili pet'in adını (`pet.name`) gösteriyordu. Zeytin
   yürüyüşteyken kullanıcı switcher'dan başka bir pet'e geçerse, kart YANLIŞ
   pet'i "yürüyor" gösterirdi. **Düzeltme:** `WalkData`'ya `petId`/`petName`
   eklendi, `startWalk()` anında `activePet`'ten yakalanıp localStorage'a da
   persist ediliyor (recoverable walk dahil); `home/page.tsx` artık
   `activeSession.petName`'i kullanıyor, switcher'daki seçimden bağımsız.
2. `walkedDistanceToday` (ana "Bugünkü Yürüyüş" kartının BÜYÜK km sayısı,
   ilerleme çubuğu, kalan-km, tahmini kalori) İKİ KÖK NEDENLE HER ZAMAN 0
   dönüyordu: `WalkRecord`'da hiç var olmayan `w.created_at` alanına göre
   filtreleniyordu (gerçek alan `started_at`/`ended_at`) VE aktif yürüyüşün
   canlı mesafesi `activeSession.distance_meters` diye okunuyordu ama
   `useWalk()` sadece `distanceKm` döndürüyor. Kullanıcı ne kadar yürürse
   yürüsün kart hep "0.0 km" gösteriyordu. **Düzeltme:** ayrı/bozuk hesabı
   silip `QuestEngineContext.todayDistanceKm`'e (Bölüm 8.14'te zaten doğru
   kurulmuş, aynı işi yapan tek gerçek kaynak) bağlanıldı — CareHubModal
   dersinin (Bölüm 7) bir tekrarı: paralel, birbirinden habersiz iki hesap
   yerine tek doğru kaynak. Ayrıca bu turda `home/page.tsx`'te tamamen ölü
   `handleStartWalk`/`handleEndWalk` (hiç çağrılmıyordu, kendi içinde de
   `distance_meters`/`void` tip hataları vardı) ve onların besleyip hiç
   render edilmeyen `transactions` state'i + `addTransaction` silindi.

**Gerçek ayarlar paneli:** dişli ikonu önceden sadece Wake Lock'u açıp
kapatıyordu ama "Ayarlar" gibi görünüyordu (mislabeled). Artık gerçek bir
panel: Ekranı Açık Tut, Sesli Geri Bildirim, **Otomatik Duraklatma** (yeni —
`ActivityContext`'e `autoPauseEnabled`/`setAutoPauseEnabled`, localStorage
persist, daha önce hep zorla açıktı), ve **Müzik** (aşağıya bkz.).

**Arka planda takip + mini widget:** `ActivityContext`'in GPS/zamanlayıcı
efekti zaten SADECE `walkData.isActive/isPaused/isAutoPaused`'a bağlıydı
(route'tan bağımsız) — Playwright ile doğrulandı: kullanıcı `/walk/tracking`'
den `/home`'a client-side navigasyonla dönünce süre saymaya devam ediyor.
Eksik olan sadece bunu GÖSTEREN bir şeydi. Yeni `ActiveWalkMiniWidget.tsx`
(`DynamicNavigation.tsx`'e eklendi, zaten `/walk/tracking`/`/walk/summary`'de
gizli olan `HIDDEN_ROUTES` listesi sayesinde oralarda otomatik gizli) —
aktif yürüyüş varken HERHANGİ bir sayfanın üstünde küçük bir "🐾 {pet adı} ·
süre · km" çubuğu, dokununca `/walk/tracking`'e dönüyor. **Dürüst sınır**
(koda da yorum olarak yazıldı): bu SADECE uygulama-içi gezinmeyi kapsıyor —
gerçek OS-seviyesi arka plan takibi (ekran kapalı/uygulama değiştirilmiş) bir
web uygulamasında mümkün değil, bu asla iddia edilmedi.

**Müzik kararı — bilinçli olarak ELENDİ, Baran'ın açık izniyle:** uygulama
içinde gerçekten müzik ÇALAN bir oynatıcı (Spotify/Apple Music parçalarını
gerçekten seslendirmek) resmi platform API'si + ticari telif anlaşması
gerektirir — bu, kodla aşılabilecek bir engel değil. Alternatif olarak
MediaSession API de değerlendirildi ama bu SADECE zaten aktif olan bir OS
medya oturumuyla göstergesel etkileşim kurabiliyor, harici bir uygulamayı
uzaktan BAŞLATAMIYOR/kontrol edemiyor. Tam özellik yerine dürüst, sıfır
maliyetli bir orta yol kondu: ayarlar panelinde "Müzik → Aç" satırı, sadece
kullanıcının kendi Spotify'ını yeni sekmede açıyor — uygulama içinde
"çalıyormuş gibi" sahte bir oynatıcı GÖSTERİLMEDİ.

**Doğrulama:** her madde ayrı ayrı gerçek Playwright testleriyle (gerçek
hesap, gerçek pet'ler, gerçek `walk_sessions` satırları — sonra temizlendi)
doğrulandı; typecheck her adımdan sonra kontrol edildi, hiçbir yeni hata
eklenmedi (sadece `home/page.tsx`'te 2 GERÇEK önceden var olan hata
düzeltildi: `created_at`/`distance_meters` tip hataları).

### 8.16 EN KRİTİK BULUNAN HATA: WalkQuickSheet'in kendi "aktif yürüyüş" görünümü haritayı tamamen erişilemez kılıyordu (2026-09-24)

Baran'ın 8.15'in hemen ardından fark ettiği, bu oturumun en önemli bulgusu.
Belirtiler: "Yürüyüşe Başla"ya basınca kısa bir an "Moffi ile Yürüyüş" yazan
büyük-km ekranı görünüp haritaya geçiyordu; ama kullanıcı bir kez haritadan
(`/walk/tracking`) ayrılıp (geri tuşu, ana sayfa) sonra "Devam Et"/"Takibi Gör"
gibi bir yolla yürüyüş paneline tekrar dönmeye çalışınca **bir daha asla
haritaya ulaşamıyordu** — hep aynı büyük-km ekranında (Duraklat/Bitir
butonlarıyla) takılı kalıyordu.

**Kök neden:** `WalkQuickSheet.tsx`'in kendi, TAMAMEN AYRI bir "aktif yürüyüş"
görünümü vardı (Apple Fitness tarzı dev km rakamı, tempo/hız grid'i, kendi
Duraklat/Bitir/Bitirme-Onayı modalı — muhtemelen `/walk/tracking` sayfası inşa
edilmeden ÖNCEki bir fazdan kalma). `DynamicNavigation.tsx`'teki
`open-walk-panel` event handler'ı (ana sayfadaki "Devam Et"/"Takibi Gör"
butonları dahil HER tetikleyici) yürüyüş zaten aktif olsa bile HER ZAMAN bu
paneli açıyordu — ve o panelin aktif görünümünde haritaya (`/walk/tracking`)
dönecek HİÇBİR buton/link yoktu (sadece Duraklat/Bitir vardı). Tam olarak
CLAUDE.md Bölüm 7'nin tarif ettiği "iki paralel, birbirinden habersiz sistem"
deseni — ve bu kez kullanıcıyı gerçek özelliğin (haritalı takip) tamamen
DIŞINDA bırakıyordu.

**Düzeltme (iki parça):**
1. `DynamicNavigation.tsx`: `handleOpenWalk` artık önce `walkData.isActive`'i
   kontrol ediyor — aktifse paneli hiç açmadan doğrudan `router.push('/walk/
   tracking')` yapıyor. `WalkQuickSheet` artık SADECE "henüz başlamamış"
   hazırlık akışı (+ "devam eden yürüyüş bulundu" recovery ekranı) için
   kullanılıyor.
2. `WalkQuickSheet.tsx`: kendi aktif-görünümü (büyük km, Duraklat/Bitir, ayrı
   bir Bitirme Onayı modalı, `handleStopWalk`, `pauseWalk`/`resumeWalk`
   kullanımı) TAMAMEN silindi — artık ulaşılamaz olduğu için kod tekrarı
   olarak durmasının anlamı yoktu (zaten tam teşekküllü hâli `/walk/
   tracking`'de var). Bu ayrıca "Yürüyüşe Başla"ya basınca yaşanan kısa
   ekran-değişimi "flash"ını da ortadan kaldırdı — artık `startWalk()`
   sırasında panel içeriğinde HİÇBİR değişiklik olmuyor (zaten sadece
   hazırlık görünümü var), `router.push` tamamlanana kadar aynı ekran
   sabit kalıyor.

**Doğrulama:** Playwright ile tam senaryo — yürüyüş başlat → haritaya git →
geri dön (ana sayfa) → "open-walk-panel" tekrar tetiklendi (ana sayfadaki
gerçek buton akışıyla aynı) → doğrudan `/walk/tracking`'e gidildiği, eski
panelin hiç açılmadığı ve gerçek Leaflet haritasının (`.leaflet-container`)
göründüğü doğrulandı.

**Aynı turda ayrıca yapılanlar:**
- **Ayarlar panelindeki toggle hizası düzeltildi:** `absolute top-0.5` ile
  hiç `left` belirtilmeden sadece `translate-x-0.5`/`translate-x-5`
  kullanılıyordu — tarayıcı varsayılan konumu tutarsız kaldığı için iki durum
  arasında simetrik olmayan bir kayma vardı. `left-0.5` taban + `translate-x-0`/
  `translate-x-5` olarak düzeltildi (artık iki kenarda da eşit 2px boşluk).
- **Tutamacı tam ekrana çekmenin gerçek bir amacı yoktu** (sadece aynı
  içerik büyüyordu) — artık `sheetState==='full'`'da gerçek EK veri
  gösteriliyor: "Kilometre Analizi" (zaten Faz 7'den beri tutulan ama sadece
  tek bir rozet olarak yüzeye çıkan `walkData.splits` — artık km-km liste
  halinde, en hızlısı ⚡ ile işaretli) + durma/koklama sayacı (`sniffStops`,
  daha önce hiçbir UI'da gösterilmiyordu).
- **Günlük hedef artık gerçek bir kullanıcı tercihi:** `QuestEngineContext`'e
  `manualDailyGoalKm`/`setManualDailyGoalKm` eklendi (localStorage persist).
  `null` = "Otomatik" (sistemin `computeDailyGoal()` hesaplaması aynen
  çalışmaya devam ediyor, SADECE bir seçenek oldu). Ayarlar panelinde
  "Günlük Hedef" satırı Otomatik→1→2→3→5→8→10km→Otomatik döngüsünde.
  Manuel hedefin süresi, otomatik hedefin kendi mesafe/süre oranı korunarak
  orantılanıyor (uydurma sabit süre değil).
- **GPS/hava durumu rozetleri + haritadaki canlı konum işaretçisi gerçek
  veriyle doğrulandı** (Baran'ın şüphesi üzerine, koda bakılarak kanıtlandı):
  hava durumu `api.open-meteo.com`'dan gerçek fetch; GPS durumu
  `navigator.geolocation.watchPosition`'ın gerçek `accuracy`/hata callback'
  lerinden; haritadaki mor nokta `userPos` → `walkData.path`'in SON gerçek
  GPS noktasından geliyor. Hiçbiri sahte/sabit değil.
- **Çekilen fotoğrafların ne işe yaradığı doğrulandı** (Baran'ın sorusu
  üzerine): gerçek Supabase Storage (`walk-photos` bucket) → `walk_sessions.
  photo_urls` → `/walk/history/[id]` detay sayfasında "Fotoğraflar" galerisi
  olarak gösteriliyor (sadece gerçek fotoğraf varsa). Uçtan uca gerçek,
  çalışan bir özellik.
- **Repo kökündeki ~180 eski/ilgisiz debug script'i** (`fix_*.js`,
  `apply_*.js`, `*_diff.txt`, `ProjeMoffi1_Guncel.zip`, `.agents/` vb. —
  önceki bir ajan oturumundan kalma) silindi.

**Bilerek ertelenen (Baran'ın "şimdilik bu kadar, başkalarına sonra bakarız"
sınırı gereği düzeltilmedi, sadece not düşülüyor):** Bu turun test sürecinde
BİR KEZ, uzun süre GPS sinyali kaybolmuş/durağan bir test hesabında,
haritanın üzerinde onlarca yeşil/turuncu iç içe daire ikonunun üst üste
yığıldığı görüldü (ekran görüntüsüyle doğrulandı, ama tekrarlanabilirliği
test edilmedi — normal kullanımda GPS sinyali bu kadar uzun süre kaybolmuş
durağan bir senaryo nadir). Şüpheli kaynak: GPS-kayıp/yeniden-arama döngüsü
veya Overpass POI fetch retry'ı, önceki sonuçları temizlemeden yeni
(rastgele jitter'lı) işaretler ekliyor olabilir. Doğrulanmadı, düzeltilmedi —
ayrı bir turda ele alınmalı.

### 8.17 Ayarlarda gerçek özgürlük, ana sayfa kartının canlanması, sıralamada dürüstlük + teşvik (2026-09-24)

Baran'ın 8.16'nın hemen ardından verdiği geri bildirim: günlük hedef hâlâ
"kısıtlı" hissettiriyordu, ana sayfadaki "Bugünkü Yürüyüş" kartı statik
kalıyordu (aktif yürüyen pet'in adı bile geçmiyordu), ve sıralama ekranının
"tatlı bir yarış alanı" ruhu yoktu. Tam serbestlik verildi ("serbestsin").

- **Günlük hedef artık gerçek bir +/- stepper:** ilk denemede (8.15) 6 sabit
  preset arasında döngü kurulmuştu — Baran bunu hâlâ kısıtlı buldu, haklıydı.
  Artık `/walk/tracking` ayarlarında 0.5km'lik adımlarla HERHANGİ bir değere
  gidilebiliyor (− / değer / + düğmeleri), "Otomatik" ayrı bir düğme (sistemin
  `computeDailyGoal()` hesaplamasına tek dokunuşla dönüyor).
- **Ana sayfadaki "Bugünkü Yürüyüş" kartı artık gerçekten canlı:**
  - Aktif yürüyüş varken başlık gerçek nabız noktası (`animate-ping`) + gerçek
    pet adıyla değişiyor: "Bugünkü Yürüyüş" → "{pet adı} yürüyor! 🐾" (Baran'ın
    istediği tam olarak buydu: "Delal yürüyorken Delal yürüyor... bilgi
    vermiyor" şikayeti).
  - Yeni bir 4. bilgi kutucuğu: **Adım** (uygulama genelinde zaten kullanılan
    aynı dürüst mesafe×1.3 tahmini) — Süre/Kalori/Kalan'ın yanına eklendi,
    hiçbiri kaldırılmadı, 390px genişlikte taşma olmadan sığdığı canlı
    Playwright testiyle doğrulandı.
  - İlerleme çubuğu artık CSS `transition` yerine gerçek bir framer-motion
    spring animasyonuyla dolduruyor — daha "yaşayan" bir his için.
- **Sıralamalar ekranında (`LeaderboardSection.tsx`) iki gerçek hata bulundu
  ve düzeltildi, artık gerçek bir teşvik katmanı var:**
  - 🔴 Kullanıcı ilk 100'de değilse (Faz 13'ten beri) mesafesi HER ZAMAN
    "0 km" olarak gösteriliyordu — o hafta gerçekten 5km yürümüş olsa bile.
    Rank de uydurmaydı (`ilk100.length + 1`). Düzeltme: aynı güvenli RPC
    (`get_distance_leaderboard`) kullanıcının SADECE kendi ID'siyle tekrar
    çağrılıp gerçek toplam mesafesi çekiliyor; rank artık dürüstçe "100+"
    (tam sırayı iddia etmiyor, sahte bir kesinlik vermiyor).
  - Yeni: hem bu "100+" dışı-kalan kartında hem de listede görünen "Sen"
    satırında, hemen üstteki/önündeki GERÇEK kişiyle aradaki gerçek km farkı
    gösteriliyor ("X km kaldı — {isim}'i geçebilirsin! 🔥" / "Sıralamaya
    girmene sadece X km kaldı"). Uydurma bir hedef değil — doğrudan zaten
    çekilmiş gerçek sıralama verisinden hesaplanıyor. Kişi listede yoksa
    (örn. 1. sıradaysa) mesaj hiç gösterilmiyor — sahte bir "seni geçecek
    kimse yok ama yine de mesaj göster" durumu yaratılmadı.

**Doğrulama:** typecheck her adımdan sonra temiz (sadece bilinen önceden var
olan hatalar); ana sayfa kartı gerçek Playwright testiyle (walk başlat →
ana sayfaya dön) "{pet} yürüyor!" + nabız noktası + 4 kutucuk canlı
doğrulandı; sıralama ekranı gerçek hesapla hatasız yüklendiği, tek-kullanıcılı
(veri kıt) ortamda motivasyon mesajının doğru şekilde HİÇ gösterilmediği
(çünkü kıyaslanacak gerçek bir üst sıra yok) doğrulandı — kod incelemesiyle
guard mantığının doğru olduğu teyit edildi.

### 8.18 KRİTİK: Vercel deploy zinciri kırıktı + GPS "drift kalkanı" gerçek yürüyüşte mesafe/adımı neredeyse hiç biriktirmiyordu (2026-09-24)

Baran canlıda (Vercel) hâlâ çok eski bir sürüm gördüğünü bildirdi. Araştırma:
**son 3 deploy de (bu oturumun TÜM walk-module commit'leri) `ERROR` durumunda
kalmıştı** — `business-register/page.tsx`'in kullandığı `@vis.gl/react-google-
maps` paketi `package.json`'a HİÇ eklenmemiş, sadece yerel `node_modules`'te
(önceki bir oturumdan kalma) duruyormuş. Yerel `npm run build` bu yüzden hep
yanıltıcı şekilde başarılı görünüyordu (stale/local node_modules kullanıyordu).
Gerçek bir temiz `git clone` + `npm install` + `npm run build` ile hem hata
üretilip hem de düzeltme doğrulandı. **Ders: yerel build başarısı, temiz bir
ortamda (Vercel gibi) da başaracağının garantisi değil — `package.json`'da
deklare edilmemiş ama yerel `node_modules`'te "tesadüfen" duran bir paket
varsa bu fark asla yerel olarak yakalanamaz.**

🔴🔴 Sonra Baran gerçek telefonunda gerçek bir yürüyüş başlattı: **adımlar
hiçbir şekilde sayılmıyordu.** Kök neden: `ActivityContext.tsx`'teki GPS
"drift kalkanı" ART ARDA gelen iki GPS noktası arası mesafenin SABİT 15
metreyi geçmesini şart koşuyordu. Normal yürüyüş hızında (~1.4 m/s) ve
`watchPosition`'ın gerçekte sık geldiği (genelde saniyede bir) koşullarda,
peş peşe gelen noktalar arası mesafe neredeyse HİÇBİR ZAMAN 15 metreyi
geçmiyor — yani gerçek, sürekli bir yürüyüş bile pratikte "sahte hareket"
gibi reddediliyor, mesafe (ve ondan türeyen adım sayısı) ya çok yavaş ya da
hiç birikmiyordu. **Düzeltme (yama değil, kök neden):** sabit 15m yerine,
profesyonel GPS takip uygulamalarının (Strava vb.) kullandığı gerçek yöntem
— GPS'in KENDİ bildirdiği anlık doğruluk yarıçapını (`pos.coords.accuracy`)
gürültü tabanı olarak kullanmak (`Math.max(accuracy, 8)`). İyi sinyalde
küçük gerçek hareketler hemen kabul ediliyor, kötü sinyalde (iç mekan/şehir
kanyonu) eşik kendiliğinden yükselip gerçek GPS sıçramalarını hâlâ
filtreliyor — sabit bir sayı yerine kendi kendine kalibre olan bir sistem.

**Doğrulama:** Playwright ile GERÇEKÇİ bir yürüyüş simüle edildi — bu oturum
boyunca yapılan TÜM önceki testler GPS'i SABİT/hareketsiz tek bir nokta
olarak mock'luyordu (bu yüzden bu kritik hata daha önce hiç yakalanamamıştı).
Yeni test `context.setGeolocation()`'ı saniyede bir, ~1.4m/s hızla ilerleyen
gerçekçi koordinatlarla (accuracy: 12m) güncelledi — düzeltme sonrası 25
saniyelik simülasyonda mesafe/adım gerçekten arttı (gerçek Supabase
`walk_sessions` satırına da `distance_meters` olarak yansıdı, sonra
temizlendi). **Ders: GPS-bağımlı özellikleri SADECE sabit/statik mock
konumla test etmek, ART ARDA gelen küçük hareketleri işleyen kodu (bu
projedeki EN kritik hatalardan biri) tamamen görünmez bırakabiliyor —
bundan sonra GPS testleri mutlaka hareketli bir trajectory simülasyonu da
içermeli.**

### 8.19 KRİTİK MİMARİ DÜZELTME: adım sayısı GPS'ten TAMAMEN bağımsız, gerçek ivmeölçer tabanlı bir pedometreye taşındı (2026-09-24)

Baran'ın 8.18'in hemen ardından gerçek telefonunda yaptığı ikinci test: **evin
içinde yürüdü, "hareketsizlik algılandı" diye otomatik duraklatıldı, adımlar
hiç artmadı.** Bu, 8.18'deki GPS eşik düzeltmesinin YETERSİZ kaldığı anlamına
geliyordu — ama asıl sorun eşik ayarı değildi: **adım sayısı MİMARİ OLARAK
GPS mesafesine bağımlıydı** (`distance * 1.3`). Ev içinde (veya GPS'in
fiziksel olarak konum farkı algılayamadığı HERHANGİ bir yerde) GPS mesafesi
ne kadar eşik ince ayarı yapılırsa yapılsın ASLA anlamlı şekilde artamaz —
bu GPS'in doğasında olan bir sınır, eşik ayarıyla çözülemez.

**Gerçek, kalıcı çözüm:** adım sayısını GPS'ten TAMAMEN ayırıp telefonun
ivmeölçer sensörüyle (`DeviceMotionEvent`) gerçek bir pedometre kurduk —
tıpkı Google Fit/Apple Health'in çalışma şekli. `WalkData`'ya `realSteps`
eklendi, `ActivityContext`'te GPS efektinden tamamen bağımsız yeni bir
`devicemotion` dinleyici efekti var. Gerçek fiziksel hareket algılanınca (GPS
göremese bile) otomatik duraklatmayı da sıfırlıyor — yani ev içi yürüyüş
artık GERÇEKTEN "hareketsizlik" sayılmıyor.

🔴 **Algoritmanın kendisinde, gerçek cihaza hiç gerek kalmadan Playwright'ta
senkron `devicemotion` olaylarıyla İKİ ayrı gerçek hata yakalandı ve
düzeltildi** (bu, "GPS-bağımlı/sensör-bağımlı kodu SADECE statik/tek senaryo
ile test etmenin gerçek hataları gizleyebildiği" dersinin bir devamı):
1. İlk denemede taban çizgisi (yerçekimi bileşeni) filtresi HER örnekle
   (adım darbeleri dahil) güncelleniyordu — ardışık adımlar taban çizgisini
   yavaşça darbe değerine doğru "sürüklüyor", birkaç adım sonra sapma eşiğin
   altına düşüp algılama TAMAMEN duruyordu (debug log ile kanıtlandı: 20
   simüle adımdan sadece 5'i sayıldı, sonra sıfıra düştü).
2. **Kök neden çözümü:** taban çizgisi artık SADECE sinyal zaten sakinken
   (bir adım darbesinin ORTASINDA değilken) güncelleniyor — "kapılı" (gated)
   alçak-geçiren filtre, gerçek ivmeölçer tabanlı pedometrelerin kullandığı
   standart teknik. Düzeltme sonrası aynı 20 simüle adımın TAMAMI doğru
   sayıldı, GPS mesafesi 0.00km'de sabit kalırken (adımın GPS'ten gerçekten
   bağımsız olduğunun kanıtı).

**Kalıcılık:** `walk_sessions` tablosuna gerçek bir `steps` kolonu eklendi
(migration: `add_real_steps_to_walk_sessions`) — `endWalk()` artık gerçek
sensör sayısını (`data.steps`) buraya yazıyor, `mapSessionToRecord()` zaten
`session.steps ?? tahmin` mantığıyla yazılmıştı (önceden hep `undefined`
olduğu için hep tahmine düşüyordu, artık gerçek veri akıyor). `QuestEngineContext`'e
`todaySteps` eklendi (bugün tamamlanan gerçek adımlar + aktif yürüyüşün canlı
`realSteps`'i) — ana sayfa kartının "Adım" kutucuğu artık bunu kullanıyor.

**iOS 13+ önemli detay:** `DeviceMotionEvent.requestPermission()` kullanıcının
dokunuşuyla AYNI senkron çağrı yığınında istenmek ZORUNDA — bir `useEffect`
içinden istemek sessizce başarısız olabiliyor. Bu yüzden gerçek izin isteği
`WalkQuickSheet.tsx`'in `handleStartWalk`/`handleContinueRecovered` tıklama
handler'larına eklendi (zaten oradaki `DeviceOrientationEvent.requestPermission()`
ile aynı desen), `ActivityContext`'teki efekt sadece bir güvenlik ağı.

**Eski tahmine ne oldu:** `distance*1.3` formülü SİLİNMEDİ — sadece rolü
değişti. Artık SADECE şu durumlarda dürüst bir yedek: (a) sensör izni
reddedildiyse/desteklenmiyorsa, (b) bu düzeltmeden ÖNCEki eski yürüyüş
kayıtlarında (DB'de `steps` yoksa). Yeni yürüyüşlerde birincil kaynak her
zaman gerçek sensör sayısı.

### 8.20 Pedometre algoritması araştırma-destekli hale getirildi: sallamaya karşı sağlam, çift saymayan (2026-09-25)

8.19'daki ilk pedometre gerçek telefonda ÇALIŞTI ama Baran iki gerçek sorun
daha buldu: (1) yerinde otururken telefonu sallayınca adım sayılıyordu, (2)
gerçek yürürken bazen tek adım 2 sayılıyordu. Baran'ın isteğiyle popüler
adım algılama literatürü araştırıldı (akademik makaleler — PMC12899432,
PMC4634483, PMC6069265 — + Analog Devices'ın gerçek donanım pedometre
tasarım notu) ve 3 standart teknik uygulandı:

1. **Gerçek histerezis** — tek bir eşik yerine, birbirinden iyi ayrılmış İKİ
   eşik (tepe eşiği + tepe eşiğinin %40'ı kadar düşük ayrı bir "vadi" eşiği).
   Yeni bir tepe SADECE sinyal gerçekten vadi eşiğinin altına inince tekrar
   "silahlanıyor" — bu, tek bir adımın darbesindeki ikincil alt-tepeciklerin
   (topuk vuruşu + ayak düzleşmesi) çift sayılmasını engelliyor.
2. **Adım aralığı fiziksel sınırı** — iki tepe arası süre gerçekçi bir insan
   yürüyüş/hafif koşu aralığında (300ms–2000ms) değilse aday reddediliyor.
3. **Ritim tutarlılığı onayı** (sallamaya karşı ASIL savunma) — ard arda
   gelen 4 aday adımın aralıkları birbirine yakın (±%35 içinde) olmadıkça
   GERÇEKTEN saymaya başlanmıyor. İzole/düzensiz bir sallama bu tutarlılık
   testini geçemiyor; gerçek yürüyüş RİTMİ taklit edilemediği için sallama
   artık sayılmıyor.

🔴 **Yol boyunca, gerçek cihaza hiç gerek kalmadan Playwright'ta senkron
`devicemotion` olaylarıyla YAKALANAN 2 gerçek algoritma hatası (bu oturumun
"GPS-bağımlı/sensör-bağımlı kodu SADECE tek bir senaryoyla test etmenin
gerçek hataları gizleyebildiği" dersinin devamı):**
- **Deneme 1 (adaptif eşik):** eşiği "sakin dönemlerdeki varyansa" göre
  kendiliğinden ayarlamak cazip görünüyordu (telefon cepte/elde farkına göre
  kalibre olsun diye) ama gerçekte kendi kendini besleyen bir kısır döngüye
  yol açtı: varyans başlangıç değeri (1.0) gerçek bir adım darbesinden
  (~2.0-2.5) bile YÜKSEK bir ilk eşik (2.6) üretiyordu — İLK adım hiç
  aşamıyor, "sakin" sayılıp varyansı KENDİSİ şişiriyor, bu da eşiği daha da
  yükseltip algılamayı kalıcı olarak öldürüyordu (40 simüle gerçekçi adımdan
  sadece 4'ü sayıldı, gerçek cihazda "adımlar hiç artmıyor" olarak
  görünürdü). Varyans başlangıcı küçültülünce bu sefer YÜRÜME SIRASINDA
  aynı kısır döngü daha yavaş ama yine oluştu (36-37/40 gibi görünse de
  altta yatan tasarım kırılgandı).
- **Kök neden çözümü: SABİT eşiğe dönüldü.** Adaptif/varyans-tabanlı eşik
  tamamen kaldırıldı, yerine gerçek testle doğrulanmış SABİT bir eşik
  (1.15 m/s²) + yukarıdaki 3 teknik (histerezis + aralık sınırı + ritim
  tutarlılığı) kondu. Bu hem çok daha ÖNGÖRÜLEBİLİR hem de gerçek testte
  kanıtlanmış şekilde daha SAĞLAM çıktı. **Ders: "kendiliğinden kalibre
  olan" bir sistem her zaman daha "profesyonel" görünmüyor — geri besleme
  döngüsü kurduğunuzda (eşik → algılama → eşiği güncelleme), küçük bir
  başlangıç/kenar-durum hatası kalıcı bir kısır döngüye dönüşebilir. Basit,
  sabit, iyi test edilmiş bir sistem çoğu zaman daha güvenilir.**

**Son doğrulanmış sonuçlar (Playwright, gerçekçi ±%15 doğal varyasyonlu
yürüyüş simülasyonu + 3 farklı gerçekçi sallama deseni):**
- Düzensiz sallama (rastgele 100-900ms aralık): **0/30** yanlış sayım.
- Hızlı sürekli titreşim (150-250ms, insan yürüyüşünden çok hızlı): **0/30**.
- Gerçek yürüyüş (40 adım, doğal varyasyonlu): **36/40** sayıldı (küçük,
  dürüst bir "geç başlama" gecikmesi — ritim onaylanana kadar ilk birkaç
  adım bilerek sayılmıyor, sallamaya karşı asıl savunma budur).
- 3 saniyelik duraklama + 10 adım daha: +6 (toplam 42) — duraklama sonrası
  ritmin yeniden onaylanması için küçük bir gecikme, kabul edilebilir.

**Bilinçli, dürüst bir sınır (silinmedi, düzeltilmedi — CLAUDE.md 8.1'deki
"yaklaşık çözüm" listesi geleneğiyle burada not düşülüyor):** çok DELİBERATE,
neredeyse mekanik-metronom hassasiyetinde (±480-520ms gibi) RİTMİK bir
sallama/vurma hâlâ sayılabiliyor (test: 26-32/30) — bu, TEK eksenli ivme
büyüklüğüne dayanan HERHANGİ bir yazılım pedometresinin (native dahil)
paylaştığı, endüstri çapında bilinen bir sınır (gerçek insanlar telefonlarını
"kandırmak" için bilinçli, sabit-ritimli sallama/adım taklidi yapabiliyor —
Google Fit bile bunu ancak ~30 saniyelik pencereler üzerinde çalışan bir ML
sınıflandırıcıyla, çok daha ağır bir yöntemle azaltabiliyor). **Önemli bağlam:
Moffi Puanı (PP) adım sayısına DEĞİL, GPS mesafesine bağlı** (bkz. Bölüm 8.2)
— yani bu sınırın bir ödül/kazanç suistimali riski yok, sadece ekrandaki
sayının nadir bir kenar-durumda yanlış olabileceği anlamına geliyor.

**Ekran kapalıyken/arka planda çalışmama:** Baran'ın kendi bulduğu, doğru bir
gözlem — `DeviceMotionEvent` dinleyicisi, GPS'in zaten sahip olduğu AYNI web
sınırına tabi (tarayıcı ekran kilitlenince/sekme arka plana geçince JS'i
durduruyor, bkz. Bölüm 8.1). Yeni bir sorun değil, GPS'in zaten belgelenmiş
tavanına bağlı kalıyor. Mevcut kısmi çözüm: "Ekranı Açık Tut" ayarı (Bölüm
8.16) açıkken hem GPS hem adım sayar kesintisiz çalışıyor. Tam çözüm
(ekran kilitliyken bile) sadece bir native sarmalayıcıyla (Capacitor)
mümkün — web'in aşamayacağı bir sınır.

### 8.21 Ana sayfa kartındaki "iki paralel hedef sistemi" hatası + kutucuk taşması + gerçek yuvarlak takip butonu (2026-09-25)

Baran'ın bulgusu: "Bugünkü Yürüyüş" kartındaki Hedef/Süre/Adım/Kalori/Kalan
değerleri hâlâ "mock gibi görünüyor" — ve gerçekten de öyleydi:

🔴 **Gerçek hata — CLAUDE.md Bölüm 7'nin "iki paralel, birbirinden habersiz
sistem" deseninin bir örneği daha:** kart kendi AYRI hedef hesabını
tutuyordu (`activePetObj.activity_target / 20`, varsayılan 70 → hep sabit
"3.5 km") — yürüyüş modülünün asıl hedef sistemiyle (`QuestEngineContext.
dailyGoal`, 8.17'de gerçek bir kullanıcı stepper'ı da eklendi) HİÇ
konuşmuyordu. Kullanıcı tracking ekranından hedefini 3km'ye değiştirse bile
ana sayfa hep eski, ayrı "3.5"ini gösterirdi. Düzeltme: `targetActivityKm`
artık doğrudan `dailyGoal.distance` — TEK doğru kaynak.

🔴 **Yapısal taşma:** 4 bilgi kutucuğu (Süre/Adım/Kalori/Kalan) + metinli
buton ("Yürüyüşe Çık" + ok ikonu) TEK satırda 390px genişlikte kesinlikle
sığmıyordu — kartın "kırık/mock" görünmesinin bir sebebi de buydu. Düzeltme:
kutucuklar artık gerçek bir 2x2 grid'de (her zaman sığar), buton ayrı.

**Gerçek, yuvarlak, anlık takibe göre davranan buton** (Baran'ın isteği):
metin+ok yerine artık 56px çapında gerçek bir daire, ikonu CANLI duruma göre
değişiyor — boşta turuncu ▶ (Play), aktif yürüyüşte yeşil nabızlı 🧭
(Navigation, "canlı görüntüle"), duraklatılmışsa tekrar ▶. Playwright ile
canlı doğrulandı: idle→aktif geçişte buton turuncudan yeşile dönüp nabız
animasyonu başlıyor.

### 8.22 Mini widget'a adım+kapatma eklendi, Capacitor+widget ilişkisi netleştirildi, "Bugünkü Yürüyüş" 3-durumlu foto sistemi karara bağlanıp kuruldu (2026-09-25)

**Capacitor netliği (Baran'ın sorusu):** `ActiveWalkMiniWidget.tsx`'e kod
yorumu olarak eklendi — bu widget SADECE uygulama ön plandayken, kendi
sayfaları arasında görünüyor. Capacitor'e sarmak TEK BAŞINA bunu
değiştirmiyor; uygulamadan çıkınca da görünen gerçek bir "canlı widget"
(iOS Live Activity, Android kalıcı bildirim) AYRI, ek bir native eklenti
gerektirir. Ayrıca: mevcut web-tabanlı pedometre (8.19-8.20) de native'e
geçilince KALDIRILMAYACAK — Capacitor genelde web kodunu native kabukta
ÇALIŞTIRMAYA devam ediyor (web sürümü de genelde paralel yaşamaya devam
ediyor), bu yüzden ileride `Capacitor.isNativePlatform()` ile dallanıp
native'de gerçek `CMPedometer`/`Sensor.TYPE_STEP_COUNTER`, web'de mevcut
algoritma kullanılacak — biri diğerinin yerine geçmiyor, ikisi de gerekli.

**`ActiveWalkMiniWidget.tsx` güncellemesi:** Artık sadece km değil, gerçek
ivmeölçer tabanlı adım sayısı da (`walkData.realSteps`) gösteriliyor. Gerçek
bir kapatma (X) butonu eklendi — SADECE o anki yürüyüş için kapanıyor (yeni
bir yürüyüş/`sessionId` başlayınca otomatik tekrar görünüyor, sonsuza kadar
gizli kalmıyor). Yer açmak için Duraklat/Devam Et butonu widget'tan
kaldırıldı (tracking ekranından bir dokunuş uzakta zaten erişilebilir).

**"Bugünkü Yürüyüş" kartının 3-durumlu foto sistemi — nihayet karara
bağlandı:** `design-reference/home-final/README.md`'de "AÇIK İŞ, karara
bağlanmadı" olarak aylarca bekleyen bir konsept vardı — 3 foto zaten
hazırlanmıştı (`walk-lapsed/normal/active.jpg`, `design-reference/home-final/
photos/`'ta duruyordu) ama hangi eşikte hangisinin tetikleneceği hiç
netleşmemişti. Baran bu turda net eşiği verdi: **aktif yürüyüş > 3+ gündür
yürünmedi (lapsed) > aksaklık yok (normal).** Uygulama:
- 3 foto `public/images/`'a kopyalandı (`walk-active.jpg`/`walk-lapsed.jpg`
  eksikti, sadece `walk-normal.jpg` vardı).
- `daysSinceLastWalk` gerçek `walkHistory`'den (son tamamlanan yürüyüşün
  `ended_at`/`started_at`'ı) hesaplanıyor.
- `walkCardState`: `activeSession` varsa 'active', `daysSinceLastWalk >= 3`
  ise 'lapsed', aksi halde 'normal'.
- Lapsed durumu için konsept görselindeki ("walk-before-full.png") ton
  korunarak gerçek bir alt metin eklendi: "Biraz hareket iyi gelir... Seni
  bekliyorum 🐾" — sadece o durumda gösteriliyor.
- Fotoğraf geçişleri `AnimatePresence`/`motion.img` ile yumuşak crossfade.

**Doğrulama:** gerçek `walk_sessions` satırı geçici olarak 5 gün öncesine
tarihlenip "lapsed" tetiklendi (doğru fotoğraf+metin göründü), sonra gerçek
tarihine geri döndürüldü; "normal" ve "active" durumları da gerçek Playwright
testiyle doğrulandı (görsel yolları doğru şekilde değişiyor). Bu turda ayrıca
bugüne kadar biriken ~35 adet test `walk_sessions` satırı temizlendi.

## 9. Bilinen, henüz ele alınmamış güvenlik notları (acil değil, ama unutulmasın)

Supabase advisor taraması şunları buldu (henüz düzeltilmedi, Baran'la
önceliklendirilmedi):
- RLS aktif ama policy'si olmayan 5 tablo
- 23 fonksiyonda mutable `search_path`
- `spatial_ref_sys` tablosunda RLS kapalı
- `public` şemasında 2 extension
- `anon`/`authenticated` tarafından çağrılabilen 37 adet `SECURITY DEFINER`
  fonksiyon (2026-09-23: `award_pati_puan`, `use_streak_shield`,
  `get_distance_leaderboard` eklendi — üçü de sadece `authenticated`'e
  yetki verildi, `anon`'a değil; bu, projede zaten var olan aynı deseni
  takip ediyor, yeni bir sorun kategorisi değil. `run_weekly_league_reset`
  kısa süre var olup geri alındı, `anon`/`authenticated`'e hiç EXECUTE
  verilmemişti, bu sayıma hiç girmedi)
- Sızıntı-korumalı şifre kontrolü (leaked password protection) kapalı

**2026-09-22, `/home` UI güncellemesi sırasında fark edilen — 2026-09-23'te KÖK
NEDENİ BULUNDU, henüz düzeltilmedi:**
- Konsolda tekrarlayan `PGRST200` hatası: `vet_advices` ↔ `profiles` FK
  ilişkisi bulunamıyor. Kaynağı bulundu: `supabaseApiService.ts`'teki
  `getVetAdvices()` fonksiyonu `select('*, profiles(full_name, business_name,
  avatar_url)')` ile PostgREST'in otomatik ilişki-embed özelliğini kullanmaya
  çalışıyor, ama `vet_advices` tablosunda (kolonları: id, clinic_id, content,
  badge, media_url, created_at) **hiç FK constraint'i yok** — `clinic_id`
  gerçek bir foreign key değil. Düzeltme iki yoldan biri: (1) `vet_advices.
  clinic_id → profiles.id` FK constraint'i eklemek (PostgREST embed'i
  otomatik çalışır hale gelir), ya da (2) sorguyu manuel iki adımlı join'e
  çevirmek (`vet_advices` çek, sonra `clinic_id`'lere göre `profiles` çek,
  istemci tarafında birleştir). Baran'ın tercihiyle şimdilik ertelendi
  (yürüyüş modülü odağı bozulmasın diye), ama artık net bir çözüm var.
- Aynı sırada birkaç adet 403 ve 404 network hatası da vardı, kaynağı henüz
  araştırılmadı.

**2026-09-23, Faz 1-5 (yürüyüş modülü) kontrol turu sırasında fark edilenler:**
- `vet_advices`/`profiles` FK hatası (yukarıdaki 2026-09-22 notuyla aynı) hâlâ
  her sayfa yüklemesinde tekrarlıyor — hâlâ kaynağı bulunmadı, ama tesadüf
  değil, tutarlı/her zaman oluşan bir hata olduğu doğrulandı.
- **Düzeltildi**: `CookieBanner.tsx`'in `z-[100]` değeri, tam ekran modallardan
  (`WalkQuickSheet` gibi `z-50` kullananlar) daha yüksekti — çerez banner'ı
  ilk ziyarette yürüyüş panelinin "Yürüyüşe Başla" butonunun üzerine biniyor
  ve tıklanmasını engelliyordu. `z-40`'a düşürüldü (tam ekran sheet'lerin
  altında, normal sayfa içeriğinin üstünde kalacak şekilde).
- ✅ **ÇÖZÜLDÜ (2026-09-23) — Giriş akışının aralıklı takılması: kök neden
  bulundu ve düzeltildi.** `src/services/supabaseApiService.ts`'teki
  `getSessionUser()` (uygulama genelinde **60'tan fazla fonksiyon** tarafından
  çağrılıyor — her API isteğinde "hangi kullanıcı" diye) hiç cache'lenmeden
  her çağrıda gerçek bir ağ isteğiyle (`supabase.auth.getUser()`) token'ı
  Supabase sunucusunda doğruluyordu. Bir dashboard/home gibi ekran mount
  olurken 10-60 arası fonksiyon paralel çağrıldığında, HEPSİ aynı token için
  ayrı ayrı `/auth/v1/user` isteği atıyordu — Playwright ile ölçüldü: tek bir
  sayfa yüklemesinde **düzinelerce paralel istek**. Bu, Supabase'in auth rate
  limit'ine takılıp bazen giriş sonrası profil/oturum senkronizasyonunu
  bozuyordu (kullanıcı "EVRENE GİRİŞ DOĞRULANIYOR" ekranında sessizce
  takılı kalıyordu, hata mesajı da görünmüyordu). **Düzeltme**: `getSessionUser()`'a
  2 saniyelik bir promise cache/dedup eklendi — aynı pencuredeki tüm çağrılar
  artık TEK ağ isteğini paylaşıyor. Bu, `getSession()` yerine `getUser()`
  kullanılmasının asıl sebebi olan "hesap değiştirmede bayat kullanıcı" riskini
  bozmuyor çünkü 2sn çok kısa bir pencere. Doğrulama: aynı Playwright script'i
  düzeltme sonrası 3/3 başarılı giriş yaptı (öncesinde 4 denemeden 3'ü
  başarısızdı), istek sayısı sayfa başına 1'e düştü.

**2026-09-23, Faz 13/walk UI turu sırasında fark edilen, düzeltilmeyen (kapsam
dışı) bir bug:** `/profile/[id]/page.tsx`'te `id === 'me'` durumu için veri
çekme `useEffect`'i `if (!id || id === 'me') return;` ile erken çıkıyor ve
`loading` state'ini hiç `false` yapmıyor — yani literal `/profile/me` URL'i
sonsuza kadar "Profil Yükleniyor" ekranında takılı kalıyor. Gerçek uygulama
kodu bu URL'i HİÇBİR YERDEN kullanmıyor (her yerde gerçek `user.id` UUID'i
kullanılıyor, `MoffiBottomNav.tsx`/`DynamicNavigation.tsx` kontrol edildi),
yani kullanıcı bu hatayla normal kullanımda hiç karşılaşmıyor — ama biri
elle `/profile/me` yazarsa (ya da ileride biri bu deseni "kısayol" sanıp
kullanırsa) sessizce kırılır. Düşük öncelikli, düzeltilmedi.

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

## 11. Çoklu-ajan çalışma sistemi (Claude / editördeki Claude Code / Antigravity)

Bu projede aynı anda üç ayrı AI ajanı çalışabiliyor: bu sohbetteki Claude (bulut
ortamında, Supabase/Vercel'e MCP ile doğrudan bağlı), editördeki Claude Code
eklentisi (VS Code/Antigravity IDE içinde, yerel dosya sistemi üzerinde) ve
Antigravity. Karışıklığı önlemek için şu iş bölümü kuruldu:

- **Hız farkı:** Editördeki Claude Code / Antigravity dosyanın üzerinde doğrudan
  çalıştığı için basit, tek dosyalık kod/UI değişiklikleri için çok daha hızlı.
  Bulut ortamındaki Claude her değişiklikte bilgisayar ↔ bulut arası dosya
  transferi yaptığı için yapısal olarak daha yavaş (bu bir özensizlik değil,
  mimari fark).
- **Basit/tek dosyalık UI ve kod değişiklikleri** → editördeki Claude Code veya
  Antigravity kullanılmalı.
- 🔴 **Supabase şema değişikliği, migration, veri silme gibi KALICI veritabanı
  işlemleri SADECE bu sohbetteki Claude üzerinden yapılır.** Editördeki Claude
  Code/Antigravity böyle bir işlem gerekiyorsa önce Baran'a haber vermeli; salt
  okuma/select sorguları her ajan için serbest. Sebep: iki ajanın aynı anda
  habersizce şema/veri değiştirmesi, Bölüm 5.4/7'de tarif edilen "paralel,
  birbirinden habersiz sistem" riskini veritabanı seviyesine taşır.
- **Mimari kararlar, birden fazla dosya/sistemi etkileyen değişiklikler, kod
  incelemesi/doğrulama ve görsel UI doğrulama** (tarayıcıdan ekran görüntüsü
  alarak kontrol etmek) → bu sohbetteki Claude.
- **Eşzamanlı düzenleme riski gerçek:** Aynı dosya üzerinde birden fazla ajan
  aynı anda çalışabiliyor (bir kez fiilen yaşandı: `/home` sayfasındaki "Moffi
  Ekosistemi" kartında bir ajan boyutu küçültürken diğeri rengini
  değiştiriyordu). Bir ajan bir dosyayı düzenlemeden hemen önce dosyanın güncel
  halini tekrar okumalı, eski bir kopyanın üzerine körlemesine yazmamalı.
- **Kilitli `/home` ana sayfa tasarımı** `design-reference/home-final/`
  klasöründe duruyor: `README.md` (renk kodları, font, bölüm sırası, tasarım
  kararları), `final-home-mockup.png` (tam görsel render), `Final-Ana-Sayfa.dc.html`
  (kaynak), `photos/` (kullanılan referans fotoğraflar). Herhangi bir ajan
  `/home` sayfasında UI değişikliği yapmadan önce bu klasörü okumalı — tasarım
  kararı burada net, tekrar sorulmasına/tahmin edilmesine gerek yok. Canlı
  sayfada bu tasarımda olmayan bölümler varsa (örn. "Moffi Ekosistemi" banner'ı,
  "Aktivite Raporu" grafiği), bunlar Baran'ın onayı olmadan silinmemeli/eklenmemeli.
- 🔴 **Kilitli yürüyüş modülü tasarımı** `design-reference/walk-final/` klasöründe
  duruyor: `walk-module-8-screens-reference.jpg` (Baran'ın verdiği 8 ekranlık
  gerçek referans) + `README.md` (ekran ekran döküm, renk kodları, mevcut kodla
  bilinen çelişkiler). Bu görsel bir kere (uzun sohbet özetlenirken) kaybolmuştu
  ve kaybolduğu süre boyunca yapılan işler (Faz 12 Rozetler, Faz 13 Sıralama)
  görsele sadık kalınmadan inşa edildi — özellikle Sıralama sayfası (referans:
  km-tabanlı + zaman/sosyal filtreli, mevcut kod: PP-tabanlı lig/terfi sistemi)
  ve renk paleti (referans: turuncu+yeşil, mevcut kod: mor/indigo) arasında
  bilinen, henüz çözülmemiş bir çelişki var. **Herhangi bir ajan `/walk/*`
  altında UI değişikliği yapmadan önce bu klasörü okumalı.**
