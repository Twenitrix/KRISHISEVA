-- ═══════════════════════════════════════════════════════════════════
-- KrishiSeva — Supabase Schema + 6 Test Cases per Domain + Auth Logs
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════════

-- ─── Enable UUID extension ───
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. Villages ───
CREATE TABLE IF NOT EXISTS villages (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  district TEXT,
  state TEXT,
  taluka TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. Farmers ───
CREATE TABLE IF NOT EXISTS farmers (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  auth_uid UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  village_id TEXT REFERENCES villages(id),
  aadhaar_masked TEXT,
  aadhaar_hash TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. NGOs ───
CREATE TABLE IF NOT EXISTS ngos (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  auth_uid UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  license_number TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. Officials ───
CREATE TABLE IF NOT EXISTS officials (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  auth_uid UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  designation TEXT,
  email TEXT,
  phone TEXT,
  assigned_village_id TEXT REFERENCES villages(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. Land Registries ───
CREATE TABLE IF NOT EXISTS land_registries (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  farmer_id TEXT REFERENCES farmers(id),
  village_id TEXT REFERENCES villages(id),
  survey_number TEXT NOT NULL,
  area_hectares DOUBLE PRECISION,
  crop_on_record TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  polygon_coords TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 6. Crop Insured Sums ───
CREATE TABLE IF NOT EXISTS crop_insured_sums (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  crop_name TEXT NOT NULL,
  insured_sum_per_hectare DOUBLE PRECISION NOT NULL,
  season TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 7. Claims ───
CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  farmer_id TEXT REFERENCES farmers(id),
  farmer_name TEXT,
  land_registry_id TEXT REFERENCES land_registries(id),
  survey_number TEXT,
  village_id TEXT REFERENCES villages(id),
  photo_url TEXT,
  photo_latitude DOUBLE PRECISION,
  photo_longitude DOUBLE PRECISION,
  photo_timestamp TIMESTAMPTZ,
  claimed_event_type TEXT,
  claimed_event_date DATE,
  description TEXT,
  ai_identified_crop TEXT,
  ai_damage_percentage DOUBLE PRECISION,
  ai_justification TEXT,
  ai_crop_matches_record BOOLEAN,
  ai_call_status TEXT,
  gps_match_score INTEGER,
  land_match_score INTEGER,
  duplicate_check_result TEXT,
  fraud_flags TEXT,
  overall_score INTEGER,
  suggested_payout_amount DOUBLE PRECISION,
  official_approved_amount DOUBLE PRECISION,
  status TEXT DEFAULT 'filed',
  reviewed_by_official_id TEXT,
  official_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 8. NGO Verifications ───
CREATE TABLE IF NOT EXISTS ngo_verifications (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  ngo_id TEXT REFERENCES ngos(id),
  claim_id TEXT REFERENCES claims(id),
  farmer_id TEXT,
  photo_url TEXT,
  remarks TEXT,
  verification_type TEXT DEFAULT 'field_visit',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 9. Claim Status Logs ───
CREATE TABLE IF NOT EXISTS claim_status_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  claim_id TEXT REFERENCES claims(id),
  old_status TEXT,
  new_status TEXT,
  changed_by_role TEXT,
  changed_by_id TEXT,
  remarks TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- ─── 10. Past Events ───
CREATE TABLE IF NOT EXISTS past_events (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  village_id TEXT REFERENCES villages(id),
  event_type TEXT,
  event_date DATE,
  severity TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 11. Past Beneficiaries ───
CREATE TABLE IF NOT EXISTS past_beneficiaries (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  farmer_id TEXT REFERENCES farmers(id),
  event_id TEXT REFERENCES past_events(id),
  claim_amount DOUBLE PRECISION,
  payout_amount DOUBLE PRECISION,
  payout_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 12. Auth Logs (Signin/Signup logging) ───
CREATE TABLE IF NOT EXISTS auth_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  identifier TEXT NOT NULL,
  status TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — Permissive (Hackathon Demo)
-- Allows all authenticated AND anonymous reads/writes.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_insured_sums ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngo_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Permissive policies for anon + authenticated
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'villages','farmers','ngos','officials','land_registries',
    'crop_insured_sums','claims','ngo_verifications','claim_status_logs',
    'past_events','past_beneficiaries','auth_logs'
  ]
  LOOP
    EXECUTE format('CREATE POLICY "Allow full access" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════
-- SEED DATA — 6 Test Cases per Domain
-- ═══════════════════════════════════════════════════════════════════

-- Villages (Default village)
INSERT INTO villages (id, name, district, state, taluka, latitude, longitude) VALUES
  ('v1-uuid-wardha', 'Wardha', 'Wardha', 'Maharashtra', 'Wardha', 20.8351, 78.6015)
ON CONFLICT (id) DO NOTHING;

-- 1. Farmers (6 Test Cases)
INSERT INTO farmers (id, village_id, aadhaar_masked, aadhaar_hash, name, phone, bank_account_number, bank_ifsc, is_verified) VALUES
  ('f1-uuid-suresh', 'v1-uuid-wardha', 'XXXX-XXXX-9012', 'hash-987654329012', 'Suresh Rao Patwardhan', '9876543210', '12345678901', 'SBIN0001234', true),
  ('f2-uuid-ramesh', 'v1-uuid-wardha', 'XXXX-XXXX-9013', 'hash-123456789012', 'Ramesh Kumar', '9876543211', '12345678902', 'SBIN0001234', true),
  ('f3-uuid-suresh-singh', 'v1-uuid-wardha', 'XXXX-XXXX-9014', 'hash-987654321098', 'Suresh Singh', '9876543212', '12345678903', 'SBIN0001234', true),
  ('f4-uuid-kamla', 'v1-uuid-wardha', 'XXXX-XXXX-9015', 'hash-111122223333', 'Kamla Devi', '9876543213', '12345678904', 'SBIN0001234', false),
  ('f5-uuid-ganesh', 'v1-uuid-wardha', 'XXXX-XXXX-9016', 'hash-888888888888', 'Ganesh Joshi', '9876543214', '12345678905', 'SBIN0001234', true),
  ('f6-uuid-dinesh', 'v1-uuid-wardha', 'XXXX-XXXX-9017', 'hash-999999999999', 'Dinesh Patil', '9876543215', '12345678906', 'SBIN0001234', true)
ON CONFLICT (id) DO NOTHING;

-- 2. NGOs (6 Test Cases)
INSERT INTO ngos (id, name, license_number, contact_person, phone, email, is_active) VALUES
  ('ngo1-uuid-green', 'Green Earth Foundation', 'MH/NGO/2026/001', 'Amit Patil', '9876543211', 'contact@greenearth.org', true),
  ('ngo2-uuid-vikas', 'Vikas Foundation', 'MH/NGO/2026/002', 'Rajesh Kulkarni', '9876543222', 'contact@vikas.org', true),
  ('ngo3-uuid-mitra', 'Krishi Mitra Trust', 'MH/NGO/2026/003', 'Sunita Deshpande', '9876543233', 'contact@krishimitra.org', true),
  ('ngo4-uuid-kalyan', 'Gram Kalyan Samiti', 'MH/NGO/2026/004', 'Vijay Jadhav', '9876543244', 'contact@gramkalyan.org', true),
  ('ngo5-uuid-bhoomi', 'Bhoomi Welfare Trust', 'MH/NGO/2026/005', 'Harish Rawat', '9876543255', 'contact@bhoomi.org', true),
  ('ngo6-uuid-seva', 'Seva NGO', 'MH/NGO/2026/006', 'Meera Nair', '9876543266', 'contact@seva.org', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Officials (6 Test Cases)
INSERT INTO officials (id, name, designation, email, phone, assigned_village_id, is_active) VALUES
  ('off1-uuid-sdm', 'Shri. Rajesh Deshmukh', 'Sub-Divisional Magistrate', 'official@gov.in', '9876543212', 'v1-uuid-wardha', true),
  ('off2-uuid-coll', 'Shri. Amit Collector', 'District Collector', 'collector@gov.in', '9876543220', 'v1-uuid-wardha', true),
  ('off3-uuid-teh', 'Shri. Sunil Tehsildar', 'Tehsildar', 'tehsildar@gov.in', '9876543230', 'v1-uuid-wardha', true),
  ('off4-uuid-ao', 'Smt. Kavita Officer', 'Agriculture Officer', 'ao@gov.in', '9876543240', 'v1-uuid-wardha', true),
  ('off5-uuid-aud', 'Shri. Manoj Auditor', 'Claims Auditor', 'auditor@gov.in', '9876543250', 'v1-uuid-wardha', true),
  ('off6-uuid-insp', 'Smt. Priya Inspector', 'Field Inspector', 'inspector@gov.in', '9876543260', 'v1-uuid-wardha', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Land Registries (6 Test Cases)
INSERT INTO land_registries (id, farmer_id, village_id, survey_number, area_hectares, crop_on_record, latitude, longitude, polygon_coords) VALUES
  ('lr1-uuid-cotton', 'f1-uuid-suresh', 'v1-uuid-wardha', '101/A', 1.5, 'Cotton', 20.8351, 78.6015, '[[20.8349,78.6013],[20.8353,78.6013],[20.8353,78.6017],[20.8349,78.6017]]'),
  ('lr2-uuid-soybean', 'f1-uuid-suresh', 'v1-uuid-wardha', '102/B', 0.8, 'Soybean', 20.8365, 78.6030, '[[20.8363,78.6028],[20.8367,78.6028],[20.8367,78.6032],[20.8363,78.6032]]'),
  ('lr3-uuid-pigeon', 'f1-uuid-suresh', 'v1-uuid-wardha', '103/C', 2.2, 'Pigeon Pea (Tur)', 20.8378, 78.6045, '[[20.8376,78.6043],[20.8380,78.6043],[20.8380,78.6047],[20.8376,78.6047]]'),
  ('lr4-uuid-ramesh-soy', 'f2-uuid-ramesh', 'v1-uuid-wardha', '201/D', 1.2, 'Soybean', 20.8355, 78.6020, '[[20.8353,78.6018],[20.8357,78.6018],[20.8357,78.6022],[20.8353,78.6022]]'),
  ('lr5-uuid-singh-cot', 'f3-uuid-suresh-singh', 'v1-uuid-wardha', '202/E', 2.0, 'Cotton', 20.8360, 78.6025, '[[20.8358,78.6023],[20.8362,78.6023],[20.8362,78.6027],[20.8358,78.6027]]'),
  ('lr6-uuid-ganesh-wheat', 'f5-uuid-ganesh', 'v1-uuid-wardha', '203/F', 1.4, 'Wheat', 20.8370, 78.6040, '[[20.8368,78.6038],[20.8372,78.6038],[20.8372,78.6042],[20.8368,78.6042]]')
ON CONFLICT (id) DO NOTHING;

-- Crop Insured Sums (Policies)
INSERT INTO crop_insured_sums (id, crop_name, insured_sum_per_hectare, season, year) VALUES
  ('cis1', 'Cotton', 60000.0, 'Kharif', 2026),
  ('cis2', 'Soybean', 50000.0, 'Kharif', 2026),
  ('cis3', 'Pigeon Pea (Tur)', 55000.0, 'Kharif', 2026),
  ('cis4', 'Wheat', 45000.0, 'Rabi', 2026)
ON CONFLICT (id) DO NOTHING;

-- Past Events
INSERT INTO past_events (id, village_id, event_type, event_date, severity, description) VALUES
  ('pe1-uuid-flood', 'v1-uuid-wardha', 'Flood', '2026-07-01', 'High', 'Severe overflow of Wardha River damaging low-lying fields')
ON CONFLICT (id) DO NOTHING;

-- Past Beneficiaries
INSERT INTO past_beneficiaries (id, farmer_id, event_id, claim_amount, payout_amount, payout_date) VALUES
  ('pb1', 'f1-uuid-suresh', 'pe1-uuid-flood', 45000.0, 40000.0, '2026-07-05')
ON CONFLICT (id) DO NOTHING;

-- 5. Claims (6 Test Cases in different lifecycle states)
INSERT INTO claims (id, farmer_id, farmer_name, land_registry_id, survey_number, village_id, photo_url, photo_latitude, photo_longitude, photo_timestamp, claimed_event_type, claimed_event_date, description, ai_identified_crop, ai_damage_percentage, ai_justification, ai_crop_matches_record, ai_call_status, gps_match_score, land_match_score, duplicate_check_result, fraud_flags, overall_score, suggested_payout_amount, official_approved_amount, status, reviewed_by_official_id, official_remarks, created_at, updated_at) VALUES
(
  'claim-pre-1', 'f1-uuid-suresh', 'Suresh Rao Patwardhan', 'lr2-uuid-soybean', '102/B', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600',
  20.8364, 78.6029, now() - interval '5 days',
  'Flood', '2026-07-01', 'Waterlogged fields after the river overflowed.',
  'Soybean', 75.0, 'The leaves and stems show heavy mud deposits and rot matching flood submersion damage.',
  true, 'success', 98, 95, 'No duplicates found', 'None', 96, 30000.0, 30000.0,
  'payout_completed', 'off1-uuid-sdm', 'Verified field report and AI vision outputs. Disbursal approved.',
  now() - interval '5 days', now() - interval '3 days'
),
(
  'claim-pre-2', 'f1-uuid-suresh', 'Suresh Rao Patwardhan', 'lr1-uuid-cotton', '101/A', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
  20.8354, 78.6019, now() - interval '1 day',
  'Flood', '2026-07-01', 'Crops flattened by water flow.',
  'Cotton', 45.0, 'Cotton plants show flattening and leaf loss typical of strong water current damage.',
  true, 'success', 92, 90, 'No duplicates found', 'None', 91, 40500.0, NULL,
  'under_review', NULL, NULL,
  now() - interval '1 day', now() - interval '1 day'
),
(
  'claim-pre-3', 'f2-uuid-ramesh', 'Ramesh Kumar', 'lr4-uuid-ramesh-soy', '201/D', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600',
  20.8356, 78.6021, now() - interval '6 hours',
  'Hailstorm', '2026-07-07', 'Hail damaged all leaves.',
  NULL, NULL, NULL, NULL, 'pending', 0, 0, NULL, NULL, 0, NULL, NULL,
  'filed', NULL, NULL,
  now() - interval '6 hours', now() - interval '6 hours'
),
(
  'claim-pre-4', 'f3-uuid-suresh-singh', 'Suresh Singh', 'lr5-uuid-singh-cot', '202/E', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
  20.8361, 78.6026, now() - interval '2 days',
  'Drought', '2026-06-28', 'Drying up cotton plants.',
  'Cotton', 60.0, 'Cotton plants display severe leaf curling and dehydration.',
  true, 'success', 95, 94, 'No duplicates', 'None', 94, 72000.0, NULL,
  'verified', NULL, NULL,
  now() - interval '2 days', now() - interval '1 day'
),
(
  'claim-pre-5', 'f5-uuid-ganesh', 'Ganesh Joshi', 'lr6-uuid-ganesh-wheat', '203/F', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600',
  20.8371, 78.6041, now() - interval '3 days',
  'Insect Pest', '2026-07-02', 'Borer pests damaged crops.',
  'Wheat', 50.0, 'Heavy pest manifestation detected.',
  true, 'success', 90, 88, 'No duplicates', 'None', 89, 31500.0, 31500.0,
  'approved', 'off1-uuid-sdm', 'Approved for immediate AEPS transfer.',
  now() - interval '3 days', now() - interval '2 days'
),
(
  'claim-pre-6', 'f1-uuid-suresh', 'Suresh Rao Patwardhan', 'lr3-uuid-pigeon', '103/C', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
  20.8400, 78.6100, now() - interval '4 days',
  'Flood', '2026-07-01', 'Field damaged',
  'Cotton', 20.0, 'Minor boundary flooding only.',
  false, 'success', 25, 30, 'Duplicate check failed', 'Out of Bounds GPS', 28, 24200.0, 0.0,
  'denied', 'off1-uuid-sdm', 'Rejected due to extreme GPS discrepancy and crop mismatch.',
  now() - interval '4 days', now() - interval '3 days'
)
ON CONFLICT (id) DO NOTHING;

-- 6. NGO Verifications (6 Test Cases)
INSERT INTO ngo_verifications (id, ngo_id, claim_id, farmer_id, photo_url, remarks, verification_type) VALUES
  ('verif1', 'ngo1-uuid-green', 'claim-pre-1', 'f1-uuid-suresh', 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600', 'Waterlogging confirmed. Heavy loss visible.', 'field_visit'),
  ('verif2', 'ngo2-uuid-vikas', 'claim-pre-4', 'f3-uuid-suresh-singh', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600', 'Dehydration of soil is extreme. Recommended for high payout.', 'field_visit'),
  ('verif3', 'ngo3-uuid-mitra', 'claim-pre-5', 'f5-uuid-ganesh', 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600', 'Confirmed infestation on borer pests.', 'field_visit'),
  ('verif4', 'ngo4-uuid-kalyan', 'claim-pre-6', 'f1-uuid-suresh', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600', 'GPS matches village but crop is not Tur.', 'field_visit'),
  ('verif5', 'ngo5-uuid-bhoomi', 'claim-pre-2', 'f1-uuid-suresh', 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600', 'Assisted farmer with cotton loss filing.', 'remote_sensing'),
  ('verif6', 'ngo6-uuid-seva', 'claim-pre-3', 'f2-uuid-ramesh', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600', 'Assisted in submitting Aadhaar OTP verification.', 'field_visit')
ON CONFLICT (id) DO NOTHING;

-- Claim Status Logs
INSERT INTO claim_status_logs (id, claim_id, old_status, new_status, changed_by_role, changed_by_id, remarks, timestamp) VALUES
  ('log1', 'claim-pre-1', 'none', 'filed', 'farmer', 'f1-uuid-suresh', 'Claim submitted via portal', now() - interval '5 days'),
  ('log2', 'claim-pre-1', 'filed', 'under_review', 'system', 'system', 'AI Vision Pipeline completed', now() - interval '4 days 22 hours'),
  ('log3', 'claim-pre-1', 'under_review', 'verified', 'ngo', 'ngo1-uuid-green', 'Field visit confirms water rot. Recommended.', now() - interval '4 days'),
  ('log4', 'claim-pre-1', 'verified', 'approved', 'official', 'off1-uuid-sdm', 'Approved full payout', now() - interval '3 days 12 hours'),
  ('log5', 'claim-pre-1', 'approved', 'payout_completed', 'official', 'off1-uuid-sdm', 'Bank transfer completed', now() - interval '3 days'),
  ('log6', 'claim-pre-2', 'none', 'filed', 'farmer', 'f1-uuid-suresh', 'Claim submitted via portal', now() - interval '1 day'),
  ('log7', 'claim-pre-2', 'filed', 'under_review', 'system', 'system', 'AI Vision Pipeline completed', now() - interval '23 hours')
ON CONFLICT (id) DO NOTHING;

-- 7. Auth Logs (6 Seeded Test Cases)
INSERT INTO auth_logs (id, user_id, role, action, identifier, status, timestamp) VALUES
  ('auth-log-1', 'f1-uuid-suresh', 'farmer', 'signin', 'XXXX-XXXX-9012', 'success', now() - interval '5 days'),
  ('auth-log-2', 'ngo1-uuid-green', 'ngo', 'signin', 'contact@greenearth.org', 'success', now() - interval '4 days'),
  ('auth-log-3', 'off1-uuid-sdm', 'official', 'signin', 'official@gov.in', 'success', now() - interval '3 days'),
  ('auth-log-4', 'f4-uuid-kamla', 'farmer', 'signin', 'XXXX-XXXX-9015', 'failed', now() - interval '2 days'),
  ('auth-log-5', 'ngo6-uuid-seva', 'ngo', 'signup', 'contact@seva.org', 'success', now() - interval '1 day'),
  ('auth-log-6', 'off1-uuid-sdm', 'official', 'signout', 'session-end', 'success', now() - interval '12 hours')
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════
-- INTERCONNECTED SCENARIO (1 Farmer, 1 NGO, 1 Official, 10 Claims)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Interconnected Farmer (Harish Patil)
INSERT INTO farmers (id, village_id, aadhaar_masked, aadhaar_hash, name, phone, bank_account_number, bank_ifsc, is_verified)
VALUES ('f-interconnected-harish', 'v1-uuid-wardha', 'XXXX-XXXX-7777', 'hash-999988887777', 'Harish Patil', '9999888877', '98765432101', 'SBIN0001234', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Interconnected NGO (Mitra NGO Agent)
INSERT INTO ngos (id, name, license_number, contact_person, phone, email, is_active)
VALUES ('ngo-interconnected-mitra', 'Mitra NGO Agent', 'MH/NGO/2026/099', 'Harish Patil Agent', '9999888878', 'ngo.harish@example.com', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Interconnected Official (AO Harish Deshpande)
INSERT INTO officials (id, name, designation, email, phone, assigned_village_id, is_active)
VALUES ('off-interconnected-ao', 'AO Harish Deshpande', 'Agriculture Officer', 'official.harish@gov.in', '9999888879', 'v1-uuid-wardha', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Interconnected Land Registries (10 Cases)
INSERT INTO land_registries (id, farmer_id, village_id, survey_number, area_hectares, crop_on_record, latitude, longitude, polygon_coords) VALUES
  ('lr-case-1', 'f-interconnected-harish', 'v1-uuid-wardha', '301', 1.2, 'Cotton', 20.8351, 78.6015, '[[20.8349,78.6013],[20.8353,78.6013],[20.8353,78.6017],[20.8349,78.6017]]'),
  ('lr-case-2', 'f-interconnected-harish', 'v1-uuid-wardha', '302', 1.5, 'Soybean', 20.8365, 78.6030, '[[20.8363,78.6028],[20.8367,78.6028],[20.8367,78.6032],[20.8363,78.6032]]'),
  ('lr-case-3', 'f-interconnected-harish', 'v1-uuid-wardha', '303', 2.0, 'Pigeon Pea (Tur)', 20.8378, 78.6045, '[[20.8376,78.6043],[20.8380,78.6043],[20.8380,78.6047],[20.8376,78.6047]]'),
  ('lr-case-4', 'f-interconnected-harish', 'v1-uuid-wardha', '304', 1.0, 'Wheat', 20.8355, 78.6020, '[[20.8353,78.6018],[20.8357,78.6018],[20.8357,78.6022],[20.8353,78.6022]]'),
  ('lr-case-5', 'f-interconnected-harish', 'v1-uuid-wardha', '305', 1.8, 'Cotton', 20.8360, 78.6025, '[[20.8358,78.6023],[20.8362,78.6023],[20.8362,78.6027],[20.8358,78.6027]]'),
  ('lr-case-6', 'f-interconnected-harish', 'v1-uuid-wardha', '306', 0.9, 'Soybean', 20.8370, 78.6040, '[[20.8368,78.6038],[20.8372,78.6038],[20.8372,78.6042],[20.8368,78.6042]]'),
  ('lr-case-7', 'f-interconnected-harish', 'v1-uuid-wardha', '307', 2.5, 'Pigeon Pea (Tur)', 20.8385, 78.6050, '[[20.8383,78.6048],[20.8387,78.6048],[20.8387,78.6052],[20.8383,78.6052]]'),
  ('lr-case-8', 'f-interconnected-harish', 'v1-uuid-wardha', '308', 1.1, 'Wheat', 20.8390, 78.6060, '[[20.8388,78.6058],[20.8392,78.6058],[20.8392,78.6062],[20.8388,78.6062]]'),
  ('lr-case-9', 'f-interconnected-harish', 'v1-uuid-wardha', '309', 1.6, 'Cotton', 20.8395, 78.6070, '[[20.8393,78.6068],[20.8397,78.6068],[20.8397,78.6072],[20.8393,78.6072]]'),
  ('lr-case-10', 'f-interconnected-harish', 'v1-uuid-wardha', '310', 1.4, 'Soybean', 20.8400, 78.6080, '[[20.8398,78.6078],[20.8402,78.6078],[20.8402,78.6082],[20.8398,78.6082]]')
ON CONFLICT (id) DO NOTHING;

-- 5. Interconnected Claims & Payout Cases (10 Cases of various states)
INSERT INTO claims (id, farmer_id, farmer_name, land_registry_id, survey_number, village_id, photo_url, photo_latitude, photo_longitude, photo_timestamp, claimed_event_type, claimed_event_date, description, ai_identified_crop, ai_damage_percentage, ai_justification, ai_crop_matches_record, ai_call_status, gps_match_score, land_match_score, duplicate_check_result, fraud_flags, overall_score, suggested_payout_amount, official_approved_amount, status, reviewed_by_official_id, official_remarks, created_at, updated_at) VALUES
-- Claim 1: Filed
(
  'claim-case-1', 'f-interconnected-harish', 'Harish Patil', 'lr-case-1', '301', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
  20.8351, 78.6015, now() - interval '2 hours',
  'Flood', '2026-07-08', 'Cotton crops flooded by overflow.',
  NULL, NULL, NULL, NULL, 'pending', 0, 0, NULL, NULL, 0, NULL, NULL,
  'filed', NULL, NULL,
  now() - interval '2 hours', now() - interval '2 hours'
),
-- Claim 2: Under Review
(
  'claim-case-2', 'f-interconnected-harish', 'Harish Patil', 'lr-case-2', '302', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600',
  20.8364, 78.6029, now() - interval '10 hours',
  'Flood', '2026-07-08', 'Waterlogged field.',
  'Soybean', 65.0, 'Heavy mud submersion patterns detected.',
  true, 'success', 95, 92, 'No duplicates', 'None', 93, 48750.0, NULL,
  'under_review', NULL, NULL,
  now() - interval '10 hours', now() - interval '9 hours'
),
-- Claim 3: Verified
(
  'claim-case-3', 'f-interconnected-harish', 'Harish Patil', 'lr-case-3', '303', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
  20.8378, 78.6045, now() - interval '1 day',
  'Hailstorm', '2026-07-07', 'Leaves and pods shredded by hailstones.',
  'Pigeon Pea (Tur)', 80.0, 'Substantial leaf defoliation and broken branches visible.',
  true, 'success', 98, 97, 'No duplicates', 'None', 97, 88000.0, NULL,
  'verified', NULL, NULL,
  now() - interval '1 day', now() - interval '18 hours'
),
-- Claim 4: Approved
(
  'claim-case-4', 'f-interconnected-harish', 'Harish Patil', 'lr-case-4', '304', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600',
  20.8355, 78.6020, now() - interval '2 days',
  'Drought', '2026-06-25', 'Soil cracks and completely dried wheat stems.',
  'Wheat', 90.0, 'Severe crop dehydration and soil moisture depletion patterns.',
  true, 'success', 96, 95, 'No duplicates', 'None', 95, 40500.0, 40500.0,
  'approved', 'off-interconnected-ao', 'Drought confirmed via regional Remote Sensing index. Full payout approved.',
  now() - interval '2 days', now() - interval '1 day'
),
-- Claim 5: Payout Completed
(
  'claim-case-5', 'f-interconnected-harish', 'Harish Patil', 'lr-case-5', '305', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
  20.8360, 78.6025, now() - interval '3 days',
  'Flood', '2026-07-01', 'Cotton plants swept away.',
  'Cotton', 100.0, 'Total crop wash-out confirmed.',
  true, 'success', 99, 98, 'No duplicates', 'None', 98, 108000.0, 108000.0,
  'payout_completed', 'off-interconnected-ao', 'Approved and paid via direct AEPS transfer.',
  now() - interval '3 days', now() - interval '2 days'
),
-- Claim 6: Denied
(
  'claim-case-6', 'f-interconnected-harish', 'Harish Patil', 'lr-case-6', '306', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600',
  20.8490, 78.6250, now() - interval '4 days',
  'Hailstorm', '2026-07-01', 'Claims wind damage.',
  'Soybean', 15.0, 'Extremely minor defoliation, damage below 33% threshold.',
  true, 'success', 22, 35, 'Failed checks', 'GPS Out of Bounds', 28, 6075.0, 0.0,
  'denied', 'off-interconnected-ao', 'Rejected. Field photo coordinates are outside the registered boundary.',
  now() - interval '4 days', now() - interval '3 days'
),
-- Claim 7: Under Review (Caterpillars)
(
  'claim-case-7', 'f-interconnected-harish', 'Harish Patil', 'lr-case-7', '307', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600',
  20.8385, 78.6050, now() - interval '12 hours',
  'Insect Pest', '2026-07-08', 'Caterpillar pest manifestation.',
  'Pigeon Pea (Tur)', 70.0, 'Moderate to high insect leaf-eating damage detected.',
  true, 'success', 93, 91, 'No duplicates', 'None', 92, 96250.0, NULL,
  'under_review', NULL, NULL,
  now() - interval '12 hours', now() - interval '11 hours'
),
-- Claim 8: Verified (Storm flattened)
(
  'claim-case-8', 'f-interconnected-harish', 'Harish Patil', 'lr-case-8', '308', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
  20.8390, 78.6060, now() - interval '1 day',
  'Hailstorm', '2026-07-07', 'Heavy storm flattened field.',
  'Wheat', 85.0, 'AI confirms crop flattening patterns matching high velocity storm winds.',
  true, 'success', 97, 96, 'No duplicates', 'None', 96, 42075.0, NULL,
  'verified', NULL, NULL,
  now() - interval '1 day', now() - interval '20 hours'
),
-- Claim 9: Approved (Drought pods)
(
  'claim-case-9', 'f-interconnected-harish', 'Harish Patil', 'lr-case-9', '309', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600',
  20.8395, 78.6070, now() - interval '2 days',
  'Drought', '2026-06-25', 'Cotton pod dehydration.',
  'Cotton', 70.0, 'Moderate drought distress patterns detected.',
  true, 'success', 94, 93, 'No duplicates', 'None', 93, 67200.0, 67200.0,
  'approved', 'off-interconnected-ao', 'Approved per official regional notification.',
  now() - interval '2 days', now() - interval '1 day'
),
-- Claim 10: Payout Completed (Silt deposits)
(
  'claim-case-10', 'f-interconnected-harish', 'Harish Patil', 'lr-case-10', '310', 'v1-uuid-wardha',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
  20.8400, 78.6080, now() - interval '3 days',
  'Flood', '2026-07-01', 'Flood silting.',
  'Soybean', 80.0, 'Heavy soil silt layers cover leaves.',
  true, 'success', 98, 96, 'No duplicates', 'None', 97, 56000.0, 56000.0,
  'payout_completed', 'off-interconnected-ao', 'Bank transfer cleared.',
  now() - interval '3 days', now() - interval '2 days'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Interconnected NGO Verifications (6 cases verified by the NGO Mitra)
INSERT INTO ngo_verifications (id, ngo_id, claim_id, farmer_id, photo_url, remarks, verification_type) VALUES
  ('verif-case-3', 'ngo-interconnected-mitra', 'claim-case-3', 'f-interconnected-harish', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600', 'Mitra visited the field; confirmed heavy hailstorm breakage.', 'field_visit'),
  ('verif-case-4', 'ngo-interconnected-mitra', 'claim-case-4', 'f-interconnected-harish', 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600', 'Soil profile extremely dry. Recommended.', 'field_visit'),
  ('verif-case-5', 'ngo-interconnected-mitra', 'claim-case-5', 'f-interconnected-harish', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600', 'Verified complete wash-out of cotton seedlings.', 'field_visit'),
  ('verif-case-6', 'ngo-interconnected-mitra', 'claim-case-6', 'f-interconnected-harish', 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600', 'Field visit completed. Damage is minimal.', 'field_visit'),
  ('verif-case-8', 'ngo-interconnected-mitra', 'claim-case-8', 'f-interconnected-harish', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600', 'Mitra visited; verified extensive flattening of wheat stems.', 'field_visit'),
  ('verif-case-10', 'ngo-interconnected-mitra', 'claim-case-10', 'f-interconnected-harish', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600', 'Field visit confirmed 2 inches of silt. Payout justified.', 'field_visit')
ON CONFLICT (id) DO NOTHING;

-- 7. Interconnected Claim Status Logs
INSERT INTO claim_status_logs (id, claim_id, old_status, new_status, changed_by_role, changed_by_id, remarks, timestamp) VALUES
  ('log-case-1', 'claim-case-1', 'none', 'filed', 'farmer', 'f-interconnected-harish', 'Claim submitted via portal', now() - interval '2 hours'),
  ('log-case-2a', 'claim-case-2', 'none', 'filed', 'farmer', 'f-interconnected-harish', 'Claim submitted', now() - interval '10 hours'),
  ('log-case-2b', 'claim-case-2', 'filed', 'under_review', 'system', 'system', 'AI pipeline score calculated', now() - interval '9 hours'),
  ('log-case-3a', 'claim-case-3', 'none', 'filed', 'farmer', 'f-interconnected-harish', 'Claim submitted', now() - interval '1 day'),
  ('log-case-3b', 'claim-case-3', 'filed', 'under_review', 'system', 'system', 'AI pipeline finished', now() - interval '22 hours'),
  ('log-case-3c', 'claim-case-3', 'under_review', 'verified', 'ngo', 'ngo-interconnected-mitra', 'Field visit completed', now() - interval '18 hours'),
  ('log-case-4a', 'claim-case-4', 'none', 'filed', 'farmer', 'f-interconnected-harish', 'Claim submitted', now() - interval '2 days'),
  ('log-case-4b', 'claim-case-4', 'under_review', 'verified', 'ngo', 'ngo-interconnected-mitra', 'Field visit completed', now() - interval '1 day 12 hours'),
  ('log-case-4c', 'claim-case-4', 'verified', 'approved', 'official', 'off-interconnected-ao', 'Approved official claims queue', now() - interval '1 day'),
  ('log-case-5a', 'claim-case-5', 'none', 'filed', 'farmer', 'f-interconnected-harish', 'Claim submitted', now() - interval '3 days'),
  ('log-case-5b', 'claim-case-5', 'verified', 'approved', 'official', 'off-interconnected-ao', 'Approved', now() - interval '2 days 12 hours'),
  ('log-case-5c', 'claim-case-5', 'approved', 'payout_completed', 'official', 'off-interconnected-ao', 'Disbursed via AEPS bridge', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;
