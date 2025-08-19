import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';

const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
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
  if (!authChecked) {
    return <LoadingSpinner />;
  }

  // After the check, if there's still no user, redirect to login.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // While profile is loading, show a full-screen spinner
  if (profileLoading || (user && !profile)) {
    return <LoadingSpinner />;
  }

  // If there's a user but the profile fetch failed (profile is still null), something is wrong.
  // For now, we'll let them sit on a loading screen. A better implementation might show an error.
  if (!profile) {
      return <LoadingSpinner />;
  }

  // Check if user needs to be onboarded.
  // We also check that they are not already on the onboarding page to avoid a redirect loop.
  const needsOnboarding = !profile.age || !profile.gender;
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If user is onboarded but tries to access the onboarding page, redirect them to the dashboard
  if (!needsOnboarding && location.pathname === '/onboarding') {
      return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
