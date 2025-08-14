import React, { useEffect, useState } from 'react';
import useWardrobeStore, { API_BASE } from '../../store/wardrobeStore';

const HealthCheckItem = ({ name, status }) => {
    const isOk = status === 'ok';
    const details = typeof status === 'string' && !isOk ? status.replace('error: ', '') : null;

    return (
        <div className="bg-gray-50/80 border border-gray-200/80 p-4 rounded-xl flex justify-between items-center transition-all hover:border-gray-300">
            <p className="text-lg font-medium text-gray-800">{name}</p>
            <div className="flex items-center">
                <div className={`h-3 w-3 rounded-full mr-3 ${isOk ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <p className={`text-md font-semibold ${isOk ? 'text-green-700' : 'text-red-700'}`}>
                    {isOk ? 'Operational' : 'Error'}
                </p>
                {details && <p className="text-sm text-gray-500 ml-2 truncate">({details})</p>}
            </div>
        </div>
    );
};

const SystemHealth = () => {
    const [healthData, setHealthData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchApi } = useWardrobeStore();

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const data = await fetchApi(`${API_BASE}/admin/system/health`);
                setHealthData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchHealth();
    }, [fetchApi]);

    if (loading) return (
        <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error) return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
        </div>
    );
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white/60 backdrop-blur-xl border border-gray-200/50 p-8 rounded-2xl shadow-sm">
                <h3 className="text-2xl font-semibold mb-2 text-gray-800">System Health</h3>
                <p className="text-sm text-gray-500 mb-8">
                    Last checked: {healthData && new Date(healthData.timestamp).toLocaleString()}
                </p>
                <div className="space-y-4">
                    {healthData && healthData.services && Object.entries(healthData.services).map(([service, status]) => (
                        <HealthCheckItem 
                            key={service} 
                            name={service.charAt(0).toUpperCase() + service.slice(1)} 
                            status={status} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SystemHealth;
