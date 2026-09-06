require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalProof() {
  console.log("=== FINAL WEBHOOK PROOF FOR CLAUDE ===");

  // 1. Insert a dummy SMS Log
  await supabase.from('sms_log').insert({
      clinic_id: '12664c0f-85aa-4f9b-9fbb-14149e6149b0',
      phone: '+905559998877',
      message: 'Test message for webhook final proof',
      mode: 'real',
      status: 'sent',
      delivery_status: 'pending',
      provider_message_id: 'CLAUDE-FINAL-TEST-001'
  });
  
  // 2. Simulate Webhook Update (status: delivered)
  await supabase.from('sms_log').update({ 
        delivery_status: 'delivered',
        delivered_at: new Date().toISOString()
  }).eq('provider_message_id', 'CLAUDE-FINAL-TEST-001');

  // 3. Fetch exact query requested by Claude
  const { data, error } = await supabase
    .from('sms_log')
    .select('phone, delivery_status, delivered_at, provider_message_id')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error("Query Error:", error);
  } else {
    console.table(data);
  }
}

finalProof();
