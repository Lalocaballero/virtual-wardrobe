import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin" style={{ borderColor: '#6F00FF' }}></div>
  </div>
);

const WelcomePremium = () => {
  const [status, setStatus] = useState('polling'); // 'polling', 'timedOut', or 'success'
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Establish a persistent connection to our new SSE endpoint.
    const eventSource = new EventSource('/api/profile/premium-status-stream', { withCredentials: true });

    // 2. Define what to do when a message is received from the server.
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === 'success' && data.is_premium) {
        setStatus('success');
        eventSource.close(); // Close the connection
        setTimeout(() => navigate('/dashboard'), 2000); // Redirect to the dashboard
      } else if (data.status === 'timeout') {
        setStatus('timedOut');
        eventSource.close();
      }
    };

    // 3. Handle any connection errors.
    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      setStatus('timedOut');
      eventSource.close();
    };

    // 4. Clean up the connection when the component is no longer on screen.
    return () => {
      eventSource.close();
    };
  }, [navigate]); // This effect runs only once when the component mounts.

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