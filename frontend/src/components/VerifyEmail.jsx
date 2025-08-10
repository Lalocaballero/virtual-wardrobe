import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
    const [message, setMessage] = useState('Verifying your email...');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const status = params.get('status');

        if (status === 'verified') {
            setMessage('Email verified successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 3000);
        } else if (status === 'already_verified') {
            setMessage('This email has already been verified. Redirecting to login...');
            setTimeout(() => navigate('/login'), 3000);
        } else if (status === 'invalid_token') {
            setMessage('Invalid or expired token. Please try registering again.');
        } else {
            setMessage('Verifying your email...');
        }
    }, [location, navigate]);

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="p-8 bg-white shadow-md rounded-lg">
                <h2 className="text-2xl font-bold text-center mb-4">Email Verification</h2>
                <p className="text-center text-gray-600">{message}</p>
            </div>
        </div>
    );
};

export default VerifyEmail;
