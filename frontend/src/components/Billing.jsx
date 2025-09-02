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
            <p className="mt-4">You are currently on the free plan.</p>
            <p className="mt-2">Upgrade to premium to unlock unlimited AI suggestions, packing lists, and more!</p>
            <a href="https://wewear.lemonsqueezy.com/buy/b57504d5-bc14-4870-aa22-a7196fe68db2" className="btn btn-primary mt-6" target="_blank" rel="noopener noreferrer">
                Upgrade to Premium
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
            <p className="mt-4">You are a premium user! ✨</p>
            <p className="mt-2">Thank you for your support. You can manage your subscription and billing details through our secure payment portal.</p>
            <button 
                onClick={handleManageSubscription}
                className="btn btn-secondary mt-6"
                disabled={isLoading}
            >
                {isLoading ? 'Redirecting...' : 'Manage Subscription'}
            </button>
        </div>
    );
};

export default Billing;