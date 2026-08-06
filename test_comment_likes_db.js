const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseAnon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testToggleLike() {
    console.log("Fetching a comment and a user...");
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError || !users.users.length) {
        console.log("No users found.");
        return;
    }
    const userId = users.users[0].id;
    
    // We need to act as this user. Since we don't have their JWT, we can't test RLS from the anon client easily without auth.signInWithPassword.
    // Instead, let's just query comment_likes as the service_role to see if there are ANY comment_likes in the DB!
    const { data: allLikes, error: allLikesError } = await supabase.from('comment_likes').select('*');
    console.log("Total comment likes in DB:", allLikes?.length);
    if (allLikes?.length > 0) {
        console.log("Sample comment like:", allLikes[0]);
    }
    
    if (allLikesError) {
        console.log("Error fetching comment_likes:", allLikesError);
    }
}

testToggleLike();
