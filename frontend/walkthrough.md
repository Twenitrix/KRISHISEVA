# Supabase Auth & Data Storage Integration Walkthrough

We have fully connected the **KrishiSeva** application to your real Supabase project:
- **Project ID:** `xksoqrtuvfzdemmkjpti`
- **Region/URL:** `https://xksoqrtuvfzdemmkjpti.supabase.co`
- **Data storage + Authentication** both operate via Supabase when configured, falling back gracefully to mock offline mode if credentials are deleted.

---

## 🛠️ Setup Instructions (Action Required)

To run the application with real data in Supabase, execute the SQL script in your Supabase project:

1. Copy the contents of the generated [supabase_schema.sql](file:///c:/Users/SATYAM%20CHOUDHARY/OneDrive/Desktop/IDEATHON/KRISHISEVA/frontend/supabase_schema.sql).
2. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/xksoqrtuvfzdemmkjpti) → **SQL Editor** → **New Query**.
3. Paste the SQL query and click **Run**.
   - This creates all 12 tables (including `auth_logs` table for logging signins and signups).
   - It configures permissive Row-Level Security (RLS) policies for anonymous and authenticated access (ideal for hackathon presentation and demonstration speed).
   - It seeds 6 comprehensive test cases for each domain (Farmers, NGOs, Officials, Land Registries, Claims, NGO Verifications, Status Logs, and Auth Logs) to be immediately visible in your Supabase table dashboard.

---

## 🪪 Aadhaar & UIDAI Mock Auth Flow for Farmers

- Farmers now log in via **Aadhaar number + OTP** (Mocked to `123456` or matching your `seed.json` users).
- **Every sign-in and sign-up is recorded in Supabase** inside the `auth_logs` table (showing user, role, action, masked Aadhaar/email, status, and timestamp).
- Signing in with a seeded Aadhaar dynamically binds/claims that profile. Creating/signing up with a new Aadhaar inserts a new farmer row and dynamically provisions 2 land records to make the claims filing process instantly playable!

---

## 📝 Integrated Code Changes

1. **[.env](file:///c:/Users/SATYAM%20CHOUDHARY/OneDrive/Desktop/IDEATHON/KRISHISEVA/frontend/.env)**: Set credentials with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. **[supabaseDataService.js](file:///c:/Users/SATYAM%20CHOUDHARY/OneDrive/Desktop/IDEATHON/KRISHISEVA/frontend/src/services/supabaseDataService.js)**: Created a Supabase-specific implementation matching the frontend data layer interface 1-to-1, replacing the localStorage queries with live Supabase REST calls.
3. **[api/index.js](file:///c:/Users/SATYAM%20CHOUDHARY/OneDrive/Desktop/IDEATHON/KRISHISEVA/frontend/src/api/index.js)**: Dynamically checks `hasSupabase` to determine if we route requests to the live Supabase database or fallback to the localStorage database.
4. **[authService.js](file:///c:/Users/SATYAM%20CHOUDHARY/OneDrive/Desktop/IDEATHON/KRISHISEVA/frontend/src/services/authService.js)**: Contains `signInFarmerAadhaar` to securely authenticate farmers and log success/failures for signins and signups to the Supabase `auth_logs` table.
5. **[Login.jsx (Farmer)](file:///c:/Users/SATYAM%20CHOUDHARY/OneDrive/Desktop/IDEATHON/KRISHISEVA/frontend/src/pages/farmer/Login.jsx)**: Unified to display Aadhaar input fields in all environments (whether Supabase is configured or running offline).

---

## 🔍 Validation Status

- **Code Compilation:** Production build verified with no errors (`npm run build` succeeds) ✅
- **Dev Server:** Running live on [http://localhost:5173/](http://localhost:5173/) ✅
- **Browser & Login Flow Verification:** Successfully verified via automated browser subagent:
  * **Farmer Aadhaar Login:** Authenticated using Aadhaar `987654329012` + OTP `123456` ✅
  * **Database Retrieval:** Dashboard retrieved and displayed the 3 pre-seeded claims dynamically ✅
  * **Logout:** Verified clean redirection on logout ✅

