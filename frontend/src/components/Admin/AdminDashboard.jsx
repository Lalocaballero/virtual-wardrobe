import React from 'react';
import { Link, NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import UserList from './UserList';
import UserDetails from './UserDetails';
import AdminActionLog from './AdminActionLog';
import ContentModeration from './ContentModeration';
import DataExport from './DataExport';
import AnalyticsDashboard from './AnalyticsDashboard';
import SystemHealth from './SystemHealth';

const AdminDashboard = () => {
    const location = useLocation();

    const getTitle = () => {
        const path = location.pathname.split('/')[2] || 'analytics';
        switch (path) {
            case 'analytics':
                return 'Analytics Dashboard';
            case 'health':
                return 'System Health';
            case 'users':
                return 'User Management';
            case 'log':
                return 'Action Log';
            case 'moderation':
                return 'Content Moderation';
            case 'export':
                return 'Data Export';
            default:
                return 'Admin Dashboard';
        }
    };

    const navLinkClasses = "flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md";
    const activeNavLinkClasses = "bg-blue-500 text-white";

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-white shadow-lg">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                </div>
                <nav className="p-4 space-y-2">
                    <NavLink to="/admin/analytics" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <span>📈</span>
                        <span className="ml-3">Analytics</span>
                    </NavLink>
                    <NavLink to="/admin/health" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <span>❤️</span>
                        <span className="ml-3">System Health</span>
                    </NavLink>
                    <NavLink to="/admin/users" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <span>👥</span>
                        <span className="ml-3">Users</span>
                    </NavLink>
                    <NavLink to="/admin/log" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <span>📝</span>
                        <span className="ml-3">Action Log</span>
                    </NavLink>
                    <NavLink to="/admin/moderation" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <span>🛡️</span>
                        <span className="ml-3">Moderation</span>
                    </NavLink>
                    <NavLink to="/admin/export" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <span>💾</span>
                        <span className="ml-3">Data Export</span>
                    </NavLink>
                </nav>
                <div className="mt-auto p-4 border-t">
                    <Link to="/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md">
                        <span>⬅️</span>
                        <span className="ml-3">Back to App</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                <header className="bg-white shadow-md p-4">
                    <h2 className="text-2xl font-semibold text-gray-700">{getTitle()}</h2>
                </header>
                <div className="p-6 overflow-auto bg-gray-50">
                    <Routes>
                        <Route path="/" element={<Navigate to="analytics" replace />} />
                        <Route path="analytics" element={<AnalyticsDashboard />} />
                        <Route path="health" element={<SystemHealth />} />
                        <Route path="users" element={<UserList />} />
                        <Route path="users/:userId" element={<UserDetails />} />
                        <Route path="log" element={<AdminActionLog />} />
                        <Route path="moderation" element={<ContentModeration />} />
                        <Route path="export" element={<DataExport />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
