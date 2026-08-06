const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: "SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE event_object_table = 'comment_likes';" });
    console.log(data, error);
})();
