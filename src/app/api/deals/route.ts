import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

        // Fetch active deals
        let query = supabase
            .from('business_deals')
            .select(`
                *,
                business:business_id (
                    full_name,
                    avatar_url
                )
            `)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        const { data: deals, error } = await query;

        if (error) {
            console.error('Fetch deals error:', error);
            return NextResponse.json({ error: error.message || 'Veri çekilemedi' }, { status: 500 });
        }

        const { data: { user } } = await supabase.auth.getUser();

        let filteredDeals = deals || [];

        // Smart Targeting: If user is logged in, filter by pet type
        if (user) {
            const { data: pets } = await supabase
                .from('pets')
                .select('type, species')
                .eq('owner_id', user.id);
            
            if (pets && pets.length > 0) {
                // Determine user's pet types (convert to lowercase for robust matching)
                const petTypes = new Set(pets.flatMap(p => [
                    (p.type || '').toLowerCase(), 
                    (p.species || '').toLowerCase()
                ]).filter(Boolean));
                
                const hasDog = petTypes.has('köpek') || petTypes.has('dog');
                const hasCat = petTypes.has('kedi') || petTypes.has('cat');

                filteredDeals = filteredDeals.filter(deal => {
                    const target = (deal.target_pet_type || 'all').toLowerCase();
                    if (target === 'all') return true;
                    if (target === 'dog' && hasDog) return true;
                    if (target === 'cat' && hasCat) return true;
                    if (target === 'köpek' && hasDog) return true;
                    if (target === 'kedi' && hasCat) return true;
                    return false;
                });
            }
        }

        // Check max_uses limitation
        filteredDeals = filteredDeals.filter(deal => {
            if (deal.max_uses && deal.current_uses >= deal.max_uses) {
                return false;
            }
            return true;
        });

        return NextResponse.json({ success: true, deals: filteredDeals });

    } catch (err: any) {
        console.error('Deals API error:', err);
        return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
    }
}
