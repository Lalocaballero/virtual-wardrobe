import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useWardrobeStore, { API_BASE } from '../../store/wardrobeStore';

const UserDetails = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchApi } = useWardrobeStore();

    const fetchUser = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi(`${API_BASE}/admin/users/${userId}`);
            setUser(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId, fetchApi]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleSetPremium = async (isPremium) => {
        try {
            await fetchApi(`${API_BASE}/admin/users/${userId}/set-premium`, {
                method: 'POST',
                body: JSON.stringify({ is_premium: isPremium }),
            });
            fetchUser(); // Refetch to get latest user state
        } catch (err) {
            alert('Failed to update premium status');
        }
    };

    const handleDeleteUser = async () => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await fetchApi(`${API_BASE}/admin/users/${userId}`, {
                    method: 'DELETE',
                });
                navigate('/admin/users');
            } catch (err) {
                alert('Failed to delete user');
            }
        }
    };

    const handleSuspendUser = async () => {
        const duration = prompt("Enter suspension duration in days:", "7");
        if (duration) {
            const reason = prompt("Enter reason for suspension:", "");
            try {
                await fetchApi(`${API_BASE}/admin/users/${userId}/suspend`, {
                    method: 'POST',
                    body: JSON.stringify({ duration: parseInt(duration, 10), reason }),
                });
                fetchUser();
            } catch (err) {
                alert('Failed to suspend user');
            }
        }
    };

    const handleBanUser = async () => {
        const reason = prompt("Enter reason for banning the user:", "");
        if (reason && window.confirm('Are you sure you want to permanently ban this user?')) {
            try {
                await fetchApi(`${API_BASE}/admin/users/${userId}/ban`, {
                    method: 'POST',
                    body: JSON.stringify({ reason }),
                });
                fetchUser();
            } catch (err) {
                alert('Failed to ban user');
            }
        }
    };

    const handleImpersonateUser = async () => {
        if (window.confirm('This will log you in as this user for 5 minutes. Proceed?')) {
            try {
                const { impersonation_token } = await fetchApi(`${API_BASE}/admin/users/${userId}/impersonate`, {
                    method: 'POST',
                });
                alert(`Impersonation successful. You can now use this token: ${impersonation_token}`);
                // In a real app, you'd store this token and use it for API requests.
            } catch (err) {
                alert('Failed to impersonate user');
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
                <li><strong>Banned:</strong> {user.is_banned ? 'Yes' : 'No'}</li>
                <li><strong>Suspended:</strong> {user.is_suspended ? `Yes, until ${new Date(user.suspension_end_date).toLocaleString()}` : 'No'}</li>
                <li><strong>Created At:</strong> {new Date(user.created_at).toLocaleString()}</li>
                <li><strong>Location:</strong> {user.location}</li>
                <li><strong>Display Name:</strong> {user.display_name}</li>
            </ul>
            <div className="mt-4 space-x-2">
                <button onClick={() => handleSetPremium(!user.is_premium)} className="bg-blue-500 text-white px-4 py-2 rounded">
                    {user.is_premium ? 'Revoke Premium' : 'Grant Premium'}
                </button>
                <button onClick={handleDeleteUser} className="bg-red-700 text-white px-4 py-2 rounded">
                    Delete User
                </button>
                <button onClick={handleSuspendUser} className="bg-yellow-500 text-white px-4 py-2 rounded">
                    Suspend User
                </button>
                <button onClick={handleBanUser} className="bg-orange-700 text-white px-4 py-2 rounded">
                    Ban User
                </button>
                <button onClick={handleImpersonateUser} className="bg-gray-500 text-white px-4 py-2 rounded">
                    Impersonate User
                </button>
            </div>
        </div>
    );
};

export default UserDetails;
