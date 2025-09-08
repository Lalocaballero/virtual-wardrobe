import React from 'react';
import useWardrobeStore from '../store/wardrobeStore';

const Billing = () => {
    const { profile } = useWardrobeStore();

    if (!profile) {
        return <div>Loading profile...</div>;
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle p-6 rounded-lg shadow-sm border border-fog dark:border-inkwell">
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
            <p className="mt-4">You're on the Free Plan.</p>
            <p className="mt-2">Ready to unlock your wardrobe's full potential? Upgrade to get unlimited AI suggestions, smart packing lists, and more.</p>
            <a href="https://wewear.lemonsqueezy.com/buy/b57504d5-bc14-4870-aa22-a7196fe68db2" className="btn btn-primary mt-8" target="_blank" rel="noopener noreferrer">
                Go Premium
            </a>
        </div>
    );
};

const PremiumUserView = () => {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleManageSubscription = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/billing/create-portal-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to create portal session');
            }
            const data = await response.json();
            window.location.href = data.url;
        } catch (error) {
            console.error('Error managing subscription:', error);
            // You might want to show an error message to the user
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <p className="mt-4">You're a Premium Member! ✨</p>
            <p className="mt-2">Manage your subscription, view invoices, or update your payment details at any time.</p>
            <button 
                onClick={handleManageSubscription}
                className="btn btn-secondary mt-6"
                disabled={isLoading}
            >
                {isLoading ? 'Redirecting...' : 'Manage Billing'}
            </button>
        </div>
    );
};

export default Billing;