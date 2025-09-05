import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';

const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, authChecked, profile, fetchProfile, profileLoading } = useWardrobeStore();
  const location = useLocation();

  useEffect(() => {
    if (user && !profile) {
      fetchProfile();
    }
  }, [user, profile, fetchProfile]);

  // While the initial authentication check is running, show a loading screen.
  if (!authChecked || (user && profileLoading)) {
    return <LoadingSpinner />;
  }

  // After the check, if there's still no user, redirect to login.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the profile is loaded, check for onboarding status.
  if (profile) {
    if (!profile.has_completed_onboarding && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
    if (profile.has_completed_onboarding && location.pathname === '/onboarding') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
