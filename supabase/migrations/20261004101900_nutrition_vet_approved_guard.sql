-- Diyet planındaki "veteriner onaylı" işaretini sahip kendisi koyamaz (2026-10-04).
-- nutrition_plans'a sahip doğrudan yazar (RLS: hayvanın sahibi); vet_approved yalnızca sunucu tarafında
-- (ileride veterinerin onay fonksiyonu) değişebilir. Profil koruma tetikleyicileriyle aynı desen (8.66): istemci rolleri.
create or replace function public.nutrition_plans_guard()
returns trigger
language plpgsql
security invoker
set search_path to 'public'
as $$
begin
    if current_user in ('authenticated', 'anon') then
        if tg_op = 'INSERT' then
            new.vet_approved := false;
        else
            new.vet_approved := old.vet_approved;
        end if;
    end if;
    return new;
end $$;

create trigger nutrition_plans_guard
before insert or update on public.nutrition_plans
for each row execute function public.nutrition_plans_guard();
