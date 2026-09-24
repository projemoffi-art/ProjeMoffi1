# Moffi Ana Sayfa — KİLİTLİ Tasarım Referansı

Bu klasör, Baran'ın üzerinde karar kıldığı **son, onaylı ana sayfa (`/home`) tasarımını**
içerir. Herhangi bir ajan (Claude Code, Antigravity) `/home` sayfasında UI değişikliği
yapmadan önce bu klasördeki referansı okumalı — tasarım kararları burada, tekrar
sorulmasına/tahmin edilmesine gerek yok.

## 🔴 ÖNCELİK SIRASI — hangi dosyaya güven

- `true-reference/reference-screen-1-ust.png` ve `reference-screen-2-alt.png` —
  Baran'ın gönderdiği GERÇEK, pixel-doğru referans (iPhone çerçeveli, gerçek
  fotoğraflarla). **Görsel stil/detay için birebir buna sadık kalınmalı.**
- `final-home-mockup.png` / `Final-Ana-Sayfa.dc.html` — bunlar Claude'un bu gerçek
  referanstan yola çıkarak ürettiği BASİTLEŞTİRİLMİŞ bir yeniden-yapım. İçerik/sayılar
  (3,2 km, hatırlatma tarihleri vb.) doğru ama görsel detayda `true-reference/`
  ile çelişirse HER ZAMAN `true-reference/` kazanır. Renk kodları/tipografi için
  yine de kullanılabilir ama tek başına yeterli değil.

**Bilinen somut farklar (`true-reference` ile bu basitleştirilmiş mockup arasında):**
1. `true-reference`'da "Moffi'den İlham"dan SONRA ikinci bir banner daha var:
   "Moffi ile her an yanında! / Sağlıklı patiler, mutlu insanlar" — gün batımı
   fotoğrafı (adam+köpek sırttan), sağ üstte "Daha çok keşfet, Daha çok mutlu ol"
   el yazısı tarzı metin. Bu, `Final-Ana-Sayfa.dc.html`'de HİÇ YOK.
2. "Senin İçin Öneriler" kartları `true-reference`'da GERÇEK ürün fotoğrafı + sağ
   üstte kalp (favori) ikonu + fiyatın yanında sepet ikonu kullanıyor — kategori
   gradyanı + emoji YANLIŞTI, o benim eksik referanstan kaynaklanan hataydı.
3. "Hızlı Erişim" `true-reference`'da TEK SIRADA 5 öğe (yatay), 3 sütun+2 satır grid değil.
4. Story ikonları `true-reference`'da daha "premium" — ACİL SOS gerçek bir siren/uyarı
   ikonu (emoji değil), Vet Tavsiyesi gerçek bir doktor fotoğrafı kullanıyor.

## Dosyalar

- `true-reference/` — 🔴 gerçek, pixel-doğru referans (yukarı bak).
- `final-home-mockup.png` — Claude'un ürettiği basitleştirilmiş render (390×3150).
  Sadece renk kodu/genel yapı için kullan, görsel detay için `true-reference`'a bak.
- `Final-Ana-Sayfa.dc.html` — o basitleştirilmiş mockup'ın kaynak HTML'i (renk kodları
  buradan okunabilir, ama yapı/detay için `true-reference` esas alınmalı).
- `photos/` — mockup'ta kullanılan fotoğraflar (header-hero, walk-normal/active/lapsed,
  game-center, ilham1-6, moffi_pet_trio). Bunlar gerçek `true-reference` fotoğraflarının
  birebir aynısı OLMAYABİLİR, sadece tarz/kadraj referansı olarak kullanılmalı.

## Tasarım Sistemi (Zemin/Renk/Tipografi)

- **Zemin rengi:** krem/bej `#F7F3EA` (koyu/zinc değil — bu sayfa CLAUDE.md'deki
  genel "zinc + tek aksan" kuralının bilinçli bir istisnası, sıcak/editoryal bir
  ana sayfa hissi hedefleniyor).
- **Ana vurgu rengi:** turuncu-kiremit `#EE5B3D` (CTA butonları, aktif nav ikonu,
  "Tümünü Gör" linkleri, rozet/etiketler).
- **İkincil renk:** yeşil `#8FD14F` (ilerleme çubukları, başarı/tamamlanma durumları).
- **Nötr metin/arka plan tonları:** `#201B16` (ana metin), `#6F675B` / `#8A8175` /
  `#9A9081` (ikincil metin), `#ECE6D9` (kart border), `#FFFFFF` (kart zemini).
- **Story-baloncuk renkleri (özel, sabit):** Yıldız Patiler `#E8A33D`, ACİL SOS
  `#D9432F`, Moffi Duyuru `#A7A6E0`, Vet Tavsiyesi `#7FC7B5`, Günün Fırsatı `#F0C94E`.
- **Başlık fontu:** Baloo 2 (700/800 ağırlık) — `.brand` class'ı.
- **Gövde fontu:** Nunito (400-800 ağırlık).

## Bölüm Sırası (yukarıdan aşağıya)

1. Header + karşılama ("Günaydın {isim}!") + bildirim zili + profil foto
2. Story baloncukları: Yıldız Patiler / ACİL SOS / Moffi Duyuru / Vet Tavsiyesi / Günün Fırsatı
3. "Bugünkü Yürüyüş" kartı (fotoğraf arka planlı, km/hedef, ilerleme çubuğu, süre/kalori/mesafe rozetleri)
4. İki kart yan yana: "Oyun Merkezi" (koyu, fotoğraflı) + "Görev Merkezi" (beyaz, seri/rozet)
5. "Hızlı Erişim" — TEK SIRADA 5 öğe (Kayıp&Sahiplen, Market/Petshop, Veteriner, Aşı Takvimi, Beslenme&Su) — bkz. yukarıdaki fark notu
6. "Senin İçin Öneriler" — yatay kaydırmalı, GERÇEK ürün fotoğraflı kartlar (kalp+sepet ikonlu) — bkz. yukarıdaki fark notu
7. "Hatırlatmalar" — aşı/ilaç/kontrol listesi, renkli "X gün kaldı" rozetleri
8. "Moffi'den İlham" — tam genişlik fotoğraf + alıntı sözü (Moffi imzalı)
8.5. "Moffi ile her an yanında!" — İKİNCİ bir tam genişlik banner, gün batımı fotoğrafı — sadece `true-reference`'da var, henüz uygulanmadı
9. Alt navigasyon: Ana Sayfa / Topluluk / (ortada kırmızı-turuncu 🐾 buton) / Keşfet / Profil

## Önemli not

Canlı `/home` sayfasında bu kilitli tasarımda **olmayan** bazı bölümler var (örn.
"Moffi Ekosistemi / Süper Uygulama" banner'ı, haftalık "Aktivite Raporu" grafiği).
Bu bölümlerin kalıp kalmayacağına, ya da nasıl uyarlanacağına Baran karar verecek —
bir ajan bunları kilitli tasarıma "sadakat" adına tek taraflı silmemeli/eklememeli,
önce Baran'a sorulmalı.

## AÇIK İŞ — "Bugünkü Yürüyüş" kartının duruma göre değişmesi (KARARA BAĞLANMADI)

Yürüyüş kartı için **duruma göre değişen fotoğraf/renk/metin** konsepti konuşulmuştu,
buna göre 3 foto hazırlandı: `photos/walk-lapsed.jpg`, `photos/walk-normal.jpg`,
`photos/walk-active.jpg`. Ama sadece **"Normal" durumu** (`Final-Ana-Sayfa.dc.html`
içinde "Durum 1 - Normal" yorumuyla işaretli, turuncu "Devam Et →" butonu) gerçekten
HTML mockup olarak tasarlanıp kilitlendi.

Diğer iki durum için sadece **konsept/ilham görselleri** var, hiç HTML'e dökülmedi —
`photos/walk-durum-konsept/` klasöründe:
- `walk-before-full.png` — "henüz başlamadı" durumu konsepti: karanlık/donuk fon,
  köpek yorgun yatıyor, "Biraz hareket iyi gelir...", "Seni bekliyorum" balonu,
  0,0 km / %0, soluk gri "Hadi yürüyüşe çık!" butonu.
- `walk-after-full.png` — "iyi gidiyor / tamamlanmaya yakın" durumu konsepti:
  parlak/yeşil dış mekan fotoğrafı, mutlu köpek, "Harika gidiyorsun!", 3,6 km / %72,
  yeşil ilerleme çubuğu, yeşil "Yürüyüşe Devam Et" butonu.
- `walk-photo-only.png` — sadece fotoğraf (metin/UI olmadan), ton/kadraj referansı.

**Bir ajan bu 3 durumu kendi başına tasarlayıp koda dökmemeli** — hangi eşiklerde
(örn. kaç saat yürünmedi = "lapsed", kaç % tamamlandı = "active") hangi görünümün
tetikleneceği Baran'la netleştirilmeden bu iş kapatılmış sayılmaz.
