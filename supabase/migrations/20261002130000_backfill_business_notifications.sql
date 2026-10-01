-- 1b (8.54) devamı: işletme kaydı öncesinde kliniklere giden randevu bildirimleri kişisel bildirim gibi duruyordu
-- (business_id boş, type 'appointment'). Kişi = işletme ayrımından sonra bunlar işletme panelinin ziline aittir.
-- Ölçüt: bildirimin randevusu, bildirimi alan kişinin işletmesine ait (clinic_id = user_id; eski işletmeler aynı
-- kimlikle taşındı). Müşteri tarafı randevu bildirimleri (kişinin kendi randevusu) dokunulmadan kalır.
update public.notifications n
   set business_id = a.clinic_id,
       type = 'biz_appointment'
  from public.appointments a
 where n.business_id is null
   and n.type = 'appointment'
   and a.id::text = n.entity_id
   and a.clinic_id = n.user_id
   and exists (select 1 from public.businesses b where b.id = a.clinic_id);
