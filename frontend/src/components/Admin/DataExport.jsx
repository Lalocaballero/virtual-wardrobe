import React, { useState } from 'react';
import { API_BASE } from '../../store/wardrobeStore';
import toast from 'react-hot-toast';

const DataExport = () => {
    const [dataType, setDataType] = useState('users');
    const [format, setFormat] = useState('json');
    const [loading, setLoading] = useState(false);

    const handleExport = () => {
        setLoading(true);
        toast.loading('Generating your export...');

        const exportUrl = `${API_BASE}/admin/data/export?data_type=${dataType}&format=${format}`;
        
        window.open(exportUrl, '_blank');

        setTimeout(() => {
            setLoading(false);
            toast.dismiss();
            toast.success('Your download should begin shortly.');
        }, 2000);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Export Data</h3>
                <div className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="data_type" className="block text-sm font-medium text-gray-700">
                            Data Type
                        </label>
                        <select
                            id="data_type"
                            name="data_type"
                            value={dataType}
                            onChange={(e) => setDataType(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="users">Users</option>
                            <option value="content">Content</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="format" className="block text-sm font-medium text-gray-700">
                            Format
                        </label>
                        <select
                            id="format"
                            name="format"
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="json">JSON</option>
                            <option value="csv">CSV</option>
                        </select>
                    </div>
                    <div>
                        <button
                            onClick={handleExport}
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                        >
                            {loading ? 'Generating...' : 'Download Export'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataExport;
