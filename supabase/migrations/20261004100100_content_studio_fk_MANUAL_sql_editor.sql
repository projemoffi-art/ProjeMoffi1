-- İçerik Stüdyosu ilişki kuralları. Baran SQL Editor'dan çalıştırır (bağlayıcı "on delete" geçen komutu uygulayamıyor).
-- Acil değil: kurallar yokken de akış doğru çalışır (silinmiş işletme/kampanyanın içeriği akışa zaten gelmez);
-- bu dosya yalnızca bağlı kayıtların birlikte temizlenmesini sağlar.

alter table public.content_items
    add constraint content_items_business_fk foreign key (business_id) references public.businesses(id) on delete cascade,
    add constraint content_items_campaign_fk foreign key (campaign_id) references public.clinic_campaigns(id) on delete cascade,
    add constraint content_items_created_by_fk foreign key (created_by) references auth.users(id) on delete set null,
    add constraint content_items_reviewed_by_fk foreign key (reviewed_by) references auth.users(id) on delete set null;

alter table public.content_events
    add constraint content_events_content_fk foreign key (content_id) references public.content_items(id) on delete cascade,
    add constraint content_events_user_fk foreign key (user_id) references auth.users(id) on delete cascade;
