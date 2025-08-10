import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';
import toast from 'react-hot-toast';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', location: '' });
  const [showResend, setShowResend] = useState(false);
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
      result = await register(formData.email, formData.password, formData.location);
      if (result.success) {
        // After successful registration, switch to login view with a message
        setIsLogin(true);
        toast.success('Registration successful! Please check your email to verify your account.');
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">{isLogin ? 'Sign in to your account' : 'Create your account'}</h2>
          <p className="mt-2 text-center text-sm">Virtual Intelligent Wardrobe</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email address</label>
              <input id="email" name="email" type="email" required className="w-full" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium">Password</label>
                {isLogin && <Link to="/forgot-password" className="text-sm font-medium">Forgot password?</Link>}
              </div>
              <input id="password" name="password" type="password" required className="w-full" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
            {!isLogin && (
              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-1">Location (for weather)</label>
                <input id="location" name="location" type="text" placeholder="e.g., New York, NY" className="w-full" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-center">
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