# Görev Merkezi — kilitli referans (Baran, 2026-10-03)

`quests-reference.jpg`: Baran'ın hazırladığı 10 ekran. Rapor: https://claude.ai/artifact/LrEvyFQBCvNdgev7iAftcL
(durum analizi, dünyadaki örnekler, ilkeler, puan ekonomisi). Rapordaki öneriler ve 6 karar Baran tarafından onaylandı.

| Kod | Ekran | Rota |
|---|---|---|
| E1 | Görev Merkezi · Bugün | `/quests` |
| E2 | Aylık Macera | `/quests/macera` |
| E3 | Programlar | `/quests/programlar` |
| E4 | Program detayı (referansta yok, aynı dille) | `/quests/programlar/[key]` |
| E5 | Rozet Kasası | `/quests/rozetler` |
| E6 | Birlikte | `/quests/birlikte` |
| E7 | Günün Bilgisi (+ okuma ekranı) | `/quests/bilgi`, `/quests/bilgi/[id]` |
| A1 | Görev detayı (alt sayfa) | `components/quests/QuestTaskSheet.tsx` |
| A2 | Haftalık sandık (alt sayfa) | `components/quests/WeeklyChestSheet.tsx` |
| A3 | Rozet detayı (alt sayfa) | `app/quests/rozetler/page.tsx` |
| A4 | Arkadaş görevi oluştur (alt sayfa) | `app/quests/birlikte/page.tsx` |
| K | Kutlama anları | `components/quests/QuestCelebration.tsx` |

## Görselden çıkan kurallar
- Krem zemin, beyaz yuvarlak kartlar, mercan (#EE5B3D) aktif hap sekme ve ana düğme, yeşil "tamam". Mavi/indigo yok.
- Üstte hayvanın KENDİ fotoğrafı (referanstaki golden retriever örnektir). Fotoğraf yoksa türüne göre sıcak yer tutucu.
- Program ve bilgi kartlarındaki fotoğraflar yerine şimdilik renkli zemin + emoji (gerçek görseller gelince `programs.tint/emoji`
  ve `lessons.tint/emoji` yerine görsel alanı eklenir). Rozetler emoji madalyon (3B rozet çizimleri gelince değişir).
- A2'deki koyu bant mor (indigo değil); referanstaki gibi.

## Bilinçli sapmalar
- E1'de görev sayısı 5 (3 her gün: yürüyüş ya da oyun, beslenme, su + 2 havuzdan). Referans "3/5" ile uyumlu; rapordaki "3 görev" önerisi
  yerine bu, çünkü bakım görevleri zaten uygulamanın asıl işi.
- E3 "Popüler" sekmesi yerine "Tümü": gerçek popülerlik verisi yok, sıralama uydurulmaz.
- E7'de soru yok; okuma sonunda "Okudum" (referans yalnızca okuma kartları gösteriyor).
- E1'in altına referansta görünmeyen "Keşfet" kısayolları eklendi (sandık, macera, program, bilgi, rozet, birlikte): diğer ekranlara giriş yolu.
