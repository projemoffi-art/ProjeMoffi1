# Yapılacaklar

Sonra bakılacak işler. Bir madde bitince buradan silinir, gerekiyorsa CLAUDE.md'ye not düşülür.

## Veteriner / sağlık

- [ ] **İşletmelerin harita konumu yok.** Hiçbir işletmenin `business_lat/business_lng` değeri
  dolu değil (MoffiPet dahil), bu yüzden müşteri haritasında pin çıkmıyor ve mesafe
  hesaplanmıyor. İşletmeler konumu "İşletme profili" sayfasından haritaya dokunarak
  işaretleyebiliyor; mevcut işletmelerin bir kez işaretlemesi gerekiyor. (2026-09-28)
- [ ] **Beslenme (Sağlık planı S5).** `/food` sayfası hâlâ hiçbir yerden açılmıyor ve veriyi sadece
  tarayıcıda tutuyor; ana sayfa su halkası da öyle. Plan: sade bir Beslenme ekranı (öğün + su),
  veriyi mevcut `pet_daily_stats` tablosuna bağlamak; makro grafiği, kiler, gıda notu, akıllı öğün
  kartını silmek. Rapor: https://claude.ai/code/artifact/c5575b56-d083-44c3-b6d5-6f02ca82c0ed
- [ ] **Push bildirimi tek kanaldan.** Eski `vaccine-reminders` edge fonksiyonunun cron'u kapatıldı
  (yanlış hesap yapıyordu). Telefona push, tüm bildirim türleri için `notifications` tablosundan
  tek bir yerden gönderilmeli; edge fonksiyonun kendisi hâlâ deploy'da duruyor, sonra silinmeli.
- [ ] **`pets` tablosu herkese açık okunuyor** (`using (true)` birden fazla kural): sağlık notu, çip
  numarası, `sos_settings` içindeki sahip telefonu/adresi dahil. Topluluk, başka profiller ve kayıp
  ilanları bu tabloyu okuduğu için dikkatli bir inceleme gerekiyor (açık alanlar bir görünüme/fonksiyona
  taşınmalı).
- [ ] **Diş bakımı.** Eski diş bakımı penceresi (anket + fırçalama zamanlayıcısı) hiçbir yerden
  açılmadığı ve referansta olmadığı için silindi. Diş kontrolleri muayene kaydı olarak tutuluyor.
  İstenirse karneye "Diş" modülü eklenebilir.
