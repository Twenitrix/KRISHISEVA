/**
 * KrishiSeva — Login & Database Verification Script
 * Tests Supabase connectivity and data integrity for all 3 portals.
 * Run: node verify_logins.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xksoqrtuvfzdemmkjpti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrc29xcnR1dmZ6ZGVtbWtqcHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTg3MjIsImV4cCI6MjA5OTA5NDcyMn0.8wgyba04fZoL_8yMBuyVGoPN217mRmFQMFiQF9UUlm4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let pass = 0;
let fail = 0;

async function test(name, fn) {
  try {
    const result = await fn();
    if (result) {
      console.log(`  ✅ ${name}`);
      pass++;
    } else {
      console.log(`  ❌ ${name} — returned falsy`);
      fail++;
    }
  } catch (err) {
    console.log(`  ❌ ${name} — ${err.message}`);
    fail++;
  }
}

console.log('\n═══════════════════════════════════════════════');
console.log('  KrishiSeva — Database & Login Verification');
console.log('═══════════════════════════════════════════════\n');

// ─── 1. Table existence & seed data counts ───
console.log('📊 Domain Seed Data (6 per domain):');

await test('Villages table exists & has seed', async () => {
  const { data, error } = await supabase.from('villages').select('id');
  if (error) throw new Error(error.message);
  console.log(`     → ${data.length} village(s)`);
  return data.length >= 1;
});

await test('Farmers: 6 seeded records', async () => {
  const { data, error } = await supabase.from('farmers').select('id, name, aadhaar_masked');
  if (error) throw new Error(error.message);
  console.log(`     → ${data.length} farmer(s): ${data.map(f => f.name).join(', ')}`);
  return data.length >= 6;
});

await test('NGOs: 6 seeded records', async () => {
  const { data, error } = await supabase.from('ngos').select('id, name, email');
  if (error) throw new Error(error.message);
  console.log(`     → ${data.length} NGO(s): ${data.map(n => n.name).join(', ')}`);
  return data.length >= 6;
});

await test('Officials: 6 seeded records', async () => {
  const { data, error } = await supabase.from('officials').select('id, name, email, designation');
  if (error) throw new Error(error.message);
  console.log(`     → ${data.length} official(s): ${data.map(o => `${o.name} (${o.designation})`).join(', ')}`);
  return data.length >= 6;
});

await test('Land Registries: 6 seeded records', async () => {
  const { data, error } = await supabase.from('land_registries').select('id, farmer_id, survey_number, crop_on_record');
  if (error) throw new Error(error.message);
  console.log(`     → ${data.length} land record(s)`);
  return data.length >= 6;
});

await test('Claims: 6 seeded records', async () => {
  const { data, error } = await supabase.from('claims').select('id, farmer_name, status, claimed_event_type');
  if (error) throw new Error(error.message);
  console.log(`     → ${data.length} claim(s): ${data.map(c => `${c.farmer_name}/${c.status}`).join(', ')}`);
  return data.length >= 6;
});

await test('NGO Verifications: 6 seeded records', async () => {
  const { data, error } = await supabase.from('ngo_verifications').select('id, ngo_id, claim_id');
  if (error) throw new Error(error.message);
  console.log(`     → ${data.length} verification(s)`);
  return data.length >= 6;
});

await test('Auth Logs: 6 seeded records', async () => {
  const { data, error } = await supabase.from('auth_logs').select('id, user_id, role, action, identifier, status');
  if (error) throw new Error(error.message);
  console.log(`     → ${data.length} auth log(s):`);
  data.forEach(l => console.log(`       • [${l.role}] ${l.action} | ${l.identifier} → ${l.status}`));
  return data.length >= 6;
});

await test('Claim Status Logs exist', async () => {
  const { data, error } = await supabase.from('claim_status_logs').select('id');
  if (error) throw new Error(error.message);
  console.log(`     → ${data.length} status log(s)`);
  return data.length >= 1;
});

await test('Crop Insured Sums exist', async () => {
  const { data, error } = await supabase.from('crop_insured_sums').select('id, crop_name, insured_sum_per_hectare');
  if (error) throw new Error(error.message);
  console.log(`     → ${data.length} crop policies: ${data.map(c => `${c.crop_name} ₹${c.insured_sum_per_hectare}/ha`).join(', ')}`);
  return data.length >= 4;
});

// ─── 2. Farmer Aadhaar lookup simulation ───
console.log('\n🪪 Farmer Aadhaar Lookup Tests:');

await test('Suresh Rao (XXXX-XXXX-9012) found by aadhaar_masked', async () => {
  const { data, error } = await supabase.from('farmers').select('*').eq('aadhaar_masked', 'XXXX-XXXX-9012').maybeSingle();
  if (error) throw new Error(error.message);
  console.log(`     → Found: ${data?.name} (ID: ${data?.id})`);
  return data?.id === 'f1-uuid-suresh';
});

await test('Ramesh Kumar (XXXX-XXXX-9013) found', async () => {
  const { data } = await supabase.from('farmers').select('*').eq('aadhaar_masked', 'XXXX-XXXX-9013').maybeSingle();
  console.log(`     → Found: ${data?.name}`);
  return data?.id === 'f2-uuid-ramesh';
});

await test('Unknown Aadhaar (XXXX-XXXX-7777) returns null (signup path)', async () => {
  const { data } = await supabase.from('farmers').select('*').eq('aadhaar_masked', 'XXXX-XXXX-7777').maybeSingle();
  console.log(`     → Result: ${data ? data.name : 'null (new farmer signup)'}`);
  return data === null;
});

// ─── 3. NGO email lookup ───
console.log('\n🤝 NGO Login Lookup Tests:');

await test('Green Earth (contact@greenearth.org) found', async () => {
  const { data } = await supabase.from('ngos').select('*').eq('email', 'contact@greenearth.org').maybeSingle();
  console.log(`     → Found: ${data?.name} (ID: ${data?.id})`);
  return data?.id === 'ngo1-uuid-green';
});

await test('Vikas Foundation (contact@vikas.org) found', async () => {
  const { data } = await supabase.from('ngos').select('*').eq('email', 'contact@vikas.org').maybeSingle();
  console.log(`     → Found: ${data?.name}`);
  return data?.id === 'ngo2-uuid-vikas';
});

// ─── 4. Official email lookup ───
console.log('\n🏛️  Official Login Lookup Tests:');

await test('SDM Rajesh (official@gov.in) found', async () => {
  const { data } = await supabase.from('officials').select('*').eq('email', 'official@gov.in').maybeSingle();
  console.log(`     → Found: ${data?.name} — ${data?.designation}`);
  return data?.id === 'off1-uuid-sdm';
});

await test('Collector (collector@gov.in) found', async () => {
  const { data } = await supabase.from('officials').select('*').eq('email', 'collector@gov.in').maybeSingle();
  console.log(`     → Found: ${data?.name} — ${data?.designation}`);
  return data?.id === 'off2-uuid-coll';
});

// ─── 5. Cross-domain integrity ───
console.log('\n🔗 Cross-Domain Integrity:');

await test('Claims reference valid farmers', async () => {
  const { data: claims } = await supabase.from('claims').select('id, farmer_id');
  for (const c of claims) {
    const { data: farmer } = await supabase.from('farmers').select('id').eq('id', c.farmer_id).maybeSingle();
    if (!farmer) throw new Error(`Claim ${c.id} references missing farmer ${c.farmer_id}`);
  }
  return true;
});

await test('Claims reference valid land registries', async () => {
  const { data: claims } = await supabase.from('claims').select('id, land_registry_id');
  for (const c of claims) {
    const { data: lr } = await supabase.from('land_registries').select('id').eq('id', c.land_registry_id).maybeSingle();
    if (!lr) throw new Error(`Claim ${c.id} references missing land registry ${c.land_registry_id}`);
  }
  return true;
});

await test('NGO Verifications reference valid claims and NGOs', async () => {
  const { data: verifs } = await supabase.from('ngo_verifications').select('id, ngo_id, claim_id');
  for (const v of verifs) {
    const { data: ngo } = await supabase.from('ngos').select('id').eq('id', v.ngo_id).maybeSingle();
    const { data: claim } = await supabase.from('claims').select('id').eq('id', v.claim_id).maybeSingle();
    if (!ngo) throw new Error(`Verification ${v.id} references missing NGO ${v.ngo_id}`);
    if (!claim) throw new Error(`Verification ${v.id} references missing claim ${v.claim_id}`);
  }
  return true;
});

// ─── Summary ───
console.log('\n═══════════════════════════════════════════════');
console.log(`  Results: ${pass} passed, ${fail} failed`);
console.log('═══════════════════════════════════════════════\n');

process.exit(fail > 0 ? 1 : 0);
