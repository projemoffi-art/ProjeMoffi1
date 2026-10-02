import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Yapay zekâ uç noktalarının ortak kapısı (8.52): giriş + kota (ai_consume) çağrıdan ÖNCE, sonuç ve maliyet
// (ai_finish, servis rolü) SONRA. Hak bitince 402 ile kullanıcıya PawCoin/Prime seçeneği döner.

export const AI_MODEL = 'gemini-2.5-flash-lite';

export type AiKind = 'message' | 'photo';

type Started = {
    ok: true;
    userId: string;
    finish: (success: boolean, usage?: { inputTokens?: number; outputTokens?: number }) => Promise<void>;
};
type Blocked = { ok: false; response: NextResponse };

const REASON_TEXT: Record<string, string> = {
    quota: 'Bugünkü ücretsiz yapay zekâ hakkın doldu.',
    balance: 'Bu işlem için PawCoin bakiyen yetmiyor.',
    daily_cap: 'Bugün için yapay zekâ kullanım sınırına ulaştın, yarın tekrar dene.',
    capacity: 'Yapay zekâ bu ay için kapasitesine ulaştı, ayın başında yeniden açılacak.',
};

export async function startAi(kind: AiKind, endpoint: string, pay: boolean): Promise<Started | Blocked> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anon, {
        cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll(list) {
                try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* route handler */ }
            },
        },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, response: NextResponse.json({ error: 'unauthorized', message: 'Giriş yapman gerekiyor.' }, { status: 401 }) };

    const { data, error } = await supabase.rpc('ai_consume', { p_kind: kind, p_endpoint: endpoint, p_pay: pay });
    if (error) return { ok: false, response: NextResponse.json({ error: 'quota_check_failed', message: 'Şu an yapay zekâya ulaşılamıyor.' }, { status: 503 }) };

    const r = data as { allowed: boolean; usage_id?: string; reason?: string; price?: number; balance?: number; prime?: boolean };
    if (!r.allowed) {
        return {
            ok: false,
            response: NextResponse.json({
                error: 'quota',
                reason: r.reason,
                message: REASON_TEXT[r.reason || 'quota'] || REASON_TEXT.quota,
                price: r.price ?? null,
                balance: r.balance ?? null,
                prime: !!r.prime,
            }, { status: 402 }),
        };
    }

    const usageId = r.usage_id!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    return {
        ok: true,
        userId: user.id,
        finish: async (success, usage) => {
            if (!serviceKey) { console.error('[aiGuard] SUPABASE_SERVICE_ROLE_KEY yok, kullanım kaydı tamamlanamadı'); return; }
            const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
            const { error: finishError } = await admin.rpc('ai_finish', {
                p_id: usageId, p_ok: success, p_model: AI_MODEL,
                p_input_tokens: usage?.inputTokens ?? null, p_output_tokens: usage?.outputTokens ?? null,
            });
            if (finishError) console.error('[aiGuard] ai_finish:', finishError.message);
        },
    };
}
