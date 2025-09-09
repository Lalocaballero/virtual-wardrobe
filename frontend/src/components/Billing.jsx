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
    const { showUpgradeModal, profile } = useWardrobeStore();

    const constructCheckoutUrl = () => {
        if (!profile) return '';
        const productId = process.env.REACT_APP_LEMONSQUEEZY_PRODUCT_ID;
        const baseUrl = `https://wewear.lemonsqueezy.com/checkout/buy/${productId}`;
        const params = new URLSearchParams({
            'checkout[email]': profile.email,
            'checkout_data[custom][user_id]': profile.id,
        });
        return `${baseUrl}?${params.toString()}`;
    };

    const handleUpgradeClick = () => {
        const checkoutUrl = constructCheckoutUrl();
        if (checkoutUrl) {
            showUpgradeModal('billing', {
                ctaText: 'Go Premium',
                checkoutUrl: checkoutUrl,
            });
        }
    };

    return (
        <div className="flex flex-col">
            <div>
                <p className="mt-4">You're on the Free Plan.</p>
                <p className="mt-2">Ready to unlock your wardrobe's full potential? Upgrade to get unlimited AI suggestions, smart packing lists, and more.</p>
            </div>
            <div className="mt-6">
                <button onClick={handleUpgradeClick} className="btn btn-primary">
                    Go Premium
                </button>
            </div>
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