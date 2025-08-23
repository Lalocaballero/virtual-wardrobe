import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';

const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, authChecked } = useWardrobeStore();
  const location = useLocation();

  // While the initial authentication check is running, show a loading screen.
  if (!authChecked) {
    return <LoadingSpinner />;
  }

  // After the check, if there's still no user, redirect to login.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // The child components (like Dashboard and UserProfile) are now responsible
  // for fetching their own data and handling their own loading states.
  // This prevents the unmount/remount loop.

  // We are removing the checks for profile, profileLoading, and onboarding
  // from this component to render the children unconditionally once auth is checked.

  return children;
};

export default ProtectedRoute;
