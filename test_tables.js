const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const tables = ['transactions', 'orders', 'products', 'campaigns', 'quests'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('*').limit(1);
    console.log(t + ':', error ? error.message : 'EXISTS');
  }
}
run();
