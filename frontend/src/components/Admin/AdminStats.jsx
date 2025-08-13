import React, { useEffect, useState } from 'react';
import useWardrobeStore, { API_BASE } from '../../store/wardrobeStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchApi } = useWardrobeStore();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await fetchApi(`${API_BASE}/admin/stats`);
                setStats(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [fetchApi]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    const chartData = stats ? [
        { name: 'Total Users', count: stats.total_users },
        { name: 'Total Items', count: stats.total_items },
        { name: 'Premium Users', count: stats.premium_users },
    ] : [];

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Application Stats</h2>
            {stats && (
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 5, right: 30, left: 20, bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#8884d8" name="Count" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default AdminStats;
