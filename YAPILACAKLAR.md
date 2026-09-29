# Yapılacaklar

Sonra bakılacak işler. Bir madde bitince buradan silinir, gerekiyorsa CLAUDE.md'ye not düşülür.

## Veteriner / sağlık / pasaport

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
- [ ] **"Zamanı geldi mi" kuralı iki yerde.** Aşı/parazit durumu ekranda `lib/health/derive.ts`,
  hatırlatmada SQL (`enqueue_health_due_reminders`) ile ayrı hesaplanıyor. Bugün aynı sonucu veriyor;
  tek bir SQL fonksiyonuna indirilmeli.
- [ ] **Eski sağlık notu kolonunu sil.** `pets.health_notes` ve `sos_settings.critical_health_note`
  artık okunmuyor (içerik `pet_health_profile.notes`'a taşındı, 2026-09-28). Canlı sürüm yeni kodla
  birkaç gün sorunsuz çalıştıktan sonra silinebilir.
- [ ] **Eski SOS ayarlarını sil.** Kayıp bilgisi artık ilandan geliyor (CLAUDE.md 8.47). `pets.sos_settings`
  içindeki `finder_message`, `reward_*`, `secure_proxy_only`, `emergency_sms_number`, `sos_radius`,
  `quiet_hours`, `location_precision`, `auto_post_sos`, `header_sos_alert_enabled`, `emergency_bypass` ve
  `PetContext`/`types.ts`/`home` içindeki varsayılanları birkaç gün sonra temizlenebilir.
- [ ] **Ana sayfadaki yorum satırına alınmış "akıllı tasma" bloğu** (`home/page.tsx`, `[V2_FEATURE_TASMA]`)
  uydurma AI ses çevirmeni / tasma LED'i içeriyor; özellik gelmeyecekse silinmeli.

## Topluluk

- [ ] **localStorage `SocialContext` hâlâ duruyor.** ai-dressing, MoffiWallet ve HeroSection kullanıyor; sahte
  paylaşım/beğeni verisi tarayıcıda tutuluyor. Bu ekranlar `socialService`'e bağlanıp context silinmeli. (2026-09-29)
- [ ] **Profil kapak fotoğrafı artık gösterilmiyor** (referansta yok). Ayarlardaki kapak yükleme ya kaldırılmalı
  ya da profile geri eklenmeli. (2026-09-29)
- [ ] **Oyun ödülündeki coin eklenmiyor olabilir.** Eski `protect_profile_security_fields` tetikleyicisi
  `auth.role()`'e bakıyor; `add_game_reward` (SECURITY DEFINER) içinde bile rol "authenticated" göründüğü
  için `coin_balance` artışı geri alınıyor. `guard_profile_rewards`'daki `current_user` yöntemiyle düzeltilmeli.
- [ ] **Günün yıldızları (topluluk).** Yürüyüşü olmayan hayvana kimlik numarasından türetilmiş
  uydurma "Aura puanı" veriliyor ve seçim her kullanıcının tarayıcısında yapılıyor; sunucuda
  günde bir kez hesaplanmalı.
- [ ] **Hayvan adına iyelik eki.** Yürüyüş meydan okumaları, pet shop açıklamaları, künye teşekkür metni, ana sayfa
  günlük hedef ve yapay zekâ yedek cevabında `{ad}'in` kullanılıyor ("Zelal'in" gibi yanlış çekimler çıkar).
  Cümleler eksiz kurulmalı (bkz. CLAUDE.md 8.48).
- [ ] **Yönetici ana panelindeki uydurma sayılar.** `admin/page.tsx`'te "Adoption Verifications: 12 Node" sabit metin;
  `admin/analytics` grafiği rastgele sayı üretiyor. Gerçek veriye bağlanmalı ya da kaldırılmalı.
- [ ] **Diş bakımı.** Eski diş bakımı penceresi (anket + fırçalama zamanlayıcısı) hiçbir yerden
  açılmadığı ve referansta olmadığı için silindi. Diş kontrolleri muayene kaydı olarak tutuluyor.
  İstenirse karneye "Diş" modülü eklenebilir.
