import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';

// A simple, on-brand spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin" style={{ borderColor: '#6F00FF' }}></div>
  </div>
);

const WelcomePremium = () => {
  const [status, setStatus] = useState('polling'); // 'polling' or 'timedOut' or 'success'
  const navigate = useNavigate();
  const { fetchApi } = useWardrobeStore();

  useEffect(() => {
    // Don't start polling if the component isn't in the polling state
    if (status !== 'polling') return;

    const pollingInterval = setInterval(async () => {
      try {
        // I'm using the adjusted URL based on my findings in the previous step
        const data = await fetchApi('/profile/status', { cache: 'no-cache' });
        if (data.is_premium) {
          clearInterval(pollingInterval);
          setStatus('success');
          // Redirect after a short delay to let the user see the success message
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      } catch (error) {
        console.error("Error polling for user status:", error);
        // Optional: Implement a retry limit or stop on certain errors
      }
    }, 5000); // Poll every 5 seconds

    const timeout = setTimeout(() => {
      // Only set to timedOut if we are still in the polling state
      if (status === 'polling') {
        clearInterval(pollingInterval);
        setStatus('timedOut');
      }
    }, 90000); // 90 seconds timeout

    // Cleanup function to clear intervals and timeouts when the component unmounts
    return () => {
      clearInterval(pollingInterval);
      clearTimeout(timeout);
    };
  }, [status, navigate, fetchApi]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-center p-4">
      <div className="max-w-md w-full">
        {status === 'polling' && (
          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white font-poppins mb-4">
              Welcome to the Club!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-inter mb-8">
              We're unlocking your new premium features now.
            </p>
            <LoadingSpinner />
          </div>
        )}
        
        {status === 'success' && (
            <div>
                <h1 className="text-4xl font-bold text-green-500 font-poppins mb-4">
                    All Set!
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 font-inter">
                    Your premium features are unlocked. Redirecting you now...
                </p>
            </div>
        )}

        {status === 'timedOut' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white font-poppins mb-4">
              Just a moment longer...
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300 font-inter mb-8">
              It looks like your account is taking a little extra time to update. No worries! Your premium status is confirmed. Please try refreshing this page, or head to your dashboard. If you still don't see your new features, our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <button onClick={handleRefresh} className="btn btn-primary">
                Refresh Page
              </button>
              <a href="mailto:support@wewear.app" className="btn btn-secondary">
                Contact Support
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomePremium;
