import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useWardrobeStore, { API_BASE } from '../../store/wardrobeStore';

const UserDetails = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchApi, startImpersonation } = useWardrobeStore();

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
            fetchUser();
        } catch (err) {
            alert('Failed to update premium status');
        }
    };

    const handleDeleteUser = async () => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await fetchApi(`${API_BASE}/admin/users/${userId}`, { method: 'DELETE' });
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
        if (window.confirm('This will log you in as this user. Proceed?')) {
            try {
                const { impersonation_token } = await fetchApi(`${API_BASE}/admin/users/${userId}/impersonate`, { method: 'POST' });
                startImpersonation(impersonation_token, user);
                navigate('/dashboard');
            } catch (err) {
                alert('Failed to impersonate user');
            }
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error) return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
        </div>
    );
    
    if (!user) return <div className="text-center p-4">User not found.</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">User Information</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                        <dd className="mt-1 text-sm text-gray-900">{user.display_name || 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                        <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">User ID</dt>
                        <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Location</dt>
                        <dd className="mt-1 text-sm text-gray-900">{user.location || 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                        <dd className="mt-1 text-sm text-gray-900">{new Date(user.created_at).toLocaleDateString()}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1 text-sm text-gray-900 space-x-2">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {user.is_verified ? 'Verified' : 'Not Verified'}
                            </span>
                            {user.is_banned && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Banned</span>}
                            {user.is_suspended && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Suspended</span>}
                        </dd>
                    </div>
                </dl>
            </div>
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Actions</h3>
                <div className="space-y-3">
                    <button onClick={handleImpersonateUser} className="w-full text-white bg-gray-600 hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                        Impersonate User
                    </button>
                    <button onClick={() => handleSetPremium(!user.is_premium)} className={`w-full text-white ${user.is_premium ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} font-medium rounded-lg text-sm px-5 py-2.5 text-center`}>
                        {user.is_premium ? 'Revoke Premium' : 'Grant Premium'}
                    </button>
                    <button onClick={handleSuspendUser} className="w-full text-white bg-yellow-500 hover:bg-yellow-600 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                        Suspend User
                    </button>
                    <button onClick={handleBanUser} className="w-full text-white bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                        Ban User
                    </button>
                    <button onClick={handleDeleteUser} className="w-full text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                        Delete User
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetails;
