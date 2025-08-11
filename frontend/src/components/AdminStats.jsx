import React, { useEffect, useState } from 'react';
import useWardrobeStore from '../../store/wardrobeStore';

const AdminStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchApi } = useWardrobeStore();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await fetchApi('/api/admin/stats');
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

    return (
        <div>
            <h2 className="text-xl font-bold mb-2">Application Stats</h2>
            {stats && (
                <ul>
                    <li>Total Users: {stats.total_users}</li>
                    <li>Total Items: {stats.total_items}</li>
                    <li>Premium Users: {stats.premium_users}</li>
                </ul>
            )}
        </div>
    );
};

export default AdminStats;
