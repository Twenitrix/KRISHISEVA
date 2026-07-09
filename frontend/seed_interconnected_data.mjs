/**
 * KrishiSeva — Interconnected Scenario Seeding Script
 * Seeds 3 interconnected profiles (Farmer, NGO, Official) and 10 claims.
 * Run: node seed_interconnected_data.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xksoqrtuvfzdemmkjpti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrc29xcnR1dmZ6ZGVtbWtqcHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTg3MjIsImV4cCI6MjA5OTA5NDcyMn0.8wgyba04fZoL_8yMBuyVGoPN217mRmFQMFiQF9UUlm4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runSeed() {
  console.log('🌱 Starting seed of interconnected accounts and 10 cases...');

  // 1. Village
  await supabase.from('villages').upsert({
    id: 'v1-uuid-wardha',
    name: 'Wardha',
    district: 'Wardha',
    state: 'Maharashtra',
    taluka: 'Wardha',
    latitude: 20.8351,
    longitude: 78.6015
  });

  // 2. Interconnected Farmer
  await supabase.from('farmers').upsert({
    id: 'f-interconnected-harish',
    village_id: 'v1-uuid-wardha',
    aadhaar_masked: 'XXXX-XXXX-7777',
    aadhaar_hash: 'hash-999988887777',
    name: 'Harish Patil',
    phone: '9999888877',
    bank_account_number: '98765432101',
    bank_ifsc: 'SBIN0001234',
    is_verified: true
  });

  // 3. Interconnected NGO
  await supabase.from('ngos').upsert({
    id: 'ngo-interconnected-mitra',
    name: 'Mitra NGO Agent',
    license_number: 'MH/NGO/2026/099',
    contact_person: 'Harish Patil Agent',
    phone: '9999888878',
    email: 'ngo.harish@example.com',
    is_active: true
  });

  // 4. Interconnected Official
  await supabase.from('officials').upsert({
    id: 'off-interconnected-ao',
    name: 'AO Harish Deshpande',
    designation: 'Agriculture Officer',
    email: 'official.harish@gov.in',
    phone: '9999888879',
    assigned_village_id: 'v1-uuid-wardha',
    is_active: true
  });

  // 5. Land Registries (10 Cases)
  const registries = [
    { id: 'lr-case-1', farmer_id: 'f-interconnected-harish', village_id: 'v1-uuid-wardha', survey_number: '301', area_hectares: 1.2, crop_on_record: 'Cotton', latitude: 20.8351, longitude: 78.6015, polygon_coords: '[[20.8349,78.6013],[20.8353,78.6013],[20.8353,78.6017],[20.8349,78.6017]]' },
    { id: 'lr-case-2', farmer_id: 'f-interconnected-harish', village_id: 'v1-uuid-wardha', survey_number: '302', area_hectares: 1.5, crop_on_record: 'Soybean', latitude: 20.8365, longitude: 78.6030, polygon_coords: '[[20.8363,78.6028],[20.8367,78.6028],[20.8367,78.6032],[20.8363,78.6032]]' },
    { id: 'lr-case-3', farmer_id: 'f-interconnected-harish', village_id: 'v1-uuid-wardha', survey_number: '303', area_hectares: 2.0, crop_on_record: 'Pigeon Pea (Tur)', latitude: 20.8378, longitude: 78.6045, polygon_coords: '[[20.8376,78.6043],[20.8380,78.6043],[20.8380,78.6047],[20.8376,78.6047]]' },
    { id: 'lr-case-4', farmer_id: 'f-interconnected-harish', village_id: 'v1-uuid-wardha', survey_number: '304', area_hectares: 1.0, crop_on_record: 'Wheat', latitude: 20.8355, longitude: 78.6020, polygon_coords: '[[20.8353,78.6018],[20.8357,78.6018],[20.8357,78.6022],[20.8353,78.6022]]' },
    { id: 'lr-case-5', farmer_id: 'f-interconnected-harish', village_id: 'v1-uuid-wardha', survey_number: '305', area_hectares: 1.8, crop_on_record: 'Cotton', latitude: 20.8360, longitude: 78.6025, polygon_coords: '[[20.8358,78.6023],[20.8362,78.6023],[20.8362,78.6027],[20.8358,78.6027]]' },
    { id: 'lr-case-6', farmer_id: 'f-interconnected-harish', village_id: 'v1-uuid-wardha', survey_number: '306', area_hectares: 0.9, crop_on_record: 'Soybean', latitude: 20.8370, longitude: 78.6040, polygon_coords: '[[20.8368,78.6038],[20.8372,78.6038],[20.8372,78.6042],[20.8368,78.6042]]' },
    { id: 'lr-case-7', farmer_id: 'f-interconnected-harish', village_id: 'v1-uuid-wardha', survey_number: '307', area_hectares: 2.5, crop_on_record: 'Pigeon Pea (Tur)', latitude: 20.8385, longitude: 78.6050, polygon_coords: '[[20.8383,78.6048],[20.8387,78.6048],[20.8387,78.6052],[20.8383,78.6052]]' },
    { id: 'lr-case-8', farmer_id: 'f-interconnected-harish', village_id: 'v1-uuid-wardha', survey_number: '308', area_hectares: 1.1, crop_on_record: 'Wheat', latitude: 20.8390, longitude: 78.6060, polygon_coords: '[[20.8388,78.6058],[20.8392,78.6058],[20.8392,78.6062],[20.8388,78.6062]]' },
    { id: 'lr-case-9', farmer_id: 'f-interconnected-harish', village_id: 'v1-uuid-wardha', survey_number: '309', area_hectares: 1.6, crop_on_record: 'Cotton', latitude: 20.8395, longitude: 78.6070, polygon_coords: '[[20.8393,78.6068],[20.8397,78.6068],[20.8397,78.6072],[20.8393,78.6072]]' },
    { id: 'lr-case-10', farmer_id: 'f-interconnected-harish', village_id: 'v1-uuid-wardha', survey_number: '310', area_hectares: 1.4, crop_on_record: 'Soybean', latitude: 20.8400, longitude: 78.6080, polygon_coords: '[[20.8398,78.6078],[20.8402,78.6078],[20.8402,78.6082],[20.8398,78.6082]]' }
  ];

  for (const reg of registries) {
    await supabase.from('land_registries').upsert(reg);
  }

  // 6. 10 Claims of various states
  const claims = [
    {
      id: 'claim-case-1', farmer_id: 'f-interconnected-harish', farmer_name: 'Harish Patil', land_registry_id: 'lr-case-1', survey_number: '301', village_id: 'v1-uuid-wardha',
      photo_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
      photo_latitude: 20.8351, photo_longitude: 78.6015, photo_timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      claimed_event_type: 'Flood', claimed_event_date: '2026-07-08', description: 'Cotton crops flooded by overflow.',
      ai_call_status: 'pending', gps_match_score: 0, land_match_score: 0, overall_score: 0, status: 'filed'
    },
    {
      id: 'claim-case-2', farmer_id: 'f-interconnected-harish', farmer_name: 'Harish Patil', land_registry_id: 'lr-case-2', survey_number: '302', village_id: 'v1-uuid-wardha',
      photo_url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600',
      photo_latitude: 20.8364, photo_longitude: 78.6029, photo_timestamp: new Date(Date.now() - 10 * 3600000).toISOString(),
      claimed_event_type: 'Flood', claimed_event_date: '2026-07-08', description: 'Waterlogged field.',
      ai_identified_crop: 'Soybean', ai_damage_percentage: 65.0, ai_justification: 'Heavy mud submersion patterns detected.',
      ai_crop_matches_record: true, ai_call_status: 'success', gps_match_score: 95, land_match_score: 92,
      duplicate_check_result: 'No duplicates', fraud_flags: 'None', overall_score: 93, suggested_payout_amount: 48750.0, status: 'under_review'
    },
    {
      id: 'claim-case-3', farmer_id: 'f-interconnected-harish', farmer_name: 'Harish Patil', land_registry_id: 'lr-case-3', survey_number: '303', village_id: 'v1-uuid-wardha',
      photo_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
      photo_latitude: 20.8378, photo_longitude: 78.6045, photo_timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      claimed_event_type: 'Hailstorm', claimed_event_date: '2026-07-07', description: 'Leaves and pods shredded by hailstones.',
      ai_identified_crop: 'Pigeon Pea (Tur)', ai_damage_percentage: 80.0, ai_justification: 'Substantial leaf defoliation and broken branches visible.',
      ai_crop_matches_record: true, ai_call_status: 'success', gps_match_score: 98, land_match_score: 97,
      duplicate_check_result: 'No duplicates', fraud_flags: 'None', overall_score: 97, suggested_payout_amount: 88000.0, status: 'verified'
    },
    {
      id: 'claim-case-4', farmer_id: 'f-interconnected-harish', farmer_name: 'Harish Patil', land_registry_id: 'lr-case-4', survey_number: '304', village_id: 'v1-uuid-wardha',
      photo_url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600',
      photo_latitude: 20.8355, photo_longitude: 78.6020, photo_timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
      claimed_event_type: 'Drought', claimed_event_date: '2026-06-25', description: 'Soil cracks and completely dried wheat stems.',
      ai_identified_crop: 'Wheat', ai_damage_percentage: 90.0, ai_justification: 'Severe crop dehydration and soil moisture depletion patterns.',
      ai_crop_matches_record: true, ai_call_status: 'success', gps_match_score: 96, land_match_score: 95,
      duplicate_check_result: 'No duplicates', fraud_flags: 'None', overall_score: 95, suggested_payout_amount: 40500.0,
      official_approved_amount: 40500.0, status: 'approved', reviewed_by_official_id: 'off-interconnected-ao',
      official_remarks: 'Drought confirmed via regional Remote Sensing index. Full payout approved.'
    },
    {
      id: 'claim-case-5', farmer_id: 'f-interconnected-harish', farmer_name: 'Harish Patil', land_registry_id: 'lr-case-5', survey_number: '305', village_id: 'v1-uuid-wardha',
      photo_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
      photo_latitude: 20.8360, photo_longitude: 78.6025, photo_timestamp: new Date(Date.now() - 72 * 3600000).toISOString(),
      claimed_event_type: 'Flood', claimed_event_date: '2026-07-01', description: 'Cotton plants swept away.',
      ai_identified_crop: 'Cotton', ai_damage_percentage: 100.0, ai_justification: 'Total crop wash-out confirmed.',
      ai_crop_matches_record: true, ai_call_status: 'success', gps_match_score: 99, land_match_score: 98,
      duplicate_check_result: 'No duplicates', fraud_flags: 'None', overall_score: 98, suggested_payout_amount: 108000.0,
      official_approved_amount: 108000.0, status: 'payout_completed', reviewed_by_official_id: 'off-interconnected-ao',
      official_remarks: 'Approved and paid via direct AEPS transfer.'
    },
    {
      id: 'claim-case-6', farmer_id: 'f-interconnected-harish', farmer_name: 'Harish Patil', land_registry_id: 'lr-case-6', survey_number: '306', village_id: 'v1-uuid-wardha',
      photo_url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600',
      photo_latitude: 20.8490, photo_longitude: 78.6250, photo_timestamp: new Date(Date.now() - 96 * 3600000).toISOString(),
      claimed_event_type: 'Hailstorm', claimed_event_date: '2026-07-01', description: 'Claims wind damage.',
      ai_identified_crop: 'Soybean', ai_damage_percentage: 15.0, ai_justification: 'Extremely minor defoliation, damage below 33% threshold.',
      ai_crop_matches_record: true, ai_call_status: 'success', gps_match_score: 22, land_match_score: 35,
      duplicate_check_result: 'Failed checks', fraud_flags: 'GPS Out of Bounds', overall_score: 28, suggested_payout_amount: 6075.0,
      official_approved_amount: 0.0, status: 'denied', reviewed_by_official_id: 'off-interconnected-ao',
      official_remarks: 'Rejected. Field photo coordinates are outside the registered boundary.'
    },
    {
      id: 'claim-case-7', farmer_id: 'f-interconnected-harish', farmer_name: 'Harish Patil', land_registry_id: 'lr-case-7', survey_number: '307', village_id: 'v1-uuid-wardha',
      photo_url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600',
      photo_latitude: 20.8385, photo_longitude: 78.6050, photo_timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
      claimed_event_type: 'Insect Pest', claimed_event_date: '2026-07-08', description: 'Caterpillar pest manifestation.',
      ai_identified_crop: 'Pigeon Pea (Tur)', ai_damage_percentage: 70.0, ai_justification: 'Moderate to high insect leaf-eating damage detected.',
      ai_crop_matches_record: true, ai_call_status: 'success', gps_match_score: 93, land_match_score: 91,
      duplicate_check_result: 'No duplicates', fraud_flags: 'None', overall_score: 92, suggested_payout_amount: 96250.0, status: 'under_review'
    },
    {
      id: 'claim-case-8', farmer_id: 'f-interconnected-harish', farmer_name: 'Harish Patil', land_registry_id: 'lr-case-8', survey_number: '308', village_id: 'v1-uuid-wardha',
      photo_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
      photo_latitude: 20.8390, photo_longitude: 78.6060, photo_timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      claimed_event_type: 'Hailstorm', claimed_event_date: '2026-07-07', description: 'Heavy storm flattened field.',
      ai_identified_crop: 'Wheat', ai_damage_percentage: 85.0, ai_justification: 'AI confirms crop flattening patterns matching high velocity storm winds.',
      ai_crop_matches_record: true, ai_call_status: 'success', gps_match_score: 97, land_match_score: 96,
      duplicate_check_result: 'No duplicates', fraud_flags: 'None', overall_score: 96, suggested_payout_amount: 42075.0, status: 'verified'
    },
    {
      id: 'claim-case-9', farmer_id: 'f-interconnected-harish', farmer_name: 'Harish Patil', land_registry_id: 'lr-case-9', survey_number: '309', village_id: 'v1-uuid-wardha',
      photo_url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600',
      photo_latitude: 20.8395, photo_longitude: 78.6070, photo_timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
      claimed_event_type: 'Drought', claimed_event_date: '2026-06-25', description: 'Cotton pod dehydration.',
      ai_identified_crop: 'Cotton', ai_damage_percentage: 70.0, ai_justification: 'Moderate drought distress patterns detected.',
      ai_crop_matches_record: true, ai_call_status: 'success', gps_match_score: 94, land_match_score: 93,
      duplicate_check_result: 'No duplicates', fraud_flags: 'None', overall_score: 93, suggested_payout_amount: 67200.0,
      official_approved_amount: 67200.0, status: 'approved', reviewed_by_official_id: 'off-interconnected-ao',
      official_remarks: 'Approved per official regional notification.'
    },
    {
      id: 'claim-case-10', farmer_id: 'f-interconnected-harish', farmer_name: 'Harish Patil', land_registry_id: 'lr-case-10', survey_number: '310', village_id: 'v1-uuid-wardha',
      photo_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
      photo_latitude: 20.8400, photo_longitude: 78.6080, photo_timestamp: new Date(Date.now() - 72 * 3600000).toISOString(),
      claimed_event_type: 'Flood', claimed_event_date: '2026-07-01', description: 'Flood silting.',
      ai_identified_crop: 'Soybean', ai_damage_percentage: 80.0, ai_justification: 'Heavy soil silt layers cover leaves.',
      ai_crop_matches_record: true, ai_call_status: 'success', gps_match_score: 98, land_match_score: 96,
      duplicate_check_result: 'No duplicates', fraud_flags: 'None', overall_score: 97, suggested_payout_amount: 56000.0,
      official_approved_amount: 56000.0, status: 'payout_completed', reviewed_by_official_id: 'off-interconnected-ao',
      official_remarks: 'Bank transfer cleared.'
    }
  ];

  for (const c of claims) {
    await supabase.from('claims').upsert(c);
  }

  // 7. NGO Verifications (6 cases verified by NGO Mitra)
  const verifications = [
    { id: 'verif-case-3', ngo_id: 'ngo-interconnected-mitra', claim_id: 'claim-case-3', farmer_id: 'f-interconnected-harish', remarks: 'Mitra visited the field; confirmed heavy hailstorm breakage.', verification_type: 'field_visit' },
    { id: 'verif-case-4', ngo_id: 'ngo-interconnected-mitra', claim_id: 'claim-case-4', farmer_id: 'f-interconnected-harish', remarks: 'Soil profile extremely dry. Recommended.', verification_type: 'field_visit' },
    { id: 'verif-case-5', ngo_id: 'ngo-interconnected-mitra', claim_id: 'claim-case-5', farmer_id: 'f-interconnected-harish', remarks: 'Verified complete wash-out of cotton seedlings.', verification_type: 'field_visit' },
    { id: 'verif-case-6', ngo_id: 'ngo-interconnected-mitra', claim_id: 'claim-case-6', farmer_id: 'f-interconnected-harish', remarks: 'Field visit completed. Damage is minimal.', verification_type: 'field_visit' },
    { id: 'verif-case-8', ngo_id: 'ngo-interconnected-mitra', claim_id: 'claim-case-8', farmer_id: 'f-interconnected-harish', remarks: 'Mitra visited; verified extensive flattening of wheat stems.', verification_type: 'field_visit' },
    { id: 'verif-case-10', ngo_id: 'ngo-interconnected-mitra', claim_id: 'claim-case-10', farmer_id: 'f-interconnected-harish', remarks: 'Field visit confirmed 2 inches of silt. Payout justified.', verification_type: 'field_visit' }
  ];

  for (const v of verifications) {
    await supabase.from('ngo_verifications').upsert(v);
  }

  // 8. Claim Status Logs
  const statusLogs = [
    { id: 'log-case-1', claim_id: 'claim-case-1', old_status: 'none', new_status: 'filed', changed_by_role: 'farmer', changed_by_id: 'f-interconnected-harish', remarks: 'Claim submitted via portal' },
    { id: 'log-case-2a', claim_id: 'claim-case-2', old_status: 'none', new_status: 'filed', changed_by_role: 'farmer', changed_by_id: 'f-interconnected-harish', remarks: 'Claim submitted' },
    { id: 'log-case-2b', claim_id: 'claim-case-2', old_status: 'filed', new_status: 'under_review', changed_by_role: 'system', changed_by_id: 'system', remarks: 'AI pipeline score calculated' },
    { id: 'log-case-3a', claim_id: 'claim-case-3', old_status: 'none', new_status: 'filed', changed_by_role: 'farmer', changed_by_id: 'f-interconnected-harish', remarks: 'Claim submitted' },
    { id: 'log-case-3b', claim_id: 'claim-case-3', old_status: 'filed', new_status: 'under_review', changed_by_role: 'system', changed_by_id: 'system', remarks: 'AI pipeline finished' },
    { id: 'log-case-3c', claim_id: 'claim-case-3', old_status: 'under_review', new_status: 'verified', changed_by_role: 'ngo', changed_by_id: 'ngo-interconnected-mitra', remarks: 'Field visit completed' },
    { id: 'log-case-4a', claim_id: 'claim-case-4', old_status: 'none', new_status: 'filed', changed_by_role: 'farmer', changed_by_id: 'f-interconnected-harish', remarks: 'Claim submitted' },
    { id: 'log-case-4b', claim_id: 'claim-case-4', old_status: 'under_review', new_status: 'verified', changed_by_role: 'ngo', changed_by_id: 'ngo-interconnected-mitra', remarks: 'Field visit completed' },
    { id: 'log-case-4c', claim_id: 'claim-case-4', old_status: 'verified', new_status: 'approved', changed_by_role: 'official', changed_by_id: 'off-interconnected-ao', remarks: 'Approved official claims queue' },
    { id: 'log-case-5a', claim_id: 'claim-case-5', old_status: 'none', new_status: 'filed', changed_by_role: 'farmer', changed_by_id: 'f-interconnected-harish', remarks: 'Claim submitted' },
    { id: 'log-case-5b', claim_id: 'claim-case-5', old_status: 'verified', new_status: 'approved', changed_by_role: 'official', changed_by_id: 'off-interconnected-ao', remarks: 'Approved' },
    { id: 'log-case-5c', claim_id: 'claim-case-5', old_status: 'approved', new_status: 'payout_completed', changed_by_role: 'official', changed_by_id: 'off-interconnected-ao', remarks: 'Disbursed via AEPS bridge' }
  ];

  for (const log of statusLogs) {
    await supabase.from('claim_status_logs').upsert(log);
  }

  console.log('✅ Successfully seeded interconnected database records!');
}

runSeed().catch(console.error);
