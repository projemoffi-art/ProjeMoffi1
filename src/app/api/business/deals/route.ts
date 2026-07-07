import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, description, media_url, deal_type, value, coupon_code, target_pet_type, expires_at, max_uses } = body;

        if (!title || !media_url || !expires_at) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify if user is a business
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, business_approved')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'business' || !profile?.business_approved) {
            return NextResponse.json({ error: 'Sadece onaylı işletmeler kampanya oluşturabilir.' }, { status: 403 });
        }

        // Insert deal
        const { data: deal, error: insertError } = await supabase
            .from('business_deals')
            .insert({
                business_id: user.id,
                title,
                description,
                media_url,
                deal_type: deal_type || 'discount',
                value,
                coupon_code,
                target_pet_type: target_pet_type || 'all',
                expires_at,
                max_uses: max_uses || null,
                status: 'active'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert deal error:', insertError);
            return NextResponse.json({ error: 'Kampanya oluşturulamadı.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, deal });

    } catch (err: any) {
        console.error('Business deals API error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
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

        const { data: deals, error } = await supabase
            .from('business_deals')
            .select('*')
            .eq('business_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: 'Veri çekilemedi' }, { status: 500 });
        }

        return NextResponse.json({ success: true, deals });
    } catch (err: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
