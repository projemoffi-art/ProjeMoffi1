-- Görev Merkezi içerik: aylık maceralar (Ekim–Aralık 2026). Her ay 4 bölüm; ilerleme o ayın gerçek kayıtlarından (pet_metric).
-- Köpek dışı hayvanlarda "alt" hedefler kullanılır (yürüyüş yerine oyun/fotoğraf). Yeni ay için bu dosyaya yeni satır ekle.

insert into public.badge_defs (key, family, tier, title, description, icon, category, metric, threshold, unit, pawcoin, xp, hidden, sort) values
('adv_2026_10', 'adventure', 1, 'Sonbahar Kâşifi', 'Ekim 2026 macerasını tamamladın', '🍂', 'ozel', 'adventure:2026-10', 1, '', 0, 0, false, 80),
('adv_2026_11', 'adventure', 1, 'Sıcak Yuva', 'Kasım 2026 macerasını tamamladın', '🧣', 'ozel', 'adventure:2026-11', 1, '', 0, 0, false, 81),
('adv_2026_12', 'adventure', 1, 'Kış Masalı', 'Aralık 2026 macerasını tamamladın', '❄️', 'ozel', 'adventure:2026-12', 1, '', 0, 0, false, 82)
on conflict (key) do update set title = excluded.title, description = excluded.description, icon = excluded.icon, metric = excluded.metric;

insert into public.adventures (month, title, subtitle, story, emoji, tint, badge_key, final_pawcoin, final_xp, stages)
select x.month, x.title, x.subtitle, x.story, x.emoji, x.tint, x.badge_key, x.final_pawcoin, x.final_xp, x.stages
from jsonb_to_recordset($j$[
{"month":"2026-10","title":"Sonbahar Kâşifleri","subtitle":"Her ay yeni bir macera, her adımda daha fazla keşif.",
 "story":"Ekim, 4 Ekim Dünya Hayvanları Günü ile başlıyor. Yapraklar dökülürken sen ve dostun mahallenizin her köşesini keşfedeceksiniz.",
 "emoji":"🍂","tint":"#FBEFD3","badge_key":"adv_2026_10","final_pawcoin":100,"final_xp":200,
 "stages":[
  {"title":"İlk Yapraklar","emoji":"🍁","pawcoin":50,"xp":100,"story":"Macera başladı! İlk adımlar her zaman en heyecanlısıdır.",
   "goals":[{"metric":"walk_days","target":3,"label":"3 gün yürüyüş yap","alt":{"metric":"play_days","target":3,"label":"3 gün birlikte oyna"}},
            {"metric":"water_days","target":5,"label":"5 gün suyunu tazele"},
            {"metric":"lessons","target":2,"label":"2 bilgi kartı oku"}]},
  {"title":"Mahalleyi Tanı","emoji":"🗺️","pawcoin":50,"xp":100,"story":"Her sokak yeni bir koku, her köşe yeni bir hikâye.",
   "goals":[{"metric":"new_places","target":2,"label":"2 yeni yerde yürü","alt":{"metric":"photo_count","target":2,"label":"2 anı fotoğrafı ekle"}},
            {"metric":"walk_km","target":10,"label":"Bu ay toplam 10 km yürü","alt":{"metric":"play_days","target":8,"label":"8 gün birlikte oyna"}},
            {"metric":"weigh_count","target":1,"label":"Kilosunu bir kez kaydet"}]},
  {"title":"Özenli Günler","emoji":"🥣","pawcoin":50,"xp":100,"story":"Kâşifler iyi beslenir: düzenli öğün ve taze su.",
   "goals":[{"metric":"care_days","target":12,"label":"12 gün öğün ve suyu eksiksiz tamamla"},
            {"metric":"lessons","target":5,"label":"Toplam 5 bilgi kartı oku"},
            {"metric":"photo_count","target":3,"label":"3 anı fotoğrafı ekle"}]},
  {"title":"Sonbahar Kâşifi","emoji":"🦊","pawcoin":50,"xp":100,"story":"Ayın sonuna geldin. Sonbaharın gerçek kâşifi artık sizsiniz!",
   "goals":[{"metric":"walk_km","target":25,"label":"Bu ay toplam 25 km yürü","alt":{"metric":"play_days","target":15,"label":"15 gün birlikte oyna"}},
            {"metric":"chests","target":2,"label":"2 haftalık sandık aç"},
            {"metric":"care_days","target":20,"label":"20 gün öğün ve suyu eksiksiz tamamla"}]}]},
{"month":"2026-11","title":"Sıcak Yuva","subtitle":"Havalar soğurken evde ve dışarıda sağlıklı kalın.",
 "story":"Kasımda günler kısalıyor. Kısa ama sık yürüyüşler, sıcak bir yuva ve bolca bilgiyle kışa hazırlanıyoruz.",
 "emoji":"🧣","tint":"#F3EBDD","badge_key":"adv_2026_11","final_pawcoin":100,"final_xp":200,
 "stages":[
  {"title":"Hazırlık","emoji":"🧺","pawcoin":50,"xp":100,"story":"Kışa hazırlık, düzenli bakımla başlar.",
   "goals":[{"metric":"water_days","target":5,"label":"5 gün suyunu tazele"},
            {"metric":"meal_days","target":5,"label":"5 gün öğünlerini eksiksiz ver"},
            {"metric":"lessons","target":2,"label":"2 bilgi kartı oku"}]},
  {"title":"Kısa ama Sık","emoji":"🐾","pawcoin":50,"xp":100,"story":"Soğukta uzun yürüyüş yerine kısa ve sık hareket.",
   "goals":[{"metric":"walk_days","target":8,"label":"8 gün yürüyüş yap","alt":{"metric":"play_days","target":8,"label":"8 gün birlikte oyna"}},
            {"metric":"weigh_count","target":1,"label":"Kilosunu bir kez kaydet"},
            {"metric":"photo_count","target":2,"label":"2 anı fotoğrafı ekle"}]},
  {"title":"Bilgi Kışı","emoji":"📚","pawcoin":50,"xp":100,"story":"Uzun akşamlar öğrenmek için birebir.",
   "goals":[{"metric":"lessons","target":6,"label":"Toplam 6 bilgi kartı oku"},
            {"metric":"care_days","target":14,"label":"14 gün öğün ve suyu eksiksiz tamamla"}]},
  {"title":"Sıcak Yuva","emoji":"🏠","pawcoin":50,"xp":100,"story":"Ayın sonunda yuvanız her zamankinden sıcak.",
   "goals":[{"metric":"walk_km","target":20,"label":"Bu ay toplam 20 km yürü","alt":{"metric":"play_days","target":15,"label":"15 gün birlikte oyna"}},
            {"metric":"chests","target":2,"label":"2 haftalık sandık aç"},
            {"metric":"care_days","target":22,"label":"22 gün öğün ve suyu eksiksiz tamamla"}]}]},
{"month":"2026-12","title":"Kış Masalı","subtitle":"Yılın son macerası: birlikte geçen her güne teşekkür.",
 "story":"Aralık, bir yılın özeti. Anıları biriktir, sağlığını kontrol et ve yeni yıla birlikte gir.",
 "emoji":"❄️","tint":"#F3EBDD","badge_key":"adv_2026_12","final_pawcoin":100,"final_xp":200,
 "stages":[
  {"title":"İlk Kar","emoji":"⛄","pawcoin":50,"xp":100,"story":"Kış geldi; patiler sıcak, kalpler daha da sıcak.",
   "goals":[{"metric":"walk_days","target":4,"label":"4 gün yürüyüş yap","alt":{"metric":"play_days","target":4,"label":"4 gün birlikte oyna"}},
            {"metric":"water_days","target":5,"label":"5 gün suyunu tazele"},
            {"metric":"lessons","target":2,"label":"2 bilgi kartı oku"}]},
  {"title":"Anı Defteri","emoji":"📸","pawcoin":50,"xp":100,"story":"Bu yılın en güzel anlarını topla.",
   "goals":[{"metric":"photo_count","target":4,"label":"4 anı fotoğrafı ekle"},
            {"metric":"meal_days","target":10,"label":"10 gün öğünlerini eksiksiz ver"}]},
  {"title":"Sağlık Kontrolü","emoji":"🩺","pawcoin":50,"xp":100,"story":"Yeni yıla sağlıklı girmek için küçük bir kontrol.",
   "goals":[{"metric":"weigh_count","target":2,"label":"Kilosunu 2 kez kaydet"},
            {"metric":"lessons","target":5,"label":"Toplam 5 bilgi kartı oku"},
            {"metric":"care_days","target":15,"label":"15 gün öğün ve suyu eksiksiz tamamla"}]},
  {"title":"Kış Masalı","emoji":"✨","pawcoin":50,"xp":100,"story":"Bir yılı birlikte tamamladınız. Masal yeni yılda devam ediyor.",
   "goals":[{"metric":"walk_km","target":20,"label":"Bu ay toplam 20 km yürü","alt":{"metric":"play_days","target":15,"label":"15 gün birlikte oyna"}},
            {"metric":"chests","target":2,"label":"2 haftalık sandık aç"},
            {"metric":"care_days","target":22,"label":"22 gün öğün ve suyu eksiksiz tamamla"}]}]}
]$j$::jsonb) as x(month text, title text, subtitle text, story text, emoji text, tint text, badge_key text, final_pawcoin int, final_xp int, stages jsonb)
on conflict (month) do update set title = excluded.title, subtitle = excluded.subtitle, story = excluded.story, emoji = excluded.emoji,
    tint = excluded.tint, badge_key = excluded.badge_key, final_pawcoin = excluded.final_pawcoin, final_xp = excluded.final_xp, stages = excluded.stages;
