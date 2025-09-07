import React, { useEffect, useState, useCallback } from 'react';
import useWardrobeStore, { API_BASE } from '../../store/wardrobeStore';
import toast from 'react-hot-toast';
import BrandModeration from './BrandModeration';

const ContentModeration = () => {
    const [reportedItems, setReportedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchApi } = useWardrobeStore();

    const fetchReportedContent = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi(`${API_BASE}/admin/content/reported`);
            setReportedItems(data);
        } catch (err) {
            setError(err.message);
            toast.error('Failed to fetch reported content.');
        } finally {
            setLoading(false);
        }
    }, [fetchApi]);

    useEffect(() => {
        fetchReportedContent();
    }, [fetchReportedContent]);

    const handleModerate = async (itemId, action) => {
        try {
            await fetchApi(`${API_BASE}/admin/content/${itemId}/moderate`, {
                method: 'POST',
                body: JSON.stringify({ action }),
            });
            toast.success(`Item has been ${action}.`);
            fetchReportedContent(); // Refresh the list
        } catch (err) {
            toast.error(`Failed to ${action} item.`);
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

    const [activeTab, setActiveTab] = useState('reported');

    return (
        <div className="bg-card dark:bg-dark-subtle p-6 rounded-lg shadow-md">
            <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('reported')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'reported'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Reported Content
                    </button>
                    <button
                        onClick={() => setActiveTab('brands')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'brands'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Brand Submissions
                    </button>
                </nav>
            </div>

            {activeTab === 'reported' && (
                <div>
                    {reportedItems.length === 0 ? (
                        <p>No reported items to review.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-background">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">Item</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">Owner</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">Reports</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">Status</th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card dark:bg-dark-subtle divide-y divide-gray-200">
                                    {reportedItems.map(item => (
                                        <tr key={item.id} className="hover:bg-background">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                                <div className="flex items-center">
                                                    <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-md object-cover mr-4" />
                                                    {item.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate">{item.owner?.email || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate">{item.reported_count}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button onClick={() => handleModerate(item.id, 'approve')} className="text-green-600 hover:text-green-900">Approve</button>
                                                <button onClick={() => handleModerate(item.id, 'reject')} className="text-yellow-600 hover:text-yellow-900">Reject</button>
                                                <button onClick={() => handleModerate(item.id, 'delete')} className="text-destructive hover:text-red-900">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'brands' && (
                <BrandModeration />
            )}
        </div>
    );
};

export default ContentModeration;
