import React, { useEffect, useState } from 'react';
import useWardrobeStore, { API_BASE } from '../../store/wardrobeStore';

const AdminActionLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchApi } = useWardrobeStore();

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await fetchApi(`${API_BASE}/admin/actions/log`);
                setLogs(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [fetchApi]);

    if (loading) return <div>Loading logs...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2 className="text-xl font-bold mb-2">Admin Action Log</h2>
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">Admin</th>
                        <th className="py-2 px-4 border-b">Action</th>
                        <th className="py-2 px-4 border-b">Target User</th>
                        <th className="py-2 px-4 border-b">Details</th>
                        <th className="py-2 px-4 border-b">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id}>
                            <td className="py-2 px-4 border-b">{log.admin_email}</td>
                            <td className="py-2 px-4 border-b">{log.action_type}</td>
                            <td className="py-2 px-4 border-b">{log.target_user_email || 'N/A'}</td>
                            <td className="py-2 px-4 border-b">{log.details}</td>
                            <td className="py-2 px-4 border-b">{new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminActionLog;
