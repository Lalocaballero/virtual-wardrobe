import React from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeOpenIcon } from '@heroicons/react/24/outline';

const CheckEmail = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center bg-card dark:bg-dark-subtle dark:bg-dark-subtle p-10 rounded-xl shadow-lg">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20">
          <EnvelopeOpenIcon className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-foreground dark:text-white">
          Check your email
        </h2>
        <p className="mt-2 text-sm text-slate dark:text-dark-text-secondary">
          We've sent a verification link to the email address you provided. Please check your inbox (and spam folder!) to complete your registration.
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            className="btn btn-primary w-full group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckEmail;
