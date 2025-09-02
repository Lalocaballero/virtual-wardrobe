import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';
import toast from 'react-hot-toast';
import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', location: '' });
  const [showResend, setShowResend] = useState(false);
  const locationInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useGooglePlacesAutocomplete(locationInputRef, handleChange);
  const [searchParams] = useSearchParams();
  
  const { login, register, resendVerificationEmail, loading, error, clearError } = useWardrobeStore();

  useEffect(() => {
    // Show toast messages based on URL params from email links
    if (searchParams.get('verified') === 'true') {
      toast.success("Email verified successfully! Please log in.");
    }
    if (searchParams.get('error') === 'invalid_token') {
      toast.error("That verification link is invalid or has expired.");
    }
    if (searchParams.get('message') === 'already_verified') {
      toast("Your email has already been verified.");
    }
  }, [searchParams]);

  const handleFormSwitch = () => {
    setIsLogin(!isLogin);
    clearError();
    setShowResend(false);
    setFormData({ email: '', password: '', location: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowResend(false);
    clearError();

    let result;
    if (isLogin) {
      result = await login(formData.email, formData.password);
    } else {
      // Read location directly from the ref to capture the autocompleted value
      const location = locationInputRef.current ? locationInputRef.current.value : formData.location;
      result = await register(formData.email, formData.password, location);
      if (result.success) {
        // After successful registration, redirect to a page telling them to check their email.
        navigate('/check-email');
      }
    }

    if (result?.code === 'EMAIL_NOT_VERIFIED') {
      setShowResend(true);
    }
  };
  
  const handleResend = async () => {
    await resendVerificationEmail(formData.email);
    setShowResend(false); // Hide button after click to prevent spam
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cloud-white dark:bg-midnight-ink">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">{isLogin ? 'Sign in to your account' : 'Create your account'}</h2>
          <p className="mt-2 text-center text-sm">Virtual Intelligent Wardrobe</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email address</label>
              <input id="email" name="email" type="email" required className="w-full" value={formData.email} onChange={handleChange} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium">Password</label>
                {isLogin && <Link to="/forgot-password" className="text-sm font-medium">Forgot password?</Link>}
              </div>
              <input id="password" name="password" type="password" required className="w-full" value={formData.password} onChange={handleChange} />
            </div>
            {!isLogin && (
              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-1">Location (for weather)</label>
                <input ref={locationInputRef} id="location" name="location" type="text" placeholder="e.g., New York, NY" className="w-full" defaultValue={formData.location} onChange={handleChange} />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/50 text-destructive dark:text-destructive px-4 py-3 rounded-lg text-center">
              <p>{error}</p>
              {showResend && (
                <button type="button" onClick={handleResend} className="mt-2 text-sm font-bold underline">
                  Resend verification email
                </button>
              )}
            </div>
          )}

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center btn btn-primary">
              {loading ? 'Please wait...' : (isLogin ? 'Sign in' : 'Sign up')}
            </button>
          </div>
          <div className="text-center">
            <button type="button" onClick={handleFormSwitch} className="font-medium">
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;