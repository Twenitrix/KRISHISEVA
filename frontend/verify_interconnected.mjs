import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xksoqrtuvfzdemmkjpti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrc29xcnR1dmZ6ZGVtbWtqcHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTg3MjIsImV4cCI6MjA5OTA5NDcyMn0.8wgyba04fZoL_8yMBuyVGoPN217mRmFQMFiQF9UUlm4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInterconnected() {
  console.log('\n🔍 Verifying Interconnected Thread Data...');
  
  // 1. Check Farmer
  const { data: farmer } = await supabase.from('farmers').select('*').eq('id', 'f-interconnected-harish').single();
  console.log(`Farmer: ${farmer?.name} | Aadhaar: ${farmer?.aadhaar_masked}`);

  // 2. Check NGO
  const { data: ngo } = await supabase.from('ngos').select('*').eq('id', 'ngo-interconnected-mitra').single();
  console.log(`NGO: ${ngo?.name} | Email: ${ngo?.email}`);

  // 3. Check Official
  const { data: official } = await supabase.from('officials').select('*').eq('id', 'off-interconnected-ao').single();
  console.log(`Official: ${official?.name} | Email: ${official?.email}`);

  // 4. Check Claims (Should be exactly 10)
  const { data: claims } = await supabase.from('claims').select('id, survey_number, status, claimed_event_type').eq('farmer_id', 'f-interconnected-harish');
  console.log(`Claims Count: ${claims?.length} (Expected: 10)`);
  
  console.log('\n📋 Interconnected Claims Checklist:');
  claims.forEach((c, idx) => {
    console.log(`   Claim ${idx + 1}: ID: ${c.id} | Survey: ${c.survey_number} | Status: ${c.status} | Event: ${c.claimed_event_type}`);
  });

  if (claims?.length === 10) {
    console.log('\n🎉 Verification Successful! All 10 cases populated and linked correctly.');
  } else {
    console.log('\n❌ Verification Failed: Claims count mismatch.');
  }
}

testInterconnected().catch(console.error);
