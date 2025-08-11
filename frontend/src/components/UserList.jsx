import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useWardrobeStore from '../../store/wardrobeStore';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchApi } = useWardrobeStore();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await fetchApi('/api/admin/users');
                setUsers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [fetchApi]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2 className="text-xl font-bold mb-2">Users</h2>
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2">ID</th>
                        <th className="py-2">Email</th>
                        <th className="py-2">Admin</th>
                        <th className="py-2">Premium</th>
                        <th className="py-2">Verified</th>
                        <th className="py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td className="border px-4 py-2">{user.id}</td>
                            <td className="border px-4 py-2">{user.email}</td>
                            <td className="border px-4 py-2">{user.is_admin ? 'Yes' : 'No'}</td>
                            <td className="border px-4 py-2">{user.is_premium ? 'Yes' : 'No'}</td>
                            <td className="border px-4 py-2">{user.is_verified ? 'Yes' : 'No'}</td>
                            <td className="border px-4 py-2">
                                <Link to={`/admin/users/${user.id}`} className="text-blue-500">View</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserList;
