import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const { forgotPassword, loading, error, clearError } = useWardrobeStore();
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setMessage('');
    const result = await forgotPassword(email);
    if (result.success) {
      toast.success(result.message);
      setMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">Forgot your password?</h2>
          <p className="mt-2 text-center text-sm">
            Enter your email address and we'll send you a link to reset it.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email address</label>
              <input id="email" name="email" type="email" required className="w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 dark:bg-red-900/50 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-center">
              <p>{error}</p>
            </div>
          )}
          
          {message && (
            <div className="bg-green-100 dark:bg-green-900/50 border border-green-400 dark:border-green-500/50 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-center">
              <p>{message}</p>
            </div>
          )}

          <div>
            <button type="submit" disabled={loading || message} className="group relative w-full flex justify-center btn btn-primary">
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </div>
          <div className="text-center">
            <Link to="/login" className="font-medium">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
