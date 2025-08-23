import React from 'react';
import useWardrobeStore from '../store/wardrobeStore';

const Billing = () => {
    const { profile } = useWardrobeStore();

    if (!profile) {
        return <div>Loading profile...</div>;
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold">Subscription</h2>
                {profile.is_premium ? (
                    <PremiumUserView />
                ) : (
                    <FreeUserView />
                )}
            </div>
        </div>
    );
};

const FreeUserView = () => {
    return (
        <div>
            <p className="mt-4">You are currently on the free plan.</p>
            <p className="mt-2">Upgrade to premium to unlock unlimited AI suggestions, packing lists, and more!</p>
            <a href="https://wewear.lemonsqueezy.com/buy/b57504d5-bc14-4870-aa22-a7196fe68db2" className="btn btn-primary mt-6" target="_blank" rel="noopener noreferrer">
                Upgrade to Premium
            </a>
        </div>
    );
};

const PremiumUserView = () => {
    return (
        <div>
            <p className="mt-4">You are a premium user! ✨</p>
            <p className="mt-2">Thank you for your support. You have access to all premium features.</p>
        </div>
    );
};

export default Billing;