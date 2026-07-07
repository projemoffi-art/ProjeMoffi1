import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        const cookieStore = cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }
        
        // 1. Create SSR client to verify caller identity
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch (error) {}
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch (error) {}
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Verify caller has admin role
        const { data: profile, error: dbError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (dbError || !profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. You must be an admin to perform this action.' }, { status: 403 });
        }

        // 3. Perform update using service_role to bypass the BEFORE UPDATE trigger's authenticated check
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        const { error: updateError } = await supabaseAdmin.from('profiles').update({
            business_approved: true,
            kyb_status: 'approved',
            role: 'business'
        }).eq('id', userId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
