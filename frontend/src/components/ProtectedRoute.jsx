import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error in ProtectedRoute checkUser', err);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <p className="mt-4 text-sm text-text-secondary">Authenticating session...</p>
      </div>
    );
  }

  if (!user) {
    // If accessing sub-routes, redirect to the role-specific login page
    if (location.pathname.startsWith('/farmer')) {
      return <Navigate to="/farmer/login" replace />;
    }
    if (location.pathname.startsWith('/ngo')) {
      return <Navigate to="/ngo/login" replace />;
    }
    if (location.pathname.startsWith('/official')) {
      return <Navigate to="/official/login" replace />;
    }
    return <Navigate to="/" replace />;
  }

  const userRole = user.user_metadata?.role || localStorage.getItem('role');

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Role mismatch, redirect to landing or appropriate portal
    if (userRole === 'farmer') return <Navigate to="/farmer" replace />;
    if (userRole === 'ngo') return <Navigate to="/ngo" replace />;
    if (userRole === 'official') return <Navigate to="/official" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
