-- Genel kontrolde bulundu (2026-10-03): "Fırsatlar" hikâyesi kampanyanın başlık/metin/görsel/kuponunu clinic_campaigns'ten
-- CANLI okur. İşletme kendi kampanyasını güncelleyebildiği için (RLS: can_manage_business), onaydan sonra içeriği değiştirip
-- yönetici onayını atlayabiliyordu. Artık gösterilen alanlardan biri değişince öne çıkarma yeniden onaya düşer.

create or replace function public.content_campaign_changed()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
    if (new.title, new.description, new.media_url, new.discount_value, new.coupon_code, new.target_pet_type)
       is distinct from
       (old.title, old.description, old.media_url, old.discount_value, old.coupon_code, old.target_pet_type) then
        update content_items
           set status = 'pending', reviewed_by = null, reviewed_at = null, reject_reason = null, updated_at = now()
         where campaign_id = new.id and channel = 'deal' and status = 'approved';
    end if;
    return new;
end;
$$;

revoke execute on function public.content_campaign_changed() from public, anon, authenticated;

create trigger clinic_campaigns_content_review
    after update on public.clinic_campaigns
    for each row execute function public.content_campaign_changed();
