import React, { useState, useEffect } from 'react';
import useWardrobeStore from '../../store/wardrobeStore';

const MonetizationSettings = () => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const { fetchApi } = useWardrobeStore();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await fetchApi('/api/admin/settings');
                setSettings(data);
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [fetchApi]);

    const handleToggle = async () => {
        const newVaule = !settings.monetization_enabled;
        try {
            await fetchApi('/api/admin/settings', {
                method: 'POST',
                body: JSON.stringify({ key: 'monetization_enabled', value: newVaule }),
            });
            setSettings(prev => ({ ...prev, monetization_enabled: newVaule }));
        } catch (error) {
            console.error("Failed to update setting:", error);
        }
    };

    if (loading) {
        return <div>Loading settings...</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium">Monetization</h3>
            <div className="flex items-center justify-between mt-4">
                <p>Enable or disable monetization features for all users.</p>
                <button
                    onClick={handleToggle}
                    className={`${
                        settings.monetization_enabled ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                    <span
                        className={`${
                            settings.monetization_enabled ? 'translate-x-5' : 'translate-x-0'
                        } inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                </button>
            </div>
        </div>
    );
};

export default MonetizationSettings;
