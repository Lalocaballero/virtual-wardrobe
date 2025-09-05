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
    // A user needs onboarding if the flag is explicitly false, OR if the flag
    // is true (likely a backend default error) but they haven't filled in their display name.
    const needsOnboarding = !profile.has_completed_onboarding || (profile.has_completed_onboarding && !profile.display_name);

    if (needsOnboarding && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
    // If user has completed onboarding, don't let them go back to the onboarding page.
    if (profile.has_completed_onboarding && location.pathname === '/onboarding') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
