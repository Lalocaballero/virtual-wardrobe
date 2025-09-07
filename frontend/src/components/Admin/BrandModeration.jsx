import React, { useEffect, useState, useCallback } from 'react';
import useWardrobeStore, { API_BASE } from '../../store/wardrobeStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const BrandModeration = () => {
    const [pendingBrands, setPendingBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchApi } = useWardrobeStore();

    const fetchPendingBrands = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi(`${API_BASE}/admin/brands/pending`);
            setPendingBrands(data);
        } catch (err) {
            setError(err.message);
            toast.error('Failed to fetch pending brands.');
        } finally {
            setLoading(false);
        }
    }, [fetchApi]);

    useEffect(() => {
        fetchPendingBrands();
    }, [fetchPendingBrands]);

    const handleApprove = async (brandId) => {
        try {
            await fetchApi(`${API_BASE}/admin/brands/${brandId}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_approved: true }),
            });
            toast.success('Brand approved successfully.');
            fetchPendingBrands(); // Refresh the list
        } catch (err) {
            toast.error('Failed to approve brand.');
        }
    };

    const handleReject = async (brandId) => {
        if (window.confirm('Are you sure you want to reject and delete this brand submission?')) {
            try {
                await fetchApi(`${API_BASE}/admin/brands/${brandId}`, {
                    method: 'DELETE',
                });
                toast.success('Brand submission rejected.');
                fetchPendingBrands(); // Refresh the list
            } catch (err) {
                toast.error('Failed to reject brand.');
            }
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error) return (
        <div className="bg-destructive/10 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
        </div>
    );

    return (
        <div>
            {pendingBrands.length === 0 ? (
                <p>No new brand submissions to review.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-background">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">Brand Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">Submitted At</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card dark:bg-dark-subtle divide-y divide-gray-200">
                            {pendingBrands.map(brand => (
                                <tr key={brand.id} className="hover:bg-background">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{brand.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate">
                                        {format(new Date(brand.created_at), 'PPP p')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleApprove(brand.id)} className="text-green-600 hover:text-green-900">Approve</button>
                                        <button onClick={() => handleReject(brand.id)} className="text-destructive hover:text-red-900">Reject</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default BrandModeration;
