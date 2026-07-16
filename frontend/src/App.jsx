import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import FarmerLayout from './layouts/FarmerLayout';
import NGOLayout from './layouts/NGOLayout';
import OfficialLayout from './layouts/OfficialLayout';

// Protected Route Wrapper
import ProtectedRoute from './components/ProtectedRoute';

// Pages — Landing / Auth
import Landing from './pages/Landing';
import FarmerLogin from './pages/farmer/Login';
import NGOLogin from './pages/ngo/Login';
import NGORegister from './pages/ngo/Register';
import OfficialLogin from './pages/official/Login';

// Pages — Farmer Portal
import MyClaims from './pages/farmer/MyClaims';
import NewClaim from './pages/farmer/NewClaim';
import Profile from './pages/farmer/Profile';
import HelpFaq from './pages/farmer/HelpFaq';

// Pages — NGO Portal
import NGODashboard from './pages/ngo/Dashboard';
import MyVerifications from './pages/ngo/MyVerifications';

// Pages — Official Portal
import OfficialDashboard from './pages/official/Dashboard';
import ClaimsList from './pages/official/ClaimsList';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Landing ── */}
        <Route path="/" element={<Landing />} />

        {/* ── Farmer Portal ── */}
        <Route path="/farmer/login" element={<FarmerLogin />} />
        <Route
          path="/farmer"
          element={
            <ProtectedRoute allowedRoles={['farmer']}>
              <FarmerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MyClaims />} />
          <Route path="new-claim" element={<NewClaim />} />
          <Route path="profile" element={<Profile />} />
          <Route path="help" element={<HelpFaq />} />
        </Route>

        {/* ── NGO Portal ── */}
        <Route path="/ngo/login" element={<NGOLogin />} />
        <Route path="/ngo/register" element={<NGORegister />} />
        <Route
          path="/ngo"
          element={
            <ProtectedRoute allowedRoles={['ngo']}>
              <NGOLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<NGODashboard />} />
          <Route path="verifications" element={<MyVerifications />} />
        </Route>

        {/* ── Official Portal ── */}
        <Route path="/official/login" element={<OfficialLogin />} />
        <Route
          path="/official"
          element={
            <ProtectedRoute allowedRoles={['official']}>
              <OfficialLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OfficialDashboard />} />
          <Route path="claims" element={<ClaimsList />} />
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
