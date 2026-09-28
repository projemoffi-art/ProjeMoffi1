# Pet Pasaportu — kilitli referans (2026-09-28)

`passport-reference.jpg`: Baran'ın verdiği 10 ekranlık referans. Baran'ın notu: "bu yapı zeki bir sisteme
benziyor, ciddiye al; ama yapabileceğimiz, sürdürebileceğimiz kadarını kur" ve "pasaportta hiçbir şey
varsayılan olarak açık paylaşılmamalı, kullanıcı seçmeli".

## Ekran → kod

| # | Referans | Kod |
|---|---|---|
| 1 | Pet Pasaportu ana ekran | `/pasaport` + profil → Pasaport sekmesi (`components/passport/PassportHome.tsx`) |
| 2 | Kimlik Bilgileri | `/pasaport/kimlik` (kimlik alanlarının TEK yazıldığı yer) |
| 3 | Sağlık Özeti | `/health/karne` |
| 4 | Aşılar | `/health/asilar` |
| 5 | Aşı Detayı | `/health/asilar` içindeki detay penceresi |
| 6 | Sağlık Geçmişi | `/health/zaman` |
| 7 | İlaçlar | `/health/ilaclar` |
| 8 | Belgeler | `/health/belgeler` |
| 9 | Acil Bilgiler | `/health/acil` (alerji, hastalık, sağlık notu, acil iletişim — TEK kayıt) |
| 10 | Pasaport Paylaşımı | `/pasaport/paylas` → bağlantıyı açan kişi `/p/<token>` görür |

## Bilinçli farklar (gerçekçilik)

- **QR:** Kartın üstündeki QR yerine paylaş düğmesi var. Kalıcı bir QR herkese açık bilgi demek olurdu. QR'lar:
  paylaşım bağlantısının QR'ı (süreli) ve künye QR'ı (`/id/<id>`, kayıp değilken sadece ad/ırk/fotoğraf).
- **"PETVET Kayıtlı":** Sahip PETVET numarasını girdiyse görünür; Moffi resmi kaydı doğrulamaz (ekranda yazıyor).
- **"Kayıt İl/İlçe":** Veri tutulmadığı için gösterilmiyor.
- **Paylaşım bağlantısı:** En fazla 30 gün açık, istenen an kapatılır, kaç kez açıldığı görünür.
  Hiçbir bölüm önceden seçili gelmez.
- **Künye eşleştirme:** Donanım/NFC eşleştirmesi yok. Künye = QR ya da NFC etikete yazılan `/id/<id>` adresi.
