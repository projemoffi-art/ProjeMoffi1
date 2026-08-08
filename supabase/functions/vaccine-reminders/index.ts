import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import webpush from "npm:web-push";

// VAPID keys for Web Push
webpush.setVapidDetails(
    'mailto:test@example.com',
    Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY') || '',
    Deno.env.get('VAPID_PRIVATE_KEY') || ''
);

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
    // Only allow POST requests for this trigger
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const now = new Date();

    // Tüm bekleyen aşıları çek (henüz status='completed' olmamış)
    const { data: pendingVaccines, error } = await supabase
        .from('vaccines')
        .select('id, name, next_due_date, pet_id, pets(name, owner_id)')
        .eq('status', 'pending');

    if (error) {
        console.error('Vaccine query error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const vaccine of pendingVaccines ?? []) {
        const pet = (vaccine as any).pets;
        if (!pet?.owner_id) continue;

        const dueDate = new Date(vaccine.next_due_date);
        const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Hangi aşamadayız? (Pencereler çakışmıyor, cron gecikmesine dayanıklı)
        let stage: '30d' | '14d' | '3d' | 'overdue' | null = null;
        if (daysUntilDue <= 30 && daysUntilDue > 14) stage = '30d';
        else if (daysUntilDue <= 14 && daysUntilDue > 3) stage = '14d';
        else if (daysUntilDue <= 3 && daysUntilDue >= 0) stage = '3d';
        else if (daysUntilDue < 0) stage = 'overdue';

        if (!stage) { skippedCount++; continue; } // henüz 30 günden uzak

        // Bu aşama için daha önce gönderildi mi kontrol et (idempotency)
        const { data: existingLog } = await supabase
            .from('vaccine_reminder_log')
            .select('id')
            .eq('vaccine_id', vaccine.id)
            .eq('stage', stage)
            .maybeSingle();

        if (existingLog) { skippedCount++; continue; } // bu aşama zaten gönderilmiş

        const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth_key')
            .eq('user_id', pet.owner_id);

        if (!subs || subs.length === 0) continue;

        const stageMessages: Record<string, { title: string; body: string }> = {
            '30d': { title: `${pet.name} - Aşı Zamanı Yaklaşıyor 📅`, body: `${vaccine.name} aşısına 30 gün kaldı, planlamaya başlayabilirsin.` },
            '14d': { title: `${pet.name} - Aşı Zamanı Yaklaşıyor 💉`, body: `${vaccine.name} aşısına 14 gün kaldı.` },
            '3d': { title: `${pet.name} - Aşı Zamanı Çok Yakın! ⏰`, body: `${vaccine.name} aşısına sadece birkaç gün kaldı.` },
            'overdue': { title: `${pet.name} - Aşı Zamanı Geçti! ⚠️`, body: `${vaccine.name} aşısının zamanı geçti, lütfen en kısa sürede randevu al.` },
        };

        const payload = JSON.stringify({
            ...stageMessages[stage],
            url: `/home`,
            tag: `vaccine-${vaccine.id}-${stage}`,
        });

        let successCountForThisStage = 0;
        for (const sub of subs) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
                    payload
                );
                sentCount++;
                successCountForThisStage++;
            } catch (e: any) {
                failedCount++;
                if (e.statusCode === 410 || e.statusCode === 404) {
                    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
                }
                console.error('Push send failed:', e.message);
            }
        }

        // Sadece en az bir gönderim başarılıysa bu aşamayı loglama (Aşama 2'deki dersle tutarlı)
        if (successCountForThisStage > 0) {
            await supabase.from('vaccine_reminder_log').insert({ vaccine_id: vaccine.id, stage });
        }
    }

    return new Response(
        JSON.stringify({ processed: pendingVaccines?.length ?? 0, sentCount, failedCount, skippedCount }),
        { headers: { 'Content-Type': 'application/json' } }
    );
});
