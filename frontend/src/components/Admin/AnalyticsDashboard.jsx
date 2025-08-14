import React, { useEffect, useState } from 'react';
import useWardrobeStore, { API_BASE } from '../../store/wardrobeStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Apple-inspired StatCard with better styling
const StatCard = ({ title, value, icon, prefix = '', suffix = '' }) => (
    <div className="bg-white/60 backdrop-blur-xl border border-gray-200/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center">
            <div className="bg-gray-100 p-3 rounded-lg mr-4">
                <span className="text-2xl">{icon}</span>
            </div>
            <div>
                <p className="text-md text-gray-600">{title}</p>
                <p className="text-3xl font-semibold text-gray-900">{prefix}{value}{suffix}</p>
            </div>
        </div>
    </div>
);

// Custom Tooltip for the chart
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 backdrop-blur-md p-3 rounded-lg shadow-lg border border-gray-200/50">
                <p className="text-sm text-gray-600">{`Date: ${label}`}</p>
                <p className="text-md font-bold text-blue-600">{`Active Users: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};


const AnalyticsDashboard = () => {
    const [dauData, setDauData] = useState([]);
    const [mrrData, setMrrData] = useState(null);
    const [conversionData, setConversionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterDays, setFilterDays] = useState(30);
    const { fetchApi } = useWardrobeStore();

    useEffect(() => {
        const fetchAllAnalytics = async () => {
            setLoading(true);
            try {
                // Fetch all data points again when filter changes.
                // These are lightweight queries and this simplifies state management.
                const [dau, mrr, conversion] = await Promise.all([
                    fetchApi(`${API_BASE}/admin/analytics/daily_active_users?days=${filterDays}`),
                    fetchApi(`${API_BASE}/admin/analytics/mrr`),
                    fetchApi(`${API_BASE}/admin/analytics/premium_conversion_rate`)
                ]);
                setDauData(dau);
                setMrrData(mrr);
                setConversionData(conversion);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAllAnalytics();
    }, [fetchApi, filterDays]);

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
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mrrData && <StatCard title="Monthly Recurring Revenue" value={mrrData.mrr} prefix="$" icon="💰" />}
                {conversionData && <StatCard title="Premium Conversion Rate" value={conversionData.rate} suffix="%" icon="🚀" />}
                {mrrData && <StatCard title="Premium Subscribers" value={mrrData.premium_users} icon="⭐" />}
            </div>
            <div className="bg-white/60 backdrop-blur-xl border border-gray-200/50 p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Daily Active Users (Last {filterDays} Days)</h3>
                    <div className="flex space-x-2">
                        {[7, 30, 90].map(days => (
                            <button
                                key={days}
                                onClick={() => setFilterDays(days)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                    filterDays === days
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {days} Days
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                        <AreaChart data={dauData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="date" tick={{ fill: '#6b7280' }} />
                            <YAxis tick={{ fill: '#6b7280' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="active_users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUv)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
