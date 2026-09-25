# Moffi Veteriner Modülü — KİLİTLİ Referans (14 Ekran, 2026-09-25)

🔴 Baran'ın talimatı: "Verdiğim örnek uinin birebir aynısını yap... O görseli
kilitle, sohbet ne kadar uzasa da asla UI kaybolmasın." Bu klasör ve bu dosya
o kilit — herhangi bir ajan (bu sohbetteki Claude, editördeki Claude Code,
Antigravity) `/vet/*` altında UI değişikliği yapmadan önce bunu okumalı
(bkz. CLAUDE.md Bölüm 11, `home-final`/`walk-final` ile aynı desen).

**Kaynak görsel:** `vet-module-14-screens-reference.jpg` — Baran'ın verdiği,
14 ekranlık tam bir "Veteriner Bul & Randevu Al" akışı mockup'ı.

**Sıra:** önce bu 14 ekranın UI'sı BİREBİR bu görsele göre inşa edilecek
(gerçek veri OLMADAN, ya da minimal gerçek veriyle), SONRA gerçek sistem
(mevcut randevu/klinik altyapısı varsa ona bağlanacak, yoksa yeni kurulacak)
üzerine bağlanacak. Bu README'nin "Fark/Aksiyon" notları o ikinci faz içindir
— bugünün işi SADECE görsel/UI.

## Mevcut kod durumu (bağlanacak/incelenecek altyapı — bugünün kapsamı değil)

- `src/app/vet/page.tsx` — TEK var olan `/vet` rotası. Bu, görseldeki
  "klinik bul & randevu al" akışından FARKLI bir amaca hizmet ediyor: kullanıcının
  KENDİ pet'inin sağlık kayıtları (aşı/diş/ilaç/eczane modalları — VaccineModal,
  DentalCareModal, MedicationModal, PharmacyModal, bkz. CLAUDE.md Bölüm 5.3).
  Görseldeki modül muhtemelen YENİ bir `/vet/find` veya benzeri bir alt-rota
  ailesi olarak inşa edilmeli, mevcut `/vet` sayfasının yerini almadan.
- Randevu altyapısı KISMEN var: `src/components/vet/MyAppointmentsPanel.tsx`,
  `src/components/profile/AppointmentsTab.tsx`, `src/app/business/appointments/`,
  `src/actions/sendAppointmentEmail.ts` — bunların gerçek `appointments`
  tablosuyla nasıl çalıştığı, klinik biz aslında `profiles.business_type`
  (`vet` dahil) ile bir business hesabı mı, ayrı bir `clinics` tablosu mu var,
  UI inşa edilirken DEĞİL, sisteme bağlarken derinlemesine incelenmeli.
- Bu modülün UI'sı inşa edildikten sonra "zaten kurulu olanı bağlarız mı yoksa
  yeni mi kurarız" kararı Baran'la birlikte, gerçek altyapı incelendikten
  sonra verilecek — şimdiden varsayım yapılmadı.

## Tasarım Sistemi (Zemin/Renk/Tipografi)

Bu modül, `design-reference/home-final/`'da zaten KİLİTLİ olan ana sayfa
paletiyle GÖRSEL OLARAK TUTARLI — yeni bir palet icat edilmedi:

- **Zemin rengi:** krem/bej (home-final'daki `#F7F3EA` ailesi) — koyu/zinc
  değil, CLAUDE.md Bölüm 5'teki nötr tercih ile uyumlu.
- **Ana vurgu rengi:** kırmızı-turuncu/mercan (home-final'daki `#EE5B3D`
  ailesiyle aynı ton) — TÜM birincil CTA butonlarında ("Randevu Al", "Devam
  Et", "Uygula", "Yol Tarifi"), aktif filtre chip'lerinde, acil/SOS
  vurgularında kullanılıyor.
- **İkincil/başarı rengi:** yeşil — "Açık" durum noktası, "Onaylandı" rozeti,
  puan çubukları.
- **Amber/sarı:** acil durum uyarı kutuları (Ekran 12), yıldız/puan gösterimi.
- **Kart zemini:** beyaz, yuvarlak köşeler (`rounded-2xl`/`3xl` ailesi), yumuşak
  gölge — projenin genelindeki `bg-card`/`shadow-moffi-card` konvansiyonuyla
  birebir örtüşüyor.
- **Kategori ikonları:** yumuşak pastel yuvarlak kare arka planlar (Genel
  Muayene: nane yeşili, Acil Servis: kırmızı/pembe, Aşı: mavi, Diş Sağlığı:
  lavanta) — rozet/kozmetik sistemindeki rarity-renk mantığından bağımsız,
  sadece kategori ayrımı için.

## Ekran ekran döküm (1-14, sıra referanstaki gibi)

### 1. Ana Sayfa
Zaten var olan, `home-final` kilidindeki ana sayfa — sadece "Veteriner"
butonuna (5'li hızlı erişim ikonlarından biri, kırmızı daire) buradan kolay
erişildiğini gösteriyor. **Bu ekrana bugün DOKUNULMUYOR** (home-final'ın
sorumluluğunda).

### 2. Veteriner Ana Ekranı — arama & keşif
Başlık "Veteriner" + sağda bildirim zili. Altında konum satırı ("Konumun:
Kadıköy, İstanbul" + değiştir ikonu). Arama kutusu ("Veteriner, klinik veya
hizmet ara..."). 4'lü kategori kısayol ikonu (Genel Muayene / Acil Servis /
Aşı / Diş Sağlığı — her biri kendi pastel renginde yuvarlak kare). Filtre
chip satırı (Tümü / Yakınımda / Moffi Onaylı / Açık Olanlar — seçili olan
koyu/dolu). "Yakındaki Veterinerler" başlığı + sağda "Haritada Gör →" linki.
Alt tarafta dikey klinik kart listesi — her kart: yuvarlak klinik/doktor
fotoğrafı solda, sağda klinik adı + yıldız puanı + yorum sayısı + mesafe·süre
+ açık/kapalı durumu (yeşil nokta + "Açık · 24 saat" gibi).

### 3. Harita Görünümü
Başlık "Harita Görünümü" + geri ok + zil. Üstte yatay filtre sekmeleri (Tümü
/ Açık Olanlar / Acil Servis / Moffi Onaylı — ilki koyu/aktif). Tam ekran
harita, üzerinde yuvarlak klinik/doktor fotoğraflı pin'ler (gerçek konumları
temsil ediyor) + sağ altta zoom +/- kontrolleri. Alt kısımda sabit bir "seçili
klinik" kartı (fotoğraf + ad + puan + mesafe + durum) + tam genişlik turuncu
"Yol Tarifi" butonu.

### 4. Klinik Detayı
Geri ok + "Klinik Detayı" başlığı + paylaş ikonu. Üstte geniş bir klinik iç
mekan fotoğrafı. Altında: klinik adı + "Moffi Onaylı" rozeti (mavi/turkuaz
onay ikonu), yıldız puanı + yorum sayısı, "650m · 10dk · Açık 24 saat" satırı.
4'lü kategori ikon satırı (Genel Muayene/Acil Servis 24 Saat/Aşı/Diş Sağlığı).
Sekme çubuğu: Genel Bakış / Hizmetler / Yorumlar / Ekip (aktif olan alt çizgili).
"Genel Bakış" içeriği: klinik açıklama metni, "Adres" satırı, "Telefon" satırı
(gerçek tıklanabilir numara + telefon ikonu), "Web Sitesi" satırı (link).
En altta sabit iki buton: "Yol Tarifi" (outline) + "Randevu Al" (dolu,
turuncu, birincil CTA).

### 5. Randevu Al — hizmet/tarih/saat seçimi
Başlık "Randevu Al" + arama ikonu. Üstte yatay pet seçici (yuvarlak avatarlar
— "Luna" seçili/vurgulu halka ile, "Milo", "Pati", + yeni ekle butonu).
"Hizmet Seçimi" başlığı + dikey liste: her satır ikon + hizmet adı + fiyat·süre
+ sağda seçili olanı gösteren dolu turuncu daire/onay işareti (Genel Muayene
seçili). "Tarih Seçimi": yatay kaydırılabilir gün kartları (Bugün 12 Eyl
seçili/koyu, Yarın 13 Eyl, Pzt 15 Eyl, Sal 16 Eyl). "Saat Seçimi": 3x2 saat
grid'i (09:00, 10:00 seçili/dolu, 11:00, 14:00, 15:00, 16:00). En altta tam
genişlik "Devam Et" butonu.

### 6. Randevu Onay
Ortalanmış, büyük bir dairesel illüstrasyon (kırmızı ton, takvim+pati ikonu).
"Randevu onaylandı! 🐾" başlığı (kalın). Alt açıklama: "Tüm detaylar aşağıda,
randevu zamanı sana hatırlatma gönderilecek." Özet kart: klinik adı, hizmet
adı, tarih ("12 Eylül 2026, Salı"), saat ("10:00"), pet (avatar + "Luna").
3 aksiyon: "Takvime Ekle" (dolu, turuncu, birincil), "Randevu Detayını Gör"
(outline/ikincil), "Yol Tarifi Al" (düz metin link, ikonlu).

### 7. Randevularım
Başlık "Randevularım" + geri + zil. Sekmeler: Yaklaşan / Geçmiş (ilki
aktif/koyu). Randevu kartı: solda tarih+saat bloğu ("12 Eylül 2026" / "09:00"
gibi), klinik fotoğrafı, klinik adı, hizmet adı, pet avatarı + isim + sağda
yeşil "Onaylandı" rozeti. Kart altında iki link: "Detayları Gör" / "Yol
Tarifi". "Hatırlatmalar" bölümü: 3 satır toggle (24 saat önce hatırlat / 2
saat önce hatırlat / Randevu günü hatırlat — hepsi açık, yeşil switch). En
altta "Randevuyu İptal Et" (kırmızı, hafif/outline — yıkıcı aksiyon tonunda).

### 8. Klinik Yorumları
Başlık "Klinik Yorumları". Büyük ortalanmış puan: "4.9" + 5 yıldız + "128
yorum". Altında 5-4-3-2-1 yıldız dağılım çubukları (turuncu dolgu, oranla
orantılı genişlik). Filtre chip'leri: Tümü / En yeni / En yüksek / En düşük.
Yorum listesi: her biri kullanıcı avatarı + isim + "X gün/hafta önce" + 5
yıldız + yorum metni (gerçek, samimi dilde: "Luna'nın aşısı için gittik.
Doktor çok ilgili ve anlayışlıydı...").

### 9. Klinik Ekibi
Başlık "Klinik Ekibi" + alt açıklama cümlesi. Doktor listesi: yuvarlak
fotoğraf + "Vet. Hek. [Ad Soyad]" + uzmanlık etiketleri (örn. "Klinik
Kurucusu, Genel Cerrahi, İç Hastalıkları") — chevron ile detaya gidilebilir
görünümde. En altta "Klinikten Fotoğraflar" başlığı + yatay/grid küçük foto
önizlemeleri + "+8" gibi "daha fazla var" rozeti.

### 10. Sunulan Hizmetler
Başlık "Hizmetler". Dikey liste, her satır: renkli ikon (kategoriye özel) +
hizmet adı (kalın) + kısa açıklama (ince, gri) + sağda chevron. Örnekler:
Genel Muayene, Aşı Uygulamaları, Diş Sağlığı, Laboratuvar, Görüntüleme, Acil
Servis, Cerrahi, Mikroçip.

### 11. Favori Klinikler
Başlık "Favori Klinikler". Klinik kartları (Ekran 2'yle aynı kart tasarımı)
+ her kartın sağ üstünde dolu/kırmızı kalp ikonu (favorilenmiş durumunu
gösteriyor, dokununca favoriden çıkarılabilir olmalı).

### 12. Acil Veteriner
Başlık "Acil Veteriner". Üstte dikkat çekici kırmızı uyarı banner'ı ("Acil
Durum" + "Hızlıca en uygun veterineri bul." + uyarı ikonu). Filtre chip'leri:
En Yakın / 24 Saat Açık / Acil Servis. Klinik listesi (aynı kart deseni, ama
"Xdk" gibi ulaşım süresi öne çıkarılmış). En altta amber/sarı bir bilgi
kutusu: "Acil durumda ilk yardım adımları" + kısa açıklama + "Acil Durum
Rehberi" butonu (bu, Ekran 14'teki rehbere veya onun bir alt bölümüne
bağlanmalı).

### 13. Gelişmiş Filtreler
Başlık "Filtreler" (muhtemelen bir bottom-sheet/modal, sayfa değil). "Konum"
dropdown seçici. "Mesafe" için gerçek bir slider (0-5km aralığı gösteriliyor).
"Hizmet" başlığı altında çoklu-seçim checkbox listesi (Genel Muayene, Aşı
Uygulamaları, Diş Sağlığı, Acil Servis (24 Saat), Cerrahi, Laboratuvar,
Görüntüleme, Mikroçip — hepsi varsayılan işaretli görünüyor, muhtemelen
"hepsi seçili = filtre yok" durumu). En altta iki buton: "Temizle" (outline)
+ "Uygula" (dolu, turuncu).

### 14. Veteriner Rehberi
Başlık "Veteriner Rehberi". Üstte geniş, sıcak bir hero fotoğrafı (veteriner
+ köpek). "Veteriner Rehberi" başlığı + "Patili dostlarınızın daha sağlıklı
bir yaşam sürdürmesi için faydalı bilgiler" alt açıklaması (hero fotoğrafın
üzerine bindirilmiş, koyu gradient overlay ile okunur kılınmış). Filtre
chip'leri: Tümü / Sağlık / Aşı / Beslenme. Makale listesi: her satır ikon +
başlık ("Aşılar neden önemlidir?") + "Uzman görüşü · 5 dk okuma" alt bilgisi
+ chevron.

## Genel gözlemler (UI inşası sırasında akılda tutulmalı)

- **Kart deseni tutarlı:** Ekran 2, 3 (alt kart), 11, 12 hepsi AYNI klinik
  kart tasarımını (foto + ad + puan + mesafe + durum) kullanıyor — tek bir
  paylaşılan `ClinicCard` bileşeni olarak inşa edilmeli, 4 ayrı yerde
  kopyalanmamalı (CLAUDE.md Bölüm 7'deki "kod tekrarı" hassasiyeti).
- **Sekme deseni tutarlı:** Ekran 2 (filtre chip'leri), 3, 4 (Genel Bakış/
  Hizmetler/Yorumlar/Ekip), 8, 12, 13, 14 hepsi benzer bir yatay chip/sekme
  bileşeni kullanıyor — bu da paylaşılan bir bileşen olmalı.
- **Ekran 4'ün sekmeleri (Hizmetler/Yorumlar/Ekip) muhtemelen Ekran 10/8/9'un
  İÇİNE gömülü versiyonları** — yani 8/9/10 muhtemelen bağımsız sayfa değil,
  Ekran 4'ün bir klinik detayı içindeki sekme içerikleri olabilir. UI inşa
  edilirken bu ayrım (ayrı route mu, aynı sayfanın sekmesi mi) netleştirilmeli
  — şimdilik ikisi de mümkün, mockup'ta ayrı "ekran" olarak numaralanmış
  olması ayrı route anlamına gelmeyebilir.
- **Ekran 12'nin "Acil Durum Rehberi" butonu → Ekran 14** bağlantısı gerçek
  olmalı, ayrı/kopuk bir "yakında" placeholder'ı olmamalı.
