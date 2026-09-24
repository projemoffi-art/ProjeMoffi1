# Moffi Yürüyüş Modülü — KİLİTLİ Referans (v2, 14 Ekran)

## 🔴 2026-09-24 (devam) — Piyasa araştırması sonrası 13 gerçek özellik eklendi

14 ekranın tamamı bitince Baran'a "piyasadaki en iyi yürüyüş uygulamalarına göre
ne eksik" diye soruldu. Strava/AllTrails/Nike Run Club + köpek-yürüyüşüne özel
uygulamalar (MyDoggy/Tails/Walkies) araştırıldı, 13 maddelik bir liste çıkarıldı,
Baran "tümünü uygula" dedi. Hepsi gerçek altyapıyla (uydurma/mock değil)
uygulandı ve canlı Playwright ile doğrulandı:

1. **Otomatik duraklatma** (`ActivityContext.tsx`) — 25sn hareketsizlik sonrası
   yürüyüş kendiliğinden duraklıyor (`isAutoPaused`), GPS izleme AÇIK kalıyor
   (manuel duraklatmadan farklı) ki gerçek hareket algılanınca otomatik devam
   edebilsin. Canlı testte doğrulandı.
2. **Kilometre-arası (split) verisi** — `WalkData.splits[]`, her tam km'de
   gerçek GPS mesafesinden otomatik kaydediliyor. Tracking ekranında canlı "En
   hızlı km" rozeti + sesli anons tetikliyor.
3. **Sesli geri bildirim** — YENİ `src/lib/audioCues.ts` (Web Speech API,
   `haptics.ts` ile aynı desen). Yürüyüş başlangıcı/split/otomatik duraklama-
   devam/bitiş anonsluyor, tracking ekranında 🔊/🔇 ile kapatılabilir.
4. **Canlı konum paylaşımı (Beacon)** — YENİ `walk_beacons` tablosu (BİLEREK
   `walk_sessions`'tan ayrı, minimal — sadece tek nokta konum, GPS geçmişi asla
   genele açılmıyor, Faz 10 gizlilik disiplini korundu) + YENİ tamamen herkese
   açık `/beacon/[id]` sayfası (hesap gerekmez). Tracking ekranında "Konumu
   Paylaş" ile bağlantı üretilip paylaşılıyor. Uçtan uca (paylaş → farklı
   tarayıcı sekmesinde aç → gerçek konumu gör) canlı doğrulandı.
5. **Kişisel rekorlar** — özet ekranında gerçek `walkStats.longestWalkKm`
   karşılaştırmasıyla "Yeni Rekor!" ya da lifetime ortalama tempo
   karşılaştırmasıyla "Ortalamandan hızlıydın" kutlaması.
6. **Fotoğraf ekleme** — YENİ `walk-photos` Storage bucket + `walk_sessions.
   photo_urls` kolonu. Tracking ekranında kamera FAB'ı ile gerçek upload,
   Ekran 9'da SADECE gerçek fotoğraf varsa "Fotoğraflar" bölümü (dummy görsel
   yok). Uçtan uca canlı doğrulandı.
7. **Rota kişiselleştirmesi** — `/walk` hub'ında gerçek GPS başlangıç noktası
   kümelemesinden (haversine, Faz 18'in aynı ailesi) "favori rota" içgörüsü —
   uydurma bir yer adı YOK, sadece dürüst bir tekrar sayısı.
8. **Çevrimdışı GPS kuyruğu** (`ActivityContext.tsx`) — bağlantı koptuğunda
   konum kaybolmuyor, `offlineLocationQueueRef`'te birikip 'online' event'inde
   sırayla senkronize ediliyor.
9. **Rota tekrar oynatma (replay)** — Ekran 9'da gerçek path noktaları üzerinde
   bir işaretçiyi hareket ettirip rotayı adım adım açığa çıkarıyor. 🔴 Bu
   sırada GERÇEK bir bug bulundu: detay haritası `isTracking={false}`
   geçtiği için rota çizgisi (Polyline) HİÇ render edilmiyordu (LiveMap'te
   Polyline `isTracking &&` şartına bağlı) — `isTracking` artık `true`
   geçiliyor, `hideInternalUI` zaten tüm canlı-izleme UI'ını bastırdığı için
   güvenli.
10. **Irk/boyuta göre ayarlı günlük hedef** (`QuestEngineContext.tsx`,
    `computeDailyGoal`) — pet'in gerçek `size` alanına (Mini/Küçük/Orta/Büyük/
    Dev) göre bir çarpan uygulanıyor; önceden SADECE kullanıcı geçmişine
    bakıyordu, pet'in fiziksel büyüklüğünü hiç hesaba katmıyordu.
11. **Pati güvenliği uyarısı** — tracking ekranında gerçek hava sıcaklığından
    (≥28°C sıcak asfalt / ≤0°C tuzlu-karlı zemin) türetilen dürüst bir uyarı.
12. **Veterinere PDF raporu** — `/walk` hub'ında "Vet Raporu İndir" butonu,
    projede kurulu ama hiç kullanılmayan `jspdf`'i devreye sokuyor. Gerçek
    dönem istatistikleri + tüm-zamanlar özeti içeren indirilebilir bir PDF
    (e-posta gönderimi değil — öyle bir altyapı yok, dürüstçe sadece indirme).
13. **Durma/koklama sayacı** — GERÇEK GPS hareketsizlik verisinden (8-25sn
    arası kısa duraklamalar), özet ekranında eğlenceli bir "X kez durup
    çevreni kokladın 👃" notu.

**Bilinçli sınırlar:** Beacon konum güncellemesi ~her kabul edilen GPS
noktasında (Strava'nın 15sn'lik sabit aralığından farklı ama pratikte benzer
sıklıkta). PDF raporu e-posta değil indirme. Rota kişiselleştirmesi yer adı
değil sadece tekrar sayısı veriyor (gerçek geocoding altyapısı yok).

## 🔴🔴 2026-09-24 (devam 2) — Baran'ın "gerçekten çalışıyor mu" denetimi: 3 kritik bulgu

Baran açıkça "yorum değil gerçek veri" isteyip üretime hazırlığı sordu. Kod
okuma + canlı Playwright kanıtıyla doğrulanan, hepsi düzeltilen 3 gerçek bulgu:

1. **🔴🔴 KRİTİK — Harita filigranlı/kırıktı.** `curl` ile doğrudan tile
   sunucusuna (`basemaps.cartocdn.com`) istek atılınca, dönen PNG'nin
   İÇİNE gömülü gerçek bir "API KEY REQUIRED — carto.com/basemaps/apikey"
   filigranı olduğu görüldü (hem light hem dark varyant, bizim kodumuzun
   eklediği bir overlay değil, Carto'nun sunucusu böyle dönüyor). Projede
   Carto için hiçbir API key yapılandırması yok — yani bu "key eklenince
   düzelir" değil, ücretsiz/anonim tile servisinin gerçekten kısıtlanmış
   olması. Bu SADECE LiveMap'i değil, `SightingMapSelector.tsx`, `RadarMap.
   tsx`, `MapLocationPicker.tsx`'i de etkiliyor — ama bu turun kapsamı
   sadece yürüyüş modülü (LiveMap) olduğu için sadece o düzeltildi.
   **Düzeltme:** OpenStreetMap'in standart tile sunucusuna geçildi (key
   gerektirmiyor, gerçek `curl` + canlı testle filigransız çalıştığı
   doğrulandı). Bilinen kısıt: OSM standart tile'larının ayrı bir koyu tema
   varyantı yok, harita artık dark mode'da da açık temalı görünüyor —
   filigranlı/kırık bir haritadan kıyaslanamayacak kadar iyi bir uzlaşma.
2. **🔴🔴 KRİTİK — Harita üzerindeki "Veteriner"/"Park"/"Kafe"/"Pet Shop"
   pinleri neredeyse HER ZAMAN sahteydi ve tıklanınca kullanıcıyı YANLIŞ
   koordinata yönlendiriyordu.** Kod, gerçek bir OSM (Overpass API) sorgusu
   deniyordu ama 3 saniyelik sabit bir timeout'u vardı; bu ortamda (ve halka
   açık Overpass sunucusunun genel yavaşlığı/rate-limit'i düşünülünce muhtemelen
   üretimde de sıkça) sorgu SÜREKLİ başarısız oluyordu — bu oturum boyunca
   konsolda defalarca "OSM Places fetch error, falling back to mock" görüldü.
   Başarısız olunca kod, kullanıcının GERÇEK konumu etrafına RASTGELE
   SAÇILMIŞ, gerçekte var olmayan "Veteriner"/"Park" gibi etiketli sahte
   pinler çiziyordu — bazıları rastgele (%15) "premium" altın yıldızla
   işaretleniyordu, hiç gerçekleşmeyen bir "coinReward" alanı taşıyordu. Bu
   pinlere tıklayıp "Yol Tarifi"ne basan bir kullanıcı GERÇEK Google Maps'te
   UYDURMA bir koordinata yönlendiriliyordu — biri gerçekten yakındaki bir
   veterineri ararken doğrudan yanlış yönlendirilmiş olabilirdi.
   **Düzeltme:** Sahte fallback TAMAMEN kaldırıldı (hem "sonuç yok" hem
   "istek başarısız" durumunda artık dürüstçe boş bırakılıyor, sahte pin
   uydurulmuyor); gerçek sonuçlardaki rastgele "premium"/"coinReward"
   alanları da kaldırıldı (gerçek bir OSM sonucu olsa bile bu ikisi
   uydurmaydı). Canlı testle doğrulandı: harita artık gerçek konum + gerçek
   rota dışında hiçbir sahte pin göstermiyor.
3. **🔴 "Yürüyüşe Başla"ya basınca eski sayfa bir an görünüp SONRA takip
   ekranı gelen sert, iki-adımlı geçiş.** Kök neden: `WalkQuickSheet`'in
   navigasyon tetikleyen aksiyonları (Başla/Devam Et/Bitir/İstatistikler)
   `onClose()`'u (panel kapanış animasyonunu başlatan) `router.push()` ile
   AYNI ANDA çağırıyordu — panel birkaç yüz ms süren kapanış animasyonunu
   oynatırken yeni sayfa HENÜZ boyanmamış oluyordu, panelin altından o anki
   GERÇEK sayfa (`/home` ya da bu test hesabı için `/business/dashboard`)
   kısaca görünüyordu. Gerçek Playwright kare-kare ekran görüntüsüyle
   doğrulandı (tıklamadan 100ms sonraki karede TAM İşletme Paneli görünüyordu).
   **Düzeltme:** Yeni bir `onNavigateAway` prop'u eklendi — navigasyon
   aksiyonları artık paneli HEMEN kapatmıyor, sadece history temizliğini
   (`clearModalHistoryState`, timing'i BOZULMADAN senkron kalıyor) yapıyor.
   Panel GÖRSEL olarak `DynamicNavigation`'daki yeni bir `pathname`-izleme
   efekti tarafından, pathname GERÇEKTEN değiştiğinde (yani yeni sayfa zaten
   boyanmış olduğunda) kapatılıyor. Kare-kare doğrulamada artık ARA karelerde
   panel (Hazırlık→Aktif içerik geçişini SORUNSUZ kendi içinde oynatıyor)
   görünüyor, hiçbir karede eski/yanlış bir sayfa YOK — panel direkt zaten
   hazır olan takip ekranına devrediyor.

**Ayrıca denetimde bulunan, düzeltilmeyen (düşük risk/kapsam dışı) küçük
bulgular:**
- `community/page.tsx` kendi AYRI, tamamen ölü bir `<WalkQuickSheet>`
  kopyası render ediyor (`isWalkQuickSheetOpen` state'i + `open-walk-sheet`
  event dinleyicisi — bu event'i uygulamada HİÇBİR YER dispatch etmiyor,
  sadece `/community?openWalk=true` URL param'ıyla tetiklenebilir, normal
  hiçbir navigasyon buraya gitmiyor). Gerçek bir çift-panel riski yaratmıyor
  (farklı event isimleri) ama klasik "bağlantısı koparılmış ama silinmemiş"
  kod tekrarı (bkz. CLAUDE.md Bölüm 7) — ayrı bir temizlik turu hak ediyor.
- `LiveMap.tsx`'teki `MOCK_MARKS`/`marks`/`handleCreateMark`/
  `MarkCreationModal` bütün bir "topluluk pin'i oluşturma" alt-özelliği
  TAMAMEN ölü — `setIsMarkModalOpen(true)` hiçbir yerden çağrılmıyor, modal
  asla açılamıyor, oluşturulsa bile `marks` dizisi haritada hiç render
  edilmiyor. Kullanıcıya görünmediği için yanıltıcı değil, ama gereksiz kod.
- `WalkQuickSheet.tsx`'teki `WeatherDetailSheet` (zaten Ekran 2 yeniden
  inşasında dokümante edilmişti) hâlâ ulaşılamaz durumda — tetikleyen buton
  Ekran 2'den kaldırıldığında kod temizlenmedi.
- Bu test hesabının (`role=business`) `/home`'a gidince bazen `/business/
  dashboard`'a yönlendiği/karışık render ettiği gözlemlendi — pet-owner
  hesapları için geçerli değil, walk modülü kapsamı dışında, ayrı
  incelenmeli.

🔴 **BU DOSYA PROJENİN EN KRİTİK REFERANS BELGELERİNDEN BİRİ.** Sohbet ne kadar
uzarsa uzasın, ne kadar özetlenirse özetlensin, `/walk/*` altında (ve ana
sayfadaki yürüyüş kartında) yapılacak HER UI değişikliği önce bu dosyayı ve
`walk-module-14-screens-reference.jpg`'yi okumalı. Baran'ın açık talimatı:
**"birebir aynısı olacak"** — bu bir ilham kaynağı değil, hedef pixel-doğru
tasarımın kendisi.

## Öncelik sırası — hangi görsele güven

- **`walk-module-14-screens-reference.jpg`** — 🔴 GÜNCEL, BİREBİR HEDEF. Baran'ın
  2026-09-24'te gönderdiği, 14 ekranı sırayla gösteren gerçek referans. Bu
  dosyadaki HER TASARIM KARARI (renk, layout, metin, buton yerleşimi,
  sekme isimleri) bundan sonra bağlayıcı.
- `walk-module-8-screens-reference.jpg` (v1, 2026-09-23) — ESKİ, daha az
  detaylı bir önceki referans. v2 ile çelişen her yerde v2 KAZANIR. v2'de
  hiç yer almayan bir konuda (örn. genel renk paleti turuncu+yeşil+siyah
  olması) hâlâ geçerli, v2 bunu doğruluyor/genişletiyor, çelişmiyor.

## 🔴 Baran'ın bu turdaki 3 net talebi

1. **14 ekranın TAMAMI bu görsele göre, birebir aynı şekilde yeniden inşa
   edilecek.** Bazı ekranlar (Aktif Yürüyüş, Sıralamalar) zaten yakın —
   onlarda ince ayar yeterli. Bazıları (Yürüyüşe Hazırlık, Yürüyüş Sonucu,
   Yürüyüş Geçmişi, Yürüyüş Detayı, İstatistikler, Rozetler, Ödül Marketi)
   YAPISAL OLARAK farklı — gerçek bir yeniden inşa gerekiyor. Bir ekran
   (İşleme Ekranı) HİÇ YOK, sıfırdan inşa edilecek.
2. **Gerçek, profesyonel geçiş sistemi kurulacak.** Baran'ın kendi
   tarifiyle iki somut hata: (a) bazen geri giderken sayfa onu "en başa"
   atıyor — beklenmedik/yanlış bir önceki ekrana dönüyor, (b) başka bir
   sekmeye/sayfaya geçerken mevcut panel TAMAMEN kapanıyor, SONRA yeni
   sekme açılıyor (sert, iki adımlı bir kesme — tek, yumuşak bir çapraz
   geçiş değil). İkisi de kök nedenine inilip düzeltilecek, band-aid değil.
3. **Bu görsel ve yapılan düzeltmeler kalıcı olarak kilitlendi** — bu
   dosyanın kendisi o kilit.

## 🔴 İlerleme durumu (bu dosyayı her okuyuşta güncelle)

- ✅ **Navigasyon/geçiş mimarisi (talep #2) TAMAMLANDI** (2026-09-24):
  `DynamicNavigation.tsx`'e `clearModalHistoryState()` eklendi (9 overlay'in
  hepsine bağlandı), `WalkQuickSheet.tsx`'teki 4 navigasyon noktasında
  `onClose()`→`router.push()` sırası düzeltildi (önceden ters sıraydı, bu
  yüzden temizlik hiç işe yaramıyordu), `src/app/walk/template.tsx` silinip
  yerine `src/app/walk/layout.tsx` (`AnimatePresence`+`usePathname` ile gerçek
  çapraz geçiş) kondu. Canlı Playwright ile doğrulandı: geri tuşu artık hayalet
  `/home` girdisine atlayıp paneli yanlış sayfada yeniden açmıyor.
- ✅ **Ekran 2 (Yürüyüşe Hazırlık) TAMAMLANDI** (2026-09-24, `WalkQuickSheet.tsx`):
  Poşet/su/tasma kontrol listesi tamamen kaldırıldı. Yeni yapı: pet fotoğrafı +
  "{pet} ile Yürüyüş" başlığı + "Bugünkü hedef"/"Tahmini süre" iki-istatistik
  satırı + gerçek `navigator.permissions` durumuna bağlı GPS izin bildirimi +
  gerçek/düzenlenebilir "Yürüyüş Ayarları" (Hedef: `TARGET_PRESETS_KM`
  `[1,2,3,5,8,10]` içinde döngüye giriyor — döngü artık ekranda o an gösterilen
  değerden başlıyor, önceki bir sürümde gizli bir taban değerden başlayıp
  yanlış bir sayıya sıçrıyordu, düzeltildi; Pet: `switchPet` ile gerçek pet
  döngüsü; Rota türü: dürüst "Serbest Yürüyüş" tek seçenek, dokununca sahte bir
  seçenek uydurmak yerine dürüst bir "yakında" toast'u). Hava durumu satırı
  referansta olmadığı için ekrandan kaldırıldı (WeatherDetailSheet kodu duruyor,
  şu an tetiklenmiyor — ileride başka bir ekrana taşınabilir, açık soru).
  Canlı mesafe göstergesi (0.00 km) artık SADECE `walkData.isActive` iken
  gösteriliyor, hazırlık ekranında hiç görünmüyor (önceden her zaman görünürdü).
- ✅ **Ekran 3/4 (Aktif/Duraklatılmış) küçük ayarlar TAMAMLANDI** (2026-09-24,
  `src/app/walk/tracking/page.tsx`): Duraklat butonu artık koyu/siyah
  (`bg-slate-900`), turuncu sadece "Devam Et" durumunda kalıyor (referansla
  aynı). Duraklatıldı durumu artık haritayı KARARTMIYOR — tam ekran koyu örtü
  kaldırıldı, yerine üst pill sırasına küçük siyah "⏸ Duraklatıldı" rozeti
  eklendi. Alt kart, duraklatılmışken büyük km sayısı + ayrı satırlar yerine
  referanstaki gibi tek satırlık kompakt özet gösteriyor ("Yürüyüş Duraklatıldı
  · 3,24 km · 28:14 · 142 kcal").
- ✅ **Ekran 5 (Bitirme Onayı) TAMAMLANDI** (2026-09-24, hem
  `tracking/page.tsx` hem `WalkQuickSheet.tsx` — ikisinde de ayrı ayrı
  `showStopConfirm` state'i vardı, ikisi de gerçek modale çevrildi): inline
  buton takası yerine gerçek `AnimatePresence` modal — dimmed+blur arka plan,
  X kapatma butonu, duraklat ikonlu daire, "Yürüyüşü bitirmek istediğinize emin
  misiniz?" başlığı, Mesafe/Süre iki istatistik, kırmızı dolu "Yürüyüşü Bitir"
  + soluk ikincil "Devam Et". Canlı Playwright ile ekran görüntüsüyle
  doğrulandı, referansla birebir uyumlu.
- ✅ **Ekran 6 (İşleme Ekranı) TAMAMLANDI** (2026-09-24, YENİ dosya
  `src/app/walk/processing/page.tsx`): Daha önce hiç yoktu. `tracking/page.tsx`
  (`handleFinish`) ve `WalkQuickSheet.tsx` (`handleStopWalk`) artık `stopWalk()`'ı
  kendileri çağırıp doğrudan `/walk/summary`'e gitmek yerine, hesaplanan
  özet parametreleriyle `/walk/processing`'e yönlendiriyor; asıl `stopWalk()` +
  `acknowledgeWalkCompletion()` çağrısı ARTIK BURADA yapılıyor. Gerçek 4 adımlı
  checklist: "GPS verileri işleniyor"+"Mesafe hesaplanıyor" tek bir gerçek
  `await stopWalk()` çağrısına (DB yazımı + `refreshWalkData`) bağlı; "Kazanımlar
  hazırlanıyor"+"Rozet kaydediliyor" `QuestEngineContext`'ten (yürüyüş sırasında
  zaten canlı hesaplanmış) `lastEarnedBadge` okunmasına bağlı — sabit/uydurma bir
  gecikme YOK, her adım gerçekten o iş bitince yeşile dönüyor. Otomatik olarak
  `/walk/summary`'e geçiyor (buton yok, referansla aynı).
  🔴 Bu ekranı inşa ederken canlı Playwright testinde GERÇEK, ciddi bir bug
  yakalandı ve düzeltildi: React Strict Mode'un dev modunda efekti iki kez
  çalıştırması (mount→cleanup→mount), `ranRef` ile korunan tek seferlik async
  zincirin cleanup'ı tarafından sessizce `cancelled=true` yapılıp asla
  `/walk/summary`'e geçemeden sonsuza dek "işleniyor" ekranında takılı
  kalmasına yol açıyordu. `cancelled`/cleanup deseni tamamen kaldırıldı —
  `stopWalk()` zaten gerçek bir yan etki (DB yazımı) olduğu için sadece
  `ranRef` ile tek seferliğe zorlanması yeterli ve doğru olan buydu.
  Ayrıca bu ekranı inşa ederken `Circle` ikonunun (CLAUDE.md 5.6'da belgelenen
  Turbopack+OneDrive dosya-okuma panic'i) bu kez tetiklendiği görüldü — ikon
  düz bir CSS dairesiyle değiştirildi, dev sunucusu yeniden başlatıldı.
- ✅ **Ekran 7 (Yürüyüş Sonucu) TAMAMLANDI** (2026-09-24, `summary/page.tsx` +
  `QuestEngineContext.tsx`): Büyük km sayısı artık başlığın hemen altında, tek
  başına öne çıkan bir eleman (2x2 gridden çıkarıldı, grid'de sadece Süre/
  Kalori/Adım 3'lü satırı kaldı). "Kazandıklarınız" → "Bugünkü kazanımlarınız"
  2x2 grid'e çevrildi, 2 yeni gerçek veri kaynağı eklendi: **Rozet İlerlemesi**
  ve **Haftalık Hedef %X**. Buton "Tamam" oldu (kaydetme artık Ekran 6'da
  gerçekleştiği için).
  🔴 Yeni paylaşılan hesaplayıcı: `QuestEngineContext.tsx`'e
  `getClosestBadgeProgress()` + `closestBadgeProgress` eklendi — en yakın
  kazanılmamış rozetin GERÇEK sayısal ilerlemesini döndürüyor. BİLEREK sadece
  `walkStats` üzerinden güvenilir/sürekli veriye sahip 3 rozeti kapsıyor
  (`week_fire` 7 günlük seri, `explorer_100` 100km toplam, `month_fire` 30
  günlük seri) — sosyal/pet sayaç rozetleri (photographer, pet_care_week) ve
  konum-kümeleme gerektiren keşif rozetleri (park_hopper, region_explorer)
  BİLEREK dışarıda bırakıldı çünkü onlar için ya güvenilir bir sayaç yok ya da
  hesaplama çok daha ağır — Ekran 13 (Rozetler) bu hesaplayıcıyı GENİŞLETECEK
  (aynı fonksiyonu kullanacak, tekrar yazılmayacak). Bu fonksiyon hem Ekran 7
  hem gelecekteki Ekran 13 tarafından paylaşılıyor — kod tekrarı yok.
  "Kazandıklarınız" tile'ları artık koşullu: PP/Streak sadece >0 ise, Rozet
  İlerlemesi sadece hesaplanabilir bir aday varsa, Haftalık Hedef HER ZAMAN
  gösteriliyor (0/7 olsa bile anlamlı bir ilerleme göstergesi, "kazanım"
  değil). Canlı Playwright ile tam akış (tracking→onay→işleme→sonuç) uçtan uca
  doğrulandı.
- ✅ **Ekran 8 (Yürüyüş Geçmişi) TAMAMLANDI** (2026-09-24, `history/page.tsx`
  tamamen yeniden yazıldı): Tümü/Bu Ay/Bu Yıl dönem sekmeleri (gerçek
  `started_at`/`ended_at` filtrelemesi) eklendi. Ay bazlı gruplama ("Eylül
  2026" gibi başlıklar). Büyük SVG önizlemeli karttan kompakt liste satırına
  (küçük 56px kare thumbnail + metin) geçildi. Göreli tarih etiketleri
  ("Bugün"/"Dün", yoksa "20 Eyl") eklendi. Kalori artık gösteriliyor (gerçek
  pet ağırlığından hesaplanan aynı formül, uydurma değil).
- ✅ **Ekran 9 (Yürüyüş Detayı) TAMAMLANDI** (2026-09-24,
  `history/[id]/page.tsx`): Saat aralığı eklendi (start_time-end_time, ikisi
  de zaten DB'de vardı). 3'lü istatistik satırından (km/dk/kcal) adım çıkarıp
  ayrı bir satıra taşındı. YENİ "Ortalama Hız / Maks. Hız / Rota Türü" bilgi
  satırı — ortalama gerçek mesafe/süreden, maksimum gerçek GPS nokta-nokta
  hesaplamasından (`computeMaxSpeedKmh`, >25km/h'lik sıçramalar GPS gürültüsü
  sayılıp filtreleniyor). "Hava" alanı BİLEREK EKLENMEDİ — o günün hava durumu
  DB'de hiç kaydedilmiyor, uydurma bir değer göstermektense dürüstçe atlandı
  (gelecekte gerçek kayıt eklenirse geri konabilir). "Fotoğraflar" bölümü de
  aynı sebeple BİLEREK EKLENMEDİ — gerçek bir fotoğraf yükleme özelliği yok,
  dummy görsel konulmadı. Haritanın köşesindeki dekoratif +/dişli ikonları da
  BİLEREK eklenmedi — hiçbir gerçek işlevleri olmayacaktı (statik geçmiş
  haritası), işlevsiz buton eklemek proje felsefesine aykırı.
  🔴 Paylaşılan kod temizliği: `haversineKm()` artık `QuestEngineContext.tsx`
  içine gömülü değil, `@/lib/utils`'e taşındı (hem Ekran 9'un hız hesabı hem
  Faz 18'in konum-kümeleme mantığı aynı fonksiyonu kullanıyor — iki ayrı
  kopya değil).
  🔴 Bu iki ekranı inşa ederken lucide-react/Turbopack panic'i (CLAUDE.md 5.6)
  ART ARDA 2 KEZ daha tetiklendi — `Gauge` ve `Waypoints` ikonları. İkisi de
  sırasıyla `Activity` ve `Route` ile (bu dosyada zaten güvenli olduğu
  kanıtlanmış ikonlar) değiştirildi, dev sunucusu her seferinde yeniden
  başlatıldı. **Ders (gelecekteki ekranlar için):** Bu projede rastgele yeni
  bir lucide-react ikonu import etmek yerine, mümkünse bu oturumda zaten
  kullanılıp panic vermediği KANITLANMIŞ bir ikonla (X, Timer, Footprints,
  ArrowRight, Play, Activity, Square, Zap, AlertTriangle, Pause, Target,
  Clock, ChevronRight, Route, PawPrint, CheckCircle2, Loader2, Check, MapPin,
  Flame, Calendar) aynı işi yapmaya çalışmak, gereksiz dev-server
  restart'larından kaçınmanın en pratik yolu.
  Gerçek SQL ile 2 test yürüyüşü (bugün + geçen ay, gerçek çoklu-nokta GPS
  path'i) eklenip her iki ekran da canlı doğrulandı, sonra (bu oturumun diğer
  Playwright testlerinden kalan 20 sahte satırla birlikte, toplam 22 satır)
  temizlendi.
- ✅ **Ekran 10 (`/walk` hub) TAMAMLANDI — 🔴🔴 en büyük mimari karar uygulandı**
  (2026-09-24, `walk/page.tsx` BAŞTAN yazıldı): Hava küresi, "Dostum" pet durum
  kartı, "Bugünkü Hedef" bölümü ve gömülü Sıralamalar TAMAMEN KALDIRILDI — sayfa
  artık referanstaki gibi SADECE dönem-seçicili bir istatistik analiz ekranı.
  Yeni yapı: 1 Hafta/1 Ay/3 Ay/1 Yıl dönem sekmeleri (gerçek `walkHistory`
  filtrelemesi) → 3'lü özet (Toplam Mesafe/Yürüyüş Sayısı/Toplam Süre) → bar
  grafiği (1 Hafta: günlük, 1 Ay: haftalık, 3 Ay/1 Yıl: gerçek takvim ayı
  bazlı) → "Ortalama Değerler" (mesafe/süre/kalori) → ay-ay karşılaştırma
  içgörü kartı (gerçek bu-ay-vs-geçen-ay hesaplaması, geçen ay veri yoksa kart
  hiç gösterilmiyor — uydurma %∞ yok). Kontrol Merkezi kısayolları (referansta
  yok ama her ekranın bir yerden ulaşılması gerektiği için tutuldu) artık 2x2
  grid: Rozetlerim/Ödül Marketi/Meydan Okumalar/**Sıralamalar (YENİ)** + ayrı
  bir "Yürüyüş Geçmişi" tam-genişlik bağlantısı (Ekran 8'e, önceden `/walk`
  hub'ından hiç ulaşılamıyordu, tek yolu unutulmuş bir profil sekmesiydi).
  🔴 **Bu değişiklik Ekran 12'yi (Sıralamalar) de gerektirdi**: gömülü
  `LeaderboardSection`'ı bir kısayola çevirebilmek için önce onun GERÇEK,
  bağımsız bir sayfası olması gerekiyordu — YENİ `src/app/walk/leaderboard/
  page.tsx` eklendi (`LeaderboardSection.tsx`'i saran ince bir header/geri
  butonu kabuğu; component'in kendisi zaten Faz 13'te referansa göre
  kurulmuştu, sadece bağımsız bir route'u yoktu).
- ✅ **Ekran 12 (Sıralamalar) TAMAMLANDI** (2026-09-24, `LeaderboardSection.tsx`
  + yeni `walk/leaderboard/page.tsx`): Sosyal sekme sırası Arkadaşlarım/Aynı
  Şehir/Herkes'e çevrildi (önceden Herkes/Arkadaşlarım/Aynı Şehir). Podyumun
  üstüne "Aktif Patiler (Toplam Mesafe)" açıklayıcı etiketi eklendi (skor
  biriminin ne olduğu artık net). Artık `/walk` hub'ından gerçek bir kısayolla
  erişilebiliyor.
  Gerçek SQL ile 12 aylık, ~40 satırlık gerçekçi bir yürüyüş geçmişi eklenip
  4 dönem sekmesi de (1H/1A/3A/1Y bar grafikleri, ay-ay karşılaştırma) ve
  Sıralamalar sayfası canlı Playwright ile doğrulandı, sonra temizlendi.
- ✅ **Ekran 11 (Meydan Okumalar) TAMAMLANDI** (2026-09-24,
  `QuestEngineContext.tsx` + `challenges/page.tsx`): Her kartın sağına gerçek
  bir ödül etiketi eklendi (+500 Puan/+150 Puan/+Rozet/+200 Puan). YENİ "Seri
  Ustası" kartı eklendi (aralıksız 7 gün, zaten var olan `walkStats.
  currentStreak`'ten, `week_fire` rozetiyle eşleştirildi — yeni altyapı
  gerekmedi). "Şehir Gezginleri" kartı bilerek sadece rozet veriyor (PP yok) —
  legendary nadir bir başarı olduğu için.
  🔴 Gerçek yeni ödül mekanizması: meydan okumalar önceden SADECE rozet
  veriyordu, PP hiç vermiyordu (referans PP de veriyormuş gibi gösteriyor).
  Artık tamamlanan meydan okumalar `awardReward()` ile GERÇEK Moffi Puanı da
  veriyor — `awardReward`'ın kendi `notifiedRef` Set'i (questId başına bir
  kez) zaten idempotent olduğu için iki kez ödül verilmiyor, günlük 200 PP
  sınırı ve seviye çarpanı da (Faz 7'nin genel ekonomi kurallarıyla tutarlı
  şekilde) otomatik uygulanıyor.
- ✅ **Ekran 13 (Rozetler) TAMAMLANDI — 🔴🔴 en büyük bulgu uygulandı**
  (2026-09-24, `QuestEngineContext.tsx` + `badges/page.tsx`): Kilitli rozetler
  artık GERÇEK sayısal ilerleme gösteriyor (ör. "4/7 gün", "7.0/100 km",
  "0/5 yer") — Faz 13'te "sayacı doğrulamadan uydurma sayı göstermeyelim" diye
  bilinçli ertelenen şey, referansın açık isteği üzerine artık yapıldı.
  Sekmeler Tümü/Yürüyüş/Keşif/Seri'ye güncellendi (Sosyal ve Özel/gizli
  sekmeleri kaldırıldı — gizli rozetler hâlâ var, sadece kendi ayrı sekmeleri
  yok, "Tümü" ve ait oldukları tematik sekmede görünüyorlar).
  🔴 Yeni paylaşılan altyapı: `QuestEngineContext.tsx`'e `progressMetrics`
  (Ekran 11'in meydan okuma hesaplamalarıyla ORTAK, tek kaynak — iki ayrı
  kopya yerine) ve `badgeProgress` (badge id → {current,target,percent}
  haritası) eklendi. SADECE güvenilir/sürekli gerçek veriye sahip 7 rozet için
  hesaplanıyor (first_step/week_fire/month_fire/explorer_100/
  monthly_explorer/park_hopper/region_explorer) — sosyal/pet sayaçları ve
  zaman dilimi rozetleri (photographer, pet_care_week, morning_bird, vb.)
  için güvenilir bir sayaç olmadığından BİLEREK dışarıda bırakıldı, o
  rozetler hâlâ sadece isim+açıklama gösteriyor (referansın "Dağ Kaşifi"/"Ay
  Işığı Yürüyüşü" için yaptığı gibi, ilerlemesiz kilitli).
  Ekran 7'nin `getClosestBadgeProgress`'i de bu ortak `badgeProgress`
  haritasını kullanacak şekilde yeniden yazıldı (önceden kendi küçük, ayrı bir
  hesaplaması vardı — artık tek kaynak, iki farklı yerde aynı mantığın iki
  kopyası yok).
  Gerçek SQL ile birkaç günlük seri + ~7km toplam mesafe oluşturulup Tümü/Seri
  sekmeleri canlı doğrulandı (4/7 gün, 4/30 gün, 7.0/100 km gibi doğru
  fraksiyonlar), sonra temizlendi.
- ✅ **Ekran 14 (Ödül Marketi) TAMAMLANDI — 14 EKRANIN TAMAMI BİTTİ** (2026-09-24,
  `rewards/page.tsx`): Sekmeler referansa göre Tümü/Ürünler/Kuponlar/Özel'e
  yeniden sıralandı (önceden Tümü/Ürünler/Özel Deneyimler/Kuponlar'dı — "Özel
  Deneyimler" da "Özel"e kısaltıldı). YENİ "Öne Çıkanlar" bölümü eklendi
  (grid'den önce, gerçek bir liste — ikon+isim+fiyat+chevron). Öne çıkanlar
  gerçek, açıklanabilir bir kritere bağlı: en düşük fiyatlı (en kolay
  ulaşılabilir) 3 ürün — DB'de editöryel bir `is_featured` kolonu yok, uydurma
  bir seçim yapılmadı. Baran ileride elle seçilmiş bir liste isterse
  `reward_products`'a gerçek bir `is_featured boolean` kolonu eklenip bu
  kritere geçilebilir (bilinçli, dokümante edilmiş bir basitleştirme, unutulan
  bir şey değil).

## 🔴🔴 14 EKRANIN TAMAMI TAMAMLANDI (2026-09-24)

Baran'ın bu turdaki 3 talebinin üçü de karşılandı: (1) 14 ekranın tamamı
referans görsele göre yeniden inşa edildi, (2) navigasyon/geçiş sistemi kök
nedeniyle düzeltildi (phantom history state temizliği + gerçek
`AnimatePresence` cross-fade), (3) bu belge ve referans görsel kalıcı olarak
kilitlendi. Yol boyunca bulunan/düzeltilen gerçek hatalar: WalkQuickSheet'in 4
navigasyon noktasındaki onClose/router.push sıra hatası, React Strict Mode'un
İşleme Ekranı'nı sonsuza dek "işleniyor" durumunda kilitlemesi, `Circle`/
`Gauge`/`Waypoints` ikonlarının Turbopack+OneDrive panic'i tetiklemesi (CLAUDE.md
5.6'ya 3 yeni örnek eklendi), hedef döngüsünün ekrandaki değerle
senkronize olmaması. Meydan Okumalar artık gerçek PP ödülü de veriyor
(önceden sadece rozet), Rozetler artık gerçek sayısal ilerleme gösteriyor
(projenin en büyük, bilinçli ertelenmiş kararlarından birinin tersine
çevrilmesi), Sıralamalar artık kendi bağımsız sayfasına sahip.

**Bilerek kapsam dışı bırakılan / açık kalan noktalar** (küçük, dokümante
edilmiş, "Netleştirilmesi gereken açık sorular" bölümündeki 3 soru hâlâ
geçerli):
- Ana sayfa (`/home`) yürüyüş kartı bu turda ele ALINMADI (`home-final` kilidi
  nedeniyle, Baran'a sorulmadan dokunulmadı).
- Ekran 9'daki "Hava" ve "Fotoğraflar" alanları dürüstçe eklenmedi (gerçek
  altyapı yok).
- Ekran 13'te sadece 7 rozet için gerçek ilerleme var; sosyal/pet/zaman
  dilimi rozetleri hâlâ ilerlemesiz (güvenilir sayaç yok).
- `LiveMap`'in "API KEY REQUIRED" filigranı ve gömülü sahte POI'leri (8.1'de
  belgelendi) bu turun kapsamı dışında kaldı, ayrı ele alınmalı.

## Ekran ekran döküm (1-14, sıra referanstaki gibi)

Her ekran için: **Mevcut durum** (şu an kodda ne var, varsa) + **Referans**
(görselde tam ne görünüyor) + **Fark/Aksiyon**.

### 1. Ana Sayfa (Yürüyüş Kartı) — `/home` sayfasındaki widget
**Referans:** Üstte "Moffi🐾" logosu + bildirim zili + profil avatarı. Altında
tam genişlik, yuvarlak köşeli bir köpek fotoğrafı (koşan golden retriever,
yeşil çim alanda). Fotoğrafın altına oturan beyaz kart: "Bugünkü Yürüyüş"
başlığı + "Luna bugün seni bekliyor! Hadi biraz dışarıya çıkalım." alt metni.
Sağda yeşil dairesel ilerleme halkası: ortasında "3,2 / 5 km" + "%64
tamamlandı". Altında 4'lü istatistik satırı (Süre 28dk, Kalori 142, Kalan
1,8km, Moffi Puanı +40 — her biri kendi ikonuyla). Tam genişlik kırmızı-turuncu
"Yürüyüşe Başla" butonu. Altında "Son Yürüyüş" satırı (küçük pet avatarı +
"Dün · 4,1 km · 36 dk" + chevron). En altta 5 öğeli alt nav: Ana Sayfa /
Topluluk / (ortada kırmızı halka içinde 🐾 buton) / Keşfet / Profil.
**Fark/Aksiyon:** Bu, `design-reference/home-final/`'da zaten KİLİTLİ olan ana
sayfa tasarımının "Bugünkü Yürüyüş" kartıyla aynı konsept (bkz. o klasörün
"AÇIK İŞ" notu — 3 durum konsepti vardı: lapsed/normal/active, sadece
"Normal" HTML'e dökülmüştü). Bu görsel o "Normal" durumun GÜNCEL, dairesel
ilerleme halkalı versiyonu gibi duruyor. Ana sayfa `home-final` kilidinin
sorumluluğunda — bu tur SADECE `/walk/*` sayfalarına odaklanıyor, ama kart
buradaki halka/istatistik detaylarıyla TUTARLI olmalı. Ana sayfaya dokunmadan
önce Baran'a bu kartın güncellenip güncellenmeyeceği sorulmalı (home-final
kilidini bozmadan).

### 2. Yürüyüşe Hazırlık — `WalkQuickSheet.tsx` (şu an "Hazırlık Paneli")
**Mevcut durum:** Büyük mesafe göstergesi yok (yürüyüş başlamadan önce), hava
durumu satırı, "Yürüyüş Hazırlığı" kontrol listesi (Kaka Poşeti/Su Matarası/
Tasma & Kayış — 3 ikon buton, işaretlenebilir ama işlevsiz bir hatırlatma),
tek dokunuşla "Yürüyüşe Başla" butonu.
**Referans:** Başlık "Yürüyüşe Hazırlık". Tam genişlik köpek fotoğrafı (yakın
plan, gülümseyen golden retriever). Fotoğrafın altına oturan kart: "Luna ile
Yürüyüş" başlığı. İki istatistik yan yana: "5 km / Bugünkü hedef" (hedef
ikonu) ve "45-60 dk / Tahmini süre" (saat ikonu). Turuncu/amber bir uyarı
kutusu: "GPS konumunuz yürüyüş sırasında kullanılacaktır. Mesafe, rota ve
aktivite verilerini hesaplamak için gereklidir." "Yürüyüş Ayarları" başlığı +
3 satır (her biri ikon + etiket + değer + chevron): "Hedef: 5 km", "Pet:
Luna", "Rota türü: Serbest yürüyüş" — HER SATIR TIKLANABİLİR (değiştirilebilir
ayar). Altta tam genişlik "Yürüyüşe Başla" butonu.
**Fark/Aksiyon:** 🔴 YAPISAL DEĞİŞİKLİK. Poşet/su/tasma kontrol listesi
(zaten işlevsiz bir hatırlatmaydı, CLAUDE.md 8.1'de "engel değil, isteğe
bağlı" diye not edilmişti) TAMAMEN KALDIRILACAK, yerine referanstaki 3
gerçek ayar satırı (Hedef/Pet/Rota Türü) gelecek — bunlar GERÇEK, düzenlenebilir
ayarlar olmalı (mevcut `customTargetKm`/`isCustomTargetEnabled` state'i zaten
var, "Hedef" satırına bağlanabilir; "Pet" satırı zaten var olan `PetSwitcher`/
`usePet()` ile bağlanmalı; "Rota türü" YENİ bir kavram — gerçek bir rota-türü
sistemi yoksa (yok), en azından "Serbest Yürüyüş" tek seçenek olarak dürüstçe
gösterilmeli, sahte seçenek uydurulmamalı). GPS uyarı kutusu gerçek
`walkIssue`/izin durumuyla bağlanmalı (zaten `WALK_ISSUE_LABELS` var).
"Tahmini süre" (45-60 dk gibi bir aralık) — gerçek geçmiş yürüyüş hızından
tahmin edilebilir (walkStats ortalama hız varsa) ya da dürüst bir sabit
aralık olarak bırakılabilir, uydurma kesin bir sayı verilmemeli.

### 3. Aktif Yürüyüş — `/walk/tracking/page.tsx`
**Mevcut durum:** Zaten OLDUKÇA yakın: GPS İyi/hava/dakika pilleri, harita,
alt kart (km büyük sayı, süre+kalori, hedefe kalan + ilerleme çubuğu),
Duraklat (turuncu, dolu) + Yürüyüşü Bitir (soluk kırmızı, ikincil) butonları.
**Referans:** Aynı yapı ama harita AÇIK/gündüz temalı (bizim mevcut haritamız
hangi temayı kullanıyor kontrol edilmeli — referans karanlık değil), rota
çizgisi kırmızı/turuncu, başlangıç noktasında pet fotoğraflı yuvarlak marker.
Duraklat butonu SİYAH/koyu (turuncu değil!) — bizim mevcut buton turuncu.
**Fark/Aksiyon:** Küçük ayarlar — Duraklat butonunun rengini referanstaki gibi
koyu/siyah yapmak (şu an turuncu), harita temasını kontrol etmek. Genel yapı
zaten doğru, büyük bir yeniden inşa gerekmiyor.

### 4. Duraklatılmış Durum — aynı tracking sayfası, `walkData.isPaused`
**Mevcut durum:** Harita üzerinde koyu (siyah/55 opaklık) tam ekran örtü +
ortada beyaz duraklat ikonu + "Yürüyüş Duraklatıldı" yazısı. Alt kart hâlâ
görünür değil (örtü onu da kaplıyor gibi mi, kontrol edilmeli).
**Referans:** Harita hâlâ görünür (tam siyah örtü YOK), üstte küçük bir beyaz
duraklat ikonu dairesi + rota çizgisi hâlâ görünüyor. Alt kart: "⏸ Yürüyüş
Duraklatıldı" + "3,24 km · 28:14 · 142 kcal" satırı tek satırda özet. "▶ Devam
Et" (turuncu/kırmızı dolu) + "Yürüyüşü Bitir" (soluk pembe, ikincil) butonları.
**Fark/Aksiyon:** Şu anki tam ekran koyu örtü yerine, referanstaki gibi DAHA
HAFİF bir duraklatma göstergesi (harita hâlâ net görünür durumda, sadece küçük
bir rozet/ikon) + alt karttaki özet satırının "Yürüyüş Duraklatıldı" ifadesiyle
birleştirilmesi. Buton dizilimi zaten doğru.

### 5. Bitirme Onayı — YENİ bir modal olarak inşa edilmeli
**Mevcut durum:** Bitirme onayı şu an alt sheet İÇİNDE, inline bir metin +
buton değişimi olarak gösteriliyor (harita/sheet yapısı aynı kalıyor, sadece
buton satırı "Vazgeç/Evet Bitir"e dönüşüyor).
**Referans:** GERÇEK BİR MODAL/DIALOG — harita arka planda KARARTILMIŞ
(dim overlay) görünüyor, ortada yüzen bir kart: X kapatma ikonu (sağ üst),
ortada bir ikon (duraklat sembolü içeren daire), "Yürüyüşü bitirmek
istediğinize emin misiniz?" başlığı, "3,24 km Mesafe" + "28 dk Süre" iki
istatistik yan yana, "Yürüyüşü Bitir" (kırmızı, dolu, tam genişlik) butonu,
altında "Devam Et" (soluk/beyaz, ikincil) butonu.
**Fark/Aksiyon:** 🔴 YAPISAL DEĞİŞİKLİK. Inline buton-değişimi yerine gerçek bir
`AnimatePresence` modal'a çevrilmeli (Ödül Marketi'nde zaten kurduğumuz spring
modal deseniyle aynı yaklaşım) — harita arkada kararmış görünmeli, X ile
kapatılabilmeli (şu an sadece "Vazgeç" butonu var, X yok).

### 6. İşleme Ekranı — TAMAMEN YENİ, hiç yok
**Referans:** Başlık "Luna ile Yürüyüş" (aynı üst bar). Yaprak/doğa temalı
mutlu bir köpek fotoğrafı. "Yürüyüşün hesaplanıyor..." başlığı + "Rota ve
istatistikler oluşturuluyor." alt metni. Sırayla 4 madde, her biri bir durum
ikonuyla (✅ yeşil tamamlandı / 🔵 mavi işleniyor / ⚪ gri beklemede):
"GPS verileri işleniyor", "Mesafe hesaplanıyor", "Kazanımlar hazırlanıyor",
"Rozet kaydediliyor". Buton yok — otomatik olarak Yürüyüş Sonucu'na geçiyor
olmalı.
**Fark/Aksiyon:** 🔴 YENİ EKRAN. `handleFinish`/`handleStopWalk` çağrıldıktan
sonra, `/walk/summary`'e YÖNLENDİRMEDEN ÖNCE bu ekranı kısa bir süre (gerçek
işlemlerin (rozet kontrolü, PP hesaplama, DB'ye yazma) fiilen ne kadar
sürdüğüne göre, sahte bir "processing" gecikmesi UYDURMADAN — zaten yapılması
gereken gerçek async işlemler bu ekranda gösterilecek) göstermek için yeni bir
route (`/walk/processing` gibi) veya aynı sayfa içinde bir ara state olarak
inşa edilmeli. Adımlar gerçek işlem sırasına denk gelmeli: (1) stopWalk() DB
yazımı = "GPS verileri işleniyor", (2) mesafe/kalori hesaplama = "Mesafe
hesaplanıyor", (3) awardReward/PP hesaplama = "Kazanımlar hazırlanıyor", (4)
awardBadge kontrolü = "Rozet kaydediliyor". Gerçek async adımların sırasını
ve süresini yansıtmalı, sabit/uydurma bir "2 saniye bekle" ekranı OLMAMALI —
her adım gerçekten o iş bitince yeşile dönmeli.

### 7. Yürüyüş Sonucu — `/walk/summary/page.tsx`
**Mevcut durum:** "Harika bir yürüyüş! 🎉" + pet foto (dairesel, konfeti
parçacıkları) + 2x2 istatistik grid (km/süre/kalori/adım) + "Günlük Hedef"
çubuğu + "Kazandıklarınız" (sadece gerçekten kazanılanlar: PP/Seri/Rozet, en
fazla 3 öğe) + "Bu Yürüyüşü Kaydet" butonu.
**Referans:** "Harika bir yürüyüş!" başlığı + HEMEN ALTINDA büyük "3,82 km"
yazısı (bizde bu km, 2x2 gridin İÇİNDE küçük, referansta başlığın hemen
altında BÜYÜK öne çıkan tek sayı). 3'lü istatistik satırı (Süre/Kalori/Adım —
km ayrı zaten gösterildiği için burada tekrar yok). "Günlük hedef %76" +
çubuk + "3,82 / 5 km" alt yazı. "Bugünkü kazanımlarınız" başlığı + 2x2 GRID
(4 öğe, bizde 3 öğelik tek satır): "+40 Moffi Puanı", "4 Gün Seri", "Rozet
İlerlemesi", "Haftalık Hedef %76". Buton metni "Tamam" (bizde "Bu Yürüyüşü
Kaydet").
**Fark/Aksiyon:** 🟡 Orta değişiklik. (a) Büyük km sayısını başlığın hemen
altına, öne çıkan tek bir eleman olarak taşı (2x2 gridden çıkar, sadece
süre/kalori/adım kalsın 3'lü satırda). (b) "Kazandıklarınız"ı 3'lü tek
satırdan 2x2 grid'e çevir, 4. öğe olarak "Rozet İlerlemesi" (en yakın
kazanılmamış rozetin ilerlemesi, gerçek veriden) ve "Haftalık Hedef %X"
(gerçek `weeklyStamps`/`maxWeeklyStamps` sisteminden) ekle — HER İKİSİ DE
gerçek veriden, uydurma değil. (c) Buton metnini "Tamam" yap — bu, kaydetmenin
zaten İşleme Ekranı'nda (madde 6) olduğu varsayımıyla tutarlı, buton artık
sadece "anladım, devam" işlevi görüyor (zaten CLAUDE.md 8.1'de bu butonun
"gerçek bir onay kapısı olmadığı" not edilmişti — referans bunu isim
değişikliğiyle DOĞRU şekilde çözüyor, "Kaydet" yerine "Tamam" demek daha
dürüst çünkü kayıt zaten önceden oldu).

### 8. Yürüyüş Geçmişi — `/walk/history/page.tsx`
**Mevcut durum:** Sekme yok, tek düz liste (tarih rozetli kart + rota SVG
önizlemesi + adım/süre/mesafe 3'lü satır).
**Referans:** "Tümü / Bu Ay / Bu Yıl" sekmeleri (bizde YOK). Aya göre
gruplandırılmış başlıklar ("Eylül 2026", "Ağustos 2026"). Her satır: küçük
kare rota-thumbnail'i (sol) + göreli tarih ("Bugün", "Dün", "20 Eyl", "18 Eyl",
"14 Ağu") + "3,82 km · 42 dk · 216 kcal" + altında küçük "5.843 adım" satırı +
sağda chevron. Bizim kartlarımız daha büyük/kare thumbnail (SVG geniş
önizleme), referans daha KOMPAKT bir liste satırı (küçük kare thumbnail +
metin, Apple Health/Strava tarzı).
**Fark/Aksiyon:** 🔴 YAPISAL DEĞİŞİKLİK. (a) "Tümü/Bu Ay/Bu Yıl" filtre
sekmeleri eklenmeli (gerçek tarih filtrelemesi, `walkHistory`'den). (b) Ay
bazlı gruplama eklenmeli (`Eylül 2026` gibi başlıklar, gerçek `started_at`/
`ended_at`'tan hesaplanan ay-yıl grupları). (c) Kart tasarımı büyük SVG
önizlemeli karttan, kompakt liste satırına (küçük kare thumbnail + metin)
çevrilmeli. (d) Göreli tarih etiketleri ("Bugün"/"Dün") eklenmeli.

### 9. Yürüyüş Detayı — `/walk/history/[id]/page.tsx`
**Mevcut durum:** Gerçek harita (LiveMap, statik mod) + tarih + pet satırı +
2x2 istatistik grid (km/süre/kalori/adım).
**Referans:** Harita kartının köşesinde "+" (zoom) ve dişli (ayarlar) ikonları
var. Tarih + saat aralığı ("12 Eylül 2026, Salı" + "09:14 - 09:56" — bizde
sadece tek bir tarih var, saat ARALIĞI yok). 3'lü istatistik satırı (km/dk/
kcal — adım satırdan çıkmış). YENİ bir "Ortalama hız / Maks. hız / Rota Türü /
Hava" 2x2 bilgi satırı. YENİ bir "Fotoğraflar" bölümü (thumbnail satırı).
**Fark/Aksiyon:** 🔴 Genişletme gerekiyor. (a) Saat aralığını göster (start_time
- end_time, ikisi de zaten DB'de var). (b) Ortalama/maks hız hesapla (gerçek
GPS path'ten hesaplanabilir — path noktaları arası mesafe/zaman farkından,
ya da basitçe toplam mesafe/toplam süre ile ortalama, maks için ardışık
noktalar arası en yüksek hız). Rota türü (madde 2'deki gibi, şimdilik tek
seçenek "Serbest Yürüyüş" dürüstçe gösterilebilir). Hava — o anki yürüyüşün
hava durumu DB'de KAYDEDİLMİYOR şu an, bu yüzden geçmiş bir yürüyüş için
gerçek "o günkü hava" gösterilemez — bu alan ya eklenmemeli (dürüstlük) ya da
yürüyüş sırasında hava verisini DB'ye kaydetmeye başlamak gerekir (yeni bir
migration + `updateWalkLocation`/`stopWalk`'a hava parametresi eklemek —
gerçek ama daha büyük bir iş). (c) Fotoğraflar — gerçek bir yürüyüş fotoğrafı
ekleme özelliği YOK şu an; bu, yeni bir upload akışı + storage + DB kolonu
gerektiren GERÇEK bir yeni özellik, uydurma dummy fotoğraf KOYULMAMALI, özellik
yoksa bölüm dürüstçe gizlenmeli (fotoğraf varsa göster, yoksa bölümü hiç
render etme) ta ki gerçek upload akışı kurulana kadar.

### 10. Yürüyüş İstatistikleri — `/walk/page.tsx` (hub)
**Mevcut durum:** Hava küresi + pet durum kartı + "Bugünkü Hedef" (mesafe/süre)
+ "Son 7 Gün" grafiği + "Tüm Zamanlar" (toplam/en uzun/en iyi seri) + Kontrol
Merkezi kısayolları (Rozetler/Ödül/Meydan Okuma) + gömülü Sıralamalar.
**Referans:** Bambaşka bir odak — SADECE istatistik analizine adanmış bir
ekran. "1 Hafta / 1 Ay / 3 Ay / 1 Yıl" DÖNEM SEÇİCİ sekmeleri (bizde YOK —
bizim "Son 7 Gün" grafiğimiz sabit, dönem değiştirilemiyor). 3'lü özet satırı:
"68,4 km Toplam Mesafe", "12 Yürüyüş Sayısı", "8s 24dk Toplam Süre". Bar
grafiği (seçili döneme göre haftalar/aylar). "Ortalama Değerler" başlığı +
3'lü satır: "4,8 km Ortalama mesafe", "42 dk Ortalama süre", "238 kcal
Ortalama kalori". YENİ bir "karşılaştırma" kartı: "Bu ay geçen aya göre %18
daha fazla yürüdünüz." (pozitif/yeşil vurgulu, gerçek ay-ay karşılaştırmasından
hesaplanmalı). Hava küresi, pet durum kartı, Kontrol Merkezi kısayolları VE
gömülü Sıralamalar bu ekranda YOK.
**Fark/Aksiyon:** 🔴🔴 EN BÜYÜK YAPISAL KARAR. Bu ekran referans görselde
gördüğümüz diğer TÜM alt-ekranlardan (Geçmiş/Meydan Okumalar/Sıralamalar/
Rozetler/Ödül Marketi) ayrı, kendi başına duran, odaklanmış bir ekran. Şu anki
`/walk` hub'ımız bunların hepsini TEK sayfada topluyor (bir "her şey burada"
yaklaşımı). Referans, bunun yerine HER BİRİNİN kendi ayrı ekranı olduğunu
gösteriyor. **Karar (Baran'la netleştirilmedi, ama en tutarlı yorum):**
`/walk` sayfası, referansın 10. ekranına (dönem seçici + özet + grafik +
ortalamalar + karşılaştırma) dönüştürülecek — hava küresi/pet durum kartı bu
odaklı istatistik ekranından çıkarılacak (ya ayrı bir yere taşınacak ya da
tamamen kaldırılacak, hava zaten `/walk/tracking` sırasında gösteriliyor).
Diğer ekranlara (Geçmiş/Meydan Okumalar/Sıralamalar/Rozetler/Ödül Marketi)
ulaşmak için Kontrol Merkezi kısayolları BU sayfada (istatistiklerin altında,
navigasyon amaçlı) kalabilir — referans bunları göstermiyor ama her ekranın
BİR YERDEN ulaşılması gerektiği açık, bu en mantıklı yer. Gömülü Sıralamalar
listesi buradan ÇIKARILIP sadece kısayol haline getirilmeli (zaten ayrı, tam
bir Sıralamalar ekranımız var - madde 12).

### 11. Meydan Okumalar — `/walk/challenges/page.tsx`
**Mevcut durum:** Aktif/Yaklaşan/Tamamlanan sekmeleri (referansla AYNI!).
3 kart (aylık 100km, haftalık 5 farklı yer, 10 farklı bölge), her biri ikon+
başlık+açıklama+ilerleme çubuğu+fraksiyon.
**Referans:** Aynı 3 sekme. Kartlarda EK olarak sağ tarafta bir "ödül" rozeti
(örn. "+500 Puan", "+150 Puan", "+Rozet", "+200 Puan") — bizde bu ödül etiketi
YOK, sadece ilerleme fraksiyonu var. Kart başlıkları da biraz farklı: "Eylül
Yürüyüş Ayı" (bizde "Eylül Yürüyüş Meydan Okuması"), "Haftalık Patili
Dostlar" (aynı), + 2 EK kart: "Park Kaşifi" ve "Seri Ustası" (bizde sadece 3
kart var, referans 4 gösteriyor — ama "Park Kaşifi" muhtemelen bizim "haftalık
farklı yer" kartıyla aynı kavram, isim farkı olabilir; "Seri Ustası" tamamen
YENİ, "aralıksız 7 gün yürü" - zaten `currentStreak` verisi var, kolayca
eklenebilir).
**Fark/Aksiyon:** 🟡 Orta değişiklik. (a) Her karta sağda gerçek bir ödül
etiketi ekle (mevcut `Challenge` tipine `rewardLabel` gibi bir alan ekleyip,
zaten var olan `badgeId`'den türetilebilir: rozet varsa "+Rozet", yoksa
awardReward ile verilecek gerçek PP miktarını "+X Puan" olarak göster — bu
YENİ bir gerçek ödül mekanizması gerektirir, şu an meydan okuma tamamlanınca
SADECE rozet veriliyor, PP verilmiyor; referans PP de veriyormuş gibi
gösteriyor, bu yüzden gerçek PP ödülü de eklemek gerekebilir). (b) "Seri
Ustası" (7 günlük kesintisiz seri) kartını ekle — gerçek `walkStats.
currentStreak` verisiyle kolayca kurulabilir.

### 12. Sıralamalar — `LeaderboardSection.tsx`
**Mevcut durum:** Bu Hafta/Bu Ay/Tüm Zamanlar + Herkes/Arkadaşlarım/Aynı Şehir
sekmeleri, podyum + liste + sabit "Sen" satırı. YAPISAL OLARAK REFERANSLA
NEREDEYSE BİREBİR AYNI (Faz 13'te zaten bu görsele göre kurulmuştu)!
**Referans:** Aynı yapı, sadece sekme SIRASI farklı (Arkadaşlarım/Aynı Şehir/
Herkes — bizde Herkes/Arkadaşlarım/Aynı Şehir) ve podyumun üstünde EK bir
"Aktif Patiler (Toplam Mesafe)" etiketi var (bizde yok, skor birimi neyin
gösterildiği açık değildi).
**Fark/Aksiyon:** 🟢 Küçük değişiklik. (a) Sosyal sekme sırasını referansa göre
değiştir (Arkadaşlarım/Aynı Şehir/Herkes). (b) Podyumun üstüne "Aktif Patiler
(Toplam Mesafe)" gibi açıklayıcı bir etiket ekle.

### 13. Rozetler — `/walk/badges/page.tsx`
**Mevcut durum:** Tümü/Yürüyüş/Keşif/Sosyal/Özel (5 sekme). Kilitli rozetler
sadece isim+açıklama gösteriyor, SAYISAL İLERLEME YOK (Faz 13'te bilerek
ertelenmişti, "her rozetin gerçek sayacını doğrulamadan uydurma sayı
göstermemek için").
**Referans:** Tümü/Yürüyüş/Keşif/Seri (4 sekme — "Sosyal" ve "Özel" YOK, "Seri"
var). Kilitli rozetler GERÇEK SAYISAL İLERLEME gösteriyor: "5K Ustası: 4,3/5
km", "10 Gün Serisi: 4/10", "50K Kulübü: 12/50 km", "Park Kaşifi: 2/3 park",
"Şehir Gezgini: 1/5", "Maraton Patisi: 0/100 km" — bazıları henüz "Yakında"
(kilidi tamamen kapalı, ilerleme bile gösterilmiyor: "Dağ Kaşifi", "Ay Işığı
Yürüyüşü"). Kazanılan rozet ("İlk Adım") yeşil "kazanıldı" metniyle işaretli.
**Fark/Aksiyon:** 🔴🔴 EN BÜYÜK BULGU. Faz 13'te "güvenilir şekilde
doğrulamadan sayı göstermeyelim" diye ERTELENEN şey, Baran'ın referansında
AÇIKÇA isteniyor — yani bu artık ertelenmiş değil, YAPILMASI GEREKEN bir iş.
Her rozet için GERÇEK bir alt sayaç bulunup/oluşturulup bağlanmalı:
- "5K Ustası" (X/5 km) → muhtemelen "tek bir yürüyüşte 5km" hedefi, canlı
  walkData.distance ya da en uzun yürüyüş (`walkStats.longestWalkKm`).
- "10 Gün Serisi" (X/10) → `walkStats.currentStreak` (zaten var).
- "50K Kulübü" (X/50 km) → `walkStats.totalDistanceKm` (zaten var, lifetime).
- "Park Kaşifi" (X/3 park) → Faz 18'de kurulan `countDistinctLocations`
  haversine kümeleme mantığı (zaten `challenges`'ta kullanılıyor, aynı
  hesaplama badge'e de bağlanabilir).
- "Şehir Gezgini" (X/5) → aynı kümeleme, farklı yarıçap/hedef.
- "Maraton Patisi" (X/100 km) → `walkStats.totalDistanceKm` (aynı 50K Kulübü
  gibi ama farklı eşik - muhtemelen ikisi farklı rarity/kademe).
Bu, `BADGE_POOL`'daki HER rozet için gerçek bir "current/target" hesaplama
fonksiyonu gerektiriyor (Faz 18'deki `updateMonthlyResearchProgress`'e benzer
bir desen, ama tüm rozet havuzuna genelleştirilmiş). Ayrıca sekmeler
Tümü/Yürüyüş/Keşif/Seri'ye güncellenip mevcut BADGE_POOL'daki `category`
alanları bu 4 sekmeye göre gözden geçirilmeli (bazı rozetler "social"
kategorisindeydi, "Seri" diye yeni bir kategori/filtre mantığı gerekebilir -
ya da "Seri" sadece streak-tipi rozetleri filtreleyen özel bir mantık).

### 14. Ödül Marketi — `/walk/rewards/page.tsx`
**Mevcut durum:** Tümü/Ürünler/Özel Deneyimler/Kuponlar sekmeleri, 2 sütunlu
GRID (tüm ürünler eşit ağırlıkta).
**Referans:** Tümü/Ürünler/Kuponlar/Özel (sekme sırası/isimleri hafif farklı).
Üstte "Öne Çıkanlar" (Featured) başlığı + bir LİSTE (grid değil) — her satır
soldan: küçük ikon/thumbnail + ürün adı + fiyat, sağda chevron. Bu, grid'den
ÖNCE gelen, öne çıkan/vurgulanan ürünler için ayrı bir bölüm.
**Fark/Aksiyon:** 🟡 Orta değişiklik. (a) Sekmeleri referansa göre yeniden
sırala/isimlendir (Tümü/Ürünler/Kuponlar/Özel). (b) "Öne Çıkanlar" bölümü
ekle — gerçek bir "öne çıkan" mantığı gerekiyor (örn. `reward_products`
tablosuna `is_featured boolean` kolonu eklenip birkaç ürün öne çıkarılabilir,
ya da basitçe en düşük fiyatlı/en popüler N ürün "öne çıkan" sayılabilir —
uydurma olmaması için gerçek bir kritere bağlanmalı).

## Genel gözlem: navigasyon/geçiş mimarisi

Referans görsel her ekranın kendi başlığı+geri oku+arama ikonuyla ayrı bir
"sayfa" olarak sunulduğunu gösteriyor — bu zaten bizim mevcut route yapımızla
(her biri `/walk/...` altında ayrı bir sayfa) uyumlu. Baran'ın asıl şikayeti
görsellerin İÇERİĞİ değil, aralarındaki GEÇİŞİN kalitesi: (1) geri tuşu bazen
yanlış yere gidiyor, (2) sekme değişimi sert/iki adımlı. Bu, ekran
tasarımlarından BAĞIMSIZ, ayrı bir teknik iş — bkz. CLAUDE.md'deki ilgili
bölüm (bu tur için araştırılıp kök nedeniyle düzeltilecek).

## Netleştirilmesi gereken açık sorular (Baran'a sorulabilir, varsayımla
ilerlenebilir ama not düşülmeli)

1. Ana sayfadaki (`/home`) yürüyüş kartı da bu turda güncellenecek mi, yoksa
   `home-final` kilidi bozulmadan sadece `/walk/*` mi ele alınacak?
2. Meydan Okumalar'a gerçek PP ödülü eklemek (şu an sadece rozet veriyor)
   kapsamda mı, yoksa sadece görsel "+X Puan" etiketi mi yeterli (gerçek PP
   vermeden)? (Öneri: gerçek PP vermeli, aksi "+40 Puan yazıp vermemek" gibi
   yanıltıcı bir UI olur — CLAUDE.md'nin ana felsefesine aykırı.)
3. Yürüyüş Detayı'ndaki "Hava" ve "Fotoğraflar" gerçek altyapı gerektiriyor
   (hava kaydı + foto upload) — bu turda mı yoksa ayrı bir faz olarak mı ele
   alınacak?
