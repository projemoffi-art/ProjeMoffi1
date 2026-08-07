import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReports() {
    const { data: tables, error } = await supabase.rpc('get_tables_names');
    
    if (error) {
        console.error('Error fetching tables, falling back to basic query:', error.message);
        // Fallback: try to select from likely table names
        const namesToTry = ['reports', 'complaints', 'post_reports', 'user_reports'];
        for (const name of namesToTry) {
            const { error: e } = await supabase.from(name).select('*').limit(1);
            if (!e) {
                console.log(`Found table: ${name}`);
            } else {
                console.log(`Table ${name} not found or no access.`);
            }
        }
    } else {
        console.log('Tables:', tables);
    }
}
checkReports();
