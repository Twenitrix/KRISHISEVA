import axios from 'axios';
import { hasSupabase } from '../lib/supabaseClient';
import { supabaseDataService } from '../services/supabaseDataService';

// Toggle for offline demonstration mode
const USE_MOCKS = !hasSupabase;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add authorization header
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// ─── LOCAL STORAGE MOCK DATABASE INITIALISATION ───
const initializeMockDB = () => {
  if (!localStorage.getItem('ks_db_initialized')) {
    const v1 = 'v1-uuid-wardha';
    const f1 = 'f1-uuid-suresh';
    const ngo1 = 'ngo1-uuid-green';
    const off1 = 'off1-uuid-sdm';
    
    const lr1 = 'lr1-uuid-cotton';
    const lr2 = 'lr2-uuid-soybean';
    const lr3 = 'lr3-uuid-pigeon';

    const pe1 = 'pe1-uuid-flood';

    const initialData = {
      villages: [
        { id: v1, name: 'Wardha', district: 'Wardha', state: 'Maharashtra', taluka: 'Wardha', latitude: 20.8351, longitude: 78.6015 }
      ],
      farmers: [
        {
          id: f1,
          village_id: v1,
          aadhaar_masked: 'XXXX-XXXX-9012',
          aadhaar_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          name: 'Suresh Rao Patwardhan',
          phone: '9876543210',
          bank_account_number: '12345678901',
          bank_ifsc: 'SBIN0001234',
          is_verified: true,
          created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
        }
      ],
      ngos: [
        {
          id: ngo1,
          name: 'Green Earth Foundation',
          license_number: 'MH/NGO/2026/001',
          contact_person: 'Amit Patil',
          phone: '9876543211',
          email: 'contact@greenearth.org',
          is_active: true
        }
      ],
      officials: [
        {
          id: off1,
          name: 'Shri. Rajesh Deshmukh',
          designation: 'Sub-Divisional Magistrate',
          email: 'official@gov.in',
          phone: '9876543212',
          assigned_village_id: v1,
          is_active: true
        }
      ],
      land_registries: [
        {
          id: lr1,
          farmer_id: f1,
          village_id: v1,
          survey_number: '101/A',
          area_hectares: 1.5,
          crop_on_record: 'Cotton',
          latitude: 20.8351,
          longitude: 78.6015,
          polygon_coords: '[[20.8349,78.6013],[20.8353,78.6013],[20.8353,78.6017],[20.8349,78.6017]]'
        },
        {
          id: lr2,
          farmer_id: f1,
          village_id: v1,
          survey_number: '102/B',
          area_hectares: 0.8,
          crop_on_record: 'Soybean',
          latitude: 20.8365,
          longitude: 78.6030,
          polygon_coords: '[[20.8363,78.6028],[20.8367,78.6028],[20.8367,78.6032],[20.8363,78.6032]]'
        },
        {
          id: lr3,
          farmer_id: f1,
          village_id: v1,
          survey_number: '103/C',
          area_hectares: 2.2,
          crop_on_record: 'Pigeon Pea (Tur)',
          latitude: 20.8378,
          longitude: 78.6045,
          polygon_coords: '[[20.8376,78.6043],[20.8380,78.6043],[20.8380,78.6047],[20.8376,78.6047]]'
        }
      ],
      crop_insured_sums: [
        { id: 'cis1', crop_name: 'Cotton', insured_sum_per_hectare: 60000.0, season: 'Kharif', year: 2026 },
        { id: 'cis2', crop_name: 'Soybean', insured_sum_per_hectare: 50000.0, season: 'Kharif', year: 2026 },
        { id: 'cis3', crop_name: 'Pigeon Pea (Tur)', insured_sum_per_hectare: 55000.0, season: 'Kharif', year: 2026 },
        { id: 'cis4', crop_name: 'Wheat', insured_sum_per_hectare: 45000.0, season: 'Rabi', year: 2026 }
      ],
      past_events: [
        { id: pe1, village_id: v1, event_type: 'Flood', event_date: '2026-07-01', severity: 'High', description: 'Severe overflow of Wardha River damaging low-lying fields' }
      ],
      past_beneficiaries: [
        { id: 'pb1', farmer_id: f1, event_id: pe1, claim_amount: 45000.0, payout_amount: 40000.0, payout_date: '2026-07-05' }
      ],
      claims: [
        {
          id: 'claim-pre-1',
          farmer_id: f1,
          farmer_name: 'Suresh Rao Patwardhan',
          land_registry_id: lr2,
          survey_number: '102/B',
          village_id: v1,
          photo_url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600',
          photo_latitude: 20.8364,
          photo_longitude: 78.6029,
          photo_timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
          claimed_event_type: 'Flood',
          claimed_event_date: '2026-07-01',
          description: 'Waterlogged fields after the river overflowed.',
          ai_identified_crop: 'Soybean',
          ai_damage_percentage: 75.0,
          ai_justification: 'The leaves and stems show heavy mud deposits and rot matching flood submersion damage.',
          ai_crop_matches_record: true,
          ai_call_status: 'success',
          gps_match_score: 98,
          land_match_score: 95,
          duplicate_check_result: 'No duplicates found',
          fraud_flags: 'None',
          overall_score: 96,
          suggested_payout_amount: 30000.0, // 75% of (0.8ha * 50,000)
          official_approved_amount: 30000.0,
          status: 'payout_completed',
          reviewed_by_official_id: off1,
          official_remarks: 'Verified field report and AI vision outputs. Disbursal approved.',
          created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'claim-pre-2',
          farmer_id: f1,
          farmer_name: 'Suresh Rao Patwardhan',
          land_registry_id: lr1,
          survey_number: '101/A',
          village_id: v1,
          photo_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
          photo_latitude: 20.8354,
          photo_longitude: 78.6019,
          photo_timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
          claimed_event_type: 'Flood',
          claimed_event_date: '2026-07-01',
          description: 'Crops flattened by water flow.',
          ai_identified_crop: 'Cotton',
          ai_damage_percentage: 45.0,
          ai_justification: 'Cotton plants show flattening and leaf loss typical of strong water current damage.',
          ai_crop_matches_record: true,
          ai_call_status: 'success',
          gps_match_score: 92,
          land_match_score: 90,
          duplicate_check_result: 'No duplicates found',
          fraud_flags: 'None',
          overall_score: 91,
          suggested_payout_amount: 40500.0, // 45% of (1.5ha * 60,000)
          status: 'under_review',
          created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
        }
      ],
      ngo_verifications: [],
      claim_status_logs: [
        {
          id: 'log1',
          claim_id: 'claim-pre-1',
          old_status: 'none',
          new_status: 'filed',
          changed_by_role: 'farmer',
          changed_by_id: f1,
          remarks: 'Claim submitted via portal',
          timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'log2',
          claim_id: 'claim-pre-1',
          old_status: 'filed',
          new_status: 'under_review',
          changed_by_role: 'system',
          changed_by_id: 'system',
          remarks: 'AI Vision Pipeline completed',
          timestamp: new Date(Date.now() - 4.9 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'log3',
          claim_id: 'claim-pre-1',
          old_status: 'under_review',
          new_status: 'verified',
          changed_by_role: 'ngo',
          changed_by_id: ngo1,
          remarks: 'Field visit confirms water rot. Recommended.',
          timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'log4',
          claim_id: 'claim-pre-1',
          old_status: 'verified',
          new_status: 'approved',
          changed_by_role: 'official',
          changed_by_id: off1,
          remarks: 'Approved full payout',
          timestamp: new Date(Date.now() - 3.5 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'log5',
          claim_id: 'claim-pre-1',
          old_status: 'approved',
          new_status: 'payout_completed',
          changed_by_role: 'official',
          changed_by_id: off1,
          remarks: 'Bank transfer completed',
          timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'log6',
          claim_id: 'claim-pre-2',
          old_status: 'none',
          new_status: 'filed',
          changed_by_role: 'farmer',
          changed_by_id: f1,
          remarks: 'Claim submitted via portal',
          timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'log7',
          claim_id: 'claim-pre-2',
          old_status: 'filed',
          new_status: 'under_review',
          changed_by_role: 'system',
          changed_by_id: 'system',
          remarks: 'AI Vision Pipeline completed',
          timestamp: new Date(Date.now() - 0.95 * 24 * 3600 * 1000).toISOString()
        }
      ]
    };
    
    localStorage.setItem('ks_mock_db', JSON.stringify(initialData));
    localStorage.setItem('ks_db_initialized', 'true');
  }
};

initializeMockDB();

const getMockDB = () => {
  const raw = localStorage.getItem('ks_mock_db');
  if (!raw) {
    // Re-initialize if data was lost (e.g. manual clear)
    localStorage.removeItem('ks_db_initialized');
    initializeMockDB();
    return JSON.parse(localStorage.getItem('ks_mock_db'));
  }
  return JSON.parse(raw);
};
const saveMockDB = (data) => localStorage.setItem('ks_mock_db', JSON.stringify(data));

// Simulation helper: Simulates API call lag
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── API EXPORTS ───
const apiMock = {
  // ─── Auth ───
  auth: {
    farmer: {
      requestOtp: async (aadhaarNumber) => {
        if (USE_MOCKS) {
          await delay(600);
          const db = getMockDB();
          const farmer = db.farmers.find(f => f.aadhaar_hash === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'); // default Suresh
          if (!farmer) throw new Error('Aadhaar record not found');
          return { success: true, data: { status: 'sent', recipient: farmer.phone } };
        }
        const res = await apiClient.post('/auth/farmer/request-otp', { aadhaar_number: aadhaarNumber });
        return res.data;
      },
      verifyOtp: async (aadhaarNumber, otp) => {
        if (USE_MOCKS) {
          await delay(600);
          if (otp !== '123456') throw new Error('Invalid OTP');
          const db = getMockDB();
          const farmer = db.farmers[0]; // suresh
          localStorage.setItem('role', 'farmer');
          localStorage.setItem('user_id', farmer.id);
          localStorage.setItem('token', 'mock-farmer-jwt');
          return { success: true, data: { access_token: 'mock-farmer-jwt', refresh_token: 'mock-refresh', role: 'farmer' } };
        }
        const res = await apiClient.post('/auth/farmer/verify-otp', { aadhaar_number: aadhaarNumber, otp });
        return res.data;
      }
    },
    ngo: {
      register: async (ngoData) => {
        if (USE_MOCKS) {
          await delay(800);
          const db = getMockDB();
          const newNGO = {
            id: 'ngo-uuid-' + Math.random().toString(36).substr(2, 9),
            name: ngoData.name,
            license_number: ngoData.licenseNumber,
            contact_person: ngoData.contactPerson,
            phone: ngoData.phone,
            email: ngoData.email,
            is_active: true
          };
          db.ngos.push(newNGO);
          saveMockDB(db);

          localStorage.setItem('role', 'ngo');
          localStorage.setItem('user_id', newNGO.id);
          localStorage.setItem('token', 'mock-ngo-jwt');
          return { success: true, data: { access_token: 'mock-ngo-jwt', role: 'ngo' } };
        }
        const res = await apiClient.post('/auth/ngo/register', {
          name: ngoData.name,
          license_number: ngoData.licenseNumber,
          contact_person: ngoData.contactPerson,
          phone: ngoData.phone,
          email: ngoData.email,
          password: ngoData.password
        });
        return res.data;
      },
      login: async (email, password) => {
        if (USE_MOCKS) {
          await delay(600);
          const db = getMockDB();
          const ngo = db.ngos.find(n => n.email === email);
          if (!ngo) throw new Error('Invalid credentials');
          localStorage.setItem('role', 'ngo');
          localStorage.setItem('user_id', ngo.id);
          localStorage.setItem('token', 'mock-ngo-jwt');
          return { success: true, data: { access_token: 'mock-ngo-jwt', role: 'ngo' } };
        }
        const res = await apiClient.post('/auth/ngo/login', { email, password });
        return res.data;
      }
    },
    official: {
      login: async (email, password) => {
        if (USE_MOCKS) {
          await delay(600);
          const db = getMockDB();
          const official = db.officials.find(o => o.email === email);
          if (!official) throw new Error('Invalid credentials');
          localStorage.setItem('role', 'official');
          localStorage.setItem('user_id', official.id);
          localStorage.setItem('token', 'mock-official-jwt');
          return { success: true, data: { access_token: 'mock-official-jwt', role: 'official' } };
        }
        const res = await apiClient.post('/auth/official/login', { email, password });
        return res.data;
      }
    },
    me: async () => {
      if (USE_MOCKS) {
        await delay(200);
        const role = localStorage.getItem('role');
        const userId = localStorage.getItem('user_id');
        const db = getMockDB();

        if (role === 'farmer') {
          const user = db.farmers.find(f => f.id === userId) || db.farmers[0];
          return { success: true, data: { id: user.id, role: 'farmer', name: user.name, phone: user.phone, is_verified: user.is_verified } };
        } else if (role === 'ngo') {
          const user = db.ngos.find(n => n.id === userId) || db.ngos[0];
          return { success: true, data: { id: user.id, role: 'ngo', name: user.name, phone: user.phone, email: user.email } };
        } else if (role === 'official') {
          const user = db.officials.find(o => o.id === userId) || db.officials[0];
          return { success: true, data: { id: user.id, role: 'official', name: user.name, email: user.email, designation: user.designation } };
        }
        throw new Error('Not authenticated');
      }
      const res = await apiClient.get('/auth/me');
      return res.data;
    },
    logout: async () => {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user_id');
      return { success: true };
    }
  },

  // ─── Farmers ───
  farmers: {
    list: async (villageId) => {
      if (USE_MOCKS) {
        await delay(300);
        const db = getMockDB();
        let items = db.farmers;
        if (villageId) items = items.filter(f => f.village_id === villageId);
        return { success: true, data: { items, total: items.length, page: 1, per_page: 20 } };
      }
      const res = await apiClient.get('/farmers', { params: { village_id: villageId } });
      return res.data;
    },
    get: async (id) => {
      if (USE_MOCKS) {
        await delay(200);
        const db = getMockDB();
        const farmer = db.farmers.find(f => f.id === id);
        return { success: true, data: farmer };
      }
      const res = await apiClient.get(`/farmers/${id}`);
      return res.data;
    },
    getLand: async (id) => {
      if (USE_MOCKS) {
        await delay(200);
        const db = getMockDB();
        const land = db.land_registries.filter(l => l.farmer_id === id);
        return { success: true, data: land };
      }
      const res = await apiClient.get(`/farmers/${id}/land`);
      return res.data;
    },
    updateProfile: async (farmerId, profileData) => {
      if (USE_MOCKS) {
        await delay(500);
        const db = getMockDB();
        const farmerIdx = db.farmers.findIndex(f => f.id === farmerId);
        if (farmerIdx !== -1) {
          db.farmers[farmerIdx] = {
            ...db.farmers[farmerIdx],
            bank_account_number: profileData.bank_account_number,
            bank_ifsc: profileData.bank_ifsc,
          };
          saveMockDB(db);
          return { success: true, data: db.farmers[farmerIdx] };
        }
        throw new Error('Farmer profile not found');
      }
      const res = await apiClient.put(`/farmers/${farmerId}`, profileData);
      return res.data;
    }
  },

  // ─── Claims ───
  claims: {
    create: async (formData) => {
      if (USE_MOCKS) {
        await delay(1000);
        const db = getMockDB();
        const farmer = db.farmers[0]; // Suresh
        const land = db.land_registries.find(l => l.id === formData.get('land_registry_id'));
        
        const newClaimId = 'claim-uuid-' + Math.random().toString(36).substr(2, 9);
        const initialStatus = 'filed';

        // Read file name or object from FormData
        const fileObj = formData.get('file');
        const photoUrl = fileObj ? URL.createObjectURL(fileObj) : 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600';

        const newClaim = {
          id: newClaimId,
          farmer_id: farmer.id,
          farmer_name: farmer.name,
          land_registry_id: formData.get('land_registry_id'),
          survey_number: land ? land.survey_number : 'Unknown',
          village_id: farmer.village_id,
          photo_url: photoUrl,
          photo_latitude: parseFloat(formData.get('test_latitude')) || (land ? land.latitude + 0.0001 : 20.8351),
          photo_longitude: parseFloat(formData.get('test_longitude')) || (land ? land.longitude + 0.0001 : 78.6015),
          photo_timestamp: new Date().toISOString(),
          claimed_event_type: formData.get('claimed_event_type'),
          claimed_event_date: formData.get('claimed_event_date'),
          description: formData.get('description') || '',
          status: initialStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        db.claims.push(newClaim);

        // Add status log
        const log = {
          id: 'log-' + Math.random().toString(36).substr(2, 9),
          claim_id: newClaimId,
          old_status: 'none',
          new_status: 'filed',
          changed_by_role: 'farmer',
          changed_by_id: farmer.id,
          remarks: 'Claim submitted via portal',
          timestamp: new Date().toISOString()
        };
        db.claim_status_logs.push(log);
        saveMockDB(db);

        // ─── Trigger Mock background AI processor (FastAPI background tasks style) ───
        setTimeout(() => {
          const freshDb = getMockDB();
          const targetClaimIdx = freshDb.claims.findIndex(c => c.id === newClaimId);
          if (targetClaimIdx !== -1 && freshDb.claims[targetClaimIdx].status === 'filed') {
            const cropName = land ? land.crop_on_record : 'Cotton';
            const area = land ? land.area_hectares : 1.0;
            const insuredSum = freshDb.crop_insured_sums.find(c => c.crop_name === cropName)?.insured_sum_per_hectare || 60000;
            const damagePercent = Math.floor(Math.random() * 40) + 40; // 40% - 80%

            freshDb.claims[targetClaimIdx] = {
              ...freshDb.claims[targetClaimIdx],
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
              updated_at: new Date().toISOString()
            };

            freshDb.claim_status_logs.push({
              id: 'log-' + Math.random().toString(36).substr(2, 9),
              claim_id: newClaimId,
              old_status: 'filed',
              new_status: 'under_review',
              changed_by_role: 'system',
              changed_by_id: 'system',
              remarks: 'AI Vision Pipeline completed & match scores generated.',
              timestamp: new Date().toISOString()
            });

            saveMockDB(freshDb);
          }
        }, 4000); // 4 seconds delay to allow viewing the Filed state in UI

        return { success: true, data: newClaim };
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const res = await apiClient.post('/claims/', formData, config);
      return res.data;
    },
    list: async (filters = {}) => {
      if (USE_MOCKS) {
        await delay(400);
        const db = getMockDB();
        let items = [...db.claims];
        const role = localStorage.getItem('role');
        const userId = localStorage.getItem('user_id');

        if (role === 'farmer') {
          items = items.filter(c => c.farmer_id === userId);
        } else if (role === 'official') {
          const sdm = db.officials.find(o => o.id === userId);
          if (sdm && sdm.assigned_village_id) {
            items = items.filter(c => c.village_id === sdm.assigned_village_id);
          }
        }

        if (filters.status) {
          items = items.filter(c => c.status === filters.status);
        }

        // Sort by created_at desc
        items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return { success: true, data: { items, total: items.length, page: 1, per_page: 20 } };
      }
      const res = await apiClient.get('/claims/', { params: filters });
      return res.data;
    },
    get: async (id) => {
      if (USE_MOCKS) {
        await delay(200);
        const db = getMockDB();
        const claim = db.claims.find(c => c.id === id);
        return { success: true, data: claim };
      }
      const res = await apiClient.get(`/claims/${id}`);
      return res.data;
    },
    getReport: async (id) => {
      if (USE_MOCKS) {
        await delay(400);
        const db = getMockDB();
        const claim = db.claims.find(c => c.id === id);
        if (!claim) throw new Error('Claim not found');

        const farmer = db.farmers.find(f => f.id === claim.farmer_id);
        const land = db.land_registries.find(l => l.id === claim.land_registry_id);
        const village = db.villages.find(v => v.id === claim.village_id);

        return {
          success: true,
          data: {
            claim_id: claim.id,
            status: claim.status,
            submission: {
              farmer_name: farmer ? farmer.name : 'Unknown',
              village_name: village ? village.name : 'Unknown',
              survey_number: land ? land.survey_number : 'Unknown',
              claimed_loss_percentage: 100, // standard filing
              claimed_event_type: claim.claimed_event_type,
              claimed_event_date: claim.claimed_event_date,
              description: claim.description,
              photo_url: claim.photo_url
            },
            ai_vision: {
              crop_identified: claim.ai_identified_crop || 'Pending',
              damage_percentage: claim.ai_damage_percentage || 0,
              justification: claim.ai_justification || 'AI vision model queued…'
            },
            rules_scores: {
              gps_match_score: claim.gps_match_score || 0,
              land_match_score: claim.land_match_score || 0,
              crop_match: claim.ai_crop_matches_record ? 'MATCH' : 'MISMATCH',
              duplicate_check: claim.duplicate_check_result || 'Pending',
              fraud_flags: claim.fraud_flags || 'None',
              overall_score: claim.overall_score || 0
            },
            payout: {
              crop_insured_sum_per_hectare: land ? (db.crop_insured_sums.find(c => c.crop_name === land.crop_on_record)?.insured_sum_per_hectare || 60000) : 60000,
              area_hectares: land ? land.area_hectares : 0,
              suggested_payout_amount: claim.suggested_payout_amount || 0,
              approved_payout_amount: claim.official_approved_amount || 0
            }
          }
        };
      }
      const res = await apiClient.get(`/claims/${id}/report`);
      return res.data;
    },
    review: async (id, reviewData) => {
      if (USE_MOCKS) {
        await delay(800);
        const db = getMockDB();
        const claimIdx = db.claims.findIndex(c => c.id === id);
        if (claimIdx !== -1) {
          const oldStatus = db.claims[claimIdx].status;
          const newStatus = reviewData.decision === 'approved' ? 'approved' : 'denied';
          
          db.claims[claimIdx] = {
            ...db.claims[claimIdx],
            status: newStatus,
            official_approved_amount: reviewData.approved_amount,
            official_remarks: reviewData.remarks,
            reviewed_by_official_id: localStorage.getItem('user_id'),
            updated_at: new Date().toISOString()
          };

          db.claim_status_logs.push({
            id: 'log-' + Math.random().toString(36).substr(2, 9),
            claim_id: id,
            old_status: oldStatus,
            new_status: newStatus,
            changed_by_role: 'official',
            changed_by_id: localStorage.getItem('user_id'),
            remarks: reviewData.remarks || `Review decision: ${newStatus}`,
            timestamp: new Date().toISOString()
          });

          saveMockDB(db);
          return { success: true, data: db.claims[claimIdx] };
        }
        throw new Error('Claim not found');
      }
      const res = await apiClient.patch(`/claims/${id}/review`, {
        decision: reviewData.decision,
        approved_amount: reviewData.approved_amount,
        remarks: reviewData.remarks
      });
      return res.data;
    },
    triggerPayout: async (id) => {
      if (USE_MOCKS) {
        await delay(1000);
        const db = getMockDB();
        const claimIdx = db.claims.findIndex(c => c.id === id);
        if (claimIdx !== -1) {
          const oldStatus = db.claims[claimIdx].status;
          const newStatus = 'payout_completed';

          db.claims[claimIdx] = {
            ...db.claims[claimIdx],
            status: newStatus,
            updated_at: new Date().toISOString()
          };

          db.claim_status_logs.push({
            id: 'log-' + Math.random().toString(36).substr(2, 9),
            claim_id: id,
            old_status: oldStatus,
            new_status: newStatus,
            changed_by_role: 'system',
            changed_by_id: 'system',
            remarks: 'Disbursal payout completed successfully via Aadhaar Enabled Payment System (AEPS).',
            timestamp: new Date().toISOString()
          });

          saveMockDB(db);
          return { success: true, data: db.claims[claimIdx] };
        }
        throw new Error('Claim not found');
      }
      const res = await apiClient.patch(`/claims/${id}/review`, {
        decision: 'approved',
        approved_amount: db.claims.find(c => c.id === id).official_approved_amount,
        remarks: 'Triggering payout transfer.'
      });
      return res.data;
    },
    getStatusLog: async (id) => {
      if (USE_MOCKS) {
        await delay(200);
        const db = getMockDB();
        const logs = db.claim_status_logs.filter(l => l.claim_id === id);
        logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        return { success: true, data: logs };
      }
      const res = await apiClient.get(`/claims/${id}/status-log`);
      return res.data;
    }
  },

  // ─── NGO ───
  ngo: {
    dashboard: async (villageId) => {
      if (USE_MOCKS) {
        await delay(500);
        const db = getMockDB();
        let items = db.claims.filter(c => c.village_id === villageId && (c.status === 'filed' || c.status === 'under_review' || c.status === 'verified'));
        return { success: true, data: { items, total: items.length, page: 1, per_page: 20 } };
      }
      const res = await apiClient.get('/ngo/dashboard', { params: { village_id: villageId } });
      return res.data;
    },
    verifications: {
      submit: async (formData) => {
        if (USE_MOCKS) {
          await delay(1000);
          const db = getMockDB();
          const ngoId = localStorage.getItem('user_id');

          const fileObj = formData.get('file');
          const photoUrl = fileObj ? URL.createObjectURL(fileObj) : 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600';

          const newVerification = {
            id: 'verification-uuid-' + Math.random().toString(36).substr(2, 9),
            ngo_id: ngoId,
            claim_id: formData.get('claim_id'),
            farmer_id: formData.get('farmer_id'),
            photo_url: photoUrl,
            remarks: formData.get('remarks') || '',
            verification_type: formData.get('verification_type') || 'field_visit',
            created_at: new Date().toISOString()
          };

          db.ngo_verifications.push(newVerification);

          const claimIdx = db.claims.findIndex(c => c.id === formData.get('claim_id'));
          if (claimIdx !== -1) {
            const oldStatus = db.claims[claimIdx].status;
            db.claims[claimIdx].status = 'verified';
            db.claims[claimIdx].updated_at = new Date().toISOString();

            db.claim_status_logs.push({
              id: 'log-' + Math.random().toString(36).substr(2, 9),
              claim_id: formData.get('claim_id'),
              old_status: oldStatus,
              new_status: 'verified',
              changed_by_role: 'ngo',
              changed_by_id: ngoId,
              remarks: `NGO Field Verification complete: ${formData.get('remarks')}`,
              timestamp: new Date().toISOString()
            });
          }

          saveMockDB(db);
          return { success: true, data: newVerification };
        }

        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        const res = await apiClient.post('/ngo/verifications', formData, config);
        return res.data;
      },
      list: async () => {
        if (USE_MOCKS) {
          await delay(400);
          const db = getMockDB();
          const ngoId = localStorage.getItem('user_id');
          
          const verifications = db.ngo_verifications.filter(v => v.ngo_id === ngoId);
          const items = verifications.map(v => {
            const claim = db.claims.find(c => c.id === v.claim_id);
            const farmer = db.farmers.find(f => f.id === v.farmer_id);
            return {
              ...v,
              crop_name: claim ? claim.ai_identified_crop || 'Cotton' : 'Cotton',
              farmer_name: farmer ? farmer.name : 'Unknown',
              claim_status: claim ? claim.status : 'verified'
            };
          });

          items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          return { success: true, data: { items, total: items.length, page: 1, per_page: 20 } };
        }
        const res = await apiClient.get('/ngo/verifications');
        return res.data;
      }
    }
  },

  // ─── Official ───
  official: {
    dashboard: async () => {
      if (USE_MOCKS) {
        await delay(500);
        const db = getMockDB();
        const claims = db.claims;
        
        const counts = {
          total_claims: claims.length,
          under_review: claims.filter(c => c.status === 'under_review' || c.status === 'filed').length,
          verified: claims.filter(c => c.status === 'verified').length,
          approved: claims.filter(c => c.status === 'approved' || c.status === 'payout_completed').length,
          rejected: claims.filter(c => c.status === 'denied' || c.status === 'rejected').length
        };

        const totalSuggestedPayout = claims
          .filter(c => c.status !== 'denied' && c.status !== 'rejected')
          .reduce((acc, c) => acc + (c.suggested_payout_amount || 0), 0);

        const totalDisbursedPayout = claims
          .filter(c => c.status === 'payout_completed')
          .reduce((acc, c) => acc + (c.official_approved_amount || 0), 0);

        return {
          success: true,
          data: {
            counts,
            total_suggested_payout: totalSuggestedPayout,
            total_disbursed_payout: totalDisbursedPayout,
            village_name: 'Wardha'
          }
        };
      }
      const res = await apiClient.get('/official/dashboard');
      return res.data;
    },
    statistics: async () => {
      if (USE_MOCKS) {
        await delay(300);
        const db = getMockDB();
        const claims = db.claims;
        return {
          success: true,
          data: {
            total_claims: claims.length,
            by_status: {
              filed: claims.filter(c => c.status === 'filed').length,
              under_review: claims.filter(c => c.status === 'under_review').length,
              verified: claims.filter(c => c.status === 'verified').length,
              approved: claims.filter(c => c.status === 'approved').length,
              payout_completed: claims.filter(c => c.status === 'payout_completed').length,
              denied: claims.filter(c => c.status === 'denied' || c.status === 'rejected').length
            },
            total_suggested_payout: claims.reduce((acc, c) => acc + (c.suggested_payout_amount || 0), 0),
            total_approved_payout: claims.reduce((acc, c) => acc + (c.official_approved_amount || 0), 0)
          }
        };
      }
      const res = await apiClient.get('/official/statistics');
      return res.data;
    }
  },

  // ─── Reference / Master Data ───
  referenceData: {
    getVillage: async (id) => {
      if (USE_MOCKS) {
        await delay(100);
        const db = getMockDB();
        const v = db.villages[0];
        return { success: true, data: v };
      }
      const res = await apiClient.get(`/reference-data/villages/${id}`);
      return res.data;
    },
    listLandRegistries: async (params = {}) => {
      if (USE_MOCKS) {
        await delay(300);
        const db = getMockDB();
        let items = db.land_registries;
        if (params.farmer_id) items = items.filter(l => l.farmer_id === params.farmer_id);
        if (params.village_id) items = items.filter(l => l.village_id === params.village_id);
        return { success: true, data: { items, total: items.length, page: 1, per_page: 20 } };
      }
      const res = await apiClient.get('/reference-data/land-registries', { params });
      return res.data;
    },
    listCropInsuredSums: async () => {
      if (USE_MOCKS) {
        await delay(200);
        const db = getMockDB();
        return { success: true, data: db.crop_insured_sums };
      }
      const res = await apiClient.get('/reference-data/crop-insured-sums');
      return res.data;
    },
    listPastEvents: async (villageId) => {
      if (USE_MOCKS) {
        await delay(200);
        const db = getMockDB();
        let items = db.past_events;
        if (villageId) items = items.filter(e => e.village_id === villageId);
        return { success: true, data: items };
      }
      const res = await apiClient.get('/reference-data/past-events', { params: { village_id: villageId } });
      return res.data;
    },
    listPastBeneficiaries: async (farmerId) => {
      if (USE_MOCKS) {
        await delay(200);
        const db = getMockDB();
        let items = db.past_beneficiaries;
        if (farmerId) items = items.filter(b => b.farmer_id === farmerId);
        return { success: true, data: items };
      }
      const res = await apiClient.get('/reference-data/past-beneficiaries', { params: { farmer_id: farmerId } });
      return res.data;
    },
    getNgoVerificationForClaim: async (claimId) => {
      if (USE_MOCKS) {
        await delay(100);
        const db = getMockDB();
        const v = db.ngo_verifications.find(x => x.claim_id === claimId);
        if (v) {
          const ngo = db.ngos.find(n => n.id === v.ngo_id);
          return { success: true, data: { ...v, ngo_name: ngo ? ngo.name : 'Green Earth Foundation' } };
        }
        return { success: true, data: null };
      }
      const res = await apiClient.get(`/ngo/verifications/claim/${claimId}`);
      return res.data;
    }
  }
};

export const api = hasSupabase ? supabaseDataService : apiMock;
