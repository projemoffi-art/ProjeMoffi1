const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
// DÝKKAT: SERVICE_ROLE_KEY DEÐÝL, ANON_KEY KULLANILIYOR
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const clinicId = '5a770525-c035-4483-a041-51da175f4e6c';
  console.log('Testing appointments for clinic_id:', clinicId);
  
  const { data, error } = await supabase
    .from('appointments')
    .select('*, pet:pets(*), user:profiles!appointments_user_id_fkey(full_name, username, avatar_url, phone)')
    .eq('clinic_id', clinicId)
    .order('appointment_date', { ascending: false });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data count:', data.length);
    console.log('Data:', JSON.stringify(data, null, 2));
  }
}
run();
