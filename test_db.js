const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: clinics, error: err1 } = await supabase.from('clinics').select('*').limit(1);
  console.log('clinics sample:', clinics ? clinics[0] : err1);

  const { data: appointments, error: err2 } = await supabase.from('appointments').select('*');
  const { data: profiles } = await supabase.from('profiles').select('id');
  
  if (appointments) {
    const profileIds = new Set(profiles.map(p => p.id));
    const orphans = appointments.filter(a => !profileIds.has(a.user_id) || !profileIds.has(a.clinic_id));
    console.log('Orphan count:', orphans.length);
  } else {
    console.log('Appointments error:', err2);
  }
}
run();
