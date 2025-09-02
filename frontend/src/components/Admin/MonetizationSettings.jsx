import React, { useState, useEffect, useCallback } from 'react';
import useWardrobeStore from '../../store/wardrobeStore';
import toast from 'react-hot-toast';

const MonetizationSettings = () => {
    const [initialSettings, setInitialSettings] = useState({});
    const [currentSettings, setCurrentSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { fetchApi } = useWardrobeStore();

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi('/api/admin/settings');
            setInitialSettings(data);
            setCurrentSettings(data);
        } catch (error) {
            console.error("Failed to fetch settings:", error);
            toast.error("Could not load settings.");
        } finally {
            setLoading(false);
        }
    }, [fetchApi]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleToggle = () => {
        setCurrentSettings(prev => ({
            ...prev,
            monetization_enabled: !prev.monetization_enabled
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const originalSettings = { ...initialSettings };

        try {
            await fetchApi('/api/admin/settings', {
                method: 'POST',
                body: JSON.stringify({ 
                    key: 'monetization_enabled', 
                    value: currentSettings.monetization_enabled 
                }),
            });
            toast.success("Settings saved successfully!");
            // Refetch settings to confirm the new state
            fetchSettings();
        } catch (error) {
            console.error("Failed to update setting:", error);
            toast.error("Failed to save settings. Reverting changes.");
            // Revert to the original state on failure
            setCurrentSettings(originalSettings);
        } finally {
            setIsSaving(false);
        }
    };
    
    const isDirty = initialSettings.monetization_enabled !== currentSettings.monetization_enabled;

    if (loading) {
        return <div>Loading settings...</div>;
    }

    return (
        <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium">Monetization</h3>
            <div className="flex items-center justify-between mt-4">
                <p>Enable or disable monetization features for all users.</p>
                <button
                    onClick={handleToggle}
                    className={`${
                        currentSettings.monetization_enabled ? 'bg-blue-600' : 'bg-muted'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                    <span
                        className={`${
                            currentSettings.monetization_enabled ? 'translate-x-5' : 'translate-x-0'
                        } inline-block h-5 w-5 transform rounded-full bg-card dark:bg-dark-subtle shadow ring-0 transition duration-200 ease-in-out`}
                    />
                </button>
            </div>
            {isDirty && (
                 <div className="mt-4 flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default MonetizationSettings;
