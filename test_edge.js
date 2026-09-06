require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('unclaimed_patients').select('id').limit(1);
  if (data && data.length > 0) {
    const { data: fnData, error: fnError } = await supabase.functions.invoke('send-claim-sms', { body: { unclaimedPatientId: data[0].id } });
    console.log('Response:', fnData);
    console.log('Error:', fnError);
  } else {
    console.log('No unclaimed patients found.');
  }
}
run();
