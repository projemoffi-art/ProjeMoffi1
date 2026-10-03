-- Faz 0 (Görev Merkezi raporu): ömür boyu hedefler günlük dönemle tanımlıydı; bir kez ulaşan her gün yeniden alıyordu.
update public.reward_rules set period = 'once'
 where key in ('quest:cumulative_100km', 'quest:cumulative_50km', 'quest:streak_30', 'quest:streak_7', 'quest:first_walk', 'quest:first_post');
