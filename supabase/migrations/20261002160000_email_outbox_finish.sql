-- E-posta kuyruğu: gönderim sonucu yetkili fonksiyonla yazılır (servis rolünün tabloya doğrudan yetkisi yok),
-- yarıda kalan ("sending"de 15 dk'dan uzun bekleyen) işler yeniden alınır.
create or replace function public.finish_email_outbox(p_id uuid, p_sent boolean, p_error text default null)
returns void language sql security definer set search_path to 'public' as $$
    update email_outbox
       set status = case when p_sent then 'sent' when attempts >= 5 then 'failed' else 'pending' end,
           sent_at = case when p_sent then now() else sent_at end,
           last_error = case when p_sent then null else left(p_error, 500) end
     where id = p_id and status = 'sending';
$$;

revoke all on function public.finish_email_outbox(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.finish_email_outbox(uuid, boolean, text) to service_role;

alter table public.email_outbox add column if not exists claimed_at timestamptz;

create or replace function public.claim_email_outbox(p_limit integer default 40)
returns setof email_outbox language sql security definer set search_path to 'public' as $$
  update email_outbox e set status = 'sending', attempts = e.attempts + 1, claimed_at = now()
   where e.id in (
     select id from email_outbox
      where attempts < 5
        and (status = 'pending' or (status = 'sending' and claimed_at < now() - interval '15 minutes'))
      order by created_at
      limit least(greatest(p_limit, 1), 100)
      for update skip locked)
  returning e.*;
$$;

-- Zamanlayıcı yarıda kalan işleri de görsün
select cron.schedule('appointment-reminders-and-emails', '*/5 * * * *', $cmd$
  select public.enqueue_appointment_reminders();
  select net.http_post(
    url := 'https://app.moffi.net/api/cron/email-outbox',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'email_cron_secret')
    ),
    body := '{}'::jsonb
  )
  where exists (select 1 from public.email_outbox where attempts < 5
                  and (status = 'pending' or (status = 'sending' and claimed_at < now() - interval '15 minutes')));
$cmd$);
