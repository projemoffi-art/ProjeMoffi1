# Giriş + ilk kurulum — kilitli referans (2026-10-02)

`onboarding-9-screens-reference.jpg`: Baran'ın verdiği 9 ekranlık akış. Palet `home-final` ile aynı (turuncu-kiremit `#EE5B3D`, krem `#F7F3EA`),
yeşil sadece tamamlanan adım işareti. Üst adım çubuğu 3 aşamalı: **Kayıt · Doğrulama · Pet Kurulum**.

| # | Ekran | İçerik | Kod |
|---|---|---|---|
| 1 | Karşılama / Giriş | Logo + "Moffi" + "Daha fazla pati, daha mutlu yarınlar." + görsel; [Hesap Aç] [Giriş Yap] ——veya—— [Google ile Devam Et]; altta "Hesap açarak … kabul etmiş olursunuz" | `/` (`AuthEntry`) |
| 2 | Hesap Aç | Ad soyad, e-posta, şifre (göz), "en az 8 karakter, harf ve rakam içermeli"; ☑ Koşullar+Gizlilik (zorunlu), ☐ pazarlama (isteğe bağlı); [Devam Et] | `/` |
| 3 | E-posta Doğrulama | Zarf ikonu, "Doğrulama kodunu gönderdik", adres, kod kutuları, [Doğrula], "Kodu tekrar gönder (60 sn)", "E-posta adresini yanlış yazdım" | `/` |
| 4 | Kim bu? | "İlk patili dostunu ekle": Köpek / Kedi kartları, Diğer, **Şimdilik atla**; [Devam Et] | `/onboarding` |
| 5 | Adı ve fotoğrafı | Büyük kapak fotoğrafı (kamera düğmesi), "Pet'in adı", "Fotoğraf ekle" şeridi (+, 2–8 arası), [Devam Et] | `/onboarding` |
| 6 | Temel Bilgiler (1/2) | Satırlar: Irk › , Cinsiyet › , Doğum tarihi (takvim), Yaklaşık yaş ⌄; [Devam Et] | `/onboarding` |
| 7 | Ek Bilgiler (2/2) | Yaklaşık kilo ⌄ (isteğe bağlı), Kısırlaştırılmış mı? (Evet/Hayır/Bilmiyorum), Belirgin özellikler (çipler, isteğe bağlı), Kısa notlar (0/200); [Devam Et] | `/onboarding` |
| 8 | İzinler | Konum ("sadece şehir ve ilçe düzeyinde"), Bildirim, Kamera ve galeri — anahtarlar; [Tamamla] | `/onboarding` |
| 9 | Tamamlandı | ✓ "Her şey hazır!", "Luna artık Moffi'de seninle.", pet fotoğrafı, "Pet Pasaportu oluşturuldu" kartı, [Moffi'yi Keşfet] | `/onboarding` |

## Bilinçli kararlar / referanstan farklar
- **Veri bütünlüğü:** pet, 8. ekranda [Tamamla]'ya basınca TEK seferde kaydedilir (fotoğraflar yüklenir, hayvan eklenir, kilo/özellik yazılır,
  kurulum tamamlandı işaretlenir). Kayıt başarısız olursa girilenler kaybolmaz (taslak oturum belleğinde), hata gösterilir, tekrar denenir.
- **Şimdilik atla** (4. ekran): kurulum tamamlandı sayılır, kullanıcı boş ana sayfaya gider (oradaki "pet ekle" kartı kalır), bir daha zorlanmaz.
- **Kod kutuları:** referans 6 kutu gösterir; Supabase 8 hane üretir. Kutular 6 ile başlar, 7-8. hane yazılırsa kendiliğinden uzar.
- **Kamera ve galeri (8):** web'de önceden izin alınamaz (tarayıcı fotoğraf eklerken sorar). Satır, anahtar yerine "Fotoğraf eklerken sorulur"
  der; telefon uygulamasında kamera eklentisi eklenince gerçek anahtar olur.
- **Konum:** açıksa cihaz konumundan sadece il/ilçe alınır (profil `province`/`district`), koordinat saklanmaz.
- **Fotoğraflar:** ilki profil/kapak fotoğrafı (`avatar_url`), 8'e kadar hepsi `pets.gallery_urls`'te.
- **Doğum tarihi / yaklaşık yaş:** biri seçilince diğeri kapanır; yaklaşık yaştan türetilen tarih `birth_date_estimated=true` ile işaretlenir.
- **Belirgin özellikler** `pets.features`, **kısa notlar** `pets.character`. Irk listesi Türkçe, aranabilir, "Melez / Bilmiyorum" var.
- **Türler:** Köpek, Kedi, Diğer (kuş, tavşan, küçük memeli, diğer). Aşı takvimi şimdilik sadece kedi/köpek: Diğer seçilirse bunu söyleyen not çıkar.
- Pasaportta kalan alanlar (mikroçip, PETVET, renk, alerji…) kurulumda sorulmaz; "Pasaportunu tamamla" kartıyla sonradan.
- Görseller: karşılamada mevcut çizim (`/images/moffi_pet_trio.png`), tür kartlarında çizim/emoji; gerçek köpek/kedi fotoğrafları sonra Baran'dan.
