import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Yönetici işletme başvurusunu onaylar/reddeder (8.54). Onay bilgisinin tek kaynağı `businesses` kaydı;
// istemcinin bu kolonlara yazma yetkisi yok, bu yüzden yönetici doğrulandıktan sonra service_role ile yazılır.
// Eski profil kolonları temizlik migration'ına kadar aynı değerle tutulur (eski ekranlar okumaya devam ediyor).
export async function reviewBusiness(req: Request, decision: 'approve' | 'reject') {
    try {
        const body = await req.json();
        const businessId: string | undefined = body.businessId || body.userId;
        const reason: string = (body.reason || '').toString().trim().slice(0, 500);
        if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
        if (decision === 'reject' && !reason) return NextResponse.json({ error: 'Ret sebebi gerekli' }, { status: 400 });

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !anonKey || !serviceKey) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

        const cookieStore = await cookies();
        const supabase = createServerClient(url, anonKey, {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll(list) {
                    try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* route handler */ }
                },
            },
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (me?.role !== 'admin') return NextResponse.json({ error: 'Bu işlem için yönetici olmalısın.' }, { status: 403 });
        // getUser() ile doğrulanmış oturumun güvence düzeyi (iki adımlı doğrulama tamamlandı mı)
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.currentLevel !== 'aal2') return NextResponse.json({ error: 'Bu işlem için iki adımlı doğrulama gerekli.' }, { status: 403 });

        const admin = createClient(url, serviceKey);
        const patch = decision === 'approve'
            ? { approved: true, kyb_status: 'approved', kyb_rejection_reason: null }
            : { approved: false, kyb_status: 'rejected', kyb_rejection_reason: reason };

        const { data: updated, error } = await admin.from('businesses').update(patch).eq('id', businessId).select('id');
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        if (!updated?.length) return NextResponse.json({ error: 'İşletme bulunamadı' }, { status: 404 });

        // Geçiş dönemi: eski işletme hesabının profil kolonları (aynı kimlikle taşınanlar için).
        await admin.from('profiles').update({
            business_approved: patch.approved,
            kyb_status: patch.kyb_status,
            kyb_rejection_reason: patch.kyb_rejection_reason,
        }).eq('id', businessId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || 'Hata' }, { status: 500 });
    }
}
