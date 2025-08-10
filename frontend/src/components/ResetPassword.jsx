import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loading, error, clearError } = useWardrobeStore();
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    clearError();
    setMessage('');

    // This is a new function we'll need to add to the store
    const result = await useWardrobeStore.getState().resetPassword(token, password);
    
    if (result.success) {
      toast.success(result.message);
      setMessage(result.message);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 text-center">
            <h2 className="mt-6 text-center text-3xl font-extrabold">Invalid Link</h2>
            <p>This password reset link is invalid or has expired.</p>
            <Link to="/forgot-password">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">Reset your password</h2>
          <p className="mt-2 text-center text-sm">
            Enter your new password below.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password">New Password</label>
              <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input id="confirm-password" name="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
              <p>{error}</p>
            </div>
          )}
          
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
              <p>{message}</p>
            </div>
          )}

          <div>
            <button type="submit" disabled={loading || message} className="btn btn-primary w-full">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
