import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Supabase pg_cron (account-purge-daily) her gece, 30 günlük bekleme süresi dolmuş hesap varsa çağırır.
// Anahtar e-posta kuyruğuyla aynı: vault email_cron_secret = Vercel EMAIL_CRON_SECRET.
function authorized(request: Request) {
    const expected = process.env.EMAIL_CRON_SECRET;
    const given = request.headers.get("x-cron-secret");
    if (!expected || !given) return false;
    const a = Buffer.from(expected);
    const b = Buffer.from(given);
    return a.length === b.length && timingSafeEqual(a, b);
}

// Kullanıcının dosyaları her depoda kendi kimliğiyle başlayan klasörde durur.
async function collectFiles(admin: SupabaseClient, bucket: string, prefix: string, depth = 0): Promise<string[]> {
    if (depth > 4) return [];
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error || !data) return [];
    const files: string[] = [];
    for (const entry of data) {
        const path = `${prefix}/${entry.name}`;
        if (entry.id) files.push(path);
        else files.push(...await collectFiles(admin, bucket, path, depth + 1));
    }
    return files;
}

async function removeUserFiles(admin: SupabaseClient, userId: string) {
    const { data: buckets } = await admin.storage.listBuckets();
    let removed = 0;
    for (const bucket of buckets || []) {
        const files = await collectFiles(admin, bucket.name, userId);
        for (let i = 0; i < files.length; i += 100) {
            const batch = files.slice(i, i + 100);
            const { error } = await admin.storage.from(bucket.name).remove(batch);
            if (!error) removed += batch.length;
        }
    }
    return removed;
}

export async function POST(request: Request) {
    if (!authorized(request)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: "Supabase admin config missing" }, { status: 500 });
    }
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: due, error } = await admin.rpc("due_account_deletions", { p_limit: 20 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const results: { user: string; ok: boolean; files?: number; error?: string }[] = [];
    for (const userId of (due as string[]) || []) {
        try {
            // Süre hâlâ dolmuş mu (bu arada geri alınmış olabilir) + başkalarına ait kayıtları isimsizleştir
            const { data: ready, error: prepError } = await admin.rpc("prepare_account_purge", { p_user: userId });
            if (prepError) throw new Error(prepError.message);
            if (!ready) continue;

            // Önce hesap (veritabanı kayıtları tek seferde gider), sonra dosyalar: hesap silinemezse dosyalar da kalır
            const { error: delError } = await admin.auth.admin.deleteUser(userId);
            if (delError) throw new Error(delError.message);
            const files = await removeUserFiles(admin, userId);
            results.push({ user: userId, ok: true, files });
        } catch (err: any) {
            console.error("[account-purge] Silinemedi:", userId, err?.message || err);
            results.push({ user: userId, ok: false, error: String(err?.message || err).slice(0, 300) });
        }
    }

    return NextResponse.json({ processed: results.length, results });
}
