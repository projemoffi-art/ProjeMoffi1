const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://kedbmjupdwuxtatscyjg.supabase.co';
const supabaseAnonKey = 'sb_publishable_ZomQKWsY5PgIyWhXnuj6sw_w-lfodnk';

console.log('URL:', supabaseUrl);
console.log('Key (start):', supabaseAnonKey?.substring(0, 20));

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
        console.error('Connection failed:', JSON.stringify(error, null, 2));
    } else {
        console.log('Connection successful! Profiles count check passed.');
    }
}

test();
