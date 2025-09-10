import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';
import toast from 'react-hot-toast';

// A simple, on-brand spinner component using WeWear's Electric Indigo color
const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin" style={{ borderColor: '#6F00FF' }}></div>
  </div>
);

const WelcomePremium = () => {
  const [status, setStatus] = useState('polling'); // 'polling', 'timedOut', or 'success'
  const navigate = useNavigate();
  const { fetchApi, fetchProfile } = useWardrobeStore();

  useEffect(() => {
    if (status !== 'polling') return;

    const toastId = toast.loading('Finalizing your premium access...');

    const pollingInterval = setInterval(async () => {
      try {
        // Poll the new, lightweight endpoint that checks for the webhook's "flag"
        const data = await fetchApi('/profile/check-premium-event');
        
        // The endpoint will return 'ready' once the webhook has successfully run
        if (data.status === 'ready') {
          toast.success('All set! Your premium perks are active.', { id: toastId });
          clearInterval(pollingInterval);
          
          // Refresh the main user profile in the store to get all the latest details
          await fetchProfile();
          setStatus('success');
          
          // Redirect to the dashboard
          setTimeout(() => navigate('/dashboard'), 1500);
        }
        // If the status is 'pending', the interval will simply continue checking.
      } catch (error) {
        // This catch block will handle network errors or if the API returns a non-2xx status
        console.error("Error polling for event status:", error);
        // We can let the timeout handle the user-facing message
      }
    }, 3000); // Check for the flag every 3 seconds

    const timeout = setTimeout(() => {
      if (status === 'polling') {
        toast.error('Still working on it... This is taking longer than usual.', { id: toastId, duration: 6000 });
        clearInterval(pollingInterval);
        setStatus('timedOut');
      }
    }, 90000); // Stop polling after 90 seconds

    // Cleanup function to clear intervals and timeouts if the user navigates away
    return () => {
      clearInterval(pollingInterval);
      clearTimeout(timeout);
    };
  }, [status, navigate, fetchApi, fetchProfile]);

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
