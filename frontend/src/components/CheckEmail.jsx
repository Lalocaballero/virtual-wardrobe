import React from 'react';
import { Link } from 'react-router-dom';
import hangerSparkIcon from '../assets/hanger-spark.png';

const CheckEmail = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center bg-card dark:bg-dark-subtle p-10 rounded-xl shadow-lg">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-electric-indigo/10">
          <img src={hangerSparkIcon} alt="Smart Hanger with Spark" className="h-8 w-8" style={{ filter: 'hue-rotate(250deg) saturate(5)' }} />
        </div>
        <h2 className="mt-6 text-3xl font-poppins font-bold text-foreground dark:text-white">
          Check Your Inbox.
        </h2>
        <p className="mt-2 text-sm font-inter text-slate dark:text-dark-text-secondary">
          Just one more click. We’ve sent a magic link to your email to complete your registration. (Don't forget to check spam!)
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            className="btn w-full bg-transparent border border-midnight-ink text-midnight-ink hover:bg-midnight-ink hover:text-white dark:border-cloud-white dark:text-cloud-white dark:hover:bg-cloud-white dark:hover:text-midnight-ink"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckEmail;
