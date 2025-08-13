import React from 'react';
import { useNavigate } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';

const ImpersonationBanner = () => {
    const { isImpersonating, user, stopImpersonation } = useWardrobeStore();
    const navigate = useNavigate();

    const handleExit = async () => {
        await stopImpersonation();
        navigate('/admin');
    };

    if (!isImpersonating) {
        return null;
    }

    return (
        <div className="bg-yellow-400 text-black p-2 text-center fixed top-0 left-0 right-0 z-50">
            <span>
                You are currently impersonating <strong>{user?.email}</strong>.
            </span>
            <button
                onClick={handleExit}
                className="ml-4 bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 transition-colors"
            >
                Exit Impersonation
            </button>
        </div>
    );
};

export default ImpersonationBanner;
