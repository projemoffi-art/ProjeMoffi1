-- Genel kontrol: giriş yapmamış (anon) ve giriş yapmış herkesin çağırabildiği, hiçbir ekranın kullanmadığı fonksiyonları kapat.
-- get_auth_email(uuid): herhangi bir kullanıcının e-postasını kimlik numarasıyla sızdırıyordu.
-- increment_deal_uses: herkes herhangi bir kuponun kullanım sayısını şişirebiliyordu (sadece sunucu çağırır).
-- request_data_deletion: başkası adına silme talebi kaydı atılabiliyordu (yerini request_account_deletion aldı).
-- expire_old_unclaimed_patients / purge_expired_unclaimed_patients: bakım işleri, ekran ve zamanlayıcı kullanmıyor.

revoke all on function public.get_auth_email(uuid) from public, anon, authenticated;
revoke all on function public.request_data_deletion(uuid) from public, anon, authenticated;
revoke all on function public.expire_old_unclaimed_patients() from public, anon, authenticated;
revoke all on function public.purge_expired_unclaimed_patients() from public, anon, authenticated;

revoke all on function public.increment_deal_uses(uuid) from public, anon, authenticated;
grant execute on function public.increment_deal_uses(uuid) to service_role;

-- Tetikleyici fonksiyonları doğrudan çağrılmaz (tetikleme sırasında çağıran yetkisi aranmaz)
do $$ declare f record; begin
    for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.prorettype = 'trigger'::regtype loop
        execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    end loop;
end $$;

-- Sadece giriş yapmış kullanıcının kullanacağı fonksiyonlar anon'a kapatılır (herkese açık sayfa fonksiyonları — künye,
-- paylaşılan pasaport, "gördüm" bildirimi — bilerek açık kalır).
-- check_unclaimed_matches: telefon numarası deneyerek hangi klinikte hangi evcil hayvanın kayıtlı olduğu öğrenilebiliyordu.
-- get_user_comment_likes: herkesin hangi yorumları beğendiği görünüyordu.
revoke all on function public.check_unclaimed_matches(text) from public, anon;
revoke all on function public.get_user_comment_likes(uuid, uuid[]) from public, anon;
revoke all on function public.get_active_users_at_location(double precision, double precision, double precision) from public, anon;
revoke all on function public.approve_manual_claim(uuid) from public, anon;
revoke all on function public.get_my_sms_status() from public, anon;
revoke all on function public.get_my_unclaimed_patients() from public, anon;
revoke all on function public.set_clinic_sms_settings(text, text, text, text) from public, anon;
revoke all on function public.insert_unclaimed_patient(text, text, text, text, text, text) from public, anon;
