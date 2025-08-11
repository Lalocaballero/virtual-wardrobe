import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useWardrobeStore from '../../store/wardrobeStore';

const UserDetails = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchApi } = useWardrobeStore();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await fetchApi(`/api/admin/users/${userId}`);
                setUser(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [userId, fetchApi]);

    const handleSetPremium = async (isPremium) => {
        try {
            await fetchApi(`/api/admin/users/${userId}/set-premium`, {
                method: 'POST',
                body: JSON.stringify({ is_premium: isPremium }),
            });
            setUser({ ...user, is_premium: isPremium });
        } catch (err) {
            alert('Failed to update premium status');
        }
    };

    const handleDeleteUser = async () => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await fetchApi(`/api/admin/users/${userId}`, {
                    method: 'DELETE',
                });
                navigate('/admin/users');
            } catch (err) {
                alert('Failed to delete user');
            }
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!user) return <div>User not found.</div>;

    return (
        <div>
            <h2 className="text-xl font-bold mb-2">User Details</h2>
            <ul>
                <li><strong>ID:</strong> {user.id}</li>
                <li><strong>Email:</strong> {user.email}</li>
                <li><strong>Admin:</strong> {user.is_admin ? 'Yes' : 'No'}</li>
                <li><strong>Premium:</strong> {user.is_premium ? 'Yes' : 'No'}</li>
                <li><strong>Verified:</strong> {user.is_verified ? 'Yes' : 'No'}</li>
                <li><strong>Created At:</strong> {new Date(user.created_at).toLocaleString()}</li>
                <li><strong>Location:</strong> {user.location}</li>
                <li><strong>Display Name:</strong> {user.display_name}</li>
            </ul>
            <div className="mt-4">
                <button onClick={() => handleSetPremium(!user.is_premium)} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
                    {user.is_premium ? 'Revoke Premium' : 'Grant Premium'}
                </button>
                <button onClick={handleDeleteUser} className="bg-red-500 text-white px-4 py-2 rounded">
                    Delete User
                </button>
            </div>
        </div>
    );
};

export default UserDetails;
