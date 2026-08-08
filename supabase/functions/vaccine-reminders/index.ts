// Deno Edge Function - günlük çalışır, yaklaşan/geçmiş aşıları bulur,
// ilgili pet owner'ın push_subscriptions'larına bildirim gönderir.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:destek@moffi.net';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req) => {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 3 gün içinde vadesi gelecek VEYA zaten geçmiş, henüz hatırlatma
    // gönderilmemiş aşıları bul
    const { data: dueVaccines, error } = await supabase
        .from('vaccines')
        .select('id, name, next_due_date, pet_id, pets(name, owner_id)')
        .eq('status', 'pending')
        .is('reminder_sent_at', null)
        .lte('next_due_date', in3Days.toISOString());

    if (error) {
        console.error('Vaccine query error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const vaccine of dueVaccines ?? []) {
        const pet = (vaccine as any).pets;
        if (!pet?.owner_id) continue;

        const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth_key')
            .eq('user_id', pet.owner_id);

        if (!subs || subs.length === 0) continue;

        const isOverdue = new Date(vaccine.next_due_date) < now;
        const payload = JSON.stringify({
            title: isOverdue ? `${pet.name} - Aşı Zamanı Geçti! ⚠️` : `${pet.name} - Aşı Zamanı Yaklaşıyor 💉`,
            body: `${vaccine.name} aşısının zamanı ${isOverdue ? 'geçti' : 'yaklaşıyor'}. Detaylar için dokun.`,
            url: `/home`, // TODO: Pati kartı/pasaport sayfası yapıldığında burayı güncelle
            tag: `vaccine-${vaccine.id}`,
        });

        let successCountForThisVaccine = 0;

        for (const sub of subs) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth_key },
                    },
                    payload
                );
                sentCount++;
                successCountForThisVaccine++;
            } catch (e: any) {
                failedCount++;
                // 410 Gone / 404 -> abonelik artık geçersiz, temizle
                if (e.statusCode === 410 || e.statusCode === 404) {
                    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
                }
                console.error('Push send failed:', e.message);
            }
        }

        // Sadece en az bir gönderim başarılıysa damgala (tekrar spam olmasın)
        if (successCountForThisVaccine > 0) {
            await supabase.from('vaccines').update({ reminder_sent_at: now.toISOString() }).eq('id', vaccine.id);
        }
    }

    return new Response(
        JSON.stringify({ processed: dueVaccines?.length ?? 0, sentCount, failedCount }),
        { headers: { 'Content-Type': 'application/json' } }
    );
});
