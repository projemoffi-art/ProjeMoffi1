const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testCommentLike() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.log("No user session found. Make sure you are logged in or use service role for testing.");
        return;
    }
    console.log("Logged in as:", user.id);

    // Get a random comment
    const { data: comments, error: commentError } = await supabase.from('comments').select('id').limit(1);
    if (commentError || !comments || comments.length === 0) {
        console.log("Error fetching comment or no comments exist:", commentError);
        return;
    }
    const commentId = comments[0].id;
    console.log("Found comment:", commentId);

    // Try to like it
    const { error: insertError } = await supabase.from('comment_likes').insert({
        comment_id: commentId,
        user_id: user.id
    });
    console.log("Insert result error:", insertError);

    // Verify if it exists
    const { data: likes, error: selectError } = await supabase.from('comment_likes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id);
    console.log("Select result:", likes, "Error:", selectError);
    
    // Try to unlike
    const { error: deleteError } = await supabase.from('comment_likes').delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);
    console.log("Delete result error:", deleteError);
}

testCommentLike();
