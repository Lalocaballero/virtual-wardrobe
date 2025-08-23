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
    // The Lemon Squeezy checkout link
    const lemonSqueezyCheckoutLink = 'https://wewear.lemonsqueezy.com/buy/b57504d5-bc14-4870-aa22-a7196fe68db2';

    return (
        // Added a container div for better structure
        <div className="mt-4"> 
            <p>You are currently on the free plan.</p>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Upgrade to premium to unlock unlimited AI suggestions, packing lists, and more!</p>
            
            {/* The button is now a link with more top margin (mt-6) */}
            <a href={lemonSqueezyCheckoutLink} className="btn btn-primary mt-6 inline-block">
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