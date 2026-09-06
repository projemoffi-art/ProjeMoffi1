require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- 1. SMS LOGS ---");
  const { data: logs, error: err1 } = await supabase
    .from('sms_log')
    .select('phone, mode, status, provider_response')
    .order('created_at', { ascending: false })
    .limit(3);
  if (err1) console.error(err1);
  else console.table(logs);

  console.log("\n--- 2. UNCLAIMED PATIENTS STATUS ---");
  const { data: pats, error: err2 } = await supabase
    .from('unclaimed_patients')
    .select('raw_name, normalized_phone, status')
    .eq('status', 'sms_sent')
    .limit(3);
  if (err2) console.error(err2);
  else console.table(pats);

  console.log("\n--- 3. RPC OUTPUT (Service Role) ---");
  // service_role call (auth.uid() is null, but shows structure)
  const { data: rpc, error: err3 } = await supabase.rpc('get_my_sms_status');
  if (err3) console.error(err3);
  else console.log(JSON.stringify(rpc, null, 2));
}
run();
