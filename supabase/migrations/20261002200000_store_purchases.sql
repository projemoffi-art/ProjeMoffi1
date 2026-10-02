-- Faz 6: mağaza satın almaları (App Store / Google Play, RevenueCat üzerinden).
-- RevenueCat her satın alma/yenileme/bitişte /api/revenuecat/webhook'a bildirir; sunucu apply_store_event ile uygular.
-- app_user_id = Supabase kullanıcı kimliği (telefon uygulaması Purchases.logIn(user.id) çağırır).

-- Ürün kataloğu: mağazadaki ürün kimliği → ne verdiği. Fiyat mağazada tanımlanır, burada tutulmaz.
create table if not exists public.store_products (
    product_id text primary key,
    kind text not null check (kind in ('prime', 'pawcoin')),
    pawcoin_amount integer check (kind <> 'pawcoin' or pawcoin_amount > 0),
    active boolean not null default true,
    created_at timestamptz not null default now()
);
alter table public.store_products enable row level security;
do $$ begin
    if not exists (select 1 from pg_policies where tablename = 'store_products' and policyname = 'Anyone reads active store products') then
        create policy "Anyone reads active store products" on public.store_products for select to authenticated using (active);
    end if;
end $$;
grant select on public.store_products to authenticated;

-- Başlangıç kataloğu (ürün kimlikleri mağazada AYNEN bu şekilde açılmalı; fiyatlar Baran'ın kararı)
insert into public.store_products (product_id, kind, pawcoin_amount) values
    ('moffi_prime_monthly', 'prime', null),
    ('moffi_prime_yearly', 'prime', null),
    ('pawcoin_500', 'pawcoin', 500),
    ('pawcoin_1200', 'pawcoin', 1200),
    ('pawcoin_3000', 'pawcoin', 3000)
on conflict (product_id) do nothing;

-- İşlenen bildirimler (aynı bildirim iki kez gelirse tekrar uygulanmaz) — istemciye kapalı
create table if not exists public.store_events (
    event_id text primary key,
    event_type text not null,
    user_id uuid references auth.users(id) on delete set null,
    product_id text,
    environment text,
    result text not null,
    payload jsonb not null,
    created_at timestamptz not null default now()
);
alter table public.store_events enable row level security;

create or replace function public.apply_store_event(
    p_event_id text, p_type text, p_user uuid, p_product text,
    p_expires_at timestamptz, p_environment text, p_payload jsonb
) returns text language plpgsql security definer set search_path to 'public' as $$
declare
    v_product store_products%rowtype;
    v_result text;
    v_ref text := 'store-' || p_event_id;
begin
    if exists (select 1 from store_events where event_id = p_event_id) then
        return 'duplicate';
    end if;

    if p_user is null or not exists (select 1 from auth.users where id = p_user) then
        v_result := 'unknown_user';
    else
        select * into v_product from store_products where product_id = p_product;

        if p_type in ('INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION') and v_product.kind = 'prime' then
            update profiles set prime_until = greatest(coalesce(prime_until, now()), p_expires_at) where id = p_user;
            -- İlk alımda o ayın 500 PawCoin'i hemen verilir (sonraki aylar cron ile)
            if p_type = 'INITIAL_PURCHASE' and not exists (
                select 1 from point_transactions where user_id = p_user
                   and reference_id = 'prime-monthly-' || to_char(now() at time zone 'Europe/Istanbul', 'YYYY-MM')) then
                perform award_pati_puan_internal(p_user, 500, 'Prime aylık PawCoin', 'other',
                    'prime-monthly-' || to_char(now() at time zone 'Europe/Istanbul', 'YYYY-MM'));
            end if;
            if p_type = 'INITIAL_PURCHASE' then
                perform notify_user(p_user, 'system', 'Prime üyeliğin başladı', 'Prime ayrıcalıkların açıldı. Bu ayın 500 PawCoin''i hesabına eklendi.', null, null);
            end if;
            v_result := 'prime_extended';

        elsif p_type = 'EXPIRATION' and v_product.kind = 'prime' then
            update profiles set prime_until = least(coalesce(prime_until, now()), now()) where id = p_user;
            v_result := 'prime_expired';

        elsif p_type = 'NON_RENEWING_PURCHASE' and v_product.kind = 'pawcoin' then
            perform award_pati_puan_internal(p_user, v_product.pawcoin_amount, 'PawCoin satın alma', 'other', v_ref);
            perform notify_user(p_user, 'system', v_product.pawcoin_amount || ' PawCoin yüklendi', 'Satın aldığın PawCoin hesabına eklendi.', null, null);
            v_result := 'pawcoin_added';

        elsif v_product.product_id is null then
            v_result := 'unknown_product';
        else
            -- CANCELLATION (yenileme kapatıldı; süre sonuna kadar Prime sürer), BILLING_ISSUE, TEST vb.
            v_result := 'recorded';
        end if;
    end if;

    insert into store_events (event_id, event_type, user_id, product_id, environment, result, payload)
    values (p_event_id, p_type, case when v_result = 'unknown_user' then null else p_user end, p_product, p_environment, v_result, p_payload);
    return v_result;
end;
$$;

revoke all on function public.apply_store_event(text, text, uuid, text, timestamptz, text, jsonb) from public, anon, authenticated;
grant execute on function public.apply_store_event(text, text, uuid, text, timestamptz, text, jsonb) to service_role;
