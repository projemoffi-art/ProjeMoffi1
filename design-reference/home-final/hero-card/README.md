# Ana sayfa üst kartı (hero) — KİLİTLİ REFERANS (Baran, 2026-10-03)

`reference.jpg`: Baran'ın verdiği hedef görünüm. Ana sayfanın üst kartı bu yapıdadır.

## Baran'ın kuralları
- Kapalı hâlde yalnızca kart görünür: büyük hayvan fotoğrafı, ad + ırk/yaş, altında yuvarlak sekme düğmeleri.
- Bir düğmeye basınca kartın altından aşağı doğru çekmece açılır ve o sekmenin bilgilerini gösterir.
- Sekmeler: Genel · Sağlık · Albüm (Fotoğraflar & Anılar TEK düğme, içeride ayrı bölümler) · Petler.
- Çekmecedeki her bilgi gerçek veriye ve ilgili ekrana bağlı; sahte/bağımsız veri yok.
- Yazılar ve kartlar üst üste binmez; profesyonel görünüm.

## Onaylanan plan ve uygulanan hâl (2026-10-03)
**Kart** (`src/components/home/hero/PetHero.tsx`)
- Arka plan: seçili hayvanın kapak fotoğrafı, yoksa profil fotoğrafı; ikisi de yoksa sıcak zemin + "Fotoğraf ekle".
- Üstte Moffi logosu, zil, profil (fotoğraf üstü cam düğmeler); logonun altında küçük selamlama ("İyi günler, Baran").
- Altta büyük ad + kalem (→ `/pasaport/kimlik`), "Irk · yaş" (doğum tarihinden), çok hayvanda nokta göstergesi, 4 sekme.
- Kartta sağa-sola kaydırma hayvan değiştirir (dokunma olaylarıyla; tarayıcı yatay hareketi işaretçiden aldığı için).
- Kayıp modundaki hayvan varsa en üstte kırmızı şerit. Hayvan yoksa sekmeler gizli, "Evcil hayvan ekle".
- Çekmece: aynı sekme kapatır, "Daralt" düğmesi, sayfa her açılışta kapalı; "hareketi azalt"ta animasyonsuz.

**Genel** (`GeneralTab.tsx`): günün notu (eskiden selamlamanın altındaydı) → Bugün: Su (taze su, dokun/geri al),
Mama (öğün x/y, dokun +1, 5 sn "Geri al", "Öğün ayarı" 1–6), Yürüyüş (bu hayvanın bugünkü km / günlük hedef; dokununca
yürüyüş paneli), sıradaki sağlık işi → Günlük yürüyüş rotası (gerçek harita, km/süre/kalori → yürüyüş ayrıntısı; yoksa
"Başla"; yürüyüşteyse canlı) → Son fotoğraflar → Anılar + "Yeni anı ekle".

**Sağlık** (`HealthTab.tsx`): Sağlık Merkezi'nin aynı karnesi. Genel durum, bugünkü ilaç dozları (dokununca verildi),
yaklaşan işler, kilo + değişim, alerji/kronik durum, son muayene, "Sağlık Merkezi".

**Albüm** (`AlbumTab.tsx` + `/album`): fotoğraflar ve anılar ayrı bölümler; yalnızca sahibi görür.

**Petler** (`PetsTab.tsx`): tüm hayvanlar + durum rozetleri, seçince kart değişir, pasaport, "Yeni dost ekle".
Eski sağ üst hayvan seçici çekmecesi ve `HomeHeader.tsx` silindi (tek sistem).

## Fotoğraf ve anı kuralları (maliyet)
- Kaynaklar tek akışta, kopya yok: albüme yüklenenler (özel `pet-album` deposu), yürüyüş fotoğrafları, hayvanın
  etiketlendiği kendi gönderileri, profil/kurulum fotoğrafları. Kapak listede tekrar edilmez.
- Otomatik anılar kayıtlardan hesaplanır, depolama harcamaz: Moffi'ye katılış, doğum günleri, ilk yürüyüş, toplam km
  eşikleri (10/50/100/250/500/1000…), Keşfet'teki ilk paylaşım.
- Yükleme öncesi telefonda küçültme: uzun kenar 1600 px WebP (~250 KB) + 400 px önizleme; ızgara yalnızca önizlemeyi indirir.
- Kota (sunucuda, `album_limits()`): Ücretsiz hayvan başına 50 dosya + 10 elle anı, video yok. Prime 1.000 dosya,
  sınırsız anı, anılara ≤30 sn / ≤50 MB video. Baran: "şimdilik uygun, sonra ayrıntılı bakalım".
- Video şimdilik telefonda yeniden kodlanmıyor (720p dönüştürme native aşamasında); süre ve boyut sınırı sunucuda.
