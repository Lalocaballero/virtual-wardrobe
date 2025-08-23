import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import useWardrobeStore from '../store/wardrobeStore';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const Billing = () => {
    const { profile } = useWardrobeStore();

    if (!profile) {
        return <div>Loading profile...</div>;
    }

    return (
        <Elements stripe={stripePromise}>
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
        </Elements>
    );
};

const FreeUserView = () => {
    const { fetchApi } = useWardrobeStore();

    const handleUpgrade = async () => {
        try {
            const { id: sessionId } = await fetchApi('/api/billing/create-checkout-session', {
                method: 'POST',
                body: JSON.stringify({
                    // Pass the current page URL to Stripe so it can redirect back correctly
                    success_url: window.location.href,
                    cancel_url: window.location.href,
                }),
            });

            const stripe = await stripePromise;
            const { error } = await stripe.redirectToCheckout({ sessionId });

            if (error) {
                console.error("Stripe checkout error:", error);
            }
        } catch (error) {
            console.error("Failed to create checkout session:", error);
        }
    };

    return (
        <div>
            <p className="mt-4">You are currently on the free plan.</p>
            <p className="mt-2">Upgrade to premium to unlock unlimited AI suggestions, packing lists, and more!</p>
            <button onClick={handleUpgrade} className="btn btn-primary mt-4">Upgrade to Premium</button>
        </div>
    );
};

// --- UPDATED COMPONENT ---
const PremiumUserView = () => {
    const { manageSubscription } = useWardrobeStore();

    const handleManageSubscription = () => {
        manageSubscription();
    };

    return (
        <div>
            <p className="mt-4">You are a premium user! ✨</p>
            <p className="mt-2">Thank you for your support. You can manage your subscription and billing details below.</p>
            <button onClick={handleManageSubscription} className="btn btn-secondary mt-4">
                Manage Subscription
            </button>
        </div>
    );
};

export default Billing;