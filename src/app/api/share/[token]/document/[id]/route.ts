import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Paylaşılan pasaporttaki bir belgeyi açar. Belgeler özel alanda durur; bağlantı açıksa, sahip
// "Belgeler"i paylaşmışsa ve belge o evcil hayvana aitse 5 dakikalık imzalı adrese yönlendirir.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(_req: Request, { params }: { params: Promise<{ token: string; id: string }> }) {
    const { token, id } = await params;
    if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Sunucu yapılandırması eksik.' }, { status: 503 });
    if (!/^[0-9a-f]{32}$/.test(token) || !/^[0-9a-f-]{36}$/i.test(id)) {
        return NextResponse.json({ error: 'Geçersiz bağlantı.' }, { status: 404 });
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: link } = await admin.from('pet_share_links')
        .select('pet_id, sections, expires_at, revoked_at').eq('token', token).maybeSingle();
    if (!link || link.revoked_at || new Date(link.expires_at) <= new Date() || !(link.sections || []).includes('documents')) {
        return NextResponse.json({ error: 'Bu bağlantı artık açık değil.' }, { status: 404 });
    }

    const { data: doc } = await admin.from('pet_documents')
        .select('storage_path').eq('id', id).eq('pet_id', link.pet_id).maybeSingle();
    if (!doc) return NextResponse.json({ error: 'Belge bulunamadı.' }, { status: 404 });

    const { data: signed, error } = await admin.storage.from('medical-documents').createSignedUrl(doc.storage_path, 300);
    if (error || !signed?.signedUrl) return NextResponse.json({ error: 'Belge açılamadı.' }, { status: 500 });
    return NextResponse.redirect(signed.signedUrl, { headers: { 'Cache-Control': 'no-store' } });
}
