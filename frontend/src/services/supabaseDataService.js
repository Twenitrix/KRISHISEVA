/**
 * supabaseDataService.js
 * ──────────────────────
 * Mirrors every method in api/index.js but reads/writes Supabase
 * instead of localStorage.  Imported by api/index.js when
 * hasSupabase === true.
 */
import { supabase } from '../lib/supabaseClient';

// ─── Helpers ────────────────────────────────────────────────────────

/** Return the role + user_id stored by authService after sign-in. */
const session = () => ({
  role: localStorage.getItem('role'),
  userId: localStorage.getItem('user_id'),
});

/** Map a Supabase response { data, error } → { success, data/message } */
const wrap = (res) => {
  if (res.error) return { success: false, message: res.error.message };
  return { success: true, data: res.data };
};

// ─── Auth helpers (profile lookups only — real auth is in authService) ───

const authMe = async () => {
  const { role, userId } = session();
  if (!role || !userId) throw new Error('Not authenticated');

  let table = 'farmers';
  if (role === 'ngo') table = 'ngos';
  if (role === 'official') table = 'officials';

  const { data, error } = await supabase.from(table).select('*').eq('id', userId).single();
  if (error) {
    // Fallback: try auth_uid
    const { data: d2, error: e2 } = await supabase.from(table).select('*').eq('auth_uid', userId).single();
    if (e2) throw new Error('Profile not found');
    return { success: true, data: { ...d2, role } };
  }
  return { success: true, data: { ...data, role } };
};

// ─── Farmers ────────────────────────────────────────────────────────

const farmersList = async (villageId) => {
  let q = supabase.from('farmers').select('*');
  if (villageId) q = q.eq('village_id', villageId);
  const res = await q;
  return { success: true, data: { items: res.data || [], total: (res.data || []).length, page: 1, per_page: 20 } };
};

const farmersGet = async (id) => {
  const { data, error } = await supabase.from('farmers').select('*').eq('id', id).single();
  if (error) return { success: false, message: error.message };
  return { success: true, data };
};

const farmersGetLand = async (farmerId) => {
  const { data } = await supabase.from('land_registries').select('*').eq('farmer_id', farmerId);
  return { success: true, data: data || [] };
};

const farmersUpdateProfile = async (farmerId, profileData) => {
  const { data, error } = await supabase
    .from('farmers')
    .update({
      bank_account_number: profileData.bank_account_number,
      bank_ifsc: profileData.bank_ifsc,
    })
    .eq('id', farmerId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { success: true, data };
};

// ─── Claims ─────────────────────────────────────────────────────────

const claimsCreate = async (formData) => {
  const { userId } = session();

  // Look up farmer
  const { data: farmer } = await supabase.from('farmers').select('*').eq('id', userId).single();
  const landId = formData.get('land_registry_id');
  const { data: land } = await supabase.from('land_registries').select('*').eq('id', landId).single();

  const fileObj = formData.get('file');
  const photoUrl = fileObj
    ? URL.createObjectURL(fileObj)
    : 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600';

  const newClaimId = 'claim-uuid-' + Math.random().toString(36).substr(2, 9);

  const newClaim = {
    id: newClaimId,
    farmer_id: farmer?.id || userId,
    farmer_name: farmer?.name || 'Farmer',
    land_registry_id: landId,
    survey_number: land?.survey_number || 'Unknown',
    village_id: farmer?.village_id || 'v1-uuid-wardha',
    photo_url: photoUrl,
    photo_latitude: parseFloat(formData.get('test_latitude')) || (land?.latitude || 20.8351) + 0.0001,
    photo_longitude: parseFloat(formData.get('test_longitude')) || (land?.longitude || 78.6015) + 0.0001,
    photo_timestamp: new Date().toISOString(),
    claimed_event_type: formData.get('claimed_event_type'),
    claimed_event_date: formData.get('claimed_event_date'),
    description: formData.get('description') || '',
    status: 'filed',
  };

  const { error } = await supabase.from('claims').insert(newClaim);
  if (error) throw new Error(error.message);

  // Status log
  await supabase.from('claim_status_logs').insert({
    id: 'log-' + Math.random().toString(36).substr(2, 9),
    claim_id: newClaimId,
    old_status: 'none',
    new_status: 'filed',
    changed_by_role: 'farmer',
    changed_by_id: farmer?.id || userId,
    remarks: 'Claim submitted via portal',
    timestamp: new Date().toISOString(),
  });

  // Mock background AI processing (simulate after 4s)
  setTimeout(async () => {
    try {
      const cropName = land?.crop_on_record || 'Cotton';
      const area = land?.area_hectares || 1.0;
      const { data: insuredSums } = await supabase
        .from('crop_insured_sums')
        .select('insured_sum_per_hectare')
        .eq('crop_name', cropName)
        .single();
      const insuredSum = insuredSums?.insured_sum_per_hectare || 60000;
      const damagePercent = Math.floor(Math.random() * 40) + 40;

      await supabase
        .from('claims')
        .update({
          status: 'under_review',
          ai_identified_crop: cropName,
          ai_damage_percentage: damagePercent,
          ai_justification: `AI Vision analysis confirms presence of ${cropName} crop with standard water submersion damage corresponding to severe weather conditions.`,
          ai_crop_matches_record: true,
          ai_call_status: 'success',
          gps_match_score: 95,
          land_match_score: 93,
          duplicate_check_result: 'No duplicates found',
          fraud_flags: 'None',
          overall_score: 94,
          suggested_payout_amount: Math.round((damagePercent / 100) * area * insuredSum),
          updated_at: new Date().toISOString(),
        })
        .eq('id', newClaimId);

      await supabase.from('claim_status_logs').insert({
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        claim_id: newClaimId,
        old_status: 'filed',
        new_status: 'under_review',
        changed_by_role: 'system',
        changed_by_id: 'system',
        remarks: 'AI Vision Pipeline completed & match scores generated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Background AI processing failed:', err);
    }
  }, 4000);

  return { success: true, data: newClaim };
};

const claimsList = async (filters = {}) => {
  const { role, userId } = session();
  let q = supabase.from('claims').select('*');

  if (role === 'farmer') {
    q = q.eq('farmer_id', userId);
  } else if (role === 'official') {
    // Get assigned village
    const { data: off } = await supabase.from('officials').select('assigned_village_id').eq('id', userId).single();
    if (off?.assigned_village_id) {
      q = q.eq('village_id', off.assigned_village_id);
    }
  }

  if (filters.status) {
    q = q.eq('status', filters.status);
  }

  q = q.order('created_at', { ascending: false });

  const { data, error } = await q;
  if (error) return { success: false, message: error.message };
  return { success: true, data: { items: data || [], total: (data || []).length, page: 1, per_page: 20 } };
};

const claimsGet = async (id) => {
  const res = await supabase.from('claims').select('*').eq('id', id).single();
  return wrap(res);
};

const claimsGetReport = async (id) => {
  const { data: claim } = await supabase.from('claims').select('*').eq('id', id).single();
  if (!claim) throw new Error('Claim not found');

  const { data: farmer } = await supabase.from('farmers').select('*').eq('id', claim.farmer_id).single();
  const { data: land } = await supabase.from('land_registries').select('*').eq('id', claim.land_registry_id).single();
  const { data: village } = await supabase.from('villages').select('*').eq('id', claim.village_id).single();

  const { data: insuredSums } = await supabase
    .from('crop_insured_sums')
    .select('insured_sum_per_hectare')
    .eq('crop_name', land?.crop_on_record || 'Cotton')
    .single();

  return {
    success: true,
    data: {
      claim_id: claim.id,
      status: claim.status,
      submission: {
        farmer_name: farmer?.name || 'Unknown',
        village_name: village?.name || 'Unknown',
        survey_number: land?.survey_number || 'Unknown',
        claimed_loss_percentage: 100,
        claimed_event_type: claim.claimed_event_type,
        claimed_event_date: claim.claimed_event_date,
        description: claim.description,
        photo_url: claim.photo_url,
      },
      ai_vision: {
        crop_identified: claim.ai_identified_crop || 'Pending',
        damage_percentage: claim.ai_damage_percentage || 0,
        justification: claim.ai_justification || 'AI vision model queued…',
      },
      rules_scores: {
        gps_match_score: claim.gps_match_score || 0,
        land_match_score: claim.land_match_score || 0,
        crop_match: claim.ai_crop_matches_record ? 'MATCH' : 'MISMATCH',
        duplicate_check: claim.duplicate_check_result || 'Pending',
        fraud_flags: claim.fraud_flags || 'None',
        overall_score: claim.overall_score || 0,
      },
      payout: {
        crop_insured_sum_per_hectare: insuredSums?.insured_sum_per_hectare || 60000,
        area_hectares: land?.area_hectares || 0,
        suggested_payout_amount: claim.suggested_payout_amount || 0,
        approved_payout_amount: claim.official_approved_amount || 0,
      },
    },
  };
};

const claimsReview = async (id, reviewData) => {
  const { userId } = session();
  const newStatus = reviewData.decision === 'approved' ? 'approved' : 'denied';

  // Get old status
  const { data: existing } = await supabase.from('claims').select('status').eq('id', id).single();

  const { data, error } = await supabase
    .from('claims')
    .update({
      status: newStatus,
      official_approved_amount: reviewData.approved_amount,
      official_remarks: reviewData.remarks,
      reviewed_by_official_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from('claim_status_logs').insert({
    id: 'log-' + Math.random().toString(36).substr(2, 9),
    claim_id: id,
    old_status: existing?.status || 'verified',
    new_status: newStatus,
    changed_by_role: 'official',
    changed_by_id: userId,
    remarks: reviewData.remarks || `Review decision: ${newStatus}`,
    timestamp: new Date().toISOString(),
  });

  return { success: true, data };
};

const claimsTriggerPayout = async (id) => {
  const { data: existing } = await supabase.from('claims').select('status').eq('id', id).single();

  const { data, error } = await supabase
    .from('claims')
    .update({ status: 'payout_completed', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from('claim_status_logs').insert({
    id: 'log-' + Math.random().toString(36).substr(2, 9),
    claim_id: id,
    old_status: existing?.status || 'approved',
    new_status: 'payout_completed',
    changed_by_role: 'system',
    changed_by_id: 'system',
    remarks: 'Disbursal payout completed successfully via Aadhaar Enabled Payment System (AEPS).',
    timestamp: new Date().toISOString(),
  });

  return { success: true, data };
};

const claimsGetStatusLog = async (id) => {
  const { data } = await supabase
    .from('claim_status_logs')
    .select('*')
    .eq('claim_id', id)
    .order('timestamp', { ascending: true });
  return { success: true, data: data || [] };
};

// ─── NGO ────────────────────────────────────────────────────────────

const ngoDashboard = async (villageId) => {
  const { data } = await supabase
    .from('claims')
    .select('*')
    .eq('village_id', villageId)
    .in('status', ['filed', 'under_review', 'verified']);
  return { success: true, data: { items: data || [], total: (data || []).length, page: 1, per_page: 20 } };
};

const ngoVerificationsSubmit = async (formData) => {
  const ngoId = localStorage.getItem('user_id');

  const fileObj = formData.get('file');
  const photoUrl = fileObj
    ? URL.createObjectURL(fileObj)
    : 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600';

  const newVerification = {
    id: 'verification-uuid-' + Math.random().toString(36).substr(2, 9),
    ngo_id: ngoId,
    claim_id: formData.get('claim_id'),
    farmer_id: formData.get('farmer_id'),
    photo_url: photoUrl,
    remarks: formData.get('remarks') || '',
    verification_type: formData.get('verification_type') || 'field_visit',
  };

  const { error } = await supabase.from('ngo_verifications').insert(newVerification);
  if (error) throw new Error(error.message);

  const claimId = formData.get('claim_id');
  const { data: existing } = await supabase.from('claims').select('status').eq('id', claimId).single();

  await supabase
    .from('claims')
    .update({ status: 'verified', updated_at: new Date().toISOString() })
    .eq('id', claimId);

  await supabase.from('claim_status_logs').insert({
    id: 'log-' + Math.random().toString(36).substr(2, 9),
    claim_id: claimId,
    old_status: existing?.status || 'under_review',
    new_status: 'verified',
    changed_by_role: 'ngo',
    changed_by_id: ngoId,
    remarks: `NGO Field Verification complete: ${formData.get('remarks')}`,
    timestamp: new Date().toISOString(),
  });

  return { success: true, data: newVerification };
};

const ngoVerificationsList = async () => {
  const ngoId = localStorage.getItem('user_id');

  const { data: verifications } = await supabase
    .from('ngo_verifications')
    .select('*')
    .eq('ngo_id', ngoId)
    .order('created_at', { ascending: false });

  if (!verifications || verifications.length === 0) {
    return { success: true, data: { items: [], total: 0, page: 1, per_page: 20 } };
  }

  // Enrich with claim & farmer info
  const claimIds = [...new Set(verifications.map((v) => v.claim_id))];
  const farmerIds = [...new Set(verifications.map((v) => v.farmer_id).filter(Boolean))];

  const { data: claimsData } = await supabase.from('claims').select('id, ai_identified_crop, status').in('id', claimIds);
  const { data: farmersData } = farmerIds.length
    ? await supabase.from('farmers').select('id, name').in('id', farmerIds)
    : { data: [] };

  const claimsMap = Object.fromEntries((claimsData || []).map((c) => [c.id, c]));
  const farmersMap = Object.fromEntries((farmersData || []).map((f) => [f.id, f]));

  const items = verifications.map((v) => ({
    ...v,
    crop_name: claimsMap[v.claim_id]?.ai_identified_crop || 'Cotton',
    farmer_name: farmersMap[v.farmer_id]?.name || 'Unknown',
    claim_status: claimsMap[v.claim_id]?.status || 'verified',
  }));

  return { success: true, data: { items, total: items.length, page: 1, per_page: 20 } };
};

// ─── Official ───────────────────────────────────────────────────────

const officialDashboard = async () => {
  const { data: claims } = await supabase.from('claims').select('*');
  const c = claims || [];

  const counts = {
    total_claims: c.length,
    under_review: c.filter((x) => x.status === 'under_review' || x.status === 'filed').length,
    verified: c.filter((x) => x.status === 'verified').length,
    approved: c.filter((x) => x.status === 'approved' || x.status === 'payout_completed').length,
    rejected: c.filter((x) => x.status === 'denied' || x.status === 'rejected').length,
  };

  const totalSuggestedPayout = c
    .filter((x) => x.status !== 'denied' && x.status !== 'rejected')
    .reduce((acc, x) => acc + (x.suggested_payout_amount || 0), 0);

  const totalDisbursedPayout = c
    .filter((x) => x.status === 'payout_completed')
    .reduce((acc, x) => acc + (x.official_approved_amount || 0), 0);

  return {
    success: true,
    data: {
      counts,
      total_suggested_payout: totalSuggestedPayout,
      total_disbursed_payout: totalDisbursedPayout,
      village_name: 'Wardha',
    },
  };
};

const officialStatistics = async () => {
  const { data: claims } = await supabase.from('claims').select('*');
  const c = claims || [];

  return {
    success: true,
    data: {
      total_claims: c.length,
      by_status: {
        filed: c.filter((x) => x.status === 'filed').length,
        under_review: c.filter((x) => x.status === 'under_review').length,
        verified: c.filter((x) => x.status === 'verified').length,
        approved: c.filter((x) => x.status === 'approved').length,
        payout_completed: c.filter((x) => x.status === 'payout_completed').length,
        denied: c.filter((x) => x.status === 'denied' || x.status === 'rejected').length,
      },
      total_suggested_payout: c.reduce((acc, x) => acc + (x.suggested_payout_amount || 0), 0),
      total_approved_payout: c.reduce((acc, x) => acc + (x.official_approved_amount || 0), 0),
    },
  };
};

// ─── Reference Data ─────────────────────────────────────────────────

const refGetVillage = async (id) => {
  const { data } = await supabase.from('villages').select('*').eq('id', id).single();
  return { success: true, data };
};

const refListLandRegistries = async (params = {}) => {
  let q = supabase.from('land_registries').select('*');
  if (params.farmer_id) q = q.eq('farmer_id', params.farmer_id);
  if (params.village_id) q = q.eq('village_id', params.village_id);
  const { data } = await q;
  return { success: true, data: { items: data || [], total: (data || []).length, page: 1, per_page: 20 } };
};

const refListCropInsuredSums = async () => {
  const { data } = await supabase.from('crop_insured_sums').select('*');
  return { success: true, data: data || [] };
};

const refListPastEvents = async (villageId) => {
  let q = supabase.from('past_events').select('*');
  if (villageId) q = q.eq('village_id', villageId);
  const { data } = await q;
  return { success: true, data: data || [] };
};

const refListPastBeneficiaries = async (farmerId) => {
  let q = supabase.from('past_beneficiaries').select('*');
  if (farmerId) q = q.eq('farmer_id', farmerId);
  const { data } = await q;
  return { success: true, data: data || [] };
};

const refGetNgoVerificationForClaim = async (claimId) => {
  const { data } = await supabase.from('ngo_verifications').select('*').eq('claim_id', claimId).maybeSingle();
  if (data) {
    const { data: ngo } = await supabase.from('ngos').select('name').eq('id', data.ngo_id).single();
    return { success: true, data: { ...data, ngo_name: ngo?.name || 'Green Earth Foundation' } };
  }
  return { success: true, data: null };
};

// ─── Auth helpers exposed through api.auth ──────────────────────────

const authNgoRegister = async (ngoData) => {
  const newNGO = {
    id: 'ngo-uuid-' + Math.random().toString(36).substr(2, 9),
    name: ngoData.name,
    license_number: ngoData.licenseNumber,
    contact_person: ngoData.contactPerson,
    phone: ngoData.phone,
    email: ngoData.email,
    is_active: true,
  };

  const { error } = await supabase.from('ngos').insert(newNGO);
  if (error) throw new Error(error.message);

  localStorage.setItem('role', 'ngo');
  localStorage.setItem('user_id', newNGO.id);
  localStorage.setItem('token', 'supabase-ngo-jwt');
  return { success: true, data: { access_token: 'supabase-ngo-jwt', role: 'ngo' } };
};

const authNgoLogin = async (email) => {
  const { data: ngo } = await supabase.from('ngos').select('*').eq('email', email).single();
  if (!ngo) throw new Error('NGO not found');
  localStorage.setItem('role', 'ngo');
  localStorage.setItem('user_id', ngo.id);
  localStorage.setItem('token', 'supabase-ngo-jwt');
  return { success: true, data: { access_token: 'supabase-ngo-jwt', role: 'ngo' } };
};

const authOfficialLogin = async (email) => {
  const { data: official } = await supabase.from('officials').select('*').eq('email', email).single();
  if (!official) throw new Error('Official not found');
  localStorage.setItem('role', 'official');
  localStorage.setItem('user_id', official.id);
  localStorage.setItem('token', 'supabase-official-jwt');
  return { success: true, data: { access_token: 'supabase-official-jwt', role: 'official' } };
};

// ─── Export ─────────────────────────────────────────────────────────

export const supabaseDataService = {
  auth: {
    me: authMe,
    ngo: { register: authNgoRegister, login: authNgoLogin },
    official: { login: authOfficialLogin },
    farmer: {
      requestOtp: async (aadhaarNumber) => {
        return { success: true, data: { status: 'sent', recipient: 'XXXX-XXX-9012' } };
      },
      verifyOtp: async (aadhaarNumber, otp) => {
        return { success: true };
      }
    },
    logout: async () => {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user_id');
      return { success: true };
    }
  },
  farmers: {
    list: farmersList,
    get: farmersGet,
    getLand: farmersGetLand,
    updateProfile: farmersUpdateProfile,
  },
  claims: {
    create: claimsCreate,
    list: claimsList,
    get: claimsGet,
    getReport: claimsGetReport,
    review: claimsReview,
    triggerPayout: claimsTriggerPayout,
    getStatusLog: claimsGetStatusLog,
  },
  ngo: {
    dashboard: ngoDashboard,
    verifications: {
      submit: ngoVerificationsSubmit,
      list: ngoVerificationsList,
    },
  },
  official: {
    dashboard: officialDashboard,
    statistics: officialStatistics,
  },
  referenceData: {
    getVillage: refGetVillage,
    listLandRegistries: refListLandRegistries,
    listCropInsuredSums: refListCropInsuredSums,
    listPastEvents: refListPastEvents,
    listPastBeneficiaries: refListPastBeneficiaries,
    getNgoVerificationForClaim: refGetNgoVerificationForClaim,
  },
};

export default supabaseDataService;
