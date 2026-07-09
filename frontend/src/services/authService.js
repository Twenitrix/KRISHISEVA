import { supabase, hasSupabase } from '../lib/supabaseClient';

const getMockDB = () => {
  return JSON.parse(localStorage.getItem('ks_mock_db') || '{}');
};

const saveMockDB = (data) => {
  localStorage.setItem('ks_mock_db', JSON.stringify(data));
};

/**
 * Helper to dynamically link the authenticated Supabase Auth user
 * to the corresponding public tables (farmers, ngos, officials)
 * and preserve existing seeded foreign key relations.
 */
async function linkOrCreateProfile(user) {
  if (!supabase) return user.id;

  const role = user.user_metadata?.role || 'farmer';
  const email = user.email;
  const authUid = user.id;

  try {
    if (role === 'farmer') {
      // 1. Check if a farmer is already linked to this authUid
      const { data: existing } = await supabase.from('farmers').select('id').eq('auth_uid', authUid).maybeSingle();
      if (existing) return existing.id;

      // 2. Link to Suresh (default seeded farmer) if free
      const { data: suresh } = await supabase.from('farmers').select('id, auth_uid').eq('id', 'f1-uuid-suresh').maybeSingle();
      if (suresh && !suresh.auth_uid) {
        await supabase.from('farmers').update({ auth_uid: authUid }).eq('id', 'f1-uuid-suresh');
        return 'f1-uuid-suresh';
      }

      // 3. Otherwise create new farmer profile
      const newId = authUid;
      await supabase.from('farmers').insert({
        id: newId,
        auth_uid: authUid,
        name: user.user_metadata?.name || 'Suresh Rao Patwardhan',
        phone: user.user_metadata?.phone || '9876543210',
        village_id: 'v1-uuid-wardha',
        aadhaar_masked: 'XXXX-XXXX-9012',
        aadhaar_hash: 'hash-' + user.id,
        bank_account_number: '12345678901',
        bank_ifsc: 'SBIN0001234',
        is_verified: true
      });

      // Insert mock land records for new farmer to prevent wizard crash
      await supabase.from('land_registries').insert([
        {
          id: `lr1-${newId.slice(0, 8)}`,
          farmer_id: newId,
          village_id: 'v1-uuid-wardha',
          survey_number: '201/X',
          area_hectares: 1.5,
          crop_on_record: 'Cotton',
          latitude: 20.8351,
          longitude: 78.6015,
          polygon_coords: '[[20.8349,78.6013],[20.8353,78.6013],[20.8353,78.6017],[20.8349,78.6017]]'
        },
        {
          id: `lr2-${newId.slice(0, 8)}`,
          farmer_id: newId,
          village_id: 'v1-uuid-wardha',
          survey_number: '202/Y',
          area_hectares: 1.0,
          crop_on_record: 'Soybean',
          latitude: 20.8365,
          longitude: 78.6030,
          polygon_coords: '[[20.8363,78.6028],[20.8367,78.6028],[20.8367,78.6032],[20.8363,78.6032]]'
        }
      ]);

      return newId;
    }

    if (role === 'ngo') {
      // 1. Check if NGO is already linked to this authUid
      const { data: existing } = await supabase.from('ngos').select('id').eq('auth_uid', authUid).maybeSingle();
      if (existing) return existing.id;

      // 2. Link by email if matches seed
      const { data: byEmail } = await supabase.from('ngos').select('id, auth_uid').eq('email', email).maybeSingle();
      if (byEmail) {
        await supabase.from('ngos').update({ auth_uid: authUid }).eq('id', byEmail.id);
        return byEmail.id;
      }

      // 3. Create new NGO
      const newId = authUid;
      await supabase.from('ngos').insert({
        id: newId,
        auth_uid: authUid,
        name: user.user_metadata?.name || 'Green Earth Foundation',
        license_number: user.user_metadata?.licenseNumber || 'MH/NGO/2026/001',
        contact_person: user.user_metadata?.contactPerson || 'NGO Agent',
        phone: user.user_metadata?.phone || '9876543211',
        email: email,
        is_active: true
      });
      return newId;
    }

    if (role === 'official') {
      // 1. Check if official is already linked to this authUid
      const { data: existing } = await supabase.from('officials').select('id').eq('auth_uid', authUid).maybeSingle();
      if (existing) return existing.id;

      // 2. Link by email if matches seed
      const { data: byEmail } = await supabase.from('officials').select('id, auth_uid').eq('email', email).maybeSingle();
      if (byEmail) {
        await supabase.from('officials').update({ auth_uid: authUid }).eq('id', byEmail.id);
        return byEmail.id;
      }

      // 3. Create new official
      const newId = authUid;
      await supabase.from('officials').insert({
        id: newId,
        auth_uid: authUid,
        name: user.user_metadata?.name || 'Gov Official',
        designation: user.user_metadata?.designation || 'Sub-Divisional Magistrate',
        email: email,
        phone: user.user_metadata?.phone || '9876543212',
        assigned_village_id: 'v1-uuid-wardha',
        is_active: true
      });
      return newId;
    }
  } catch (err) {
    console.error('Error linking or creating profile:', err);
  }

  return authUid;
}

export const authService = {
  /**
   * Register a new user with an email, password and a role.
   * Metadata is saved inside user_metadata.
   */
  signUp: async (email, password, role, additionalMetadata = {}) => {
    if (hasSupabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            ...additionalMetadata,
          },
        },
      });
      if (error) throw error;
      
      // Auto-link/create profile
      let profileId = data.user.id;
      if (data.user) {
        profileId = await linkOrCreateProfile(data.user);
      }

      // Log to Supabase auth_logs
      await supabase.from('auth_logs').insert({
        id: 'auth-log-' + Math.random().toString(36).substr(2, 9),
        user_id: profileId,
        role: role,
        action: 'signup',
        identifier: email,
        status: 'success'
      });
      
      return { success: true, data };
    } else {
      // Offline fallback mock mode
      await new Promise((resolve) => setTimeout(resolve, 800));
      const mockUser = {
        id: `mock-user-${Math.random().toString(36).substr(2, 9)}`,
        email,
        user_metadata: { role, ...additionalMetadata },
      };
      return { success: true, data: { user: mockUser } };
    }
  },

  /**
   * Log in with email and password.
   */
  signIn: async (email, password) => {
    if (hasSupabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      const role = data.user?.user_metadata?.role || 'farmer';
      const profileId = await linkOrCreateProfile(data.user);
      
      localStorage.setItem('role', role);
      localStorage.setItem('user_id', profileId);
      localStorage.setItem('token', data.session.access_token);

      // Log to Supabase auth_logs
      await supabase.from('auth_logs').insert({
        id: 'auth-log-' + Math.random().toString(36).substr(2, 9),
        user_id: profileId,
        role: role,
        action: 'signin',
        identifier: email,
        status: 'success'
      });
      
      return { success: true, data };
    } else {
      // Offline fallback mock mode
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Determine role from email prefix or preset mappings
      let role = 'farmer';
      let userId = 'f1-uuid-suresh';
      
      if (email.includes('ngo')) {
        role = 'ngo';
        userId = 'ngo1-uuid-green';
      } else if (email.includes('official') || email.includes('gov')) {
        role = 'official';
        userId = 'off1-uuid-sdm';
      }
      
      localStorage.setItem('role', role);
      localStorage.setItem('user_id', userId);
      localStorage.setItem('token', `mock-${role}-jwt`);
      
      return {
        success: true,
        data: {
          user: {
            id: userId,
            email,
            user_metadata: { role },
          },
        },
      };
    }
  },

  /**
   * Secure Aadhaar validation & sign-in / registration for Farmers
   * Using the mock UIDAI verification payload logic.
   */
  signInFarmerAadhaar: async (aadhaarNumber, otp) => {
    if (otp !== '123456') {
      // Storing failed signin log in Supabase if online
      if (hasSupabase) {
        await supabase.from('auth_logs').insert({
          id: 'auth-log-' + Math.random().toString(36).substr(2, 9),
          user_id: 'unknown',
          role: 'farmer',
          action: 'signin',
          identifier: 'Aadhaar: ' + aadhaarNumber.slice(-4),
          status: 'failed'
        });
      }
      throw new Error('Invalid OTP');
    }

    // UIDAI mock data registry matching mock-aadhaar/seed.json
    const mockUsers = {
      '123456789012': { name: 'Ramesh Kumar', phone: '9876543210', status: 'active' },
      '987654321098': { name: 'Suresh Singh', phone: '9876543211', status: 'active' },
      '111122223333': { name: 'Kamla Devi', phone: '9876543212', status: 'suspended' },
      '987654329012': { name: 'Suresh Rao Patwardhan', phone: '9876543210', status: 'active' },
      '999988887777': { name: 'Harish Patil', phone: '9999888877', status: 'active' }
    };

    const userData = mockUsers[aadhaarNumber] || {
      name: `Farmer ${aadhaarNumber.slice(-4)}`,
      phone: `987654${aadhaarNumber.slice(-4)}`,
      status: 'active'
    };

    if (userData.status === 'suspended') {
      if (hasSupabase) {
        await supabase.from('auth_logs').insert({
          id: 'auth-log-' + Math.random().toString(36).substr(2, 9),
          user_id: 'suspended',
          role: 'farmer',
          action: 'signin',
          identifier: 'Aadhaar: ' + aadhaarNumber.slice(-4),
          status: 'failed'
        });
      }
      throw new Error('Aadhaar status is suspended/inactive');
    }

    const aadhaarMasked = 'XXXX-XXXX-' + aadhaarNumber.slice(-4);
    const aadhaarHash = 'hash-' + aadhaarNumber;

    if (hasSupabase) {
      // Look up existing farmer by aadhaar_masked
      let { data: existingFarmer } = await supabase
        .from('farmers')
        .select('*')
        .eq('aadhaar_masked', aadhaarMasked)
        .maybeSingle();

      let farmerId;
      let action = 'signin';

      if (existingFarmer) {
        farmerId = existingFarmer.id;
      } else {
        // If not found in Supabase, this is a signup/auto-register
        action = 'signup';
        farmerId = 'f-' + Math.random().toString(36).substr(2, 9);
        await supabase.from('farmers').insert({
          id: farmerId,
          name: userData.name,
          phone: userData.phone,
          aadhaar_masked: aadhaarMasked,
          aadhaar_hash: aadhaarHash,
          village_id: 'v1-uuid-wardha',
          is_verified: true,
          bank_account_number: '12345678901',
          bank_ifsc: 'SBIN0001234'
        });

        // Insert mock land records for new farmer to prevent wizard crash
        await supabase.from('land_registries').insert([
          {
            id: `lr1-${farmerId.slice(0, 8)}`,
            farmer_id: farmerId,
            village_id: 'v1-uuid-wardha',
            survey_number: '201/' + farmerId.slice(2, 5).toUpperCase(),
            area_hectares: 1.5,
            crop_on_record: 'Cotton',
            latitude: 20.8351,
            longitude: 78.6015,
            polygon_coords: '[[20.8349,78.6013],[20.8353,78.6013],[20.8353,78.6017],[20.8349,78.6017]]'
          }
        ]);
      }

      // Log success to Supabase auth_logs
      await supabase.from('auth_logs').insert({
        id: 'auth-log-' + Math.random().toString(36).substr(2, 9),
        user_id: farmerId,
        role: 'farmer',
        action: action,
        identifier: aadhaarMasked,
        status: 'success'
      });

      localStorage.setItem('role', 'farmer');
      localStorage.setItem('user_id', farmerId);
      localStorage.setItem('token', 'aadhaar-jwt-' + farmerId);

      return { success: true, data: { role: 'farmer', user_id: farmerId } };
    } else {
      // Offline fallback mock mode
      const db = getMockDB();
      const existingFarmer = db.farmers.find((f) => f.aadhaar_masked === aadhaarMasked);

      let farmerId;
      if (existingFarmer) {
        farmerId = existingFarmer.id;
      } else {
        farmerId = 'mock-f-' + Math.random().toString(36).substr(2, 9);
        db.farmers.push({
          id: farmerId,
          name: userData.name,
          phone: userData.phone,
          aadhaar_masked: aadhaarMasked,
          aadhaar_hash: aadhaarHash,
          village_id: 'v1-uuid-wardha',
          is_verified: true,
          bank_account_number: '12345678901',
          bank_ifsc: 'SBIN0001234'
        });
        db.land_registries.push({
          id: `lr1-${farmerId.slice(0, 8)}`,
          farmer_id: farmerId,
          village_id: 'v1-uuid-wardha',
          survey_number: '201/' + farmerId.slice(2, 5).toUpperCase(),
          area_hectares: 1.5,
          crop_on_record: 'Cotton',
          latitude: 20.8351,
          longitude: 78.6015,
          polygon_coords: '[[20.8349,78.6013],[20.8353,78.6013],[20.8353,78.6017],[20.8349,78.6017]]'
        });
        saveMockDB(db);
      }

      localStorage.setItem('role', 'farmer');
      localStorage.setItem('user_id', farmerId);
      localStorage.setItem('token', 'mock-aadhaar-jwt-' + farmerId);

      return { success: true, data: { role: 'farmer', user_id: farmerId } };
    }
  },

  /**
   * Log out session.
   */
  signOut: async () => {
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('user_id');

    if (hasSupabase) {
      if (role && userId) {
        await supabase.from('auth_logs').insert({
          id: 'auth-log-' + Math.random().toString(36).substr(2, 9),
          user_id: userId,
          role: role,
          action: 'signout',
          identifier: 'session-end',
          status: 'success'
        });
      }
      await supabase.auth.signOut();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
    return { success: true };
  },

  /**
   * Fetch current session/user.
   */
  getCurrentUser: async () => {
    if (hasSupabase) {
      const role = localStorage.getItem('role');
      const userId = localStorage.getItem('user_id');
      
      // If we signed in with Aadhaar (role: farmer), we return the localStorage details
      if (role === 'farmer' && userId) {
        return {
          id: userId,
          user_metadata: { role }
        };
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return null;
      return user;
    } else {
      const role = localStorage.getItem('role');
      const userId = localStorage.getItem('user_id');
      if (!role || !userId) return null;
      return {
        id: userId,
        user_metadata: { role },
      };
    }
  },

  /**
   * Helper to check configuration state.
   */
  isConfigured: () => {
    return hasSupabase;
  },
};

export default authService;
