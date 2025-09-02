import React, { useEffect, useState } from 'react';
import useWardrobeStore, { API_BASE } from '../../store/wardrobeStore';

const HealthCheckItem = ({ name, status }) => {
    const isOk = status === 'ok';
    const details = typeof status === 'string' && !isOk ? status.replace('error: ', '') : null;

    return (
        <div className="bg-background/80 border border-fog/80 p-4 rounded-xl flex justify-between items-center transition-all hover:border-fog">
            <p className="text-lg font-medium text-gray-800">{name}</p>
            <div className="flex items-center">
                <div className={`h-3 w-3 rounded-full mr-3 ${isOk ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <p className={`text-md font-semibold ${isOk ? 'text-green-700' : 'text-red-700'}`}>
                    {isOk ? 'Operational' : 'Error'}
                </p>
                {details && <p className="text-sm text-slate ml-2 truncate" title={details}>({details})</p>}
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon }) => (
    <div className="bg-background/80 border border-fog/80 p-4 rounded-xl flex items-center">
        <div className="p-3 rounded-lg mr-4 bg-muted">
            <span className="text-xl">{icon}</span>
        </div>
        <div>
            <p className="text-md text-slate">{title}</p>
            <p className="text-2xl font-semibold text-foreground">{value}</p>
        </div>
    </div>
);


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
        <div className="bg-destructive/10 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
        </div>
    );
    
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-card dark:bg-dark-subtle/60 backdrop-blur-xl border border-fog/50 p-8 rounded-2xl shadow-sm">
                <h3 className="text-2xl font-semibold mb-2 text-gray-800">System Health</h3>
                <p className="text-sm text-slate mb-6">
                    Last checked: {healthData && new Date(healthData.timestamp).toLocaleString()}
                </p>
                
                {healthData && healthData.database_stats && !healthData.database_stats.error && (
                    <>
                        <h4 className="text-xl font-semibold mb-4 text-inkwell">Database Stats</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <StatCard title="Total Users" value={healthData.database_stats.users} icon="👥" />
                            <StatCard title="Total Items" value={healthData.database_stats.items} icon="👕" />
                            <StatCard title="Total Outfits" value={healthData.database_stats.outfits} icon="👗" />
                        </div>
                    </>
                )}

                <h4 className="text-xl font-semibold mb-4 text-inkwell">Service Status</h4>
                <div className="space-y-4">
                    {healthData && healthData.services && Object.entries(healthData.services).map(([service, status]) => (
                        <HealthCheckItem 
                            key={service} 
                            name={service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                            status={status} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SystemHealth;
