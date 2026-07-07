import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { deal_id, action } = body;

        if (!deal_id || !action) {
            return NextResponse.json({ error: 'Missing deal_id or action' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value; },
                    set(name: string, value: string, options: CookieOptions) {
                        try { cookieStore.set({ name, value, ...options }); } catch (error) {}
                    },
                    remove(name: string, options: CookieOptions) {
                        try { cookieStore.set({ name, value: '', ...options }); } catch (error) {}
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Insert analytics record
        const { error: insertError } = await supabase
            .from('deal_analytics')
            .insert({
                deal_id,
                user_id: user.id,
                action
            });

        if (insertError) {
            console.error('Track error:', insertError);
            return NextResponse.json({ error: 'Analitik kaydedilemedi.' }, { status: 500 });
        }

        // If action is redeem, increment current_uses safely via RPC, or just update if we don't have RPC
        // For simplicity without RPC, we'll just read and update. In prod, an RPC like increment_deal_uses is better to prevent race conditions.
        if (action === 'redeem') {
            const { data: deal } = await supabase.from('business_deals').select('current_uses, max_uses').eq('id', deal_id).single();
            if (deal) {
                if (deal.max_uses && deal.current_uses >= deal.max_uses) {
                    return NextResponse.json({ error: 'Kupon limiti dolmuş.' }, { status: 400 });
                }
                // Ideally this should use an RPC function, but simple update for now:
                // Note: RLS might block this if user is not business, so we need SERVICE_ROLE_KEY to increment securely.
                const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                if (supabaseServiceRoleKey) {
                    const adminSupabase = createServerClient(supabaseUrl, supabaseServiceRoleKey, { cookies: {} as any });
                    await adminSupabase.rpc('increment_deal_uses', { deal_id_param: deal_id }); 
                    // Fallback to update if RPC not created yet:
                    await adminSupabase.from('business_deals').update({ current_uses: deal.current_uses + 1 }).eq('id', deal_id);
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('Track API error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
