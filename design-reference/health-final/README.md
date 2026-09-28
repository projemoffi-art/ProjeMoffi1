# Moffi Sağlık Merkezi / Sağlık Karnesi — KİLİTLİ Referans (2026-09-28)

🔴 Baran bu görseli, Sağlık Mimarisi Raporu'ndaki içerik brifine göre hazırladı
(rapor: https://claude.ai/code/artifact/c5575b56-d083-44c3-b6d5-6f02ca82c0ed).
Herhangi bir ajan `/health/*` altında ya da sağlıkla ilgili bir ekranda UI değişikliği
yapmadan önce bu klasörü okumalı (CLAUDE.md Bölüm 11, `home-final`/`walk-final`/`vet-final`
ile aynı desen).

- **`health-karne-reference.jpg` — ASIL referans.** Uygulanacak ekranlar bu görseldeki.
- **`health-center-inspiration.jpg` — sadece ilham.** Baran'ın daha önce hazırladığı genel
  "Sağlık Merkezi" konsepti; bağlayıcı değil. Baran'ın sözü: "istersen faydalanabilirsin,
  karar tamamen sende." Bu görseldeki "Moffi Sağlık Asistanı (AI)" ekranı rapordaki "yapay
  zekayla teşhis yok" kararı gereği UYGULANMAZ.

## Palet ve dil

`vet-final` ile aynı aile: krem zemin, beyaz kartlar, turuncu-kiremit tek aksan (`#EE5B3D`
ailesi, `.theme-vet` token'ları), yeşil sadece "Güncel / Uygulandı / Her şey yolunda",
amber "Yaklaşıyor", kırmızı sadece "Gecikti". Modül ikonları pastel yuvarlak kare zeminli.
Başlıklar cümle düzeninde (büyük harf zorlaması yok).

## Ekran dökümü (health-karne-reference.jpg)

### Üst sıra (soldan sağa)
1. **Sağlık Merkezi (giriş):** Moffi başlığı + zil + avatar; evcil hayvan seçici ("Luna ▾" + "+");
   başlık "Sağlık Merkezi", alt yazı "{ad}'nın tüm sağlık bilgileri tek yerde."; 8 modül kutusu
   (Sağlık Karnesi, Aşılar, Parazit, İlaçlar, Kilo, Muayeneler, Belgeler, Acil Bilgiler);
   "Genel Durum — Her şey yolunda — Son kontrol: {tarih}" kartı; "Yaklaşan İşlemler" listesi
   (ad, tarih, "{n} gün kaldı"); alt navigasyon.
2. **Sağlık Karnesi (özet):** üstte sekmeler (Özet · Aşılar · Parazit · İlaçlar · Muayeneler…);
   kimlik kartı (foto, ad + cinsiyet, ırk, doğum, yaş, çip no, QR, kayıt no); "Genel Sağlık
   Özeti" + durum rozeti; 6 kutu (Aşılar Güncel, Parazit Güncel, İlaçlar 1 aktif, Kilo 28,4 kg,
   Muayeneler 4 kayıt, Acil Bilgiler Tanımlı); "Veterinerimiz" kartı (klinik + son kontrol);
   "Karnemi Paylaş" butonu.
3. **Aşılar:** "+ Ekle"; Liste/Takvim anahtarı; satır: ikon, ad, son uygulama, sonraki,
   rozet (Güncel/Yaklaşıyor) ya da "Planla"; altta "Aşı takvimi önerisi al" ve "Aşı geçmişi
   belgesi — PDF olarak indir".
4. **Parazit:** "+ Ekle"; Gecikmiş/Yaklaşan/Yapılanlar sekmeleri; yıla göre zaman çizelgesi
   (tarih, İç/Dış parazit uygulaması, ürün adı, "Uygulandı", belge ikonu); altta
   "Parazit hatırlatması oluştur".
5. **Kayıt Detayı (muayene):** klinik kartı; "Muayene · Genel Kontrol" + "Tamamlandı";
   veteriner hekim; muayene notu; yapılan işlemler çipleri; ölçümler (kilo, sıcaklık…);
   belgeler; "Bu kaydı paylaş".

### Alt sıra
6. **İlaçlar:** Aktif/Geçmiş; ilaç kartı (ad, doz, tür, "{n} gün kaldı"), doz saatleri,
   günlük doz onay kutuları, "Doz Alındı Olarak İşaretle", "+ İlaç Ekle".
7. **Kilo Takibi:** son değer + değişim, çizgi grafik, ölçüm listesi, "+ Kilo Ekle".
8. **Muayeneler:** Tümü/Yaklaşan/Geçmiş, liste (tarih, tür, klinik), "+ Muayene Kaydı Ekle".
9. **Belgeler:** Tümü/Aşı Karnesi/Tahlil/Reçete filtreleri, dosya listesi, "+ Belge Yükle".
10. **Acil Bilgiler:** "Acil durumda göster" anahtarı; alerjiler, kronik hastalık, düzenli ilaç,
    çip numarası (kopyala), kan grubu; "Düzenle".
11. **Veterinere Paylaş:** "Hangi bilgileri paylaşmak istiyorsunuz?" onay listesi;
    "Paylaş (PDF Oluştur)".
12. **Zaman Çizelgesi:** filtre çipleri, tarihli liste (veteriner muayenesi, aşı, parazit, diş…).

## Uygulama notları (gerçek veriyle ilgili dürüstlük)

- Görseldeki "Kalp 96 bpm" gibi ölçümler sadece gerçekten kayıtlıysa gösterilir
  (`medical_records`'ta kilo ve sıcaklık var, nabız yok) — uydurma alan gösterilmez.
- Durum rozeti ("Sağlıklı / Her şey yolunda") elle girilmez; gecikmiş aşı/parazit ve aktif
  ilaçtan türetilir.
- Aşı listesi türe göre (kedi/köpek) veritabanındaki tanımlardan gelir.
