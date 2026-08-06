import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    // Attempt to select is_liked from story_views
    const { data, error } = await supabase.from('story_views').select('is_liked').limit(1);
    if (error) {
        console.error("Error fetching is_liked:", error.message);
    } else {
        console.log("Success! is_liked exists.");
    }
}

check();
